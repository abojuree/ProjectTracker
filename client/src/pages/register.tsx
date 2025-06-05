import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { School } from "lucide-react";

export default function Register() {
  const [teacherName, setTeacherName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleRegister = async () => {
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

      const response = await apiRequest('POST', '/api/teacher/simple-register', {
        name: teacherName.trim(),
        schoolName: schoolName.trim()
      });

      const teacherData = await response.json();
      
      localStorage.setItem('teacherId', teacherData.id.toString());
      localStorage.setItem('teacherData', JSON.stringify(teacherData));
      
      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: "يمكنك الآن البدء في إدارة ملفات الطلاب",
      });
      
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 flex items-center justify-center">
            <School className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold">نظام إدارة ملفات الطلاب</CardTitle>
          <CardDescription>
            إنشاء حساب جديد للمعلم
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
            onClick={handleRegister}
            disabled={!teacherName.trim() || !schoolName.trim() || isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? "جاري إنشاء الحساب..." : "إنشاء حساب والبدء"}
          </Button>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
              سيتم حفظ ملفات الطلاب بشكل آمن في النظام المحلي
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}