"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface StreamingMessageProps {
  content: string;
}

export function StreamingMessage({ content }: StreamingMessageProps) {
  return (
    <div className="flex gap-3 px-4 py-3">
      {/* Avatar */}
      <div className="mt-0.5 h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold bg-muted text-muted-foreground border border-border">
        AI
      </div>

      <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-2.5 text-sm">
        <div className="prose prose-sm dark:prose-invert max-w-none break-words">
          {content ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          ) : (
            /* Thinking indicator before first token arrives */
            <div className="flex items-center gap-1 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
            </div>
          )}
        </div>

        {/* Blinking cursor */}
        {content && (
          <span className="inline-block h-3.5 w-0.5 bg-primary ml-0.5 align-text-bottom animate-[blink_1s_ease-in-out_infinite]" />
        )}
      </div>
    </div>
  );
}
