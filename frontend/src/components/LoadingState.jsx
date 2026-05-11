import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Loader, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoadingState({ uploadProgress, files = [] }) {
  const [fileStatuses, setFileStatuses] = useState([]);
  const [globalStage, setGlobalStage] = useState(0);
  const [dots, setDots] = useState("");

  const STAGES = [
    "Uploading files to server...",
    "Extracting text from resumes...",
    "Running semantic AI analysis...",
    "Ranking candidates by compatibility...",
    "Generating AI summaries...",
  ];

  useEffect(() => {
    // Initialize file statuses
    if (files.length > 0) {
      setFileStatuses(
        files.map((f) => ({
          name: f.name,
          size: f.size,
          status: "waiting", // waiting | uploading | parsing | analyzing | done | error
          message: "Waiting...",
        }))
      );
    }
  }, [files]);

  useEffect(() => {
    // Animate global stage
    const stageTimer = setInterval(() => {
      setGlobalStage((i) => Math.min(i + 1, STAGES.length - 1));
    }, 2500);

    // Animate dots
    const dotTimer = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 400);

    // Animate per-file statuses
    if (files.length > 0) {
      files.forEach((f, i) => {
        // Upload phase
        setTimeout(() => {
          setFileStatuses((prev) =>
            prev.map((fs, idx) =>
              idx === i ? { ...fs, status: "uploading", message: "Uploading..." } : fs
            )
          );
        }, i * 300);

        // Parsing phase
        setTimeout(() => {
          setFileStatuses((prev) =>
            prev.map((fs, idx) =>
              idx === i ? { ...fs, status: "parsing", message: "Extracting text..." } : fs
            )
          );
        }, 1500 + i * 600);

        // Analyzing phase
        setTimeout(() => {
          setFileStatuses((prev) =>
            prev.map((fs, idx) =>
              idx === i ? { ...fs, status: "analyzing", message: "AI analyzing..." } : fs
            )
          );
        }, 3000 + i * 800);

        // Done phase
        setTimeout(() => {
          setFileStatuses((prev) =>
            prev.map((fs, idx) =>
              idx === i ? { ...fs, status: "done", message: "Analysis complete ✓" } : fs
            )
          );
        }, 5000 + i * 1000);
      });
    }

    return () => {
      clearInterval(stageTimer);
      clearInterval(dotTimer);
    };
  }, [files]);

  const getStatusColor = (status) => {
    switch (status) {
      case "done": return "text-neon";
      case "error": return "text-red-400";
      case "analyzing": return "text-yellow-400";
      case "parsing": return "text-blue-400";
      case "uploading": return "text-purple-400";
      default: return "text-gray-600";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "done": return <CheckCircle size={14} className="text-neon" />;
      case "error": return <XCircle size={14} className="text-red-400" />;
      case "waiting": return <div className="w-3.5 h-3.5 rounded-full border border-gray-700" />;
      default: return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader size={14} className={getStatusColor(status)} />
        </motion.div>
      );
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case "done": return "border-neon/20 bg-neon/5";
      case "error": return "border-red-500/20 bg-red-500/5";
      case "analyzing": return "border-yellow-400/20 bg-yellow-400/5";
      case "parsing": return "border-blue-400/20 bg-blue-400/5";
      case "uploading": return "border-purple-400/20 bg-purple-400/5";
      default: return "border-border";
    }
  };

  const doneCount = fileStatuses.filter((f) => f.status === "done").length;

  return (
    <div className="max-w-2xl py-10 mx-auto space-y-8">
      {/* Main spinner + stage */}
      <div className="flex flex-col items-center gap-5">
        <div className="relative w-20 h-20">
          <svg className="w-full h-full animate-spin" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#1E1E3A" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="42"
              fill="none" stroke="#F97316" strokeWidth="6"
              strokeLinecap="round" strokeDasharray="80 184"
              style={{ filter: "drop-shadow(0 0 8px #F97316)" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-display text-neon">AI</span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm tracking-wider font-display text-neon">
            {STAGES[globalStage]}{dots}
          </p>
          <p className="mt-1 text-xs text-gray-600 font-body">
            {doneCount} of {files.length} resume{files.length !== 1 ? "s" : ""} processed
          </p>
        </div>

        {/* Upload progress bar */}
        {uploadProgress < 100 && (
          <div className="w-64 space-y-1">
            <div className="flex justify-between text-xs text-gray-500 font-display">
              <span>UPLOADING</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-border">
              <motion.div
                className="h-full rounded-full bg-neon"
                initial={{ width: 0 }}
                animate={{ width: uploadProgress + "%" }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Stage progress dots */}
        <div className="flex gap-2">
          {STAGES.map((_, i) => (
            <motion.div
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${
                i <= globalStage ? "bg-neon w-6" : "bg-border w-2"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Per-file status list */}
      {fileStatuses.length > 0 && (
        <div className="overflow-hidden border rounded-2xl border-border"
          style={{ background: "rgba(17,17,42,0.8)", backdropFilter: "blur(12px)" }}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <p className="text-xs tracking-widest text-gray-400 font-display">PROCESSING LOG</p>
            <span className="text-xs font-display text-neon">
              {doneCount}/{fileStatuses.length} COMPLETE
            </span>
          </div>

          <div className="overflow-y-auto divide-y divide-border max-h-72">
            <AnimatePresence>
              {fileStatuses.map((file, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex items-center gap-4 px-5 py-3 transition-all border-l-2 ${
                    file.status === "done" ? "border-l-neon" :
                    file.status === "analyzing" ? "border-l-yellow-400" :
                    file.status === "parsing" ? "border-l-blue-400" :
                    file.status === "uploading" ? "border-l-purple-400" :
                    "border-l-transparent"
                  }`}
                >
                  <FileText size={14} className="text-gray-500 shrink-0" />

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-300 truncate font-body">{file.name}</p>
                    <p className={`text-xs font-display mt-0.5 ${getStatusColor(file.status)}`}>
                      {file.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-600 font-body">
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                    {getStatusIcon(file.status)}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}