import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import * as XLSX from "xlsx";
import { z } from "zod";

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
      const studentsData = data.map((row: any, index: number) => {
        const serialNumber = row['رقم متسلسل'] || row['Serial Number'];
        const studentName = row['اسم الطالب'] || row['Student Name'];
        const civilId = row['رقم الهوية'] || row['Civil ID'];
        const grade = row['الصف'] || row['Grade'];
        const classNumber = row['رقم الفصل'] || row['Class Number'];
        const subject = row['المادة'] || row['Subject'];

        if (!studentName || !civilId || !grade || !classNumber || !subject) {
          throw new Error(`Invalid data in row ${index + 2}`);
        }

        if (typeof civilId !== 'string' || civilId.length !== 10) {
          throw new Error(`Invalid Civil ID in row ${index + 2}: must be exactly 10 digits`);
        }

        return {
          civilId: civilId.toString(),
          studentName: studentName.toString(),
          grade: grade.toString(),
          classNumber: parseInt(classNumber.toString()),
          subject: subject.toString(),
          teacherId,
          folderCreated: false,
          isActive: true
        };
      });

      // Create students in batch
      const createdStudents = await storage.createStudentsBatch(studentsData);
      
      res.json({ 
        message: "Students uploaded successfully",
        count: createdStudents.length,
        students: createdStudents 
      });
    } catch (error) {
      console.error("Error uploading Excel:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to upload Excel file" });
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

      // Generate system filename
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const fileExtension = req.file.originalname.split('.').pop();
      const systemName = `${studentCivilId}_${subject}_${fileCategory}_${date}_${Date.now()}.${fileExtension}`;

      const fileData = {
        studentCivilId,
        subject,
        fileCategory,
        originalName: req.file.originalname,
        systemName,
        filePath: `/uploads/${systemName}`, // This would be Google Drive path in real implementation
        fileUrl: `/api/files/${systemName}`, // This would be Google Drive URL in real implementation
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
