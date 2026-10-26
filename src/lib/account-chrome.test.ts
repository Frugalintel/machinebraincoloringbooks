import { describe, expect, it } from "vitest";
import { accountColumnLinks, accountLabel } from "@/lib/account-chrome";

describe("accountLabel", () => {
  it("says Sign in when there is no session", () => {
    expect(accountLabel(null)).toBe("Sign in");
  });

  it("prefers a display name, then initials, then the email prefix", () => {
    expect(
      accountLabel({
        email: "qa@example.com",
        initials: "QA",
        displayName: "Ada",
      }),
    ).toBe("Ada");
    expect(accountLabel({ email: "qa@example.com", initials: "QA" })).toBe(
      "QA",
    );
    expect(accountLabel({ email: "collector@example.com" })).toBe("CO");
  });
});

describe("accountColumnLinks", () => {
  it("keeps the existing guest copy on each footer", () => {
    expect(accountColumnLinks(false, "home").map((link) => link.name)).toEqual([
      "Sign in",
      "Create account",
      "Order lookup",
    ]);
    expect(accountColumnLinks(false, "site").map((link) => link.name)).toEqual([
      "Sign in",
      "Register",
      "Order lookup",
      "Help",
    ]);
  });

  it("swaps Sign in / Register for Profile and a labelled Sign out", () => {
    expect(accountColumnLinks(true, "home")).toEqual([
      { name: "Profile and orders", href: "/profile/me" },
      { name: "Sign out", action: "sign-out" },
      { name: "Order lookup", href: "/orders/lookup" },
    ]);
    expect(accountColumnLinks(true, "site").map((link) => link.name)).toEqual([
      "Profile and orders",
      "Sign out",
      "Order lookup",
      "Help",
    ]);
  });
});
