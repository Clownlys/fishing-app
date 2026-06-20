interface Props {
  values: number[];
  labels?: string[];
  height?: number;
}

/** 气压趋势 SVG 折线图 */
export default function PressureChart({ values, labels, height = 120 }: Props) {
  if (values.length === 0) return null;

  const width = 320;
  const padding = { top: 15, bottom: 25, left: 35, right: 15 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const yPad = range * 0.15;

  const points = values.map((v, i) => {
    const x = padding.left + (chartW / (values.length - 1 || 1)) * i;
    const y = padding.top + chartH * (1 - (v - min + yPad) / (range + yPad * 2));
    return { x, y, value: v };
  });

  const pathD = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
  ).join(' ');

  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${padding.top + chartH} L ${padding.left} ${padding.top + chartH} Z`;

  // 中间值线
  const midVal = (min + max) / 2;
  const midY = padding.top + chartH * (1 - (midVal - min + yPad) / (range + yPad * 2));

  // 当前点（最后一个）
  const current = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: height }}>
      <defs>
        <linearGradient id="pressureGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* 中线 */}
      <line x1={padding.left} y1={midY} x2={width - padding.right} y2={midY}
        stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth={1} />
      <text x={padding.left - 5} y={midY + 4} textAnchor="end"
        fill="#94a3b8" fontSize="10">{midVal.toFixed(0)}</text>

      {/* 区域填充 */}
      <path d={areaD} fill="url(#pressureGrad)" />

      {/* 折线 */}
      <path d={pathD} fill="none" stroke="#0284c7" strokeWidth={2}
        strokeLinejoin="round" strokeLinecap="round" />

      {/* 当前点 */}
      <circle cx={current.x} cy={current.y} r={4} fill="#0284c7" />
      <circle cx={current.x} cy={current.y} r={8} fill="#0284c7" opacity={0.15} />

      {/* 当前值标签 */}
      <rect x={current.x - 22} y={current.y - 24} width={44} height={16} rx={4}
        fill="#0284c7" />
      <text x={current.x} y={current.y - 12} textAnchor="middle"
        fill="white" fontSize="11" fontWeight="600">
        {current.value.toFixed(0)}
      </text>

      {/* Y轴标签 */}
      <text x={padding.left - 5} y={padding.top + 8} textAnchor="end"
        fill="#94a3b8" fontSize="10">{(max + yPad * 0.5).toFixed(0)}</text>
      <text x={padding.left - 5} y={padding.top + chartH} textAnchor="end"
        fill="#94a3b8" fontSize="10">{(min - yPad * 0.5).toFixed(0)}</text>

      {/* X轴标签 */}
      {labels && labels.length > 0 && (
        <>
          <text x={padding.left} y={height - 8} textAnchor="middle"
            fill="#94a3b8" fontSize="10">{labels[0]}</text>
          <text x={width / 2} y={height - 8} textAnchor="middle"
            fill="#94a3b8" fontSize="10">{labels[Math.floor(labels.length / 2)]}</text>
          <text x={width - padding.right} y={height - 8} textAnchor="middle"
            fill="#94a3b8" fontSize="10">{labels[labels.length - 1]}</text>
        </>
      )}
    </svg>
  );
}
