import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Users, FileText, BookOpen, UserCheck } from "lucide-react";

interface StatsOverviewProps {
  teacherId: number;
}

export default function StatsOverview({ teacherId }: StatsOverviewProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/teacher/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      title: "إجمالي الطلاب",
      value: stats.totalStudents,
      icon: Users,
      color: "blue",
      bgColor: "bg-blue-100",
      textColor: "text-blue-600",
    },
    {
      title: "إجمالي الملفات",
      value: stats.totalFiles,
      icon: FileText,
      color: "green",
      bgColor: "bg-green-100",
      textColor: "text-green-600",
    },
    {
      title: "المواد المُدرسة",
      value: stats.subjects.length,
      icon: BookOpen,
      color: "purple",
      bgColor: "bg-purple-100",
      textColor: "text-purple-600",
    },
    {
      title: "أولياء الأمور النشطين",
      value: stats.activeParents,
      icon: UserCheck,
      color: "orange",
      bgColor: "bg-orange-100",
      textColor: "text-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${stat.bgColor} ml-4`}>
                <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
