import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FolderPlus, Camera, Image, Monitor, CloudUpload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { handleAuthError } from "@/lib/authUtils";
import { FILE_CATEGORIES } from "@shared/schema";

interface FileManagementProps {
  teacherId: number;
}

const categoryLabels: Record<string, string> = {
  exams: "اختبارات",
  grades: "درجات", 
  homework: "واجبات",
  notes: "ملاحظات",
  alerts: "إنذارات",
  participation: "مشاركات",
  certificates: "شهادات",
  attendance: "حضور وغياب",
  behavior: "سلوك",
  other: "أخرى",
};

const categoryIcons: Record<string, any> = {
  exams: "📝",
  grades: "📊",
  homework: "📋",
  notes: "📄",
  alerts: "⚠️",
  participation: "🏆",
  certificates: "🏅",
  attendance: "📅",
  behavior: "👤",
  other: "📁",
};

export default function FileManagement({ teacherId }: FileManagementProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadFileMutation = useMutation({
    mutationFn: (formData: FormData) => apiRequest('POST', '/api/files/upload', formData),
    onSuccess: () => {
      toast({
        title: "تم الرفع بنجاح",
        description: "تم رفع الملف وحفظه في Google Drive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/stats"] });
      setIsUploadModalOpen(false);
      setSelectedFile(null);
    },
    onError: (error) => {
      if (!handleAuthError(error, toast)) {
        toast({
          title: "خطأ",
          description: "فشل في رفع الملف",
          variant: "destructive",
        });
      }
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار ملف للرفع",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.append('file', selectedFile);
    
    uploadFileMutation.mutate(formData);
  };

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setSelectedFile(file);
        setIsUploadModalOpen(true);
      }
    };
    input.click();
  };

  const handleGallerySelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf,.doc,.docx';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setSelectedFile(file);
        setIsUploadModalOpen(true);
      }
    };
    input.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>إدارة الملفات</span>
          <FolderPlus className="h-6 w-6 text-primary" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* File Upload Area */}
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors mb-6 ${
            dragActive 
              ? 'border-primary bg-blue-50' 
              : 'border-gray-300 hover:border-primary'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <CloudUpload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">اسحب الملفات هنا أو اضغط للاختيار</p>
          <p className="text-sm text-gray-500 mb-4">يدعم JPG, PNG, PDF, DOC (الحد الأقصى: 10 ميجابايت)</p>
          
          <div className="flex flex-wrap justify-center gap-2">
            <Button 
              onClick={handleCameraCapture}
              className="bg-primary hover:bg-primary/90"
            >
              <Camera className="h-4 w-4 ml-2" />
              التقاط صورة
            </Button>
            <Button 
              onClick={handleGallerySelect}
              className="bg-secondary hover:bg-secondary/90"
            >
              <Image className="h-4 w-4 ml-2" />
              من المعرض
            </Button>
            <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline"
                  className="border-gray-600 text-gray-600 hover:bg-gray-50"
                >
                  <Monitor className="h-4 w-4 ml-2" />
                  من الحاسوب
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>رفع ملف جديد</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div>
                    <Label htmlFor="file">اختيار الملف</Label>
                    <Input 
                      id="file"
                      type="file" 
                      accept="image/*,application/pdf,.doc,.docx"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      required
                    />
                    {selectedFile && (
                      <p className="text-sm text-gray-600 mt-1">
                        الملف المختار: {selectedFile.name}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="studentCivilId">الرقم المدني للطالب</Label>
                    <Input 
                      id="studentCivilId" 
                      name="studentCivilId" 
                      placeholder="1234567890" 
                      maxLength={10}
                      pattern="[0-9]{10}"
                      required 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="subject">المادة</Label>
                    <Input 
                      id="subject" 
                      name="subject" 
                      placeholder="الرياضيات" 
                      required 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="fileCategory">تصنيف الملف</Label>
                    <Select name="fileCategory" required>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر التصنيف" />
                      </SelectTrigger>
                      <SelectContent>
                        {FILE_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {categoryIcons[category]} {categoryLabels[category]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">وصف الملف (اختياري)</Label>
                    <Textarea 
                      id="description" 
                      name="description" 
                      placeholder="وصف مختصر للملف..."
                      rows={3}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={uploadFileMutation.isPending}
                  >
                    {uploadFileMutation.isPending ? "جاري الرفع..." : "رفع الملف"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* File Categories */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {FILE_CATEGORIES.map((category) => (
            <div 
              key={category}
              className="p-3 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition-colors cursor-pointer"
            >
              <div className="text-2xl mb-2">{categoryIcons[category]}</div>
              <p className="text-sm font-medium text-blue-800">{categoryLabels[category]}</p>
              <p className="text-xs text-blue-600">0 ملف</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
