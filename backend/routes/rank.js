const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const Tesseract = require("tesseract.js");
const Groq = require("groq-sdk");
const PDFParser = require("pdf2json");

const router = express.Router();

let _groq;
function getGroq() {
  if (!_groq) {
    if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY is not set in your .env file");
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = [".pdf", ".docx", ".doc", ".jpg", ".jpeg", ".png"];

  console.log("File mimetype:", file.mimetype, "| Extension:", ext);

  if (allowed.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, DOCX, JPG, PNG files are accepted. Got: " + file.mimetype), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 15 * 1024 * 1024 } });

async function extractText(filePath, mimetype) {

  // ── PDF ──────────────────────────────────────────────────────────────────
  if (mimetype === "application/pdf") {
    const buffer = fs.readFileSync(filePath);
    console.log("PDF buffer size:", buffer.length, "bytes");
    console.log("PDF header:", buffer.slice(0, 8).toString("ascii"));

    // Try 1: pdf-parse
    try {
      const data = await pdfParse(buffer);
      if (data.text && data.text.trim().length > 50) {
        console.log("pdf-parse ok:", data.text.length, "chars");
        return data.text;
      }
    } catch (e) {
      console.log("pdf-parse failed:", e.message);
    }

    // Try 1.5: pdfjs-dist legacy
    try {
      const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");
      pdfjs.GlobalWorkerOptions.workerSrc = "";
      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(buffer),
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
      });
      const pdf = await loadingTask.promise;
      const pageTexts = [];
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const tokenizedText = await page.getTextContent();
        const pageText = tokenizedText.items
          .map((token) => token.str)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        pageTexts.push(pageText);
      }
      const fullText = pageTexts.join("\n").trim();
      if (fullText.length > 50) {
        console.log("pdfjs-dist legacy ok:", fullText.length, "chars");
        return fullText;
      }
    } catch (e) {
      console.log("pdfjs-dist legacy failed:", e.message);
    }

    // Try 2: pdf2json
    try {
      const text = await new Promise((resolve, reject) => {
        const parser = new PDFParser(null, 1);
        parser.on("pdfParser_dataReady", () => {
          try {
            const raw = parser.getRawTextContent();
            const cleaned = raw
              .replace(/----------------Page[^\n]*/g, "\n")
              .replace(/\r\n/g, "\n")
              .replace(/[ \t]+/g, " ")
              .replace(/\n{3,}/g, "\n\n")
              .trim();
            resolve(cleaned);
          } catch (err) { reject(err); }
        });
        parser.on("pdfParser_dataError", (err) => reject(new Error(err.parserError || "pdf2json error")));
        parser.parseBuffer(buffer);
      });
      if (text && text.trim().length > 50) {
        console.log("pdf2json ok:", text.length, "chars");
        return text;
      }
    } catch (e) {
      console.log("pdf2json failed:", e.message);
    }

    // Try 3: BT/ET parenthesis extraction
    try {
      const str = buffer.toString("latin1");
      const words = [];
      const btMatches = str.match(/BT[\s\S]*?ET/g) || [];
      for (const block of btMatches) {
        const matches = block.match(/\(([^)]+)\)/g) || [];
        for (const m of matches) {
          const word = m.slice(1, -1)
            .replace(/\\n/g, "\n")
            .replace(/\\r/g, "")
            .replace(/\\\\/g, "\\")
            .replace(/[^\x20-\x7E\n]/g, "")
            .trim();
          if (word.length > 0) words.push(word);
        }
      }
      if (words.length < 10) {
        const allParens = str.match(/\(([^)]{1,200})\)/g) || [];
        for (const m of allParens) {
          const word = m.slice(1, -1)
            .replace(/[^\x20-\x7E\n]/g, "")
            .trim();
          if (word.length > 2 && !/^\d+$/.test(word)) words.push(word);
        }
      }
      if (words.length > 10) {
        const text = words.join(" ").replace(/\s+/g, " ").trim();
        console.log("Parenthesis extraction ok:", text.length, "chars");
        return text;
      }
    } catch (e) {
      console.log("Parenthesis extraction failed:", e.message);
    }

    // Try 4: zlib compressed streams
    try {
      const zlib = require("zlib");
      const str = buffer.toString("latin1");
      const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
      const texts = [];
      let match;
      while ((match = streamRegex.exec(str)) !== null) {
        try {
          const streamBuf = Buffer.from(match[1], "latin1");
          const decompressed = zlib.inflateSync(streamBuf).toString("utf8");
          const words = decompressed.match(/\(([^)]+)\)/g) || [];
          for (const w of words) {
            const clean = w.slice(1, -1).replace(/[^\x20-\x7E]/g, "").trim();
            if (clean.length > 1) texts.push(clean);
          }
        } catch (_) {}
      }
      if (texts.length > 10) {
        const text = texts.join(" ").replace(/\s+/g, " ").trim();
        console.log("Zlib stream extraction ok:", text.length, "chars");
        return text;
      }
    } catch (e) {
      console.log("Zlib extraction failed:", e.message);
    }

    // Try 5: aggressive ASCII extraction
    try {
      const str = buffer.toString("latin1");
      const lines = [];
      let current = "";
      for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        if (code >= 32 && code <= 126) {
          current += str[i];
        } else {
          if (current.length >= 3) {
            const trimmed = current.trim();
            if (
              trimmed.length > 2 &&
              !/^[\d\s.]+$/.test(trimmed) &&
              !/^[<>[\]{}\/]+$/.test(trimmed) &&
              !/^(Type|Page|Font|Width|Height|Length|Filter|Subtype|Resources|MediaBox|Contents|Parent|Kids|Count|Root|Info|ID|Prev|startxref|xref|trailer|obj|endobj|stream|endstream)$/.test(trimmed)
            ) {
              lines.push(trimmed);
            }
          }
          current = "";
        }
      }
      if (lines.length > 5) {
        const text = lines.join(" ").replace(/\s+/g, " ").replace(/[^\x20-\x7E]/g, "").trim();
        if (text.length > 100) {
          console.log("ASCII string extraction ok:", text.length, "chars");
          return text;
        }
      }
    } catch (e) {
      console.log("ASCII extraction failed:", e.message);
    }

    // Try 6: binary word extraction
    try {
      const str = buffer.toString("binary");
      const readable = str
        .replace(/[^\x20-\x7E\n\r]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && /[a-zA-Z]{2,}/.test(w))
        .join(" ");
      if (readable.length > 200) {
        console.log("Binary word extraction ok:", readable.length, "chars");
        return readable;
      }
    } catch (e) {
      console.log("Binary extraction failed:", e.message);
    }

    throw new Error("PDF could not be parsed. Please open in Chrome, print to PDF, and re-upload.");
  }

  // ── DOCX ─────────────────────────────────────────────────────────────────
  if (
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimetype === "application/msword" ||
    filePath.endsWith(".docx") ||
    filePath.endsWith(".doc")
  ) {
    try {
      const rawResult = await mammoth.extractRawText({ path: filePath });
      const rawText = rawResult.value?.trim() || "";

      const htmlResult = await mammoth.convertToHtml({ path: filePath });
      const html = htmlResult.value || "";

      const tableText = html
        .replace(/<tr>/gi, "\n")
        .replace(/<td[^>]*>/gi, " | ")
        .replace(/<th[^>]*>/gi, " | ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\s{2,}/g, " ")
        .trim();

      const combined = rawText + "\n\n" + tableText;
      if (combined.trim().length > 50) {
        console.log("DOCX parsed ok:", combined.length, "chars");
        return combined;
      }
    } catch (e) {
      throw new Error("Could not read DOCX file: " + e.message);
    }
    throw new Error("DOCX file appears to be empty.");
  }

  // ── JPG / PNG ─────────────────────────────────────────────────────────────
  if (
    ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(mimetype) ||
    filePath.endsWith(".jpg") ||
    filePath.endsWith(".jpeg") ||
    filePath.endsWith(".png")
  ) {
    try {
      console.log("Running OCR on image...");
      const { data } = await Tesseract.recognize(filePath, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            process.stdout.write("\rOCR progress: " + Math.round(m.progress * 100) + "%  ");
          }
        },
      });
      console.log("\nOCR complete:", data.text?.length, "chars");
      if (!data.text || data.text.trim().length < 20) {
        throw new Error("OCR extracted very little text — image may be low quality");
      }
      return data.text;
    } catch (e) {
      throw new Error("OCR failed: " + e.message);
    }
  }
}

async function analyzeResumeWithAI(resumeText, jobDescription, jobRole, preExtractedYears = 0) {
  const response = await getGroq().chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "You are a JSON-only API. Respond with ONLY a valid JSON object. No markdown, no backticks, no explanation.",
      },
      {
        role: "user",
        content:
          "You are a world-class expert recruiter who hires for ANY profession — technology, medicine, law, education, design, finance, hospitality, engineering, arts, and more.\n\n" +
          "SCORING GUIDE:\n" +
          "85-100: Excellent match — domain aligns well, strong relevant experience\n" +
          "70-84: Good match — solid relevant experience, minor gaps\n" +
          "55-69: Decent match — relevant background, some gaps\n" +
          "40-54: Partial match — limited relevant experience\n" +
          "20-39: Weak match — few relevant skills\n" +
          "0-19: Poor match — completely different domain\n\n" +
          "CRITICAL RULES:\n" +
          "- Works for ANY profession: tech, medical, legal, teaching, finance, design, culinary, engineering, arts, etc.\n" +
          "- ONLY list skills as MISSING if they are explicitly required in THIS specific JD\n" +
          "- NEVER add tech skills (React, Docker, AWS) as missing for non-tech roles like Doctor, Teacher, Chef\n" +
          "- NEVER add medical skills as missing for tech roles\n" +
          "- A candidate whose domain matches the JD must score minimum 60 if they have 2+ years experience\n" +
          "- matched_skills = skills from resume that match THIS JD requirements only\n" +
          "- missing_skills = skills explicitly in JD that are NOT in resume — domain-specific only\n" +
          "- interview_questions must be role-specific and relevant to the actual profession\n" +
          "- Score based on: domain match + experience depth + JD-specific skills only\n\n" +
          "EXPERIENCE LEVEL — assign strictly based on years:\n" +
          "- 0 to 1 year = Junior\n" +
          "- 2 to 4 years = Mid\n" +
          "- 5 to 8 years = Senior\n" +
          "- 9 or more years = Lead\n" +
          "- NEVER assign Junior to anyone with 2+ years\n" +
          "- NEVER assign Senior to anyone with less than 5 years\n\n" +
          "Extract from the resume:\n" +
          "- Full name (look at the very top — usually the first or largest line)\n" +
          "- email, phone\n" +
          "- All skills relevant to their profession\n" +
          "- Education (degree, institution)\n" +
          "- Certifications\n" +
          "- years_of_experience: extract from explicit date ranges only. If resume says '4+ years' use 4. If no dates exist, return 0. NEVER guess.\n" +
          "- Key strengths relevant to the role\n" +
          "- 3 smart interview questions specific to this candidate and role\n\n" +
          "Return ONLY this exact JSON, no markdown, no extra text:\n" +
          "{\n" +
          '  "score": 72,\n' +
          '  "experience_level": "Mid",\n' +
          '  "years_of_experience": 4,\n' +
          '  "name": "Full Name",\n' +
          '  "email": "email@example.com",\n' +
          '  "phone": "+1234567890",\n' +
          '  "matched_skills": ["Skill 1", "Skill 2"],\n' +
          '  "missing_skills": ["Only JD-required skills not in resume"],\n' +
          '  "all_skills": ["All skills found in resume"],\n' +
          '  "education": ["Degree - Institution (Year)"],\n' +
          '  "certifications": ["Certification name"],\n' +
          '  "strengths": ["Strength relevant to this role"],\n' +
          '  "summary": "Sentence about candidate strengths. Sentence about fit for this specific role.",\n' +
          '  "interview_questions": ["Role-specific question 1?", "Role-specific question 2?", "Role-specific question 3?"]\n' +
          "}\n\n" +
          "--- JOB ROLE ---\n" + (jobRole || "Not specified") + "\n\n" +
          "--- JOB DESCRIPTION ---\n" + jobDescription.slice(0, 2000) + "\n\n" +
          "--- RESUME ---\n" + resumeText.slice(0, 5000),
      },
    ],
    temperature: 0.1,
    max_tokens: 1200,
  });

  const raw = response.choices[0].message.content.trim();
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in AI response");

  const parsed = JSON.parse(jsonMatch[0]);
  const validLevels = ["Junior", "Mid", "Senior", "Lead"];

  // Only trust years if pre-extracted from actual resume text
  // Never trust AI guesses when no dates exist in resume
  let finalYears = 0;
  if (preExtractedYears > 0) {
    finalYears = preExtractedYears;
  }
  // If preExtractedYears is 0, finalYears stays 0 — AI cannot guess

  let expLevel;
  if (finalYears <= 1) {
    expLevel = "Junior";
  } else if (finalYears <= 4) {
    expLevel = "Mid";
  } else if (finalYears <= 8) {
    expLevel = "Senior";
  } else {
    expLevel = "Lead";
  }

  return {
    score: Math.min(100, Math.max(0, parseInt(parsed.score) || 0)),
    experience_level: expLevel,
    years_of_experience: finalYears,
    name: parsed.name || "",
    email: parsed.email || "",
    phone: parsed.phone || "",
    matched_skills: Array.isArray(parsed.matched_skills) ? parsed.matched_skills.slice(0, 15) : [],
    missing_skills: Array.isArray(parsed.missing_skills) ? parsed.missing_skills.slice(0, 10) : [],
    all_skills: Array.isArray(parsed.all_skills) ? parsed.all_skills.slice(0, 20) : [],
    education: Array.isArray(parsed.education) ? parsed.education.slice(0, 5) : [],
    certifications: Array.isArray(parsed.certifications) ? parsed.certifications.slice(0, 10) : [],
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 5) : [],
    summary: typeof parsed.summary === "string" ? parsed.summary : "Analysis complete.",
    interview_questions: Array.isArray(parsed.interview_questions) ? parsed.interview_questions.slice(0, 3) : [],
  };
}

function extractNameFallback(text, filename) {
  if (text && text.trim().length > 0) {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    for (const line of lines.slice(0, 20)) {
      const words = line.split(/\s+/);
      if (
        words.length >= 2 &&
        words.length <= 5 &&
        !/[@\d:/\\|•,;()\[\]]/.test(line) &&
        !/^(resume|cv|profile|summary|contact|phone|email|mobile|objective|address|linkedin|github|portfolio|skills|experience|education|certifications|references|projects|about|dear|to whom)/i.test(line) &&
        words.every((w) => /^[A-Za-z.'-]{1,20}$/.test(w))
      ) {
        return line;
      }
    }
  }

  return filename
    .replace(/\.(pdf|docx|doc|jpg|jpeg|png)$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\b(resume|cv|document|file|new|final|updated|\d+)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim() || "Unknown Candidate";
}

router.post("/", upload.array("resumes", 20), async (req, res) => {
  const { jobDescription, jobRole } = req.body;

  if (!req.files || req.files.length === 0)
    return res.status(400).json({ error: "No files uploaded." });
  if (!jobDescription || jobDescription.trim().length < 20)
    return res.status(400).json({ error: "Please provide a job description." });

  console.log("Processing " + req.files.length + " file(s)...");
  const results = [];

  for (const file of req.files) {
    console.log("Analyzing: " + file.originalname + " [" + file.mimetype + "]");
    try {
      const resumeText = await extractText(file.path, file.mimetype);

// Pre-extract years from resume text before AI
let preExtractedYears = 0;
const yearPatterns = [
  /(\d+)\+?\s*years?\s*(of\s*)?(experience|exp|work)/i,
  /experience[:\s]+(\d+)\+?\s*years?/i,
  /(\d{4})\s*[-–]\s*(\d{4}|present|current|now)/gi,
];

// Check explicit mention pattern
const explicitMatch = resumeText.match(/(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/i);
if (explicitMatch) {
  preExtractedYears = parseInt(explicitMatch[1]) || 0;
}

// Check date ranges like 2019-2023
if (preExtractedYears === 0) {
  const dateRanges = [...resumeText.matchAll(/(\d{4})\s*[-–to]+\s*(\d{4}|present|current|now)/gi)];
  if (dateRanges.length > 0) {
    let totalYears = 0;
    const currentYear = new Date().getFullYear();
    for (const range of dateRanges) {
      const startYear = parseInt(range[1]);
      const endYear = range[2].match(/present|current|now/i) ? currentYear : parseInt(range[2]);
      if (startYear >= 1990 && startYear <= currentYear) {
        totalYears += Math.max(0, endYear - startYear);
      }
    }
    preExtractedYears = Math.min(totalYears, 40);
  }
}

const analysis = await analyzeResumeWithAI(resumeText, jobDescription, jobRole, preExtractedYears);

      // Clean AI-extracted name
      const aiName = analysis.name
        ? analysis.name
            .replace(/^(name[:\s]*)/i, "")
            .replace(/[^a-zA-Z\s.'-]/g, "")
            .trim()
        : "";

      const name = aiName.length > 2 && aiName.split(" ").length >= 2
        ? aiName
        : extractNameFallback(resumeText, file.originalname);

      results.push({
        id: file.filename,
        name,
        filename: file.originalname,
        filetype: file.mimetype,
        email: analysis.email,
        phone: analysis.phone,
        score: analysis.score,
        experience_level: analysis.experience_level,
        years_of_experience: analysis.years_of_experience,
        matched_skills: analysis.matched_skills,
        missing_skills: analysis.missing_skills,
        all_skills: analysis.all_skills,
        education: analysis.education,
        certifications: analysis.certifications,
        strengths: analysis.strengths,
        summary: analysis.summary,
        interview_questions: analysis.interview_questions,
      });
    } catch (err) {
      console.error("Failed: " + file.originalname + " — " + err.message);
      results.push({
        id: file.filename,
        name: extractNameFallback("", file.originalname),
        filename: file.originalname,
        filetype: file.mimetype,
        email: "", phone: "",
        score: 0,
        experience_level: "Unknown",
        years_of_experience: 0,
        matched_skills: [], missing_skills: [], all_skills: [],
        education: [], certifications: [], strengths: [],
        summary: "Could not analyze: " + err.message,
        interview_questions: [],
        error: true,
      });
    } finally {
      try { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); } catch (_) {}
    }
  }

  results.sort((a, b) => b.score - a.score);

  try {
    const http = require("http");
    const recruiterId = req.headers["x-recruiter-id"] || "anonymous";
    const body = JSON.stringify({ candidates: results, jobRole: jobRole || "General", recruiterId });
    const reqOpts = {
      hostname: "127.0.0.1",
      port: process.env.PORT || 5000,
      path: "/dashboard/update",
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
    };
    const r = http.request(reqOpts);
    r.write(body);
    r.end();
  } catch (_) {}

  res.json({ candidates: results, total: results.length });
});

module.exports = router;