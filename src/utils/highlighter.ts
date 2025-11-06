export const highlightText = (
  text: string,
  searchText: string
): string => {
  if (!searchText || !text) return text;

  // Normalize whitespace
  const normalizedSearch = searchText.trim().replace(/\s+/g, ' ');
  const regex = new RegExp(`(${escapeRegExp(normalizedSearch)})`, 'i');
  
  return text.replace(regex, '<mark class="bg-yellow-300 dark:bg-yellow-600 transition-all duration-200 animate-pulse">$1</mark>');
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
