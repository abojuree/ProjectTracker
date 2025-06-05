import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import TeacherDashboard from "@/pages/teacher-dashboard";
import ParentAccess from "@/pages/parent-access";
import { useTeacherAuth } from "@/hooks/useTeacherAuth";

function Router() {
  const { isAuthenticated, isCheckingSession } = useTeacherAuth();

  if (isCheckingSession) {
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
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/landing" component={Landing} />
        </>
      ) : (
        <>
          <Route path="/" component={TeacherDashboard} />
          <Route path="/teacher-dashboard" component={TeacherDashboard} />
          <Route path="/teacher/:teacherId" component={TeacherDashboard} />
        </>
      )}
      <Route path="/parent-access" component={ParentAccess} />
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
