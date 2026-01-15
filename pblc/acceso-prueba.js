import { kv } from "@vercel/kv";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).send("Método No Permitido");
  }

  let payload = request.body;
  if (typeof payload === "string") {
    payload = JSON.parse(payload);
  }

  if (!payload?.sessionId || !payload?.ts) {
    return response.status(400).send("Solicitud Inválida");
  }

  await kv.lpush("prof:accessLog", JSON.stringify(payload));
  response.status(200).send("Aceptado");
}