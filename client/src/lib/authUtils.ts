export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*/.test(error.message) || error.message.includes('Unauthorized');
}

export function handleAuthError(error: Error, toast: any) {
  if (isUnauthorizedError(error)) {
    toast({
      title: "انتهت جلسة العمل",
      description: "يرجى تسجيل الدخول مرة أخرى...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/auth/google";
    }, 1000);
    return true;
  }
  return false;
}
