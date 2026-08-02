'use client';

import React, { useState } from 'react';
import { CheckSquare, QrCode, ShieldAlert, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import {
  APEX_CAMPUS_GEOFENCE,
  QRCheckInToken,
  calculateAttendanceShortage,
  validateQRCheckIn,
} from '../../lib/attendance-service';

export function AttendanceConsole() {
  const [activeTab, setActiveTab] = useState<'QUICK_MARK' | 'QR_ANTIPROXY' | 'SHORTAGE_CALCULATOR'>('SHORTAGE_CALCULATOR');

  const [studentSummary] = useState({
    studentId: 'usr_student_01',
    courseCode: 'CS401',
    courseTitle: 'Data Structures',
    totalClassesHeld: 24,
    classesAttended: 16, // 16 / 24 = 66.6% (< 75% shortage!)
    currentAttendancePct: 66.6,
    requiredAttendancePct: 75,
  });

  const shortageAnalysis = calculateAttendanceShortage(studentSummary);

  const [qrToken, setQrToken] = useState<QRCheckInToken>({
    sessionToken: 'qr_sess_9941a',
    courseOfferingId: 'offering_cs401_secA',
    generatedAt: Date.now(),
    expiresAt: Date.now() + 15000, // Rotating in 15 seconds
    geofence: APEX_CAMPUS_GEOFENCE,
  });

  const [scanResult, setScanResult] = useState<string | null>(null);

  const handleSimulateScan = () => {
    // Simulate student scanning inside 10m radius
    const res = validateQRCheckIn(qrToken, APEX_CAMPUS_GEOFENCE.latitude, APEX_CAMPUS_GEOFENCE.longitude, 'dev_fp_123');
    if (res.valid) {
      setScanResult('SUCCESS: Verified check-in inside geofence (Radius: 12m)');
    } else {
      setScanResult(`FAILED: ${res.reason}`);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <CheckSquare size={20} className="text-indigo-500" />
            <span>Anti-Proxy Attendance Engine & Shortage Calculator</span>
          </h2>
          <p className="text-xs text-gray-500">
            Rotating QR + Geofence lat/lng verification • Shortage projection calculator
          </p>
        </div>

        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('SHORTAGE_CALCULATOR')}
            className={`px-3 py-1 rounded-lg ${activeTab === 'SHORTAGE_CALCULATOR' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-400'}`}
          >
            Shortage Calculator
          </button>
          <button
            onClick={() => setActiveTab('QR_ANTIPROXY')}
            className={`px-3 py-1 rounded-lg ${activeTab === 'QR_ANTIPROXY' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-400'}`}
          >
            Anti-Proxy QR
          </button>
        </div>
      </div>

      {activeTab === 'SHORTAGE_CALCULATOR' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs">CS401 Attendance Health Summary</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-600 text-white font-mono font-bold text-[10px]">
                {studentSummary.currentAttendancePct.toFixed(1)}% Attended
              </span>
            </div>

            <p className="text-xs">
              Attended <span className="font-bold">{studentSummary.classesAttended}</span> out of{' '}
              <span className="font-bold">{studentSummary.totalClassesHeld}</span> lectures held.
            </p>

            <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/60 font-bold text-xs flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-600" />
              <span>
                Shortage Alert! You must attend{' '}
                <span className="text-rose-600 dark:text-rose-400 font-extrabold underline">
                  {shortageAnalysis.lecturesNeededForTarget}
                </span>{' '}
                more consecutive lectures to reach the 75% eligibility threshold.
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'QR_ANTIPROXY' && (
        <div className="space-y-4 text-center py-4">
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 inline-block space-y-3">
            <QrCode size={120} className="mx-auto text-indigo-400 animate-pulse" />
            <p className="text-xs text-indigo-300 font-mono font-bold">
              Token: {qrToken.sessionToken} (Rotates in 15s)
            </p>
            <p className="text-[10px] text-slate-400">
              Geofence Lat/Lng: {APEX_CAMPUS_GEOFENCE.latitude}, {APEX_CAMPUS_GEOFENCE.longitude} (Radius: 100m)
            </p>
          </div>

          <div>
            <button
              onClick={handleSimulateScan}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg"
            >
              Simulate Student Mobile Check-In
            </button>
          </div>

          {scanResult && (
            <div className="text-xs font-mono font-bold text-emerald-500">
              {scanResult}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
