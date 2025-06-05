import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, Link, Copy, Download, Share2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Teacher } from "@shared/schema";

interface ParentLinkGeneratorProps {
  teacher: Teacher;
}

export default function ParentLinkGenerator({ teacher }: ParentLinkGeneratorProps) {
  const [qrSize, setQrSize] = useState(200);
  const { toast } = useToast();

  // Generate parent access link
  const getParentLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/parent/${teacher.linkCode}`;
  };

  // Generate QR code URL using qr-server.com (free service)
  const getQRCodeUrl = (size: number = 200) => {
    const link = getParentLink();
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(link)}&format=png&margin=10`;
  };

  // Copy link to clipboard
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getParentLink());
      toast({
        title: "تم النسخ",
        description: "تم نسخ الرابط إلى الحافظة",
      });
    } catch (error) {
      toast({
        title: "خطأ في النسخ",
        description: "لم نتمكن من نسخ الرابط",
        variant: "destructive",
      });
    }
  };

  // Download QR code
  const downloadQR = async () => {
    try {
      const qrUrl = getQRCodeUrl(400); // Higher resolution for download
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-code-${teacher.linkCode}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "تم التحميل",
        description: "تم تحميل رمز QR بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ في التحميل",
        description: "لم نتمكن من تحميل رمز QR",
        variant: "destructive",
      });
    }
  };

  // Share link (if supported)
  const shareLink = async () => {
    const link = getParentLink();
    const shareData = {
      title: 'رابط الوصول لملفات الطلاب',
      text: `يمكنك الاطلاع على ملفات طفلك من خلال هذا الرابط الآمن من ${teacher.name}`,
      url: link,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast({
          title: "تم المشاركة",
          description: "تم مشاركة الرابط بنجاح",
        });
      } else {
        // Fallback to copy
        await copyLink();
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback to copy
      await copyLink();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          رابط الوصول لأولياء الأمور
        </CardTitle>
        <p className="text-gray-600 text-sm">
          شارك هذا الرابط أو رمز QR مع أولياء الأمور للوصول الآمن لملفات أطفالهم
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Link Display */}
        <div className="space-y-2">
          <Label className="text-lg font-medium">رابط الوصول المباشر:</Label>
          <div className="flex gap-2">
            <Input
              value={getParentLink()}
              readOnly
              className="font-mono text-sm"
              dir="ltr"
            />
            <Button
              onClick={copyLink}
              variant="outline"
              className="flex-shrink-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="space-y-4">
          <Label className="text-lg font-medium">رمز QR للوصول السريع:</Label>
          
          {/* QR Size Selector */}
          <div className="flex items-center gap-4">
            <Label htmlFor="qrSize" className="text-sm">حجم الرمز:</Label>
            <select
              id="qrSize"
              value={qrSize}
              onChange={(e) => setQrSize(Number(e.target.value))}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value={150}>صغير (150px)</option>
              <option value={200}>متوسط (200px)</option>
              <option value={300}>كبير (300px)</option>
              <option value={400}>كبير جداً (400px)</option>
            </select>
          </div>

          {/* QR Code Display */}
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <img
                src={getQRCodeUrl(qrSize)}
                alt="QR Code for Parent Access"
                className="rounded"
                style={{ width: qrSize, height: qrSize }}
              />
            </div>
          </div>

          {/* QR Actions */}
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              onClick={downloadQR}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              تحميل رمز QR
            </Button>
            <Button
              onClick={shareLink}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              مشاركة الرابط
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">إرشادات للاستخدام:</h4>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• يمكن لأولياء الأمور استخدام الرابط المباشر أو مسح رمز QR</li>
            <li>• سيُطلب من ولي الأمر إدخال رقم الهوية المدنية للطالب</li>
            <li>• يجب التحقق من أنه ليس روبوت قبل الوصول للملفات</li>
            <li>• الرابط آمن ولا يمكن الوصول إلا لملفات الطالب المحدد</li>
            <li>• يمكنك طباعة رمز QR وتوزيعه على أولياء الأمور</li>
          </ul>
        </div>

        {/* Teacher Info */}
        <div className="bg-gray-50 border rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">اسم المعلم:</span>
              <p className="text-gray-900">{teacher.name}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">كود المعلم:</span>
              <p className="font-mono text-gray-900">{teacher.linkCode}</p>
            </div>
            {teacher.schoolName && (
              <div className="col-span-2">
                <span className="font-medium text-gray-700">المدرسة:</span>
                <p className="text-gray-900">{teacher.schoolName}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}