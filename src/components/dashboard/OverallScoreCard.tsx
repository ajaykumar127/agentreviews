'use client';

function scoreColor(score: number): string {
  if (score >= 90) return '#059669'; // emerald-600
  if (score >= 75) return '#22c55e'; // green-500
  if (score >= 60) return '#eab308'; // yellow-500
  if (score >= 40) return '#f97316'; // orange-500
  return '#dc2626'; // red-600
}

export default function OverallScoreCard({
  score,
  grade,
}: {
  score: number;
  grade: string;
}) {
  const color = scoreColor(score);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center">
      <h3 className="text-sm font-medium text-gray-500 mb-4">Overall Score</h3>
      <div className="relative w-36 h-36">
        <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>
            {score}
          </span>
          <span className="text-sm text-gray-500">/ 100</span>
        </div>
      </div>
      <div
        className="mt-3 text-lg font-bold px-3 py-1 rounded-full"
        style={{ color, backgroundColor: `${color}15` }}
      >
        Grade: {grade}
      </div>
    </div>
  );
}
