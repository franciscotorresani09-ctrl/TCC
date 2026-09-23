import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth-guard";
import { AppError, GENERIC_ERROR } from "@/server/errors";
import { checkRateLimit, LIMITS } from "@/server/security/rate-limit";
import { storeImage } from "@/server/storage";

export const runtime = "nodejs";

const FOLDERS = ["vehicles", "events", "avatars"] as const;

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in to upload photos." }, { status: 401 });

  if (!checkRateLimit(`upload:${user.id}`, LIMITS.upload).success) {
    return NextResponse.json({ error: "Too many uploads. Please wait a moment." }, { status: 429 });
  }

  // Reject cross-site uploads.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const folder = String(form.get("folder") ?? "vehicles");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });
    if (!FOLDERS.includes(folder as (typeof FOLDERS)[number])) {
      return NextResponse.json({ error: "Invalid upload destination." }, { status: 400 });
    }
    const url = await storeImage(file, folder as (typeof FOLDERS)[number]);
    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("[street-car] upload failed", err);
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
  }
}
