import { NextApiRequest, NextApiResponse } from "next";
import { isAuthValid } from "../../utils/server/jwt";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!isAuthValid(req)) {
    return res.json(false);
  } else {
    return res.json(true);
  }
}
