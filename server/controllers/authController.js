const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const crypto = require("crypto");

const createJwt = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

const getClientAppUrl = () => (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
const encodeState = (payload) => Buffer.from(JSON.stringify(payload)).toString("base64url");
const decodeState = (value) => {
  try {
    return JSON.parse(Buffer.from(String(value || ""), "base64url").toString("utf8"));
  } catch {
    return {};
  }
};

// 🔐 Register User
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // check existing user
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // create token
    const token = createJwt(user._id);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔐 Login User
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // check user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // create token
    const token = createJwt(user._id);

    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// 👤 Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const User = require("../models/User");

    const user = await User.findById(req.user).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🚪 Logout User
exports.logoutUser = async (req, res) => {
  try {
    // Token is handled client-side by removing from localStorage
    // This endpoint is optional and mainly for audit/logging purposes
    res.json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.startGoogleAuth = async (req, res) => {
  try {
    const popup = String(req.query.popup || "") === "1";
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REDIRECT_URI) {
      if (popup) {
        return res.status(200).send(
          "<script>if(window.opener){window.opener.postMessage({source:'jobpilot-google-oauth',error:'oauth_not_configured'},'*')}window.close();</script>"
        );
      }
      return res.redirect(`${getClientAppUrl()}/login?oauthError=oauth_not_configured`);
    }
    const state = encodeState({ popup, ts: Date.now() });

    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      response_type: "code",
      scope: "openid email profile",
      access_type: "online",
      prompt: "select_account",
      state,
    });

    return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.googleAuthCallback = async (req, res) => {
  try {
    const code = req.query.code;
    const { popup } = decodeState(req.query.state);
    if (!code) {
      if (popup) {
        return res.status(200).send(
          "<script>if(window.opener){window.opener.postMessage({source:'jobpilot-google-oauth',error:'missing_code'},'*')}window.close();</script>"
        );
      }
      return res.redirect(`${getClientAppUrl()}/login?oauthError=missing_code`);
    }

    if (
      !process.env.GOOGLE_CLIENT_ID ||
      !process.env.GOOGLE_CLIENT_SECRET ||
      !process.env.GOOGLE_REDIRECT_URI
    ) {
      return res.redirect(`${getClientAppUrl()}/login?oauthError=oauth_not_configured`);
    }

    const tokenResp = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code: String(code),
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }).toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 20000,
      }
    );

    const accessToken = tokenResp.data?.access_token;
    if (!accessToken) {
      if (popup) {
        return res.status(200).send(
          "<script>if(window.opener){window.opener.postMessage({source:'jobpilot-google-oauth',error:'token_exchange_failed'},'*')}window.close();</script>"
        );
      }
      return res.redirect(`${getClientAppUrl()}/login?oauthError=token_exchange_failed`);
    }

    const profileResp = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 20000,
    });

    const email = String(profileResp.data?.email || "").toLowerCase().trim();
    const name = String(profileResp.data?.name || email.split("@")[0] || "User").trim();

    if (!email) {
      if (popup) {
        return res.status(200).send(
          "<script>if(window.opener){window.opener.postMessage({source:'jobpilot-google-oauth',error:'missing_email'},'*')}window.close();</script>"
        );
      }
      return res.redirect(`${getClientAppUrl()}/login?oauthError=missing_email`);
    }

    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = crypto.randomBytes(24).toString("hex");
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);
      user = await User.create({
        name,
        email,
        password: hashedPassword,
      });
    }

    const token = createJwt(user._id);
    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
    };

    const payload = encodeURIComponent(Buffer.from(JSON.stringify(safeUser)).toString("base64"));
    if (popup) {
      const clientUrl = getClientAppUrl();
      return res.status(200).send(`<!doctype html><html><body><script>
        if (window.opener) {
          window.opener.postMessage({
            source: 'jobpilot-google-oauth',
            token: ${JSON.stringify(token)},
            user: ${JSON.stringify(payload)}
          }, ${JSON.stringify(clientUrl)});
        }
        window.close();
      </script></body></html>`);
    }
    return res.redirect(`${getClientAppUrl()}/oauth-success?token=${encodeURIComponent(token)}&user=${payload}`);
  } catch (error) {
    const { popup } = decodeState(req.query.state);
    if (popup) {
      return res.status(200).send(
        "<script>if(window.opener){window.opener.postMessage({source:'jobpilot-google-oauth',error:'google_login_failed'},'*')}window.close();</script>"
      );
    }
    return res.redirect(`${getClientAppUrl()}/login?oauthError=google_login_failed`);
  }
};
