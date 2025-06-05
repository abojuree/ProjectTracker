import { google } from 'googleapis';
import type { Teacher, Student } from '@shared/schema';

/**
 * Google Drive Service for creating student folders using Service Account
 */
export class GoogleDriveService {
  private auth: any;
  private drive: any;

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth() {
    try {
      // Try to use Service Account if available
      if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        this.auth = new google.auth.GoogleAuth({
          credentials: serviceAccountKey,
          scopes: [
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/drive.file'
          ]
        });
        this.drive = google.drive({ version: 'v3', auth: this.auth });
        console.log('Google Drive Service initialized with Service Account');
      } else {
        console.log('Service Account not available - using OAuth flow instead');
      }
    } catch (error) {
      console.error('Failed to initialize Google Drive Service:', error);
    }
  }

  /**
   * Create a folder in the teacher's shared Google Drive folder
   */
  async createStudentFolder(
    teacher: Teacher, 
    student: Student
  ): Promise<{ success: boolean; folderId?: string; error?: string }> {
    try {
      if (!this.auth || !this.drive) {
        return { success: false, error: 'Google Drive Service not initialized' };
      }

      const folderName = `${student.studentName} - ${student.civilId}`;
      
      // Create the main student folder
      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: teacher.driveFolderId ? [teacher.driveFolderId] : undefined
      };

      const folderResponse = await this.drive.files.create({
        requestBody: folderMetadata,
        fields: 'id,name,webViewLink'
      });

      const folderId = folderResponse.data.id;

      // Create subject subfolders
      const subjects = [
        'الرياضيات',
        'العلوم', 
        'اللغة العربية',
        'اللغة الإنجليزية',
        'التربية الإسلامية',
        'الاجتماعيات'
      ];

      for (const subject of subjects) {
        await this.drive.files.create({
          requestBody: {
            name: subject,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [folderId]
          }
        });
      }

      // Set folder permissions to be viewable by anyone with link
      await this.drive.permissions.create({
        fileId: folderId,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });

      return { 
        success: true, 
        folderId,
        error: undefined
      };

    } catch (error) {
      console.error('Error creating student folder:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if Service Account is properly configured
   */
  isConfigured(): boolean {
    return !!(this.auth && this.drive);
  }

  /**
   * Create folders for multiple students in batch
   */
  async createStudentFoldersBatch(
    teacher: Teacher,
    students: Student[]
  ): Promise<{
    success: boolean;
    created: number;
    failed: number;
    total: number;
    errors: string[];
  }> {
    const results = {
      success: true,
      created: 0,
      failed: 0,
      total: students.length,
      errors: [] as string[]
    };

    for (const student of students) {
      try {
        const result = await this.createStudentFolder(teacher, student);
        if (result.success) {
          results.created++;
        } else {
          results.failed++;
          results.errors.push(`${student.studentName}: ${result.error}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`${student.studentName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    results.success = results.failed === 0;
    return results;
  }
}

export const googleDriveService = new GoogleDriveService();