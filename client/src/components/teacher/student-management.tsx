import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Upload, UserPlus, Users } from "lucide-react";
import { teacherApi } from "@/lib/api";
import StudentDeleteActions from "@/components/teacher/StudentDeleteActions";

interface StudentManagementProps {
  teacherId: number;
  onStudentSelect?: (civilId: string) => void;
}

import type { Student } from "@shared/schema";

export default function StudentManagement({ teacherId, onStudentSelect }: StudentManagementProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newStudent, setNewStudent] = useState({
    civilId: "",
    studentName: "",
    grade: "",
    classNumber: "",
    subject: ""
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const { data: students = [] as Student[], isLoading } = useQuery({
    queryKey: [`/api/teacher/${teacherId}/students`],
    enabled: !!teacherId
  });

  const addStudentMutation = useMutation({
    mutationFn: async (studentData: any) => {
      const response = await fetch(`/api/teacher/${teacherId}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to add student');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teacher/${teacherId}/students`] });
      setNewStudent({ civilId: "", studentName: "", grade: "", classNumber: "", subject: "" });
      setShowAddForm(false);
      toast({
        title: "تم إضافة الطالب بنجاح",
        description: "تم إنشاء ملف جديد للطالب"
      });
    },
    onError: () => {
      toast({
        title: "خطأ في إضافة الطالب",
        description: "يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    }
  });

  const uploadExcelMutation = useMutation({
    mutationFn: (file: File) => teacherApi.uploadExcel(teacherId, file, setUploadProgress),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/teacher/${teacherId}/students`] });
      setShowUploadForm(false);
      setUploadProgress(0);
      toast({
        title: "تم رفع الملف بنجاح",
        description: `تم إضافة ${result.added} طالب. ${result.skipped > 0 ? `تم تجاهل ${result.skipped} صف.` : ''}`
      });
    },
    onError: (error: any) => {
      setUploadProgress(0);
      toast({
        title: "خطأ في رفع الملف",
        description: error.message || "يرجى التأكد من صيغة الملف",
        variant: "destructive"
      });
    }
  });

  const handleAddStudent = () => {
    if (!newStudent.civilId || !newStudent.studentName || !newStudent.grade || !newStudent.classNumber || !newStudent.subject) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    addStudentMutation.mutate({
      ...newStudent,
      classNumber: parseInt(newStudent.classNumber),
      teacherId,
      isActive: true
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadExcelMutation.mutate(file);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">جاري تحميل بيانات الطلاب...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            إدارة الطلاب
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={() => setShowAddForm(!showAddForm)} variant="outline">
              <UserPlus className="ml-2 h-4 w-4" />
              إضافة طالب جديد
            </Button>
            <Button onClick={() => setShowUploadForm(!showUploadForm)} variant="outline">
              <Upload className="ml-2 h-4 w-4" />
              رفع ملف Excel
            </Button>
          </div>

          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle>إضافة طالب جديد</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="civilId">رقم الهوية المدنية</Label>
                    <Input
                      id="civilId"
                      value={newStudent.civilId}
                      onChange={(e) => setNewStudent({...newStudent, civilId: e.target.value})}
                      placeholder="10 أرقام"
                      maxLength={10}
                      className="text-right"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="studentName">اسم الطالب</Label>
                    <Input
                      id="studentName"
                      value={newStudent.studentName}
                      onChange={(e) => setNewStudent({...newStudent, studentName: e.target.value})}
                      placeholder="الاسم الكامل"
                      className="text-right"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="grade">الصف</Label>
                    <Select value={newStudent.grade} onValueChange={(value) => setNewStudent({...newStudent, grade: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الصف" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="الأول الابتدائي">الأول الابتدائي</SelectItem>
                        <SelectItem value="الثاني الابتدائي">الثاني الابتدائي</SelectItem>
                        <SelectItem value="الثالث الابتدائي">الثالث الابتدائي</SelectItem>
                        <SelectItem value="الرابع الابتدائي">الرابع الابتدائي</SelectItem>
                        <SelectItem value="الخامس الابتدائي">الخامس الابتدائي</SelectItem>
                        <SelectItem value="السادس الابتدائي">السادس الابتدائي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="classNumber">رقم الفصل</Label>
                    <Input
                      id="classNumber"
                      type="number"
                      value={newStudent.classNumber}
                      onChange={(e) => setNewStudent({...newStudent, classNumber: e.target.value})}
                      placeholder="1, 2, 3..."
                      min="1"
                      max="20"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="subject">المادة</Label>
                    <Select value={newStudent.subject} onValueChange={(value) => setNewStudent({...newStudent, subject: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المادة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="الرياضيات">الرياضيات</SelectItem>
                        <SelectItem value="اللغة العربية">اللغة العربية</SelectItem>
                        <SelectItem value="العلوم">العلوم</SelectItem>
                        <SelectItem value="الاجتماعيات">الاجتماعيات</SelectItem>
                        <SelectItem value="التربية الإسلامية">التربية الإسلامية</SelectItem>
                        <SelectItem value="اللغة الإنجليزية">اللغة الإنجليزية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddStudent} disabled={addStudentMutation.isPending}>
                    {addStudentMutation.isPending ? "جاري الإضافة..." : "إضافة الطالب"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    إلغاء
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {showUploadForm && (
            <Card>
              <CardHeader>
                <CardTitle>رفع ملف Excel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    اختر ملف Excel يحتوي على: اسم الطالب، رقم الهوية، الصف، رقم الفصل، المادة
                  </p>
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      📋 ملاحظة: سيتم إضافة الطلاب الجدد فقط. الطلاب الموجودين مسبقاً سيتم تجاهلهم لتجنب التكرار
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="excel-upload"
                  />
                  <Label htmlFor="excel-upload" className="cursor-pointer">
                    <Button asChild disabled={uploadExcelMutation.isPending}>
                      <span>اختيار ملف Excel</span>
                    </Button>
                  </Label>
                  {uploadProgress > 0 && (
                    <div className="mt-4">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{uploadProgress}%</p>
                    </div>
                  )}
                </div>
                <Button variant="outline" onClick={() => setShowUploadForm(false)}>
                  إلغاء
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الطلاب ({students?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {students && students.length > 0 ? (
            <StudentDeleteActions students={students} teacherId={teacherId} />
          ) : (
            <div className="text-center py-8 text-gray-500">
              لا توجد بيانات طلاب. قم بإضافة طلاب جدد أو رفع ملف Excel.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}