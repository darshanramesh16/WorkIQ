import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import ResumeScreening from "./pages/ResumeScreening";
import ChatAssistant from "./pages/ChatAssistant";
import LeaveManagement from "./pages/LeaveManagement";
import JobPostings from "./pages/JobPostings";
import Interviews from "./pages/Interviews";
import Announcements from "./pages/Announcements";
// import CandidateResumeUpload from "./pages/CandidateResumeUpload";
import EmployeeCareerDevelopment from "./pages/EmployeeCareerDevelopment";
import InternalJobs from "./pages/InternalJobs";
import LearningPath from "./pages/LearningPath";
import RecruitmentAnalytics from "./pages/RecruitmentAnalytics";
import AIInterview from "./pages/AIInterview";
import HRQuestions from "./pages/HRQuestions";
import InterviewReport from "./pages/InterviewReport";
import AIInterviewResults from "./pages/AIInterviewResults";
import DatabaseViewer from "./pages/DatabaseViewer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees"
              element={
                <ProtectedRoute allowedRoles={["admin", "hr", "manager"]}>
                  <Employees />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leave-management"
              element={
                <ProtectedRoute>
                  <LeaveManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/job-postings"
              element={
                <ProtectedRoute>
                  <JobPostings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/interviews"
              element={
                <ProtectedRoute allowedRoles={["admin", "hr"]}>
                  <Interviews />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resume-screening"
              element={
                <ProtectedRoute allowedRoles={["admin", "hr"]}>
                  <ResumeScreening />
                </ProtectedRoute>
              }
            />
            <Route
              path="/announcements"
              element={
                <ProtectedRoute>
                  <Announcements />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat-assistant"
              element={
                <ProtectedRoute>
                  <ChatAssistant />
                </ProtectedRoute>
              }
            />
            {/* <Route
              path="/candidate-resume-upload"
              element={
                <ProtectedRoute allowedRoles={["admin", "hr"]}>
                  <CandidateResumeUpload />
                </ProtectedRoute>
              }
            /> */}
            <Route
              path="/employee-career-development"
              element={
                <ProtectedRoute allowedRoles={["employee"]}>
                  <EmployeeCareerDevelopment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/internal-jobs"
              element={
                <ProtectedRoute allowedRoles={["employee"]}>
                  <InternalJobs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/learning-path"
              element={
                <ProtectedRoute allowedRoles={["employee"]}>
                  <LearningPath />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-interview"
              element={
                <ProtectedRoute>
                  <AIInterview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hr-questions"
              element={
                <ProtectedRoute allowedRoles={["admin", "hr"]}>
                  <HRQuestions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/interview-report/:candidateId"
              element={
                <ProtectedRoute allowedRoles={["admin", "hr"]}>
                  <InterviewReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-interview-results"
              element={
                <ProtectedRoute allowedRoles={["admin", "hr"]}>
                  <AIInterviewResults />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruitment-analytics"
              element={
                <ProtectedRoute allowedRoles={["admin", "hr"]}>
                  <RecruitmentAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/database-viewer"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <DatabaseViewer />
                </ProtectedRoute>
              }
            />
            {/* <Route path="*" element={<NotFound />} /> */}
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
