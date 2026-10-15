export type ReviewLoginError = "password" | "locked";

export const REVIEW_LOGIN_PASSWORD_MESSAGE = "That password did not match.";
export const REVIEW_LOGIN_LOCKED_MESSAGE =
  "Too many attempts, try again in 15 minutes.";

export function reviewLoginErrorFromQuery(
  error: string | undefined,
): ReviewLoginError | null {
  if (error === "locked") {
    return "locked";
  }
  if (error === "1") {
    return "password";
  }
  return null;
}

export function reviewLoginErrorMessage(
  error: ReviewLoginError | null,
): string | null {
  switch (error) {
    case "password":
      return REVIEW_LOGIN_PASSWORD_MESSAGE;
    case "locked":
      return REVIEW_LOGIN_LOCKED_MESSAGE;
    case null:
      return null;
    default: {
      const _exhaustive: never = error;
      return _exhaustive;
    }
  }
}

export function prefersHtmlLoginError(request: Request): boolean {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return false;
  }
  const accept = request.headers.get("accept") ?? "";
  return (
    accept.includes("text/html") ||
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  );
}
