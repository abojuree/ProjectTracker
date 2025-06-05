import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Copy, FolderOpen, ExternalLink, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Teacher } from "@shared/schema";

interface FolderInstructionsProps {
  teacher: Teacher;
  studentCount: number;
}

export default function FolderInstructions({ teacher, studentCount }: FolderInstructionsProps) {
  const { toast } = useToast();

  if (!teacher.driveFolderId) {
    return null;
  }

  const driveUrl = `https://drive.google.com/drive/folders/${teacher.driveFolderId}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "تم النسخ",
      description: `تم نسخ ${label} إلى الحافظة`,
    });
  };

  const folderStructureInstructions = [
    "افتح Google Drive الخاص بك",
    "انتقل إلى المجلد الرئيسي للطلاب",
    `أنشئ ${studentCount} مجلد فرعي (مجلد لكل طالب)`,
    "اسم كل مجلد: اسم الطالب - رقم الهوية",
    "داخل كل مجلد طالب، أنشئ المجلدات التالية:",
    "  • الواجبات",
    "  • الاختبارات", 
    "  • المشاريع",
    "  • الأنشطة",
    "  • التقييمات",
    "  • أخرى"
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            تعليمات إنشاء مجلدات الطلاب
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              نظراً لأن OAuth لم يكتمل بعد، يمكنك إنشاء مجلدات الطلاب يدوياً في Google Drive
            </AlertDescription>
          </Alert>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-3">خطوات إنشاء مجلدات الطلاب:</h4>
            <ol className="space-y-2 text-sm">
              {folderStructureInstructions.map((instruction, index) => (
                <li key={index} className="flex gap-2">
                  <span className="font-medium text-primary">{index + 1}.</span>
                  <span>{instruction}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium">رابط مجلد Google Drive:</span>
            <div className="flex-1 font-mono text-sm bg-white p-2 rounded border">
              {driveUrl}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(driveUrl, "رابط المجلد")}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(driveUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>

          <Alert>
            <AlertDescription>
              <strong>إعدادات المشاركة المطلوبة:</strong>
              <br />
              • انقر بزر الماوس الأيمن على المجلد الرئيسي
              <br />
              • اختر "مشاركة" 
              <br />
              • اختر "أي شخص لديه الرابط يمكنه عرض"
              <br />
              • احفظ الإعدادات
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}