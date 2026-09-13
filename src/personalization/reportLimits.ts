// Inspect the ZIP central directory before DOCX decompression. No ZIP64 or multi-disk archives.
export function validateDocxArchive(buffer: ArrayBuffer) {
  const view = new DataView(buffer);
  let end = -1;
  for (
    let i = view.byteLength - 22;
    i >= Math.max(0, view.byteLength - 65557);
    i--
  )
    if (view.getUint32(i, true) === 0x06054b50) {
      end = i;
      break;
    }
  if (end < 0) throw new Error('This DOCX is not a readable Word document.');
  const count = view.getUint16(end + 10, true);
  let offset = view.getUint32(end + 16, true);
  let expanded = 0;
  if (count > 2000 || view.getUint16(end + 4, true) !== 0 || offset >= end)
    throw new Error('This DOCX is too complex. Paste an excerpt instead.');
  for (let i = 0; i < count; i++) {
    if (offset + 46 > end || view.getUint32(offset, true) !== 0x02014b50)
      throw new Error('This DOCX is damaged.');
    expanded += view.getUint32(offset + 24, true);
    if (expanded > 16 * 1024 * 1024)
      throw new Error(
        'This DOCX expands beyond the safe reading limit. Paste an excerpt instead.',
      );
    offset +=
      46 +
      view.getUint16(offset + 28, true) +
      view.getUint16(offset + 30, true) +
      view.getUint16(offset + 32, true);
  }
  if (offset > end) throw new Error('This DOCX is damaged.');
}
