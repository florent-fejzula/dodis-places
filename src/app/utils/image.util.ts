/**
 * Shrinks a photo before upload. A phone camera shot is 4-12 MB, which is
 * slow on mobile data and can bust the 10 MB storage limit; 2400px on the
 * long side keeps small print in a recipe card readable at full-screen zoom.
 *
 * Returns the original file when it is already small, or when the browser
 * can't decode it (the upload then decides whether it is acceptable).
 */
export async function downscaleImage(
  file: File,
  maxSide = 2400,
  quality = 0.86
): Promise<File> {
  try {
    // Honours the EXIF rotation, so portrait phone photos stay upright
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));

    if (scale === 1 && file.size < 1_500_000) {
      bitmap.close();
      return file;
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', quality)
    );
    if (!blob || blob.size >= file.size) return file;

    const base = file.name?.replace(/\.[^/.]+$/, '') || 'photo';
    return new File([blob], `${base}.webp`, { type: 'image/webp' });
  } catch {
    return file;
  }
}
