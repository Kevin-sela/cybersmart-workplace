import { NextRequest, NextResponse } from "next/server";

const staticRoutes: Record<string, string> = {
  "/api/session/start": "/api/v1/auth/login",
  "/api/session/register": "/api/v1/auth/register",
  "/api/session/renew": "/api/v1/auth/refresh",
  "/api/session/end": "/api/v1/auth/logout",
  "/api/session/current": "/api/v1/auth/me",
  "/api/identity/google/start": "/api/v1/auth/google/login",
  "/api/identity/google/callback": "/api/v1/auth/google/callback",
  "/api/account": "/api/v1/users/me",
  "/api/learning/catalog": "/api/v1/courses",
  "/api/learning/progress": "/api/v1/progress/me",
  "/api/learning/assessment": "/api/v1/quizzes/final",
  "/api/learning/assessment/attempts": "/api/v1/quizzes/final/attempts",
  "/api/community/channels": "/api/v1/forum/channels",
  "/api/learning/team-checklist": "/api/v1/group-task",
};

function resolveBackendPath(path: string): string | null {
  const exact = staticRoutes[path];
  if (exact) return exact;

  const patterns: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
    [/^\/api\/learning\/catalog\/([^/]+)$/, (m) => `/api/v1/courses/${m[1]}`],
    [/^\/api\/learning\/lessons\/([^/]+)$/, (m) => `/api/v1/lessons/${m[1]}`],
    [/^\/api\/learning\/progress\/lessons\/([^/]+)$/, (m) => `/api/v1/progress/lessons/${m[1]}`],
    [/^\/api\/community\/channels\/([^/]+)\/posts$/, (m) => `/api/v1/forum/channels/${m[1]}/posts`],
  ];

  for (const [pattern, buildPath] of patterns) {
    const match = path.match(pattern);
    if (match) return buildPath(match);
  }
  return null;
}

function isPrivateOrigin(value: string): boolean {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === "localhost" || host === "::1" || host.endsWith(".local") ||
      /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host);
  } catch {
    return true;
  }
}

function backendOrigin(): string {
  const configured = process.env.BACKEND_API_ORIGIN?.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") {
    return configured && !isPrivateOrigin(configured)
      ? configured
      : "https://cybersmart-workplace-api.onrender.com";
  }
  return configured || "http://127.0.0.1:8000";
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const publicPath = `/api/${path.join("/")}`;
  const backendPath = resolveBackendPath(publicPath);
  if (!backendPath) return NextResponse.json({ detail: "Not found" }, { status: 404 });

  const target = new URL(`${backendOrigin()}${backendPath}`);
  target.search = request.nextUrl.search;
  const headers = new Headers();
  for (const name of ["accept", "content-type", "cookie", "authorization", "origin", "user-agent"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
      redirect: "manual",
      cache: "no-store",
    });
    const responseHeaders = new Headers();
    for (const name of ["content-type", "cache-control", "location", "www-authenticate"]) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    for (const cookie of upstream.headers.getSetCookie()) responseHeaders.append("set-cookie", cookie);
    return new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return NextResponse.json({ detail: "The learning service is unavailable." }, { status: 502 });
  }
}

export const GET = proxy;
export const HEAD = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
