import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { GoogleDriveAuth } from "@/lib/google-drive-auth";
import { apiRequest } from "@/lib/api";
import { FcGoogle } from "react-icons/fc";
import { Upload, School, FileSpreadsheet } from "lucide-react";

export default function TeacherOnboarding() {
  const [step, setStep] = useState(1);
  const [teacherName, setTeacherName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      const googleAuth = GoogleDriveAuth.getInstance();
      await googleAuth.initialize();
      const user = await googleAuth.signIn();
      
      // Register teacher with Google account and store access token
      const response = await apiRequest('POST', '/api/auth/google/register', {
        name: teacherName,
        googleId: user.id,
        email: user.email,
        profileImageUrl: user.picture,
        accessToken: user.accessToken
      });

      const teacherData = await response.json();
      
      setIsGoogleConnected(true);
      localStorage.setItem('teacherId', teacherData.id.toString());
      localStorage.setItem('google_access_token', user.accessToken);
      
      // Create main teacher folder in Google Drive
      try {
        const folderId = await googleAuth.createFolder(`ملفات ${teacherName} - طلاب`);
        await apiRequest('PUT', `/api/teacher/${teacherData.id}/drive-folder`, {
          driveFolderId: folderId
        });
      } catch (error) {
        console.warn('Failed to create Drive folder:', error);
      }

      toast({
        title: "تم ربط حساب Google بنجاح",
        description: "تم إنشاء مجلد رئيسي في Google Drive",
      });
      
      // Redirect to teacher dashboard with correct teacherId
      setLocation(`/teacher-dashboard/${teacherData.id}`);
    } catch (error: any) {
      console.error('Google Auth Error:', error);
      
      let errorMessage = "يرجى المحاولة مرة أخرى";
      if (error.message?.includes('popup_blocked')) {
        errorMessage = "يرجى السماح للنوافذ المنبثقة في المتصفح";
      } else if (error.message?.includes('redirect_uri_mismatch')) {
        errorMessage = "خطأ في إعدادات Google Cloud Console - يرجى إضافة النطاق المصرح به";
      }
      
      toast({
        title: "خطأ في ربط حساب Google",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToUpload = () => {
    setStep(3);
  };

  const handleSkipToManual = () => {
    const teacherId = localStorage.getItem('teacherId');
    if (teacherId) {
      setLocation(`/teacher-dashboard/${teacherId}`);
    } else {
      setLocation("/teacher-dashboard/1");
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 flex items-center justify-center">
              <School className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl font-bold">مرحباً بك في نظام إدارة ملفات الطلاب</CardTitle>
            <CardDescription>
              لبدء استخدام النظام، يرجى إدخال اسمك وربط حساب Google Drive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teacherName">اسم المعلم</Label>
              <Input
                id="teacherName"
                type="text"
                placeholder="أدخل اسمك الكامل"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="text-right"
                dir="rtl"
              />
            </div>
            
            <Button
              onClick={handleGoogleAuth}
              disabled={!teacherName.trim() || isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                "جاري الربط..."
              ) : (
                <>
                  <FcGoogle className="ml-2 h-5 w-5" />
                  ربط حساب Google Drive
                </>
              )}
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">أو</p>
              <Button
                onClick={() => {
                  // Create demo teacher account
                  localStorage.setItem('teacherId', '1');
                  setLocation("/teacher-dashboard/1");
                }}
                variant="outline"
                className="w-full"
                size="sm"
              >
                متابعة بدون Google Drive (للاختبار)
              </Button>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
              <p className="text-xs text-amber-700 dark:text-amber-300 text-center">
                إذا واجهت خطأ في Google Drive، يجب إضافة النطاق التالي في Google Cloud Console:
                <br />
                <code className="text-xs bg-white dark:bg-gray-800 px-1 rounded">
                  {window.location.origin}
                </code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-green-100 dark:bg-green-900 rounded-full w-16 h-16 flex items-center justify-center">
              <Upload className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl font-bold">تم ربط حسابك بنجاح!</CardTitle>
            <CardDescription>
              الآن يمكنك رفع بيانات الطلاب لبدء استخدام النظام
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleContinueToUpload}
              className="w-full"
              size="lg"
            >
              <FileSpreadsheet className="ml-2 h-4 w-4" />
              رفع ملف Excel للطلاب
            </Button>

            <Button
              onClick={handleSkipToManual}
              variant="outline"
              className="w-full"
              size="lg"
            >
              تخطي وإضافة الطلاب يدوياً
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              يمكنك رفع ملف Excel يحتوي على بيانات الطلاب أو إضافتهم يدوياً لاحقاً
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-purple-100 dark:bg-purple-900 rounded-full w-16 h-16 flex items-center justify-center">
              <FileSpreadsheet className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <CardTitle className="text-2xl font-bold">رفع بيانات الطلاب</CardTitle>
            <CardDescription>
              ارفع ملف Excel يحتوي على بيانات الطلاب لإنشاء ملفاتهم تلقائياً
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                اسحب وأفلت ملف Excel هنا أو اضغط للاختيار
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                id="excel-upload"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    // Handle file upload
                    setLocation("/teacher-dashboard");
                  }
                }}
              />
              <Button asChild>
                <label htmlFor="excel-upload" className="cursor-pointer">
                  اختيار ملف Excel
                </label>
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">أو</p>
              <Button
                onClick={handleSkipToManual}
                variant="outline"
                className="w-full"
              >
                إضافة الطلاب يدوياً
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}