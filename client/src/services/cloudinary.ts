/**
 * cloudinary.ts — Direct browser-to-Cloudinary upload (unsigned).
 *
 * No backend needed. Images go straight to Cloudinary CDN.
 * Returns optimized URL with auto-format and auto-quality.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD || "";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET || "vsv_products";
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export interface UploadResult {
  url: string;        // optimized delivery URL
  publicId: string;   // Cloudinary public ID (for deletion)
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Upload a single file to Cloudinary.
 * @param file - File or Blob to upload
 * @param folder - optional folder in Cloudinary (e.g. "products")
 * @returns UploadResult with optimized URL
 */
export async function uploadImage(file: File, folder = "vsv/products"): Promise<UploadResult> {
  if (!CLOUD_NAME) {
    throw new Error("VITE_CLOUDINARY_CLOUD is not set. Add it to .env.local");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", folder);

  const res = await fetch(UPLOAD_URL, { method: "POST", body: formData });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Upload failed (${res.status})`);
  }

  const data = await res.json();

  // Return optimized URL with auto-format (WebP/AVIF) and auto-quality
  const optimizedUrl = data.secure_url.replace(
    "/upload/",
    "/upload/f_auto,q_auto/"
  );

  return {
    url: optimizedUrl,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
    format: data.format,
    bytes: data.bytes,
  };
}

/**
 * Upload multiple files in parallel.
 * @param files - FileList or File array
 * @param folder - Cloudinary folder
 * @param onProgress - callback with (completed, total)
 */
export async function uploadMultiple(
  files: File[],
  folder = "vsv/products",
  onProgress?: (completed: number, total: number) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  let completed = 0;

  // Upload max 3 in parallel
  const chunks: File[][] = [];
  for (let i = 0; i < files.length; i += 3) {
    chunks.push(files.slice(i, i + 3));
  }

  for (const chunk of chunks) {
    const batch = await Promise.all(
      chunk.map((f) => uploadImage(f, folder))
    );
    results.push(...batch);
    completed += chunk.length;
    onProgress?.(completed, files.length);
  }

  return results;
}

/**
 * Check if Cloudinary is configured.
 */
export function isCloudinaryConfigured(): boolean {
  return !!CLOUD_NAME;
}