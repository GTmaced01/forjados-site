import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/inscricao") {
    const url = request.nextUrl.clone();
    url.pathname = "/inscricao-segura";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/inscricao"],
};
