import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LogIn, ArrowLeft, Lock, Eye, EyeOff } from "lucide-react";

export default function TeacherLogin() {
  const [, setLocation] = useLocation();
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await fetch('/api/teacher/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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
      // If password is not set for this teacher, show password setup
      if (error.message.includes("البريد الإلكتروني أو كلمة المرور غير صحيحة")) {
        setShowPasswordSetup(true);
        return;
      }
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const setPasswordMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await fetch('/api/teacher/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'فشل في تعيين كلمة المرور');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم تعيين كلمة المرور بنجاح",
        description: "يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة"
      });
      setShowPasswordSetup(false);
      // Auto login after setting password
      loginMutation.mutate(loginData);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تعيين كلمة المرور",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate(loginData);
  };

  const handleSetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول",
        variant: "destructive",
      });
      return;
    }

    if (loginData.password.length < 6) {
      toast({
        title: "خطأ",
        description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }

    setPasswordMutation.mutate(loginData);
  };

  if (showPasswordSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Lock className="mx-auto h-12 w-12 text-blue-600 mb-4" />
            <CardTitle className="text-2xl">تعيين كلمة مرور</CardTitle>
            <p className="text-gray-600">
              يبدو أن حسابك لا يحتوي على كلمة مرور. يرجى تعيين كلمة مرور لتأمين حسابك.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div>
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  placeholder="أدخل بريدك الإلكتروني"
                  required
                  disabled
                  className="bg-gray-50"
                />
              </div>
              
              <div>
                <Label htmlFor="password">كلمة المرور الجديدة</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="أدخل كلمة مرور قوية (6 أحرف على الأقل)"
                    required
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
                <p className="text-sm text-gray-500 mt-1">
                  يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={setPasswordMutation.isPending}
              >
                {setPasswordMutation.isPending ? "جاري تعيين كلمة المرور..." : "تعيين كلمة المرور"}
              </Button>

              <Button 
                type="button"
                variant="outline"
                onClick={() => setShowPasswordSetup(false)}
                className="w-full"
              >
                <ArrowLeft className="ml-2 h-4 w-4" />
                العودة لتسجيل الدخول
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <LogIn className="mx-auto h-12 w-12 text-blue-600 mb-4" />
          <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
          <p className="text-gray-600">
            أدخل بياناتك للوصول إلى لوحة التحكم
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                placeholder="أدخل بريدك الإلكتروني"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  placeholder="أدخل كلمة المرور"
                  required
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
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
              <LogIn className="mr-2 h-4 w-4" />
            </Button>

            <Button 
              type="button"
              variant="outline"
              onClick={() => setLocation('/')}
              className="w-full"
            >
              <ArrowLeft className="ml-2 h-4 w-4" />
              العودة للصفحة الرئيسية
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ليس لديك حساب؟{" "}
              <button 
                onClick={() => setLocation('/simple-registration')}
                className="text-blue-600 hover:underline font-medium"
              >
                سجل حساب جديد
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}