
import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import ScrollToTop from '@/components/ScrollToTop';
import { AuthProvider } from '@/contexts/AuthContext';
import AnimatedBackground from '@/components/AnimatedBackground';
import './BackgroundPattern.css';
import HomePage from '@/pages/HomePage';
import CoursesPage from '@/pages/CoursesPage';
import CourseDetailPage from '@/pages/CourseDetailPage';
import PricingPage from '@/pages/PricingPage';
import PaymentSuccessPage from '@/pages/PaymentSuccessPage';
import PaymentCancelPage from '@/pages/PaymentCancelPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import DashboardPage from '@/pages/DashboardPage';
import AdminCenter from '@/pages/AdminCenter';
import LessonEditor from '@/pages/LessonEditor';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <AnimatedBackground />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/courses" element={<CoursesPage />} />

          {/* We handle "new" and "id" in the same component, logic inside handles differentiation */}
          <Route path="/courses/:id" element={<CourseDetailPage />} />

          {/* Lesson Editor & Viewer Routes */}
          <Route path="/courses/:courseId/lessons/:lessonId/edit" element={<LessonEditor />} />
          <Route path="/courses/:courseId/lessons/:lessonId" element={<LessonEditor />} />

          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/cancel" element={<PaymentCancelPage />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Admin Routes - Protected by useAdminRoute hook inside component */}
          <Route path="/admin" element={<AdminCenter />} />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;
