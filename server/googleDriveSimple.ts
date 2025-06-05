import type { Teacher, Student } from "@shared/schema";

/**
 * Simple Google Drive integration using folder IDs instead of OAuth
 * This works when teachers provide their Google Drive folder links directly
 */

export function extractFolderIdFromLink(driveLink: string): string | null {
  try {
    // Extract folder ID from various Google Drive URL formats
    const patterns = [
      /\/folders\/([a-zA-Z0-9-_]+)/,
      /id=([a-zA-Z0-9-_]+)/,
      /^([a-zA-Z0-9-_]+)$/
    ];
    
    for (const pattern of patterns) {
      const match = driveLink.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  } catch (error) {
    console.error('Error extracting folder ID:', error);
    return null;
  }
}

export function generateGoogleDrivePublicUrl(folderId: string): string {
  return `https://drive.google.com/drive/folders/${folderId}`;
}

export function generateFileViewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

export function generateFileDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Generate organized folder structure URLs for a student
 */
export function generateStudentFolderStructure(teacher: Teacher, student: Student) {
  const baseFolderId = teacher.driveFolderId;
  if (!baseFolderId) {
    return null;
  }

  // Create a logical folder structure that teachers can manually create
  const studentFolderName = `${student.studentName} - ${student.civilId}`;
  
  return {
    baseFolder: generateGoogleDrivePublicUrl(baseFolderId),
    studentFolderName,
    suggestedStructure: {
      'الواجبات': `${studentFolderName}/الواجبات`,
      'الاختبارات': `${studentFolderName}/الاختبارات`, 
      'المشاريع': `${studentFolderName}/المشاريع`,
      'الأنشطة': `${studentFolderName}/الأنشطة`,
      'التقييمات': `${studentFolderName}/التقييمات`,
      'أخرى': `${studentFolderName}/أخرى`
    },
    instructions: {
      ar: `قم بإنشاء مجلد "${studentFolderName}" في Google Drive الخاص بك، ثم أنشئ المجلدات الفرعية التالية بداخله`,
      folders: ['الواجبات', 'الاختبارات', 'المشاريع', 'الأنشطة', 'التقييمات', 'أخرى']
    }
  };
}

/**
 * Generate sharing instructions for teachers
 */
export function generateSharingInstructions(teacher: Teacher) {
  if (!teacher.driveFolderId) {
    return null;
  }

  return {
    steps: [
      'افتح Google Drive الخاص بك',
      'انتقل إلى مجلد الطلاب الرئيسي',
      'انقر بزر الماوس الأيمن على مجلد الطالب',
      'اختر "مشاركة"',
      'في إعدادات المشاركة، اختر "أي شخص لديه الرابط يمكنه عرض"',
      'انسخ الرابط واستخدمه لمشاركة الملفات مع أولياء الأمور'
    ],
    securityNote: 'تأكد من اختيار "عرض فقط" وليس "تحرير" للحفاظ على أمان الملفات'
  };
}

/**
 * Create QR code URL for folder sharing
 */
export function generateQRCodeUrl(folderId: string): string {
  const folderUrl = generateGoogleDrivePublicUrl(folderId);
  // Using a free QR code service
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(folderUrl)}`;
}

export const GoogleDriveSimple = {
  extractFolderIdFromLink,
  generateGoogleDrivePublicUrl,
  generateFileViewUrl,
  generateFileDownloadUrl,
  generateStudentFolderStructure,
  generateSharingInstructions,
  generateQRCodeUrl
};