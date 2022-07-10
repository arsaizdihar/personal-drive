import { NextRequest, NextResponse } from "next/server";

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  if (url.pathname !== "/" && !url.pathname.startsWith("/[appName]")) {
    return NextResponse.next();
  }
  const cookie = request.cookies.get("token");

  if (!cookie) {
    return NextResponse.redirect(`${url.origin}/login`);
  }

  const valid = await fetch(`${url.origin}/api/check-auth`, {
    credentials: "include",
    headers: {
      Cookie: "token=" + cookie,
    },
  })
    .then((res) => res.json())
    .catch((err) => {
      console.log(err);
      return false;
    });
  if (!valid) {
    return NextResponse.redirect(`${url.origin}/login`);
  }
  return NextResponse.next();
}
