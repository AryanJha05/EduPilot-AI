import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ReactMarkdown from 'react-markdown';
import { Bot, User, UserCircle } from 'lucide-react';
import type { Message } from '@/hooks/use-chat';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ChatBubbleProps {
  message: Message;
  onCompleteProfile?: () => void;
}

export function ChatBubble({ message, onCompleteProfile }: ChatBubbleProps) {
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
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-md">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}

      <div className={cn(
        "relative px-5 py-3.5 text-sm md:text-base rounded-2xl shadow-sm max-w-[85%]",
        isUser
          ? "bg-primary text-primary-foreground rounded-tr-sm"
          : "bg-white border border-border/50 text-foreground rounded-tl-sm"
      )}>
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-strong:text-foreground">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}

        {/* Action Button */}
        {message.action === 'complete-profile' && onCompleteProfile && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-3 pt-3 border-t border-slate-100"
          >
            <button
              onClick={onCompleteProfile}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white text-sm font-semibold shadow-md shadow-primary/30 hover:shadow-lg hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-200"
            >
              <UserCircle className="w-4 h-4" />
              Complete Profile
            </button>
          </motion.div>
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
