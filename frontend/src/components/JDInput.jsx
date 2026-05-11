import { FileText } from 'lucide-react'

const SAMPLE_JD = `We are looking for a Senior Full-Stack Engineer with 4+ years of experience.

Required Skills:
- Strong proficiency in React, Node.js, and TypeScript
- Experience with RESTful API design and PostgreSQL
- Familiarity with Docker, AWS, and CI/CD pipelines
- Ability to write clean, tested, maintainable code

Nice to Have:
- Experience with GraphQL or tRPC
- Knowledge of Redis for caching
- Background in Agile/Scrum environments

You will work on building scalable web applications, collaborate with product designers, and mentor junior engineers.`

export default function JDInput({ value, onChange }) {
  const charCount = value.length
  const minChars = 50

  return (
    <div className="space-y-3">
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste your Job Description here..."
          rows={10}
          className="w-full bg-panel border border-border rounded-xl p-4 text-sm text-gray-200 placeholder-gray-600 font-body resize-none focus:outline-none focus:border-neon/60 focus:shadow-neon-sm transition-all duration-200 leading-relaxed"
        />
        <div className="absolute bottom-3 right-3 text-xs font-display text-gray-600">
          {charCount} chars
        </div>
      </div>

      {charCount < minChars && charCount > 0 && (
        <p className="text-xs text-yellow-500/70 font-body">
          ⚠ Add more detail for better analysis ({minChars - charCount} more chars)
        </p>
      )}

      {charCount === 0 && (
        <button
          onClick={() => onChange(SAMPLE_JD)}
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-neon transition-colors font-body"
        >
          <FileText size={12} />
          Load sample JD for demo
        </button>
      )}
    </div>
  )
}
