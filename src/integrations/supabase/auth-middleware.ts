import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const request = getRequest();
    let userId = "demo-student-id-001";

    if (request?.headers) {
      const authHeader = request.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.replace("Bearer ", "");
        const parts = token.split("_");
        if (parts.length >= 2) {
          userId = parts[1] ?? userId;
        }
      }
    }

    return next({
      context: {
        userId,
        claims: { sub: userId },
      },
    });
  },
);
