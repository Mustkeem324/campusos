'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { CommandPalette } from '../components/layout/CommandPalette';
import { RoleDashboard } from '../components/dashboard/RoleDashboard';
import { ImpersonationBanner } from '../components/auth/ImpersonationBanner';
import { OnboardingWizard } from '../components/tenant/OnboardingWizard';
import { BulkImportModal } from '../components/users/BulkImportModal';
import { AuditLogViewer } from '../components/audit/AuditLogViewer';
import { AcademicSetupManager } from '../components/academics/AcademicSetupManager';
import { CourseCatalogue } from '../components/courses/CourseCatalogue';
import { RegistrationConsole } from '../components/registration/RegistrationConsole';
import { ElectiveAllotmentConsole } from '../components/registration/ElectiveAllotmentConsole';
import { CourseWorkspace } from '../components/workspaces/CourseWorkspace';
import { TimetableWorkspace } from '../components/timetable/TimetableWorkspace';
import { AttendanceConsole } from '../components/attendance/AttendanceConsole';
import { LMSWorkspace } from '../components/lms/LMSWorkspace';
import { ExamSeatingManager } from '../components/exams/ExamSeatingManager';
import { MarksEntryApprovalConsole } from '../components/exams/MarksEntryApprovalConsole';
import { GradeCardMarksheet } from '../components/exams/GradeCardMarksheet';
import { FeeStructureManager } from '../components/finance/FeeStructureManager';
import { PaymentConsole } from '../components/finance/PaymentConsole';
import { FinanceTreasuryDashboard } from '../components/finance/FinanceTreasuryDashboard';
import { HostelManagementConsole } from '../components/campus/HostelManagementConsole';
import { TransportTrackerConsole } from '../components/campus/TransportTrackerConsole';
import { LibraryOPACConsole } from '../components/campus/LibraryOPACConsole';
import { StudentHelpdeskConsole } from '../components/campus/StudentHelpdeskConsole';
import { FeedbackAppraisalConsole } from '../components/campus/FeedbackAppraisalConsole';
import { AdmissionsCRMConsole } from '../components/lifecycle/AdmissionsCRMConsole';
import { PlacementsConsole } from '../components/lifecycle/PlacementsConsole';
import { AlumniNetworkConsole } from '../components/lifecycle/AlumniNetworkConsole';
import { AICopilotDrawer } from '../components/ai/AICopilotDrawer';
import { RetentionEngineDashboard } from '../components/ai/RetentionEngineDashboard';
import { AutomationBuilderConsole } from '../components/ai/AutomationBuilderConsole';
import { SuperiorityMatrixModal } from '../components/ai/SuperiorityMatrixModal';
import { SecurityHardeningConsole } from '../components/system/SecurityHardeningConsole';
import { OfflineSyncConsole } from '../components/system/OfflineSyncConsole';
import { SystemHealthConsole } from '../components/system/SystemHealthConsole';
import { OmnichannelCommsConsole } from '../components/comms/OmnichannelCommsConsole';
import { EmergencyBroadcastConsole } from '../components/comms/EmergencyBroadcastConsole';
import { GovtIntegrationsConsole } from '../components/compliance/GovtIntegrationsConsole';
import { NAACAccreditationWorkspace } from '../components/compliance/NAACAccreditationWorkspace';
import { ResearchGrantsConsole } from '../components/research/ResearchGrantsConsole';
import { FacultyPublicationsConsole } from '../components/research/FacultyPublicationsConsole';
import { IPRIncubatorConsole } from '../components/research/IPRIncubatorConsole';
import { ProcurementThreeWayMatchConsole } from '../components/operations/ProcurementThreeWayMatchConsole';
import { AssetDepreciationConsole } from '../components/operations/AssetDepreciationConsole';
import { FacilityVisitorConsole } from '../components/operations/FacilityVisitorConsole';
import { PayrollDisbursementConsole } from '../components/hr/PayrollDisbursementConsole';
import { StaffLeaveLedgerConsole } from '../components/hr/StaffLeaveLedgerConsole';
import { SOSPanicSafetyConsole } from '../components/wellness/SOSPanicSafetyConsole';
import { POSHConfidentialConsole } from '../components/wellness/POSHConfidentialConsole';
import { DisabilityEMRConsole } from '../components/wellness/DisabilityEMRConsole';
import { GamificationLeaderboardConsole } from '../components/engagement/GamificationLeaderboardConsole';
import { ClubEventsConsole } from '../components/engagement/ClubEventsConsole';
import { MultiCampusTreasuryConsole } from '../components/campus/MultiCampusTreasuryConsole';
import { CrossCampusElectiveConsole } from '../components/campus/CrossCampusElectiveConsole';
import { SaaSProvisioningConsole } from '../components/saas/SaaSProvisioningConsole';
import { FeatureFlagEntitlementConsole } from '../components/saas/FeatureFlagEntitlementConsole';
import { PrometheusMetricsConsole } from '../components/system/PrometheusMetricsConsole';
import { ChaosTestingConsole } from '../components/system/ChaosTestingConsole';
import { PublicCertificateVerifierConsole } from '../components/public/PublicCertificateVerifierConsole';
import { InteractiveROICalculatorConsole } from '../components/public/InteractiveROICalculatorConsole';
import { StudentProfileConsole } from '../components/student/StudentProfileConsole';
import { DiscussionForumConsole } from '../components/student/DiscussionForumConsole';
import { StudentWebinarsConsole } from '../components/student/StudentWebinarsConsole';
import { Can } from '../components/auth/Can';
import { useAuthStore } from '../lib/auth-store';
import { Building2, UserPlus, Shield, BookOpen, Layers, Cpu, CheckSquare, Calendar, Video, GraduationCap, Grid, Lock, DollarSign, CreditCard, Bus, Library, HelpCircle, MessageSquare, Briefcase, Award, Users, Sparkles, Activity, Zap, ShieldCheck, WifiOff, Server, AlertOctagon, CloudUpload, Rocket, ShoppingCart, Building, UserCheck, HeartPulse, Trophy, Flame, Globe, Search, TrendingUp, User, MessageCircle } from 'lucide-react';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { isSidebarCollapsed, currentSession } = useAuthStore();
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'student-profile'
    | 'forum'
    | 'webinars'
    | 'updates'
    | 'verify-cert'
    | 'roi-calc'
    | 'prometheus-metrics'
    | 'chaos-testing'
    | 'saas-provision'
    | 'feature-flags'
    | 'group-treasury'
    | 'cross-campus'
    | 'gamification'
    | 'club-events'
    | 'sos-panic'
    | 'posh'
    | 'disability-emr'
    | 'payroll'
    | 'staff-leave'
    | 'three-way-match'
    | 'assets'
    | 'facilities'
    | 'grants'
    | 'publications'
    | 'ipr'
    | 'digilocker'
    | 'naac'
    | 'comms'
    | 'emergency'
    | 'ai-copilot'
    | 'retention'
    | 'automation'
    | 'security'
    | 'offline-sync'
    | 'system-health'
    | 'onboarding'
    | 'audit'
    | 'academic-setup'
    | 'catalogue'
    | 'registration'
    | 'allotment'
    | 'timetable'
    | 'attendance'
    | 'lms'
    | 'workspace'
    | 'exam-seating'
    | 'marks-lock'
    | 'marksheet'
    | 'fee-structures'
    | 'payments'
    | 'treasury'
    | 'hostel'
    | 'transport'
    | 'opac'
    | 'helpdesk'
    | 'feedback'
    | 'admissions-crm'
    | 'placements'
    | 'alumni'
  >('dashboard');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl animate-bounce shadow-xl">
            C
          </div>
          <span className="text-xs font-mono font-bold text-gray-400">Loading CampusOS ERP...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <ImpersonationBanner />
      <Sidebar activeTab={activeTab} onSelectTab={(tabId) => setActiveTab(tabId as any)} />
      <Header />
      <CommandPalette />
      <BulkImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
      <SuperiorityMatrixModal isOpen={isMatrixOpen} onClose={() => setIsMatrixOpen(false)} />

      <main
        className={`flex-1 transition-all duration-300 pt-20 pb-12 px-6 ${
          isSidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Student Welcome Banner */}
          {currentSession.role === 'STUDENT' && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 text-white shadow-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-200">
                  {currentSession.institutionName} • Student Portal
                </span>
                <h1 className="text-xl font-extrabold tracking-tight mt-0.5">
                  Welcome back, {currentSession.name}!
                </h1>
                <p className="text-xs text-indigo-100 font-mono mt-1">
                  ID: {currentSession.email} • Program: B.Tech Computer Science • CGPA: 3.84
                </p>
              </div>

              <button
                onClick={() => setActiveTab('student-profile')}
                className="px-4 py-2 rounded-xl bg-white text-indigo-900 font-extrabold text-xs shadow-lg hover:bg-indigo-50 transition shrink-0"
              >
                View Profile
              </button>
            </div>
          )}

          {/* Top Quick Navigation Tabs */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm overflow-x-auto">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'dashboard'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                Dashboard
              </button>

              {currentSession.role === 'STUDENT' && (
                <>
                  <button
                    onClick={() => setActiveTab('student-profile')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      activeTab === 'student-profile'
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <User size={14} />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('forum')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      activeTab === 'forum'
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <MessageCircle size={14} />
                    <span>Discussion Forum</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('webinars')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      activeTab === 'webinars'
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Video size={14} />
                    <span>Webinars</span>
                  </button>
                </>
              )}

              <button
                onClick={() => setActiveTab('verify-cert')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'verify-cert'
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <ShieldCheck size={14} />
                <span>Public Cert Verification</span>
              </button>

              <Can resource="audit" action="read" scope="institution">
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeTab === 'audit'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Shield size={14} />
                  <span>Audit Logs</span>
                </button>
              </Can>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsMatrixOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold shadow"
              >
                <Sparkles size={14} />
                <span>CampusOS vs CampX Matrix</span>
              </button>
            </div>
          </div>

          {/* Active Tab Content */}
          {activeTab === 'dashboard' && <RoleDashboard />}
          {activeTab === 'student-profile' && <StudentProfileConsole />}
          {activeTab === 'forum' && <DiscussionForumConsole />}
          {activeTab === 'webinars' && <StudentWebinarsConsole />}
          {activeTab === 'verify-cert' && <PublicCertificateVerifierConsole />}
          {activeTab === 'roi-calc' && <InteractiveROICalculatorConsole />}
          {activeTab === 'prometheus-metrics' && <PrometheusMetricsConsole />}
          {activeTab === 'chaos-testing' && <ChaosTestingConsole />}
          {activeTab === 'saas-provision' && <SaaSProvisioningConsole />}
          {activeTab === 'feature-flags' && <FeatureFlagEntitlementConsole />}
          {activeTab === 'group-treasury' && <MultiCampusTreasuryConsole />}
          {activeTab === 'cross-campus' && <CrossCampusElectiveConsole />}
          {activeTab === 'gamification' && <GamificationLeaderboardConsole />}
          {activeTab === 'club-events' && <ClubEventsConsole />}
          {activeTab === 'sos-panic' && <SOSPanicSafetyConsole />}
          {activeTab === 'posh' && <POSHConfidentialConsole />}
          {activeTab === 'disability-emr' && <DisabilityEMRConsole />}
          {activeTab === 'payroll' && <PayrollDisbursementConsole />}
          {activeTab === 'staff-leave' && <StaffLeaveLedgerConsole />}
          {activeTab === 'three-way-match' && <ProcurementThreeWayMatchConsole />}
          {activeTab === 'assets' && <AssetDepreciationConsole />}
          {activeTab === 'facilities' && <FacilityVisitorConsole />}
          {activeTab === 'grants' && <ResearchGrantsConsole />}
          {activeTab === 'publications' && <FacultyPublicationsConsole />}
          {activeTab === 'ipr' && <IPRIncubatorConsole />}
          {activeTab === 'digilocker' && <GovtIntegrationsConsole />}
          {activeTab === 'naac' && <NAACAccreditationWorkspace />}
          {activeTab === 'comms' && <OmnichannelCommsConsole />}
          {activeTab === 'emergency' && <EmergencyBroadcastConsole />}
          {activeTab === 'security' && <SecurityHardeningConsole />}
          {activeTab === 'offline-sync' && <OfflineSyncConsole />}
          {activeTab === 'system-health' && <SystemHealthConsole />}
          {activeTab === 'ai-copilot' && <AICopilotDrawer />}
          {activeTab === 'retention' && <RetentionEngineDashboard />}
          {activeTab === 'automation' && <AutomationBuilderConsole />}
          {activeTab === 'admissions-crm' && <AdmissionsCRMConsole />}
          {activeTab === 'placements' && <PlacementsConsole />}
          {activeTab === 'alumni' && <AlumniNetworkConsole />}
          {activeTab === 'hostel' && <HostelManagementConsole />}
          {activeTab === 'transport' && <TransportTrackerConsole />}
          {activeTab === 'opac' && <LibraryOPACConsole />}
          {activeTab === 'helpdesk' && <StudentHelpdeskConsole />}
          {activeTab === 'feedback' && <FeedbackAppraisalConsole />}
          {activeTab === 'treasury' && <FinanceTreasuryDashboard />}
          {activeTab === 'payments' && <PaymentConsole />}
          {activeTab === 'fee-structures' && <FeeStructureManager />}
          {activeTab === 'marksheet' && <GradeCardMarksheet />}
          {activeTab === 'exam-seating' && <ExamSeatingManager />}
          {activeTab === 'marks-lock' && <MarksEntryApprovalConsole />}
          {activeTab === 'timetable' && <TimetableWorkspace />}
          {activeTab === 'attendance' && <AttendanceConsole />}
          {activeTab === 'lms' && <LMSWorkspace />}
          {activeTab === 'academic-setup' && <AcademicSetupManager />}
          {activeTab === 'catalogue' && <CourseCatalogue />}
          {activeTab === 'registration' && <RegistrationConsole />}
          {activeTab === 'allotment' && <ElectiveAllotmentConsole />}
          {activeTab === 'workspace' && <CourseWorkspace />}
          {activeTab === 'onboarding' && <OnboardingWizard />}
          {activeTab === 'audit' && <AuditLogViewer />}
        </div>
      </main>
    </div>
  );
}
