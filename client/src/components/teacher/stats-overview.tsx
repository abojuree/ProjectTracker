import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

interface StatsOverviewProps {
  teacherId: number;
}

interface TeacherStats {
  totalStudents: number;
  totalFiles: number;
  subjects: string[];
  activeParents: number;
}

export default function StatsOverview({ teacherId }: StatsOverviewProps) {
  const { data: stats, isLoading } = useQuery<TeacherStats>({
    queryKey: [`/api/teacher/${teacherId}/stats`],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="card-shadow">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Show welcome message for new teachers
  if (stats?.totalStudents === 0) {
    return (
      <div className="grid gap-4 md:grid-cols-1">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <i className="fas fa-users text-5xl text-blue-500 mb-4"></i>
              <h3 className="text-lg font-semibold mb-2">مرحباً بك في نظام إدارة ملفات الطلاب</h3>
              <p className="text-muted-foreground mb-4">ابدأ بإضافة بيانات الطلاب لرؤية الإحصائيات هنا</p>
              <div className="flex gap-2 justify-center text-sm text-muted-foreground">
                <span>• رفع ملف Excel</span>
                <span>• إضافة طلاب يدوياً</span>
                <span>• تنظيم الملفات</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      title: "إجمالي الطلاب",
      value: stats?.totalStudents || 0,
      icon: "fas fa-user-graduate",
      color: "blue",
      bgColor: "bg-blue-100",
      textColor: "text-blue-600"
    },
    {
      title: "إجمالي الملفات", 
      value: stats?.totalFiles || 0,
      icon: "fas fa-file",
      color: "green",
      bgColor: "bg-green-100",
      textColor: "text-green-600"
    },
    {
      title: "المواد المُدرسة",
      value: stats?.subjects?.length || 0,
      icon: "fas fa-book",
      color: "purple",
      bgColor: "bg-purple-100", 
      textColor: "text-purple-600"
    },
    {
      title: "أولياء الأمور النشطين",
      value: `${stats?.activeParents || 0}/${stats?.totalStudents || 0}`,
      icon: "fas fa-users",
      color: "orange",
      bgColor: "bg-orange-100",
      textColor: "text-orange-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="card-shadow hover-scale cursor-default">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${stat.bgColor} ml-4`}>
                <i className={`${stat.icon} ${stat.textColor} text-xl`}></i>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">{stat.title}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
