import { useParams } from "wouter";
import { useState } from "react";
import VerificationForm from "@/components/parent/verification-form";
import StudentFiles from "@/components/parent/student-files";
import { Card, CardContent } from "@/components/ui/card";

interface StudentData {
  student: {
    name: string;
    civilId: string;
    grade: string;
    classNumber: number;
  };
  teacher: {
    name: string;
  };
  files: Record<string, Record<string, any[]>>;
}

export default function ParentAccess() {
  const { linkCode } = useParams();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  const handleVerificationSuccess = (data: StudentData) => {
    setStudentData(data);
    setIsVerified(true);
  };

  if (!linkCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <i className="fas fa-exclamation-triangle text-4xl text-destructive mb-4"></i>
            <h1 className="text-xl font-bold text-foreground mb-2">رابط غير صحيح</h1>
            <p className="text-muted-foreground">الرجاء التأكد من الرابط والمحاولة مرة أخرى</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="gradient-bg text-white py-8">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <i className="fas fa-user-graduate text-4xl mb-4"></i>
          <h1 className="text-2xl font-bold mb-2">ملفات الطالب</h1>
          {studentData && (
            <p className="text-lg opacity-90">الأستاذ {studentData.teacher.name}</p>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-4">
        {!isVerified ? (
          <VerificationForm 
            linkCode={linkCode}
            onVerificationSuccess={handleVerificationSuccess}
          />
        ) : (
          <StudentFiles studentData={studentData!} />
        )}
      </div>
    </div>
  );
}
