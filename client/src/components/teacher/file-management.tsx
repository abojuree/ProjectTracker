import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, FileImage, X } from "lucide-react";
import { FILE_CATEGORIES } from "@shared/schema";
import type { Student } from "@shared/schema";

interface FileManagementProps {
  teacherId: number;
  selectedStudent: string | null;
}

export default function FileManagement({ teacherId, selectedStudent }: FileManagementProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    studentCivilId: "",
    subject: "",
    fileCategory: "",
    description: ""
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedStudentForImage, setSelectedStudentForImage] = useState<Student | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch students list
  const { data: students = [] } = useQuery({
    queryKey: [`/api/teacher/${teacherId}/students`],
  });

  // Start camera stream
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (error) {
      toast({
        title: "خطأ في تشغيل الكاميرا",
        description: "تأكد من السماح للموقع بالوصول للكاميرا",
        variant: "destructive"
      });
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        stopCamera();
        setIsImagePreviewOpen(true);
      }
    }
  };

  // Convert data URL to File
  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || '';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // Handle image upload (captured or selected)
  const handleImageUpload = async (imageData: string, student: Student) => {
    try {
      const fileName = `image_${student.civilId}_${Date.now()}.jpg`;
      const file = dataURLtoFile(imageData, fileName);
      
      const formData = new FormData();
      formData.append('files', file);
      formData.append('category', 'photos');
      
      const response = await fetch(`/api/teacher/${teacherId}/students/${student.id}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'فشل في رفع الصورة');
      }
      
      toast({
        title: "تم رفع الصورة بنجاح",
        description: `تم حفظ الصورة في ملف الطالب ${student.studentName}`
      });
      
      // Reset states
      setCapturedImage(null);
      setSelectedStudentForImage(null);
      setIsImagePreviewOpen(false);
      setIsCameraModalOpen(false);
      
      queryClient.invalidateQueries({ queryKey: [`/api/teacher/${teacherId}/stats`] });
    } catch (error: any) {
      toast({
        title: "خطأ في رفع الصورة",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Handle file upload from gallery
  const handleGalleryUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setCapturedImage(imageData);
        setIsImagePreviewOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

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

  const handleFormSubmit = (e: React.FormEvent) => {
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
                <form onSubmit={handleFormSubmit} className="space-y-4">
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
