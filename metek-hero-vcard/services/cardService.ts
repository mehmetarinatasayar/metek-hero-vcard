import { request } from "../api/client";
import type { CardInput, VCard } from "../shared/schema";

export const cardService = {
  list: () => request<VCard[]>("/vcards"),
  get: (id: string) => request<VCard>(`/vcards/${encodeURIComponent(id)}`),
  save: (input: CardInput, id?: string) =>
    request<VCard>(id ? `/vcards/${encodeURIComponent(id)}` : "/vcards", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(input),
    }),
  status: (id: string, status: VCard["status"]) =>
    request<VCard>(`/vcards/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  remove: (id: string) =>
    request<void>(`/vcards/${encodeURIComponent(id)}`, { method: "DELETE" }),
  logNfc: (cardId: string, verified: boolean) =>
    request<void>("/nfc/writes", {
      method: "POST",
      body: JSON.stringify({ cardId, verified }),
    }),
};
