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
        
        // Use the hardcoded Service Account from the attached file since env parsing is problematic
        const serviceAccountKey = {
          "type": "service_account",
          "project_id": "student-file-manager-461913",
          "private_key_id": "21fd9b5946c29aafbbd480d9445c9f5fdcfc0820",
          "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC4FSfZJsoO3CvF\nc3yNr4ryuQSaUw0A3bAo5Q26nmMbnO/kaxjyYE9+PrFSmEJWQYtIzcbUmXV1T1we\nXahmHeHWBD2nOi8J1YviVD6UW7lUR8Ofv/QifyDASqDDYLC34N3Ni4oKZx+7hbtt\n5rmVoKC1B2b0WxB/7wKcPwjWZV/E0KMgVvthOC5wK0yxNgyepiCyECkjT+ohH0tR\n60CDlTMoqwDq++5EcfppPSXjdp0LPAk0VZmP9FR46pQzpPKc/nzKjoQfIUekq5ry\npPtMv03h3qvk7FrFZ9fZTAL59kd5jiKQlpRQ9WZ/+eG+eKKVF+Mi8drgjP0FZDOa\nSl16o/T1AgMBAAECggEAAmGjNifk9DmNw2iRtUf/q+CIg7XfdKmWs/7ZpUPA0B7Q\nCYwlnA9yjIZQoYhCmn54z5OJck4N6/HwleeCggTcHyADgg1vScJl/s/5t/thb/uf\nzdVu/4GZ3s5BwoNpaZxDhDAXpT+hVlgc9o7zQ8m+W23h2Zzwch3Vnc99EMePxptA\nWO6oYVK5EO2+Z8BpLfGOpGShCL6IA+MqvoM9O8ERtdrSddRkkwfR8Dgs6eNxVXzb\ntYRpPsvzGWafPTkWhP2uEnc6aqmei3ij8JDdejb8KPfeerxtKNjT/XcbfvNP0CGE\nlPd3gkcYHr+9Wz8gGtlBn4mUA7MUlyGFPbc8XJy04QKBgQD10TXjwN0w5aS3QNrK\nW2MuMAllXitUN5AoyY/VUu/oFW0D3S5sNR3LpnX7SNy58W+JyQesDvZ47L9RExMe\nlfUoAT4wyF7Am5AS+L1rPh9qALdTH/ntifjRbr72wlU1kup0GaX10p5gnB3PJH19\nUC+fFY6JjssXvtL7kkrcxOFEDQKBgQC/tUaHTNyj4OMucuYNWZ0/rhCQhXTIDTkV\nfFZhR+3DU84eZCtPZl3avGKKn1Mg03mvtN9uvyJoPTIVuMKSurCFbWUWyV2UAoPq\nyyS9Jdd1xVR8e6w15JCSqcVmUqrW2f/qh9WaHMm2/ImbzB55YPxxWo4iamHOTJcu\nWc6HKvwyiQKBgGR4J9B4qW8szQ/hQAtpIrZkB9MYlBkNxKwHBfSou0leSHpF0o2D\ngDQWSy5zb1PIbFAijDI0w2RVTzSx2SStIdBCAcsqeh+69T3r0G+eqnRG6qbc8Oe3\ndq0S2JY+g1ksPQtK2FwKw5S0+jIJtgib13rr8qAibru70Lvl5RcqmO+ZAoGAXwxU\nfI6aMlI0sPncn6/XrBP0OINChFEyBToRZcgQ1TA+2IiXhJVfYSzXup0FzReslHYb\n9T+kooP8yhJBvhf7nxu+7A5IbDLXDtlLTNBvQ//jRJjYqBu7pkuwCGxiMYYCQVi5\nieBODoClBW6tiUaRwu2/3MZb2bnVlvCF2jRwt+kCgYAO8KEzklApXO1XiRjvx96+\nrfBs1DPgD/23R2TpHJq+vzChdrAE+WEZHEmH3rJ0C4wEEe2wmnaUDzFJTAOTqOMv\nogHmzWVIEqTzgAQNyDMfoos3zAuSGTGw+gRpEycxLE986pnphO7hMzkUQDpDhe2O\nXFJEKQ431XmfyyNPQZQ7gg==\n-----END PRIVATE KEY-----\n",
          "client_email": "student-files-manager@student-file-manager-461913.iam.gserviceaccount.com",
          "client_id": "117655421474605593368",
          "auth_uri": "https://accounts.google.com/o/oauth2/auth",
          "token_uri": "https://oauth2.googleapis.com/token",
          "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
          "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/student-files-manager%40student-file-manager-461913.iam.gserviceaccount.com",
          "universe_domain": "googleapis.com"
        };
        
        console.log('Using hardcoded Service Account, client_email:', serviceAccountKey.client_email);
        
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

      const folderName = student.civilId;
      
      // Create folder inside teacher's shared Google Drive folder
      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [teacher.driveFolderId]
      };

      const folderResponse = await this.drive.files.create({
        requestBody: folderMetadata,
        fields: 'id,name,webViewLink'
      });

      const folderId = folderResponse.data.id;

      // Create subject subfolder based on student's subject from Excel
      if (student.subject && student.subject.trim()) {
        await this.drive.files.create({
          requestBody: {
            name: student.subject.trim(),
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

  /**
   * Upload a file to Google Drive
   */
  async uploadFile(
    folderId: string,
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<{ success: boolean; fileId?: string; error?: string }> {
    try {
      if (!this.auth || !this.drive) {
        return { success: false, error: 'Google Drive Service not initialized' };
      }

      const fileMetadata = {
        name: fileName,
        parents: [folderId]
      };

      const media = {
        mimeType: mimeType,
        body: fileBuffer
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id,name,webViewLink'
      });

      return {
        success: true,
        fileId: response.data.id
      };

    } catch (error) {
      console.error('Error uploading file to Google Drive:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Find student folder by civil ID in teacher's main folder
   */
  async findStudentFolder(teacherFolderId: string, studentCivilId: string): Promise<string | null> {
    try {
      if (!this.auth || !this.drive) {
        return null;
      }

      const response = await this.drive.files.list({
        q: `'${teacherFolderId}' in parents and name='${studentCivilId}' and mimeType='application/vnd.google-apps.folder'`,
        fields: 'files(id, name)'
      });

      if (response.data.files && response.data.files.length > 0) {
        return response.data.files[0].id;
      }

      return null;
    } catch (error) {
      console.error('Error finding student folder:', error);
      return null;
    }
  }
}

export const googleDriveService = new GoogleDriveService();