import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Users, TrendingUp, Award, Zap, Brain, FileText,
  Bell, ChevronDown, Search, RefreshCw, LogOut, LayoutDashboard,
} from "lucide-react";
import { getDashboardStats } from "../../api/dashboard";
import { useAuth } from "../../context/AuthContext";

const COLORS = ["#F97316", "#3B82F6", "#8B5CF6", "#EC4899", "#10B981"];

function StatCard({ icon: Icon, label, value, sub, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="p-5 transition-all duration-300 border bg-panel border-border rounded-2xl hover:border-neon/40 hover:shadow-neon"
      style={{ background: "rgba(17,17,42,0.8)", backdropFilter: "blur(12px)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 border rounded-lg bg-neon/10 border-neon/20">
          <Icon size={18} className="text-neon" />
        </div>
        <span className="text-xs tracking-widest text-gray-500 font-display">{label}</span>
      </div>
      <p className="text-3xl font-bold text-gray-100 font-display">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-500 font-body">{sub}</p>}
    </motion.div>
  );
}

export default function DashboardPage({ onStartAnalysis }) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState("overview");
  const [showNotifs, setShowNotifs] = useState(false);
  const [selectedRole, setSelectedRole] = useState("all");

  // Compute skills filtered by selected job role
  const filteredSkills = useMemo(() => {
    if (!stats?.top_skills) return [];
    if (selectedRole === "all") return stats.top_skills;

    // Get candidates from this role
    const roleCandidates = stats.recent_candidates?.filter(
      (c) => c.job_role === selectedRole
    ) || [];

    // If no candidates for this role, show all skills
    if (roleCandidates.length === 0) return stats.top_skills;

    // Get role's top candidate skills
    const role = stats.job_roles?.find((r) => r.title === selectedRole);
    const roleSkills = role?.top_candidate?.matched_skills || [];

    if (roleSkills.length === 0) return stats.top_skills;

    // Filter top_skills to only those in this role
    const roleSkillSet = new Set(roleSkills.map((s) => s.toLowerCase()));
    const filtered = stats.top_skills.filter((s) =>
      roleSkillSet.has(s.skill.toLowerCase())
    );

    return filtered.length > 0 ? filtered : stats.top_skills;
  }, [selectedRole, stats]);
  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await getDashboardStats(user?.id);
      setStats(data);
    } catch (e) {
      setStats({
        total_resumes: 0, total_analyses: 0, avg_score: 0,
        top_skills: [], recent_candidates: [], uploads_today: 0,
        score_distribution: { "0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0 },
        job_roles: [],
      });
    }
    setLoading(false);
  };

  useEffect(() => {
  if (user?.id) {
    fetchStats();
  } else {
    setStats({
      total_resumes: 0,
      total_analyses: 0,
      avg_score: 0,
      top_skills: [],
      recent_candidates: [],
      uploads_today: 0,
      score_distribution: {
        "0-20": 0,
        "21-40": 0,
        "41-60": 0,
        "61-80": 0,
        "81-100": 0,
      },
      job_roles: [],
    });
  }
}, [user?.id]);

  const scoreData = stats
    ? Object.entries(stats.score_distribution).map(([range, count]) => ({ range, count }))
    : [];

  const filteredCandidates = stats?.recent_candidates?.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="flex min-h-screen grid-bg" style={{ background: "#06060F" }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className={`${sidebarOpen ? "w-56" : "w-16"} shrink-0 border-r border-border transition-all duration-300 flex flex-col sticky top-0 h-screen`}
        style={{ background: "rgba(6,6,15,0.98)", backdropFilter: "blur(20px)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="p-1.5 rounded-lg bg-neon/10 border border-neon/20 shrink-0">
            <Zap size={16} className="text-neon" />
          </div>
          {sidebarOpen && (
            <div>
              <p className="text-xs font-bold tracking-wider text-gray-100 font-display">Smart Talent Engine</p>
              <p className="text-gray-600" style={{ fontSize: 9 }}>Recruitment AI</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {[
            { id: "overview", icon: LayoutDashboard, label: "Overview" },
            { id: "analyses", icon: Brain, label: "Analyses" },
            { id: "candidates", icon: Users, label: "Candidates" },
            { id: "analytics", icon: TrendingUp, label: "Analytics" },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActivePage(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                activePage === id
                  ? "bg-neon/10 border border-neon/20 text-neon"
                  : "text-gray-500 hover:text-gray-300 hover:bg-surface"
              }`}
            >
              <Icon size={16} className="shrink-0" />
              {sidebarOpen && (
                <span className="text-xs tracking-wide font-display">{label.toUpperCase()}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Collapse */}
        <div className="p-3 border-t border-border">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center justify-center w-full p-2 text-gray-600 transition-all rounded-xl hover:text-neon hover:bg-surface"
          >
            <ChevronDown
              size={14}
              className={`transition-transform ${sidebarOpen ? "rotate-90" : "-rotate-90"}`}
            />
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Top Navbar */}
        <nav
          className="sticky top-0 z-50 border-b border-border"
          style={{ background: "rgba(6,6,15,0.95)", backdropFilter: "blur(20px)" }}
        >
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="text-sm font-bold text-gray-100 font-display">
                {activePage === "overview" && "Recruiter Dashboard"}
                {activePage === "analyses" && "Job Roles & Analyses"}
                {activePage === "candidates" && "All Candidates"}
                {activePage === "analytics" && "Analytics & Insights"}
              </h2>
              <p className="text-xs text-gray-500 font-body">
                {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative hidden md:block">
                <Search size={14} className="absolute text-gray-500 -translate-y-1/2 left-3 top-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search candidates..."
                  className="w-48 py-2 pl-8 pr-4 text-xs text-gray-300 placeholder-gray-600 border rounded-xl font-body bg-panel border-border focus:outline-none focus:border-neon/40"
                />
              </div>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="relative p-2 transition-colors border rounded-xl border-border hover:border-neon/30"
                >
                  <Bell size={16} className="text-gray-400" />
                  {stats?.recent_candidates?.length > 0 && (
                    <span className="absolute w-2 h-2 rounded-full top-1 right-1 bg-neon" />
                  )}
                </button>
                {showNotifs && (
                  <div
                    className="absolute right-0 z-50 border top-12 w-72 rounded-2xl border-border shadow-card"
                    style={{ background: "rgba(17,17,42,0.98)", backdropFilter: "blur(20px)" }}
                  >
                    <div className="flex items-center justify-between p-4 border-b border-border">
                      <p className="text-xs tracking-widest text-gray-400 font-display">NOTIFICATIONS</p>
                      <span className="text-xs bg-neon/10 text-neon border border-neon/20 px-2 py-0.5 rounded-full font-display">
                        {stats?.recent_candidates?.length || 0}
                      </span>
                    </div>
                    <div className="overflow-y-auto max-h-64">
                      {stats?.recent_candidates?.length > 0 ? (
                        stats.recent_candidates.slice(0, 8).map((c, i) => (
                          <div key={i} className="p-3 transition-colors border-b border-border hover:bg-surface">
                            <p className="text-xs text-gray-300 font-body">
                              <span className="text-neon font-display">{c.name}</span> analyzed
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-gray-600">{c.job_role || "General"}</span>
                              <span className="text-xs font-display" style={{ color: c.score >= 70 ? "#F97316" : "#EF4444" }}>
                                {c.score}%
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-xs text-center text-gray-600 font-body">No notifications yet</div>
                      )}
                    </div>
                    <div className="p-3 text-center border-t border-border">
                      <button onClick={() => setShowNotifs(false)} className="text-xs text-gray-500 transition-colors hover:text-neon font-display">
                        CLOSE
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 px-3 py-2 transition-colors border cursor-pointer rounded-xl border-border hover:border-neon/30">
                <div className="flex items-center justify-center border rounded-full w-7 h-7 bg-neon/20 border-neon/30">
                  <span className="text-xs font-bold font-display text-neon">
                    {user?.name?.[0]?.toUpperCase() || "R"}
                  </span>
                </div>
                <span className="hidden text-xs text-gray-300 font-body md:block">{user?.name || "Recruiter"}</span>
                <ChevronDown size={12} className="text-gray-500" />
              </div>

              <button onClick={logout} className="p-2 text-gray-500 transition-colors border rounded-xl border-border hover:border-red-500/30 hover:text-red-400">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </nav>

        {/* ── Page Content ──────────────────────────────────────────────── */}
        <div className="flex-1 p-6 space-y-6 overflow-auto">

          {/* OVERVIEW */}
          {activePage === "overview" && (
            <>
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-100 font-display">
                  Welcome back, <span className="text-neon">{user?.name?.split(" ")[0] || "Recruiter"}</span>
                </h1>
                <div className="flex items-center gap-3">
                  <button onClick={fetchStats} className="p-2 text-gray-500 transition-colors border rounded-xl border-border hover:border-neon/30 hover:text-neon">
                    <RefreshCw size={16} />
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={onStartAnalysis}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-display text-xs font-bold tracking-wider bg-neon text-black hover:shadow-neon transition-all"
                  >
                    <Zap size={14} /> NEW ANALYSIS
                  </motion.button>
                </div>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatCard icon={FileText} label="RESUMES" value={stats?.total_resumes || 0} sub="Total uploaded" delay={0} />
                <StatCard icon={Brain} label="ANALYSES" value={stats?.total_analyses || 0} sub="Sessions run" delay={0.1} />
                <StatCard icon={TrendingUp} label="AVG SCORE" value={(stats?.avg_score || 0) + "%"} sub="Compatibility" delay={0.2} />
                <StatCard icon={Award} label="TODAY" value={stats?.uploads_today || 0} sub="Resumes today" delay={0.3} />
              </div>

              {/* Charts */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
                className="p-6 border rounded-2xl border-border"
                style={{ background: "rgba(17,17,42,0.8)", backdropFilter: "blur(12px)" }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs tracking-widest text-gray-400 font-display">MOST COMMON SKILLS</h3>
                  {stats?.job_roles?.length > 0 && (
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="px-2 py-1 text-xs text-gray-300 border rounded-lg font-body border-border focus:outline-none focus:border-neon/40"
                      style={{ background: "#0F0F1A" }}
                    >
                      <option value="all">All Roles</option>
                      {stats.job_roles.map((r) => (
                        <option key={r.title} value={r.title}>{r.title}</option>
                      ))}
                    </select>
                  )}
                </div>
                {filteredSkills.length > 0 ? (
                  <div className="space-y-2">
                    {filteredSkills.map((s, i) => (
                      <div key={s.skill} className="flex items-center gap-3">
                        <span className="w-24 text-xs text-gray-400 truncate font-body">{s.skill}</span>
                        <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(s.count / filteredSkills[0].count) * 100}%` }}
                            transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                            className="h-full rounded-full"
                            style={{ background: COLORS[i % COLORS.length] }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 font-display">{s.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center text-xs text-gray-600 h-44 font-body">
                    No skill data yet
                  </div>
                )}
              </motion.div>
              {/* Recent Candidates */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                className="p-6 border rounded-2xl border-border"
                style={{ background: "rgba(17,17,42,0.8)", backdropFilter: "blur(12px)" }}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xs tracking-widest text-gray-400 font-display">RECENT CANDIDATE ACTIVITY</h3>
                  <button onClick={onStartAnalysis} className="text-xs transition-colors font-display text-neon hover:text-neon-dim">
                    + NEW ANALYSIS
                  </button>
                </div>
                {filteredCandidates.length > 0 ? (
                  <div className="space-y-2">
                    {filteredCandidates.map((c, i) => (
                      <motion.div key={i}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-4 p-3 transition-all border rounded-xl border-border hover:border-neon/20"
                      >
                        <div className="flex items-center justify-center w-8 h-8 border rounded-full bg-neon/10 border-neon/20 shrink-0">
                          <span className="text-xs font-display text-neon">{c.name?.[0]?.toUpperCase() || "?"}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-200 truncate font-body">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.job_role || "General"} · {c.experience_level}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold font-display" style={{ color: c.score >= 70 ? "#F97316" : c.score >= 50 ? "#F59E0B" : "#EF4444" }}>
                            {c.score}%
                          </p>
                          <p className="text-xs text-gray-600">{new Date(c.time).toLocaleTimeString()}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <Brain size={32} className="mx-auto mb-3 text-gray-700" />
                    <p className="text-sm text-gray-600 font-body">No analyses yet</p>
                    <button onClick={onStartAnalysis} className="mt-4 text-xs text-neon font-display hover:underline">
                      Run your first analysis →
                    </button>
                  </div>
                )}
              </motion.div>

              
            </>
          )}

          {/* ANALYSES PAGE */}
          {activePage === "analyses" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs tracking-widest text-gray-400 font-display">
                  JOB ROLES & BATCH HISTORY ({stats?.job_roles?.length || 0} roles)
                </h3>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={onStartAnalysis}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-black rounded-xl font-display bg-neon">
                  <Zap size={12} /> NEW ANALYSIS
                </motion.button>
              </div>

              {stats?.job_roles?.length > 0 ? (
                <div className="space-y-4">
                  {stats.job_roles.map((role, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      className="overflow-hidden border rounded-2xl border-border"
                      style={{ background: "rgba(17,17,42,0.8)" }}>

                      {/* Role Header */}
                      <div className="flex items-center justify-between p-5 border-b border-border">
                        <div className="flex items-center gap-3">
                          <div className="p-2 border rounded-xl bg-neon/10 border-neon/20">
                            <Brain size={16} className="text-neon" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-100 font-display">{role.title}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-gray-500 font-body">
                                {role.resume_count} resume{role.resume_count !== 1 ? "s" : ""}
                              </span>
                              <span className="text-xs text-gray-600">·</span>
                              <span className="text-xs text-gray-500 font-body">
                                {role.count} session{role.count !== 1 ? "s" : ""}
                              </span>
                              <span className="text-xs text-gray-600">·</span>
                              <span className="text-xs text-gray-500 font-body">
                                Avg: <span className="text-neon">{role.avg_score}%</span>
                              </span>
                              {role.last_analyzed && (
                                <>
                                  <span className="text-xs text-gray-600">·</span>
                                  <span className="text-xs text-gray-600 font-body">
                                    {new Date(role.last_analyzed).toLocaleDateString()}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <button onClick={onStartAnalysis}
                          className="px-4 py-2 text-xs text-gray-500 transition-all border rounded-xl border-border font-display hover:text-neon hover:border-neon/30">
                          ANALYZE AGAIN →
                        </button>
                      </div>

                      {/* Top Candidate */}
                      {role.top_candidate && (
                        <div className="px-5 py-3 border-b border-border bg-neon/5">
                          <p className="mb-2 text-xs tracking-widest text-gray-500 font-display">🏆 TOP CANDIDATE</p>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 border rounded-full bg-neon/20 border-neon/30">
                              <span className="text-xs font-bold font-display text-neon">
                                {role.top_candidate.name?.[0]?.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-200 font-body">{role.top_candidate.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-gray-500">{role.top_candidate.experience_level}</span>
                                <div className="flex gap-1">
                                  {role.top_candidate.matched_skills?.map((s, si) => (
                                    <span key={si} className="text-xs px-1.5 py-0.5 rounded bg-neon/10 border border-neon/20 text-neon font-body">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <span className="text-lg font-bold font-display text-neon">{role.top_candidate.score}%</span>
                          </div>
                        </div>
                      )}

                      {/* Batch History */}
                      {role.batches?.length > 0 && (
                        <div className="p-5">
                          <p className="mb-3 text-xs tracking-widest text-gray-500 font-display">BATCH HISTORY</p>
                          <div className="space-y-2">
                            {role.batches.map((batch, bi) => (
                              <div key={bi}
                                className="flex items-center justify-between p-3 transition-all border rounded-xl border-border hover:border-neon/20">
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-neon/60 shrink-0" />
                                  <div>
                                    <p className="text-xs text-gray-300 font-body">
                                      {batch.count} resume{batch.count !== 1 ? "s" : ""} uploaded
                                    </p>
                                    <p className="text-xs text-gray-600 font-body">Top: {batch.top_candidate}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-display text-neon">{batch.avg_score}% avg</p>
                                  <p className="text-xs text-gray-600 font-body">
                                    {new Date(batch.time).toLocaleDateString()} {new Date(batch.time).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center border rounded-2xl border-border"
                  style={{ background: "rgba(17,17,42,0.8)" }}>
                  <Brain size={40} className="mx-auto mb-4 text-gray-700" />
                  <p className="mb-2 text-sm text-gray-500 font-body">No analyses yet</p>
                  <p className="mb-6 text-xs text-gray-700 font-body">Run your first analysis to see job role history</p>
                  <button onClick={onStartAnalysis}
                    className="px-6 py-2.5 rounded-xl bg-neon text-black font-display text-xs font-bold">
                    START ANALYSIS
                  </button>
                </div>
              )}
            </div>
          )}

          {/* CANDIDATES PAGE */}
          {activePage === "candidates" && (
            <div className="space-y-4">
              <h3 className="text-xs tracking-widest text-gray-400 font-display">
                RECENT CANDIDATES ({filteredCandidates.length})
              </h3>
              {filteredCandidates.length > 0 ? (
                <div className="overflow-hidden border rounded-2xl border-border"
                  style={{ background: "rgba(17,17,42,0.8)" }}>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        {["Candidate", "Job Role", "Level", "Score", "Time"].map((h) => (
                          <th key={h} className="px-4 py-3 text-xs tracking-widest text-left text-gray-500 font-display">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCandidates.map((c, i) => (
                        <motion.tr key={i}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                          className="transition-colors border-b border-border hover:bg-surface">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center justify-center border rounded-full w-7 h-7 bg-neon/10 border-neon/20">
                                <span className="text-xs font-display text-neon">{c.name?.[0]?.toUpperCase()}</span>
                              </div>
                              <span className="text-sm text-gray-200 font-body">{c.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-gray-400 font-body">{c.job_role || "General"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 text-xs text-gray-400 border rounded-full border-border font-body">
                              {c.experience_level}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-bold font-display"
                              style={{ color: c.score >= 70 ? "#F97316" : c.score >= 50 ? "#F59E0B" : "#EF4444" }}>
                              {c.score}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600 font-body">
                            {new Date(c.time).toLocaleString()}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-20 text-center border rounded-2xl border-border"
                  style={{ background: "rgba(17,17,42,0.8)" }}>
                  <Users size={40} className="mx-auto mb-4 text-gray-700" />
                  <p className="text-sm text-gray-500 font-body">No candidates yet</p>
                  <button onClick={onStartAnalysis} className="px-6 py-2.5 mt-4 text-xs font-bold text-black rounded-xl bg-neon font-display">
                    RUN ANALYSIS
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ANALYTICS PAGE */}
          {activePage === "analytics" && (
            <div className="space-y-6">
              <h3 className="text-xs tracking-widest text-gray-400 font-display">ANALYTICS & INSIGHTS</h3>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatCard icon={FileText} label="TOTAL RESUMES" value={stats?.total_resumes || 0} delay={0} />
                <StatCard icon={Brain} label="ANALYSES" value={stats?.total_analyses || 0} delay={0.1} />
                <StatCard icon={TrendingUp} label="AVG SCORE" value={(stats?.avg_score || 0) + "%"} delay={0.2} />
                <StatCard icon={Award} label="TODAY" value={stats?.uploads_today || 0} delay={0.3} />
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="p-6 border rounded-2xl border-border" style={{ background: "rgba(17,17,42,0.8)" }}>
                  <h3 className="mb-4 text-xs tracking-widest text-gray-400 font-display">SCORE DISTRIBUTION</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={scoreData}>
                      <XAxis dataKey="range" tick={{ fill: "#4B5563", fontSize: 10 }} />
                      <YAxis tick={{ fill: "#4B5563", fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: "#0F0F1A", border: "1px solid #1E1E3A", borderRadius: 8, fontSize: 11 }} />
                      <Bar dataKey="count" fill="#F97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="p-6 border rounded-2xl border-border" style={{ background: "rgba(17,17,42,0.8)" }}>
                  <h3 className="mb-4 text-xs tracking-widest text-gray-400 font-display">TOP SKILLS</h3>
                  {stats?.top_skills?.length > 0 ? (
                    <div className="space-y-2">
                      {stats.top_skills.map((s, i) => (
                        <div key={s.skill} className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 truncate w-28 font-body">{s.skill}</span>
                          <div className="flex-1 h-2 overflow-hidden rounded-full bg-border">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(s.count / stats.top_skills[0].count) * 100}%` }}
                              transition={{ delay: i * 0.1, duration: 0.8 }}
                              className="h-full rounded-full"
                              style={{ background: COLORS[i % COLORS.length] }}
                            />
                          </div>
                          <span className="w-6 text-xs text-gray-500 font-display">{s.count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center text-xs text-gray-600 h-44">No data yet</div>
                  )}
                </div>
              </div>

              {/* Job Roles Summary */}
              {stats?.job_roles?.length > 0 && (
                <div className="p-6 border rounded-2xl border-border" style={{ background: "rgba(17,17,42,0.8)" }}>
                  <h3 className="mb-4 text-xs tracking-widest text-gray-400 font-display">JOB ROLE BREAKDOWN</h3>
                  <div className="space-y-3">
                    {stats.job_roles.map((role, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 border rounded-xl border-border">
                        <div className="flex-1">
                          <p className="text-sm text-gray-200 font-body">{role.title}</p>
                          <p className="text-xs text-gray-500">{role.resume_count} resumes · {role.count} sessions</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold font-display text-neon">{role.avg_score}%</p>
                          <p className="text-xs text-gray-600">avg score</p>
                        </div>
                        <div className="w-24 h-1.5 overflow-hidden rounded-full bg-border">
                          <div className="h-full rounded-full bg-neon" style={{ width: role.avg_score + "%" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}