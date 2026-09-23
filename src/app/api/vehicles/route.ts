import { NextResponse } from "next/server";
import { parseFilters } from "@/lib/search/filters";
import { searchVehicles } from "@/server/services/vehicles";
import { getSessionUser } from "@/server/auth-guard";
import { getFavoriteIds } from "@/server/services/favorites";
import { checkRateLimit, LIMITS } from "@/server/security/rate-limit";

/** Public marketplace search endpoint (used for infinite scrolling). */
export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`search:${ip}`, LIMITS.interaction).success) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }
  try {
    const filters = parseFilters(new URL(request.url).searchParams);
    const [result, user] = await Promise.all([searchVehicles(filters), getSessionUser()]);
    const favs = await getFavoriteIds(user?.id);
    return NextResponse.json(
      { ...result, favoriteIds: result.items.filter((i) => favs.vehicles.has(i.id)).map((i) => i.id) },
      { headers: { "Cache-Control": user ? "private, no-store" : "public, s-maxage=30, stale-while-revalidate=120" } },
    );
  } catch (err) {
    console.error("[street-car] search failed", err);
    return NextResponse.json({ error: "Unable to load listings." }, { status: 500 });
  }
}
