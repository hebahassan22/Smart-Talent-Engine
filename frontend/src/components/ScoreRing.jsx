export default function ScoreRing({ score, size = 80 }) {
  const radius = 38
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const getColor = (s) => {
    if (s >= 80) return '#00FF85'
    if (s >= 60) return '#00CC6A'
    if (s >= 40) return '#F59E0B'
    return '#EF4444'
  }

  const color = getColor(score)

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 90 90">
        {/* Track */}
        <circle
          cx="45" cy="45" r={radius}
          fill="none"
          stroke="#1A2E1F"
          strokeWidth="6"
        />
        {/* Fill */}
        <circle
          cx="45" cy="45" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 45 45)"
          className="score-ring"
          style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-base font-bold" style={{ color }}>
          {score}
        </span>
        <span className="text-gray-600" style={{ fontSize: 8 }}>SCORE</span>
      </div>
    </div>
  )
}
