import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_BUILD_OUTPUT_DIR ?? ".next",
  async rewrites() {
    const backend = process.env.BACKEND_API_ORIGIN ?? "http://127.0.0.1:8000";
    const routes = [
      ["/api/session/start", "/api/v1/auth/login"],
      ["/api/session/register", "/api/v1/auth/register"],
      ["/api/session/renew", "/api/v1/auth/refresh"],
      ["/api/session/end", "/api/v1/auth/logout"],
      ["/api/session/current", "/api/v1/auth/me"],
      ["/api/identity/google/start", "/api/v1/auth/google/login"],
      ["/api/identity/google/callback", "/api/v1/auth/google/callback"],
      ["/api/account", "/api/v1/users/me"],
      ["/api/learning/catalog", "/api/v1/courses"],
      ["/api/learning/catalog/:slug", "/api/v1/courses/:slug"],
      ["/api/learning/lessons/:slug", "/api/v1/lessons/:slug"],
      ["/api/learning/progress", "/api/v1/progress/me"],
      ["/api/learning/progress/lessons/:lessonId", "/api/v1/progress/lessons/:lessonId"],
      ["/api/learning/assessment", "/api/v1/quizzes/final"],
      ["/api/learning/assessment/attempts", "/api/v1/quizzes/final/attempts"],
      ["/api/community/channels", "/api/v1/forum/channels"],
      ["/api/community/channels/:slug/posts", "/api/v1/forum/channels/:slug/posts"],
      ["/api/learning/team-checklist", "/api/v1/group-task"],
    ] as const;

    return routes.map(([source, destination]) => ({ source, destination: `${backend}${destination}` }));
  },
};

export default nextConfig;
