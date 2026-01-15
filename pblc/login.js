import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  const token = req.query?.token;
  if (!token || token !== process.env.PROF_LOG_TOKEN) {
    return res.status(401).send("Unauthorized");
  }

  const items = await kv.lrange("prof:accessLog", 0, 50);
  res.status(200).json({ count: items.length, items });
}