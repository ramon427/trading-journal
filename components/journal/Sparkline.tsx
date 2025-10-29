interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showDots?: boolean;
}

export function Sparkline({ 
  data, 
  width = 100, 
  height = 30, 
  color = 'currentColor',
  showDots = false 
}: SparklineProps) {
  if (data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1 || 1)) * width;
    const y = height - ((value - min) / range) * height;
    return { x, y };
  });

  const pathD = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  const isPositiveTrend = data[data.length - 1] >= data[0];

  return (
    <svg 
      width={width} 
      height={height} 
      className="overflow-visible"
      style={{ color: isPositiveTrend ? 'rgb(34 197 94)' : 'rgb(239 68 68)' }}
    >
      <path
        d={pathD}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      {showDots && points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r="2"
          fill="currentColor"
          opacity="0.6"
        />
      ))}
    </svg>
  );
}
