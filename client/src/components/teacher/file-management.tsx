import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { FILE_CATEGORIES } from "@shared/schema";

interface FileManagementProps {
  teacherId: number;
  selectedStudent: string | null;
}

export default function FileManagement({ teacherId, selectedStudent }: FileManagementProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    studentCivilId: "",
    subject: "",
    fileCategory: "",
    description: ""
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/api/teacher/${teacherId}/files`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload file');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم رفع الملف بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/teacher/${teacherId}/stats`] });
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setUploadData({
        studentCivilId: "",
        subject: "",
        fileCategory: "",
        description: ""
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ في رفع الملف",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !uploadData.studentCivilId || !uploadData.subject || !uploadData.fileCategory) {
      toast({
        title: "خطأ",
        description: "يرجى تعبئة جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('studentCivilId', uploadData.studentCivilId);
    formData.append('subject', uploadData.subject);
    formData.append('fileCategory', uploadData.fileCategory);
    formData.append('description', uploadData.description);

    uploadMutation.mutate(formData);
  };

  const fileCategoryStats = [
    { name: "اختبارات", icon: "fas fa-file-alt", color: "blue", count: 24 },
    { name: "درجات", icon: "fas fa-chart-line", color: "green", count: 18 },
    { name: "واجبات", icon: "fas fa-book-open", color: "yellow", count: 32 },
    { name: "ملاحظات", icon: "fas fa-sticky-note", color: "purple", count: 12 },
    { name: "إنذارات", icon: "fas fa-exclamation-triangle", color: "red", count: 5 }
  ];

  return (
    <Card className="card-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>إدارة الملفات</span>
          <i className="fas fa-folder-plus text-primary text-xl"></i>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* File Upload Area */}
        <div className="file-drop-zone rounded-lg p-8 text-center mb-6">
          <i className="fas fa-cloud-upload-alt text-4xl text-muted-foreground mb-4"></i>
          <p className="text-lg font-medium text-foreground mb-2">اسحب الملفات هنا أو اضغط للاختيار</p>
          <p className="text-sm text-muted-foreground mb-4">يدعم JPG, PNG, PDF, DOC (الحد الأقصى: 10 ميجابايت)</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant="default"
              onClick={() => {
                toast({
                  title: "قريباً",
                  description: "خاصية التقاط الصورة ستكون متاحة قريباً",
                });
              }}
            >
              <i className="fas fa-camera ml-2"></i>
              التقاط صورة
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                toast({
                  title: "قريباً", 
                  description: "خاصية اختيار من المعرض ستكون متاحة قريباً",
                });
              }}
            >
              <i className="fas fa-images ml-2"></i>
              من المعرض
            </Button>
            <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <i className="fas fa-desktop ml-2"></i>
                  من الحاسوب
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>رفع ملف جديد</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div>
                    <Label htmlFor="file">اختر الملف</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="studentCivilId">رقم هوية الطالب</Label>
                    <Input
                      id="studentCivilId"
                      value={uploadData.studentCivilId}
                      onChange={(e) => setUploadData(prev => ({ ...prev, studentCivilId: e.target.value }))}
                      placeholder="1234567890"
                      maxLength={10}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject">المادة</Label>
                    <Input
                      id="subject"
                      value={uploadData.subject}
                      onChange={(e) => setUploadData(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="الرياضيات"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="fileCategory">تصنيف الملف</Label>
                    <Select
                      value={uploadData.fileCategory}
                      onValueChange={(value) => setUploadData(prev => ({ ...prev, fileCategory: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر التصنيف" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(FILE_CATEGORIES).map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="description">وصف (اختياري)</Label>
                    <Textarea
                      id="description"
                      value={uploadData.description}
                      onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="وصف قصير للملف"
                      rows={3}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={uploadMutation.isPending}
                  >
                    {uploadMutation.isPending ? "جاري الرفع..." : "رفع الملف"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* File Categories */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {fileCategoryStats.map((category, index) => (
            <div 
              key={index}
              className={`p-3 bg-${category.color}-50 rounded-lg text-center hover:bg-${category.color}-100 transition-colors cursor-pointer`}
            >
              <i className={`${category.icon} text-${category.color}-600 text-xl mb-2`}></i>
              <p className={`text-sm font-medium text-${category.color}-800`}>{category.name}</p>
              <p className={`text-xs text-${category.color}-600`}>{category.count} ملف</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
