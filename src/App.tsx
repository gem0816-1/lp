import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { HomePage } from "@/pages/HomePage";
import { StartPage } from "@/pages/StartPage";
import { TestPage } from "@/pages/TestPage";
import { ResultPage } from "@/pages/ResultPage";
import { ReportPage } from "@/pages/ReportPage";
import { AdminQuestionsPage } from "@/pages/admin/AdminQuestionsPage";
import { AdminCalibrationPage } from "@/pages/admin/AdminCalibrationPage";

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/start" element={<StartPage />} />
        <Route path="/test" element={<TestPage />} />
        <Route path="/result/:sessionId" element={<ResultPage />} />
        <Route path="/report/:sessionId" element={<ReportPage />} />
        <Route path="/admin/questions" element={<AdminQuestionsPage />} />
        <Route path="/admin/calibration" element={<AdminCalibrationPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

