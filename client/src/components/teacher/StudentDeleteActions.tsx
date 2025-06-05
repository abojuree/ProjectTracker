import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Trash2, UserX } from "lucide-react";
import type { Student } from "@shared/schema";

interface StudentDeleteActionsProps {
  students: Student[];
  teacherId: number;
}

export default function StudentDeleteActions({ students, teacherId }: StudentDeleteActionsProps) {
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteType, setDeleteType] = useState<'selected' | 'all' | 'single'>('selected');
  const [studentToDelete, setStudentToDelete] = useState<number | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteStudentsMutation = useMutation({
    mutationFn: async ({ type, studentIds }: { type: 'selected' | 'all' | 'single', studentIds?: number[] }) => {
      if (type === 'all') {
        const response = await apiRequest('DELETE', `/api/teacher/${teacherId}/students/all`);
        return response.json();
      } else if (type === 'single' && studentToDelete) {
        const response = await apiRequest('DELETE', `/api/teacher/${teacherId}/students/${studentToDelete}`);
        return response.json();
      } else if (type === 'selected' && studentIds && studentIds.length > 0) {
        const response = await apiRequest('DELETE', `/api/teacher/${teacherId}/students`, { studentIds });
        return response.json();
      }
      throw new Error('Invalid delete operation');
    },
    onSuccess: (data) => {
      toast({
        title: "تم الحذف بنجاح",
        description: data.message || "تم حذف الطلاب المحددين",
      });
      setSelectedStudents([]);
      setShowDeleteDialog(false);
      setStudentToDelete(null);
      queryClient.invalidateQueries({ queryKey: [`/api/teacher/${teacherId}/students`] });
      queryClient.invalidateQueries({ queryKey: [`/api/teacher/${teacherId}/stats`] });
    },
    onError: (error) => {
      console.error("Error deleting students:", error);
      toast({
        title: "خطأ في الحذف",
        description: "فشل في حذف الطلاب. حاول مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  const handleSelectStudent = (studentId: number, checked: boolean) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, studentId]);
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(students.map(s => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedStudents.length === 0) {
      toast({
        title: "لا توجد طلاب محددين",
        description: "يرجى تحديد الطلاب المراد حذفهم",
        variant: "destructive",
      });
      return;
    }
    setDeleteType('selected');
    setShowDeleteDialog(true);
  };

  const handleDeleteAll = () => {
    setDeleteType('all');
    setShowDeleteDialog(true);
  };

  const handleDeleteSingle = (studentId: number) => {
    setStudentToDelete(studentId);
    setDeleteType('single');
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    deleteStudentsMutation.mutate({ 
      type: deleteType, 
      studentIds: deleteType === 'selected' ? selectedStudents : undefined 
    });
  };

  const getDeleteMessage = () => {
    switch (deleteType) {
      case 'all':
        return `هل أنت متأكد من حذف جميع الطلاب (${students.length} طالب)؟ هذا الإجراء لا يمكن التراجع عنه.`;
      case 'selected':
        return `هل أنت متأكد من حذف الطلاب المحددين (${selectedStudents.length} طالب)؟ هذا الإجراء لا يمكن التراجع عنه.`;
      case 'single':
        const student = students.find(s => s.id === studentToDelete);
        return `هل أنت متأكد من حذف الطالب "${student?.studentName}"؟ هذا الإجراء لا يمكن التراجع عنه.`;
      default:
        return '';
    }
  };

  if (students.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Selection Controls */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div className="flex items-center space-x-4 space-x-reverse">
          <Checkbox
            id="select-all"
            checked={selectedStudents.length === students.length}
            onCheckedChange={handleSelectAll}
          />
          <label htmlFor="select-all" className="text-sm font-medium">
            تحديد الكل ({students.length})
          </label>
          {selectedStudents.length > 0 && (
            <span className="text-sm text-muted-foreground">
              محدد: {selectedStudents.length}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteSelected}
            disabled={selectedStudents.length === 0 || deleteStudentsMutation.isPending}
          >
            <Trash2 className="h-4 w-4 ml-2" />
            حذف المحدد ({selectedStudents.length})
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={deleteStudentsMutation.isPending}
              >
                <UserX className="h-4 w-4 ml-2" />
                حذف الكل
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>تأكيد حذف جميع الطلاب</AlertDialogTitle>
                <AlertDialogDescription>
                  هل أنت متأكد من حذف جميع الطلاب ({students.length} طالب)؟ 
                  هذا الإجراء لا يمكن التراجع عنه وسيؤدي إلى حذف جميع البيانات المرتبطة بهم.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAll}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  حذف الكل
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Individual Student Checkboxes */}
      <div className="grid gap-2">
        {students.map((student) => (
          <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3 space-x-reverse">
              <Checkbox
                checked={selectedStudents.includes(student.id)}
                onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
              />
              <div>
                <p className="font-medium">{student.studentName}</p>
                <p className="text-sm text-muted-foreground">
                  {student.civilId} - {student.grade} - فصل {student.classNumber}
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteSingle(student.id)}
              disabled={deleteStudentsMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              {getDeleteMessage()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteStudentsMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteStudentsMutation.isPending ? "جاري الحذف..." : "تأكيد الحذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}