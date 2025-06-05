import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, FileText, User, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import StudentFiles from "@/components/parent/student-files";

interface StudentData {
  student: {
    name: string;
    civilId: string;
    grade: string;
    classNumber: number;
  };
  teacher: {
    name: string;
  };
  files: Record<string, Record<string, any[]>>;
}

interface CaptchaQuestion {
  id: number;
  question: string;
  answer: number;
}

export default function ParentAccess() {
  const [location] = useLocation();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [civilId, setCivilId] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState<CaptchaQuestion | null>(null);
  const { toast } = useToast();
  
  // Extract link code from URL
  const linkCode = location.split('/').pop() || '';

  // Generate simple captcha
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operations = ['+', '-', '×'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let answer: number;
    let question: string;
    
    switch (operation) {
      case '+':
        answer = num1 + num2;
        question = `${num1} + ${num2} = ؟`;
        break;
      case '-':
        answer = Math.max(num1, num2) - Math.min(num1, num2);
        question = `${Math.max(num1, num2)} - ${Math.min(num1, num2)} = ؟`;
        break;
      case '×':
        answer = num1 * num2;
        question = `${num1} × ${num2} = ؟`;
        break;
      default:
        answer = num1 + num2;
        question = `${num1} + ${num2} = ؟`;
    }
    
    setCaptchaQuestion({ id: Date.now(), question, answer });
    setCaptchaAnswer('');
  };

  // Initialize captcha on component mount
  useState(() => {
    generateCaptcha();
  });

  const verifyAccess = useMutation({
    mutationFn: async () => {
      if (!civilId || !captchaAnswer || !captchaQuestion) {
        throw new Error('يرجى ملء جميع الحقول');
      }
      
      if (parseInt(captchaAnswer) !== captchaQuestion.answer) {
        throw new Error('إجابة التحقق غير صحيحة');
      }
      
      const response: any = await apiRequest('POST', '/api/parent/verify-access', {
        linkCode,
        civilId: civilId.trim()
      });
      
      return response;
    },
    onSuccess: (data) => {
      if (data.student) {
        setStudentData(data);
        toast({
          title: "تم التحقق بنجاح",
          description: `مرحباً بك، يمكنك الآن الاطلاع على ملفات ${data.student.name}`,
        });
      }
    },
    onError: (error: any) => {
      console.error('Verification failed:', error);
      generateCaptcha(); // Generate new captcha on error
      
      toast({
        title: "خطأ في التحقق",
        description: error.message || "تأكد من رقم الهوية المدنية وحاول مرة أخرى",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyAccess.mutate();
  };

  if (studentData) {
    return <StudentFiles studentData={studentData} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-primary ml-3" />
              <h1 className="text-2xl font-bold text-gray-900">وصول أولياء الأمور</h1>
            </div>
            <p className="text-gray-600">
              للاطلاع على ملفات طفلك، يرجى إدخال رقم الهوية المدنية والتحقق من أنك لست روبوت
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
              تحقق من الهوية
            </CardTitle>
            <p className="text-gray-600">
              أدخل رقم الهوية المدنية للطالب
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Civil ID Input */}
              <div className="space-y-2">
                <Label htmlFor="civilId" className="text-lg font-medium">
                  رقم الهوية المدنية <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="civilId"
                    type="text"
                    placeholder="أدخل رقم الهوية المدنية"
                    value={civilId}
                    onChange={(e) => setCivilId(e.target.value)}
                    className="text-lg py-3 pr-10"
                    dir="ltr"
                    maxLength={12}
                    required
                  />
                </div>
                <p className="text-sm text-gray-500">
                  رقم الهوية المدنية المسجل لدى المعلم
                </p>
              </div>

              {/* Captcha */}
              {captchaQuestion && (
                <div className="space-y-2">
                  <Label htmlFor="captcha" className="text-lg font-medium">
                    تحقق من أنك لست روبوت <span className="text-red-500">*</span>
                  </Label>
                  <div className="bg-gray-50 border rounded-lg p-4 text-center">
                    <p className="text-xl font-bold text-gray-800 mb-3">
                      {captchaQuestion.question}
                    </p>
                    <Input
                      id="captcha"
                      type="number"
                      placeholder="أدخل الإجابة"
                      value={captchaAnswer}
                      onChange={(e) => setCaptchaAnswer(e.target.value)}
                      className="text-lg py-2 text-center max-w-24 mx-auto"
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateCaptcha}
                    className="w-full"
                  >
                    سؤال جديد
                  </Button>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={verifyAccess.isPending || !civilId || !captchaAnswer}
                className="w-full bg-primary hover:bg-primary/90 text-lg py-3"
                size="lg"
              >
                {verifyAccess.isPending ? "جاري التحقق..." : "عرض ملفات الطالب"}
              </Button>
            </form>

            {/* Security Notice */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 ml-2 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-semibold mb-1">معلومات الأمان:</p>
                  <ul className="space-y-1">
                    <li>• يمكنك فقط الاطلاع على ملفات طفلك</li>
                    <li>• جميع البيانات محمية ومشفرة</li>
                    <li>• لا نحتفظ برقم الهوية المدنية</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Teacher Info */}
            {linkCode && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">
                  كود المعلم: <span className="font-mono font-bold">{linkCode}</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}