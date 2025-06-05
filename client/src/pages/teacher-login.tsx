import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LogIn, ArrowLeft } from "lucide-react";

export default function TeacherLogin() {
  const [, setLocation] = useLocation();
  const [loginData, setLoginData] = useState({
    email: ""
  });
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch('/api/teacher/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'فشل في تسجيل الدخول');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: `مرحباً ${data.teacher.name}`
      });
      setLocation(`/teacher/${data.teacher.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleLogin = () => {
    if (!loginData.email) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى إدخال البريد الإلكتروني",
        variant: "destructive"
      });
      return;
    }
    loginMutation.mutate(loginData.email);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
            <LogIn className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">تسجيل دخول المعلم</CardTitle>
          <p className="text-gray-600">أدخل بريدك الإلكتروني للوصول إلى حسابك</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          <Button 
            onClick={handleLogin} 
            className="w-full" 
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">ليس لديك حساب؟</p>
            <Button 
              variant="outline" 
              onClick={() => setLocation('/')}
              className="w-full"
            >
              إنشاء حساب جديد
            </Button>
          </div>

          <Button 
            variant="ghost" 
            onClick={() => setLocation('/')}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            العودة للصفحة الرئيسية
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}