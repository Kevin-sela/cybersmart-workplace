type ProgressDonutProps = { value: number | null; completedUnits: number; totalUnits: number; unitLabel?: string; showModuleCount?: boolean };

export function ProgressDonut({ value, completedUnits, totalUnits, unitLabel = "modules", showModuleCount = true }: ProgressDonutProps) {
  const percent = value === null ? 0 : Math.max(0, Math.min(100, value));
  const circumference = 2 * Math.PI * 46;
  const progressLength = (circumference * percent) / 100;

  return (
    <div className="progress-donut" role="img" aria-label={value === null ? "Loading course progress" : `${percent}% course progress, ${completedUnits} of ${totalUnits} ${unitLabel}`}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="progress-donut-track" cx="60" cy="60" r="46" />
        <circle className="progress-donut-value" cx="60" cy="60" r="46" strokeDasharray={`${progressLength} ${circumference}`} />
      </svg>
      <div className="progress-donut-center"><strong>{value === null ? "…" : `${percent}%`}</strong>{showModuleCount && <span>{value === null ? "Loading" : `${completedUnits}/${totalUnits} ${unitLabel}`}</span>}</div>
    </div>
  );
}
