import { Id, TableNames } from "../../convex/_generated/dataModel";

/**
 * Validates if a string is a valid Convex ID format
 * Convex IDs are base32 encoded strings with specific length and format
 */
export function isValidConvexId(id: string): boolean {
  if (!id || typeof id !== "string") {
    return false;
  }

  // Convex IDs are typically 32 characters long and contain only base32 characters
  // Base32 uses characters: ABCDEFGHIJKLMNOPQRSTUVWXYZ234567
  const convexIdRegex = /^[a-z0-9]{32}$/;
  return convexIdRegex.test(id);
}

/**
 * Safely casts a string to a Convex ID if valid, otherwise returns null
 */
export function safeConvexId<TableName extends TableNames>(
  id: string,
): Id<TableName> | null {
  if (isValidConvexId(id)) {
    return id as Id<TableName>;
  }
  return null;
}

/**
 * Checks if an error is related to invalid Convex ID validation
 */
export function isConvexValidationError(error: unknown): boolean {
  if (error && typeof error === "object" && "message" in error) {
    const message = error.message as string;
    return (
      message.includes("ArgumentValidationError") ||
      message.includes("Value does not match validator") ||
      message.includes("v.id(")
    );
  }
  return false;
}
