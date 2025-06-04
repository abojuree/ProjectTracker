import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";

interface VerificationFormProps {
  linkCode: string;
  onVerificationSuccess: (data: any) => void;
}

interface CaptchaQuestion {
  id: number;
  question: string;
}

export default function VerificationForm({ linkCode, onVerificationSuccess }: VerificationFormProps) {
  const [civilId, setCivilId] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  
  const { toast } = useToast();

  const { data: captcha, isLoading: captchaLoading } = useQuery<CaptchaQuestion>({
    queryKey: ["/api/captcha"],
  });

  const verificationMutation = useMutation({
    mutationFn: async (data: { civilId: string; captchaAnswer: string }) => {
      const response = await apiRequest('POST', '/api/verify-student', {
        civilId: data.civilId,
        captchaId: captcha?.id,
        captchaAnswer: data.captchaAnswer,
        linkCode
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم التحقق بنجاح",
        description: `مرحباً بك في ملفات ${data.student.name}`,
      });
      onVerificationSuccess(data);
    },
    onError: (error) => {
      toast({
        title: "خطأ في التحقق",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!civilId || !captchaAnswer) {
      toast({
        title: "خطأ",
        description: "يرجى تعبئة جميع الحقول",
        variant: "destructive",
      });
      return;
    }

    if (civilId.length !== 10) {
      toast({
        title: "خطأ",
        description: "رقم الهوية يجب أن يكون 10 أرقام",
        variant: "destructive",
      });
      return;
    }

    verificationMutation.mutate({ civilId, captchaAnswer });
  };

  return (
    <Card className="w-full max-w-md mx-auto card-shadow fade-in">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-bold text-foreground">
          التحقق من الهوية
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          يرجى إدخال البيانات المطلوبة للوصول إلى ملفات الطالب
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Captcha Verification */}
          <div className="space-y-3">
            <Label className="block text-sm font-medium text-foreground">
              <i className="fas fa-robot ml-2"></i>
              للتحقق من أنك لست روبوت:
            </Label>
            {captchaLoading ? (
              <div className="flex items-center space-x-reverse space-x-3">
                <div className="animate-pulse h-6 bg-muted rounded w-32"></div>
                <Input disabled placeholder="جاري التحميل..." />
              </div>
            ) : (
              <div className="flex items-center space-x-reverse space-x-3">
                <span className="text-lg font-medium min-w-fit">
                  {captcha?.question || "كم يساوي: 4 + 2 = ؟"}
                </span>
                <Input
                  type="text"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  placeholder="الإجابة"
                  className="w-20"
                  required
                />
              </div>
            )}
          </div>

          {/* Civil ID Input */}
          <div className="space-y-3">
            <Label htmlFor="civilId" className="block text-sm font-medium text-foreground">
              <i className="fas fa-id-card ml-2"></i>
              أدخل الرقم المدني للطالب:
            </Label>
            <Input
              id="civilId"
              type="text"
              value={civilId}
              onChange={(e) => setCivilId(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="1234567890"
              maxLength={10}
              className="text-center tracking-wider"
              required
            />
            <p className="text-xs text-muted-foreground text-center">
              الرقم المدني يجب أن يكون 10 أرقام بالضبط
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={verificationMutation.isPending || captchaLoading}
          >
            {verificationMutation.isPending ? (
              <>
                <i className="fas fa-spinner fa-spin ml-2"></i>
                جاري التحقق...
              </>
            ) : (
              <>
                <i className="fas fa-search ml-2"></i>
                البحث
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
