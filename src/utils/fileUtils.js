export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file selected'));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      reject(new Error('File must be under 2 MB for local storage.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve({ dataUrl: reader.result, mimeType: file.type, fileName: file.name });
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function isViewableMime(mime) {
  return mime?.startsWith('image/') || mime === 'application/pdf';
}
