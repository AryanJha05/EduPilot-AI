import { useState } from 'react';
import type { StudentProfile } from '@workspace/api-client-react';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export function useChat(conversationId: number | null) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm your EduPilot AI counselor. I can help you find the best university matches abroad based on your profile. To get started, **what is your current CGPA (out of 10)?**"
    }
  ]);
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = async (content: string, profile?: Partial<StudentProfile>) => {
    if (!conversationId) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    const aiMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: '' }]);

    try {
      const res = await fetch(`/api/openai/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content, 
          // Only send profile if it has at least one valid key to prevent type mismatch
          studentProfile: profile && Object.keys(profile).length > 0 ? profile : null 
        })
      });

      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6);
              if (dataStr.trim() === '[DONE]') continue;
              try {
                const data = JSON.parse(dataStr);
                if (data.done) {
                  done = true;
                } else if (data.content) {
                  setMessages(prev => prev.map(m =>
                    m.id === aiMsgId ? { ...m, content: m.content + data.content } : m
                  ));
                }
              } catch (e) {
                // Ignore parse errors on incomplete chunks
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'assistant', 
        content: "I'm sorry, I encountered an error. Please try again." 
      }]);
    } finally {
      setIsStreaming(false);
    }
  };

  return { messages, sendMessage, isStreaming };
}
