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

  private async initializeAuth() {
    try {
      console.log('Initializing Google Drive Service...');
      
      // Try to use Service Account if available
      if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        console.log('Found GOOGLE_SERVICE_ACCOUNT_KEY environment variable');
        
        const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        console.log('Parsed Service Account JSON, client_email:', serviceAccountKey.client_email);
        
        this.auth = new google.auth.GoogleAuth({
          credentials: serviceAccountKey,
          scopes: [
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/drive.file'
          ]
        });
        
        // Get authenticated client
        const authClient = await this.auth.getClient();
        this.drive = google.drive({ version: 'v3', auth: authClient });
        console.log('✅ Google Drive Service initialized successfully with Service Account');
      } else {
        console.log('❌ GOOGLE_SERVICE_ACCOUNT_KEY not found - Service Account not available');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Google Drive Service:', error);
      this.auth = null;
      this.drive = null;
    }
  }

  /**
   * Create a folder using Service Account in a shared location
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
      
      // Create folder in Service Account's drive first, then share with teacher
      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder'
        // Don't specify parent - create in Service Account root first
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

      // Set folder permissions to be viewable/editable by anyone with link
      await this.drive.permissions.create({
        fileId: folderId,
        requestBody: {
          role: 'writer',
          type: 'anyone'
        }
      });

      return { 
        success: true, 
        folderId,
        error: undefined
      };

    } catch (error) {
      console.error('Error creating student folder with Service Account:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Service Account access error'
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