import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Cloud, CheckCircle, AlertCircle, Link } from "lucide-react";
import type { Teacher } from "@shared/schema";
import CreateStudentFoldersButton from "./CreateStudentFoldersButton";

interface GoogleDriveConnectProps {
  teacher: Teacher;
  teacherId: number;
}

function extractFolderIdFromLink(link: string): string | null {
  const patterns = [
    /\/folders\/([a-zA-Z0-9-_]+)/,
    /id=([a-zA-Z0-9-_]+)/,
    /^([a-zA-Z0-9-_]+)$/
  ];
  
  for (const pattern of patterns) {
    const match = link.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export default function GoogleDriveConnect({ teacher, teacherId }: GoogleDriveConnectProps) {
  const [driveLink, setDriveLink] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const extractedFolderId = driveLink ? extractFolderIdFromLink(driveLink) : null;
  const isValid = Boolean(extractedFolderId);

  const saveDriveLinkMutation = useMutation({
    mutationFn: async (link: string) => {
      const response = await apiRequest("POST", `/api/teacher/${teacherId}/drive-link`, {
        driveFolderLink: link
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم ربط مجلد Google Drive بنجاح",
      });
      setDriveLink("");
      queryClient.invalidateQueries({ queryKey: [`/api/teacher/${teacherId}`] });
    },
    onError: (error) => {
      console.error("Save drive link error:", error);
      toast({
        title: "خطأ في الحفظ",
        description: "فشل في حفظ رابط Google Drive. حاول مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  const handleSaveLink = () => {
    if (!driveLink.trim()) {
      toast({
        title: "رابط مطلوب",
        description: "يرجى إدخال رابط مجلد Google Drive",
        variant: "destructive",
      });
      return;
    }
    saveDriveLinkMutation.mutate(driveLink.trim());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          ربط Google Drive
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {teacher.accessToken ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              تم ربط حسابك مع Google Drive بنجاح. يمكن الآن إنشاء مجلدات الطلاب تلقائياً في حسابك الشخصي.
            </AlertDescription>
          </Alert>
        ) : !teacher.driveFolderId ? (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">ربط حساب Google Drive الشخصي</h4>
              <p className="text-sm text-blue-700 mb-4">
                لإنشاء المجلدات تلقائياً في حسابك الشخصي، اربط حساب Google Drive الخاص بك
              </p>
              <Button 
                onClick={() => window.location.href = `/api/teacher/${teacherId}/google-auth`}
                className="w-full"
              >
                <Cloud className="h-4 w-4 ml-2" />
                ربط حساب Google Drive
              </Button>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">أو استخدم الطريقة اليدوية:</h4>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="driveFolderLink">رابط مجلد Google Drive</Label>
                  <Input
                    id="driveFolderLink"
                    type="url"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={driveLink}
                    onChange={(e) => setDriveLink(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    انسخ رابط مجلد Google Drive المشترك هنا
                  </p>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">تعليمات مهمة:</h4>
                  <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                    <li>أنشئ مجلداً جديداً في Google Drive</li>
                    <li>اضغط بالزر الأيمن على المجلد واختر "مشاركة"</li>
                    <li>اختر "أي شخص لديه الرابط يمكنه التحرير"</li>
                    <li>انسخ الرابط والصقه هنا</li>
                  </ol>
                </div>

                <Button 
                  onClick={handleSaveLink}
                  disabled={!driveLink.trim() || saveDriveLinkMutation.isPending}
                  className="w-full"
                  variant="outline"
                >
                  {saveDriveLinkMutation.isPending ? "جاري الحفظ..." : "حفظ رابط Google Drive"}
                </Button>

                {isValid && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      الرابط صحيح ومعرف المجلد: {extractedFolderId}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>
        ) : null}
        
        {teacher.driveFolderId && (
          <div className="mt-4 space-y-3">
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">مجلد Google Drive المربوط:</p>
                  <p className="text-sm text-muted-foreground break-all">
                    https://drive.google.com/drive/folders/{teacher.driveFolderId}
                  </p>
                  <a 
                    href={`https://drive.google.com/drive/folders/${teacher.driveFolderId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    فتح المجلد في تبويب جديد
                  </a>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Reset the folder ID to show the input form again
                    saveDriveLinkMutation.mutate("");
                  }}
                >
                  تغيير المجلد
                </Button>
              </div>
            </div>
            
            <CreateStudentFoldersButton teacherId={teacherId} teacher={teacher} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}