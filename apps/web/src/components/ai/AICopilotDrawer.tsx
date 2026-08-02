'use client';

import React, { useState } from 'react';
import { Sparkles, Send, ShieldCheck, ArrowRight, Bot, BookOpen } from 'lucide-react';
import { useAuthStore } from '../../lib/auth-store';
import { queryRoleAICopilot, AICopilotResponse } from '../../lib/ai-copilot-service';

export function AICopilotDrawer() {
  const { currentSession } = useAuthStore();
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<AICopilotResponse | null>(null);

  const handleSendQuery = () => {
    if (!query.trim()) return;
    const res = queryRoleAICopilot(currentSession.role, query, currentSession.tenantId);
    setResponse(res);
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles size={20} className="text-indigo-500 animate-pulse" />
            <span>CampusOS Role AI Copilot (RAG & RLS Protected)</span>
          </h2>
          <p className="text-xs text-gray-500">
            Tailored AI assistant for <span className="font-bold text-indigo-500">{currentSession.role}</span> • Prompt-injection barrier active
          </p>
        </div>

        <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 text-xs font-bold font-mono">
          RAG RLS Active
        </span>
      </div>

      <div className="space-y-4">
        {/* Quick Suggested Prompts per Role */}
        <div className="flex gap-2 text-xs overflow-x-auto pb-1">
          <button
            onClick={() => setQuery('Am I at risk in Data Structures attendance?')}
            className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-indigo-50 text-gray-700 dark:text-gray-300 font-semibold transition shrink-0"
          >
            &quot;Am I at risk in Data Structures?&quot;
          </button>
          <button
            onClick={() => setQuery('Auto-generate 5 practice quiz questions for Unit 3')}
            className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-indigo-50 text-gray-700 dark:text-gray-300 font-semibold transition shrink-0"
          >
            &quot;Generate practice quiz from Unit 3&quot;
          </button>
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
            placeholder={`Ask CampusOS AI Copilot as ${currentSession.role}...`}
            className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
          />
          <button
            onClick={handleSendQuery}
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg transition"
          >
            <Send size={16} />
          </button>
        </div>

        {/* Response Box */}
        {response && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-3 animate-fade-in ${
              response.securityFlag
                ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 text-rose-900 dark:text-rose-200'
                : 'bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900 text-gray-800 dark:text-gray-200'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <div className="flex items-center gap-1.5">
                <Bot size={16} className="text-indigo-500" />
                <span>AI Response (Confidence: {Math.round(response.confidence * 100)}%)</span>
              </div>
              {response.securityFlag && <span className="text-rose-600 font-bold font-mono">SECURITY BLOCKED</span>}
            </div>

            <p className="leading-relaxed">{response.answer}</p>

            {response.citations.length > 0 && (
              <div className="pt-2 border-t border-indigo-200 dark:border-indigo-900/50">
                <span className="text-[10px] uppercase font-bold text-gray-400">Cited Source Records</span>
                <div className="flex gap-2 mt-1">
                  {response.citations.map((c, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-white dark:bg-gray-800 text-[10px] font-mono text-indigo-500 font-bold border">
                      {typeof c === 'string' ? c : (c as any).title || (c as any).recordId}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
