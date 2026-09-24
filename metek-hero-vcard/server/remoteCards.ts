import type { NextFunction, Request, Response } from "express";
import { cardSchema } from "../shared/schema";

export type RemoteCardsConfig = { url: string; key: string };
export function remoteCards(config: RemoteCardsConfig, audit: (actor: string, action: string, target?: string) => void) {
  const origin = new URL(config.url);
  if (origin.protocol !== "https:" && !["127.0.0.1","localhost"].includes(origin.hostname)) throw new Error("Kart servisi için HTTPS zorunludur.");
  if (config.key.length < 64) throw new Error("Kart servisi anahtarı eksik.");
  return async (req: Request, res: Response, next: NextFunction) => {
    const match = req.path.match(/^\/vcards(?:\/([0-9a-f-]+)(?:\/(status|file))?)?$/);
    const nfc = req.path === "/nfc/writes" && req.method === "POST";
    if (!match && !nfc) return res.status(404).json({message:"vCard bulunamadı."});
    const id = nfc ? req.body.cardId : match?.[1], suffix = match?.[2];
    let command: Record<string, unknown> | undefined;
    if (nfc && typeof req.body.verified === "boolean") command = {action:"get",id};
    else if (req.method === "GET" && !suffix) command = id ? {action:"get",id} : {action:"list"};
    else if (req.method === "GET" && suffix === "file") command = {action:"file",id};
    else if (req.method === "POST" && !id) command = {action:"create",input:req.body};
    else if (req.method === "PUT" && id && !suffix) command = {action:"update",id,input:req.body};
    else if (req.method === "PATCH" && suffix === "status") command = {action:"status",id,status:req.body.status};
    else if (req.method === "DELETE" && id && !suffix) command = {action:"delete",id};
    if (!command) return res.status(400).json({message:"İstek bilgileri geçersiz."});
    if (command.action === "create" || command.action === "update") {
      const parsed = cardSchema.safeParse(command.input);
      if (!parsed.success) return res.status(400).json({message:parsed.error.issues[0]?.message || "Kartvizit bilgileri geçersiz."});
      command.input = parsed.data;
    }
    try {
      const result = await fetch(new URL("/internal/cards",origin), {
        method:"POST", redirect:"error", signal:AbortSignal.timeout(15000),
        headers:{"Content-Type":"application/json",Authorization:`Bearer ${config.key}`,"X-Metek-Actor-Id":res.locals.user.id,"X-Metek-Actor-Role":res.locals.user.role},
        body:JSON.stringify(command),
      });
      const body = await result.text();
      if (result.status >= 500 || result.status === 401) throw new Error("Remote service unavailable");
      if (result.ok && nfc) {
        audit(res.locals.user.id,req.body.verified ? "NFC_CLIENT_REPORTED_VERIFIED" : "NFC_CLIENT_REPORTED_WRITE",id);
        return res.status(204).end();
      }
      if (result.ok && ["create","update","status","delete"].includes(String(command.action))) {
        audit(res.locals.user.id,`VCARD_${String(command.action).toUpperCase()}`,id || (body ? JSON.parse(body).id : undefined));
      }
      const disposition = result.headers.get("content-disposition");
      if (disposition) res.setHeader("Content-Disposition",disposition);
      res.status(result.status).type(result.headers.get("content-type") || "application/json").send(body);
    } catch {
      res.status(503).json({message:"Kartvizit hizmetine ulaşılamıyor. İnternet bağlantınızı kontrol edip tekrar deneyiniz."});
    }
  };
}
