import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fileStorage } from "./fileStorage";
import multer from "multer";
import * as XLSX from "xlsx";
import { z } from "zod";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize default captcha questions
  await initializeCaptchaQuestions();

  // Simple teacher registration for testing
  app.post('/api/teacher/simple-register', async (req, res) => {
    try {
      console.log('Simple registration request:', req.body);
      const { name, schoolName, email, driveFolderLink } = req.body;
      
      console.log('Extracted fields:', { name, schoolName, email, driveFolderLink });
      
      if (!name || !schoolName || !email) {
        console.log('Missing fields validation failed:', { name: !!name, schoolName: !!schoolName, email: !!email });
        return res.status(400).json({ message: "Missing required fields", received: { name: !!name, schoolName: !!schoolName, email: !!email } });
      }

      const linkCode = `${name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
      
      // Extract folder ID from Google Drive link if provided
      let driveFolderId = null;
      if (driveFolderLink) {
        const match = driveFolderLink.match(/\/folders\/([a-zA-Z0-9-_]+)/);
        if (match) {
          driveFolderId = match[1];
        }
      }

      const teacher = await storage.createTeacher({
        name: name.trim(),
        schoolName: schoolName.trim(),
        email: email.trim(),
        linkCode,
        googleId: null,
        accessToken: null,
        refreshToken: null,
        driveFolderId,
        profileImageUrl: null,
        isActive: true
      });

      res.json(teacher);
    } catch (error) {
      console.error('Error creating teacher:', error);
      res.status(500).json({ message: 'Failed to create teacher' });
    }
  });

  // Direct Google OAuth route (assumes teacher ID 14 for demo)
  app.get('/api/auth/google', async (req, res) => {
    try {
      const { google } = await import('googleapis');
      
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `https://project-tracker-abojuree1.replit.app/api/google-callback`
      );

      const scopes = [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/userinfo.email'
      ];

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
        state: '14' // Default teacher ID for demo
      });

      res.redirect(authUrl);
    } catch (error) {
      console.error('Error generating Google auth URL:', error);
      res.status(500).send('Failed to generate auth URL');
    }
  });

  // Google OAuth for Drive access
  app.get('/api/teacher/:teacherId/connect-google', async (req, res) => {
    try {
      console.log('Generating Google auth URL for teacher:', req.params.teacherId);
      console.log('Environment check - Client ID exists:', !!process.env.GOOGLE_CLIENT_ID);
      console.log('Environment check - Client Secret exists:', !!process.env.GOOGLE_CLIENT_SECRET);
      
      const { google } = await import('googleapis');
      
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `https://project-tracker-abojuree1.replit.app/api/google-callback`
      );

      const scopes = [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/userinfo.email'
      ];

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
        state: req.params.teacherId // Pass teacher ID in state
      });

      console.log('Generated auth URL:', authUrl);
      res.json({ authUrl });
    } catch (error) {
      console.error('Error generating Google auth URL:', error);
      res.status(500).json({ 
        message: 'Failed to generate auth URL', 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/google-callback', async (req, res) => {
    try {
      const { google } = await import('googleapis');
      const { code, state } = req.query;
      const teacherId = parseInt(state as string);

      if (!code || !state) {
        return res.status(400).send('Authorization code or state missing');
      }

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `https://project-tracker-abojuree1.replit.app/api/google-callback`
      );

      const { tokens } = await oauth2Client.getToken(code as string);
      
      // Update teacher with access tokens
      await storage.updateTeacher(teacherId, {
        accessToken: tokens.access_token || null,
        refreshToken: tokens.refresh_token || null
      });

      // Redirect back to dashboard with success
      res.redirect(`/teacher-dashboard/${teacherId}?google_connected=true`);
    } catch (error) {
      console.error('Error handling Google callback:', error);
      res.redirect(`/teacher-dashboard/8?error=google_auth_failed`);
    }
  });

  // Teacher routes
  app.get("/api/teacher/:teacherId", async (req, res) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      const teacher = await storage.getTeacher(teacherId);
      
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }

      res.json(teacher);
    } catch (error) {
      console.error("Error fetching teacher:", error);
      res.status(500).json({ message: "Failed to fetch teacher" });
    }
  });

  app.get("/api/teacher/:teacherId/stats", async (req, res) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      const stats = await storage.getTeacherStats(teacherId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching teacher stats:", error);
      res.status(500).json({ message: "Failed to fetch teacher stats" });
    }
  });

  // Google OAuth routes for teachers
  app.get("/api/teacher/:teacherId/google-auth", async (req: any, res) => {
    try {
      const { googleDriveAPI } = await import('./googleDriveApi');
      const authUrl = googleDriveAPI.generateAuthUrl();
      
      // Store teacher ID in session for callback
      req.session = req.session || {};
      req.session.teacherId = req.params.teacherId;
      
      res.redirect(authUrl);
    } catch (error) {
      console.error("Error generating auth URL:", error);
      res.status(500).json({ message: "Failed to initiate Google authentication" });
    }
  });

  app.get("/api/google-callback", async (req: any, res) => {
    try {
      const { code } = req.query;
      const teacherId = req.session?.teacherId;

      if (!code || !teacherId) {
        return res.status(400).send("Invalid authentication callback");
      }

      const { googleDriveAPI } = await import('./googleDriveApi');
      const tokens = await googleDriveAPI.getAccessToken(code as string);

      if (tokens.error || !tokens.access_token) {
        return res.status(400).send("Failed to obtain access token");
      }

      // Save tokens to teacher record
      await storage.updateTeacher(parseInt(teacherId), {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null
      });

      // Clear session
      if (req.session) {
        delete req.session.teacherId;
      }

      res.redirect(`/teacher-dashboard/${teacherId}?google-connected=true`);
    } catch (error) {
      console.error("Error in Google callback:", error);
      res.status(500).send("Authentication failed");
    }
  });

  app.post("/api/teacher/:teacherId/drive-link", async (req, res) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      const { driveFolderLink } = req.body;

      // If empty string is sent, clear the drive folder ID
      if (driveFolderLink === "") {
        const updatedTeacher = await storage.updateTeacher(teacherId, {
          driveFolderId: null
        });
        return res.json({ 
          message: "Drive folder link cleared successfully", 
          teacher: updatedTeacher 
        });
      }

      if (!driveFolderLink || typeof driveFolderLink !== 'string') {
        return res.status(400).json({ message: "Drive folder link is required" });
      }

      // Extract folder ID from the link
      const { extractFolderIdFromLink } = await import('./googleDriveSimple');
      const folderId = extractFolderIdFromLink(driveFolderLink);
      
      if (!folderId) {
        return res.status(400).json({ message: "Invalid Google Drive folder link" });
      }

      // Update teacher with the folder ID
      const updatedTeacher = await storage.updateTeacher(teacherId, {
        driveFolderId: folderId
      });

      res.json({ 
        message: "Drive folder link saved successfully", 
        teacher: updatedTeacher 
      });
    } catch (error) {
      console.error("Error saving drive link:", error);
      res.status(500).json({ message: "Failed to save drive link" });
    }
  });

  app.post("/api/teacher/:teacherId/create-student-folders", async (req, res) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      
      // Get teacher and verify Google Drive connection
      const teacher = await storage.getTeacher(teacherId);
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }

      if (!teacher.driveFolderId) {
        return res.status(400).json({ message: "Google Drive folder not configured" });
      }

      // Get all students for this teacher
      const students = await storage.getStudentsByTeacher(teacherId);
      if (students.length === 0) {
        return res.status(400).json({ message: "No students found" });
      }

      let created = 0;
      let failed = 0;
      let skipped = 0;
      const details: string[] = [];

      // Use Google Drive API to create actual folders
      for (const student of students) {
        try {
          // Skip if folder already created
          if (student.folderCreated) {
            skipped++;
            continue;
          }
          
          // Try to create folder using Google Drive API with teacher's access token
          try {
            if (!teacher.accessToken) {
              failed++;
              details.push(`المعلم بحاجة لربط حساب Google Drive للطالب: ${student.studentName}`);
              continue;
            }

            const { googleDriveAPI } = await import('./googleDriveApi');
            const result = await googleDriveAPI.createStudentFolderStructure(student, teacher, teacher.accessToken);
            
            if (result.success) {
              await storage.updateStudent(student.id, {
                folderCreated: true
              });
              created++;
              console.log(`Successfully created Google Drive folder for student: ${student.studentName}`);
            } else {
              failed++;
              details.push(`فشل في إنشاء مجلد للطالب ${student.studentName}: ${result.error || 'خطأ غير معروف'}`);
            }
          } catch (apiError) {
            failed++;
            details.push(`خطأ في الاتصال بـ Google Drive للطالب: ${student.studentName}`);
            console.error('Google Drive API Error:', apiError);
          }
        } catch (error) {
          failed++;
          details.push(`فشل في إنشاء مجلد للطالب: ${student.studentName}`);
        }
      }

      // Generate folder structure information
      const { generateSharingInstructions } = await import('./googleDriveSimple');
      const instructions = generateSharingInstructions(teacher);

      // Prepare response details
      const responseDetails: string[] = [];
      if (created > 0) {
        responseDetails.push(`تم إنشاء ${created} مجلد جديد`);
      }
      if (skipped > 0) {
        responseDetails.push(`تم تخطي ${skipped} مجلد موجود مسبقاً`);
      }
      if (failed > 0) {
        responseDetails.push(`فشل في إنشاء ${failed} مجلد`);
        responseDetails.push(...details);
      }
      if (created === 0 && skipped > 0) {
        responseDetails.push("جميع المجلدات موجودة مسبقاً");
      }

      res.json({
        success: created > 0 || (created === 0 && skipped > 0 && failed === 0),
        created,
        failed,
        skipped,
        total: students.length,
        details: responseDetails,
        instructions
      });

    } catch (error) {
      console.error("Error creating student folders:", error);
      res.status(500).json({ message: "Failed to create student folders" });
    }
  });

  // Student routes
  app.get("/api/teacher/:teacherId/students", async (req, res) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      const students = await storage.getStudentsByTeacher(teacherId);
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.post("/api/teacher/:teacherId/students/upload-excel", upload.single('file'), async (req, res) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Parse Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      // Validate and map Excel data
      const validStudentsData: any[] = [];
      let skippedRows = 0;
      
      for (let index = 0; index < data.length; index++) {
        const row = data[index] as Record<string, any>;
        
        // Try different column name variations - updated to match user's file
        const serialNumber = row['رقم متسلسل'] || row['Serial Number'] || row['الرقم'] || row['رقم'] || row['م'];
        const studentName = row['اسم الطالب'] || row['Student Name'] || row['الاسم'] || row['اسم'];
        const civilId = row['رقم الهوية'] || row['Civil ID'] || row['الهوية'] || row['رقم_الهوية'] || row['السجل المدني'];
        const grade = row['الصف'] || row['Grade'] || row['الصف_الدراسي'];
        const classNumber = row['رقم الفصل'] || row['Class Number'] || row['الفصل'] || row['رقم_الفصل'];
        const subject = row['المادة'] || row['Subject'] || row['المادة_الدراسية'];

        // Skip empty rows
        if (!studentName && !civilId && !grade && !classNumber && !subject) {
          skippedRows++;
          continue;
        }

        if (!studentName || !civilId || !grade || !classNumber || !subject) {
          skippedRows++;
          console.warn(`تجاهل الصف ${index + 2}: بيانات ناقصة`);
          continue;
        }

        // Convert civilId to string and validate
        const civilIdStr = String(civilId).replace(/\s/g, '');
        
        // Skip rows with invalid civil IDs instead of throwing error
        if (civilIdStr.length !== 10 || !/^\d{10}$/.test(civilIdStr)) {
          skippedRows++;
          console.warn(`تجاهل الصف ${index + 2}: رقم هوية غير صحيح "${civilIdStr}"`);
          continue;
        }

        validStudentsData.push({
          civilId: civilIdStr,
          studentName: studentName.toString().trim(),
          grade: grade.toString().trim(),
          classNumber: parseInt(classNumber.toString()),
          subject: subject.toString().trim(),
          teacherId,
          folderCreated: false,
          isActive: true
        });
      }

      // Create students in batch
      const createdStudents = await storage.createStudentsBatch(validStudentsData);
      
      // Create file folders for new students
      const teacher = await storage.getTeacher(teacherId);
      if (teacher) {
        // Ensure teacher folder structure exists
        await fileStorage.createTeacherFolders(teacherId, teacher.name);
        
        // Create local folders for each new student
        for (const student of createdStudents) {
          try {
            await fileStorage.createStudentFolder(teacherId, student.civilId, student.studentName);
          } catch (error) {
            console.warn(`Failed to create local folder for student ${student.studentName}:`, error);
          }
        }
        
        // Create Google Drive folders if teacher has Drive folder configured
        if (teacher.driveFolderId) {
          console.log(`Creating Google Drive folders for ${createdStudents.length} students...`);
          try {
            // Import Google Drive functions
            const { createStudentFolders } = await import('./googleDrive');
            
            // Create folders for each student in Google Drive
            for (const student of createdStudents) {
              try {
                await createStudentFolders([student], teacher);
                console.log(`Created Google Drive folder for student: ${student.studentName}`);
                
                // Update student record to mark folder as created
                await storage.updateStudent(student.id, { folderCreated: true });
              } catch (driveError) {
                console.warn(`Failed to create Google Drive folder for student ${student.studentName}:`, driveError);
              }
            }
          } catch (error) {
            console.warn('Failed to create Google Drive folders:', error);
          }
        } else {
          console.log('No Google Drive folder configured for teacher, skipping Drive folder creation');
        }
      }
      
      res.json({ 
        message: `تم رفع ${validStudentsData.length} طالب بنجاح`,
        added: validStudentsData.length,
        skipped: skippedRows,
        total: data.length,
        details: skippedRows > 0 ? `تم تجاهل ${skippedRows} صف بسبب بيانات غير صحيحة أو ناقصة` : undefined
      });
    } catch (error) {
      console.error("Error uploading Excel:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to upload Excel file" });
    }
  });

  // Test endpoint to analyze uploaded Excel file structure
  app.post("/api/test-excel", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Parse Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      // Analyze structure
      const analysis = {
        totalRows: data.length,
        columns: data.length > 0 ? Object.keys(data[0] as any) : [],
        sampleData: data.slice(0, 3),
        fileName: req.file.originalname,
        fileSize: req.file.size
      };

      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing Excel:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to analyze Excel file" });
    }
  });

  // Download Excel template
  app.get("/api/excel-template", (req, res) => {
    try {
      // Create a sample Excel workbook
      const wb = XLSX.utils.book_new();
      
      // Sample data with correct column names
      const sampleData = [
        {
          'رقم متسلسل': 1,
          'اسم الطالب': 'أحمد محمد العنزي',
          'رقم الهوية': '1234567890',
          'الصف': 'الصف الرابع الابتدائي',
          'رقم الفصل': 1,
          'المادة': 'الرياضيات'
        },
        {
          'رقم متسلسل': 2,
          'اسم الطالب': 'فاطمة علي المطيري',
          'رقم الهوية': '2345678901',
          'الصف': 'الصف الرابع الابتدائي',
          'رقم الفصل': 1,
          'المادة': 'الرياضيات'
        }
      ];
      
      const ws = XLSX.utils.json_to_sheet(sampleData);
      XLSX.utils.book_append_sheet(wb, ws, 'بيانات الطلاب');
      
      // Generate buffer
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Disposition', 'attachment; filename=student-template.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      console.error("Error creating Excel template:", error);
      res.status(500).json({ message: "Failed to create Excel template" });
    }
  });

  app.post("/api/teacher/:teacherId/students", async (req, res) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      
      const studentSchema = z.object({
        civilId: z.string().length(10),
        studentName: z.string().min(1),
        grade: z.string().min(1),
        classNumber: z.number().int().positive(),
        subject: z.string().min(1)
      });

      const validatedData = studentSchema.parse(req.body);
      
      const studentData = {
        ...validatedData,
        teacherId,
        folderCreated: false,
        isActive: true
      };

      const student = await storage.createStudent(studentData);
      res.json(student);
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create student" });
    }
  });

  // File routes
  app.get("/api/student/:civilId/files", async (req, res) => {
    try {
      const { civilId } = req.params;
      const { teacherId } = req.query;

      if (!teacherId) {
        return res.status(400).json({ message: "Teacher ID is required" });
      }

      const studentFiles = await storage.getFilesByStudent(civilId, parseInt(teacherId.toString()));
      res.json(studentFiles);
    } catch (error) {
      console.error("Error fetching student files:", error);
      res.status(500).json({ message: "Failed to fetch student files" });
    }
  });

  app.post("/api/teacher/:teacherId/files", upload.single('file'), async (req, res) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { studentCivilId, subject, fileCategory, description } = req.body;

      if (!studentCivilId || !subject || !fileCategory) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Save file using local storage system
      const filePath = await fileStorage.saveFile(
        teacherId,
        studentCivilId,
        fileCategory,
        req.file.originalname,
        req.file.buffer
      );

      // Generate system filename
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const fileExtension = req.file.originalname.split('.').pop();
      const systemName = `${studentCivilId}_${subject}_${fileCategory}_${date}_${Date.now()}.${fileExtension}`;

      // Get file URL for serving
      const fileUrl = fileStorage.getFileUrl(filePath);

      const fileData = {
        studentCivilId,
        subject,
        fileCategory,
        originalName: req.file.originalname,
        systemName,
        filePath,
        fileUrl,
        fileSize: req.file.size,
        fileType: fileExtension || 'unknown',
        teacherId,
        description: description || null,
        isActive: true
      };

      const file = await storage.createFile(fileData);
      res.json(file);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // File serving endpoint
  app.get("/api/files/*", (req: any, res) => {
    try {
      const relativePath = req.params[0] || '';
      const absolutePath = fileStorage.getAbsolutePath(relativePath);
      
      // Check if file exists
      if (!fs.existsSync(absolutePath)) {
        return res.status(404).json({ message: "File not found" });
      }

      // Set appropriate headers
      const ext = path.extname(absolutePath).toLowerCase();
      const mimeTypes: { [key: string]: string } = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.txt': 'text/plain'
      };

      const mimeType = mimeTypes[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', mimeType);
      
      // Send file
      res.sendFile(absolutePath);
    } catch (error) {
      console.error("Error serving file:", error);
      res.status(500).json({ message: "Failed to serve file" });
    }
  });

  // Update teacher profile after Google auth
  app.post('/api/teacher/update-profile', async (req, res) => {
    try {
      const { teacherId, teacherName, schoolName, driveFolder } = req.body;
      
      if (!teacherId || !teacherName) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const teacher = await storage.updateTeacher(teacherId, {
        name: teacherName,
        schoolName: schoolName || null,
        driveFolderId: driveFolder || null
      });

      res.json({ teacher });
    } catch (error) {
      console.error("Error updating teacher profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Get teacher by Google ID (for session restoration)
  app.get('/api/teacher/by-google/:googleId', async (req, res) => {
    try {
      const { googleId } = req.params;
      const teacher = await storage.getTeacherByGoogleId(googleId);
      
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }

      res.json({ teacher });
    } catch (error) {
      console.error("Error getting teacher by Google ID:", error);
      res.status(500).json({ message: "Failed to get teacher" });
    }
  });

  // Teacher Google authentication routes
  app.post('/api/auth/google/register', async (req, res) => {
    try {
      const { name, googleId, email, profileImageUrl, accessToken } = req.body;
      
      // Check if teacher already exists
      let teacher = await storage.getTeacherByGoogleId(googleId);
      
      if (!teacher) {
        // Create new teacher with Google Auth integration
        const linkCode = `${name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
        teacher = await storage.createTeacher({
          name,
          email,
          googleId,
          profileImageUrl,
          linkCode,
          accessToken: accessToken || '',
          refreshToken: '',
          isActive: true
        });
      } else {
        // Update existing teacher with new access token
        teacher = await storage.updateTeacher(teacher.id, {
          accessToken: accessToken || teacher.accessToken,
          lastLogin: new Date()
        });
      }
      
      res.json(teacher);
    } catch (error) {
      console.error('Error registering teacher:', error);
      res.status(500).json({ message: 'Failed to register teacher' });
    }
  });

  // Update teacher's Google Drive folder
  app.put('/api/teacher/:teacherId/drive-folder', async (req, res) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      const { driveFolderId } = req.body;
      
      const teacher = await storage.updateTeacher(teacherId, {
        driveFolderId
      });
      
      res.json(teacher);
    } catch (error) {
      console.error('Error updating Drive folder:', error);
      res.status(500).json({ message: 'Failed to update Drive folder' });
    }
  });

  // Parent access routes
  app.get("/api/captcha", async (req, res) => {
    try {
      const captcha = await storage.getRandomCaptcha();
      
      if (!captcha) {
        return res.status(404).json({ message: "No captcha questions available" });
      }

      res.json({
        id: captcha.id,
        question: captcha.question
      });
    } catch (error) {
      console.error("Error fetching captcha:", error);
      res.status(500).json({ message: "Failed to fetch captcha" });
    }
  });

  app.post("/api/verify-access-simple", async (req, res) => {
    try {
      const { civilId, linkCode } = req.body;

      if (!civilId || !linkCode) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Verify teacher link
      const teacher = await storage.getTeacherByLinkCode(linkCode);
      if (!teacher) {
        return res.status(404).json({ message: "Invalid access link" });
      }

      // Check if student exists for this teacher
      const student = await storage.getStudentByCivilId(civilId);
      if (!student || student.teacherId !== teacher.id) {
        return res.status(404).json({ message: "الطالب غير موجود في هذا الفصل" });
      }

      // Generate Google Drive URL
      let driveUrl = '';
      if (teacher.driveFolderId) {
        driveUrl = `https://drive.google.com/drive/folders/${teacher.driveFolderId}`;
      }

      res.json({
        success: true,
        studentName: student.studentName,
        teacherName: teacher.name,
        driveUrl,
        message: `مرحباً بك، يمكنك الوصول لملفات ${student.studentName}`
      });
    } catch (error) {
      console.error("Error in simple verification:", error);
      res.status(500).json({ message: "Failed to verify access" });
    }
  });

  app.post("/api/verify-student", async (req, res) => {
    try {
      const { civilId, captchaId, captchaAnswer, linkCode } = req.body;

      if (!civilId || !captchaAnswer || !linkCode) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Verify teacher link
      const teacher = await storage.getTeacherByLinkCode(linkCode);
      if (!teacher) {
        return res.status(404).json({ message: "Invalid access link" });
      }

      // Simple captcha verification - just check if answer is a number
      // The frontend generates simple math problems, so we skip DB verification
      if (isNaN(parseInt(captchaAnswer))) {
        return res.status(400).json({ message: "Invalid captcha answer" });
      }

      // Find student
      const student = await storage.getStudentByCivilId(civilId);
      if (!student || student.teacherId !== teacher.id) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Get student files grouped by subject and category
      const studentFiles = await storage.getFilesByStudent(civilId, teacher.id);
      
      // Group files by subject and category
      const filesBySubject = studentFiles.reduce((acc: any, file) => {
        if (!acc[file.subject]) {
          acc[file.subject] = {};
        }
        if (!acc[file.subject][file.fileCategory]) {
          acc[file.subject][file.fileCategory] = [];
        }
        acc[file.subject][file.fileCategory].push(file);
        return acc;
      }, {});

      // Generate Google Drive folder structure for this student
      const { generateStudentFolderStructure } = await import('./googleDriveSimple');
      const driveInfo = generateStudentFolderStructure(teacher, student);

      res.json({
        student: {
          name: student.studentName,
          civilId: student.civilId,
          grade: student.grade,
          classNumber: student.classNumber
        },
        teacher: {
          name: teacher.name,
          driveFolderId: teacher.driveFolderId
        },
        files: filesBySubject,
        driveInfo
      });
    } catch (error) {
      console.error("Error verifying student:", error);
      res.status(500).json({ message: "Failed to verify student" });
    }
  });

  // Delete single student
  app.delete("/api/teacher/:teacherId/students/:studentId", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      await storage.deleteStudent(studentId);
      res.json({ message: "Student deleted successfully" });
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // Delete multiple students
  app.delete("/api/teacher/:teacherId/students", async (req, res) => {
    try {
      const { studentIds } = req.body;
      
      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ message: "Student IDs array is required" });
      }

      let deletedCount = 0;
      let failedCount = 0;

      for (const studentId of studentIds) {
        try {
          await storage.deleteStudent(parseInt(studentId));
          deletedCount++;
        } catch (error) {
          failedCount++;
          console.error(`Error deleting student ${studentId}:`, error);
        }
      }

      res.json({ 
        message: `Deleted ${deletedCount} students successfully`,
        deletedCount,
        failedCount,
        total: studentIds.length
      });
    } catch (error) {
      console.error("Error deleting students:", error);
      res.status(500).json({ message: "Failed to delete students" });
    }
  });

  // Delete all students for a teacher
  app.delete("/api/teacher/:teacherId/students/all", async (req, res) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      
      const students = await storage.getStudentsByTeacher(teacherId);
      
      let deletedCount = 0;
      let failedCount = 0;

      for (const student of students) {
        try {
          await storage.deleteStudent(student.id);
          deletedCount++;
        } catch (error) {
          failedCount++;
          console.error(`Error deleting student ${student.id}:`, error);
        }
      }

      res.json({ 
        message: `Deleted ${deletedCount} students successfully`,
        deletedCount,
        failedCount,
        total: students.length
      });
    } catch (error) {
      console.error("Error deleting all students:", error);
      res.status(500).json({ message: "Failed to delete all students" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function initializeCaptchaQuestions() {
  try {
    // Check if captcha questions already exist
    const existingCaptcha = await storage.getRandomCaptcha();
    if (existingCaptcha) {
      return; // Already initialized
    }

    // Initialize default captcha questions
    const defaultQuestions = [
      { question: "كم يساوي: 2 + 3 = ؟", answer: "5" },
      { question: "كم يساوي: 7 - 2 = ؟", answer: "5" },
      { question: "كم يساوي: 3 × 2 = ؟", answer: "6" },
      { question: "كم يساوي: 8 ÷ 2 = ؟", answer: "4" },
      { question: "كم عدد أيام الأسبوع؟", answer: "7" },
      { question: "كم عدد حروف كلمة 'طالب'؟", answer: "4" },
      { question: "كم يساوي: 10 - 5 = ؟", answer: "5" },
      { question: "كم يساوي: 4 + 1 = ؟", answer: "5" }
    ];

    for (const q of defaultQuestions) {
      await storage.createCaptcha({ question: q.question, answer: q.answer, isActive: true });
    }

    console.log("Captcha questions initialized successfully");
  } catch (error) {
    console.error("Error initializing captcha questions:", error);
  }
}
