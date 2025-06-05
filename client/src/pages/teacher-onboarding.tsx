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
  const [schoolName, setSchoolName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSimpleRegistration = async () => {
    try {
      setIsLoading(true);
      
      if (!teacherName.trim() || !schoolName.trim()) {
        toast({
          title: "بيانات ناقصة",
          description: "يرجى إدخال اسم المعلم واسم المدرسة",
          variant: "destructive",
        });
        return;
      }

      // Create teacher with local storage
      const teacherData = {
        id: Date.now(),
        name: teacherName.trim(),
        schoolName: schoolName.trim(),
        email: `${teacherName.replace(/\s+/g, '.')}@${schoolName.replace(/\s+/g, '.')}.local`,
        linkCode: `${teacherName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
        googleId: null,
        accessToken: null,
        isActive: true
      };

      // Store teacher data locally
      localStorage.setItem('teacherId', teacherData.id.toString());
      localStorage.setItem('teacherData', JSON.stringify(teacherData));
      
      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: "يمكنك الآن البدء في إدارة ملفات الطلاب",
      });
      
      // Redirect to teacher dashboard
      setLocation(`/teacher-dashboard/${teacherData.id}`);
    } catch (error: any) {
      console.error('Registration Error:', error);
      
      toast({
        title: "خطأ في التسجيل",
        description: "يرجى المحاولة مرة أخرى",
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
              لبدء استخدام النظام، يرجى إدخال بياناتك الأساسية
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
            
            <div className="space-y-2">
              <Label htmlFor="schoolName">اسم المدرسة</Label>
              <Input
                id="schoolName"
                type="text"
                placeholder="أدخل اسم المدرسة"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="text-right"
                dir="rtl"
              />
            </div>
            
            <Button
              onClick={handleSimpleRegistration}
              disabled={!teacherName.trim() || !schoolName.trim() || isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? "جاري إنشاء الحساب..." : "إنشاء حساب وبدء الاستخدام"}
            </Button>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
                النظام يستخدم التخزين المحلي الآمن لحفظ ملفات الطلاب
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
                    const teacherId = localStorage.getItem('teacherId');
                    if (teacherId) {
                      setLocation(`/teacher-dashboard/${teacherId}`);
                    } else {
                      setLocation("/teacher-dashboard/1");
                    }
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