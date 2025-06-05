import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FolderPlus, CheckCircle, AlertCircle } from "lucide-react";
import type { Teacher } from "@shared/schema";

interface CreateStudentFoldersButtonProps {
  teacher: Teacher;
  teacherId: number;
}

interface FolderCreationResult {
  success: boolean;
  created: number;
  failed: number;
  details: string[];
}

export default function CreateStudentFoldersButton({ teacher, teacherId }: CreateStudentFoldersButtonProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<FolderCreationResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createFoldersMutation = useMutation({
    mutationFn: async () => {
      setIsCreating(true);
      setProgress(0);
      setResult(null);

      const response = await apiRequest('POST', `/api/teacher/${teacherId}/create-student-folders`);
      return response.json();
    },
    onSuccess: (data: FolderCreationResult) => {
      setResult(data);
      setProgress(100);
      
      if (data.success && data.created > 0) {
        toast({
          title: "تم إنشاء المجلدات بنجاح",
          description: `تم إنشاء ${data.created} مجلد للطلاب في Google Drive`,
        });
        queryClient.invalidateQueries({ queryKey: [`/api/teacher/${teacherId}/students`] });
      }
    },
    onError: (error) => {
      console.error("Error creating folders:", error);
      toast({
        title: "خطأ في إنشاء المجلدات",
        description: "فشل في إنشاء مجلدات الطلاب. تأكد من الاتصال بـ Google Drive",
        variant: "destructive",
      });
      setResult({
        success: false,
        created: 0,
        failed: 1,
        details: ["فشل في الاتصال بـ Google Drive"]
      });
    },
    onSettled: () => {
      setIsCreating(false);
    }
  });

  const handleCreateFolders = () => {
    createFoldersMutation.mutate();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">إنشاء مجلدات الطلاب</h3>
          <p className="text-xs text-muted-foreground">
            إنشاء مجلد منفصل لكل طالب في Google Drive
          </p>
        </div>
        
        <Button 
          onClick={handleCreateFolders}
          disabled={isCreating || !teacher.driveFolderId}
          size="sm"
        >
          <FolderPlus className="h-4 w-4 ml-2" />
          {isCreating ? "جاري الإنشاء..." : "إنشاء مجلدات الطلاب"}
        </Button>
      </div>

      {isCreating && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>جاري إنشاء المجلدات...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {result && (
        <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          {result.success ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription>
            {result.success ? (
              <div>
                <p className="font-medium text-green-800">
                  تم إنشاء {result.created} مجلد بنجاح
                </p>
                {result.failed > 0 && (
                  <p className="text-sm text-green-700 mt-1">
                    فشل في إنشاء {result.failed} مجلد
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="font-medium text-red-800">فشل في إنشاء المجلدات</p>
                {result.details.length > 0 && (
                  <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                    {result.details.slice(0, 3).map((detail, index) => (
                      <li key={index}>{detail}</li>
                    ))}
                    {result.details.length > 3 && (
                      <li>وأخطاء أخرى...</li>
                    )}
                  </ul>
                )}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {!teacher.driveFolderId && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            يجب ربط مجلد Google Drive أولاً قبل إنشاء مجلدات الطلاب
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}