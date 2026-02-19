const axios = require("axios");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");
const cheerio = require("cheerio");

const MODEL = "openai/gpt-3.5-turbo";

const clampScore = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
};

const cleanText = (value = "") =>
  String(value)
    .replace(/\s+/g, " ")
    .trim();

const stripHtml = (html = "") =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();

const cleanDescriptionNoise = (text = "") =>
  String(text)
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .filter(
      (l) =>
        !/privacy|cookie|terms|equal opportunity|accessibility|copyright|sign in|create account|menu|navigation|follow us|adsbygoogle|click here|telegram group|whatsapp group|all jobs/i.test(
          l
        )
    )
    .join("\n");

const pickBestDescription = (candidates = []) => {
  const scored = candidates
    .map((c) => cleanDescriptionNoise(stripHtml(c || "")))
    .filter(Boolean)
    .map((text) => {
      const keywordHits =
        (text.match(
          /\b(responsibilit|requirement|qualification|experience|skills|about the role|what you'll do|what you will do)\b/gi
        ) || []).length;
      return { text, score: text.length + keywordHits * 200 };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.text || "";
};

const parseJsonFromModel = (content = "") => {
  const trimmed = content.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  const candidate = jsonMatch ? jsonMatch[0] : trimmed;
  return JSON.parse(candidate);
};

const normalizeArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanText(item))
    .filter(Boolean)
    .slice(0, 6);
};

const KNOWN_SKILLS = [
  "javascript", "typescript", "react", "next.js", "node.js", "express",
  "mongodb", "sql", "postgresql", "mysql", "python", "java", "c++",
  "aws", "azure", "gcp", "docker", "kubernetes", "rest", "graphql",
  "html", "css", "tailwind", "redux", "git", "ci/cd", "jest", "testing",
  "communication", "problem solving", "data structures", "algorithms",
];

const extractSkillsFromText = (text = "") => {
  const lower = cleanText(text).toLowerCase();
  return KNOWN_SKILLS.filter((skill) => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(lower);
  });
};

const isHttpUrl = (value = "") => /^https?:\/\/\S+$/i.test(String(value).trim());

const extractGreenhouseDescription = (html = "") => {
  if (!html) return "";
  const $ = cheerio.load(html);
  const content = $('[data-board-role="opening-content"]').first().clone();
  if (content.length) {
    content
      .find(
        'script,style,noscript,form,button,input,select,textarea,[class*="application"],[id*="application"],[data-qa*="application"]'
      )
      .remove();
  }

  const raw = stripHtml(
    content.text() ||
      $('[data-board-role="opening-content"]').text() ||
      $("main").text()
  );

  return cleanDescriptionNoise(
    raw
      .split(/Apply for this job/i)[0]
      .split(/\* indicates a required field/i)[0]
      .split(/Submit application/i)[0]
      .trim()
  );
};

const fetchJobDescriptionFromLink = async (jobLink) => {
  if (!jobLink) return "";
  const isGreenhouse = /greenhouse\.io/i.test(jobLink);
  try {
    const response = await axios.get(jobLink, {
      timeout: 15000,
      maxContentLength: 2 * 1024 * 1024,
      headers: {
        "User-Agent": "Mozilla/5.0 JobPilotAI/1.0",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    const html = typeof response.data === "string" ? response.data : "";
    if (isGreenhouse) {
      const jd = extractGreenhouseDescription(html);
      if (jd.length > 120) return jd.slice(0, 8000);
    }

    const $ = cheerio.load(html);
    const targeted = pickBestDescription([
      $('script[type="application/ld+json"]').text(),
      $('[class*=job-description]').text(),
      $('[id*=job-description]').text(),
      $('[class*=description]').text(),
      $('[id*=description]').text(),
      $('[class*=requirements]').text(),
      $('[id*=requirements]').text(),
      $('main').text(),
      $('article').text(),
    ]);
    if (targeted.length > 500) return targeted.slice(0, 8000);
  } catch {
    // fallback below
  }

  const proxyUrl = `https://r.jina.ai/http://${jobLink.replace(/^https?:\/\//, "")}`;
  const fallback = await axios.get(proxyUrl, {
    timeout: 25000,
    maxContentLength: 2 * 1024 * 1024,
    headers: { "User-Agent": "Mozilla/5.0 JobPilotAI/1.0" },
  });
  const fallbackText = String(fallback.data || "");
  if (isGreenhouse) {
    const narrowed = cleanDescriptionNoise(
      fallbackText
        .split(/Apply for this job/i)[0]
        .split(/\* indicates a required field/i)[0]
        .split(/Submit application/i)[0]
        .replace(/^Back to jobs/i, "")
    );
    if (narrowed.length > 120) return narrowed.slice(0, 8000);
  }
  return pickBestDescription([fallbackText]).slice(0, 8000);
};

const extractResumeTextFromFile = async (file) => {
  if (!file || !file.buffer) return "";
  const fileName = String(file.originalname || "").toLowerCase();
  const mime = String(file.mimetype || "").toLowerCase();

  if (fileName.endsWith(".pdf") || mime.includes("pdf")) {
    const parsed = await pdfParse(file.buffer);
    return cleanText(parsed.text || "");
  }

  if (
    fileName.endsWith(".docx") ||
    mime.includes("wordprocessingml.document")
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return cleanText(result.value || "");
  }

  throw new Error("Unsupported file type. Upload PDF or DOCX.");
};

const runAnalysis = async ({
  resumeText,
  jobDescription,
  jobLink,
  role,
  companyName,
  requiredSkillsInput,
}) => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OpenRouter key missing in .env");
  }

  const normalizedResume = cleanText(resumeText);
  if (!normalizedResume || normalizedResume.length < 80) {
    return {
      status: 400,
      payload: {
        message: "Resume text is too short. Please provide a fuller resume.",
      },
    };
  }

  let normalizedDescription = cleanText(jobDescription);
  let extractedJobLink = cleanText(jobLink);
  let extractedFromLink = false;

  if (!extractedJobLink && isHttpUrl(normalizedDescription)) {
    extractedJobLink = normalizedDescription;
    normalizedDescription = "";
  }

  if (extractedJobLink && !isHttpUrl(extractedJobLink)) {
    return {
      status: 400,
      payload: {
        message: "Invalid job link format. Please provide a valid URL.",
      },
    };
  }

  if (!normalizedDescription && extractedJobLink) {
    try {
      normalizedDescription = await fetchJobDescriptionFromLink(extractedJobLink);
      extractedFromLink = Boolean(normalizedDescription);
    } catch {
      extractedFromLink = false;
    }
  }

  if (!normalizedDescription || normalizedDescription.length < 80) {
    return {
      status: 400,
      payload: {
        message:
          "Job description is missing or too short. Paste JD text, or provide a readable job link.",
      },
    };
  }

  const prompt = `
You are an ATS assistant for job screening.
Analyze the candidate resume against the job description and return valid JSON only.

Return JSON shape:
{
  "matchScore": number,
  "shortlisted": boolean,
  "summary": "short summary",
  "strengths": ["..."],
  "weakPoints": ["..."],
  "missingSkills": ["..."],
  "improvements": ["..."]
}

Rules:
- matchScore should be an integer 0-100.
- shortlisted should be true ONLY when most required skills from JD are present and score >= 70.
- Keep each list concise (max 6 items).
- Be specific and actionable.
- Focus strongly on required skills and hard requirements from JD.

Company: ${cleanText(companyName || "Unknown")}
Role: ${cleanText(role || "Unknown")}

Resume:
${normalizedResume}

Job Description:
${normalizedDescription}
`;

  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 700,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5000",
        "X-Title": "JobPilotAI",
      },
      timeout: 30000,
    }
  );

  const content = response.data.choices?.[0]?.message?.content || "";
  let parsed;

  try {
    parsed = parseJsonFromModel(content);
  } catch {
    const fallbackScore = clampScore(content.match(/\d+/)?.[0] || 0);
    parsed = {
      matchScore: fallbackScore,
      shortlisted: fallbackScore >= 70,
      summary: "Unable to parse complete analysis from model output.",
      strengths: [],
      weakPoints: [],
      missingSkills: [],
      improvements: [],
    };
  }

  const modelScore = clampScore(parsed.matchScore);
  const requiredSkills = Array.from(
    new Set(
      [
        ...extractSkillsFromText(normalizedDescription),
        ...(Array.isArray(requiredSkillsInput) ? requiredSkillsInput : []),
      ]
        .map((s) => cleanText(s).toLowerCase())
        .filter(Boolean)
    )
  );
  const resumeSkills = extractSkillsFromText(normalizedResume);
  const missingSkillsByCoverage = requiredSkills.filter(
    (skill) => !resumeSkills.includes(skill)
  );
  const coverage =
    requiredSkills.length > 0
      ? (requiredSkills.length - missingSkillsByCoverage.length) /
        requiredSkills.length
      : 0.5;

  let adjustedScore = Math.round(modelScore * 0.6 + coverage * 100 * 0.4);

  if (coverage < 0.4) adjustedScore = Math.min(adjustedScore, 58);
  if (coverage < 0.5) adjustedScore = Math.min(adjustedScore, 68);
  if (coverage >= 0.8 && modelScore >= 75) {
    adjustedScore = Math.max(adjustedScore, 78);
  }

  const matchScore = clampScore(adjustedScore);
  const shortlisted = matchScore >= 70 && coverage >= 0.5;
  const mergedMissingSkills = Array.from(
    new Set([
      ...missingSkillsByCoverage,
      ...(Array.isArray(parsed.missingSkills) ? parsed.missingSkills : []),
    ])
  );

  return {
    status: 200,
    payload: {
      matchScore,
      shortlisted,
      summary: cleanText(parsed.summary || ""),
      strengths: normalizeArray(parsed.strengths),
      weakPoints: normalizeArray(parsed.weakPoints),
      missingSkills: normalizeArray(mergedMissingSkills),
      improvements: normalizeArray(parsed.improvements),
      criteria: {
        requiredSkills,
        matchedSkills: requiredSkills.filter((s) => resumeSkills.includes(s)),
        coveragePercent: Math.round(coverage * 100),
      },
      extractedFromLink,
    },
  };
};

exports.getMatchScore = async (req, res) => {
  try {
    const { resumeText, jobDescription, jobLink, role, companyName, requiredSkills } = req.body;
    const result = await runAnalysis({
      resumeText,
      jobDescription,
      jobLink,
      role,
      companyName,
      requiredSkillsInput: requiredSkills,
    });

    return res.status(result.status).json(result.payload);
  } catch (error) {
    console.error("AI ERROR:", error.response?.data || error.message);
    return res.status(500).json({
      message: error.response?.data?.error?.message || error.message,
    });
  }
};

exports.getMatchScoreFromUpload = async (req, res) => {
  try {
    const { jobDescription, jobLink, role, companyName, requiredSkills } = req.body;
    const resumeText = await extractResumeTextFromFile(req.file);

    if (!resumeText) {
      return res.status(400).json({ message: "Could not read resume file content." });
    }

    const result = await runAnalysis({
      resumeText,
      jobDescription,
      jobLink,
      role,
      companyName,
      requiredSkillsInput: requiredSkills
        ? String(requiredSkills).split(",")
        : [],
    });

    result.payload.resumeText = resumeText.slice(0, 20000);
    result.payload.resumeFileName = req.file?.originalname || "";

    return res.status(result.status).json(result.payload);
  } catch (error) {
    console.error("AI FILE ERROR:", error.response?.data || error.message);
    return res.status(500).json({
      message: error.response?.data?.error?.message || error.message,
    });
  }
};
