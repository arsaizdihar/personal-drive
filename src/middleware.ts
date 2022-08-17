import { NextRequest, NextResponse } from "next/server";

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  if (
    url.pathname !== "/" &&
    !url.pathname.startsWith("/app") &&
    !url.pathname.startsWith("/keys")
  ) {
    return NextResponse.next();
  }
  const cookie = request.cookies.get("token");

  if (!cookie) {
    return NextResponse.redirect(`${url.origin}/login`);
  }

  return NextResponse.next();
}
