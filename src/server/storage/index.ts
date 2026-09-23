import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from "@/lib/constants";
import { AppError } from "@/server/errors";

type AllowedType = (typeof ALLOWED_IMAGE_TYPES)[number];

/** Validate by magic bytes — never trust the client-provided MIME type. */
export function sniffImageType(buf: Uint8Array): AllowedType | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  const ascii = (s: number, e: number) => String.fromCharCode(...buf.slice(s, e));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (ascii(4, 8) === "ftyp" && /avi[fs]/.test(ascii(8, 12))) return "image/avif";
  return null;
}

const EXT: Record<AllowedType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export async function storeImage(file: File, folder: "vehicles" | "events" | "avatars") {
  if (file.size === 0) throw new AppError("The file is empty.");
  if (file.size > MAX_UPLOAD_BYTES) throw new AppError("Images must be 8 MB or smaller.");
  const buf = new Uint8Array(await file.arrayBuffer());
  const type = sniffImageType(buf);
  if (!type) throw new AppError("Only JPEG, PNG, WebP, or AVIF images are allowed.");

  const driver = process.env.STORAGE_DRIVER ?? "local";
  if (driver === "cloudinary") return uploadToCloudinary(buf, type, folder);
  return saveLocally(buf, type, folder);
}

async function saveLocally(buf: Uint8Array, type: AllowedType, folder: string) {
  const name = `${folder}-${Date.now().toString(36)}-${randomBytes(8).toString("hex")}.${EXT[type]}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buf);
  return `/uploads/${name}`;
}

async function uploadToCloudinary(buf: Uint8Array, type: AllowedType, folder: string) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) throw new Error("Cloudinary is not configured");

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const params = `folder=street-car/${folder}&timestamp=${timestamp}`;
  const signature = createHash("sha1").update(params + secret).digest("hex");

  const form = new FormData();
  form.append("file", new Blob([buf as BlobPart], { type }));
  form.append("folder", `street-car/${folder}`);
  form.append("timestamp", timestamp);
  form.append("api_key", key);
  form.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Cloudinary upload failed with ${res.status}`);
  const json = (await res.json()) as { secure_url: string };
  return json.secure_url;
}
