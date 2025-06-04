import { useQuery } from "@tanstack/react-query";
import type { Teacher } from "@shared/schema";

export function useTeacher(teacherId: number) {
  return useQuery<Teacher>({
    queryKey: [`/api/teacher/${teacherId}`],
    enabled: !!teacherId,
  });
}

export function useTeacherStats(teacherId: number) {
  return useQuery({
    queryKey: [`/api/teacher/${teacherId}/stats`],
    enabled: !!teacherId,
  });
}

export function useTeacherStudents(teacherId: number) {
  return useQuery({
    queryKey: [`/api/teacher/${teacherId}/students`],
    enabled: !!teacherId,
  });
}
