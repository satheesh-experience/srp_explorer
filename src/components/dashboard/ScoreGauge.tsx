export function ScoreGauge({ score, max }: { score: number; max: number }) {
  const clampedMax = max > 0 ? max : 1;
  const fraction = Math.max(0, Math.min(1, score / clampedMax));
  const angle = -180 + fraction * 180;

  const cx = 110;
  const cy = 110;
  const r = 90;
  const rad = (angle * Math.PI) / 180;
  const needleX = cx + r * 0.78 * Math.cos(rad);
  const needleY = cy + r * 0.78 * Math.sin(rad);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 220 130" className="w-full max-w-[240px]">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e5484d" />
            <stop offset="45%" stopColor="#f5a623" />
            <stop offset="75%" stopColor="#8fd14f" />
            <stop offset="100%" stopColor="#17b8a6" />
          </linearGradient>
        </defs>
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${fraction * Math.PI * r} ${Math.PI * r}`}
        />
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="#111827" strokeWidth="3" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="5" fill="#111827" />
      </svg>
      <div className="-mt-2 text-4xl font-extrabold text-[#111827]">{Math.round(score)}</div>
      <div className="text-sm text-muted-foreground">Search Rank Score</div>
      <div className="mt-1 flex w-full max-w-[240px] justify-between text-xs text-muted-foreground">
        <span>0</span>
        <span>{Math.round(max)}</span>
      </div>
    </div>
  );
}
