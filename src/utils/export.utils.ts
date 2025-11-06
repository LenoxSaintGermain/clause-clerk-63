import html2pdf from 'html2pdf.js';

export const exportToPdf = async (
  content: string,
  fileName: string
): Promise<void> => {
  const element = document.createElement('div');
  element.style.padding = '20px';
  element.style.fontFamily = 'Georgia, serif';
  element.style.lineHeight = '1.6';
  element.innerHTML = content.replace(/\n/g, '<br>');

  const options = {
    margin: [10, 10, 10, 10] as [number, number, number, number],
    filename: fileName,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
  };

  await html2pdf().set(options).from(element).save();
};

export const downloadFile = (content: string | Blob, fileName: string): void => {
  const blob = typeof content === 'string' 
    ? new Blob([content], { type: 'text/plain' })
    : content;
    
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
