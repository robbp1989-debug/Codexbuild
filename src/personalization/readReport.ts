import { validateDocxArchive } from './reportLimits';
const MAX_FILE = 4 * 1024 * 1024;
const MAX_TEXT = 80000;
export async function readReport(file: File): Promise<string> {
  if (!file.size || file.size > MAX_FILE)
    throw new Error('Choose a nonempty report up to 4 MB.');
  const extension = file.name.split('.').pop()?.toLowerCase();
  let text = '';
  if (['txt', 'md', 'markdown', 'csv', 'json'].includes(extension || ''))
    text = await file.text();
  else if (extension === 'pdf') {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString();
    const task = pdfjs.getDocument({
      data: await file.arrayBuffer(),
      useSystemFonts: true,
    });
    try {
      const pdf = await task.promise;
      if (pdf.numPages > 80)
        throw new Error(
          'Please choose a report of 80 pages or fewer, or paste a relevant excerpt.',
        );
      for (let page = 1; page <= pdf.numPages; page++) {
        const content = await (await pdf.getPage(page)).getTextContent();
        text +=
          content.items
            .map((item) =>
              'str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : '',
            )
            .join('') + '\n\n';
        if (text.length > MAX_TEXT)
          throw new Error(
            'This report is too long. Paste a relevant excerpt instead.',
          );
      }
    } finally {
      await task.destroy();
    }
  } else if (extension === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    validateDocxArchive(arrayBuffer);
    const mammoth = await import('mammoth/mammoth.browser.js');
    text = (await mammoth.extractRawText({ arrayBuffer })).value;
  } else
    throw new Error(
      'Choose TXT, Markdown, CSV, JSON, PDF, or DOCX, or paste an excerpt.',
    );
  if (text.length > MAX_TEXT)
    throw new Error(
      'This report is too long. Paste a relevant excerpt instead.',
    );
  text = text.split(String.fromCharCode(0)).join('').trim();
  if (!text || text.includes('\ufffd'))
    throw new Error(
      'Readable text was not found. For a scan or unsupported encoding, copy and paste the relevant text.',
    );
  return text;
}
