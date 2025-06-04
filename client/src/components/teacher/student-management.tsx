import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import type { Student } from "@shared/schema";

interface StudentManagementProps {
  teacherId: number;
  onStudentSelect: (civilId: string) => void;
}

export default function StudentManagement({ teacherId, onStudentSelect }: StudentManagementProps) {
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    civilId: "",
    studentName: "",
    grade: "",
    classNumber: "",
    subject: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: [`/api/teacher/${teacherId}/students`],
  });

  const excelUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`/api/teacher/${teacherId}/students/upload-excel`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload Excel file');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      const description = data.skipped > 0 
        ? `تم إضافة ${data.added} طالب، تم تجاهل ${data.skipped} صف`
        : `تم إضافة ${data.added} طالب`;
      
      toast({
        title: "تم رفع الملف بنجاح",
        description: description,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/teacher/${teacherId}/students`] });
      setIsExcelModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "خطأ في رفع الملف",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createStudentMutation = useMutation({
    mutationFn: async (studentData: typeof newStudent) => {
      return await apiRequest('POST', `/api/teacher/${teacherId}/students`, {
        ...studentData,
        classNumber: parseInt(studentData.classNumber)
      });
    },
    onSuccess: () => {
      toast({
        title: "تم إضافة الطالب بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/teacher/${teacherId}/students`] });
      setIsStudentModalOpen(false);
      setNewStudent({
        civilId: "",
        studentName: "",
        grade: "",
        classNumber: "",
        subject: ""
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ في إضافة الطالب",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      excelUploadMutation.mutate(file);
    }
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createStudentMutation.mutate(newStudent);
  };

  return (
    <Card className="card-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>إدارة بيانات الطلاب</span>
          <i className="fas fa-database text-primary text-xl"></i>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Upload Methods */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Dialog open={isExcelModalOpen} onOpenChange={setIsExcelModalOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex flex-col items-center p-6 h-auto border-2 border-dashed border-primary hover:bg-blue-50 transition-colors"
              >
                <i className="fas fa-file-excel text-3xl text-green-600 mb-2"></i>
                <span className="text-sm font-medium text-foreground">رفع ملف Excel</span>
                <span className="text-xs text-muted-foreground mt-1">الطريقة الأولى</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>رفع ملف Excel</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <i className="fas fa-file-excel text-4xl text-green-600 mb-4"></i>
                  <p className="text-sm text-muted-foreground mb-2">اختر ملف Excel</p>
                  <Input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleExcelUpload}
                    disabled={excelUploadMutation.isPending}
                  />
                </div>
                
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.open('/api/excel-template', '_blank');
                    }}
                    className="text-xs"
                  >
                    <i className="fas fa-download ml-1"></i>
                    تحميل نموذج Excel
                  </Button>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">الأعمدة المطلوبة:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>رقم متسلسل</li>
                    <li>اسم الطالب</li>
                    <li>رقم الهوية (10 أرقام)</li>
                    <li>الصف</li>
                    <li>رقم الفصل</li>
                    <li>المادة</li>
                  </ul>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            className="flex flex-col items-center p-6 h-auto border-2 border-dashed border-green-500 hover:bg-green-50 transition-colors"
            onClick={() => {
              toast({
                title: "قريباً",
                description: "خاصية ربط Google Sheets ستكون متاحة قريباً",
              });
            }}
          >
            <i className="fas fa-table text-3xl text-green-600 mb-2"></i>
            <span className="text-sm font-medium text-foreground">ربط Google Sheets</span>
            <span className="text-xs text-muted-foreground mt-1">الطريقة الثانية</span>
          </Button>

          <Dialog open={isStudentModalOpen} onOpenChange={setIsStudentModalOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex flex-col items-center p-6 h-auto border-2 border-dashed border-purple-500 hover:bg-purple-50 transition-colors"
              >
                <i className="fas fa-user-plus text-3xl text-purple-600 mb-2"></i>
                <span className="text-sm font-medium text-foreground">إضافة طالب منفرد</span>
                <span className="text-xs text-muted-foreground mt-1">الطريقة الثالثة</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة طالب جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleStudentSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="studentName">اسم الطالب</Label>
                  <Input
                    id="studentName"
                    value={newStudent.studentName}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, studentName: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="civilId">رقم الهوية (10 أرقام)</Label>
                  <Input
                    id="civilId"
                    value={newStudent.civilId}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, civilId: e.target.value }))}
                    maxLength={10}
                    pattern="[0-9]{10}"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="grade">الصف</Label>
                  <Input
                    id="grade"
                    value={newStudent.grade}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, grade: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="classNumber">رقم الفصل</Label>
                  <Input
                    id="classNumber"
                    type="number"
                    value={newStudent.classNumber}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, classNumber: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="subject">المادة</Label>
                  <Input
                    id="subject"
                    value={newStudent.subject}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, subject: e.target.value }))}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createStudentMutation.isPending}
                >
                  {createStudentMutation.isPending ? "جاري الإضافة..." : "إضافة الطالب"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Students List */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-foreground mb-4">قائمة الطلاب الحالية</h3>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center p-3 bg-muted rounded-lg">
                  <div className="w-10 h-10 bg-muted-foreground/20 rounded-full ml-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted-foreground/20 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
              {students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <i className="fas fa-users text-3xl mb-2"></i>
                  <p>لا يوجد طلاب مسجلون بعد</p>
                  <p className="text-sm">استخدم إحدى الطرق أعلاه لإضافة الطلاب</p>
                </div>
              ) : (
                students.map((student) => (
                  <div 
                    key={student.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => onStudentSelect(student.civilId)}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center ml-3">
                        <span className="text-sm font-bold">
                          {student.studentName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{student.studentName}</p>
                        <p className="text-sm text-muted-foreground">
                          {student.grade} - فصل {student.classNumber} - {student.subject}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-reverse space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        student.folderCreated 
                          ? "bg-green-100 text-green-800" 
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        <i className={`fas ${student.folderCreated ? "fa-check" : "fa-clock"} ml-1`}></i>
                        {student.folderCreated ? "مجلد منشأ" : "قيد الإنشاء"}
                      </span>
                      <Button variant="ghost" size="sm">
                        <i className="fas fa-ellipsis-v"></i>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
