import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { School, Upload, FileText, Eye, EyeOff, Lock } from "lucide-react";

export default function SimpleRegistration() {
  const [step, setStep] = useState(1);
  const [teacherData, setTeacherData] = useState({
    name: "",
    schoolName: "",
    email: "",
    password: "",
    driveFolderLink: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleBasicInfo = () => {
    if (!teacherData.name.trim() || !teacherData.schoolName.trim() || !teacherData.email.trim() || !teacherData.password.trim()) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى إدخال جميع البيانات المطلوبة",
        variant: "destructive",
      });
      return;
    }

    if (teacherData.password.length < 6) {
      toast({
        title: "كلمة مرور ضعيفة",
        description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }

    setStep(2);
  };

  const handleRegister = async () => {
    try {
      setIsLoading(true);

      const response = await apiRequest('POST', '/api/teacher/simple-register', {
        name: teacherData.name.trim(),
        schoolName: teacherData.schoolName.trim(),
        email: teacherData.email.trim(),
        password: teacherData.password.trim(),
        driveFolderLink: teacherData.driveFolderLink.trim() || null
      });

      const teacher = await response.json();
      
      localStorage.setItem('teacherId', teacher.id.toString());
      localStorage.setItem('teacherData', JSON.stringify(teacher));
      
      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: "يمكنك الآن البدء في إدارة ملفات الطلاب",
      });
      
      setLocation(`/teacher-dashboard/${teacher.id}`);
    } catch (error: any) {
      console.error('Registration Error:', error);
      
      let errorMessage = "يرجى المحاولة مرة أخرى";
      
      if (error.message) {
        if (error.message.includes('400')) {
          errorMessage = "يرجى التأكد من صحة البيانات المدخلة";
        } else if (error.message.includes('500')) {
          errorMessage = "خطأ في الخادم، يرجى المحاولة لاحقاً";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "خطأ في التسجيل",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
            <CardTitle className="text-2xl font-bold">نظام إدارة ملفات الطلاب</CardTitle>
            <CardDescription>
              إنشاء حساب جديد للمعلم - البيانات الأساسية
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teacherName">اسم المعلم</Label>
              <Input
                id="teacherName"
                type="text"
                placeholder="أدخل اسمك الكامل"
                value={teacherData.name}
                onChange={(e) => setTeacherData({...teacherData, name: e.target.value})}
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
                value={teacherData.schoolName}
                onChange={(e) => setTeacherData({...teacherData, schoolName: e.target.value})}
                className="text-right"
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="teacher@example.com"
                value={teacherData.email}
                onChange={(e) => setTeacherData({...teacherData, email: e.target.value})}
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="أدخل كلمة مرور قوية (6 أحرف على الأقل)"
                  value={teacherData.password}
                  onChange={(e) => setTeacherData({...teacherData, password: e.target.value})}
                  className="pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل لحماية حسابك
              </p>
            </div>
            
            <Button
              onClick={handleBasicInfo}
              disabled={!teacherData.name.trim() || !teacherData.schoolName.trim() || !teacherData.email.trim() || !teacherData.password.trim()}
              className="w-full"
              size="lg"
            >
              التالي
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-green-100 dark:bg-green-900 rounded-full w-16 h-16 flex items-center justify-center">
            <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl font-bold">ربط مجلد Google Drive</CardTitle>
          <CardDescription>
            اربط مجلد Google Drive الخاص بك لحفظ ملفات الطلاب (اختياري)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="driveFolder">رابط مجلد Google Drive (اختياري)</Label>
            <Input
              id="driveFolder"
              type="url"
              placeholder="https://drive.google.com/drive/folders/..."
              value={teacherData.driveFolderLink}
              onChange={(e) => setTeacherData({...teacherData, driveFolderLink: e.target.value})}
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              يمكنك إنشاء مجلد في Google Drive ونسخ رابطه هنا، أو إضافته لاحقاً من لوحة التحكم
            </p>
            {teacherData.driveFolderLink && (
              <p className="text-xs text-green-600">
                ✓ سيتم حفظ هذا الرابط مع بيانات حسابك
              </p>
            )}
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
            <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">كيفية إنشاء مجلد Google Drive:</h4>
            <ol className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
              <li>1. اذهب إلى drive.google.com</li>
              <li>2. انقر على "جديد" ثم "مجلد"</li>
              <li>3. أطلق على المجلد اسماً مثل "ملفات الطلاب"</li>
              <li>4. انقر بالزر الأيمن على المجلد واختر "مشاركة"</li>
              <li>5. غيّر الإعدادات إلى "أي شخص لديه الرابط يمكنه التعديل"</li>
              <li>6. انسخ الرابط والصقه هنا</li>
            </ol>
          </div>
          
          <Button
            onClick={handleRegister}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? "جاري إنشاء الحساب..." : "إنشاء الحساب وبدء الاستخدام"}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">لديك حساب مسبقاً؟</p>
            <Button 
              variant="outline" 
              onClick={() => setLocation('/teacher-login')}
              className="w-full"
            >
              تسجيل الدخول
            </Button>
          </div>

          <Button
            onClick={handleRegister}
            variant="outline"
            disabled={isLoading}
            className="w-full"
          >
            تخطي وإنشاء الحساب بدون Google Drive
          </Button>

          <Button
            onClick={() => setStep(1)}
            variant="ghost"
            className="w-full"
          >
            العودة للخطوة السابقة
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}