"use client";

import { useState } from "react";
import { Copy, Check, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import type { Message } from "@/lib/types";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const hasError = !!message.error;

  return (
    <div className={cn("flex gap-3 px-4 py-3", isUser && "flex-row-reverse")}>
      {/* Avatar dot */}
      <div
        className={cn(
          "mt-0.5 h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground border border-border"
        )}
      >
        {isUser ? "U" : "AI"}
      </div>

      <div className={cn("flex max-w-[80%] flex-col gap-1", isUser && "items-end")}>
        {hasError ? (
          <ErrorBubble message={message} />
        ) : isUser ? (
          <UserBubble content={message.content} />
        ) : (
          <AssistantBubble message={message} />
        )}
        <span className="text-[10px] text-muted-foreground px-1">
          {formatTime(message.timestamp)}
          {message.tokensPerSecond != null && (
            <span className="ml-2 opacity-60">{message.tokensPerSecond} tok/s</span>
          )}
        </span>
      </div>
    </div>
  );
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
      <p className="whitespace-pre-wrap break-words">{content}</p>
    </div>
  );
}

function AssistantBubble({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-2.5 text-sm">
      <div className="prose prose-sm dark:prose-invert max-w-none break-words">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ className, children, ...props }) {
              const isBlock = className?.includes("language-");
              if (isBlock) {
                return (
                  <CodeBlock className={className ?? ""}>
                    {String(children).replace(/\n$/, "")}
                  </CodeBlock>
                );
              }
              return (
                <code
                  className="rounded bg-muted px-1 py-0.5 font-mono text-xs"
                  {...props}
                >
                  {children}
                </code>
              );
            },
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>

      {message.content && (
        <button
          onClick={handleCopy}
          className="absolute right-2 top-2 rounded p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground hover:bg-muted"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      )}
    </div>
  );
}

function ErrorBubble({ message }: { message: Message }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message.error}</span>
    </div>
  );
}

function CodeBlock({ className, children }: { className: string; children: string }) {
  const [copied, setCopied] = useState(false);
  const lang = className.replace("language-", "") || "text";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative my-2 overflow-hidden rounded-lg border border-border bg-muted">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="text-[10px] text-muted-foreground font-mono">{lang}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? (
            <><Check className="h-3 w-3" /> Copied</>
          ) : (
            <><Copy className="h-3 w-3" /> Copy</>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3 text-xs font-mono leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
