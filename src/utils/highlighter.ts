// Cache for memoization (limit size to prevent memory leaks)
const highlightCache = new Map<string, string>();
const MAX_CACHE_SIZE = 50;

export const highlightText = (
  text: string,
  searchText: string
): string => {
  if (!searchText || !text) return text;

  // Check cache first
  const cacheKey = `${text.substring(0, 100)}-${searchText}`;
  if (highlightCache.has(cacheKey)) {
    return highlightCache.get(cacheKey)!;
  }

  // Normalize whitespace
  const normalizedSearch = searchText.trim().replace(/\s+/g, ' ');
  const regex = new RegExp(`(${escapeRegExp(normalizedSearch)})`, 'i');
  
  const result = text.replace(regex, '<mark class="bg-yellow-300 dark:bg-yellow-600 transition-all duration-200 animate-pulse">$1</mark>');
  
  // Store in cache and manage size
  highlightCache.set(cacheKey, result);
  if (highlightCache.size > MAX_CACHE_SIZE) {
    const firstKey = highlightCache.keys().next().value;
    highlightCache.delete(firstKey);
  }
  
  return result;
};

export const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const scrollToText = (text: string, containerId: string): void => {
  const container = document.getElementById(containerId);
  if (!container) return;

  const elements = container.querySelectorAll('*');
  for (const element of Array.from(elements)) {
    if (element.textContent?.includes(text)) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      break;
    }
  }
};
