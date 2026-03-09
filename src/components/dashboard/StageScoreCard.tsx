import type { ReviewStage } from '@/lib/analysis/types';

interface StageScoreCardProps {
  stage: ReviewStage;
  score: number;
  label: string;
}

export default function StageScoreCard({ stage, score, label }: StageScoreCardProps) {
  const getColorClasses = () => {
    switch (stage) {
      case 'designSetup':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-900',
          score: 'text-blue-600',
        };
      case 'configuration':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          text: 'text-purple-900',
          score: 'text-purple-600',
        };
      case 'test':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-900',
          score: 'text-green-600',
        };
      case 'deploy':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-900',
          score: 'text-orange-600',
        };
      case 'monitor':
        return {
          bg: 'bg-pink-50',
          border: 'border-pink-200',
          text: 'text-pink-900',
          score: 'text-pink-600',
        };
      case 'data':
        return {
          bg: 'bg-indigo-50',
          border: 'border-indigo-200',
          text: 'text-indigo-900',
          score: 'text-indigo-600',
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-900',
          score: 'text-gray-600',
        };
    }
  };

  const colors = getColorClasses();
  const gradeColor = score >= 90 ? 'text-green-600' : score >= 75 ? 'text-blue-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className={`${colors.bg} rounded-lg border-2 ${colors.border} p-4 transition-all hover:shadow-md`}>
      <div className={`text-sm font-medium ${colors.text} mb-2`}>{label}</div>
      <div className={`text-4xl font-bold ${colors.score} mb-1`}>{score}</div>
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">/ 100</div>
        <div className={`text-sm font-semibold ${gradeColor}`}>
          {score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F'}
        </div>
      </div>
    </div>
  );
}
