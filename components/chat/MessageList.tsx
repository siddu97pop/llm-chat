"use client";

import { useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { StreamingMessage } from "./StreamingMessage";
import type { Conversation } from "@/lib/types";
import { useChatStore } from "@/lib/store/chat-store";

interface MessageListProps {
  conversation: Conversation;
}

const messageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" as const } },
};

export function MessageList({ conversation }: MessageListProps) {
  const isStreaming = useChatStore((s) => s.metrics.isStreaming);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  const scrollToBottom = useCallback((force = false) => {
    if (force || isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const threshold = 80;
      isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const prevMsgCount = useRef(conversation.messages.length);
  useEffect(() => {
    const newCount = conversation.messages.length;
    const isNewUserMessage =
      newCount > prevMsgCount.current &&
      conversation.messages[newCount - 1]?.role === "user";
    prevMsgCount.current = newCount;
    scrollToBottom(isNewUserMessage);
  }, [conversation.messages, scrollToBottom]);

  useEffect(() => {
    if (isStreaming) scrollToBottom(false);
  }, [
    conversation.messages[conversation.messages.length - 1]?.content,
    isStreaming,
    scrollToBottom,
  ]);

  const messages = conversation.messages;
  const streamingIndex =
    isStreaming && messages.length > 0 && messages[messages.length - 1].role === "assistant"
      ? messages.length - 1
      : -1;

  if (messages.length === 0) {
    return (
      <motion.div
        key="empty"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground"
      >
        <div className="rounded-full border border-border bg-muted p-4">
          <MessageSquare className="h-6 w-6 opacity-40" />
        </div>
        <p className="text-sm">Start a conversation</p>
      </motion.div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl py-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) =>
            i === streamingIndex ? (
              <motion.div
                key={msg.id}
                variants={messageVariants}
                initial="hidden"
                animate="visible"
              >
                <StreamingMessage content={msg.content} />
              </motion.div>
            ) : (
              <motion.div
                key={msg.id}
                variants={messageVariants}
                initial="hidden"
                animate="visible"
              >
                <MessageBubble message={msg} />
              </motion.div>
            )
          )}
        </AnimatePresence>
        <div ref={bottomRef} className="h-1" />
      </div>
    </div>
  );
}
