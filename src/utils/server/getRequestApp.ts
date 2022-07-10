import { NextApiRequest } from "next";
import { db } from "~/server/db/client";
import { isAuthValid } from "./jwt";

export async function getRequestApp(req: NextApiRequest, appName: any) {
  const token = req.cookies["token"];
  if (token) {
    const valid = isAuthValid(req);
    if (!valid) {
      return;
    }
    if (typeof appName !== "string") {
      return;
    }
    const app = await db.app.findUnique({ where: { name: appName } });
    if (!app) {
      return;
    }
    return {
      id: app.id,
      name: app.name,
    };
  }
  const apiKey = req.headers.authorization?.split(" ")[1];
  if (!apiKey) {
    return;
  }
  const app = await db.apiKey.findUnique({
    where: { key: apiKey },
    select: { app: { select: { id: true, name: true } } },
  });

  if (!app) {
    return;
  }
  return {
    ...app.app,
  };
}
