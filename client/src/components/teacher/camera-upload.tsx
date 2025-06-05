import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, FileImage, X } from "lucide-react";
import type { Student } from "@shared/schema";

interface CameraUploadProps {
  teacherId: number;
}

export default function CameraUpload({ teacherId }: CameraUploadProps) {
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  
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

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ imageData, studentId }: { imageData: string; studentId: string }) => {
      const student = (students as Student[]).find(s => s.id.toString() === studentId);
      if (!student) throw new Error('الطالب غير موجود');

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
      
      return { response: await response.json(), student };
    },
    onSuccess: ({ student }) => {
      toast({
        title: "تم رفع الصورة بنجاح",
        description: `تم حفظ الصورة في ملف الطالب ${student.studentName}`
      });
      
      // Reset states
      setCapturedImage(null);
      setSelectedStudentId("");
      setIsImagePreviewOpen(false);
      setIsCameraModalOpen(false);
      
      queryClient.invalidateQueries({ queryKey: [`/api/teacher/${teacherId}/stats`] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في رفع الصورة",
        description: error.message,
        variant: "destructive"
      });
    }
  });

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

  const handleImageUpload = () => {
    if (capturedImage && selectedStudentId) {
      uploadMutation.mutate({ imageData: capturedImage, studentId: selectedStudentId });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            رفع الصور والملفات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Camera Button */}
            <Dialog open={isCameraModalOpen} onOpenChange={setIsCameraModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Camera className="w-8 h-8" />
                  التقاط صورة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>التقاط صورة</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {!isStreaming ? (
                    <div className="text-center py-8">
                      <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <Button onClick={startCamera}>
                        تشغيل الكاميرا
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full rounded-lg"
                      />
                      <div className="flex gap-2 justify-center">
                        <Button onClick={capturePhoto}>
                          التقاط الصورة
                        </Button>
                        <Button variant="outline" onClick={stopCamera}>
                          إيقاف الكاميرا
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Gallery Upload Button */}
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileImage className="w-8 h-8" />
              اختيار من المعرض
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleGalleryUpload}
            />
          </div>
        </CardContent>
      </Card>

      {/* Image Preview Dialog */}
      <Dialog open={isImagePreviewOpen} onOpenChange={setIsImagePreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>معاينة الصورة وتحديد الطالب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {capturedImage && (
              <div className="relative">
                <img 
                  src={capturedImage} 
                  alt="Captured" 
                  className="w-full rounded-lg max-h-64 object-cover"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2">
                اختر الطالب لحفظ الصورة في ملفه:
              </label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الطالب" />
                </SelectTrigger>
                <SelectContent>
                  {(students as Student[]).map((student) => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {student.studentName} - {student.civilId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setCapturedImage(null);
                  setSelectedStudentId("");
                  setIsImagePreviewOpen(false);
                }}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleImageUpload}
                disabled={!selectedStudentId || uploadMutation.isPending}
              >
                {uploadMutation.isPending ? "جاري الرفع..." : "حفظ الصورة"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}