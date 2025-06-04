import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: teacher, isLoading, error } = useQuery({
    queryKey: ["/api/auth/teacher"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    teacher,
    isLoading,
    isAuthenticated: !!teacher,
    error,
  };
}
