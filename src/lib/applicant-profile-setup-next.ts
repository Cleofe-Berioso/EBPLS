export const APPLICANT_PROFILE_SETUP_NEXT_KEY = "ebpls:applicant-profile-setup-next";

export const APPLICANT_PROFILE_SETUP_PATH = "/applicant/profile-picture/setup";

export function isAllowedApplicantNextPath(value: string | null | undefined): value is string {
  if (!value) return false;

  if (!value.startsWith("/applicant/")) return false;
  if (value.startsWith(APPLICANT_PROFILE_SETUP_PATH)) return false;
  if (value.includes("://")) return false;
  if (value.startsWith("//")) return false;

  return true;
}

export function readApplicantProfileSetupNextPath(): string {
  if (typeof window === "undefined") {
    return "/applicant/dashboard";
  }

  const stored = window.sessionStorage.getItem(APPLICANT_PROFILE_SETUP_NEXT_KEY);
  if (isAllowedApplicantNextPath(stored)) {
    return stored;
  }

  return "/applicant/dashboard";
}

export function writeApplicantProfileSetupNextPath(nextPath: string): void {
  if (typeof window === "undefined") return;
  if (!isAllowedApplicantNextPath(nextPath)) return;
  window.sessionStorage.setItem(APPLICANT_PROFILE_SETUP_NEXT_KEY, nextPath);
}

export function clearApplicantProfileSetupNextPath(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(APPLICANT_PROFILE_SETUP_NEXT_KEY);
}
