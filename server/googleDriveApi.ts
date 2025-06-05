import { google } from 'googleapis';
import type { Teacher, Student } from '@shared/schema';

/**
 * Real Google Drive API integration for creating student folders using teacher's personal Google account
 */

export class GoogleDriveAPI {
  private getAuthClient(accessToken: string) {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_DRIVE_CLIENT_ID,
      process.env.GOOGLE_DRIVE_CLIENT_SECRET,
      `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/api/google-callback`
    );

    auth.setCredentials({ access_token: accessToken });
    return auth;
  }

  private getDriveClient(accessToken: string) {
    const auth = this.getAuthClient(accessToken);
    return google.drive({ version: 'v3', auth });
  }

  /**
   * Create a folder in Google Drive using teacher's access token
   */
  async createFolder(name: string, parentFolderId: string, accessToken: string): Promise<string | null> {
    try {
      const drive = this.getDriveClient(accessToken);
      
      const folderMetadata = {
        name: name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId]
      };

      const response = await drive.files.create({
        requestBody: folderMetadata,
        fields: 'id'
      });

      return response.data?.id || null;
    } catch (error) {
      console.error('Error creating folder:', error);
      return null;
    }
  }

  /**
   * Check if a folder with the given name exists in parent folder
   */
  async folderExists(name: string, parentFolderId: string, accessToken: string): Promise<string | null> {
    try {
      const drive = this.getDriveClient(accessToken);
      
      const response = await drive.files.list({
        q: `name='${name}' and parents in '${parentFolderId}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)'
      });

      if (response.data.files && response.data.files.length > 0) {
        return response.data.files[0].id;
      }
      return null;
    } catch (error) {
      console.error('Error checking folder existence:', error);
      return null;
    }
  }

  /**
   * Create organized folder structure for a student using teacher's Google account
   */
  async createStudentFolderStructure(
    student: Student, 
    teacher: Teacher,
    accessToken: string
  ): Promise<{ success: boolean; folderId?: string; error?: string }> {
    try {
      if (!teacher.driveFolderId) {
        return { success: false, error: 'معرف مجلد Google Drive غير موجود' };
      }

      if (!accessToken) {
        return { success: false, error: 'مطلوب تسجيل الدخول إلى Google Drive' };
      }

      const studentFolderName = `${student.studentName} - ${student.civilId}`;
      
      // Check if student folder already exists
      let studentFolderId = await this.folderExists(studentFolderName, teacher.driveFolderId, accessToken);
      
      if (!studentFolderId) {
        // Create main student folder
        studentFolderId = await this.createFolder(studentFolderName, teacher.driveFolderId, accessToken);
        
        if (!studentFolderId) {
          return { success: false, error: 'فشل في إنشاء المجلد الرئيسي للطالب' };
        }

        // Create subject subfolders
        const subjects = ['الرياضيات', 'العلوم', 'اللغة العربية', 'اللغة الإنجليزية', 'التربية الإسلامية', 'الاجتماعيات'];
        
        for (const subject of subjects) {
          await this.createFolder(subject, studentFolderId, accessToken);
        }
      }

      return { success: true, folderId: studentFolderId };
    } catch (error) {
      console.error('Error creating student folder structure:', error);
      return { success: false, error: 'خطأ في الاتصال بـ Google Drive' };
    }
  }

  /**
   * Generate OAuth URL for teacher to connect their Google Drive
   */
  generateAuthUrl(): string {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_DRIVE_CLIENT_ID,
      process.env.GOOGLE_DRIVE_CLIENT_SECRET,
      `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/api/google-callback`
    );

    return auth.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/drive.file'],
      prompt: 'consent'
    });
  }

  /**
   * Exchange authorization code for access token
   */
  async getAccessToken(code: string): Promise<{ access_token?: string; refresh_token?: string; error?: string }> {
    try {
      const auth = new google.auth.OAuth2(
        process.env.GOOGLE_DRIVE_CLIENT_ID,
        process.env.GOOGLE_DRIVE_CLIENT_SECRET,
        `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/api/google-callback`
      );

      const { tokens } = await auth.getToken(code);
      return {
        access_token: tokens.access_token || undefined,
        refresh_token: tokens.refresh_token || undefined
      };
    } catch (error) {
      console.error('Error getting access token:', error);
      return { error: 'فشل في الحصول على رمز الوصول' };
    }
  }
}

export const googleDriveAPI = new GoogleDriveAPI();