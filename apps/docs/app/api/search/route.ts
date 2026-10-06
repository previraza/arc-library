import { NextResponse } from "next/server";
import { search } from "@/lib/search";

/** Ranked site search behind the header dialog. */
export function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  return NextResponse.json({ results: search(query) });
}