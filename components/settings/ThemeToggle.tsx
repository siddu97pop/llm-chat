"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";

const ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const LABELS = {
  light: "Light mode",
  dark: "Dark mode",
  system: "System theme",
};

export function ThemeToggle() {
  const { settings, cycleTheme } = useSettings();
  const Icon = ICONS[settings.theme];

  return (
    <Tooltip>
      <TooltipTrigger
        onClick={cycleTheme}
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8")}
      >
        <Icon className="h-4 w-4" />
        <span className="sr-only">{LABELS[settings.theme]}</span>
      </TooltipTrigger>
      <TooltipContent>{LABELS[settings.theme]}</TooltipContent>
    </Tooltip>
  );
}
