import { useParams } from "wouter";
import { useState } from "react";
import StatsOverview from "@/components/teacher/stats-overview";
import StudentManagement from "@/components/teacher/student-management";
import FileManagement from "@/components/teacher/file-management";
import ParentLinkGenerator from "@/components/teacher/parent-link-generator";
import Sidebar from "@/components/teacher/sidebar";
import { useTeacher } from "@/hooks/use-teacher";
import { useTeacherAuth } from "@/hooks/useTeacherAuth";

export default function TeacherDashboard() {
  const { teacherId } = useParams();
  const { currentSession } = useTeacherAuth();
  const currentTeacherId = currentSession?.teacherId || parseInt(teacherId || "1");
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'files' | 'parent-links'>('overview');
  
  const { data: teacher, isLoading: teacherLoading } = useTeacher(currentTeacherId);

  if (teacherLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Navigation Header */}
      <nav className="gradient-bg text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <i className="fas fa-folder-open text-2xl ml-3"></i>
                <span className="text-xl font-bold">نظام إدارة ملفات الطلاب</span>
              </div>
            </div>
            <div className="flex items-center space-x-reverse space-x-4">
              <div className="text-sm">
                مرحباً، {teacher?.name || "المعلم"}
              </div>
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <i className="fas fa-user text-sm"></i>
              </div>
              <button className="text-white hover:text-gray-200 transition-colors">
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-6">لوحة التحكم الرئيسية</h1>
          <StatsOverview teacherId={currentTeacherId} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <StudentManagement 
              teacherId={currentTeacherId}
              onStudentSelect={setSelectedStudent}
            />
            <FileManagement 
              teacherId={currentTeacherId}
              selectedStudent={selectedStudent}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Sidebar 
              teacherId={currentTeacherId}
              teacher={teacher}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
