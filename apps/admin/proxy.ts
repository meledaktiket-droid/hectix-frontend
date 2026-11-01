import { NextRequest, NextResponse } from "next/server";
import { callApi, type ApiSession } from "./lib/api";
import { STAFF_ROLES } from "./lib/roles";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/auth")) return NextResponse.next();
  if (pathname.startsWith("/invite")) return NextResponse.next();

  const res = await callApi<ApiSession>("/api/auth/get-session", {
    cookie: request.headers.get("cookie") ?? "",
    host: request.headers.get("host") ?? "",
  });
  const session = res.status === 200 ? res.data : null;
  const isStaff = STAFF_ROLES.has(session?.user.role ?? "");
  const isLoginPage = pathname === "/";

  if (isLoginPage) {
    if (isStaff) return NextResponse.redirect(new URL("/dashboard", request.url));
    return NextResponse.next();
  }

  if (!isStaff) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/|uploads/|_next/static|_next/image|favicon.ico).*)"],
};
