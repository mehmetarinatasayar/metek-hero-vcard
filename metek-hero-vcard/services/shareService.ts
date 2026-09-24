import { Platform, Share } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";
import type { VCard } from "../shared/schema";
import { createVcf } from "../shared/vcard";

export async function copyLink(url: string) {
  await Clipboard.setStringAsync(url);
  return "Bağlantı kopyalandı.";
}
export async function shareLink(url: string) {
  if (Platform.OS === "web") {
    if (navigator.share) {
      await navigator.share({ title: "METEK HERO vCard", url });
      return "";
    }
    return copyLink(url);
  }
  await Share.share({ message: url, url, title: "METEK HERO vCard" });
  return "";
}
async function output(
  bytes: Uint8Array,
  filename: string,
  mime: string,
  share = false,
) {
  if (Platform.OS === "web") {
    const blob = new Blob([new Uint8Array(bytes)], { type: mime });
    const file = new globalThis.File([blob], filename, { type: mime });
    if (share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] });
      return "";
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return "Dosya indirildi.";
  }
  const file = new File(Paths.cache, filename);
  file.write(bytes);
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("Bu cihazda dosya paylaşımı kullanılamıyor.");
  await Sharing.shareAsync(file.uri, {
    mimeType: mime,
    UTI: mime === "image/png" ? "public.png" : "public.vcard",
    dialogTitle: "Kaydet veya paylaş",
  });
  return "";
}
export async function saveVcf(card: VCard) {
  return output(
    new TextEncoder().encode(createVcf(card)),
    `${card.firstName}_${card.lastName}`.replace(/[^\p{L}\p{N}_-]/gu, "_") +
      ".vcf",
    "text/vcard",
    true,
  );
}
export async function saveQr(base64: string, share = false) {
  return output(
    Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)),
    "METEK_HERO_QR.png",
    "image/png",
    share,
  );
}
export async function copyQr(base64: string) {
  await Clipboard.setImageAsync(base64);
  return "QR görseli kopyalandı.";
}
