import cookie from "cookie";
import superjson from "superjson";
import { createRouter } from "./context";

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { cookieOptions, getToken } from "../../utils/server/jwt";
import { driveRouter } from "./drive";
import { exampleRouter } from "./example";

export const appRouter = createRouter()
  .transformer(superjson)
  .mutation("login", {
    input: z.object({
      password: z.string(),
    }),
    async resolve({ input: { password }, ctx }) {
      if (password !== process.env.APP_PASSWORD) {
        throw new TRPCError({
          message: "Invalid password",
          code: "BAD_REQUEST",
        });
      }
      ctx.res.setHeader(
        "Set-Cookie",
        cookie.serialize("token", getToken(), cookieOptions)
      );
      return true;
    },
  })
  .merge("example.", exampleRouter)
  .merge("drive.", driveRouter);

// export type definition of API
export type AppRouter = typeof appRouter;
