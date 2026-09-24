import { Platform } from "react-native";
import Constants from "expo-constants";
import { confirm } from "../utils/confirm";

type Module = typeof import("react-native-nfc-manager");
let modulePromise: Promise<Module> | undefined;
let cancelled = false,
  inFlight = false;
class NfcMessage extends Error {}
async function load() {
  if (Constants.executionEnvironment === "storeClient")
    throw new NfcMessage(
      "Expo Go'da NFC karta yazılamaz. Bunun için uygulamanın özel derlemesi gerekir. Kartvizit ve QR özelliklerini kullanabilirsiniz.",
    );
  try {
    return await (modulePromise ??= import("react-native-nfc-manager"));
  } catch {
    modulePromise = undefined;
    throw new NfcMessage(
      "NFC modülü yüklenemedi. Uygulamayı Development Build olarak yeniden derleyiniz.",
    );
  }
}
export async function checkNfc(): Promise<string> {
  try {
    const { default: manager } = await load();
    if (!(await manager.isSupported())) return "Bu cihaz NFC desteklemiyor.";
    await manager.start();
    if (Platform.OS === "android" && !(await manager.isEnabled()))
      return "NFC kapalı. Telefon ayarlarından NFC özelliğini açınız.";
    return "NFC kullanıma hazır.";
  } catch (e) {
    return e instanceof Error ? e.message : "NFC kontrol edilemedi.";
  }
}
export async function cancelNfc() {
  cancelled = true;
  if (modulePromise) {
    const { default: manager } = await modulePromise;
    await manager.cancelTechnologyRequest().catch(() => {});
  }
}
export async function writeNfc(
  url: string,
  update: (message: string) => void,
): Promise<{ verified: boolean }> {
  if (inFlight) throw new NfcMessage("Devam eden NFC işlemini bekleyiniz.");
  if (!url.startsWith("https://"))
    throw new NfcMessage(
      "NFC yazımı için internetten erişilen HTTPS vCard bağlantısı gereklidir. Yerel önizleme bağlantısı karta yazılmaz.",
    );
  inFlight = true;
  cancelled = false;
  let cleanup: (() => Promise<void>) | undefined,
    timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const { default: manager, NfcTech, Ndef, NdefStatus } = await load();
    cleanup = () => manager.cancelTechnologyRequest().catch(() => {});
    if (!(await manager.isSupported()))
      throw new NfcMessage("Bu cihaz NFC desteklemiyor.");
    await manager.start();
    if (Platform.OS === "android" && !(await manager.isEnabled()))
      throw new NfcMessage(
        "NFC kapalı. Telefon ayarlarından NFC özelliğini açınız.",
      );
    const bytes = Ndef.encodeMessage([Ndef.uriRecord(url)]);
    async function connect() {
      if (cancelled) throw new NfcMessage("NFC işlemi iptal edildi.");
      update("Kartınızı telefonunuzun NFC alanına yaklaştırın.");
      timer = setTimeout(() => {
        void cancelNfc();
      }, 30_000);
      await manager.requestTechnology(NfcTech.Ndef, {
        alertMessage: "vCard bağlantısı için kartınızı yaklaştırın.",
      });
      if (cancelled) throw new NfcMessage("NFC işlemi iptal edildi.");
      update("Kart bulundu. Uyumluluğu kontrol ediliyor.");
      const state = await manager.ndefHandler.getNdefStatus();
      if (state.status === NdefStatus.NotSupported)
        throw new NfcMessage(
          "Bu kart ve cihaz NDEF yazımını desteklemiyor. NDEF olarak hazırlanmış uyumlu bir kart kullanınız.",
        );
      if (state.status !== NdefStatus.ReadWrite)
        throw new NfcMessage(
          "Bu kart yazmaya karşı kilitli. Başka bir kart kullanınız.",
        );
      if (state.capacity < bytes.length)
        throw new NfcMessage(
          `Kart kapasitesi yetersiz. ${bytes.length} bayt gerekli, ${state.capacity} bayt kullanılabilir.`,
        );
      const tag = await manager.getTag();
      const current = await manager.ndefHandler.getNdefMessage();
      if (!current)
        throw new NfcMessage(
          "Mevcut kart içeriği kontrol edilemedi. Yazım yapılmadı.",
        );
      return { id: tag?.id, records: current.ndefMessage ?? [] };
    }
    const before = await connect();
    if (before.records.some((r) => r.tnf !== Ndef.TNF_EMPTY)) {
      clearTimeout(timer);
      await cleanup();
      update("Mevcut kaydın değiştirilmesi için onay bekleniyor.");
      if (
        !(await confirm(
          "NFC kaydını değiştir",
          "Bu kartta mevcut bir NFC kaydı bulunuyor. Üzerine yeni kayıt yazılsın mı?",
        ))
      )
        throw new NfcMessage("NFC işlemi iptal edildi.");
      update("Onaylandı. Aynı kartı tekrar yaklaştırınız.");
      const after = await connect();
      if (
        (before.id && before.id !== after.id) ||
        JSON.stringify(before.records) !== JSON.stringify(after.records)
      )
        throw new NfcMessage(
          "Kart veya kart içeriği değişti. Güvenli yazım için işlemi yeniden başlatınız.",
        );
    }
    if (cancelled) throw new NfcMessage("NFC işlemi iptal edildi.");
    update("NFC karta yazılıyor. Kartı hareket ettirmeyiniz.");
    await manager.ndefHandler.writeNdefMessage(bytes);
    update("Yazılan bağlantı doğrulanıyor.");
    let records;
    try {
      records = (await manager.ndefHandler.getNdefMessage())?.ndefMessage;
    } catch {
      return { verified: false };
    }
    if (!records) return { verified: false };
    const record = records.find((r) =>
      Ndef.isType(r, Ndef.TNF_WELL_KNOWN, Ndef.RTD_URI),
    );
    if (
      records.length !== 1 ||
      !record ||
      Ndef.uri.decodePayload(new Uint8Array(record.payload)) !== url
    )
      throw new NfcMessage(
        "Yazım sonrası okunan bağlantı eşleşmiyor. Kartı tekrar kontrol ediniz.",
      );
    return { verified: true };
  } catch (e) {
    if (e instanceof NfcMessage) throw e;
    throw new NfcMessage(
      cancelled
        ? "İşlem iptal edildi veya kart bekleme süresi doldu."
        : "NFC kart okunamadı veya yazılamadı. Kartı yakın tutunuz; cihazın ve kartın NDEF desteğini kontrol ediniz.",
    );
  } finally {
    clearTimeout(timer);
    await cleanup?.();
    inFlight = false;
  }
}
