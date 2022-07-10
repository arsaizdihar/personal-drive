import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { isAuthValid } from "../../utils/server/jwt";
import { createRouter } from "./context";

export const driveRouter = createRouter()
  .middleware(async ({ ctx, next }) => {
    if (!isAuthValid(ctx.req)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next();
  })
  .query("appList", {
    async resolve({ ctx: { db } }) {
      const apps = await db.app.findMany({
        orderBy: { name: "asc" },
        select: { name: true, id: true },
      });
      return apps;
    },
  })
  .query("app.apiKeys", {
    input: z.string(),
    async resolve({ ctx: { db }, input }) {
      const app = await db.app.findUnique({
        where: { name: input },
        include: { apiKeys: true },
      });
      if (!app) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return app;
    },
  })
  .query("app.files", {
    input: z.object({ name: z.string(), paths: z.array(z.string()) }),
    async resolve({ ctx: { db }, input }) {
      const path = "/" + input.paths.join("/");
      console.log(path);
      const app = await db.app.findUnique({
        where: { name: input.name },
        include: { folders: { where: { path } } },
      });

      return app;
    },
  })
  .mutation("createApp", {
    input: z.string().min(1),
    async resolve({ ctx: { db }, input }) {
      try {
        const app = await db.app.create({
          data: {
            name: input,
          },
        });
        return app;
      } catch (error) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }
    },
  })
  .mutation("createApiKey", {
    input: z.string(),
    async resolve({ ctx: { db }, input }) {
      try {
        const apiKey = await db.apiKey.create({
          data: {
            app: { connect: { name: input } },
          },
        });
        return apiKey;
      } catch (error) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }
    },
  })
  .mutation("deleteApiKey", {
    input: z.object({ appName: z.string(), id: z.number() }),
    async resolve({ ctx: { db }, input }) {
      const key = await db.apiKey.findUnique({
        where: { id: input.id },
        select: { app: { select: { name: true } } },
      });
      if (!key || key.app.name !== input.appName) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return await db.apiKey.delete({ where: { id: input.id } });
    },
  })
  .mutation("deleteApp", {
    input: z.string(),
    async resolve({ ctx: { db }, input }) {
      try {
        const [app] = await Promise.all([
          db.app.delete({ where: { name: input } }),
          db.folder.deleteMany({ where: { App: { name: input } } }),
        ]);
        return app;
      } catch (error) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }
    },
  });
