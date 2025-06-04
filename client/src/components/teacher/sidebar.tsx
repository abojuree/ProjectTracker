import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import type { Teacher } from "@shared/schema";

interface SidebarProps {
  teacherId: number;
  teacher: Teacher | undefined;
}

export default function Sidebar({ teacherId, teacher }: SidebarProps) {
  const { toast } = useToast();

  const handleCopyLink = () => {
    const link = `${window.location.origin}/p/${teacher?.linkCode || 'demo-link'}`;
    navigator.clipboard.writeText(link).then(() => {
      toast({
        title: "تم نسخ الرابط",
        description: "تم نسخ رابط أولياء الأمور إلى الحافظة",
      });
    });
  };

  const handleShareWhatsApp = () => {
    const link = `${window.location.origin}/p/${teacher?.linkCode || 'demo-link'}`;
    const message = `مرحباً، يمكنكم الوصول إلى ملفات أطفالكم من خلال هذا الرابط: ${link}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const recentActivities = [
    {
      description: "تم رفع اختبار رياضيات لأحمد محمد",
      time: "منذ 15 دقيقة",
      icon: "fas fa-upload",
      color: "blue"
    },
    {
      description: "ولي أمر سارة علي دخل لمشاهدة الملفات",
      time: "منذ ساعة",
      icon: "fas fa-eye", 
      color: "green"
    },
    {
      description: "تم إنشاء مجلد جديد لعبدالله سعد",
      time: "منذ 3 ساعات",
      icon: "fas fa-folder",
      color: "yellow"
    }
  ];

  return (
    <>
      {/* Parent Access Link */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <span>رابط أولياء الأمور</span>
            <i className="fas fa-link text-primary"></i>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-3 bg-muted rounded-lg mb-4">
            <p className="text-sm text-muted-foreground mb-2">الرابط المخصص:</p>
            <p className="text-sm font-mono bg-background p-2 rounded border break-all">
              studentfiles.app/p/{teacher?.linkCode || 'demo-link'}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleCopyLink}
            >
              <i className="fas fa-copy ml-1"></i>
              نسخ
            </Button>
            <Button
              variant="secondary" 
              size="sm"
              onClick={handleShareWhatsApp}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <i className="fab fa-whatsapp ml-1"></i>
              واتساب
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast({
                  title: "قريباً",
                  description: "خاصية QR كود ستكون متاحة قريباً",
                });
              }}
            >
              <i className="fas fa-qrcode ml-1"></i>
              QR كود
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast({
                  title: "قريباً",
                  description: "خاصية الإيميل ستكون متاحة قريباً",
                });
              }}
            >
              <i className="fas fa-envelope ml-1"></i>
              إيميل
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <span>النشاط الأخير</span>
            <i className="fas fa-clock text-primary"></i>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start space-x-reverse space-x-3">
                <div className={`w-8 h-8 bg-${activity.color}-100 rounded-full flex items-center justify-center flex-shrink-0`}>
                  <i className={`${activity.icon} text-${activity.color}-600 text-xs`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Storage Info */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <span>مساحة التخزين</span>
            <i className="fas fa-hdd text-primary"></i>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">المستخدم</span>
              <span className="font-medium">2.3 جيجابايت</span>
            </div>
            <Progress value={23} className="h-2" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">المتاح</span>
              <span className="font-medium text-green-600">12.7 جيجابايت</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
