import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FolderOpen, Users, Shield, BookOpen, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    teacherName: '',
    schoolName: '',
    googleEmail: '',
    driveFolder: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleRegister = async () => {
    if (!formData.teacherName || !formData.schoolName || !formData.googleEmail) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Store form data in session storage for use after Google auth
      sessionStorage.setItem('teacherRegistrationData', JSON.stringify(formData));
      
      // Redirect to Google OAuth
      window.location.href = '/api/auth/google';
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء التسجيل",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  if (!isRegistering) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <FolderOpen className="h-8 w-8 text-primary ml-3" />
                <span className="text-xl font-bold text-gray-900">نظام إدارة ملفات الطلاب</span>
              </div>
              <div className="flex items-center">
                <Button 
                  onClick={() => setLocation('/simple-registration')}
                  className="bg-primary hover:bg-primary/90"
                >
                  تسجيل حساب جديد
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-8">
              مرحباً بك في نظام إدارة ملفات الطلاب
              <span className="block text-primary mt-2">المتكامل مع Google Drive</span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              منصة شاملة للمعلمين لإدارة ملفات الطلاب رقمياً مع تكامل كامل مع Google Drive 
              وواجهة آمنة لأولياء الأمور للوصول لملفات أطفالهم
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-12 max-w-2xl mx-auto">
              <div className="flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-yellow-600 ml-2" />
                <span className="font-semibold text-yellow-800">متطلب أساسي</span>
              </div>
              <p className="text-yellow-700 text-lg">
                هذا التطبيق يتطلب حساب Google Drive نشط للعمل بشكل صحيح.
                <br />
                جميع ملفات الطلاب سيتم تخزينها في Google Drive الخاص بك.
              </p>
            </div>
            
            <div className="flex justify-center mb-16">
              <Button 
                size="lg" 
                onClick={() => setLocation('/simple-registration')}
                className="bg-primary hover:bg-primary/90 text-lg px-8 py-4"
              >
                ابدأ التسجيل الآن
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FolderOpen className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">تكامل Google Drive</h3>
                <p className="text-gray-600 leading-relaxed">
                  ربط مباشر مع Google Drive الخاص بك مع إنشاء تلقائي للمجلدات المنظمة 
                  حسب الطلاب والمواد والتصنيفات
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">واجهة أولياء الأمور</h3>
                <p className="text-gray-600 leading-relaxed">
                  وصول آمن لأولياء الأمور لملفات أطفالهم مع نظام تحقق بسيط 
                  ومتابعة شاملة للتقدم الأكاديمي
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">أمان وخصوصية</h3>
                <p className="text-gray-600 leading-relaxed">
                  حماية كاملة للبيانات مع تشفير متقدم وصلاحيات محددة 
                  لضمان وصول كل ولي أمر لملفات طفله فقط
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Registration form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <FolderOpen className="h-8 w-8 text-primary ml-3" />
              <span className="text-xl font-bold text-gray-900">نظام إدارة ملفات الطلاب</span>
            </div>
            <div className="flex items-center">
              <Button 
                onClick={() => setIsRegistering(false)}
                variant="outline"
                className="ml-4"
              >
                <ArrowLeft className="h-4 w-4 ml-2" />
                العودة
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Registration Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900 mb-4">
              تسجيل حساب معلم جديد
            </CardTitle>
            <p className="text-gray-600 text-lg">
              يرجى ملء البيانات التالية لإنشاء حسابك وربطه مع Google Drive
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Welcome Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <CheckCircle className="h-6 w-6 text-blue-600 ml-2" />
                <span className="font-semibold text-blue-800">مرحباً بك في النظام</span>
              </div>
              <p className="text-blue-700">
                سيتم ربط حسابك مع Google Drive لتخزين ملفات الطلاب بشكل آمن ومنظم.
                يمكنك الوصول لحسابك من أي جهاز باستخدام حساب Google الخاص بك.
              </p>
            </div>

            {/* Teacher Name */}
            <div className="space-y-2">
              <Label htmlFor="teacherName" className="text-lg font-medium">
                اسم المعلم <span className="text-red-500">*</span>
              </Label>
              <Input
                id="teacherName"
                type="text"
                placeholder="أدخل اسمك الكامل"
                value={formData.teacherName}
                onChange={(e) => setFormData(prev => ({ ...prev, teacherName: e.target.value }))}
                className="text-lg py-3"
                dir="rtl"
              />
            </div>

            {/* School Name */}
            <div className="space-y-2">
              <Label htmlFor="schoolName" className="text-lg font-medium">
                اسم المدرسة <span className="text-red-500">*</span>
              </Label>
              <Input
                id="schoolName"
                type="text"
                placeholder="أدخل اسم المدرسة"
                value={formData.schoolName}
                onChange={(e) => setFormData(prev => ({ ...prev, schoolName: e.target.value }))}
                className="text-lg py-3"
                dir="rtl"
              />
            </div>

            {/* Google Email */}
            <div className="space-y-2">
              <Label htmlFor="googleEmail" className="text-lg font-medium">
                عنوان البريد الإلكتروني لـ Google Drive <span className="text-red-500">*</span>
              </Label>
              <Input
                id="googleEmail"
                type="email"
                placeholder="example@gmail.com"
                value={formData.googleEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, googleEmail: e.target.value }))}
                className="text-lg py-3"
                dir="ltr"
              />
              <p className="text-sm text-gray-500">
                يجب أن يكون نفس البريد الإلكتروني لحساب Google Drive الذي ستستخدمه
              </p>
            </div>

            {/* Drive Folder Link */}
            <div className="space-y-2">
              <Label htmlFor="driveFolder" className="text-lg font-medium">
                رابط مجلد Google Drive المشترك (اختياري)
              </Label>
              <Textarea
                id="driveFolder"
                placeholder="https://drive.google.com/drive/folders/..."
                value={formData.driveFolder}
                onChange={(e) => setFormData(prev => ({ ...prev, driveFolder: e.target.value }))}
                className="text-lg py-3"
                dir="ltr"
                rows={3}
              />
              <div className="bg-gray-50 border rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>إرشادات إنشاء المجلد:</strong>
                </p>
                <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                  <li>اذهب إلى Google Drive الخاص بك</li>
                  <li>أنشئ مجلد جديد باسم ملفات الطلاب أو أي اسم تفضله</li>
                  <li>انقر بزر الماوس الأيمن على المجلد واختر مشاركة</li>
                  <li>انسخ الرابط والصقه هنا</li>
                  <li>إذا تركت هذا الحقل فارغاً سنقوم بإنشاء مجلد تلقائياً</li>
                </ol>
              </div>
            </div>

            {/* Google Drive Integration Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <Shield className="h-6 w-6 text-green-600 ml-2" />
                <span className="font-semibold text-green-800">التكامل مع Google Drive</span>
              </div>
              <ul className="text-green-700 space-y-2 text-sm">
                <li>• سيتم إنشاء مجلدات منظمة تلقائياً لكل طالب</li>
                <li>• جميع الملفات ستكون آمنة في حساب Google Drive الخاص بك</li>
                <li>• يمكنك الوصول للملفات من أي جهاز</li>
                <li>• نسخ احتياطي تلقائي من Google</li>
                <li>• مشاركة آمنة مع أولياء الأمور</li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleRegister}
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-lg py-4"
              size="lg"
            >
              {isLoading ? "جاري التسجيل..." : "متابعة والربط مع Google Drive"}
            </Button>

            <p className="text-center text-sm text-gray-500">
              بالمتابعة، فإنك توافق على السماح للتطبيق بالوصول إلى Google Drive الخاص بك
              لإنشاء وإدارة ملفات الطلاب
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}