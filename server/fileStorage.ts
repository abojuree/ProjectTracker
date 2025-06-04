import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

export class LocalFileStorage {
  private baseUploadPath: string;

  constructor() {
    this.baseUploadPath = path.join(process.cwd(), 'uploads');
    this.ensureBaseDirectory();
  }

  private async ensureBaseDirectory() {
    try {
      await mkdir(this.baseUploadPath, { recursive: true });
    } catch (error) {
      console.error('Error creating uploads directory:', error);
    }
  }

  // Create teacher-specific folder structure
  async createTeacherFolders(teacherId: number, teacherName: string): Promise<string> {
    const teacherPath = path.join(this.baseUploadPath, `teacher_${teacherId}`);
    
    try {
      await mkdir(teacherPath, { recursive: true });
      
      // Create subfolders for different file types
      const subfolders = ['اختبارات', 'واجبات', 'مشاريع', 'درجات', 'ملاحظات', 'شهادات', 'أنشطة', 'مراجعات', 'تقييمات', 'أخرى'];
      
      for (const folder of subfolders) {
        await mkdir(path.join(teacherPath, folder), { recursive: true });
      }
      
      return teacherPath;
    } catch (error) {
      console.error('Error creating teacher folders:', error);
      throw new Error('Failed to create teacher folders');
    }
  }

  // Create student-specific folder within teacher's space
  async createStudentFolder(teacherId: number, studentCivilId: string, studentName: string): Promise<string> {
    const teacherPath = path.join(this.baseUploadPath, `teacher_${teacherId}`);
    const studentPath = path.join(teacherPath, `student_${studentCivilId}`);
    
    try {
      await mkdir(studentPath, { recursive: true });
      
      // Create subfolders for different file categories
      const categories = ['اختبارات', 'واجبات', 'مشاريع', 'درجات', 'ملاحظات', 'شهادات', 'أنشطة', 'مراجعات', 'تقييمات', 'أخرى'];
      
      for (const category of categories) {
        await mkdir(path.join(studentPath, category), { recursive: true });
      }
      
      return studentPath;
    } catch (error) {
      console.error('Error creating student folder:', error);
      throw new Error('Failed to create student folder');
    }
  }

  // Save file with organized structure
  async saveFile(
    teacherId: number,
    studentCivilId: string,
    category: string,
    fileName: string,
    fileBuffer: Buffer
  ): Promise<string> {
    const teacherPath = path.join(this.baseUploadPath, `teacher_${teacherId}`);
    const studentPath = path.join(teacherPath, `student_${studentCivilId}`);
    const categoryPath = path.join(studentPath, category);
    
    // Ensure directories exist
    await mkdir(categoryPath, { recursive: true });
    
    // Generate unique filename
    const timestamp = Date.now();
    const ext = path.extname(fileName);
    const baseName = path.basename(fileName, ext);
    const uniqueFileName = `${baseName}_${timestamp}${ext}`;
    
    const filePath = path.join(categoryPath, uniqueFileName);
    
    try {
      await writeFile(filePath, fileBuffer);
      return filePath;
    } catch (error) {
      console.error('Error saving file:', error);
      throw new Error('Failed to save file');
    }
  }

  // Get file URL for serving
  getFileUrl(filePath: string): string {
    const relativePath = path.relative(this.baseUploadPath, filePath);
    return `/api/files/${relativePath.replace(/\\/g, '/')}`;
  }

  // Delete file
  async deleteFile(filePath: string): Promise<void> {
    try {
      await unlink(filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  // Get absolute path from relative URL
  getAbsolutePath(relativePath: string): string {
    return path.join(this.baseUploadPath, relativePath);
  }
}

export const fileStorage = new LocalFileStorage();