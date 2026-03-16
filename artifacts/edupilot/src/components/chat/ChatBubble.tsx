import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ReactMarkdown from 'react-markdown';
import { Bot, User } from 'lucide-react';
import type { Message } from '@/hooks/use-chat';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 250, damping: 25 }}
      className={cn(
        "flex w-full mt-4 space-x-3 max-w-3xl mx-auto px-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}
      
      <div className={cn(
        "relative px-5 py-3.5 text-sm md:text-base rounded-2xl shadow-sm max-w-[85%]",
        isUser 
          ? "bg-primary text-primary-foreground rounded-tr-sm" 
          : "bg-white border border-border/50 text-foreground rounded-tl-sm markdown-body"
      )}>
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <ReactMarkdown>
            {message.content}
          </ReactMarkdown>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shadow-inner">
          <User className="w-5 h-5 text-slate-500" />
        </div>
      )}
    </motion.div>
  );
}
