import { google } from 'googleapis';
import { Readable } from 'stream';
import type { Teacher, Student } from '@shared/schema';

export function createDriveService(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.drive({ version: 'v3', auth });
}

export async function createStudentFolders(
  driveService: any,
  teacher: Teacher,
  students: Student[]
) {
  try {
    // Create main folder if not exists
    let mainFolderId = teacher.driveFolderId;
    
    if (!mainFolderId) {
      const mainFolder = await driveService.files.create({
        requestBody: {
          name: 'Student File Management System',
          mimeType: 'application/vnd.google-apps.folder',
        },
      });
      mainFolderId = mainFolder.data.id;
      
      // Update teacher record
      await import('./storage').then(({ storage }) => 
        storage.updateTeacher(teacher.id, { driveFolderId: mainFolderId })
      );
    }

    // Create folders for each student
    for (const student of students) {
      try {
        // Create student folder (named with civil ID)
        const studentFolder = await driveService.files.create({
          requestBody: {
            name: student.civilId,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [mainFolderId],
          },
        });

        const studentFolderId = studentFolder.data.id;

        // Create subject folder
        const subjectFolder = await driveService.files.create({
          requestBody: {
            name: student.subject,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [studentFolderId],
          },
        });

        const subjectFolderId = subjectFolder.data.id;

        // Create category folders
        const categories = [
          'Exams',     // اختبارات
          'Grades',    // درجات
          'Homework',  // واجبات
          'Notes',     // ملاحظات
          'Alerts',    // إنذارات
          'Participation', // مشاركات
          'Certificates',  // شهادات
          'Attendance',    // حضور وغياب
          'Behavior',      // سلوك
          'Other'          // أخرى
        ];

        for (const category of categories) {
          await driveService.files.create({
            requestBody: {
              name: category,
              mimeType: 'application/vnd.google-apps.folder',
              parents: [subjectFolderId],
            },
          });
        }

        // Mark student folder as created
        await import('./storage').then(({ storage }) =>
          storage.updateStudent(student.id, { folderCreated: true })
        );

      } catch (error) {
        console.error(`Error creating folder for student ${student.civilId}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in createStudentFolders:', error);
    throw error;
  }
}

export async function uploadFileToDrive(
  driveService: any,
  file: Express.Multer.File,
  studentCivilId: string,
  subject: string,
  category: string
) {
  try {
    // Find the student's subject folder
    const studentFolders = await driveService.files.list({
      q: `name='${studentCivilId}' and mimeType='application/vnd.google-apps.folder'`,
      fields: 'files(id, name)',
    });

    if (!studentFolders.data.files || studentFolders.data.files.length === 0) {
      throw new Error('Student folder not found');
    }

    const studentFolderId = studentFolders.data.files[0].id;

    // Find subject folder
    const subjectFolders = await driveService.files.list({
      q: `'${studentFolderId}' in parents and name='${subject}' and mimeType='application/vnd.google-apps.folder'`,
      fields: 'files(id, name)',
    });

    if (!subjectFolders.data.files || subjectFolders.data.files.length === 0) {
      throw new Error('Subject folder not found');
    }

    const subjectFolderId = subjectFolders.data.files[0].id;

    // Find category folder
    const categoryMap: { [key: string]: string } = {
      'exams': 'Exams',
      'grades': 'Grades',
      'homework': 'Homework',
      'notes': 'Notes',
      'alerts': 'Alerts',
      'participation': 'Participation',
      'certificates': 'Certificates',
      'attendance': 'Attendance',
      'behavior': 'Behavior',
      'other': 'Other',
    };

    const categoryFolderName = categoryMap[category] || 'Other';

    const categoryFolders = await driveService.files.list({
      q: `'${subjectFolderId}' in parents and name='${categoryFolderName}' and mimeType='application/vnd.google-apps.folder'`,
      fields: 'files(id, name)',
    });

    if (!categoryFolders.data.files || categoryFolders.data.files.length === 0) {
      throw new Error('Category folder not found');
    }

    const categoryFolderId = categoryFolders.data.files[0].id;

    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${studentCivilId}_${subject}_${category}_${timestamp}.${fileExtension}`;

    // Upload file
    const fileMetadata = {
      name: fileName,
      parents: [categoryFolderId],
    };

    const media = {
      mimeType: file.mimetype,
      body: Readable.from(file.buffer),
    };

    const uploadedFile = await driveService.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id',
    });

    // Make file publicly viewable
    await driveService.permissions.create({
      fileId: uploadedFile.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    return uploadedFile.data;
  } catch (error) {
    console.error('Error uploading file to Drive:', error);
    throw error;
  }
}

export async function getFileDownloadUrl(driveService: any, fileId: string): Promise<string> {
  try {
    const response = await driveService.files.get({
      fileId: fileId,
      alt: 'media',
    });
    
    return `https://drive.google.com/uc?id=${fileId}`;
  } catch (error) {
    console.error('Error getting download URL:', error);
    throw error;
  }
}
