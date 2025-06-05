import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Student } from "@shared/schema";

interface FileUploadProps {
  teacherId: number;
}

export default function FileUpload({ teacherId }: FileUploadProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch students
  const { data: students = [], isLoading } = useQuery({
    queryKey: [`/api/teacher/${teacherId}/students`],
  });

  // Get unique grades and classes
  const grades = Array.from(new Set((students as Student[]).map(s => s.grade))).filter(Boolean);
  const classes = Array.from(new Set((students as Student[]).map(s => s.classNumber))).filter(Boolean);

  // Filter students
  const filteredStudents = (students as Student[]).filter((student: Student) => {
    const matchesSearch = student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.civilId.includes(searchTerm);
    const matchesGrade = !selectedGrade || student.grade === selectedGrade;
    const matchesClass = !selectedClass || student.classNumber.toString() === selectedClass;
    
    return matchesSearch && matchesGrade && matchesClass;
  });

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/api/teacher/${teacherId}/students/${selectedStudentId}/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('فشل في رفع الملف');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم رفع الملف بنجاح",
        description: "تم حفظ الملف في مجلد الطالب"
      });
      setUploadedFiles([]);
      setSelectedStudentId(null);
      queryClient.invalidateQueries({ queryKey: [`/api/teacher/${teacherId}/students`] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في رفع الملف",
        description: error.message || "حدث خطأ أثناء رفع الملف",
        variant: "destructive"
      });
    }
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/*': ['.txt']
    },
    multiple: true
  });

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (!selectedStudentId || uploadedFiles.length === 0) return;

    const formData = new FormData();
    uploadedFiles.forEach(file => {
      formData.append('files', file);
    });
    if (selectedCategory) {
      formData.append('category', selectedCategory);
    }

    uploadMutation.mutate(formData);
  };

  const selectedStudent = (students as Student[]).find((s: Student) => s.id === selectedStudentId);

  if (isLoading) {
    return <div className="text-center py-8">جاري تحميل بيانات الطلاب...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            البحث عن الطلاب
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="ابحث بالاسم أو رقم الهوية..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الصف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">جميع الصفوف</SelectItem>
                {grades.map(grade => (
                  <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الفصل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">جميع الفصول</SelectItem>
                {classes.map(classNum => (
                  <SelectItem key={classNum} value={classNum.toString()}>{classNum}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results Summary */}
          <div className="text-sm text-muted-foreground">
            عدد النتائج: {filteredStudents.length} طالب
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الطلاب</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {filteredStudents.map((student: Student) => (
              <div
                key={student.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedStudentId === student.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedStudentId(student.id)}
              >
                <div className="font-medium">{student.studentName}</div>
                <div className="text-sm text-muted-foreground">
                  الهوية: {student.civilId}
                </div>
                <div className="flex gap-2 mt-2">
                  {student.grade && (
                    <Badge variant="secondary" className="text-xs">
                      {student.grade}
                    </Badge>
                  )}
                  {student.className && (
                    <Badge variant="outline" className="text-xs">
                      {student.className}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* File Upload Section */}
      {selectedStudent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              رفع ملفات للطالب: {selectedStudent.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Category Selection */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="اختر تصنيف الملف (اختياري)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">بدون تصنيف</SelectItem>
                <SelectItem value="homework">واجبات</SelectItem>
                <SelectItem value="exams">امتحانات</SelectItem>
                <SelectItem value="projects">مشاريع</SelectItem>
                <SelectItem value="certificates">شهادات</SelectItem>
                <SelectItem value="reports">تقارير</SelectItem>
                <SelectItem value="others">أخرى</SelectItem>
              </SelectContent>
            </Select>

            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              {isDragActive ? (
                <p className="text-lg text-primary">اسحب الملفات هنا...</p>
              ) : (
                <div>
                  <p className="text-lg mb-2">اسحب الملفات هنا أو انقر للاختيار</p>
                  <p className="text-sm text-muted-foreground">
                    يدعم: PDF, Word, الصور, النصوص
                  </p>
                </div>
              )}
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">الملفات المحددة:</h4>
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <File className="w-4 h-4" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            {uploadedFiles.length > 0 && (
              <Button
                onClick={handleUpload}
                disabled={uploadMutation.isPending}
                className="w-full"
              >
                {uploadMutation.isPending ? "جاري الرفع..." : "رفع الملفات"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}