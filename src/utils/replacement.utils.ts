/**
 * Finds the Nth occurrence of a substring in a string.
 * @param str The main string to search within.
 * @param substr The substring to search for.
 * @param n The occurrence index (0-based).
 * @returns The starting index of the Nth occurrence, or -1 if not found.
 */
export const nthIndexOf = (str: string, substr: string, n: number): number => {
  let i = -1;
  while (n-- >= 0 && i++ < str.length) {
    i = str.indexOf(substr, i);
    if (i < 0) break;
  }
  return i;
};

/**
 * Replaces the Nth occurrence of a substring in a string.
 * @param str The main string.
 * @param oldValue The substring to replace.
 * @param newValue The new string to insert.
 * @param occurrenceIndex The 0-based index of the occurrence to replace.
 * @returns The string with the replacement made, or the original string if not found.
 */
export const replaceNthOccurrence = (
  str: string,
  oldValue: string,
  newValue: string,
  occurrenceIndex: number
): string => {
  const index = nthIndexOf(str, oldValue, occurrenceIndex);

  if (index === -1) {
    // Fallback or error: if the specific occurrence isn't found,
    // maybe just do a simple replace, or log a warning.
    // For now, we return the original string to be safe.
    console.warn(
      `Could not find occurrence ${occurrenceIndex} of "${oldValue}". No replacement made.`
    );
    return str;
  }

  const prefix = str.substring(0, index);
  const suffix = str.substring(index + oldValue.length);

  return prefix + newValue + suffix;
};
