import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import NotFound from "@/pages/not-found";
import TeacherOnboarding from "@/pages/teacher-onboarding";
import TeacherDashboard from "@/pages/teacher-dashboard";
import ParentAccess from "@/pages/parent-access";

function Router() {
  const [isTeacherRegistered, setIsTeacherRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const teacherId = localStorage.getItem('teacherId');
    if (teacherId) {
      setIsTeacherRegistered(true);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isTeacherRegistered ? (
        <>
          <Route path="/" component={TeacherOnboarding} />
          <Route path="/onboarding" component={TeacherOnboarding} />
        </>
      ) : (
        <>
          <Route path="/" component={TeacherDashboard} />
          <Route path="/teacher-dashboard" component={TeacherDashboard} />
          <Route path="/teacher/:teacherId" component={TeacherDashboard} />
        </>
      )}
      <Route path="/parent/:linkCode" component={ParentAccess} />
      <Route path="/p/:linkCode" component={ParentAccess} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
