import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { TeacherSessionManager, type TeacherSession } from '@/lib/teacherSession';
import { useToast } from '@/hooks/use-toast';

export function useTeacherAuth() {
  const [currentSession, setCurrentSession] = useState<TeacherSession | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Check for existing session on app load
  useEffect(() => {
    const checkExistingSession = async () => {
      setIsCheckingSession(true);
      
      try {
        const existingSession = TeacherSessionManager.getSession();
        
        if (existingSession && TeacherSessionManager.isSessionValid(existingSession)) {
          // Verify session with server
          try {
            const response: any = await apiRequest('GET', `/api/teacher/by-google/${existingSession.googleId}`);
            if (response.teacher) {
              // Update session with latest data
              const updatedSession: TeacherSession = {
                teacherId: response.teacher.id,
                googleId: response.teacher.googleId,
                name: response.teacher.name,
                email: response.teacher.email,
                schoolName: response.teacher.schoolName,
                linkCode: response.teacher.linkCode,
                lastAccess: new Date().toISOString()
              };
              
              TeacherSessionManager.saveSession(updatedSession);
              setCurrentSession(updatedSession);
            } else {
              // Session invalid on server, clear local session
              TeacherSessionManager.clearSession();
            }
          } catch (error) {
            console.error('Failed to verify session with server:', error);
            // Keep local session if server is unreachable
            setCurrentSession(existingSession);
          }
        } else if (existingSession) {
          // Session expired, clear it
          TeacherSessionManager.clearSession();
        }
      } catch (error) {
        console.error('Error checking existing session:', error);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkExistingSession();
  }, []);

  // Handle post-Google OAuth registration
  const handlePostOAuthRegistration = useMutation({
    mutationFn: async (registrationData: any) => {
      const response: any = await apiRequest('POST', '/api/teacher/update-profile', registrationData);
      return response;
    },
    onSuccess: (data: any) => {
      if (data.teacher) {
        const session: TeacherSession = {
          teacherId: data.teacher.id,
          googleId: data.teacher.googleId,
          name: data.teacher.name,
          email: data.teacher.email,
          schoolName: data.teacher.schoolName,
          linkCode: data.teacher.linkCode,
          lastAccess: new Date().toISOString()
        };
        
        TeacherSessionManager.saveSession(session);
        TeacherSessionManager.clearRegistrationData();
        setCurrentSession(session);
        
        toast({
          title: "تم التسجيل بنجاح",
          description: "مرحباً بك في نظام إدارة ملفات الطلاب",
        });
      }
    },
    onError: (error) => {
      console.error('Failed to complete registration:', error);
      toast({
        title: "خطأ في التسجيل",
        description: "حدث خطأ أثناء إكمال التسجيل",
        variant: "destructive",
      });
    }
  });

  // Logout function
  const logout = () => {
    TeacherSessionManager.clearSession();
    setCurrentSession(null);
    queryClient.clear();
    
    toast({
      title: "تم تسجيل الخروج",
      description: "تم تسجيل خروجك بنجاح",
    });
  };

  // Check if we need to complete post-OAuth registration
  useEffect(() => {
    if (!isCheckingSession && !currentSession && TeacherSessionManager.hasRegistrationData()) {
      // User returned from Google OAuth, need to complete registration
      const regData = TeacherSessionManager.getRegistrationData();
      if (regData && regData.teacherName && regData.schoolName) {
        // Auto-complete registration if we have the data
        handlePostOAuthRegistration.mutate({
          teacherId: regData.teacherId, // This would come from OAuth callback
          teacherName: regData.teacherName,
          schoolName: regData.schoolName,
          driveFolder: regData.driveFolder
        });
      }
    }
  }, [isCheckingSession, currentSession]);

  return {
    currentSession,
    isAuthenticated: !!currentSession,
    isCheckingSession,
    isLoading: isCheckingSession || handlePostOAuthRegistration.isPending,
    completeRegistration: handlePostOAuthRegistration.mutate,
    logout,
    hasRegistrationPending: TeacherSessionManager.hasRegistrationData()
  };
}