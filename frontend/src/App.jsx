import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, RotateCcw, AlertCircle, LayoutDashboard, Search } from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthPage from "./components/auth/AuthPage";
import DashboardPage from "./components/dashboard/DashboardPage";
import UploadZone from "./components/UploadZone";
import JDInput from "./components/JDInput";
import ResultsDashboard from "./components/ResultsDashboard";
import LoadingState from "./components/LoadingState";
import { rankResumes } from "./api/rank";

function MainApp() {
  const { user } = useAuth();
  const [page, setPage] = useState("dashboard");
  const [files, setFiles] = useState([]);
  const [jobDescription, setJobDescription] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    setPage("dashboard");
    setFiles([]);
    setJobDescription("");
    setJobRole("");
    setLoading(false);
    setUploadProgress(0);
    setResults(null);
    setError(null);
  }, [user?.id]);

  if (!user) return <AuthPage />;

  const canSubmit = files.length > 0 && jobDescription.trim().length >= 50 && !loading;

  const handleAnalyze = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setUploadProgress(0);
    try {
      const data = await rankResumes({ files, jobDescription, jobRole, onProgress: setUploadProgress, recruiterId: user?.id });
      setResults(data);
      setPage("results");
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFiles([]); setJobDescription(""); setJobRole("");
    setResults(null); setError(null); setUploadProgress(0);
    setPage("dashboard");
  };

  if (page === "dashboard" && !loading) {
    return <DashboardPage onStartAnalysis={() => setPage("analyze")} />;
  }

  return (
    <div className="relative z-10 min-h-screen grid-bg" style={{ background: "#06060F" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border"
        style={{ background: "rgba(6,6,15,0.95)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center justify-between max-w-6xl px-6 py-4 mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-neon/10 border border-neon/20">
              <Zap size={18} className="text-neon" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wide text-gray-100 font-display">SMART TALENT ENGINE</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-neon animate-pulse-neon" />
              <span className="text-xs text-gray-400 font-display">SEMANTIC AI ACTIVE</span>
            </div>
            <button onClick={() => setPage("dashboard")}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-neon transition-colors font-body border border-border hover:border-neon/30 rounded-lg px-3 py-1.5">
              <LayoutDashboard size={12} /> Dashboard
            </button>
            {results && (
              <button onClick={handleReset}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-neon transition-colors font-body border border-border hover:border-neon/30 rounded-lg px-3 py-1.5">
                <RotateCcw size={12} /> New Analysis
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl px-6 py-10 mx-auto">
        <AnimatePresence mode="wait">
          {!results && !loading && (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
              <div className="space-y-3 text-center">
                <h2 className="text-3xl font-bold leading-tight text-gray-100 font-display">
                  Beyond Keyword Matching.<br /><span className="text-neon">Understand Real Talent.</span>
                </h2>
              </div>

              {/* Job Role Input */}
              <div className="max-w-sm mx-auto">
                <input
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  placeholder="Job Role"
                  className="w-full px-4 py-3 text-sm text-center text-gray-200 placeholder-gray-600 border rounded-xl bg-panel border-border focus:outline-none focus:border-neon/40 font-body"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="p-6 space-y-4 border rounded-2xl border-border"
                  style={{ background: "rgba(17,17,42,0.8)", backdropFilter: "blur(12px)" }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs tracking-widest text-gray-400 uppercase font-display">01 · RESUMES</span>
                    {files.length > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-neon/10 text-neon border border-neon/20">{files.length} ready</span>}
                  </div>
                  <UploadZone files={files} setFiles={setFiles} />
                </div>

                <div className="p-6 space-y-4 border rounded-2xl border-border"
                  style={{ background: "rgba(17,17,42,0.8)", backdropFilter: "blur(12px)" }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs tracking-widest text-gray-400 uppercase font-display">02 · JOB DESCRIPTION</span>
                    {jobDescription.length >= 50 && <span className="text-xs px-2 py-0.5 rounded-full bg-neon/10 text-neon border border-neon/20">✓ ready</span>}
                  </div>
                  <JDInput value={jobDescription} onChange={setJobDescription} />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-3 p-4 text-red-400 border rounded-xl bg-red-500/5 border-red-500/20">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <p className="text-sm font-body">{error}</p>
                </div>
              )}

              <div className="text-center">
                <motion.button
                  whileHover={{ scale: canSubmit ? 1.03 : 1 }}
                  whileTap={{ scale: canSubmit ? 0.97 : 1 }}
                  onClick={handleAnalyze}
                  disabled={!canSubmit}
                  className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-display text-sm font-bold tracking-wider transition-all duration-300 ${
                    canSubmit ? "bg-neon text-black hover:shadow-neon" : "bg-border text-gray-600 cursor-not-allowed"
                  }`}
                >
                  <Zap size={16} />
                  ANALYZE {files.length > 0 ? `${files.length} RESUME${files.length > 1 ? "S" : ""}` : "RESUMES"}
                </motion.button>
              </div>
            </motion.div>
          )}

         {loading && (<motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><LoadingState uploadProgress={uploadProgress} files={files} /> 
         </motion.div>
          )}
          {results && !loading && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-100 font-display">Analysis Complete</h2>
                <p className="mt-1 text-sm text-gray-400 font-body">{results.total} candidate{results.total !== 1 ? "s" : ""} ranked by semantic compatibility</p>
              </div>
              <ResultsDashboard data={results} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-6 mt-20 text-center border-t border-border">
        <p className="text-xs tracking-widest text-gray-600 font-display">SMART TALENT ENGINE</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}