import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, Copy, MessageCircle, QrCode, Mail, Clock, Eye, HardDrive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import type { Teacher } from "@shared/schema";

interface ParentLinkSectionProps {
  teacher: Teacher;
}

export default function ParentLinkSection({ teacher }: ParentLinkSectionProps) {
  const { toast } = useToast();

  const { data: stats } = useQuery({
    queryKey: ["/api/teacher/stats"],
  });

  const parentLink = `${window.location.origin}/p/${teacher.linkCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(parentLink).then(() => {
      toast({
        title: "تم النسخ",
        description: "تم نسخ الرابط إلى الحافظة",
      });
    });
  };

  const shareWhatsApp = () => {
    const message = `مرحباً، يمكنكم الوصول لملفات أطفالكم الأكاديمية من خلال الرابط التالي:\n${parentLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const generateQR = () => {
    toast({
      title: "قريباً",
      description: "ميزة QR Code ستكون متاحة قريباً",
    });
  };

  const sendEmail = () => {
    const subject = "رابط الوصول لملفات الطالب";
    const body = `مرحباً،\n\nيمكنكم الوصول لملفات أطفالكم الأكاديمية من خلال الرابط التالي:\n${parentLink}\n\nمع أطيب التحيات،\n${teacher.name}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  return (
    <div className="space-y-6">
      {/* Parent Access Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>رابط أولياء الأمور</span>
            <Link className="h-5 w-5 text-primary" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">الرابط المخصص:</p>
            <div className="bg-white p-2 rounded border font-mono text-sm break-all">
              {parentLink}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={copyToClipboard}
              variant="outline" 
              size="sm"
              className="text-primary hover:bg-primary/10"
            >
              <Copy className="h-4 w-4 ml-1" />
              نسخ
            </Button>
            <Button 
              onClick={shareWhatsApp}
              variant="outline" 
              size="sm"
              className="text-green-600 hover:bg-green-50"
            >
              <MessageCircle className="h-4 w-4 ml-1" />
              واتساب
            </Button>
            <Button 
              onClick={generateQR}
              variant="outline" 
              size="sm"
              className="text-gray-600 hover:bg-gray-50"
            >
              <QrCode className="h-4 w-4 ml-1" />
              QR كود
            </Button>
            <Button 
              onClick={sendEmail}
              variant="outline" 
              size="sm"
              className="text-blue-600 hover:bg-blue-50"
            >
              <Mail className="h-4 w-4 ml-1" />
              إيميل
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>النشاط الأخير</span>
            <Clock className="h-5 w-5 text-primary" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-reverse space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Eye className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  تم الوصول للنظام من جديد
                </p>
                <p className="text-xs text-gray-500">الآن</p>
              </div>
            </div>
            
            <div className="text-center py-4 text-gray-500 text-sm">
              سيتم عرض النشاط هنا عند بدء استخدام النظام
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>مساحة التخزين</span>
            <HardDrive className="h-5 w-5 text-primary" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">المستخدم</span>
              <span className="font-medium">
                {stats?.storageUsed ? `${(stats.storageUsed / (1024 * 1024)).toFixed(1)} ميجابايت` : '0 بايت'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full" 
                style={{ 
                  width: stats?.storageUsed 
                    ? `${Math.min((stats.storageUsed / (15 * 1024 * 1024 * 1024)) * 100, 100)}%` 
                    : '0%' 
                }}
              ></div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">المتاح</span>
              <span className="font-medium text-green-600">15 جيجابايت</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
