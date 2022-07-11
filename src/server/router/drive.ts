import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { isAuthValid } from "../../utils/server/jwt";
import { deleteRecursive, s3 } from "../s3";
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
      const path = input.paths.join("/");
      const app = await db.app.findUnique({
        where: { name: input.name },
      });
      if (!app) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      const prefix = `${app.name}/${path ? path + "/" : ""}`;

      const files = await s3
        .listObjectsV2({
          Bucket: "ars",
          Prefix: prefix,
          Delimiter: "/",
        })
        .promise();
      const contents = files.Contents;
      const folders = files.CommonPrefixes;
      if (!contents || !folders) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (contents[0]?.Key === prefix) {
        contents.shift();
      }

      return {
        app,
        folders: folders.map((folder) => folder.Prefix!.replace(prefix, "")),
        files: contents.map((file) => ({
          name: file.Key!.replace(prefix, ""),
          link: `https://file.arsaizdihar.com/${file.Key}`,
        })),
      };
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
        await Promise.all([
          db.apiKey.deleteMany({ where: { app: { name: input } } }),
        ]);
        return await db.app.delete({ where: { name: input } });
      } catch (error) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }
    },
  })
  .mutation("createFolder", {
    input: z.object({
      appName: z.string(),
      path: z.string().optional(),
      name: z.string(),
    }),
    async resolve({ ctx: { db }, input }) {
      const app = await db.app.findUnique({
        where: { name: input.appName },
      });
      if (!app) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      const path = input.path ? "/" + input.path : "/";
      const key = `${app.name}${path}${input.name}/`;
      const result = await s3
        .upload({
          Bucket: "ars",
          Key: key,
          Body: "",
        })
        .promise();

      return result.Key;
    },
  })
  .mutation("deleteFolder", {
    input: z.object({
      appName: z.string(),
      path: z.string(),
      name: z.string(),
    }),
    async resolve({ ctx: { db }, input }) {
      const app = await db.app.findUnique({
        where: { name: input.appName },
      });
      if (!app) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      const path = input.path ? "/" + input.path : "/";
      const key = `${app.name}${path}${input.name}/`;
      const count = await deleteRecursive("ars", key);
      return count;
    },
  })
  .mutation("deleteFile", {
    input: z.object({
      appName: z.string(),
      path: z.string(),
      name: z.string(),
    }),
    async resolve({ ctx: { db }, input }) {
      const app = await db.app.findUnique({
        where: { name: input.appName },
      });
      if (!app) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      const path = input.path ? "/" + input.path : "/";
      const key = `${app.name}${path}${input.name}`;
      const result = await s3
        .deleteObject({
          Bucket: "ars",
          Key: key,
        })
        .promise();
      return result.DeleteMarker;
    },
  });
