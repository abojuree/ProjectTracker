import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import TeacherDashboard from "@/pages/teacher-dashboard";
import ParentAccess from "@/pages/parent-access";

function Router() {
  return (
    <Switch>
      <Route path="/" component={TeacherDashboard} />
      <Route path="/teacher/:teacherId" component={TeacherDashboard} />
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
