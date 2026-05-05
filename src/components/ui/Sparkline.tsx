import { memo } from 'react';

interface Props {
  data: number[];
  className?: string;
  stroke?: string;        // CSS color, default currentColor
  fill?: string;          // CSS color or 'none'
  height?: number;
  width?: number;
}

/** Tiny inline SVG sparkline — no recharts dependency, ~zero render cost. */
const Sparkline = ({ data, className, stroke = 'currentColor', fill = 'none', height = 32, width = 80 }: Props) => {
  if (!data?.length) return <div style={{ height, width }} className={className} />;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = data.length > 1 ? width / (data.length - 1) : width;
  const points = data.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const path = `M ${points.join(' L ')}`;
  const area = `${path} L ${width},${height} L 0,${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} preserveAspectRatio="none">
      {fill !== 'none' && <path d={area} fill={fill} opacity={0.18} />}
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default memo(Sparkline);
