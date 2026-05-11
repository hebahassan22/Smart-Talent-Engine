const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "secret_dev_key";
const USERS_FILE = path.join(__dirname, "../data/users.json");

// Ensure data directory and file exist
function loadUsers() {
  try {
    if (!fs.existsSync(path.dirname(USERS_FILE))) {
      fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
    }
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, "[]", "utf8");
      return [];
    }
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
  } catch (e) {
    console.error("Failed to save users:", e.message);
  }
}

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "All fields required" });

  const users = loadUsers();
  const exists = users.find((u) => u.email === email);
  if (exists)
    return res.status(400).json({ error: "Email already registered" });

  const hashed = await bcrypt.hash(password, 10);
  const user = { id: Date.now(), name, email, password: hashed, role: "recruiter" };
  users.push(user);
  saveUsers(users);

  const token = jwt.sign(
    { id: user.id, email, name, role: "recruiter" },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
  res.json({ token, user: { id: user.id, name, email, role: "recruiter" } });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  const users = loadUsers();
  const user = users.find((u) => u.email === email);
  if (!user)
    return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid)
    return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { id: user.id, email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
  res.json({ token, user: { id: user.id, name: user.name, email, role: user.role } });
});

router.get("/me", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "No token" });
  try {
    const decoded = jwt.verify(auth.split(" ")[1], JWT_SECRET);
    res.json({ user: decoded });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

module.exports = router;