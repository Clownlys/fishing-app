import type { FishingScore } from '../types';

interface Props {
  score: FishingScore;
  size?: number;
}

/** 钓鱼指数环形仪表盘 */
export default function ScoreCircle({ score, size = 180 }: Props) {
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score.total / 100);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* 背景环 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={stroke}
          />
          {/* 进度环 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={score.color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        {/* 中心数字 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold" style={{ color: score.color }}>
            {score.total}
          </span>
          <span className="text-lg font-semibold mt-1" style={{ color: score.color }}>
            {score.label}
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-500 mt-3 max-w-xs text-center leading-relaxed">
        {score.advice}
      </p>
    </div>
  );
}
