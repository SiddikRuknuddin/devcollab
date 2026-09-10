const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const { sendVerificationEmail } = require("../utils/emailService");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ── helpers ─────────────────────────────────────────────────────────────────

/**
 * Generate a cryptographically random hex token and its SHA-256 hash.
 * We store the HASH in the DB, send the RAW token in the email link.
 */
const generateVerificationToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  return { rawToken, hashedToken };
};

// ── controllers ──────────────────────────────────────────────────────────────

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const { rawToken, hashedToken } = generateVerificationToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      isEmailVerified: false,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: expires,
    });

    // Attempt to send verification email (non-blocking — registration still succeeds)
    const emailSent = await sendVerificationEmail(user.email, user.name, rawToken);

    res.status(201).json({
      success: true,
      message: emailSent
        ? "Account created! Please check your email to verify your account before logging in."
        : "Account created! Email verification is currently unavailable — contact support if needed.",
      requiresVerification: true,
      emailSent,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Register Error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Select verification fields explicitly (they have select: false)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      "+emailVerificationToken +emailVerificationExpires"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Block login if email is NOT verified AND user has a verification token
    // (i.e., they registered after the feature was added)
    if (!user.isEmailVerified && user.emailVerificationToken) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email address before logging in.",
        requiresVerification: true,
        email: user.email,
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage || "",
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET /api/auth/verify-email/:token
 * Verifies a user's email using the raw token from their email link.
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required",
      });
    }

    // Hash the incoming token to compare with stored hash
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    }).select("+emailVerificationToken +emailVerificationExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "Verification link is invalid or has expired. Please request a new one.",
      });
    }

    // Mark verified and clear token fields
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully! You can now log in.",
    });
  } catch (error) {
    console.error("Verify Email Error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * POST /api/auth/resend-verification
 * Generates a new verification token and resends the email.
 * Uses a generic response to avoid account enumeration.
 */
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+emailVerificationToken +emailVerificationExpires");

    // Generic response — don't reveal whether email exists
    const genericResponse = {
      success: true,
      message:
        "If the account requires verification, a new verification email has been sent.",
    };

    // Skip if user not found or already verified
    if (!user || user.isEmailVerified) {
      return res.status(200).json(genericResponse);
    }

    // Generate new token
    const { rawToken, hashedToken } = generateVerificationToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = expires;
    await user.save();

    await sendVerificationEmail(user.email, user.name, rawToken);

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error("Resend Verification Error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * POST /api/auth/google
 * Verify Google ID token from frontend → find or create user → return JWT.
 * Google accounts are considered email-verified by default.
 */
const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: "Google credential is required" });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({
        success: false,
        message: "Google OAuth is not configured on this server.",
      });
    }

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    if (!email) {
      return res.status(400).json({ success: false, message: "Google account has no email address" });
    }

    // Find existing user or create new one
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // Existing user — ensure email is marked verified (Google verified it)
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        user.emailVerificationToken = null;
        user.emailVerificationExpires = null;
        await user.save();
      }
      // Optionally update profile picture if user has none
      if (!user.profileImage && picture) {
        user.profileImage = picture;
        await user.save();
      }
    } else {
      // New user via Google — auto-verified, no password needed
      user = await User.create({
        name,
        email: email.toLowerCase(),
        password: crypto.randomBytes(32).toString("hex"), // Random unusable password
        profileImage: picture || "",
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Google login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage || "",
        isEmailVerified: true,
      },
    });
  } catch (error) {
    console.error("Google Login Error:", error.message);
    if (error.message?.includes("Token used too late") || error.message?.includes("Invalid token signature")) {
      return res.status(401).json({ success: false, message: "Invalid or expired Google token. Please try again." });
    }
    res.status(500).json({ success: false, message: "Google login failed. Please try again." });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerification,
  googleLogin,
};
