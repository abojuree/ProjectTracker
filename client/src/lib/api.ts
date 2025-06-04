import { queryClient } from "./queryClient";

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
  options?: RequestInit
): Promise<Response> {
  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include",
    ...options,
  };

  if (data && method !== "GET") {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP ${response.status}`);
  }

  return response;
}

export async function uploadFile(
  url: string,
  formData: FormData,
  onProgress?: (progress: number) => void
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(new Response(xhr.responseText, {
          status: xhr.status,
          statusText: xhr.statusText
        }));
      } else {
        reject(new Error(`HTTP ${xhr.status}: ${xhr.responseText}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error'));
    });

    xhr.open('POST', url);
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.send(formData);
  });
}

// Helper functions for common API operations
export const teacherApi = {
  getTeacher: async (id: number) => {
    const response = await apiRequest('GET', `/api/teacher/${id}`);
    return response.json();
  },

  getStats: async (id: number) => {
    const response = await apiRequest('GET', `/api/teacher/${id}/stats`);
    return response.json();
  },

  getStudents: async (id: number) => {
    const response = await apiRequest('GET', `/api/teacher/${id}/students`);
    return response.json();
  },

  createStudent: async (teacherId: number, studentData: any) => {
    const response = await apiRequest('POST', `/api/teacher/${teacherId}/students`, studentData);
    return response.json();
  },

  uploadExcel: async (teacherId: number, file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await uploadFile(`/api/teacher/${teacherId}/students/upload-excel`, formData, onProgress);
    return response.json();
  },

  uploadFile: async (teacherId: number, fileData: FormData, onProgress?: (progress: number) => void) => {
    const response = await uploadFile(`/api/teacher/${teacherId}/files`, fileData, onProgress);
    return response.json();
  }
};

export const parentApi = {
  getCaptcha: async () => {
    const response = await apiRequest('GET', '/api/captcha');
    return response.json();
  },

  verifyStudent: async (data: {
    civilId: string;
    captchaId: number;
    captchaAnswer: string;
    linkCode: string;
  }) => {
    const response = await apiRequest('POST', '/api/verify-student', data);
    return response.json();
  },

  getStudentFiles: async (civilId: string, teacherId: number) => {
    const response = await apiRequest('GET', `/api/student/${civilId}/files?teacherId=${teacherId}`);
    return response.json();
  }
};

// Utility for invalidating queries after mutations
export const invalidateQueries = (patterns: string[]) => {
  patterns.forEach(pattern => {
    queryClient.invalidateQueries({ queryKey: [pattern] });
  });
};
