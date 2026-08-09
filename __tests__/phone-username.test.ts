import { describe, expect, it } from "vitest";
import { hashOtp, normalizeOtpCode, normalizePhone } from "../lib/phone";
import { normalizeIgUsername } from "../lib/instagram-username";

describe("normalizePhone", () => {
  it("normalizes local TZ numbers", () => {
    expect(normalizePhone("0763577901")).toBe("255763577901");
    expect(normalizePhone("255763577901")).toBe("255763577901");
  });
});

describe("normalizeOtpCode", () => {
  it("strips spaces", () => {
    expect(normalizeOtpCode("12 34 56")).toBe("123456");
  });
});

describe("hashOtp", () => {
  it("is stable", () => {
    expect(hashOtp("123456")).toBe(hashOtp("123456"));
  });
});

describe("normalizeIgUsername", () => {
  it("strips @ and lowercases", () => {
    expect(normalizeIgUsername("@Nate_Codes")).toBe("nate_codes");
  });
});
