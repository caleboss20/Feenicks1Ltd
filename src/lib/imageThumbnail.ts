/**
 * Makes a small square thumbnail of a photo (centre-cropped), as a JPEG
 * data URL: a few kilobytes, sharp at avatar size on high-density screens.
 *
 * Used for the profile picture in demo mode, where it's kept in the browser.
 * In production the server stores the full photo and serves its own sizes.
 *
 * Returns null if the browser can't read the image (e.g. some HEIC files).
 */
export async function makeSquareThumbnail(image: Blob, size = 192): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(image);
    const side = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) return null;

    // Centre crop to a square, then scale down.
    context.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      size,
      size,
    );
    bitmap.close();
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return null;
  }
}
