import { describe, expect, it } from "vitest";
import {
  REVIEW_LOGIN_LOCKED_MESSAGE,
  REVIEW_LOGIN_PASSWORD_MESSAGE,
  prefersHtmlLoginError,
  reviewLoginErrorFromQuery,
  reviewLoginErrorMessage,
} from "@/lib/review/login-errors";

describe("review login errors", () => {
  it("maps query params to the password and lockout states", () => {
    expect(reviewLoginErrorFromQuery("1")).toBe("password");
    expect(reviewLoginErrorFromQuery("locked")).toBe("locked");
    expect(reviewLoginErrorFromQuery(undefined)).toBeNull();
    expect(reviewLoginErrorFromQuery("other")).toBeNull();
  });

  it("returns the lockout copy for the locked state", () => {
    expect(reviewLoginErrorMessage("locked")).toBe(REVIEW_LOGIN_LOCKED_MESSAGE);
    expect(reviewLoginErrorMessage("password")).toBe(
      REVIEW_LOGIN_PASSWORD_MESSAGE,
    );
    expect(reviewLoginErrorMessage(null)).toBeNull();
  });

  it("treats HTML Accept or form-urlencoded posts as form errors", () => {
    expect(
      prefersHtmlLoginError(
        new Request("http://localhost/api/review/login", {
          headers: { Accept: "text/html" },
        }),
      ),
    ).toBe(true);
    expect(
      prefersHtmlLoginError(
        new Request("http://localhost/api/review/login", {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }),
      ),
    ).toBe(true);
  });

  it("treats JSON fetch as an API error, not a form redirect", () => {
    expect(
      prefersHtmlLoginError(
        new Request("http://localhost/api/review/login", {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }),
      ),
    ).toBe(false);
  });
});
