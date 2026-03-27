import { cn } from "@/lib/utils";

type SkillMatchBarProps = {
  percent: number | null;
  matched?: number;
  total?: number;
  /** Required skills that matched (keyword / exact), shown under the bar */
  matchedLabels?: string[];
  className?: string;
};

function barColorClass(percent: number): string {
  if (percent >= 80) return "bg-emerald-500";
  if (percent >= 50) return "bg-amber-500";
  return "bg-orange-500";
}

export default function SkillMatchBar({
  percent,
  matched,
  total,
  matchedLabels,
  className,
}: SkillMatchBarProps) {
  if (percent === null) {
    return (
      <div className={cn("text-xs text-gray-500", className)}>
        No required skills listed for this job
      </div>
    );
  }

  const label =
    matched !== undefined && total !== undefined
      ? `${matched}/${total} required skills · ${percent}%`
      : `${percent}% skill match`;

  return (
    <div className={cn("w-full max-w-xs", className)}>
      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-gray-700">Skill match</span>
        <span className="tabular-nums text-gray-600">{label}</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Skill match ${percent} percent`}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-300 ease-out",
            barColorClass(percent)
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      {matchedLabels && matchedLabels.length > 0 && (
        <p className="mt-1.5 text-xs leading-snug text-gray-600">
          <span className="text-gray-500">Matches: </span>
          {matchedLabels.join(", ")}
        </p>
      )}
    </div>
  );
}
