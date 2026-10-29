import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Send,
  User,
  Sparkles,
  Trash2,
  Plus,
  MessageSquare,
  Clock,
  ArrowRight,
  Compass,
  BookOpen,
  Briefcase,
  Layers,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Spinner } from '../components/common/Spinner';
import { useStudentData } from '../context/StudentDataContext';
import { useToast } from '../context/ToastContext';
import { assistantService } from '../services/assistant.service';
import {
  IAssistantMessage,
  IConversationSummary,
  IRecommendationCard,
} from '../types/assistant.types';

export const AiAssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useStudentData();
  const { success, error: toastError, info } = useToast();

  const [conversations, setConversations] = useState<IConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<IAssistantMessage[]>([]);
  const [activeTitle, setActiveTitle] = useState<string>('New Career Discussion');

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Modals
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Suggested Prompts for Welcome State
  const suggestedPrompts = [
    {
      title: 'Analyze My Skill Gaps',
      query: 'What are my critical skill gaps for my target role, and what should I learn first?',
      badge: 'Skill Gap',
    },
    {
      title: 'Prepare for Upcoming Interview',
      query: 'How should I structure my preparation for my upcoming placement interview?',
      badge: 'Interview Prep',
    },
    {
      title: 'Role Requirements & Salary',
      query: 'What are the expected core skills and salary ranges for a Full-Stack Developer?',
      badge: 'Career Role',
    },
    {
      title: 'Optimize Resume for ATS',
      query: 'How can I make my project descriptions and experience bullet points more impactful?',
      badge: 'Resume ATS',
    },
    {
      title: 'Platform Navigation Help',
      query: 'Where do I find my active learning roadmap and track my job applications?',
      badge: 'Navigation',
    },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load conversations list
  const loadConversations = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const list = await assistantService.getConversations();
      setConversations(list);
    } catch {
      // ignore
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Select an existing conversation
  const selectConversation = async (convId: string) => {
    if (activeConversationId === convId) return;
    setIsLoading(true);
    try {
      const conv = await assistantService.getConversationById(convId);
      setActiveConversationId(conv._id);
      setActiveTitle(conv.title);
      setMessages(conv.messages);
    } catch (err) {
      toastError('Could not load chat', (err as Error).message || 'Failed to retrieve conversation.');
    } finally {
      setIsLoading(false);
    }
  };

  // Start a fresh conversation
  const startNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setActiveTitle('New Career Discussion');
    setMessages([
      {
        role: 'assistant',
        content: `Hello ${profile.name}! 👋 I am your Career Pilot AI Assistant. I have access to your saved profile (${profile.education.degree} at ${profile.education.institution}), your target role (${profile.targetRoles[0] || 'Software Engineer'}), and your active placement pipeline.\n\nHow can I help you advance your career today?`,
        suggestedFollowUps: [
          'What are my critical skill gaps?',
          'What are the next tasks in my learning roadmap?',
          'How should I prepare for upcoming technical screens?',
        ],
        timestamp: new Date().toISOString(),
      },
    ]);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [
    profile.name,
    profile.education.degree,
    profile.education.institution,
    profile.targetRoles,
  ]);

  // Initialize with greeting if no active conversation
  useEffect(() => {
    if (!activeConversationId && messages.length === 0) {
      startNewConversation();
    }
  }, [activeConversationId, messages.length, startNewConversation]);

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    const userMessage: IAssistantMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const res = await assistantService.sendMessage({
        message: text,
        conversationId: activeConversationId || undefined,
      });

      setActiveConversationId(res.conversationId);
      setActiveTitle(res.conversationTitle);
      setMessages((prev) => [...prev, res.message]);
      loadConversations();
    } catch (err) {
      toastError('Message Failed', (err as Error).message || 'Unable to connect to assistant service.');
      const errorMessage: IAssistantMessage = {
        role: 'assistant',
        content:
          'I encountered a temporary connection issue while preparing your response. Please verify your backend server is running and try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete single conversation
  const handleDeleteConversation = async () => {
    if (!selectedConvId) return;
    try {
      await assistantService.deleteConversation(selectedConvId);
      setConversations((prev) => prev.filter((c) => c._id !== selectedConvId));
      if (activeConversationId === selectedConvId) {
        startNewConversation();
      }
      setIsDeleteModalOpen(false);
      success('Conversation Removed', 'Chat history deleted.');
    } catch (err) {
      toastError('Delete Failed', (err as Error).message || 'Could not delete conversation.');
    }
  };

  // Clear all conversations
  const handleClearAll = async () => {
    try {
      await assistantService.clearAllConversations();
      setConversations([]);
      startNewConversation();
      setIsClearAllModalOpen(false);
      success('History Cleared', 'All conversation history has been purged.');
    } catch (err) {
      toastError('Clear Failed', (err as Error).message || 'Could not clear history.');
    }
  };

  // Handle Recommendation Card Navigation
  const handleCardAction = (url?: string) => {
    if (url) {
      navigate(url);
    }
  };

  // Key Down Handler for Composer (Enter sends, Shift+Enter new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                AI Career Assistant
              </h1>
            </div>
            <Badge variant="info" size="sm">Grounded Agent</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Personalized guidance on career roles, skill gaps, learning roadmaps, resumes, and interviews.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-xs lg:hidden"
            leftIcon={isSidebarOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
          >
            {isSidebarOpen ? 'Hide History' : 'View History'}
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={startNewConversation}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            New Discussion
          </Button>
        </div>
      </div>

      {/* Main Workspace Grid (Sidebar + Chat Area) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* 1. Left Sidebar: Conversation History */}
        {isSidebarOpen && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-3.5 flex flex-col h-[700px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> Past Discussions
              </span>
              <button
                onClick={startNewConversation}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                + New
              </button>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto py-2.5 space-y-1.5 pr-1">
              {isHistoryLoading ? (
                <div className="py-8 text-center">
                  <Spinner size="sm" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No past conversations yet. Start a new chat!
                </div>
              ) : (
                conversations.map((c) => {
                  const isActive = activeConversationId === c._id;
                  return (
                    <div
                      key={c._id}
                      onClick={() => selectConversation(c._id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer group flex items-start justify-between gap-2 ${
                        isActive
                          ? 'border-indigo-300 bg-indigo-50/60 shadow-2xs'
                          : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div
                          className={`text-xs font-semibold truncate ${
                            isActive ? 'text-indigo-950 font-bold' : 'text-slate-800'
                          }`}
                        >
                          {c.title}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {c.lastMessageSnippet || 'Conversation turn'}
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono mt-1">
                          {new Date(c.updatedAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedConvId(c._id);
                          setIsDeleteModalOpen(true);
                        }}
                        className="text-slate-300 hover:text-rose-600 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Clear All Footer */}
            {conversations.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsClearAllModalOpen(true)}
                  className="w-full text-center text-xs text-slate-400 hover:text-rose-600 py-1 transition-colors flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Clear All History
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. Main Chat Window */}
        <div
          className={`bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col h-[700px] overflow-hidden ${
            isSidebarOpen ? 'lg:col-span-3' : 'lg:col-span-4'
          }`}
        >
          {/* Chat Window Top Bar */}
          <div className="p-3.5 px-5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 ring-4 ring-emerald-100" />
              <div className="min-w-0">
                <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                  {activeTitle}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  Grounded in student profile &bull; Verified curriculum & catalog
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="neutral" size="sm">
                Target: {profile.targetRoles[0] || 'Software Engineer'}
              </Badge>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';

              return (
                <div
                  key={msg._id || idx}
                  className={`flex gap-3 max-w-3xl ${
                    isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold ${
                      isUser
                        ? 'bg-indigo-600 shadow-2xs'
                        : 'bg-slate-900 border border-slate-700 shadow-2xs'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble Content */}
                  <div className={`space-y-2.5 max-w-[85%] sm:max-w-[78%]`}>
                    <div
                      className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? 'bg-indigo-600 text-white rounded-tr-none shadow-2xs'
                          : 'bg-slate-50 border border-slate-200/90 text-slate-800 rounded-tl-none shadow-2xs'
                      }`}
                    >
                      {msg.content}
                    </div>

                    {/* Context Tags (for assistant messages) */}
                    {!isUser && msg.contextUsed && msg.contextUsed.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] text-slate-400 font-medium">Context:</span>
                        {msg.contextUsed.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Structured Recommendation Cards */}
                    {!isUser && msg.recommendations && msg.recommendations.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {msg.recommendations.map((rec, rIdx) => (
                          <div
                            key={rIdx}
                            className="p-3 rounded-xl bg-white border border-indigo-200 shadow-2xs hover:border-indigo-300 transition-all flex flex-col justify-between space-y-2"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-xs text-slate-900">{rec.title}</span>
                                <Badge variant="info" size="sm">{rec.type.replace('_', ' ')}</Badge>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                                {rec.description}
                              </p>
                            </div>

                            {rec.actionLabel && rec.actionUrl && (
                              <button
                                type="button"
                                onClick={() => handleCardAction(rec.actionUrl)}
                                className="inline-flex items-center justify-between text-xs font-semibold text-indigo-600 hover:text-indigo-800 pt-1.5 border-t border-slate-100 transition-colors w-full"
                              >
                                <span>{rec.actionLabel}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Suggested Follow-up Question Chips */}
                    {!isUser && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] text-slate-400 font-medium">Suggested Next Questions:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.suggestedFollowUps.map((promptText, pIdx) => (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={() => handleSendMessage(promptText)}
                              className="text-left text-[11px] bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700 px-2.5 py-1 rounded-lg transition-all shadow-2xs"
                            >
                              {promptText}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing / Loading Indicator */}
            {isLoading && (
              <div className="flex items-center gap-3 mr-auto">
                <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2 shadow-2xs">
                  <Spinner size="sm" />
                  <span>Synthesizing personalized career advice...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar (When starting or continuing) */}
          {messages.length <= 2 && (
            <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" /> Ideas:
              </span>
              {suggestedPrompts.slice(0, 3).map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(item.query)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 text-[11px] text-slate-700 whitespace-nowrap hover:bg-indigo-50/40 transition-colors shadow-2xs shrink-0"
                >
                  {item.title}
                </button>
              ))}
            </div>
          )}

          {/* Message Composer */}
          <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 space-y-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-end gap-2.5"
            >
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about career roles, skill gaps, roadmap tasks, or interview prep... (Press Enter to send)"
                  rows={2}
                  maxLength={2000}
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl p-3 pr-12 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white resize-none transition-all shadow-2xs"
                />
                <span className="absolute bottom-2.5 right-3 text-[10px] text-slate-400 font-mono">
                  {inputPrompt.length}/2000
                </span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                disabled={!inputPrompt.trim() || isLoading}
                className="h-[52px] px-4 rounded-xl shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>

            <div className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
              <span>Career Pilot AI Assistant grounds recommendations in verified student profile records and placement data.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Delete Single Conversation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Discussion"
        description="Permanently remove this conversation thread from your chat history?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            This will permanently delete this conversation and all associated messages. This action cannot be undone.
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button size="sm" variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="danger" onClick={handleDeleteConversation}>
              Delete Discussion
            </Button>
          </div>
        </div>
      </Modal>

      {/* 4. Clear All History Modal */}
      <Modal
        isOpen={isClearAllModalOpen}
        onClose={() => setIsClearAllModalOpen(false)}
        title="Clear All Conversation History"
        description="Are you sure you want to delete all past assistant conversations?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            All stored conversations and message history will be removed from your account.
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button size="sm" variant="ghost" onClick={() => setIsClearAllModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="danger" onClick={handleClearAll}>
              Clear Everything
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
