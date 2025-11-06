export const highlightText = (
  text: string,
  searchText: string
): string => {
  if (!searchText || !text) return text;

  const regex = new RegExp(`(${escapeRegExp(searchText)})`, 'gi');
  return text.replace(regex, '<mark class="bg-highlight/30 transition-colors">$1</mark>');
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
