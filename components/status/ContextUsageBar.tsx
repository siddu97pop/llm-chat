"use client";

import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ContextUsageBarProps {
  used: number;
  max: number;
  className?: string;
}

export function ContextUsageBar({ used, max, className }: ContextUsageBarProps) {
  const pct = max > 0 ? Math.min((used / max) * 100, 100) : 0;

  const color =
    pct >= 90 ? "text-red-500" :
    pct >= 70 ? "text-yellow-500" :
    "text-muted-foreground";

  return (
    <Tooltip>
      <TooltipTrigger className={cn("flex items-center gap-2 cursor-default bg-transparent border-none p-0", className)}>
          <span className={cn("text-[11px] tabular-nums whitespace-nowrap", color)}>
            {formatTokens(used)}&thinsp;/&thinsp;{formatTokens(max)}
          </span>
          <div className="w-16 h-1.5">
            <Progress
              value={pct}
              className={cn(
                "h-1.5",
                pct >= 90 ? "[&>div]:bg-red-500" :
                pct >= 70 ? "[&>div]:bg-yellow-500" :
                "[&>div]:bg-primary"
              )}
            />
          </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {used.toLocaleString()} / {max.toLocaleString()} tokens ({pct.toFixed(1)}% used)
      </TooltipContent>
    </Tooltip>
  );
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
