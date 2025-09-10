import { nanoid, customAlphabet } from "nanoid";

// Generate alphanumeric room codes (6 characters)
// Exclude similar looking characters: 0, O, I, 1, l
const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const generateRoomCode = customAlphabet(alphabet, 6);

/**
 * Generates a unique 6-digit room code
 * Uses custom alphabet to avoid confusion between similar characters
 */
export function createRoomCode(): string {
	return generateRoomCode();
}

/**
 * Validates if a room code has the correct format
 */
export function isValidRoomCode(code: string): boolean {
	if (!code || code.length !== 6) return false;
	return /^[A-Za-z0-9]{6}$/.test(code);
}

/**
 * Formats a room code for display (adds spaces for better readability)
 * Example: "ABC123" -> "ABC 123"
 */
export function formatRoomCode(code: string): string {
	if (!isValidRoomCode(code)) return code;
	return `${code.slice(0, 3)} ${code.slice(3)}`;
}

/**
 * Removes formatting from room code (removes spaces)
 * Example: "ABC 123" -> "ABC123"
 */
export function normalizeRoomCode(code: string): string {
	return code.replace(/\s/g, "").toUpperCase();
}
