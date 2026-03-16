import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Menu, X, Sparkles, AlertCircle } from 'lucide-react';
import { useCreateOpenaiConversation, useRecommendUniversities } from '@workspace/api-client-react';
import { useChat, isPersonalizedQuery } from '@/hooks/use-chat';
import { useProfile } from '@/hooks/use-profile';
import type { ExtendedStudentProfile } from '@/hooks/use-profile';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { QuickSelect } from '@/components/chat/QuickSelect';
import { ProfilePanel } from '@/components/profile/ProfilePanel';
import { ProfileModal } from '@/components/profile/ProfileModal';
import { UniversityCard } from '@/components/recommendations/UniversityCard';

const QUICK_OPTIONS = {
  englishTest: ["IELTS", "TOEFL", "Duolingo", "Not Taken"],
  budgetInr: ["10-20L", "20-35L", "35-50L", "50L+"],
  country: ["Canada", "USA", "UK", "Germany", "Australia"]
};

export default function Home() {
  const [conversationId, setConversationId] = useState<number | null>(null);
  const { messages, sendMessage, isStreaming, addMessage } = useChat(conversationId);
  const { profile, saveProfile, hasProfile } = useProfile();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [pendingMessageAfterProfile, setPendingMessageAfterProfile] = useState<string | null>(null);

  const { mutateAsync: createConversation } = useCreateOpenaiConversation();
  const { mutateAsync: fetchRecs, data: recommendations, isPending: isRecsLoading } = useRecommendUniversities();

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Fetch recs when profile is complete and recommendations requested
  useEffect(() => {
    if (showRecommendations && profile) {
      fetchRecs({
        data: {
          cgpa: profile.cgpa,
          englishTest: profile.englishTest === 'Not Taken' ? 'Not yet' : profile.englishTest,
          englishScore: profile.englishScore ?? undefined,
          budgetInr: profile.budgetInr,
          country: profile.country,
        } as any
      });
    }
  }, [showRecommendations, profile, fetchRecs]);

  const openProfileModal = () => setIsModalOpen(true);

  const handleProfileSaved = async (newProfile: ExtendedStudentProfile) => {
    saveProfile(newProfile);
    setIsModalOpen(false);

    addMessage({
      id: `profile-saved-${Date.now()}`,
      role: 'assistant',
      content: `✅ **Profile saved!** Here's a quick summary:\n\n• **CGPA:** ${newProfile.cgpa}/10 (${(newProfile.cgpa * 9.5).toFixed(1)}%)\n• **English Test:** ${newProfile.englishTest}${newProfile.englishScore ? ` – ${newProfile.englishScore}` : ''}\n• **Budget:** ₹${newProfile.budgetInr}\n• **Country:** ${newProfile.country}\n• **Field:** ${newProfile.field}\n• **Intake:** ${newProfile.intake}\n\nI can now create a **personalized study abroad plan** for you! Ask me for university recommendations, or I'll start automatically.`
    });

    setShowRecommendations(true);

    // If user had a pending message before profile was complete, send it now
    if (pendingMessageAfterProfile) {
      const msg = pendingMessageAfterProfile;
      setPendingMessageAfterProfile(null);
      await sendMessage(msg, newProfile);
    }
  };

  const handleSend = async (content: string) => {
    if (!content.trim() || isStreaming) return;
    setInputValue('');

    // Check if user wants personalized guidance but profile is missing
    if (isPersonalizedQuery(content) && !hasProfile) {
      // Show the user's message in chat
      addMessage({ id: `user-${Date.now()}`, role: 'user', content });
      // Remember what they wanted so we can fulfill after profile is saved
      setPendingMessageAfterProfile(content);
      // Show the profile-gate response with button
      addMessage({
        id: `gate-${Date.now()}`,
        role: 'assistant',
        content: "I can create a **personalized study abroad plan** for you! To give accurate university recommendations, I need a few details about your academic background.\n\nPlease complete your profile first — it only takes a minute.",
        action: 'complete-profile'
      });
      return;
    }

    await sendMessage(content, profile);

    // If message mentions recommendations and profile is complete, show recs panel
    if (hasProfile && isPersonalizedQuery(content) && !showRecommendations) {
      setShowRecommendations(true);
    }
  };

  const handleQuickSelect = (value: string) => {
    handleSend(value);
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">

      {/* PROFILE MODAL */}
      <ProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleProfileSaved}
        initialProfile={profile ?? undefined}
      />

      {/* LEFT: CHAT */}
      <div className="flex flex-col w-full lg:w-[60%] h-full relative z-10 bg-[url('/images/hero-bg.png')] bg-cover bg-center">
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-[-1]" />

        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-border/50 bg-white/50 backdrop-blur-md shadow-sm z-20">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-md">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none text-foreground">EduPilot AI</h1>
              <p className="text-xs text-emerald-600 font-medium flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!hasProfile && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={openProfileModal}
                className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white text-xs font-semibold shadow-md shadow-primary/30 hover:shadow-lg transition-all"
              >
                Setup Profile
              </motion.button>
            )}
            <button
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-200 rounded-lg"
              onClick={() => setIsMobileProfileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1 relative z-10 pb-36">
          {messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg}
              onCompleteProfile={msg.action === 'complete-profile' ? openProfileModal : undefined}
            />
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

        {/* Input area */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent pt-10 pb-6 px-4 z-20">
          {/* Quick select for English test, budget, country */}
          {!hasProfile && (
            <QuickSelect
              options={QUICK_OPTIONS.englishTest}
              onSelect={handleQuickSelect}
              disabled={isStreaming}
              label="Quick answers:"
            />
          )}

          <div className="max-w-3xl mx-auto mt-3 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
              placeholder={hasProfile ? "Ask me anything about studying abroad..." : "Type your message or use quick options above..."}
              disabled={isStreaming || !conversationId}
              className="w-full pl-6 pr-14 py-4 rounded-2xl bg-white border border-border shadow-lg shadow-black/5
                focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10
                disabled:opacity-60 transition-all text-foreground placeholder:text-muted-foreground"
            />
            <button
              onClick={() => handleSend(inputValue)}
              disabled={!inputValue.trim() || isStreaming || !conversationId}
              className="absolute right-2 top-2 bottom-2 aspect-square bg-gradient-to-br from-primary to-indigo-600 hover:opacity-90
                disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl flex items-center justify-center
                transition-all shadow-md active:scale-95 disabled:active:scale-100 disabled:from-slate-200 disabled:to-slate-200"
            >
              <Send className="w-4.5 h-4.5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT: PROFILE & RECS */}
      <AnimatePresence>
        {(isMobileProfileOpen || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed lg:static inset-y-0 right-0 z-50 w-full sm:w-[400px] lg:w-[40%] h-full bg-white border-l border-border shadow-2xl lg:shadow-none flex flex-col"
          >
            <div className="lg:hidden flex items-center justify-between p-4 border-b">
              <h2 className="font-bold text-lg">Your Profile</h2>
              <button onClick={() => setIsMobileProfileOpen(false)} className="p-2 bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-10">
              <ProfilePanel profile={profile} onEditProfile={openProfileModal} />

              {showRecommendations && (
                <div className="px-6 pb-6 pt-2 border-t border-dashed mt-4">
                  <h3 className="text-xl font-bold text-foreground mb-4 flex items-center">
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
                      {recommendations.safe.length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-3">✅ Safe Options</h4>
                          <div className="space-y-4">
                            {recommendations.safe.map((rec, i) => (
                              <UniversityCard key={rec.university.id} rec={rec} index={i} />
                            ))}
                          </div>
                        </div>
                      )}
                      {recommendations.moderate.length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-3">⚖️ Moderate Matches</h4>
                          <div className="space-y-4">
                            {recommendations.moderate.map((rec, i) => (
                              <UniversityCard key={rec.university.id} rec={rec} index={i} />
                            ))}
                          </div>
                        </div>
                      )}
                      {recommendations.ambitious.length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-rose-600 uppercase tracking-wider mb-3">🚀 Ambitious Goals</h4>
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
                          <p className="text-sm mt-1">Try adjusting your budget or country preference in your profile.</p>
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

      {/* MVP BADGE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="fixed bottom-5 right-5 z-40 lg:bottom-6 lg:right-6"
      >
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md text-white text-xs font-medium shadow-lg border border-white/10">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          MVP Prototype – Built for HACK2026
        </div>
      </motion.div>

    </div>
  );
}
