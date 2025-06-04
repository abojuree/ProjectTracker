import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface StudentFilesProps {
  studentData: {
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
  };
}

export default function StudentFiles({ studentData }: StudentFilesProps) {
  const [openSubjects, setOpenSubjects] = useState<Record<string, boolean>>({});
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  const { student, teacher, files } = studentData;

  const toggleSubject = (subject: string) => {
    setOpenSubjects(prev => ({ ...prev, [subject]: !prev[subject] }));
  };

  const toggleCategory = (key: string) => {
    setOpenCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      "اختبارات": "fas fa-file-alt",
      "درجات": "fas fa-chart-line", 
      "واجبات": "fas fa-book-open",
      "ملاحظات": "fas fa-sticky-note",
      "إنذارات": "fas fa-exclamation-triangle",
      "مشاركات": "fas fa-users",
      "شهادات": "fas fa-certificate",
      "حضور وغياب": "fas fa-calendar-check",
      "سلوك": "fas fa-user-check",
      "أخرى": "fas fa-folder"
    };
    return icons[category] || "fas fa-file";
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "اختبارات": "blue",
      "درجات": "green",
      "واجبات": "yellow", 
      "ملاحظات": "purple",
      "إنذارات": "red",
      "مشاركات": "indigo",
      "شهادات": "emerald",
      "حضور وغياب": "orange",
      "سلوك": "pink",
      "أخرى": "gray"
    };
    return colors[category] || "gray";
  };

  const getSubjectIcon = (subject: string) => {
    const icons: Record<string, string> = {
      "الرياضيات": "fas fa-calculator",
      "اللغة العربية": "fas fa-book",
      "العلوم": "fas fa-flask",
      "الإنجليزية": "fas fa-language",
      "التاريخ": "fas fa-landmark",
      "الجغرافيا": "fas fa-globe"
    };
    return icons[subject] || "fas fa-book";
  };

  const handleFileView = (file: any) => {
    // In a real implementation, this would open the file from Google Drive
    window.open(file.fileUrl, '_blank');
  };

  const handleFileDownload = (file: any) => {
    // In a real implementation, this would download the file from Google Drive
    const link = document.createElement('a');
    link.href = file.fileUrl;
    link.download = file.originalName;
    link.click();
  };

  return (
    <div className="space-y-6 slide-up">
      {/* Student Info Card */}
      <Card className="card-shadow">
        <CardContent className="pt-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center ml-3">
              <span className="font-bold text-lg">
                {student.name.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{student.name}</h2>
              <p className="text-muted-foreground">
                <i className="fas fa-id-card ml-1"></i>
                الهوية: {student.civilId}
              </p>
              <p className="text-muted-foreground">
                <i className="fas fa-graduation-cap ml-1"></i>
                {student.grade} - فصل {student.classNumber}
              </p>
              <p className="text-muted-foreground">
                <i className="fas fa-user-tie ml-1"></i>
                الأستاذ: {teacher.name}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Files by Subject */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-folder-open ml-2"></i>
            ملفات الطالب
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(files).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <i className="fas fa-folder-open text-4xl mb-4"></i>
              <p className="text-lg font-medium">لا توجد ملفات متاحة حالياً</p>
              <p className="text-sm">سيتم إضافة الملفات من قبل المعلم</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(files).map(([subject, categories]) => {
                const totalFiles = Object.values(categories).reduce((sum, fileList) => sum + fileList.length, 0);
                
                return (
                  <Collapsible 
                    key={subject}
                    open={openSubjects[subject]}
                    onOpenChange={() => toggleSubject(subject)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between p-4 h-auto bg-muted/50 hover:bg-muted"
                      >
                        <div className="flex items-center">
                          <i className={`${getSubjectIcon(subject)} text-primary text-lg ml-3`}></i>
                          <span className="font-medium text-lg">{subject}</span>
                        </div>
                        <div className="flex items-center space-x-reverse space-x-2">
                          <Badge variant="secondary">
                            {totalFiles} ملف
                          </Badge>
                          <i className={`fas fa-chevron-${openSubjects[subject] ? 'up' : 'down'} text-muted-foreground`}></i>
                        </div>
                      </Button>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="mt-2">
                      <div className="space-y-2 pr-4">
                        {Object.entries(categories).map(([category, fileList]) => {
                          const categoryKey = `${subject}-${category}`;
                          
                          return (
                            <Collapsible
                              key={categoryKey}
                              open={openCategories[categoryKey]}
                              onOpenChange={() => toggleCategory(categoryKey)}
                            >
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="w-full justify-between p-3 h-auto bg-background border"
                                >
                                  <div className="flex items-center">
                                    <i className={`${getCategoryIcon(category)} text-${getCategoryColor(category)}-600 ml-2`}></i>
                                    <span className="font-medium">{category}</span>
                                  </div>
                                  <div className="flex items-center space-x-reverse space-x-2">
                                    <Badge variant="outline" className={`border-${getCategoryColor(category)}-200`}>
                                      {fileList.length} ملف
                                    </Badge>
                                    <i className={`fas fa-chevron-${openCategories[categoryKey] ? 'up' : 'down'} text-muted-foreground text-sm`}></i>
                                  </div>
                                </Button>
                              </CollapsibleTrigger>
                              
                              <CollapsibleContent className="mt-2">
                                <div className="space-y-2 pr-4">
                                  {fileList.map((file, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border"
                                    >
                                      <div className="flex items-center flex-1 min-w-0">
                                        <i className={`fas fa-${file.fileType === 'pdf' ? 'file-pdf' : file.fileType?.includes('image') ? 'image' : 'file'} text-muted-foreground ml-2`}></i>
                                        <div className="min-w-0 flex-1">
                                          <p className="font-medium text-sm truncate">
                                            {file.originalName}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {new Date(file.uploadDate).toLocaleDateString('ar-SA')}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-reverse space-x-1">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleFileView(file)}
                                        >
                                          <i className="fas fa-eye"></i>
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleFileDownload(file)}
                                        >
                                          <i className="fas fa-download"></i>
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
