import { TopBar } from "@/components/layout/TopBar";
import { ChatInterface } from "@/components/chat/ChatInterface";

export default function ChatPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar />
      <div className="flex min-h-0 flex-1 flex-col">
        <ChatInterface />
      </div>
    </div>
  );
}
