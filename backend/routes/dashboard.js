const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const DATA_FILE = path.join(__dirname, "../data/analytics.json");

function getEmptyAnalytics() {
  return {
    total_resumes: 0,
    total_analyses: 0,
    avg_score: 0,
    top_skills: {},
    recent_candidates: [],
    score_distribution: {
      "0-20": 0,
      "21-40": 0,
      "41-60": 0,
      "61-80": 0,
      "81-100": 0,
    },
    uploads_by_day: {},
    job_roles: {},
  };
}

function loadAnalytics() {
  try {
    if (!fs.existsSync(path.dirname(DATA_FILE))) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    }

    if (!fs.existsSync(DATA_FILE)) {
      const empty = { users: {} };
      fs.writeFileSync(DATA_FILE, JSON.stringify(empty, null, 2), "utf8");
      return empty;
    }

    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (e) {
    console.log("Analytics load error:", e.message);
    return { users: {} };
  }
}

function saveAnalytics(data) {
  try {
    if (!fs.existsSync(path.dirname(DATA_FILE))) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Analytics save error:", e.message);
  }
}

/* =========================================================
   GET DASHBOARD STATS
========================================================= */

router.get("/stats", (req, res) => {
  const { recruiterId } = req.query;

  const analytics = loadAnalytics();

  const userAnalytics =
    recruiterId && analytics.users?.[recruiterId]
      ? analytics.users[recruiterId]
      : getEmptyAnalytics();

  const topSkills = Object.entries(userAnalytics.top_skills)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([skill, count]) => ({ skill, count }));

  const today = new Date().toISOString().split("T")[0];

  const uploadsToday =
    userAnalytics.uploads_by_day[today] || 0;

  const jobRoles = Object.entries(userAnalytics.job_roles)
    .map(([title, data]) => ({
      title,
      count: data.count,
      resume_count: data.resume_count,
      avg_score:
        data.resume_count > 0
          ? Math.round(data.total_score / data.resume_count)
          : 0,
      top_candidate: data.top_candidate || null,
      last_analyzed: data.last_analyzed || null,
      batches: data.batches || [],
    }))
    .sort(
      (a, b) =>
        new Date(b.last_analyzed || 0) -
        new Date(a.last_analyzed || 0)
    );

  res.json({
    total_resumes: userAnalytics.total_resumes,
    total_analyses: userAnalytics.total_analyses,
    avg_score: Math.round(userAnalytics.avg_score),
    top_skills: topSkills,
    recent_candidates:
      userAnalytics.recent_candidates.slice(0, 20),
    score_distribution:
      userAnalytics.score_distribution,
    uploads_today: uploadsToday,
    job_roles: jobRoles,
  });
});

/* =========================================================
   UPDATE ANALYTICS
========================================================= */

router.post("/update", (req, res) => {
  const { candidates, jobRole, recruiterId } = req.body;

  if (!candidates || !Array.isArray(candidates)) {
    return res.status(400).json({
      error: "No candidates data",
    });
  }

  if (!recruiterId) {
    return res.status(400).json({
      error: "Recruiter ID required",
    });
  }

  const analytics = loadAnalytics();

  if (!analytics.users) {
    analytics.users = {};
  }

  if (!analytics.users[recruiterId]) {
    analytics.users[recruiterId] =
      getEmptyAnalytics();
  }

  const userAnalytics =
    analytics.users[recruiterId];

  const role = jobRole || "General";

  const today =
    new Date().toISOString().split("T")[0];

  const now = new Date().toISOString();

  userAnalytics.total_resumes += candidates.length;

  userAnalytics.total_analyses += 1;

  userAnalytics.uploads_by_day[today] =
    (userAnalytics.uploads_by_day[today] || 0) +
    candidates.length;

  if (!userAnalytics.job_roles[role]) {
    userAnalytics.job_roles[role] = {
      count: 0,
      resume_count: 0,
      total_score: 0,
      top_candidate: null,
      last_analyzed: null,
      batches: [],
    };
  }

  const roleData =
    userAnalytics.job_roles[role];

  roleData.count += 1;

  roleData.resume_count += candidates.length;

  roleData.last_analyzed = now;

  roleData.batches.unshift({
    date: today,
    time: now,
    count: candidates.length,
    avg_score: Math.round(
      candidates.reduce(
        (sum, c) => sum + (c.score || 0),
        0
      ) / candidates.length
    ),
    top_candidate:
      candidates[0]?.name || "Unknown",
  });

  roleData.batches =
    roleData.batches.slice(0, 10);

  const topCandidate = candidates.reduce(
    (best, c) => {
      if (
        !best ||
        (c.score || 0) > (best.score || 0)
      )
        return c;

      return best;
    },
    null
  );

  if (
    topCandidate &&
    (!roleData.top_candidate ||
      topCandidate.score >
        roleData.top_candidate.score)
  ) {
    roleData.top_candidate = {
      name: topCandidate.name,
      score: topCandidate.score,
      experience_level:
        topCandidate.experience_level,
      matched_skills:
        topCandidate.matched_skills?.slice(
          0,
          3
        ) || [],
    };
  }

  let scoreSum = 0;

  candidates.forEach((c) => {
    const score = c.score || 0;

    scoreSum += score;

    roleData.total_score += score;

    if (score <= 20)
      userAnalytics.score_distribution[
        "0-20"
      ]++;
    else if (score <= 40)
      userAnalytics.score_distribution[
        "21-40"
      ]++;
    else if (score <= 60)
      userAnalytics.score_distribution[
        "41-60"
      ]++;
    else if (score <= 80)
      userAnalytics.score_distribution[
        "61-80"
      ]++;
    else
      userAnalytics.score_distribution[
        "81-100"
      ]++;

    /* =========================================================
       UPDATED SKILL TRACKING
    ========================================================= */

    // Combine all professional skills
    const allSkills = [
      ...(c.matched_skills || []),
      ...(c.all_skills || []),
      ...(c.missing_skills || [])
    ];

    // Remove duplicates
    const uniqueSkills = [...new Set(allSkills)];

    uniqueSkills.forEach((skill) => {
      if (!skill || typeof skill !== "string") return;

      const cleanSkill = skill.trim();

      if (!cleanSkill) return;

      userAnalytics.top_skills[cleanSkill] =
        (userAnalytics.top_skills[cleanSkill] || 0) + 1;
    });

    userAnalytics.recent_candidates.unshift({
      name: c.name,
      score: score,
      experience_level:
        c.experience_level,
      filename: c.filename,
      job_role: role,
      time: now,
    });
  });

  userAnalytics.recent_candidates =
    userAnalytics.recent_candidates.slice(
      0,
      20
    );

  const totalScored =
    userAnalytics.total_resumes;

  userAnalytics.avg_score =
    (userAnalytics.avg_score *
      (totalScored - candidates.length) +
      scoreSum) /
    totalScored;

  saveAnalytics(analytics);

  res.json({ success: true });
});

/* =========================================================
   RESET ANALYTICS
========================================================= */

router.delete("/reset", (req, res) => {
  saveAnalytics({ users: {} });

  res.json({ success: true });
});

module.exports = router;