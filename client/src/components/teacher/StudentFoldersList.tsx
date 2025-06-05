import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, FolderOpen, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Teacher } from "@shared/schema";

interface StudentFoldersListProps {
  teacher: Teacher;
  teacherId: number;
}

export default function StudentFoldersList({ teacher, teacherId }: StudentFoldersListProps) {
  const { toast } = useToast();
  
  const { data: students = [] } = useQuery({
    queryKey: [`/api/teacher/${teacherId}/students`],
    enabled: !!teacherId,
  });

  if (!teacher.driveFolderId || !Array.isArray(students) || students.length === 0) {
    return null;
  }

  const driveBaseUrl = `https://drive.google.com/drive/folders/${teacher.driveFolderId}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "تم النسخ",
      description: `تم نسخ ${label} إلى الحافظة`,
    });
  };

  const generateStudentFolderName = (student: any) => {
    return `${student.studentName} - ${student.civilId}`;
  };

  const generateQRCode = (text: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(text)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          قائمة مجلدات الطلاب ({students.length} طالب)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
          <FolderOpen className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">المجلد الرئيسي:</span>
          <div className="flex-1 font-mono text-sm bg-white p-2 rounded border">
            {driveBaseUrl}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => copyToClipboard(driveBaseUrl, "رابط المجلد الرئيسي")}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(driveBaseUrl, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          {students.map((student: any) => {
            const folderName = generateStudentFolderName(student);
            const studentFolderUrl = `${driveBaseUrl}/${encodeURIComponent(folderName)}`;
            const qrCodeUrl = generateQRCode(studentFolderUrl);
            
            return (
              <div key={student.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{student.studentName}</h4>
                  <Badge variant="outline" className="text-xs">
                    {student.grade} - {student.classNumber}
                  </Badge>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  رقم الهوية: {student.civilId}
                </div>
                
                <div className="bg-gray-50 p-2 rounded text-xs font-mono">
                  اسم المجلد: {folderName}
                </div>
                
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    onClick={() => copyToClipboard(folderName, "اسم المجلد")}
                  >
                    نسخ الاسم
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    onClick={() => copyToClipboard(studentFolderUrl, "رابط المجلد")}
                  >
                    نسخ الرابط
                  </Button>
                </div>
                
                <div className="flex justify-center pt-2">
                  <img 
                    src={qrCodeUrl} 
                    alt={`QR Code for ${student.studentName}`}
                    className="w-16 h-16 border rounded"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm">
          <strong>تعليمات للمعلم:</strong>
          <ol className="mt-2 space-y-1 text-xs">
            <li>1. افتح المجلد الرئيسي في Google Drive</li>
            <li>2. أنشئ مجلد جديد لكل طالب باستخدام الأسماء المذكورة أعلاه</li>
            <li>3. داخل كل مجلد طالب، أنشئ المجلدات الفرعية: الواجبات، الاختبارات، المشاريع، الأنشطة، التقييمات، أخرى</li>
            <li>4. اضبط إعدادات المشاركة لكل مجلد طالب: "أي شخص لديه الرابط يمكنه عرض"</li>
            <li>5. استخدم رموز QR لمشاركة الروابط مع أولياء الأمور</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}