type ProgressDonutProps = { value: number; completedModules: number; totalModules: number; showModuleCount?: boolean };

export function ProgressDonut({ value, completedModules, totalModules, showModuleCount = true }: ProgressDonutProps) {
  const percent = Math.max(0, Math.min(100, value));
  const circumference = 2 * Math.PI * 46;
  const progressLength = (circumference * percent) / 100;

  return (
    <div className="progress-donut" role="img" aria-label={`${percent}% course progress, module ${completedModules} of ${totalModules}`}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="progress-donut-track" cx="60" cy="60" r="46" />
        <circle className="progress-donut-value" cx="60" cy="60" r="46" strokeDasharray={`${progressLength} ${circumference}`} />
      </svg>
      <div className="progress-donut-center"><strong>{percent}%</strong>{showModuleCount && <span>{completedModules}/{totalModules} modules</span>}</div>
    </div>
  );
}
