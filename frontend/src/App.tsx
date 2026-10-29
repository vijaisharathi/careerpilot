import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { StudentDataProvider } from './context/StudentDataContext';
import { ToastProvider } from './context/ToastContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { PlacementLayout } from './components/layout/PlacementLayout';

// Student & Public Pages
import {
  HomePage,
  RegisterPage,
  LoginPage,
  OnboardingPage,
  DashboardPage,
  ProfilePage,
  CareerAnalysisPage,
  SkillGapPage,
  RoadmapPage,
  JobsPage,
  JobDetailsPage,
  CampusDrivesPage,
  ResumeBuilderPage,
  ResumeAnalysisPage,
  InterviewPrepPage,
  InterviewSessionPage,
  CodingHubPage,
  CodingWorkspacePage,
  CodingAssessmentAttemptPage,
  ApplicationsPage,
  AiAssistantPage,
  NotificationsPage,
  SettingsPage,
  NotFoundPage,
} from './pages';

// Phase 13: Dedicated Admin Portal Pages
import {
  AdminOverviewPage,
  AdminStudentsPage,
  AdminStudentDetailPage,
  AdminJobsPage,
  AdminRolesPage,
  AdminResourcesPage,
  AdminAiMonitoringPage,
  AdminAuditLogsPage,
  AdminSettingsPage,
} from './pages/admin';

// Phase 14: Dedicated Placement Officer Portal Pages
import {
  PlacementDashboardPage,
  PlacementStudentsPage,
  PlacementStudentDetailPage,
  PlacementReadinessPage,
  PlacementDrivesPage,
  PlacementDriveDetailPage,
  PlacementAnalyticsPage,
  PlacementAnnouncementsPage,
} from './pages/placement';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StudentDataProvider>
          <ToastProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />

              {/* Authenticated Dashboard Shell Layout (Student Experience) */}
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/career-analysis" element={<CareerAnalysisPage />} />
                <Route path="/skill-gap" element={<SkillGapPage />} />
                <Route path="/roadmap" element={<RoadmapPage />} />
                <Route path="/campus-drives" element={<CampusDrivesPage />} />
                <Route path="/jobs" element={<JobsPage />} />
                <Route path="/jobs/:id" element={<JobDetailsPage />} />
                <Route path="/resume-builder" element={<ResumeBuilderPage />} />
                <Route path="/resume-analysis" element={<ResumeAnalysisPage />} />
                <Route path="/interview-prep" element={<InterviewPrepPage />} />
                <Route path="/interview-session" element={<InterviewSessionPage />} />
                <Route path="/coding" element={<CodingHubPage />} />
                <Route path="/coding/practice/:slug" element={<CodingWorkspacePage />} />
                <Route path="/coding/assessment/:attemptId" element={<CodingAssessmentAttemptPage />} />
                <Route path="/applications" element={<ApplicationsPage />} />
                <Route path="/ai-assistant" element={<AiAssistantPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              {/* Dedicated Placement Officer Portal (Protected by PlacementLayout RBAC) */}
              <Route path="/placement" element={<PlacementLayout />}>
                <Route index element={<PlacementDashboardPage />} />
                <Route path="dashboard" element={<PlacementDashboardPage />} />
                <Route path="students" element={<PlacementStudentsPage />} />
                <Route path="students/:id" element={<PlacementStudentDetailPage />} />
                <Route path="readiness" element={<PlacementReadinessPage />} />
                <Route path="drives" element={<PlacementDrivesPage />} />
                <Route path="drives/:id" element={<PlacementDriveDetailPage />} />
                <Route path="analytics" element={<PlacementAnalyticsPage />} />
                <Route path="announcements" element={<PlacementAnnouncementsPage />} />
              </Route>

              {/* Dedicated Admin Portal Shell Layout (Protected by AdminLayout RBAC) */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminOverviewPage />} />
                <Route path="overview" element={<AdminOverviewPage />} />
                <Route path="students" element={<AdminStudentsPage />} />
                <Route path="students/:id" element={<AdminStudentDetailPage />} />
                <Route path="jobs" element={<AdminJobsPage />} />
                <Route path="career-roles" element={<AdminRolesPage />} />
                <Route path="learning-resources" element={<AdminResourcesPage />} />
                <Route path="ai-monitoring" element={<AdminAiMonitoringPage />} />
                <Route path="audit-logs" element={<AdminAuditLogsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>

              {/* 404 Catch-All */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ToastProvider>
        </StudentDataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
