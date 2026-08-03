'use client';

import React, { useState } from 'react';
import { Bot, Send, Shield, CheckCircle2, AlertCircle, FileText, X, Sparkles, User, RefreshCw } from 'lucide-react';

interface Citation {
  title: string;
  category: string;
  snippet: string;
  sourceUrl?: string;
}

interface ActionProposal {
  actionName: string;
  targetRecord: string;
  proposedValues: Record<string, any>;
  reason: string;
  riskLevel: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  proposals?: ActionProposal[];
  timestamp: string;
}

export function AiAssistantPanel({ userRole = 'STUDENT', userName = 'Demo User' }: { userRole?: string; userName?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [executedActions, setExecutedActions] = useState<Record<string, boolean>>({});

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello ${userName}! I am your role-aware CampusOS AI Assistant. I can help answer academic policy questions, summarize your schedule and attendance, calculate shortage requirements, and prepare authorized workflow drafts.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: String(Date.now()),
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentInput }),
      });

      const data = await res.json();

      const assistantMsg: Message = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: data.content || 'I have retrieved your request.',
        citations: data.citations || [],
        proposals: data.proposals || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: 'assistant',
          content: 'AI assistance is temporarily unavailable. Core CampusOS features remain fully functional.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAction = async (proposal: ActionProposal, msgId: string) => {
    try {
      const res = await fetch('/api/ai/action/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionName: proposal.actionName,
          targetRecord: proposal.targetRecord,
          proposedValues: proposal.proposedValues,
        }),
      });

      if (res.ok) {
        setExecutedActions(prev => ({ ...prev, [`${msgId}-${proposal.actionName}`]: true }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      {/* Trigger Floating Launcher */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-[#1754E8] text-white hover:bg-[#103FC2] font-semibold px-4 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-[#1754E8] focus:ring-offset-2"
          aria-label="Open AI Assistant"
        >
          <Bot className="w-5 h-5" />
          <span className="text-sm">CampusOS AI</span>
        </button>
      )}

      {/* Assistant Side Panel Drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-[#DFE6F0] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="bg-[#101A32] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#1754E8] p-2 rounded-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-base">CampusOS AI Assistant</h3>
                <div className="flex items-center gap-1.5 text-xs text-[#8A95A6]">
                  <Shield className="w-3.5 h-3.5 text-[#078A57]" />
                  <span>Context: {userRole} Profile (Tenant Scoped)</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#8A95A6] hover:text-white p-1 rounded-md"
              aria-label="Close Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F6F8FC]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl p-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#1754E8] text-white rounded-br-none'
                      : 'bg-white text-[#101828] border border-[#DFE6F0] shadow-sm rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>

                  {/* RAG Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#DFE6F0] space-y-2">
                      <div className="text-xs font-semibold text-[#5F6C7B] flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-[#1754E8]" />
                        <span>Institutional Sources & Citations</span>
                      </div>
                      {msg.citations.map((cite, i) => (
                        <div key={i} className="bg-[#EDF3FF] border border-[#CAD4E2] rounded p-2 text-xs">
                          <div className="font-semibold text-[#101A32]">{cite.title}</div>
                          <div className="text-[#5F6C7B] mt-0.5 line-clamp-2">{cite.snippet}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Proposals */}
                  {msg.proposals && msg.proposals.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#DFE6F0] space-y-2">
                      <div className="text-xs font-semibold text-[#C86600] flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Proposed Action (Requires Human Confirmation)</span>
                      </div>
                      {msg.proposals.map((prop, i) => {
                        const isDone = executedActions[`${msg.id}-${prop.actionName}`];
                        return (
                          <div key={i} className="bg-white border border-[#DFE6F0] rounded-lg p-3 text-xs space-y-2">
                            <div className="font-semibold text-[#101828]">{prop.actionName}</div>
                            <div className="text-[#5F6C7B]">Target: <span className="font-mono">{prop.targetRecord}</span></div>
                            <div className="text-[#5F6C7B]">{prop.reason}</div>
                            {isDone ? (
                              <div className="flex items-center gap-1 text-[#078A57] font-semibold">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Action Approved & Executed</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleApproveAction(prop, msg.id)}
                                className="w-full bg-[#1754E8] text-white hover:bg-[#103FC2] font-semibold py-1.5 rounded transition-colors"
                              >
                                Confirm & Execute Action
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-[#8A95A6] mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-[#5F6C7B] bg-white border border-[#DFE6F0] rounded-lg p-3 max-w-[70%]">
                <RefreshCw className="w-4 h-4 animate-spin text-[#1754E8]" />
                <span>Searching institutional sources...</span>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="p-2 bg-white border-t border-[#DFE6F0] flex gap-2 overflow-x-auto">
            <button
              onClick={() => setInput('What is my attendance status?')}
              className="text-xs bg-[#EDF3FF] text-[#1754E8] hover:bg-[#DFE6F0] font-medium px-2.5 py-1.5 rounded-full whitespace-nowrap"
            >
              My Attendance
            </button>
            <button
              onClick={() => setInput('What classes do I have today?')}
              className="text-xs bg-[#EDF3FF] text-[#1754E8] hover:bg-[#DFE6F0] font-medium px-2.5 py-1.5 rounded-full whitespace-nowrap"
            >
              Today&apos;s Schedule
            </button>
            <button
              onClick={() => setInput('Draft a service request for transcript.')}
              className="text-xs bg-[#EDF3FF] text-[#1754E8] hover:bg-[#DFE6F0] font-medium px-2.5 py-1.5 rounded-full whitespace-nowrap"
            >
              Draft Request
            </button>
          </div>

          {/* Composer */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-[#DFE6F0] flex gap-2">
            <input
              type="text"
              placeholder="Ask a question or request a draft..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 text-sm border border-[#DFE6F0] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1754E8]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-[#1754E8] text-white hover:bg-[#103FC2] disabled:opacity-50 p-2.5 rounded-lg transition-colors"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
