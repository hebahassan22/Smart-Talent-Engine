import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Award, CheckCircle, XCircle, MessageSquare, BookOpen, Star } from "lucide-react";
import ScoreRing from "../ScoreRing";

const LEVEL_COLORS = {
  Junior: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  Mid: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  Senior: "text-neon bg-neon-glow border-neon/30",
  Lead: "text-purple-400 bg-purple-400/10 border-purple-400/30",
  Unknown: "text-gray-400 bg-gray-400/10 border-gray-400/30",
};

export default function CandidateCard({ candidate, rank }) {
  const [expanded, setExpanded] = useState(rank <= 3);
  const [tab, setTab] = useState("skills");

  const levelCls = LEVEL_COLORS[candidate.experience_level] || LEVEL_COLORS.Unknown;
  const rankCls = rank === 1 ? "rank-1" : rank === 2 ? "rank-2" : rank === 3 ? "rank-3" : "bg-panel text-gray-400 border border-border";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (rank - 1) * 0.07 }}
      className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
        rank <= 3 ? "border-neon/30 shadow-neon" : "border-border hover:border-neon/20"
      }`}
      style={{ background: "rgba(17,17,42,0.8)", backdropFilter: "blur(12px)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 p-5 cursor-pointer select-none" onClick={() => setExpanded((v) => !v)}>
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-display font-bold shrink-0 ${rankCls}`}>
          {rank <= 3 ? <Award size={14} /> : rank}
        </div>

        <ScoreRing score={candidate.score} size={70} />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-gray-100 truncate font-display">{candidate.name || "Unknown"}</h3>
            {rank === 1 && <span className="text-xs px-2 py-0.5 rounded-full bg-neon text-black font-display font-bold">TOP PICK</span>}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-body ${levelCls}`}>{candidate.experience_level}</span>
            {candidate.years_of_experience > 0 && (
              <span className="text-xs text-gray-500 font-body">{candidate.years_of_experience}y exp</span>
            )}
            {candidate.email && <span className="text-xs text-gray-600 font-body truncate max-w-[160px]">{candidate.email}</span>}
          </div>
          <p className="text-xs text-gray-400 mt-1.5 font-body line-clamp-2 leading-relaxed">{candidate.summary}</p>
        </div>

        <button className="text-gray-500 transition-colors hover:text-neon shrink-0">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="p-5 space-y-4">
              {/* Tab Bar */}
              <div className="flex gap-1 p-1 border bg-surface rounded-xl border-border">
                {[
                  { id: "skills", label: "Skills", icon: CheckCircle },
                  { id: "profile", label: "Profile", icon: BookOpen },
                  { id: "interview", label: "Interview", icon: MessageSquare },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-display tracking-wide transition-all ${
                      tab === id ? "bg-neon text-black" : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    <Icon size={11} /> {label.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Skills Tab */}
              {tab === "skills" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="flex items-center gap-1 mb-2 text-xs tracking-widest text-gray-400 uppercase font-display">
                        <CheckCircle size={10} className="text-neon" /> Matched
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {candidate.matched_skills?.length > 0
                          ? candidate.matched_skills.map((s, i) => (
                              <span key={i} className="px-2 py-1 text-xs border rounded-md bg-neon/10 border-neon/20 text-neon font-body">{s}</span>
                            ))
                          : <span className="text-xs text-gray-600">None detected</span>}
                      </div>
                    </div>
                    <div>
                      <p className="flex items-center gap-1 mb-2 text-xs tracking-widest text-gray-400 uppercase font-display">
                        <XCircle size={10} className="text-red-400" /> Gaps
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {candidate.missing_skills?.length > 0
                          ? candidate.missing_skills.map((s, i) => (
                              <span key={i} className="px-2 py-1 text-xs border rounded-md bg-red-500/5 border-red-500/20 text-red-400/80 font-body">{s}</span>
                            ))
                          : <span className="text-xs text-gray-600">No major gaps</span>}
                      </div>
                    </div>
                  </div>

                  {candidate.strengths?.length > 0 && (
                    <div>
                      <p className="flex items-center gap-1 mb-2 text-xs tracking-widest text-gray-400 uppercase font-display">
                        <Star size={10} className="text-yellow-400" /> Strengths
                      </p>
                      <div className="space-y-1">
                        {candidate.strengths.map((s, i) => (
                          <p key={i} className="flex items-start gap-2 text-xs text-gray-400 font-body">
                            <span className="text-neon mt-0.5">▸</span> {s}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Score bar */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-500 font-display">COMPATIBILITY</span>
                      <span className="text-xs font-display text-neon">{candidate.score}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-border overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: candidate.score + "%" }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="h-full rounded-full bg-gradient-to-r from-neon-dim to-neon"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Profile Tab */}
              {tab === "profile" && (
                <div className="space-y-4">
                  {candidate.education?.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs tracking-widest text-gray-400 uppercase font-display">Education</p>
                      {candidate.education.map((e, i) => (
                        <p key={i} className="flex items-start gap-2 mb-1 text-xs text-gray-400 font-body">
                          <span className="text-blue-400 mt-0.5">▸</span> {e}
                        </p>
                      ))}
                    </div>
                  )}
                  {candidate.certifications?.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs tracking-widest text-gray-400 uppercase font-display">Certifications</p>
                      <div className="flex flex-wrap gap-1.5">
                        {candidate.certifications.map((c, i) => (
                          <span key={i} className="px-2 py-1 text-xs text-purple-400 border rounded-md bg-purple-500/10 border-purple-500/20 font-body">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {candidate.all_skills?.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs tracking-widest text-gray-400 uppercase font-display">All Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {candidate.all_skills.map((s, i) => (
                          <span key={i} className="px-2 py-1 text-xs text-gray-400 border rounded-md bg-surface border-border font-body">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {candidate.phone && (
                    <p className="text-xs text-gray-500 font-body">📞 {candidate.phone}</p>
                  )}
                </div>
              )}

              {/* Interview Tab */}
              {tab === "interview" && (
                <div className="space-y-3">
                  <p className="text-xs tracking-widest text-gray-400 uppercase font-display">AI-Generated Interview Questions</p>
                  {candidate.interview_questions?.length > 0
                    ? candidate.interview_questions.map((q, i) => (
                        <div key={i} className="p-3 border rounded-xl border-border bg-surface">
                          <p className="text-xs leading-relaxed text-gray-400 font-body">
                            <span className="mr-2 text-neon font-display">Q{i + 1}.</span>{q}
                          </p>
                        </div>
                      ))
                    : <p className="text-xs text-gray-600 font-body">No interview questions generated.</p>}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}