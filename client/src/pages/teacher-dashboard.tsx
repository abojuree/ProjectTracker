import { useParams } from "wouter";
import { useState } from "react";
import StatsOverview from "@/components/teacher/stats-overview";
import StudentManagement from "@/components/teacher/student-management";
import FileManagement from "@/components/teacher/file-management";
import ParentLinkGenerator from "@/components/teacher/parent-link-generator";
import { useTeacher } from "@/hooks/use-teacher";
import { useTeacherAuth } from "@/hooks/useTeacherAuth";

export default function TeacherDashboard() {
  const { teacherId } = useParams();
  const { currentSession, logout } = useTeacherAuth();
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
      <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-xl font-bold text-gray-900">نظام إدارة ملفات الطلاب</span>
              </div>
            </div>
            <div className="flex items-center space-x-reverse space-x-4">
              <div className="text-sm text-gray-700">
                مرحباً، {currentSession?.name || teacher?.name || "المعلم"}
              </div>
              <button 
                onClick={logout}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 space-x-reverse">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              نظرة عامة
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'students'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              إدارة الطلاب
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'files'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              إدارة الملفات
            </button>
            <button
              onClick={() => setActiveTab('parent-links')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'parent-links'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              روابط أولياء الأمور
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <StatsOverview teacherId={currentTeacherId} />
          </div>
        )}

        {activeTab === 'students' && (
          <div className="space-y-6">
            <StudentManagement 
              teacherId={currentTeacherId} 
              onStudentSelect={setSelectedStudent}
            />
          </div>
        )}

        {activeTab === 'files' && (
          <div className="space-y-6">
            <FileManagement 
              teacherId={currentTeacherId}
              selectedStudent={selectedStudent}
            />
          </div>
        )}

        {activeTab === 'parent-links' && teacher && (
          <div className="space-y-6">
            <ParentLinkGenerator teacher={teacher} />
          </div>
        )}
      </div>
    </div>
  );
}