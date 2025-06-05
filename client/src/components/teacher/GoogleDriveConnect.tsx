import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Cloud, CheckCircle, AlertCircle } from "lucide-react";
import type { Teacher } from "@shared/schema";

interface GoogleDriveConnectProps {
  teacher: Teacher;
  teacherId: number;
}

export default function GoogleDriveConnect({ teacher, teacherId }: GoogleDriveConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const hasGoogleAccess = teacher.accessToken && teacher.refreshToken;

  // Check for success/error messages from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('google_connected') === 'true') {
      toast({
        title: "تم الربط بنجاح",
        description: "تم ربط حسابك مع Google Drive بنجاح",
      });
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
      // Refresh teacher data
      queryClient.invalidateQueries({ queryKey: [`/api/teacher/${teacherId}`] });
    } else if (urlParams.get('error') === 'google_auth_failed') {
      toast({
        title: "فشل في الربط",
        description: "حدث خطأ أثناء ربط Google Drive",
        variant: "destructive",
      });
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
      setIsConnecting(false);
    }
  }, [toast, queryClient, teacherId]);

  const connectGoogleMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', `/api/teacher/${teacherId}/connect-google`);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      } else {
        throw new Error('No auth URL received');
      }
    },
    onError: (error) => {
      console.error('Google connection error:', error);
      toast({
        title: "خطأ في الربط",
        description: "فشل في الاتصال بـ Google Drive. تأكد من إعداد Google Client ID و Secret",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  });

  const handleConnectGoogle = () => {
    setIsConnecting(true);
    connectGoogleMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          ربط Google Drive
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasGoogleAccess ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              تم ربط حسابك مع Google Drive بنجاح. يمكن الآن إنشاء مجلدات الطلاب تلقائياً ورفع الملفات مباشرة.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                لإنشاء مجلدات الطلاب تلقائياً في Google Drive، يجب ربط حسابك أولاً.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                بعد الربط سيتمكن النظام من:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 mr-4">
                <li>• إنشاء مجلد منظم لكل طالب تلقائياً</li>
                <li>• رفع ملفات الطلاب مباشرة لحسابك</li>
                <li>• مشاركة الملفات مع أولياء الأمور بأمان</li>
              </ul>
              
              <Button 
                onClick={handleConnectGoogle}
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? "جاري الربط..." : "ربط حساب Google Drive"}
              </Button>
            </div>
          </>
        )}
        
        {teacher.driveFolderId && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">مجلد Google Drive المربوط:</p>
            <p className="text-sm text-muted-foreground">
              {teacher.driveFolderId}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}