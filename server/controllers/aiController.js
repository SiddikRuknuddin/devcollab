// AI Code Reviewer & Vulnerability Scanner
const analyzeCodeHeuristically = (code, language) => {
  const codeLower = code.toLowerCase();
  const vulnerabilities = [];
  const optimizations = [];
  let score = 95;

  // Security checks
  if (/select\s+.*from\s+.*\+/.test(codeLower) || /\$\{.*\}\s*from/i.test(code)) {
    vulnerabilities.push({
      severity: "High",
      type: "SQL Injection Risk",
      message: "Direct string concatenation or template literals detected in SQL queries. Use parameterized queries or ORM bindings.",
    });
    score -= 25;
  }

  if (/innerHTML\s*=/.test(code) || /dangerouslySetInnerHTML/.test(code)) {
    vulnerabilities.push({
      severity: "High",
      type: "Cross-Site Scripting (XSS)",
      message: "Direct DOM HTML injection without sanitization can lead to XSS attacks. Use textContent or DOMPurify.",
    });
    score -= 20;
  }

  if (/eval\(|new Function\(/.test(code)) {
    vulnerabilities.push({
      severity: "Critical",
      type: "Arbitrary Code Execution",
      message: "Use of 'eval()' or 'new Function()' executes raw strings and poses severe security risks.",
    });
    score -= 35;
  }

  if (/api_key|secret|password|bearer\s+/i.test(code) && /['"`][a-zA-Z0-9_-]{16,}['"`]/.test(code)) {
    vulnerabilities.push({
      severity: "Critical",
      type: "Hardcoded Credential / Secret",
      message: "Hardcoded API key or private secret detected. Store sensitive tokens in environment variables (.env).",
    });
    score -= 30;
  }

  // Performance & Code Smells
  if (/for\s*\(.*in\s+.*\)/.test(codeLower) && (language === "javascript" || language === "typescript")) {
    optimizations.push("Avoid 'for...in' over arrays; use 'for...of' or Array.prototype.map/filter/forEach for better performance.");
    score -= 5;
  }

  if (/\.forEach\s*\(.*async/.test(code)) {
    vulnerabilities.push({
      severity: "Medium",
      type: "Async in forEach Anti-Pattern",
      message: "Array.prototype.forEach does not wait for async promises. Use 'for...of' or 'Promise.all()' instead.",
    });
    score -= 15;
  }

  if (!/try\s*\{/.test(code) && /await\s+/.test(code)) {
    optimizations.push("Async/await without try/catch block can lead to unhandled promise rejections. Wrap in try/catch.");
    score -= 10;
  }

  if (/console\.log\(/.test(code)) {
    optimizations.push("Debug console.log statements detected. Remove them in production builds.");
    score -= 5;
  }

  // Time complexity estimation
  let timeComplexity = "O(1) to O(N)";
  const nestedLoops = (code.match(/for\s*\(|while\s*\(/g) || []).length;
  if (nestedLoops >= 2) timeComplexity = "O(N²) - Quadratic Time";
  else if (nestedLoops === 1) timeComplexity = "O(N) - Linear Time";

  // Generate refactored recommendation
  let refactoredCode = code;
  if (vulnerabilities.length > 0 || optimizations.length > 0) {
    refactoredCode = `// ✅ AI Suggested Refactored Version\n` +
      code
        .replace(/console\.log\(.*\);?/g, "// [removed debug log]")
        .replace(/eval\(.*?\)/g, "/* [blocked eval] */");
  }

  const finalScore = Math.max(20, Math.min(100, score));

  return {
    score: finalScore,
    status: finalScore >= 80 ? "Pass (High Quality)" : finalScore >= 50 ? "Warning (Needs Attention)" : "Fail (Security Risks)",
    timeComplexity,
    vulnerabilities,
    optimizations,
    refactoredCode,
    summary: vulnerabilities.length === 0
      ? "Code passed security and quality checks with clean syntax."
      : `Found ${vulnerabilities.length} potential security vulnerability(ies) and ${optimizations.length} optimization recommendation(s).`,
  };
};

// POST /api/ai/code-review
const reviewCode = async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: "Code snippet is required for review" });
    }

    // Call Gemini API if GEMINI_API_KEY is available in env
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are an expert software security engineer and senior code reviewer. Review the following ${language || "code"}:\n\n\`\`\`${language || ""}\n${code}\n\`\`\`\n\nProvide response in JSON format with fields: score (integer 0-100), status (Pass/Warning/Fail), timeComplexity (e.g. O(N)), vulnerabilities (array of {severity, type, message}), optimizations (array of strings), summary (string), refactoredCode (string). Return only valid JSON.`,
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const cleanJson = rawText.replace(/```json\n?|```/g, "").trim();
            const parsed = JSON.parse(cleanJson);
            return res.status(200).json({ success: true, review: parsed });
          }
        }
      } catch (geminiError) {
        console.warn("Gemini API call failed, using heuristic engine:", geminiError.message);
      }
    }

    // Heuristic analysis engine fallback
    const review = analyzeCodeHeuristically(code, language || "javascript");
    res.status(200).json({ success: true, review });
  } catch (error) {
    console.error("Code Review Error:", error);
    res.status(500).json({ success: false, message: "Server error during code analysis" });
  }
};

module.exports = {
  reviewCode,
};
