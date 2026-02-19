const Job = require("../models/Job");
const mongoose = require("mongoose");
const axios = require("axios");
const cheerio = require("cheerio");

const ALLOWED_SORT_FIELDS = ["createdAt", "appliedDate", "companyName", "role", "status"];
const ALLOWED_SORT_ORDERS = ["asc", "desc"];
const ALLOWED_STATUSES = ["Saved", "Applied", "Interview", "Rejected", "Offer"];

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeLocation = (value) => {
  if (typeof value !== "string") return value;
  return value.trim().replace(/\s+/g, " ");
};

const cleanHtmlText = (value = "") =>
  String(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();

const smartTrim = (value, max = 120) => {
  const text = cleanHtmlText(value || "");
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
};

const normalizeRoleText = (value = "") => {
  const raw = cleanHtmlText(value);
  if (!raw) return "";

  const stripped = raw
    .replace(/\b(apply now|careers?|jobs?|job openings?)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const parts = stripped
    .split(/\s+[|@-]\s+| \| | - | @ /)
    .map((p) => p.trim())
    .filter(Boolean);

  const candidate = parts[0] || stripped;
  return smartTrim(candidate, 80);
};

const normalizeCompanyText = (value = "", link = "") => {
  let candidate = cleanHtmlText(value);
  const isLikelyBlogHost = (() => {
    try {
      const host = new URL(link).hostname.toLowerCase();
      return /(jobdrives|kickcharm|offcampus|blog|wordpress|medium)/i.test(host);
    } catch {
      return false;
    }
  })();

  if (!candidate && link && !isLikelyBlogHost) {
    try {
      const host = new URL(link).hostname.replace(/^www\./, "");
      const base = host.split(".")[0] || "";
      candidate = base.replace(/[-_]/g, " ");
    } catch {
      candidate = "";
    }
  }

  candidate = candidate
    .replace(/\b(careers?|jobs?|job openings?|hiring)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (candidate && candidate === candidate.toLowerCase()) {
    candidate = candidate.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return smartTrim(candidate, 60);
};

const normalizeLocationText = (value = "") => {
  const text = normalizeLocation(cleanHtmlText(value || ""));
  if (!text) return "";
  const cleaned = text
    .replace(/^location\s*[:\-]\s*/i, "")
    .replace(/^job location\s*[:\-]\s*/i, "")
    .replace(/\(adsbygoogle[\s\S]*$/i, "")
    .replace(/\b(experience|salary|ctc|job description|qualifications|roles and responsibilities|how to apply)\b[\s\S]*$/i, "")
    .replace(/\b(adsbygoogle|click here|apply now|submit application)\b[\s\S]*$/i, "")
    .replace(/^[A-Z][A-Za-z0-9&.\-]{2,}\s+(?=[A-Z][a-z]+(?:-[A-Z][a-z]+)?)/, "")
    .replace(/\s+\|\s+.*/g, "")
    .replace(/\s*[-|,]\s*(india|united states|us|uk)\s*$/i, (m) => m.replace(/[-|]/g, "").trim())
    .trim();
  const concise = cleaned
    .split(/\s{2,}| • | \| /)[0]
    .trim();
  const looksLikeRoleOnly =
    /\b(support|engineer|developer|associate|analyst|manager|intern|apprentice)\b/i.test(concise) &&
    !/\b(remote|hybrid|on-site|onsite)\b/i.test(concise) &&
    !/,/.test(concise);

  if (looksLikeRoleOnly) return "";
  return smartTrim(concise, 60);
};

const isLikelyLocationText = (value = "") => {
  const text = normalizeLocationText(value);
  if (!text) return false;
  return /\b(remote|hybrid|on-site|onsite)\b|,|\b(bengaluru|bangalore|hyderabad|noida|gurgaon|gurugram|pune|mumbai|chennai|delhi|india|usa|uk)\b/i.test(
    text
  );
};

const extractLocationFromBody = (bodyText = "") => {
  const text = cleanHtmlText(bodyText);
  if (!text) return "";

  const labeled = text.match(
    /\b(?:job\s+|work\s+)?location\s*[:\-]\s*([A-Za-z][A-Za-z\s,./()-]{2,100})\b/i
  );
  if (labeled?.[1]) {
    return normalizeLocationText(labeled[1]);
  }

  const remoteMatch = text.match(/\b(remote|hybrid|on-site|onsite)\b/i);
  if (remoteMatch) {
    return remoteMatch[1];
  }

  const cityCountry = text.match(
    /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s*[A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\b/
  );
  if (cityCountry?.[1]) {
    return normalizeLocationText(cityCountry[1]);
  }

  const cityState = text.match(
    /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s(?:[A-Z]{2}|Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New\sHampshire|New\sJersey|New\sMexico|New\sYork|North\sCarolina|North\sDakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode\sIsland|South\sCarolina|South\sDakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West\sVirginia|Wisconsin|Wyoming))\b/
  );

  return cityState ? cityState[1] : "";
};

const parseJsonLdJob = ($) => {
  let role = "";
  let companyName = "";
  let location = "";
  let description = "";
  const skills = [];

  const scripts = $('script[type="application/ld+json"]');

  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }

    const type = String(node["@type"] || "").toLowerCase();
    if (type.includes("jobposting")) {
      role = role || cleanHtmlText(node.title || "");
      companyName =
        companyName ||
        cleanHtmlText(
          node.hiringOrganization?.name ||
            node.organization?.name ||
            ""
        );

      const locality = node.jobLocation?.address?.addressLocality;
      const region = node.jobLocation?.address?.addressRegion;
      const country = node.jobLocation?.address?.addressCountry;
      const jobLoc = [locality, region, country]
        .map((s) => cleanHtmlText(s || ""))
        .filter(Boolean)
        .join(", ");
      location =
        location ||
        cleanHtmlText(jobLoc || node.jobLocationType || "");

      description = description || cleanHtmlText(node.description || "");

      const candidateSkills = [
        ...(Array.isArray(node.skills) ? node.skills : [node.skills]),
        ...(Array.isArray(node.qualifications)
          ? node.qualifications
          : [node.qualifications]),
      ]
        .flat()
        .map((s) => cleanHtmlText(s || ""))
        .filter(Boolean);

      candidateSkills.forEach((s) => skills.push(s));
    }

    Object.values(node).forEach(visit);
  };

  scripts.each((_, script) => {
    const raw = $(script).html() || "";
    try {
      visit(JSON.parse(raw));
    } catch {
      // ignore invalid JSON-LD
    }
  });

  return {
    role,
    companyName,
    location,
    description,
    skills: Array.from(new Set(skills)).slice(0, 20),
  };
};

const fetchJobPage = async (jobLink) => {
  const headers = {
    "User-Agent": "Mozilla/5.0 JobPilotAI/1.0",
    Accept: "text/html,application/xhtml+xml",
  };

  try {
    const direct = await axios.get(jobLink, {
      timeout: 20000,
      maxContentLength: 3 * 1024 * 1024,
      headers,
    });

    const html = typeof direct.data === "string" ? direct.data : "";
    if (html.length > 1000) {
      return { html, source: "direct" };
    }
  } catch {
    // fallback below
  }

  const proxyUrl = `https://r.jina.ai/http://${jobLink.replace(/^https?:\/\//, "")}`;
  const fallback = await axios.get(proxyUrl, {
    timeout: 25000,
    maxContentLength: 3 * 1024 * 1024,
    headers: { "User-Agent": "Mozilla/5.0 JobPilotAI/1.0" },
  });

  return {
    html: typeof fallback.data === "string" ? fallback.data : "",
    source: "r.jina.ai",
  };
};

const US_STATE_NAMES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming", "Remote",
];

const KNOWN_SKILL_REGEX =
  /\b(JavaScript|TypeScript|React|Next\.js|Node\.js|Express|MongoDB|SQL|PostgreSQL|MySQL|Python|Java|AWS|Azure|GCP|Docker|Kubernetes|REST|GraphQL|HTML|CSS|Tailwind|Git|CI\/CD|Redux|Jest)\b/gi;

const extractSkills = (text = "") =>
  Array.from(new Set((text.match(KNOWN_SKILL_REGEX) || []).map((s) => s.trim()))).slice(0, 25);

const detectJobSource = (jobLink = "") => {
  try {
    const host = new URL(jobLink).hostname.toLowerCase();
    if (host.includes("greenhouse.io")) return "greenhouse";
    if (host.includes("lever.co")) return "lever";
    if (host.includes("myworkdayjobs.com") || host.includes("workday")) return "workday";
    if (host.includes("linkedin.com")) return "linkedin";
    return "generic";
  } catch {
    return "generic";
  }
};

const scoreExtractionConfidence = ({ role, companyName, location, description, skills }) => {
  let score = 0;
  if (role) score += 25;
  if (companyName) score += 20;
  if (location) score += 15;
  if (description && description.length > 400) score += 25;
  if (Array.isArray(skills) && skills.length >= 3) score += 15;
  return Math.min(100, score);
};

const parseGreenhouse = ($, jsonLd, jobLink = "") => {
  const pathCompany = (() => {
    try {
      const href = $('link[rel="canonical"]').attr("href") || "";
      const sourceUrl = href || jobLink;
      if (sourceUrl) {
        const url = new URL(sourceUrl);
        const seg = url.pathname.split("/").filter(Boolean)[0] || "";
        return normalizeCompanyText(seg.replace(/[-_]/g, " "));
      }
    } catch {
      // ignore
    }
    return "";
  })();

  const headingText = cleanHtmlText(
    $('[data-board-role="opening-title"]').first().text() ||
      $(".opening h1").first().text() ||
      $("h1").first().text()
  );

  const headingRole = headingText
    .replace(/^Back to jobs\s*/i, "")
    .replace(/\b(New|Featured|Hot)\b\s*/gi, "")
    .split(/Apply\s*$/i)[0]
    .split(/\bIndia\b|\bUnited States\b|\bBengaluru\b|\bBangalore\b/i)[0]
    .trim();
  const headingLocation = (() => {
    const parts = headingText.split(/ - /).map((p) => p.trim()).filter(Boolean);
    const candidate = parts.length >= 2 ? parts[parts.length - 1] : "";
    if (isLikelyLocationText(candidate)) return candidate;
    return "";
  })();

  const role = normalizeRoleText(
    jsonLd.role ||
      headingRole
  );

  const companyName = normalizeCompanyText(
    pathCompany ||
      jsonLd.companyName ||
      $(".company-name").first().text()
  );

  const location = normalizeLocationText(
    jsonLd.location ||
      $('[data-board-role="opening-location"]').first().text() ||
      $(".location").first().text() ||
      $('[data-qa="location"]').first().text() ||
      extractLocationFromBody($("body").text()) ||
      headingLocation
  );

  const openingContent = $('[data-board-role="opening-content"]').first().clone();
  if (openingContent.length) {
    openingContent
      .find(
        'script,style,noscript,form,button,input,select,textarea,[class*="application"],[id*="application"],[data-qa*="application"]'
      )
      .remove();
  }

  const jdBlock = cleanHtmlText(
    openingContent.text() ||
      $('[data-board-role="opening-content"]').text() ||
      $("#content .opening").first().text() ||
      $("main").text()
  );
  const jdOnly = jdBlock
    .split(/Apply for this job/i)[0]
    .split(/\* indicates a required field/i)[0]
    .split(/Submit application/i)[0]
    .trim();
  const jdFocused = (() => {
    const base = extractDescriptionBounded(jdOnly || jsonLd.description);
    const fromJobDescription = base.match(/Job Description\s*[:\-]?\s*([\s\S]+)/i)?.[1];
    const candidate = (fromJobDescription || base)
      .split(/\b(How to Apply|About Us|If you are keen|Apply Link|Submit application)\b/i)[0]
      .trim();
    return candidate;
  })();
  const description = smartTrim(jdFocused, 2200);

  return {
    role,
    companyName,
    location,
    description,
    skills: extractSkills(description),
  };
};

const parseLever = ($, jsonLd) => {
  const role = normalizeRoleText(
    jsonLd.role ||
      $('[data-qa="posting-name"]').first().text() ||
      $(".posting-headline h2").first().text() ||
      $("h1").first().text()
  );

  const companyName = normalizeCompanyText(
    jsonLd.companyName ||
      $(".main-header-logo img").attr("alt") ||
      $('meta[property="og:site_name"]').attr("content")
  );

  const location = normalizeLocationText(
    jsonLd.location ||
      $(".posting-categories .location").first().text() ||
      $('[data-qa="location"]').first().text()
  );

  const description = smartTrim(
    cleanHtmlText(
      jsonLd.description ||
        $('[data-qa="job-description"]').text() ||
        $(".section-wrapper").text() ||
        $("main").text()
    ),
    8000
  );

  return {
    role,
    companyName,
    location,
    description,
    skills: extractSkills(description),
  };
};

const parseWorkday = ($, jsonLd) => {
  const role = normalizeRoleText(
    jsonLd.role ||
      $("h1").first().text() ||
      $('[data-automation-id="jobPostingHeader"]').text()
  );

  const companyName = normalizeCompanyText(
    jsonLd.companyName ||
      $('meta[property="og:site_name"]').attr("content")
  );

  const bodyText = cleanHtmlText($("body").text());
  const location = normalizeLocationText(
    jsonLd.location ||
      $('[data-automation-id="locations"]').text() ||
      extractLocationFromBody(bodyText)
  );

  const description = smartTrim(
    cleanHtmlText(
      jsonLd.description ||
        $('[data-automation-id="jobPostingDescription"]').text() ||
        $("main").text() ||
        bodyText
    ),
    8000
  );

  return {
    role,
    companyName,
    location,
    description,
    skills: extractSkills(description),
  };
};

const roleFromUrlPath = (jobLink = "") => {
  try {
    const url = new URL(jobLink);
    const raw = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() || "");
    const cleaned = raw
      .replace(/[-_]/g, " ")
      .replace(/\b(job|jobs|opening|careers?)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    return normalizeRoleText(cleaned);
  } catch {
    return "";
  }
};

const cleanDescriptionNoise = (text = "") => {
  const lines = String(text)
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .filter(
      (l) =>
        !/privacy|cookie|terms|equal opportunity|accessibility|copyright|sign in|create account|menu|navigation|adsbygoogle|click here|telegram group|whatsapp group|all jobs/i.test(
          l
        )
    );

  return cleanHtmlText(lines.join("\n"));
};

const extractDescriptionBounded = (text = "") => {
  const cleaned = cleanDescriptionNoise(text || "");
  if (!cleaned) return "";

  const fromKeyword = cleaned.match(
    /\b(Job Description|Responsibilities|What you will do|What you'll do|Required Skills|Qualifications)\b[\s\S]*/i
  );
  const start = fromKeyword ? fromKeyword[0] : cleaned;

  return start
    .split(/Apply for this job/i)[0]
    .split(/\* indicates a required field/i)[0]
    .split(/Submit application/i)[0]
    .trim();
};

const pickBestDescription = (candidates = []) => {
  const scored = candidates
    .map((text) => cleanDescriptionNoise(text || ""))
    .filter(Boolean)
    .map((text) => {
      const keywordHits =
        (text.match(
          /\b(responsibilit|requirement|qualification|experience|skills|about the role|what you'll do|what you will do)\b/gi
        ) || []).length;
      return { text, score: text.length + keywordHits * 220 };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.text || "";
};

const compactDescription = (text = "", max = 2200) => {
  const cleaned = cleanDescriptionNoise(text || "")
    .replace(/\b(back to jobs|new|apply now|apply here|click here|share this)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return smartTrim(cleaned, max);
};

const parseStructuredFieldsFromText = (bodyText = "") => {
  const text = cleanHtmlText(bodyText);
  if (!text) {
    return {
      role: "",
      companyName: "",
      location: "",
      description: "",
    };
  }

  const companyName =
    text.match(/Company\s*:\s*([A-Za-z0-9&.,\-\s]{2,80}?)(?:\s+Role\s*:|\s+Degree\s*:|\s+Batches\s*:|\s+Experience\s*:)/i)?.[1] ||
    text.match(/\b([A-Za-z][A-Za-z0-9&.\-\s]{1,60})\s+Recruitment\s+For\b/i)?.[1] ||
    text.match(/\b([A-Za-z][A-Za-z0-9&.\-\s]{1,60})\s+is hiring\b/i)?.[1] ||
    "";

  const role =
    text.match(/Role\s*:\s*(.+?)\s+Degree\s*:/i)?.[1] ||
    text.match(/Hiring\s+For\s+(.+?)\s+\d{1,2}\/\d{1,2}\/\d{4}/i)?.[1] ||
    "";

  const location =
    text.match(
      /Location\s*:\s*([A-Za-z0-9,\-\s]{2,80}?)(?:\s+Job Description|\s+Qualifications|\s+Roles and Responsibilities|\s+How To Apply|\s+Salary|\s+Experience)/i
    )?.[1] || "";

  const qualificationsPart =
    text.match(
      /Qualifications(?:\s*&\s*Skills)?\s*:\s*(.+?)\s+Roles and Responsibilities\s*:/i
    )?.[1] || "";

  const responsibilitiesPart =
    text.match(
      /Roles and Responsibilities\s*:\s*(.+?)\s+How To Apply/i
    )?.[1] || "";

  const descriptionPart =
    text.match(
      /Job Description\s*:\s*(.+?)\s+Qualifications(?:\s*&\s*Skills)?\s*:/i
    )?.[1] || "";

  const combinedJd = [descriptionPart, qualificationsPart, responsibilitiesPart]
    .map((part) => cleanDescriptionNoise(part))
    .filter(Boolean)
    .join("\n");

  return {
    role: normalizeRoleText(role),
    companyName: normalizeCompanyText(companyName),
    location: normalizeLocationText(location),
    description: smartTrim(combinedJd, 5000),
  };
};

const buildSortOption = (sort) => {
  if (!sort || typeof sort !== "string") {
    return { createdAt: -1 };
  }

  const [field, order] = sort.split(":");

  if (!ALLOWED_SORT_FIELDS.includes(field)) {
    return { createdAt: -1 };
  }

  if (order && !ALLOWED_SORT_ORDERS.includes(order)) {
    return { createdAt: -1 };
  }

  return { [field]: order === "asc" ? 1 : -1 };
};

const parsePositiveInt = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

// ➕ Create Job
exports.createJob = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      userId: req.user,
    };

    if (payload.location !== undefined) {
      payload.location = normalizeLocation(payload.location);
    }

    const job = await Job.create({
      ...payload,
    });

    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📋 Get All Jobs (with filter + search + pagination)
exports.getJobs = async (req, res) => {
  try {
    const { status, search, location, page = 1, limit = 10, sort } = req.query;
    const pageNum = parsePositiveInt(page, 1);
    const limitNum = Math.min(parsePositiveInt(limit, 10), 50);

    const query = { userId: req.user };

    // filter by status
    if (status && ALLOWED_STATUSES.includes(status)) {
      query.status = status;
    }

    // search by company and role
    if (search) {
      const searchTerm = escapeRegex(String(search).trim());
      query.$or = [
        { companyName: { $regex: searchTerm, $options: "i" } },
        { role: { $regex: searchTerm, $options: "i" } },
        { location: { $regex: searchTerm, $options: "i" } },
      ];
    }

    // filter by location
    if (location) {
      query.location = {
        $regex: escapeRegex(normalizeLocation(String(location))),
        $options: "i",
      };
    }

    // sorting
    const sortOption = buildSortOption(sort);

    const jobs = await Job.find(query)
      .sort(sortOption)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await Job.countDocuments(query);

    res.json({
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
      data: jobs,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✏️ Update Job
exports.updateJob = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid job id" });
    }

    const { userId, _id, ...safeBody } = req.body;
    if (safeBody.location !== undefined) {
      safeBody.location = normalizeLocation(safeBody.location);
    }

    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, userId: req.user },
      safeBody,
      { new: true, runValidators: true }
    );

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔎 Get single job
exports.getJobById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid job id" });
    }

    const job = await Job.findOne({ _id: req.params.id, userId: req.user });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json({ data: job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ❌ Delete Job
exports.deleteJob = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid job id" });
    }

    const job = await Job.findOneAndDelete({
      _id: req.params.id,
      userId: req.user,
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json({ message: "Job deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🚀 Smart Apply (open link + move status to Applied)
exports.applyToJob = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid job id" });
    }

    const job = await Job.findOne({ _id: req.params.id, userId: req.user });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (!job.jobLink) {
      return res.status(400).json({ message: "Job link not available" });
    }

    res.json({
      message: "Application opened",
      data: {
        _id: job._id,
        status: job.status,
        appliedDate: job.appliedDate,
        jobLink: job.jobLink,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📍 Location suggestions
exports.getLocationSuggestions = async (req, res) => {
  try {
    const q = normalizeLocation(String(req.query.q || ""));
    if (!q) {
      return res.json({ data: [] });
    }

    const regex = new RegExp(escapeRegex(q), "i");

    const dbSuggestions = await Job.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user), location: { $regex: regex } } },
      { $group: { _id: "$location" } },
      { $project: { _id: 0, location: "$_id" } },
      { $sort: { location: 1 } },
      { $limit: 8 },
    ]);

    const localSuggestions = dbSuggestions
      .map((i) => normalizeLocation(i.location))
      .filter(Boolean);
    const stateSuggestions = US_STATE_NAMES
      .filter((state) => regex.test(state))
      .slice(0, 8);

    const merged = Array.from(new Set([...localSuggestions, ...stateSuggestions])).slice(0, 10);
    res.json({ data: merged });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔎 Extract job details from link
exports.extractJobFromLink = async (req, res) => {
  try {
    const { jobLink } = req.body;
    if (!jobLink || typeof jobLink !== "string") {
      return res.status(400).json({ message: "Valid jobLink is required" });
    }

    const page = await fetchJobPage(jobLink);
    const html = page.html || "";
    const $ = cheerio.load(html);
    const jsonLd = parseJsonLdJob($);
    const detectedSource = detectJobSource(jobLink);
    const rawBodyText = $("body").text();
    const structured = parseStructuredFieldsFromText(rawBodyText);

    const metaTitle =
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="title"]').attr("content") ||
      $('meta[name="twitter:title"]').attr("content") ||
      $("title").first().text();
    let extracted;

    if (detectedSource === "greenhouse") {
      extracted = parseGreenhouse($, jsonLd, jobLink);
    } else if (detectedSource === "lever") {
      extracted = parseLever($, jsonLd);
    } else if (detectedSource === "workday") {
      extracted = parseWorkday($, jsonLd);
    } else {
      const h1 = $("h1").first().text();
      const companyMeta =
        $('meta[property="og:site_name"]').attr("content") ||
        $('meta[name="author"]').attr("content");
      const isBlogLike = /(jobdrives|kickcharm|offcampus|blog|wordpress|medium)/i.test(
        String(jobLink)
      );
      const bodyText = cleanHtmlText(rawBodyText);
      const locationCandidate = jsonLd.location ||
        $('[class*="location"]').first().text() ||
        $('[data-test*="location"]').first().text() ||
        $('li:contains("Location")').first().text() ||
        $("body").text().match(/location\s*[:\-]\s*([^\n|]{2,80})/i)?.[1];

      const descriptionMeta =
        $('meta[name="description"]').attr("content") ||
        $('meta[property="og:description"]').attr("content") ||
        "";

      const sectionTexts = [
        jsonLd.description,
        descriptionMeta,
        $("main").text(),
        $("article").text(),
        $("[class*=description]").text(),
        $("[id*=description]").text(),
        $("[class*=job-description]").text(),
        $("[class*=requirements]").text(),
        $("[id*=requirements]").text(),
        bodyText,
      ]
        .map((t) => cleanHtmlText(t || ""))
        .filter(Boolean)
        .sort((a, b) => b.length - a.length);

      const description = compactDescription(pickBestDescription(sectionTexts), 2200);
      extracted = {
        role: normalizeRoleText(
          structured.role || jsonLd.role || h1 || metaTitle || roleFromUrlPath(jobLink)
        ),
        companyName: normalizeCompanyText(
          structured.companyName || jsonLd.companyName || (isBlogLike ? "" : companyMeta),
          jobLink
        ),
        location: normalizeLocationText(
          structured.location || locationCandidate || extractLocationFromBody(bodyText)
        ),
        description,
        skills: Array.from(new Set([...(jsonLd.skills || []), ...extractSkills(description)])).slice(0, 25),
      };
    }

    if (detectedSource === "generic" && structured.description && structured.description.length > 150) {
      extracted.description = compactDescription(structured.description, 2200);
      extracted.skills = Array.from(
        new Set([...(extracted.skills || []), ...extractSkills(structured.description)])
      ).slice(0, 25);
    }

    if (!extracted.role) {
      extracted.role = roleFromUrlPath(jobLink);
    }
    if (!extracted.companyName) {
      extracted.companyName = normalizeCompanyText("", jobLink);
    }

    const confidence = scoreExtractionConfidence(extracted);

    res.json({
      role: extracted.role || "",
      companyName: extracted.companyName || "",
      location: extracted.location || "",
      description: extracted.description || "",
      skills: extracted.skills || [],
      requiredSkills: extracted.skills || [],
      source: `${detectedSource}:${page.source || "direct"}`,
      confidence,
      needsReview: confidence < 70,
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to extract details from this link.",
      error: error.message,
    });
  }
};



// 📊 Job Stats
exports.getJobStats = async (req, res) => {
  try {
    const stats = await Job.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user),
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      Applied: 0,
      Interview: 0,
      Rejected: 0,
      Offer: 0,
    };

    stats.forEach((item) => {
      result[item._id] = item.count;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
