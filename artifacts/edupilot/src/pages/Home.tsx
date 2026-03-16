import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Menu, X, Sparkles, AlertCircle } from 'lucide-react';
import { useCreateOpenaiConversation, useRecommendUniversities } from '@workspace/api-client-react';
import type { StudentProfile } from '@workspace/api-client-react';
import { useChat } from '@/hooks/use-chat';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { QuickSelect } from '@/components/chat/QuickSelect';
import { ProfilePanel } from '@/components/profile/ProfilePanel';
import { UniversityCard } from '@/components/recommendations/UniversityCard';

type Step = 'cgpa' | 'englishTest' | 'budgetInr' | 'country' | 'done';

const QUICK_OPTIONS = {
  englishTest: ["IELTS", "TOEFL", "Duolingo", "Not yet"],
  budgetInr: ["10-20L", "20-35L", "35-50L", "50L+"],
  country: ["Canada", "USA", "UK", "Germany", "Australia"]
};

export default function Home() {
  const [conversationId, setConversationId] = useState<number | null>(null);
  const { messages, sendMessage, isStreaming } = useChat(conversationId);
  const [inputValue, setInputValue] = useState('');
  const [profile, setProfile] = useState<Partial<StudentProfile>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Mutations
  const { mutateAsync: createConversation } = useCreateOpenaiConversation();
  const { mutateAsync: fetchRecs, data: recommendations, isPending: isRecsLoading } = useRecommendUniversities();

  // Initialize Conversation on mount
  useEffect(() => {
    async function init() {
      try {
        const conv = await createConversation({ data: { title: 'Study Abroad Guidance' } });
        setConversationId(conv.id);
      } catch (error) {
        console.error("Failed to create conversation:", error);
      }
    }
    init();
  }, [createConversation]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Determine current missing step
  const currentStep: Step = 
    profile.cgpa === undefined ? 'cgpa' :
    profile.englishTest === undefined ? 'englishTest' :
    profile.budgetInr === undefined ? 'budgetInr' :
    profile.country === undefined ? 'country' : 'done';

  // Trigger Recommendations once Profile is done
  useEffect(() => {
    if (currentStep === 'done' && !showRecommendations) {
      setShowRecommendations(true);
      fetchRecs({ data: profile as StudentProfile });
    }
  }, [currentStep, showRecommendations, profile, fetchRecs]);

  const handleSend = async (content: string, overrideStep?: { key: keyof StudentProfile, value: any }) => {
    if (!content.trim() || isStreaming) return;
    
    let updatedProfile = { ...profile };

    // Apply quick select override if provided
    if (overrideStep) {
      updatedProfile = { ...updatedProfile, [overrideStep.key]: overrideStep.value };
      setProfile(updatedProfile);
    } 
    // Otherwise try to parse text input for current step
    else {
      if (currentStep === 'cgpa') {
        const val = parseFloat(content);
        if (isNaN(val) || val < 0 || val > 10) {
          // If invalid, just send the message normally without updating profile so AI can correct them
        } else {
          updatedProfile = { ...updatedProfile, cgpa: val };
          setProfile(updatedProfile);
        }
      }
    }

    setInputValue('');
    await sendMessage(content, updatedProfile);
  };

  const handleQuickSelect = (value: string) => {
    if (currentStep !== 'done' && QUICK_OPTIONS[currentStep as keyof typeof QUICK_OPTIONS]) {
      handleSend(value, { key: currentStep as keyof StudentProfile, value });
    } else {
      handleSend(value);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      
      {/* LEFT COLUMN: CHAT */}
      <div className="flex flex-col w-full lg:w-[60%] h-full relative z-10 bg-[url('/images/hero-bg.png')] bg-cover bg-center">
        {/* Semi-transparent overlay to ensure contrast */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-[-1]" />

        {/* Chat Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-border/50 bg-white/50 backdrop-blur-md shadow-sm z-20">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg leading-none text-foreground">EduPilot AI</h1>
              <p className="text-xs text-emerald-600 font-medium flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                Online
              </p>
            </div>
          </div>
          <button 
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-200 rounded-lg"
            onClick={() => setIsMobileProfileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2 relative z-10 pb-32">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
          {isStreaming && (
            <div className="flex w-full mt-4 max-w-3xl mx-auto px-4 justify-start">
              <div className="px-5 py-3 rounded-2xl bg-white border border-border shadow-sm flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-10 pb-6 px-4 z-20">
          {currentStep !== 'done' && QUICK_OPTIONS[currentStep as keyof typeof QUICK_OPTIONS] && (
            <QuickSelect 
              options={QUICK_OPTIONS[currentStep as keyof typeof QUICK_OPTIONS]!} 
              onSelect={handleQuickSelect}
              disabled={isStreaming}
            />
          )}
          
          <div className="max-w-3xl mx-auto mt-4 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
              placeholder={currentStep === 'cgpa' ? "Enter your CGPA (e.g., 8.5)..." : "Type a message..."}
              disabled={isStreaming || !conversationId}
              className="w-full pl-6 pr-14 py-4 rounded-2xl bg-white border border-border shadow-lg shadow-black/5 
                focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 
                disabled:opacity-60 transition-all text-foreground placeholder:text-muted-foreground"
            />
            <button
              onClick={() => handleSend(inputValue)}
              disabled={!inputValue.trim() || isStreaming || !conversationId}
              className="absolute right-2 top-2 bottom-2 aspect-square bg-primary hover:bg-primary/90 
                disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl flex items-center justify-center 
                transition-all shadow-md active:scale-95 disabled:active:scale-100"
            >
              <Send className="w-5 h-5 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: PROFILE & RECOMMENDATIONS */}
      <AnimatePresence>
        {(isMobileProfileOpen || window.innerWidth >= 1024) && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`
              fixed lg:static inset-y-0 right-0 z-50 
              w-full sm:w-[400px] lg:w-[40%] h-full 
              bg-white border-l border-border shadow-2xl lg:shadow-none
              flex flex-col
            `}
          >
            <div className="lg:hidden flex items-center justify-between p-4 border-b">
              <h2 className="font-bold text-lg">Your Profile</h2>
              <button onClick={() => setIsMobileProfileOpen(false)} className="p-2 bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
              <ProfilePanel profile={profile} />

              {showRecommendations && (
                <div className="px-6 pb-6 pt-2 border-t border-dashed mt-6">
                  <h3 className="text-xl font-display font-bold text-foreground mb-4 flex items-center">
                    <Sparkles className="w-5 h-5 text-primary mr-2" />
                    Top Recommendations
                  </h3>

                  {isRecsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse bg-slate-100 h-40 rounded-2xl w-full" />
                      ))}
                    </div>
                  ) : recommendations ? (
                    <div className="space-y-6">
                      {/* SAFES */}
                      {recommendations.safe.length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-3">Safe Options</h4>
                          <div className="space-y-4">
                            {recommendations.safe.map((rec, i) => (
                              <UniversityCard key={rec.university.id} rec={rec} index={i} />
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* MODERATES */}
                      {recommendations.moderate.length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-3">Moderate Matches</h4>
                          <div className="space-y-4">
                            {recommendations.moderate.map((rec, i) => (
                              <UniversityCard key={rec.university.id} rec={rec} index={i} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AMBITIOUS */}
                      {recommendations.ambitious.length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-rose-600 uppercase tracking-wider mb-3">Ambitious Goals</h4>
                          <div className="space-y-4">
                            {recommendations.ambitious.map((rec, i) => (
                              <UniversityCard key={rec.university.id} rec={rec} index={i} />
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {recommendations.safe.length === 0 && recommendations.moderate.length === 0 && recommendations.ambitious.length === 0 && (
                        <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 flex flex-col items-center text-center">
                           <AlertCircle className="w-8 h-8 mb-2 text-amber-500" />
                           <p className="font-medium">No strict matches found</p>
                           <p className="text-sm mt-1">Try adjusting your budget or considering different countries in the chat.</p>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
