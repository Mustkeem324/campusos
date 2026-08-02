'use client';

import React, { useState } from 'react';
import { Cpu, Zap, Plus, CheckCircle2 } from 'lucide-react';
import { AutomationRule, executeAutomationRule } from '../../lib/automation-engine';

export function AutomationBuilderConsole() {
  const [rules] = useState<AutomationRule[]>([
    { id: 'rule_1', name: 'Attendance Shortage Alert Rule', trigger: 'ATTENDANCE_BELOW_75', condition: 'attendance < 75', action: 'POST_WHATSAPP_PARENT', isActive: true, executionCount: 14 },
    { id: 'rule_2', name: 'Fee Dues Warning Rule', trigger: 'FEE_INVOICE_GENERATED', condition: 'due > 0', action: 'SEND_SMS_ALERT', isActive: true, executionCount: 88 },
  ]);

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap size={20} className="text-amber-500" />
            <span>Open Platform Zapier-Style Automation Builder</span>
          </h2>
          <p className="text-xs text-gray-500">
            Build custom institutional workflows (Trigger $\rightarrow$ Condition $\rightarrow$ Action)
          </p>
        </div>

        <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow">
          <Plus size={14} />
          <span>New Automation Workflow</span>
        </button>
      </div>

      <div className="space-y-3">
        {rules.map((r) => (
          <div key={r.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs">
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white">{r.name}</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Trigger: <span className="font-mono text-indigo-500 font-bold">{r.trigger}</span> &rarr; Action: <span className="font-mono text-emerald-500 font-bold">{r.action}</span>
              </p>
            </div>

            <span className="font-mono font-bold text-gray-400">
              Executed: {r.executionCount} times
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
