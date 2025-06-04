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
        
        // Create folders for each new student
        for (const student of createdStudents) {
          try {
            await fileStorage.createStudentFolder(teacherId, student.civilId, student.studentName);
          } catch (error) {
            console.warn(`Failed to create folder for student ${student.studentName}:`, error);
          }
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
  app.get("/api/files/*", (req, res) => {
    try {
      const relativePath = req.params[0];
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

  app.post("/api/verify-student", async (req, res) => {
    try {
      const { civilId, captchaId, captchaAnswer, linkCode } = req.body;

      if (!civilId || !captchaId || !captchaAnswer || !linkCode) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Verify teacher link
      const teacher = await storage.getTeacherByLinkCode(linkCode);
      if (!teacher) {
        return res.status(404).json({ message: "Invalid access link" });
      }

      // Verify captcha
      const captcha = await storage.getRandomCaptcha();
      if (!captcha || captcha.answer.toLowerCase() !== captchaAnswer.toLowerCase()) {
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

      res.json({
        student: {
          name: student.studentName,
          civilId: student.civilId,
          grade: student.grade,
          classNumber: student.classNumber
        },
        teacher: {
          name: teacher.name
        },
        files: filesBySubject
      });
    } catch (error) {
      console.error("Error verifying student:", error);
      res.status(500).json({ message: "Failed to verify student" });
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
