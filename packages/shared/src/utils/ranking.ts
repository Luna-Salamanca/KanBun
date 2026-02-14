/**
 * Generate a lexorank-style order index
 * Uses simple integer strings for base positions, can be fractional for inserts.
 */
export function generateOrderIndex(index: number, subIndex?: number): string {
  if (subIndex !== undefined) {
    if (subIndex < 0 || subIndex >= 26) {
      throw new RangeError(`subIndex must be between 0 and 25, got ${subIndex}`);
    }
    return `${String(index).padStart(10, '0')}|${String.fromCharCode(97 + subIndex)}`;
  }
  return String(index).padStart(10, '0');
}
