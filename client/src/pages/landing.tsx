import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderOpen, Users, Shield, BookOpen } from "lucide-react";

export default function Landing() {
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
                onClick={() => window.location.href = '/api/auth/google'}
                className="bg-primary hover:bg-primary/90"
              >
                تسجيل الدخول بـ Google
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-8">
            نظام إدارة ملفات الطلاب
            <span className="block text-primary mt-2">الشامل والآمن</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            منصة متكاملة تمكن المعلمين من إدارة ملفات الطلاب رقمياً مع تكامل كامل مع Google Drive 
            وواجهة آمنة لأولياء الأمور للوصول لملفات أطفالهم
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/api/auth/google'}
              className="bg-primary hover:bg-primary/90 text-lg px-8 py-4"
            >
              ابدأ الآن - مجاناً
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-4"
            >
              شاهد العرض التوضيحي
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

        {/* How it Works */}
        <div className="mt-32">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">كيف يعمل النظام؟</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="flex items-start">
                <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 ml-4">
                  <span className="font-bold">1</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">تسجيل الدخول بـ Google</h3>
                  <p className="text-gray-600">
                    دخول آمن باستخدام حساب Google الخاص بك مع ربط تلقائي بـ Google Drive
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 ml-4">
                  <span className="font-bold">2</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">إضافة بيانات الطلاب</h3>
                  <p className="text-gray-600">
                    رفع ملف Excel أو ربط Google Sheets أو إدخال البيانات يدوياً
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 ml-4">
                  <span className="font-bold">3</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">رفع وتصنيف الملفات</h3>
                  <p className="text-gray-600">
                    تنظيم تلقائي للملفات حسب الطالب والمادة والتصنيف مع أسماء ذكية
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 ml-4">
                  <span className="font-bold">4</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">مشاركة الرابط</h3>
                  <p className="text-gray-600">
                    رابط مخصص لكل معلم لوصول أولياء الأمور الآمن لملفات أطفالهم
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <BookOpen className="h-16 w-16 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900">واجهة سهلة ومتقدمة</h3>
                <p className="text-gray-600 mt-2">
                  تصميم عربي أصيل مع دعم كامل للغة العربية وتخطيط RTL
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">رفع ملفات متعددة</span>
                  <span className="text-green-600">✓</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">تصنيف ذكي للملفات</span>
                  <span className="text-green-600">✓</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">إحصائيات شاملة</span>
                  <span className="text-green-600">✓</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">نسخ احتياطي تلقائي</span>
                  <span className="text-green-600">✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-32 text-center bg-white rounded-2xl shadow-xl p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ابدأ في تنظيم ملفات طلابك اليوم
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            انضم إلى آلاف المعلمين الذين يستخدمون نظامنا لإدارة ملفات طلابهم بكفاءة وأمان
          </p>
          <Button 
            size="lg" 
            onClick={() => window.location.href = '/api/auth/google'}
            className="bg-primary hover:bg-primary/90 text-lg px-12 py-4"
          >
            ابدأ مجاناً الآن
          </Button>
        </div>
      </div>
    </div>
  );
}
