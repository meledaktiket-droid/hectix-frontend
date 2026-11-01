import { NextRequest, NextResponse } from "next/server";

const publicRoutes = ["/", "/forgot-password", "/create-org"];

export function proxy(request: NextRequest) {
  const session =
    request.cookies.get("__Secure-organizer.session_token")?.value ||
    request.cookies.get("organizer.session_token")?.value;
  const { pathname } = request.nextUrl;

  const isPublic =
    publicRoutes.includes(pathname) || pathname.startsWith("/api/auth");

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (session && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/|uploads/|_next/static|_next/image|favicon.ico).*)"],
};
