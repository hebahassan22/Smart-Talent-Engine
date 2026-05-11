import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, TrendingUp, Award, ChevronUp, ChevronDown, Search, Filter, Download, X } from "lucide-react";
import CandidateCard from "./ranking/CandidateCard";

const LEVEL_ORDER = { Lead: 4, Senior: 3, Mid: 2, Junior: 1, Unknown: 0 };
const ITEMS_PER_PAGE = 10;

export default function ResultsDashboard({ data }) {
  const { candidates, total } = data;

  const [viewMode, setViewMode] = useState("table");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("score");
  const [sortDir, setSortDir] = useState("desc");
  const [filters, setFilters] = useState({
    level: "All",
    minScore: 0,
    maxScore: 100,
    skill: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const avgScore = Math.round(candidates.reduce((s, c) => s + c.score, 0) / candidates.length);
  const topScore = candidates[0]?.score || 0;

  const allSkills = useMemo(() => {
    const set = new Set();
    candidates.forEach((c) => c.matched_skills?.forEach((s) => set.add(s)));
    return ["", ...Array.from(set)].slice(0, 20);
  }, [candidates]);

  const levels = ["All", "Lead", "Senior", "Mid", "Junior"];

  const filtered = useMemo(() => {
    let list = [...candidates];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.matched_skills?.some((s) => s.toLowerCase().includes(q)) ||
          c.summary?.toLowerCase().includes(q)
      );
    }

    if (filters.level !== "All") {
      list = list.filter((c) => c.experience_level === filters.level);
    }

    list = list.filter(
      (c) => c.score >= filters.minScore && c.score <= filters.maxScore
    );

    if (filters.skill) {
      list = list.filter((c) =>
        c.matched_skills?.some((s) =>
          s.toLowerCase().includes(filters.skill.toLowerCase())
        )
      );
    }

    list.sort((a, b) => {
      let aVal, bVal;
      switch (sortKey) {
        case "score": aVal = a.score; bVal = b.score; break;
        case "experience": aVal = a.years_of_experience; bVal = b.years_of_experience; break;
        case "level": aVal = LEVEL_ORDER[a.experience_level] || 0; bVal = LEVEL_ORDER[b.experience_level] || 0; break;
        case "name": aVal = a.name?.toLowerCase(); bVal = b.name?.toLowerCase();
          return sortDir === "asc" ? aVal?.localeCompare(bVal) : bVal?.localeCompare(aVal);
        default: aVal = a.score; bVal = b.score;
      }
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });

    return list;
  }, [candidates, search, filters, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filters, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <ChevronUp size={10} className="text-gray-700" />;
    return sortDir === "asc"
      ? <ChevronUp size={10} className="text-neon" />
      : <ChevronDown size={10} className="text-neon" />;
  };

  const exportCSV = () => {
    const headers = ["Rank", "Name", "Email", "Score", "Level", "Years Exp", "Matched Skills", "Missing Skills", "Summary"];
    const rows = filtered.map((c, i) => [
      i + 1,
      c.name || "",
      c.email || "",
      c.score,
      c.experience_level || "",
      c.years_of_experience || 0,
      (c.matched_skills || []).join("; "),
      (c.missing_skills || []).join("; "),
      '"' + (c.summary ? c.summary.replace(/"/g, "'") : "") + '"',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => String(cell)).join(","))
      .join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "ranked_candidates_" + new Date().toISOString().split("T")[0] + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "#00C853";
    if (score >= 60) return "#F97316";
    if (score >= 40) return "#F59E0B";
    return "#EF4444";
  };

  const getLevelColor = (level) => {
    switch (level) {
      case "Lead": return "text-purple-400 bg-purple-400/10 border-purple-400/30";
      case "Senior": return "text-neon bg-neon/10 border-neon/30";
      case "Mid": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
      case "Junior": return "text-blue-400 bg-blue-400/10 border-blue-400/30";
      default: return "text-gray-400 bg-gray-400/10 border-gray-400/30";
    }
  };

  // Pagination component
  const Pagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
        <p className="text-xs text-gray-500 font-body">
          Page {currentPage} of {totalPages} · {filtered.length} candidates
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="px-2 py-1 text-xs text-gray-500 transition-all border rounded-lg border-border font-display hover:text-neon hover:border-neon/30 disabled:opacity-30 disabled:cursor-not-allowed"
          >«</button>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 text-xs text-gray-500 transition-all border rounded-lg border-border font-display hover:text-neon hover:border-neon/30 disabled:opacity-30 disabled:cursor-not-allowed"
          >‹ PREV</button>

          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) pageNum = i + 1;
              else if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-display transition-all ${
                    currentPage === pageNum
                      ? "bg-neon text-black"
                      : "border border-border text-gray-500 hover:border-neon/30 hover:text-neon"
                  }`}
                >{pageNum}</button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-xs text-gray-500 transition-all border rounded-lg border-border font-display hover:text-neon hover:border-neon/30 disabled:opacity-30 disabled:cursor-not-allowed"
          >NEXT ›</button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-2 py-1 text-xs text-gray-500 transition-all border rounded-lg border-border font-display hover:text-neon hover:border-neon/30 disabled:opacity-30 disabled:cursor-not-allowed"
          >»</button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-slide-up">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Users, label: "TOTAL", value: total },
          { icon: TrendingUp, label: "AVG SCORE", value: avgScore + "%" },
          { icon: Award, label: "TOP SCORE", value: topScore + "%" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="p-4 text-center border rounded-xl border-border"
            style={{ background: "rgba(17,17,42,0.8)" }}>
            <Icon size={18} className="mx-auto mb-2 text-neon" />
            <p className="text-lg font-bold text-gray-100 font-display">{value}</p>
            <p className="text-xs text-gray-500 font-body mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute text-gray-500 -translate-y-1/2 left-3 top-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, skill, summary..."
            className="w-full py-2 pl-8 pr-4 text-xs text-gray-300 placeholder-gray-600 border rounded-xl font-body border-border focus:outline-none focus:border-neon/40"
            style={{ background: "rgba(17,17,42,0.8)" }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute text-gray-500 -translate-y-1/2 right-3 top-1/2 hover:text-neon">
              <X size={12} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-display border transition-all ${
            showFilters ? "border-neon/40 text-neon bg-neon/10" : "border-border text-gray-400 hover:border-neon/30"
          }`}
        >
          <Filter size={12} /> FILTERS
        </button>

        <div className="flex overflow-hidden border rounded-xl border-border">
          {["table", "cards"].map((mode) => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={`px-3 py-2 text-xs font-display transition-all ${
                viewMode === mode ? "bg-neon text-black" : "text-gray-500 hover:text-gray-300"
              }`}>
              {mode.toUpperCase()}
            </button>
          ))}
        </div>

        <button onClick={exportCSV}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-display border border-border text-gray-400 hover:border-neon/30 hover:text-neon transition-all">
          <Download size={12} /> EXPORT CSV
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-4 p-4 border rounded-2xl border-border md:grid-cols-4"
          style={{ background: "rgba(17,17,42,0.8)" }}>
          <div>
            <p className="mb-2 text-xs tracking-widest text-gray-500 font-display">LEVEL</p>
            <div className="flex flex-wrap gap-1">
              {levels.map((l) => (
                <button key={l} onClick={() => setFilters((f) => ({ ...f, level: l }))}
                  className={`text-xs px-2 py-1 rounded-lg border font-display transition-all ${
                    filters.level === l ? "bg-neon text-black border-neon" : "border-border text-gray-400 hover:border-neon/30"
                  }`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs tracking-widest text-gray-500 font-display">MIN SCORE: {filters.minScore}%</p>
            <input type="range" min={0} max={100} step={5} value={filters.minScore}
              onChange={(e) => setFilters((f) => ({ ...f, minScore: +e.target.value }))}
              className="w-full accent-orange-500" />
          </div>

          <div>
            <p className="mb-2 text-xs tracking-widest text-gray-500 font-display">MAX SCORE: {filters.maxScore}%</p>
            <input type="range" min={0} max={100} step={5} value={filters.maxScore}
              onChange={(e) => setFilters((f) => ({ ...f, maxScore: +e.target.value }))}
              className="w-full accent-orange-500" />
          </div>

          <div>
            <p className="mb-2 text-xs tracking-widest text-gray-500 font-display">SKILL</p>
            <select value={filters.skill}
              onChange={(e) => setFilters((f) => ({ ...f, skill: e.target.value }))}
              className="w-full px-2 py-1.5 rounded-lg text-xs font-body border border-border text-gray-300 focus:outline-none focus:border-neon/40"
              style={{ background: "#0F0F1A" }}>
              <option value="">All Skills</option>
              {allSkills.filter(Boolean).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end col-span-2 md:col-span-4">
            <button onClick={() => setFilters({ level: "All", minScore: 0, maxScore: 100, skill: "" })}
              className="text-xs text-gray-500 transition-colors hover:text-neon font-display">
              RESET FILTERS
            </button>
          </div>
        </motion.div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-xs tracking-widest text-gray-500 font-display">
          SHOWING {filtered.length} OF {total} CANDIDATES
          {totalPages > 1 && ` · PAGE ${currentPage}/${totalPages}`}
        </p>
        {filtered.length !== total && (
          <button onClick={() => { setSearch(""); setFilters({ level: "All", minScore: 0, maxScore: 100, skill: "" }); }}
            className="text-xs text-neon font-display hover:underline">
            CLEAR ALL FILTERS
          </button>
        )}
      </div>

      {/* TABLE VIEW */}
      {viewMode === "table" && (
        <div className="overflow-hidden border rounded-2xl border-border"
          style={{ background: "rgba(17,17,42,0.8)" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {[
                    { label: "RANK", key: null },
                    { label: "CANDIDATE", key: "name" },
                    { label: "SCORE", key: "score" },
                    { label: "LEVEL", key: "level" },
                    { label: "YRS EXP", key: "experience" },
                    { label: "TOP SKILLS", key: null },
                    { label: "AI JUSTIFICATION", key: null },
                    { label: "GAPS", key: null },
                  ].map(({ label, key }) => (
                    <th key={label} onClick={() => key && handleSort(key)}
                      className={`px-4 py-3 text-left text-xs font-display tracking-widest text-gray-500 whitespace-nowrap ${key ? "cursor-pointer hover:text-gray-300 select-none" : ""}`}>
                      <div className="flex items-center gap-1">
                        {label}
                        {key && <SortIcon col={key} />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((c, i) => {
                  const globalRank = (currentPage - 1) * ITEMS_PER_PAGE + i;
                  return (
                    <motion.tr key={c.id || i}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`border-b border-border transition-colors hover:bg-surface ${
                        globalRank === 0 ? "border-l-2 border-l-neon" :
                        globalRank === 1 ? "border-l-2 border-l-gray-400" :
                        globalRank === 2 ? "border-l-2 border-l-amber-600" : ""
                      }`}
                    >
                      {/* Rank */}
                      <td className="px-4 py-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-display font-bold ${
                          globalRank === 0 ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" :
                          globalRank === 1 ? "bg-gray-400/20 text-gray-300 border border-gray-400/30" :
                          globalRank === 2 ? "bg-amber-700/20 text-amber-600 border border-amber-700/30" :
                          "bg-surface text-gray-500 border border-border"
                        }`}>
                          {globalRank + 1}
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-8 h-8 border rounded-full bg-neon/10 border-neon/20 shrink-0">
                            <span className="text-xs font-display text-neon">{c.name?.[0]?.toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-sm text-gray-200 font-body whitespace-nowrap">{c.name}</p>
                            {c.email && <p className="text-xs text-gray-600 truncate max-w-32">{c.email}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Score */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-10 h-10 border-2 rounded-full"
                            style={{ borderColor: getScoreColor(c.score) }}>
                            <span className="text-xs font-bold font-display" style={{ color: getScoreColor(c.score) }}>
                              {c.score}
                            </span>
                          </div>
                          <div className="w-16 h-1 overflow-hidden rounded-full bg-border">
                            <div className="h-full rounded-full" style={{ width: c.score + "%", background: getScoreColor(c.score) }} />
                          </div>
                        </div>
                      </td>

                      {/* Level */}
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full border font-body whitespace-nowrap ${getLevelColor(c.experience_level)}`}>
                          {c.experience_level}
                        </span>
                      </td>

                      {/* Years */}
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-300 font-display">
                          {c.years_of_experience || 0}y
                        </span>
                      </td>

                      {/* Skills */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-48">
                          {c.matched_skills?.slice(0, 3).map((s, si) => (
                            <span key={si} className="text-xs px-1.5 py-0.5 rounded bg-neon/10 border border-neon/20 text-neon font-body whitespace-nowrap">
                              {s}
                            </span>
                          ))}
                          {c.matched_skills?.length > 3 && (
                            <span className="text-xs text-gray-500">+{c.matched_skills.length - 3}</span>
                          )}
                        </div>
                      </td>

                      {/* AI Justification — top 5 only */}
                      <td className="max-w-xs px-4 py-3">
                        {globalRank < 5 ? (
                          <p className="text-xs leading-relaxed text-gray-400 font-body line-clamp-2">{c.summary}</p>
                        ) : (
                          <span className="text-xs italic text-gray-600 font-body">Top 5 only</span>
                        )}
                      </td>

                      {/* Gaps */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 max-w-36">
                          {c.missing_skills?.length > 0 ? (
                            <>
                              {c.missing_skills.slice(0, 2).map((s, si) => (
                                <span key={si} className="text-xs px-1.5 py-0.5 rounded bg-red-500/5 border border-red-500/20 text-red-400/80 font-body whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                                  {s}
                                </span>
                              ))}
                              {c.missing_skills.length > 2 && (
                                <span className="text-xs text-gray-600">+{c.missing_skills.length - 2} more</span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-neon font-body">No gaps ✓</span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-sm text-gray-600 font-body">No candidates match your filters</p>
                <button onClick={() => { setSearch(""); setFilters({ level: "All", minScore: 0, maxScore: 100, skill: "" }); }}
                  className="mt-3 text-xs text-neon font-display hover:underline">
                  CLEAR FILTERS
                </button>
              </div>
            )}
          </div>

          {/* Pagination inside table */}
          <Pagination />
        </div>
      )}

      {/* CARDS VIEW */}
      {viewMode === "cards" && (
        <div className="space-y-3">
          {paginated.map((candidate, index) => (
            <CandidateCard
              key={candidate.id || index}
              candidate={candidate}
              rank={(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
              showFullSummary={(currentPage - 1) * ITEMS_PER_PAGE + index < 5}
            />
          ))}
          {filtered.length === 0 && (
            <div className="py-16 text-center border rounded-2xl border-border"
              style={{ background: "rgba(17,17,42,0.8)" }}>
              <p className="text-sm text-gray-600 font-body">No candidates match your filters</p>
            </div>
          )}
          {/* Pagination for cards */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-xs text-gray-500 transition-all border rounded-xl border-border font-display hover:text-neon hover:border-neon/30 disabled:opacity-30">
                ‹ PREV
              </button>
              <span className="text-xs text-gray-500 font-display">
                {currentPage} / {totalPages}
              </span>
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-xs text-gray-500 transition-all border rounded-xl border-border font-display hover:text-neon hover:border-neon/30 disabled:opacity-30">
                NEXT ›
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}