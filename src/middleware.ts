import { NextRequest, NextResponse } from "next/server";

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  console.log(url.hostname);
  if (url.hostname === "file.arsaizdihar.com") {
    const oneYear = 60 * 60 * 24 * 365;
    return NextResponse.rewrite(
      `https://ars.is3.cloudhost.id${url.pathname}}`,
      {
        status: 301,
        headers: { "Cache-Control": `public, max-age=${oneYear}` },
      }
    );
  }
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
