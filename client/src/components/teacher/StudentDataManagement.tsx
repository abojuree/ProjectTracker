import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileSpreadsheet, Table, UserPlus, Check, Clock, MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { handleAuthError } from "@/lib/authUtils";

interface StudentDataManagementProps {
  teacherId: number;
}

export default function StudentDataManagement({ teacherId }: StudentDataManagementProps) {
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: students, isLoading } = useQuery({
    queryKey: ["/api/students"],
  });

  const uploadExcelMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiRequest('POST', '/api/students/upload-excel', formData);
    },
    onSuccess: () => {
      toast({
        title: "نجح الرفع",
        description: "تم رفع ملف Excel وإضافة الطلاب بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/stats"] });
      setIsExcelModalOpen(false);
      setExcelFile(null);
    },
    onError: (error) => {
      if (!handleAuthError(error, toast)) {
        toast({
          title: "خطأ",
          description: "فشل في رفع ملف Excel",
          variant: "destructive",
        });
      }
    },
  });

  const addStudentMutation = useMutation({
    mutationFn: (studentData: any) => apiRequest('POST', '/api/students', studentData),
    onSuccess: () => {
      toast({
        title: "تم بنجاح",
        description: "تم إضافة الطالب بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/stats"] });
      setIsStudentModalOpen(false);
    },
    onError: (error) => {
      if (!handleAuthError(error, toast)) {
        toast({
          title: "خطأ",
          description: "فشل في إضافة الطالب",
          variant: "destructive",
        });
      }
    },
  });

  const handleExcelUpload = () => {
    if (!excelFile) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار ملف Excel",
        variant: "destructive",
      });
      return;
    }
    uploadExcelMutation.mutate(excelFile);
  };

  const handleAddStudent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const studentData = {
      civilId: formData.get('civilId'),
      studentName: formData.get('studentName'),
      grade: formData.get('grade'),
      classNumber: parseInt(formData.get('classNumber') as string),
      subject: formData.get('subject'),
    };
    addStudentMutation.mutate(studentData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>إدارة بيانات الطلاب</span>
          <FileSpreadsheet className="h-6 w-6 text-primary" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Upload Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Dialog open={isExcelModalOpen} onOpenChange={setIsExcelModalOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="flex flex-col items-center p-6 h-auto border-2 border-dashed border-primary hover:bg-blue-50"
              >
                <FileSpreadsheet className="h-8 w-8 text-green-600 mb-2" />
                <span className="text-sm font-medium">رفع ملف Excel</span>
                <span className="text-xs text-gray-500 mt-1">الطريقة الأولى</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>رفع ملف Excel</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <FileSpreadsheet className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <Input 
                    type="file" 
                    accept=".xlsx,.xls"
                    onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                    className="mb-2"
                  />
                  <p className="text-sm text-gray-600">اختر ملف Excel (.xlsx, .xls)</p>
                </div>
                
                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                  <p className="font-medium mb-2">الأعمدة المطلوبة:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>رقم متسلسل</li>
                    <li>اسم الطالب</li>
                    <li>رقم الهوية (10 أرقام)</li>
                    <li>الصف</li>
                    <li>رقم الفصل</li>
                    <li>المادة</li>
                  </ul>
                </div>

                <Button 
                  onClick={handleExcelUpload}
                  disabled={!excelFile || uploadExcelMutation.isPending}
                  className="w-full"
                >
                  {uploadExcelMutation.isPending ? "جاري الرفع..." : "رفع الملف"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline" 
            className="flex flex-col items-center p-6 h-auto border-2 border-dashed border-secondary hover:bg-green-50"
            onClick={() => {
              toast({
                title: "قريباً",
                description: "ميزة ربط Google Sheets ستكون متاحة قريباً",
              });
            }}
          >
            <Table className="h-8 w-8 text-secondary mb-2" />
            <span className="text-sm font-medium">ربط Google Sheets</span>
            <span className="text-xs text-gray-500 mt-1">الطريقة الثانية</span>
          </Button>

          <Dialog open={isStudentModalOpen} onOpenChange={setIsStudentModalOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="flex flex-col items-center p-6 h-auto border-2 border-dashed border-purple-500 hover:bg-purple-50"
              >
                <UserPlus className="h-8 w-8 text-purple-600 mb-2" />
                <span className="text-sm font-medium">إضافة طالب منفرد</span>
                <span className="text-xs text-gray-500 mt-1">الطريقة الثالثة</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة طالب جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div>
                  <Label htmlFor="civilId">الرقم المدني</Label>
                  <Input 
                    id="civilId" 
                    name="civilId" 
                    placeholder="1234567890" 
                    maxLength={10}
                    pattern="[0-9]{10}"
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="studentName">اسم الطالب</Label>
                  <Input id="studentName" name="studentName" placeholder="أحمد محمد الفهد" required />
                </div>
                <div>
                  <Label htmlFor="grade">الصف</Label>
                  <Input id="grade" name="grade" placeholder="الصف الرابع" required />
                </div>
                <div>
                  <Label htmlFor="classNumber">رقم الفصل</Label>
                  <Input 
                    id="classNumber" 
                    name="classNumber" 
                    type="number" 
                    placeholder="1" 
                    min="1" 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="subject">المادة</Label>
                  <Input id="subject" name="subject" placeholder="الرياضيات" required />
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={addStudentMutation.isPending}
                >
                  {addStudentMutation.isPending ? "جاري الإضافة..." : "إضافة الطالب"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Students List */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">قائمة الطلاب الحالية</h3>
          
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse p-3 bg-gray-100 rounded-lg">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : students && students.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {students.map((student: any) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center ml-3">
                      <span className="text-sm font-bold">
                        {student.studentName.split(' ')[0].substring(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{student.studentName}</p>
                      <p className="text-sm text-gray-500">{student.grade} - فصل {student.classNumber}</p>
                      <p className="text-xs text-gray-400">{student.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-reverse space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      student.folderCreated 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {student.folderCreated ? (
                        <>
                          <Check className="h-3 w-3 inline ml-1" />
                          مجلد منشأ
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 inline ml-1" />
                          قيد الإنشاء
                        </>
                      )}
                    </span>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <UserPlus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>لا يوجد طلاب مسجلين بعد</p>
              <p className="text-sm">ابدأ بإضافة الطلاب باستخدام إحدى الطرق أعلاه</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
