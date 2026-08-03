'use client';

import React, { useState } from 'react';
import {
  CreditCard, Wallet, QrCode, Smartphone, Shield, RefreshCw,
  ArrowUpRight, ArrowDownLeft, Search, Clock, Lock, Unlock,
  AlertTriangle, Plus, Eye, Copy, Fingerprint, Wifi
} from 'lucide-react';

type WalletTab = 'digital-id' | 'wallet' | 'transactions' | 'access-log' | 'card-settings';

interface Transaction {
  id: string;
  type: 'debit' | 'credit';
  merchant: string;
  category: string;
  amount: number;
  date: string;
  time: string;
  status: 'Completed' | 'Pending' | 'Refunded';
  referenceId: string;
}

interface AccessLog {
  id: string;
  location: string;
  accessType: 'Entry' | 'Exit';
  method: 'QR' | 'NFC' | 'Barcode';
  timestamp: string;
  status: 'Granted' | 'Denied';
}

const mockTransactions: Transaction[] = [];
const mockAccessLog: AccessLog[] = [];
const spendingByCategory: any[] = [];
const maxSpend = 0;

export function DigitalIDWalletConsole() {
  const [tab, setTab] = useState<WalletTab>('digital-id');
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [isCardFrozen, setIsCardFrozen] = useState(false);
  const [search, setSearch] = useState('');

  const walletBalance = 2450;
  const monthlyLimit = 5000;
  const monthlySpent = 3120;

  const tabs: { id: WalletTab; label: string; icon: React.ElementType }[] = [
    { id: 'digital-id', label: 'Digital ID', icon: CreditCard },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'transactions', label: 'Transactions', icon: Clock },
    { id: 'access-log', label: 'Access Log', icon: Shield },
    { id: 'card-settings', label: 'Card Settings', icon: Fingerprint },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Smartphone size={22} className="text-indigo-500" />
            Digital Campus ID & Wallet
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Your digital identity, campus wallet & access control
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition">
          <Plus size={14} />
          Top Up Wallet
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm overflow-x-auto">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                tab === t.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Digital ID Tab */}
      {tab === 'digital-id' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ID Card */}
          <div className="flex flex-col items-center gap-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tap card to flip</p>
            <div
              className="w-[380px] h-[240px] rounded-2xl cursor-pointer transition-all duration-500 relative"
              onClick={() => setIsCardFlipped(!isCardFlipped)}
              style={{ perspective: '1000px' }}
            >
              <div
                className="w-full h-full relative transition-all duration-500"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* Front */}
                <div
                  className="absolute inset-0 rounded-2xl p-6 text-white shadow-2xl"
                  style={{
                    backfaceVisibility: 'hidden',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #2563eb 100%)',
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">University of Petroleum & Energy Studies</p>
                      <h3 className="text-lg font-extrabold mt-1">MUSTKEEM AHMAD</h3>
                      <p className="text-xs text-indigo-200 mt-0.5">MBA (Business Analytics) • Batch 2024</p>
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-2xl font-extrabold backdrop-blur-sm">
                      MA
                    </div>
                  </div>
                  <div className="mt-6 flex items-end justify-between">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-indigo-200">SAP ID</p>
                      <p className="text-lg font-mono font-extrabold tracking-wider">500129078</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm"><QrCode size={18} /></div>
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm"><Wifi size={18} /></div>
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-6 right-6 flex items-center justify-between text-[9px] text-indigo-200">
                    <span>Valid: 07/2024 – 06/2026</span>
                    <span>NFC + QR Enabled</span>
                  </div>
                </div>

                {/* Back */}
                <div
                  className="absolute inset-0 rounded-2xl p-6 text-white shadow-2xl"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e3a5f 100%)',
                  }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 mb-3">Emergency Information</p>
                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between"><span className="text-indigo-300">Blood Group</span><span className="font-bold">B+</span></div>
                    <div className="flex justify-between"><span className="text-indigo-300">Emergency Contact</span><span className="font-bold">+91 98765 43210</span></div>
                    <div className="flex justify-between"><span className="text-indigo-300">Relation</span><span className="font-bold">Father</span></div>
                    <div className="flex justify-between"><span className="text-indigo-300">Medical Conditions</span><span className="font-bold">None</span></div>
                    <div className="flex justify-between"><span className="text-indigo-300">Allergies</span><span className="font-bold">None</span></div>
                  </div>
                  <div className="mt-4 p-2 rounded-lg bg-white/10 text-center">
                    <p className="text-[9px] text-indigo-200 font-mono">▐▐▐▐▐▌▐▐▌▐▐▐▐▌▐▐▐▐▌▐▐▐▌▐▐▐▐▐▌▐▐▐</p>
                    <p className="text-[9px] text-indigo-300 mt-1">Barcode: 500129078-UPES-2024</p>
                  </div>
                </div>
              </div>
            </div>
            {isCardFrozen && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold">
                <Lock size={14} />
                Card is currently FROZEN — Access disabled
              </div>
            )}
          </div>

          {/* Access Controls */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Access Permissions</h3>
            {[
              { area: 'Main Gate', enabled: true, lastUsed: 'Today 08:15 AM' },
              { area: 'Hostel Block C', enabled: true, lastUsed: 'Yesterday 10:30 PM' },
              { area: 'Library', enabled: true, lastUsed: 'Today 10:00 AM' },
              { area: 'Computer Lab', enabled: true, lastUsed: 'Today 2:00 PM' },
              { area: 'Research Lab A1', enabled: false, lastUsed: 'Access Denied' },
              { area: 'Faculty Lounge', enabled: false, lastUsed: 'Not Authorized' },
            ].map((a, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${a.enabled ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                    {a.enabled ? <Unlock size={14} className="text-emerald-600" /> : <Lock size={14} className="text-red-600" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{a.area}</p>
                    <p className="text-[10px] text-gray-400">{a.lastUsed}</p>
                  </div>
                </div>
                <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${a.enabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${a.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wallet Tab */}
      {tab === 'wallet' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Balance Card */}
          <div className="lg:col-span-1 space-y-4">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xl">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200">Campus Wallet Balance</p>
              <p className="text-4xl font-extrabold mt-2">₹{walletBalance.toLocaleString()}</p>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-bold transition backdrop-blur-sm">
                  <Plus size={12} className="inline mr-1" /> Top Up
                </button>
                <button className="flex-1 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-bold transition backdrop-blur-sm">
                  <QrCode size={12} className="inline mr-1" /> Pay
                </button>
              </div>
            </div>

            {/* Monthly Limit */}
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Monthly Spending</p>
                <span className="text-xs font-bold text-gray-500">₹{monthlySpent} / ₹{monthlyLimit}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${(monthlySpent / monthlyLimit) * 100}%` }} />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">{Math.round((monthlySpent / monthlyLimit) * 100)}% of monthly limit used</p>
            </div>

            {/* Quick Pay */}
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
              <p className="text-xs font-extrabold text-gray-900 dark:text-white mb-3">Quick Pay Merchants</p>
              <div className="grid grid-cols-3 gap-2">
                {['Canteen', 'Bookstore', 'Xerox', 'Library', 'Sports', 'Events'].map((m, i) => (
                  <button key={i} className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-gray-200 dark:border-gray-700 text-[10px] font-bold text-gray-700 dark:text-gray-300 transition text-center">
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Spending Analytics */}
          <div className="lg:col-span-2 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-4">Spending Analytics — This Month</h3>
            <div className="space-y-3">
              {spendingByCategory.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No spending data for this month
                </div>
              ) : (
                spendingByCategory.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400 w-20 text-right">{s.category}</span>
                    <div className="flex-1 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div
                        className={`h-full ${s.color} rounded-lg flex items-center justify-end pr-2 text-[10px] font-bold text-white transition-all`}
                        style={{ width: `${(s.amount / maxSpend) * 100}%`, minWidth: '40px' }}
                      >
                        ₹{s.amount}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pending Refunds */}
            <div className="mt-6">
              <h4 className="text-xs font-extrabold text-gray-900 dark:text-white mb-2">Pending Refunds</h4>
              <div className="space-y-2">
                <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm border border-gray-200 dark:border-gray-800 rounded-xl">
                  No pending refunds
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {tab === 'transactions' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search transactions..."
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          {mockTransactions.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400 text-sm border border-gray-200 dark:border-gray-800 rounded-2xl">
              No transactions found
            </div>
          ) : (
            mockTransactions.filter(t => t.merchant.toLowerCase().includes(search.toLowerCase())).map(t => (
              <div key={t.id} className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  t.type === 'credit' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  {t.type === 'credit' ? <ArrowDownLeft size={18} className="text-emerald-600" /> : <ArrowUpRight size={18} className="text-red-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{t.merchant}</p>
                    {t.status === 'Refunded' && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Refunded</span>}
                  </div>
                  <p className="text-[10px] text-gray-400">{t.date} {t.time} • {t.category}</p>
                  <p className="text-[9px] font-mono text-gray-400">{t.referenceId}</p>
                </div>
                <p className={`text-sm font-extrabold ${t.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {t.type === 'credit' ? '+' : '-'}₹{t.amount}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Access Log Tab */}
      {tab === 'access-log' && (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {['ID', 'Location', 'Type', 'Method', 'Timestamp', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {mockAccessLog.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                    No access log recorded
                  </td>
                </tr>
              ) : (
                mockAccessLog.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-500">{a.id}</td>
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{a.location}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${a.accessType === 'Entry' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>{a.accessType}</span></td>
                    <td className="px-4 py-3 font-bold text-gray-600 dark:text-gray-400">{a.method}</td>
                    <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400">{a.timestamp}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${a.status === 'Granted' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>{a.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Card Settings Tab */}
      {tab === 'card-settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Card Management</h3>

            {/* Freeze Toggle */}
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCardFrozen ? 'bg-red-100 dark:bg-red-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
                    {isCardFrozen ? <Lock size={18} className="text-red-600" /> : <Unlock size={18} className="text-emerald-600" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{isCardFrozen ? 'Card Frozen' : 'Card Active'}</p>
                    <p className="text-[10px] text-gray-400">Freeze your card to disable all access</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCardFrozen(!isCardFrozen)}
                  className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${isCardFrozen ? 'bg-red-500' : 'bg-emerald-500'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isCardFrozen ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>

            {/* Card Details */}
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
              {[
                { label: 'Card Number', value: 'UPES-2024-500129078' },
                { label: 'Issued Date', value: 'July 20, 2024' },
                { label: 'Expiry Date', value: 'June 30, 2026' },
                { label: 'Card Type', value: 'Student — Full Access' },
                { label: 'NFC Chip', value: 'Active — Mifare DESFire EV3' },
              ].map((d, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">{d.label}</span>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Replacement Request */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Request Replacement</h3>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Reason for Replacement</label>
                <select className="w-full px-3 py-2 rounded-xl text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>Lost Card</option>
                  <option>Damaged Card</option>
                  <option>Stolen Card</option>
                  <option>Name Change</option>
                  <option>Photo Update</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Additional Notes</label>
                <textarea
                  rows={3}
                  placeholder="Describe the issue..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-400">Replacement Fee:</span>
                <span className="font-bold text-gray-700 dark:text-gray-300">₹200</span>
              </div>
              <button className="w-full px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition">
                Submit Replacement Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
