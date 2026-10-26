import { describe, expect, it } from "vitest";
import {
  accountColumnLinks,
  accountLabel,
  headerAccountLinks,
  signInHref,
} from "@/lib/account-chrome";

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

  it("swaps Sign in / Register for Profile, Orders, and a labelled Sign out", () => {
    expect(accountColumnLinks(true, "home")).toEqual([
      { name: "Profile", href: "/profile/me" },
      { name: "Orders", href: "/profile/me#orders" },
      { name: "Sign out", action: "sign-out" },
      { name: "Order lookup", href: "/orders/lookup" },
    ]);
    expect(accountColumnLinks(true, "site").map((link) => link.name)).toEqual([
      "Profile",
      "Orders",
      "Sign out",
      "Order lookup",
      "Help",
    ]);
  });
});

describe("signInHref", () => {
  it("returns the reader to the page they were on", () => {
    expect(signInHref("/")).toBe("/auth?mode=login&next=%2F");
    expect(signInHref("/store")).toBe("/auth?mode=login&next=%2Fstore");
    expect(signInHref("/stories/lantern")).toBe(
      "/auth?mode=login&next=%2Fstories%2Flantern",
    );
    expect(signInHref("/auth")).toBe("/auth?mode=login");
  });

  it("lists Profile, Orders, and Sign out once a session exists", () => {
    expect(headerAccountLinks(true, "/")).toEqual([
      { name: "Profile", href: "/profile/me" },
      { name: "Orders", href: "/profile/me#orders" },
      { name: "Sign out", action: "sign-out" },
    ]);
    expect(headerAccountLinks(false, "/scan")[0]).toEqual({
      name: "Sign in",
      href: "/auth?mode=login&next=%2Fscan",
    });
  });
});
