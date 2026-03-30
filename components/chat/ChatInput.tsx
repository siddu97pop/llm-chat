"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Send, Square, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (content: string) => void;
  onCancel: () => void;
  onClear: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, onCancel, onClear, isStreaming, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [value, isStreaming, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-background px-4 py-3">
      <div className="mx-auto max-w-3xl">
        <div className="relative flex items-end gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-shadow">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isStreaming
                ? "Responding…"
                : "Message (Enter to send, Shift+Enter for newline)"
            }
            disabled={isStreaming || disabled}
            className={cn(
              "min-h-[40px] max-h-[200px] flex-1 resize-none border-none bg-transparent p-0 shadow-none focus-visible:ring-0 text-sm",
              "placeholder:text-muted-foreground/60"
            )}
            rows={1}
          />

          <div className="flex items-center gap-1 pb-0.5">
            {/* Clear button */}
            <Tooltip>
              <TooltipTrigger
                onClick={onClear}
                disabled={isStreaming}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "h-7 w-7 text-muted-foreground hover:text-destructive"
                )}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </TooltipTrigger>
              <TooltipContent>Clear conversation</TooltipContent>
            </Tooltip>

            {/* Send / Stop button */}
            {isStreaming ? (
              <Tooltip>
                <TooltipTrigger
                  onClick={onCancel}
                  className={cn(
                    buttonVariants({ variant: "destructive", size: "icon" }),
                    "h-7 w-7"
                  )}
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                </TooltipTrigger>
                <TooltipContent>Stop generating</TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger
                  onClick={handleSend}
                  disabled={!value.trim() || disabled}
                  className={cn(
                    buttonVariants({ variant: "default", size: "icon" }),
                    "h-7 w-7"
                  )}
                >
                  <Send className="h-3.5 w-3.5" />
                </TooltipTrigger>
                <TooltipContent>Send (Enter)</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
