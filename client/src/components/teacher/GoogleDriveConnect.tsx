import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Cloud, CheckCircle, AlertCircle, Link } from "lucide-react";
import type { Teacher } from "@shared/schema";
import CreateStudentFoldersButton from "./CreateStudentFoldersButton";

interface GoogleDriveConnectProps {
  teacher: Teacher;
  teacherId: number;
}

export default function GoogleDriveConnect({ teacher, teacherId }: GoogleDriveConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [driveLink, setDriveLink] = useState(teacher.driveFolderId || '');
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

  const saveDriveLinkMutation = useMutation({
    mutationFn: async (folderLink: string) => {
      return await apiRequest('POST', `/api/teacher/${teacherId}/drive-link`, { driveFolderLink: folderLink });
    },
    onSuccess: () => {
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ رابط Google Drive وسيتم استخدامه لإنشاء مجلدات الطلاب",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/teacher/${teacherId}`] });
    },
    onError: (error) => {
      console.error("Save drive link error:", error);
      toast({
        title: "خطأ في الحفظ",
        description: "فشل في حفظ رابط Google Drive. حاول مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  const handleSaveDriveLink = () => {
    if (!driveLink.trim()) {
      toast({
        title: "رابط مطلوب",
        description: "يرجى إدخال رابط مجلد Google Drive",
        variant: "destructive",
      });
      return;
    }
    saveDriveLinkMutation.mutate(driveLink.trim());
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
                <strong>مشكلة مؤقتة في OAuth:</strong> يظهر رفض الاتصال مع Google. 
                <br />
                <strong>الحل البديل:</strong> أدخل رابط مجلد Google Drive مباشرة أدناه للمتابعة
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  جرب الربط التلقائي أولاً:
                </p>
                <Button 
                  onClick={handleConnectGoogle}
                  disabled={isConnecting}
                  className="w-full"
                >
                  {isConnecting ? "جاري الربط..." : "ربط حساب Google Drive"}
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">أو</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="driveLink" className="text-sm font-medium">
                  أدخل رابط مجلد Google Drive يدوياً:
                </Label>
                <div className="space-y-2">
                  <Input
                    id="driveLink"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={driveLink}
                    onChange={(e) => setDriveLink(e.target.value)}
                    className="text-right"
                  />
                  <p className="text-xs text-muted-foreground">
                    انسخ رابط المجلد الرئيسي من Google Drive وألصقه هنا
                  </p>
                </div>
                <Button 
                  onClick={handleSaveDriveLink}
                  disabled={saveDriveLinkMutation.isPending || !driveLink.trim()}
                  className="w-full"
                  variant="outline"
                >
                  <Link className="h-4 w-4 ml-2" />
                  {saveDriveLinkMutation.isPending ? "جاري الحفظ..." : "حفظ رابط Google Drive"}
                </Button>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  بعد الربط سيتمكن النظام من:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 mr-4">
                  <li>• إنشاء مجلد منظم لكل طالب تلقائياً</li>
                  <li>• رفع ملفات الطلاب مباشرة لحسابك</li>
                  <li>• مشاركة الملفات مع أولياء الأمور بأمان</li>
                </ul>
              </div>
            </div>
          </>
        )}
        
        {teacher.driveFolderId && (
          <div className="mt-4 space-y-3">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">مجلد Google Drive المربوط:</p>
              <p className="text-sm text-muted-foreground">
                {teacher.driveFolderId}
              </p>
            </div>
            
            <CreateStudentFoldersButton teacherId={teacherId} teacher={teacher} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}