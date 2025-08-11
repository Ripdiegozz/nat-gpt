import { describe, it, expect } from "vitest";
import { MessageRole, isValidMessageRole } from "../message-role";

describe("MessageRole", () => {
  describe("enum values", () => {
    it("should have USER role", () => {
      expect(MessageRole.USER).toBe("user");
    });

    it("should have ASSISTANT role", () => {
      expect(MessageRole.ASSISTANT).toBe("assistant");
    });

    it("should have exactly 2 roles", () => {
      const roles = Object.values(MessageRole);
      expect(roles).toHaveLength(2);
      expect(roles).toContain("user");
      expect(roles).toContain("assistant");
    });
  });

  describe("isValidMessageRole", () => {
    it("should return true for valid USER role", () => {
      expect(isValidMessageRole("user")).toBe(true);
    });

    it("should return true for valid ASSISTANT role", () => {
      expect(isValidMessageRole("assistant")).toBe(true);
    });

    it("should return false for invalid role", () => {
      expect(isValidMessageRole("invalid")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(isValidMessageRole("")).toBe(false);
    });

    it("should return false for null", () => {
      expect(isValidMessageRole(null as unknown as MessageRole)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isValidMessageRole(undefined as unknown as MessageRole)).toBe(
        false
      );
    });

    it("should return false for number", () => {
      expect(isValidMessageRole(123 as unknown as MessageRole)).toBe(false);
    });

    it("should be case sensitive", () => {
      expect(isValidMessageRole("USER")).toBe(false);
      expect(isValidMessageRole("User")).toBe(false);
      expect(isValidMessageRole("ASSISTANT")).toBe(false);
      expect(isValidMessageRole("Assistant")).toBe(false);
    });
  });
});
