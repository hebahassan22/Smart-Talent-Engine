import { useRef, useState, useCallback } from 'react'
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react'

export default function UploadZone({ files, setFiles }) {
  const inputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

  const addFiles = useCallback((incoming) => {
    const allowed = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "image/jpeg",
  "image/jpg",
  "image/png",
];
const allowedExts = [".pdf", ".docx", ".doc", ".jpg", ".jpeg", ".png"];

const pdfs = Array.from(incoming).filter((f) => {
  const ext = "." + f.name.split(".").pop().toLowerCase();
  return allowed.includes(f.type) || allowedExts.includes(ext);
});
    if (pdfs.length === 0) return
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size))
      const unique = pdfs.filter((f) => !existing.has(f.name + f.size))
      return [...prev, ...unique].slice(0, 20)
    })
  }, [setFiles])

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ${
          isDragging ? 'drop-active' : 'border-border hover:border-neon/40 hover:bg-neon-glow'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />

        <div className="flex flex-col items-center gap-3 pointer-events-none">
          <div className={`p-4 rounded-full border-2 transition-colors duration-300 ${
            isDragging ? 'border-neon bg-neon-glow' : 'border-border'
          }`}>
            <Upload size={28} className={isDragging ? 'text-neon' : 'text-gray-500'} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-200 font-display">
              DROP RESUMES HERE
            </p>
            <p className="text-xs text-gray-600 font-body">
              PDF · DOCX · JPG · PNG
            </p>
            <p className="mt-1 text-xs text-gray-500 font-body">
              PDF · DOCX · JPG · PNG · Up to 20 files · 15MB each
            </p>
          </div>
          <span className="px-3 py-1 text-xs text-gray-400 border rounded-full bg-panel border-border font-body">
            or click to browse
          </span>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs tracking-wider text-gray-400 uppercase font-display">
              {files.length} Resume{files.length !== 1 ? 's' : ''} Queued
            </p>
            <button
              onClick={() => setFiles([])}
              className="text-xs text-gray-500 transition-colors hover:text-red-400 font-body"
            >
              Clear all
            </button>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {files.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 transition-all duration-200 border rounded-lg bg-panel border-border hover:border-neon/30 animate-fade-in group"
              >
                <FileText size={16} className="text-neon shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 truncate font-body">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
                <CheckCircle size={14} className="text-neon-dim shrink-0" />
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                  className="text-gray-600 transition-colors opacity-0 hover:text-red-400 group-hover:opacity-100"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
