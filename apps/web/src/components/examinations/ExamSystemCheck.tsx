'use client';

import Link from 'next/link';
import React from 'react';
import { Camera, CheckCircle2, Laptop, Mic, MonitorUp, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';

type CheckState = 'IDLE' | 'RUNNING' | 'PASS' | 'FAIL';

type CheckItem = {
  key: string;
  label: string;
  detail: string;
  state: CheckState;
};

const initialChecks: CheckItem[] = [
  { key: 'browser', label: 'Supported browser capabilities', detail: 'Camera APIs, secure context and modern JavaScript.', state: 'IDLE' },
  { key: 'camera', label: 'Camera', detail: 'Checks whether camera permission and a video track are available.', state: 'IDLE' },
  { key: 'microphone', label: 'Microphone', detail: 'Checks optional examination audio capability.', state: 'IDLE' },
  { key: 'fullscreen', label: 'Fullscreen', detail: 'Checks the browser fullscreen capability used by secure exams.', state: 'IDLE' },
  { key: 'screen', label: 'Screen-sharing capability', detail: 'Checks API availability only; it does not start sharing.', state: 'IDLE' },
];

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  browser: Laptop,
  camera: Camera,
  microphone: Mic,
  fullscreen: ShieldCheck,
  screen: MonitorUp,
};

export function ExamSystemCheck() {
  const [checks, setChecks] = React.useState(initialChecks);
  const [message, setMessage] = React.useState('Run this check before examination day. It does not create or consume an exam attempt.');

  async function run() {
    setChecks((current) => current.map((item) => ({ ...item, state: 'RUNNING' })));
    setMessage('Checking this device…');

    const browser = window.isSecureContext && Boolean(navigator.mediaDevices?.getUserMedia);
    const fullscreen = Boolean(document.documentElement.requestFullscreen);
    const screen = Boolean(navigator.mediaDevices?.getDisplayMedia);
    let camera = false;
    let microphone = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      camera = stream.getVideoTracks().length > 0;
      microphone = stream.getAudioTracks().length > 0;
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        camera = stream.getVideoTracks().length > 0;
        stream.getTracks().forEach((track) => track.stop());
      } catch {
        camera = false;
      }
    }

    const values: Record<string, boolean> = { browser, camera, microphone, fullscreen, screen };
    setChecks((current) => current.map((item) => ({ ...item, state: values[item.key] ? 'PASS' : 'FAIL' })));
    setMessage(browser && camera && fullscreen
      ? 'Core secure-exam capabilities are available. An individual exam may require additional permissions such as microphone, screen sharing or 3D Eyes.'
      : 'This device is missing one or more core capabilities. Review failed checks before exam day.');
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-950 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-blue-700">NAVEMORA Secure Examination</p><h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">Practice system check</h1><p className="mt-2 text-sm leading-6 text-slate-500">{message}</p></div>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"><Laptop className="h-6 w-6" /></span>
          </div>

          <div className="mt-7 space-y-3">
            {checks.map((item) => {
              const Icon = icons[item.key];
              return (
                <div key={item.key} className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-200"><Icon className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1"><p className="text-sm font-extrabold text-slate-900 dark:text-white">{item.label}</p><p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p></div>
                  <span className="mt-1 shrink-0">{item.state === 'PASS' ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : item.state === 'FAIL' ? <XCircle className="h-5 w-5 text-red-600" /> : item.state === 'RUNNING' ? <RefreshCw className="h-5 w-5 animate-spin text-blue-600" /> : <span className="block h-5 w-5 rounded-full border-2 border-slate-200" />}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-3"><button onClick={() => void run()} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-700 px-5 text-xs font-extrabold text-white hover:bg-blue-800"><RefreshCw className="h-4 w-4" />Run device check</button><Link href="/examinations" className="inline-flex h-11 items-center rounded-xl border border-slate-200 px-5 text-xs font-extrabold text-slate-700 dark:border-slate-700 dark:text-slate-200">Back to examinations</Link></div>
        </div>
      </div>
    </div>
  );
}
