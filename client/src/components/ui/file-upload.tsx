import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  className?: string;
}

export default function FileUpload({ 
  onFileSelect, 
  accept = {
    'image/*': ['.jpeg', '.jpg', '.png'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
  },
  maxSize = 10 * 1024 * 1024, // 10MB
  className = ""
}: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setIsUploading(true);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setIsUploading(false);
            onFileSelect(file);
            return 0;
          }
          return prev + 10;
        });
      }, 100);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false
  });

  return (
    <Card className={`transition-colors ${className}`}>
      <CardContent className="p-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
            ${isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary hover:bg-primary/5'
            }`}
        >
          <input {...getInputProps()} />
          
          {isUploading ? (
            <div className="space-y-4">
              <i className="fas fa-cloud-upload-alt text-4xl text-primary"></i>
              <div>
                <p className="text-lg font-medium text-foreground mb-2">جاري الرفع...</p>
                <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">{uploadProgress}%</p>
              </div>
            </div>
          ) : isDragActive ? (
            <div className="space-y-4">
              <i className="fas fa-cloud-upload-alt text-4xl text-primary animate-bounce"></i>
              <p className="text-lg font-medium text-primary">أفلت الملف هنا...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <i className="fas fa-cloud-upload-alt text-4xl text-muted-foreground"></i>
              <div>
                <p className="text-lg font-medium text-foreground mb-2">
                  اسحب الملفات هنا أو اضغط للاختيار
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  يدعم JPG, PNG, PDF, DOC (الحد الأقصى: {Math.round(maxSize / 1024 / 1024)} ميجابايت)
                </p>
              </div>
              
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="default" size="sm">
                  <i className="fas fa-camera ml-2"></i>
                  التقاط صورة
                </Button>
                <Button variant="secondary" size="sm">
                  <i className="fas fa-images ml-2"></i>
                  من المعرض
                </Button>
                <Button variant="outline" size="sm">
                  <i className="fas fa-desktop ml-2"></i>
                  من الحاسوب
                </Button>
              </div>
            </div>
          )}
        </div>

        {fileRejections.length > 0 && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive font-medium mb-1">
              <i className="fas fa-exclamation-triangle ml-1"></i>
              خطأ في رفع الملف:
            </p>
            {fileRejections.map(({ file, errors }) => (
              <div key={file.name} className="text-sm text-destructive">
                {errors.map(error => (
                  <p key={error.code}>
                    {error.code === 'file-too-large' 
                      ? `الملف كبير جداً (الحد الأقصى: ${Math.round(maxSize / 1024 / 1024)} ميجابايت)`
                      : error.code === 'file-invalid-type'
                      ? 'نوع الملف غير مدعوم'
                      : error.message
                    }
                  </p>
                ))}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
