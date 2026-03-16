import { useState } from 'react';
import type { ExtendedStudentProfile } from '@/hooks/use-profile';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: 'complete-profile';
};

const PROFILE_KEYWORDS = [
  'study abroad plan', 'recommend', 'recommendation', 'universities', 'eligibility',
  'eligible', 'personalized', 'plan for me', 'which university', 'best university',
  'suggest', 'where should i', 'which country', 'my profile', 'my options', 'admit me',
  'chances', 'guidance', 'counseling', 'advise'
];

export function isPersonalizedQuery(text: string) {
  const lower = text.toLowerCase();
  return PROFILE_KEYWORDS.some(kw => lower.includes(kw));
}

export function useChat(conversationId: number | null) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! 👋 I'm your **EduPilot AI counselor**. I can help you find the best universities abroad based on your profile.\n\nYou can ask me anything about studying abroad, or ask for **personalized university recommendations** once you've set up your profile."
    }
  ]);
  const [isStreaming, setIsStreaming] = useState(false);

  const addMessage = (msg: Message) => {
    setMessages(prev => [...prev, msg]);
  };

  const sendMessage = async (
    content: string,
    profile?: ExtendedStudentProfile | null
  ) => {
    if (!conversationId) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    const aiMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: '' }]);

    // Build API-compatible profile (only send known API fields)
    const apiProfile = profile ? {
      cgpa: profile.cgpa,
      englishTest: profile.englishTest === 'Not Taken' ? 'Not yet' : profile.englishTest,
      englishScore: profile.englishScore ?? undefined,
      budgetInr: profile.budgetInr,
      country: profile.country,
    } : null;

    try {
      const res = await fetch(`/api/openai/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          studentProfile: apiProfile
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
              } catch {
                // ignore parse errors on incomplete chunks
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => prev.map(m =>
        m.id === aiMsgId
          ? { ...m, content: "I'm sorry, I encountered an error. Please try again." }
          : m
      ));
    } finally {
      setIsStreaming(false);
    }
  };

  return { messages, sendMessage, isStreaming, addMessage };
}
