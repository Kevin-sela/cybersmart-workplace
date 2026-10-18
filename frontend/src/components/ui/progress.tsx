type ProgressProps = { value: number; label: string; className?: string };

export function Progress({ value, label, className = "" }: ProgressProps) {
  const boundedValue = Math.max(0, Math.min(100, value));
  return (
    <div
      className={`ui-progress ${className}`}
      role="progressbar"
      aria-label={label}
      aria-valuenow={boundedValue}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${boundedValue}%` }} />
    </div>
  );
}
