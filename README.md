# نظام إدارة ملفات الطلاب مع Google Drive

نظام شامل لإدارة ملفات الطلاب باللغة العربية مع دعم RTL وربط Google Drive التلقائي.

## المميزات

### للمعلمين
- ✅ رفع بيانات الطلاب عبر ملف Excel
- ✅ إنشاء مجلدات Google Drive تلقائياً لكل طالب
- ✅ رفع الملفات مع دعم الكاميرا
- ✅ بحث وتصفية متقدم (الاسم، الهوية، الصف، الفصل، العام الدراسي)
- ✅ عداد الملفات لكل طالب
- ✅ واجهة عربية متجاوبة مع دعم RTL

### لأولياء الأمور
- ✅ الوصول لملفات الطلاب عبر الهوية المدنية
- ✅ عرض وتحميل الملفات
- ✅ واجهة سهلة ومبسطة

## التقنيات المستخدمة

### Frontend
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Query
- Wouter (routing)
- React Hook Form + Zod

### Backend
- Node.js + Express
- PostgreSQL + Drizzle ORM
- Google Drive API
- Multer (file uploads)
- bcrypt (authentication)

## متطلبات التشغيل

- Node.js 18+
- PostgreSQL 14+
- حساب Google Cloud مع Drive API

## التثبيت والتشغيل

### 1. استنساخ المشروع
```bash
git clone https://github.com/abojuree/student-file-manager.git
cd student-file-manager
```

### 2. تثبيت التبعيات
```bash
npm install
```

### 3. إعداد قاعدة البيانات
```bash
# إنشاء قاعدة بيانات PostgreSQL
createdb student_file_manager

# تشغيل migration
npm run db:push
```

### 4. إعداد متغيرات البيئة
أنشئ ملف `.env` في المجلد الجذر:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/student_file_manager"

# Google Drive API
GOOGLE_SERVICE_ACCOUNT_KEY="your-service-account-json"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Session
SESSION_SECRET="your-random-secret-key"

# Server
PORT=5000
NODE_ENV=development
```

### 5. تشغيل التطبيق
```bash
npm run dev
```

سيكون التطبيق متاح على: http://localhost:5000

## إعداد Google Drive API

### 1. إنشاء مشروع Google Cloud
1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com)
2. أنشئ مشروع جديد
3. فعل Google Drive API

### 2. إنشاء Service Account
1. اذهب إلى "IAM & Admin" > "Service Accounts"
2. أنشئ service account جديد
3. حمل ملف JSON للمفاتيح
4. انسخ محتوى الملف إلى `GOOGLE_SERVICE_ACCOUNT_KEY`

### 3. مشاركة مجلد Google Drive
1. أنشئ مجلد في Google Drive للمشروع
2. شارك المجلد مع email الـ service account
3. امنح صلاحية "Editor"

## استخدام النظام

### للمعلمين
1. **التسجيل:** أنشئ حساب معلم جديد
2. **رفع الطلاب:** ارفع ملف Excel بأسماء الطلاب
3. **ربط Google Drive:** أضف رابط مجلد Google Drive
4. **رفع الملفات:** استخدم تبويب "رفع الملفات" أو "الكاميرا"
5. **البحث:** استخدم فلاتر البحث المتقدم

### لأولياء الأمور
1. **الدخول:** اذهب إلى صفحة "وصول أولياء الأمور"
2. **إدخال البيانات:** أدخل الهوية المدنية للطالب
3. **عرض الملفات:** تصفح وحمل ملفات الطالب

## هيكل المشروع

```
├── client/               # Frontend React
│   ├── src/
│   │   ├── components/   # مكونات React
│   │   ├── pages/       # صفحات التطبيق
│   │   ├── hooks/       # Custom hooks
│   │   └── lib/         # مكتبات مساعدة
├── server/              # Backend Express
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Database operations
│   └── googleDriveService.ts
├── shared/              # ملفات مشتركة
│   └── schema.ts        # Database schema
└── uploads/             # ملفات محلية
```

## المساهمة

مرحب بالمساهمات! يرجى:
1. Fork المشروع
2. إنشاء branch جديد للميزة
3. Commit التغييرات
4. إنشاء Pull Request

## الترخيص

هذا المشروع مرخص تحت رخصة MIT.

## الدعم

للدعم أو الاستفسارات، يرجى فتح issue في GitHub.

---

تم تطوير هذا النظام لتسهيل إدارة ملفات الطلاب في البيئة التعليمية العربية.