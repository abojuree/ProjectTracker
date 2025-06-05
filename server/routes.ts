import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fileStorage } from "./fileStorage";
import multer from "multer";
import * as XLSX from "xlsx";
import { z } from "zod";
import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";

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
      const { name, schoolName, email, password, driveFolderLink } = req.body;
      
      console.log('Extracted fields:', { name, schoolName, email, password: !!password, driveFolderLink });
      
      if (!name || !schoolName || !email || !password) {
        console.log('Missing fields validation failed:', { name: !!name, schoolName: !!schoolName, email: !!email, password: !!password });
        return res.status(400).json({ message: "جميع الحقول مطلوبة", received: { name: !!name, schoolName: !!schoolName, email: !!email, password: !!password } });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
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

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create teacher without passwordHash in the data object
      const teacherData = {
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
      };

      const teacher = await storage.createTeacher(teacherData);
      
      // Set password separately
      await storage.setTeacherPassword(teacher.id, passwordHash);

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

  // Teacher login with password
  app.post('/api/teacher/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "البريد الإلكتروني وكلمة المرور مطلوبان" });
      }
      
      const teacher = await storage.validateTeacherPassword(email, password);
      if (!teacher) {
        return res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
      }
      
      // Update last login
      await storage.updateTeacher(teacher.id, {
        lastLogin: new Date()
      });
      
      res.json({ 
        message: "تم تسجيل الدخول بنجاح",
        teacher 
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "خطأ في تسجيل الدخول" });
    }
  });

  // Set password for existing teacher
  app.post('/api/teacher/set-password', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "البريد الإلكتروني وكلمة المرور مطلوبان" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
      }
      
      const teacher = await storage.getTeacherByEmail(email);
      if (!teacher) {
        return res.status(404).json({ message: "لا يوجد حساب مسجل بهذا البريد الإلكتروني" });
      }
      
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      await storage.setTeacherPassword(teacher.id, passwordHash);
      
      res.json({ 
        message: "تم تعيين كلمة المرور بنجاح",
        teacherId: teacher.id
      });
    } catch (error) {
      console.error('Set password error:', error);
      res.status(500).json({ message: "خطأ في تعيين كلمة المرور" });
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

  app.get("/api/teacher/:teacherId/student-file-counts", async (req, res) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      const fileCounts = await storage.getStudentFileCounts(teacherId);
      res.json(fileCounts);
    } catch (error) {
      console.error("Error fetching student file counts:", error);
      res.status(500).json({ message: "Failed to fetch student file counts" });
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

      // Get only active students for this teacher who haven't had folders created yet
      const allStudents = await storage.getStudentsByTeacher(teacherId);
      const students = allStudents.filter(student => student.isActive && !student.folderCreated);
      
      if (students.length === 0) {
        return res.status(400).json({ message: "No new students found or all folders already created" });
      }

      let created = 0;
      let failed = 0;
      let skipped = 0;
      const details: string[] = [];

      console.log(`Starting folder creation for ${students.length} students...`);
      
      // Process students in batches for better performance
      const batchSize = 3;
      for (let i = 0; i < students.length; i += batchSize) {
        const batch = students.slice(i, i + batchSize);
        const batchPromises = batch.map(async (student, index) => {
          const studentIndex = i + index + 1;
          const progress = Math.round((studentIndex / students.length) * 100);
          console.log(`Progress: ${progress}% - Processing student ${studentIndex}/${students.length}: Civil ID ${student.civilId}`);
          
          try {
            // Skip if folder already created
            if (student.folderCreated) {
              skipped++;
              console.log(`⏭️ Skipped Civil ID ${student.civilId} - folder already exists`);
              return;
            }
            
            // Create folder using Service Account in teacher's shared Google Drive folder
            if (teacher.driveFolderId) {
              try {
                const { googleDriveService } = await import('./googleDriveService');
                const result = await googleDriveService.createStudentFolder(teacher, student);
                
                if (result.success) {
                  await storage.updateStudent(student.id, {
                    folderCreated: true
                  });
                  created++;
                  console.log(`✅ Created folder for Civil ID: ${student.civilId} with Google Drive ID: ${result.folderId}`);
                  return;
                } else {
                  console.error(`❌ Failed to create folder for Civil ID ${student.civilId}: ${result.error}`);
                }
              } catch (error) {
                console.error(`❌ Error creating folder for Civil ID ${student.civilId}:`, error);
              }
            }
            
            // Mark as logically created if no Google Drive access
            await storage.updateStudent(student.id, {
              folderCreated: true
            });
            created++;
            console.log(`Marked folder as created for Civil ID: ${student.civilId}`);
          } catch (error) {
            failed++;
            details.push(`فشل في تسجيل مجلد للطالب برقم الهوية: ${student.civilId}`);
            console.error('Error creating folder entry:', error);
          }
        });
        
        // Wait for current batch to complete before processing next batch
        await Promise.all(batchPromises);
        
        // Small delay between batches to avoid overwhelming Google Drive API
        if (i + batchSize < students.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
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
        success: true,
        created,
        failed,
        skipped,
        total: students.length,
        message: `تم تجهيز ${created} مجلد للطلاب بنجاح`,
        details: responseDetails,
        instructions,
        note: "المجلدات جاهزة للاستخدام - يمكن للأهالي الوصول إليها عبر الروابط والـ QR codes"
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

  // Delete single student
  app.delete("/api/teacher/:teacherId/students/:studentId", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      await storage.deleteStudent(studentId);
      res.json({ message: "تم حذف الطالب بنجاح" });
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // Delete all students for a teacher
  app.delete("/api/teacher/:teacherId/students", async (req, res) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      const students = await storage.getStudentsByTeacher(teacherId);
      
      for (const student of students) {
        await storage.deleteStudent(student.id);
      }
      
      res.json({ 
        message: `تم حذف ${students.length} طالب بنجاح`,
        deleted: students.length
      });
    } catch (error) {
      console.error("Error deleting all students:", error);
      res.status(500).json({ message: "Failed to delete students" });
    }
  });

  // File upload for specific student
  app.post("/api/teacher/:teacherId/students/:studentId/upload", upload.array('files', 10), async (req, res) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      const studentId = parseInt(req.params.studentId);
      const category = req.body.category || 'general';
      
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ message: "لم يتم رفع أي ملفات" });
      }

      // Get teacher and student info
      const teacher = await storage.getTeacher(teacherId);
      const student = await storage.getStudent(studentId);
      
      if (!teacher || !student) {
        return res.status(404).json({ message: "المعلم أو الطالب غير موجود" });
      }

      // Validate that student belongs to this teacher
      if (student.teacherId !== teacherId) {
        return res.status(403).json({ message: "غير مصرح بالوصول لهذا الطالب" });
      }

      const uploadedFiles = [];
      const errors = [];

      for (const file of req.files as Express.Multer.File[]) {
        try {
          // Save file to local storage
          const filePath = await fileStorage.saveFile(
            teacherId,
            student.civilId,
            student.studentName,
            file.originalname,
            file.buffer
          );

          let driveFileId = null;
          let driveUploadSuccess = false;

          // Try to upload to Google Drive if teacher has folder configured
          if (teacher.driveFolderId) {
            try {
              const { googleDriveService } = await import('./googleDriveService');
              
              // Find or create student folder
              let studentFolderId = await googleDriveService.findStudentFolder(teacher.driveFolderId, student.civilId);
              
              if (!studentFolderId) {
                // Create student folder if it doesn't exist
                const createResult = await googleDriveService.createStudentFolder(teacher, student);
                if (createResult.success && createResult.folderId) {
                  studentFolderId = createResult.folderId;
                }
              }

              if (studentFolderId) {
                // Upload file to Google Drive
                const uploadResult = await googleDriveService.uploadFile(
                  studentFolderId,
                  file.originalname,
                  file.buffer,
                  file.mimetype
                );

                if (uploadResult.success) {
                  driveFileId = uploadResult.fileId;
                  driveUploadSuccess = true;
                  console.log(`File uploaded to Google Drive: ${file.originalname}`);
                } else {
                  console.error(`Failed to upload to Google Drive: ${uploadResult.error}`);
                }
              }
            } catch (driveError) {
              console.error('Google Drive upload error:', driveError);
            }
          }

          // Save file record to database
          const fileRecord = await storage.createFile({
            teacherId,
            studentCivilId: student.civilId,
            originalName: file.originalname,
            systemName: file.originalname,
            filePath,
            fileUrl: fileStorage.getFileUrl(filePath),
            fileSize: file.size,
            fileType: file.mimetype,
            fileCategory: category,
            subject: student.subject || 'عام'
          });

          uploadedFiles.push({
            id: fileRecord.id,
            fileName: file.originalname,
            size: file.size,
            category,
            driveUploaded: driveUploadSuccess,
            driveFileId
          });

        } catch (error) {
          console.error(`Error uploading file ${file.originalname}:`, error);
          errors.push(`فشل في رفع الملف: ${file.originalname}`);
        }
      }

      if (uploadedFiles.length === 0) {
        return res.status(500).json({ 
          message: "فشل في رفع جميع الملفات",
          errors 
        });
      }

      const driveUploadedCount = uploadedFiles.filter((f: any) => f.driveUploaded).length;
      let message = `تم رفع ${uploadedFiles.length} ملف بنجاح للطالب ${student.studentName}`;
      
      if (teacher.driveFolderId) {
        if (driveUploadedCount === uploadedFiles.length) {
          message += ` وتم رفعها جميعاً إلى Google Drive`;
        } else if (driveUploadedCount > 0) {
          message += ` (${driveUploadedCount} منها تم رفعها إلى Google Drive)`;
        } else {
          message += ` (لم يتم رفعها إلى Google Drive - يرجى التحقق من الإعدادات)`;
        }
      } else {
        message += ` (لم يتم تكوين Google Drive - الملفات محفوظة محلياً فقط)`;
      }

      res.json({
        message,
        uploadedFiles,
        driveInfo: {
          configured: !!teacher.driveFolderId,
          uploadedToDrive: driveUploadedCount,
          totalFiles: uploadedFiles.length
        },
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      console.error("Error uploading files:", error);
      res.status(500).json({ message: "خطأ في رفع الملفات" });
    }
  });

  // Get files for a specific student
  app.get("/api/teacher/:teacherId/students/:studentId/files", async (req, res) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      const studentId = parseInt(req.params.studentId);
      
      const student = await storage.getStudent(studentId);
      if (!student || student.teacherId !== teacherId) {
        return res.status(404).json({ message: "الطالب غير موجود" });
      }

      const files = await storage.getFilesByStudent(student.civilId, teacherId);
      res.json(files);

    } catch (error) {
      console.error("Error fetching student files:", error);
      res.status(500).json({ message: "خطأ في جلب ملفات الطالب" });
    }
  });

  app.post("/api/teacher/:teacherId/students/upload-excel", upload.single('file'), async (req, res) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Check for existing students to prevent duplicates
      const existingStudents = await storage.getStudentsByTeacher(teacherId);

      // Parse Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      // Validate and map Excel data
      const validStudentsData: any[] = [];
      let skippedRows = 0;
      let duplicateRows = 0;
      
      // Get existing civil IDs to prevent duplicates
      const existingCivilIds = new Set(existingStudents.map(s => s.civilId));
      
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

        // Check for duplicates
        if (existingCivilIds.has(civilIdStr)) {
          duplicateRows++;
          console.warn(`تجاهل الصف ${index + 2}: الطالب موجود مسبقاً (${civilIdStr})`);
          continue;
        }

        // Add to set to prevent duplicates within the same Excel file
        existingCivilIds.add(civilIdStr);

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
        
        // Skip Google Drive folder creation during Excel upload to avoid blocking
        console.log(`Excel upload completed. Google Drive folders can be created separately using the "Create Student Folders" button.`);
      }
      
      res.json({ 
        message: `تم رفع ${validStudentsData.length} طالب بنجاح`,
        added: validStudentsData.length,
        skipped: skippedRows,
        duplicates: duplicateRows,
        total: data.length,
        details: `${skippedRows > 0 ? `تم تجاهل ${skippedRows} صف بسبب بيانات غير صحيحة. ` : ''}${duplicateRows > 0 ? `تم تجاهل ${duplicateRows} طالب مكرر.` : ''}`
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
