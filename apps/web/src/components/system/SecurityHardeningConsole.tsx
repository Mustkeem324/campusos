'use client';

import React, { useState } from 'react';
import { ShieldCheck, Lock, Key, AlertOctagon, CheckCircle2, Zap } from 'lucide-react';
import { encryptSensitiveField, decryptSensitiveField, checkSlidingWindowRateLimit } from '../../lib/security-service';

export function SecurityHardeningConsole() {
  const [plainText, setPlainText] = useState('SSN-994-01-2026');
  const [encResult, setEncResult] = useState<{ encryptedData: string; iv: string; tag: string } | null>(null);
  const [decryptedText, setDecryptedText] = useState<string | null>(null);

  const [rateLimitState, setRateLimitState] = useState<{ allowed: boolean; remaining: number } | null>(null);

  const handleEncrypt = () => {
    const res = encryptSensitiveField(plainText);
    setEncResult(res);
    setDecryptedText(null);
  };

  const handleDecrypt = () => {
    if (encResult) {
      const dec = decryptSensitiveField(encResult.encryptedData, encResult.iv, encResult.tag);
      setDecryptedText(dec);
    }
  };

  const handleTestRateLimit = () => {
    const res = checkSlidingWindowRateLimit('ip_client_demo', 5, 60000);
    setRateLimitState(res);
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck size={20} className="text-indigo-500" />
            <span>Production Security Hardening & Penetration Defense</span>
          </h2>
          <p className="text-xs text-gray-500">
            AES-256-GCM Field Encryption • Redis Sliding Window Rate Limiting • IDOR RLS Guard
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AES-256-GCM Encryption Tester */}
        <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-3">
          <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
            <Lock size={16} className="text-indigo-500" />
            <span>Field-Level AES-256-GCM PII Encryption</span>
          </h3>

          <div className="space-y-2">
            <input
              type="text"
              value={plainText}
              onChange={(e) => setPlainText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border text-xs font-mono"
            />
            <div className="flex gap-2">
              <button
                onClick={handleEncrypt}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-extrabold text-xs shadow"
              >
                Encrypt Field (AES-256)
              </button>
              {encResult && (
                <button
                  onClick={handleDecrypt}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-extrabold text-xs shadow"
                >
                  Decrypt Field
                </button>
              )}
            </div>
          </div>

          {encResult && (
            <div className="p-3 rounded-xl bg-slate-950 text-white font-mono text-[10px] space-y-1 break-all">
              <p className="text-emerald-400">Encrypted: {encResult.encryptedData}</p>
              <p className="text-slate-400">IV: {encResult.iv} • Tag: {encResult.tag}</p>
            </div>
          )}

          {decryptedText && (
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 text-xs font-bold font-mono">
              Decrypted Result: {decryptedText}
            </div>
          )}
        </div>

        {/* Redis Sliding Window Rate Limiter Simulator */}
        <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-3">
          <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
            <Zap size={16} className="text-amber-500" />
            <span>Redis Sliding Window Rate Limiter (Max 5 Req/Min)</span>
          </h3>

          <button
            onClick={handleTestRateLimit}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow"
          >
            Simulate Rapid API Request
          </button>

          {rateLimitState && (
            <div
              className={`p-3 rounded-xl border text-xs font-bold font-mono ${
                rateLimitState.allowed
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 text-rose-900 dark:text-rose-200 animate-shake'
              }`}
            >
              {rateLimitState.allowed
                ? `ALLOWED! Remaining Requests in Window: ${rateLimitState.remaining}`
                : `429 TOO MANY REQUESTS! Rate Limit Exceeded. Blocked by Sliding Window.`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
