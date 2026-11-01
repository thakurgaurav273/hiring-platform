"use client";

export function ReportsLineChart({ weeks, series, max }: { weeks: string[]; series: number[]; max: number }) {
  const W = 560;
  const H = 200;
  const padL = 32;
  const padR = 12;
  const padT = 16;
  const padB = 24;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const step = innerW / (series.length - 1);
  const points = series.map((v, i) => {
    const x = padL + i * step;
    const y = padT + innerH - (v / max) * innerH;
    return [x, y] as const;
  });
  const path = points.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(" ");
  const area = `${path} L${points[points.length - 1][0]},${padT + innerH} L${points[0][0]},${padT + innerH} Z`;
  const gridY = 4;

  return (
    <div className="mt-4 w-full overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-56 w-full">
        <defs>
          <linearGradient id="lc-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {Array.from({ length: gridY + 1 }).map((_, i) => {
          const y = padT + (innerH / gridY) * i;
          const value = Math.round(max - (max / gridY) * i);
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="var(--color-border)" strokeDasharray="2 3" />
              <text x={4} y={y + 3} fontSize="9" fill="var(--color-muted-foreground)">{value}</text>
            </g>
          );
        })}
        <path d={area} fill="url(#lc-fill)" />
        <path d={path} fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {points.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="3.2" fill="var(--color-primary)" />
            <text x={x} y={H - 6} fontSize="9.5" textAnchor="middle" fill="var(--color-muted-foreground)">{weeks[i]}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
