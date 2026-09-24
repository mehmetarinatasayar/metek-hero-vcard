import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { BrandedQr } from "../../../components/BrandedQr";
import { theme } from "../../../theme";
import { formatPhone } from "../../../shared/phone";
import type Svg from "react-native-svg";
import {
  Button,
  Notice,
  Panel,
  Screen,
  Status,
  ui,
} from "../../../components/ui";
import { cardService } from "../../../services/cardService";
import {
  copyLink,
  copyQr,
  saveQr,
  saveVcf,
  shareLink,
} from "../../../services/shareService";
import { qrImage } from "../../../services/qrImage";
import { confirm } from "../../../utils/confirm";
import type { VCard } from "../../../shared/schema";
import { isInternetUrl } from "../../../shared/publicUrl";
export default function CardDetail() {
  const { id, qr } = useLocalSearchParams<{ id: string; qr?: string }>();
  const [card, setCard] = useState<VCard | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [showQr, setShowQr] = useState(qr === "1");
  const svg = useRef<Svg | null>(null),
    lock = useRef(false);
  const { width } = useWindowDimensions();
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setError("");
      void cardService
        .get(id)
        .then((c) => {
          if (active) setCard(c);
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
      return () => {
        active = false;
      };
    }, [id]),
  );
  async function run(action: () => Promise<string | void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const message = await action();
      if (message) setNotice(message);
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError") setError(e.message);
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  if (!card)
    return (
      <Screen title="vCard">
        {error ? <Notice error>{error}</Notice> : <ActivityIndicator />}
      </Screen>
    );
  const internetReady = isInternetUrl(card.publicUrl);
  const shareable = card.status === "ACTIVE" && card.visibility === "PUBLIC" && internetReady;
  const fields = [
    ["Cep telefonu", formatPhone(card.mobilePhone)],
    ["Şirket telefonu", formatPhone(card.phone)],
    ["E-posta", card.email],
    ["Web sitesi", card.website],
    ["Adres", card.address],
    ["Departman", card.department],
    ["Doğum tarihi", card.birthDate],
  ].filter(([, v]) => v);
  return (
    <Screen title="Dijital kartvizit">
      <View style={[ui.row, { marginBottom: 20 }]}>
        <Status
          active={card.status === "ACTIVE"}
          privateCard={card.visibility === "PRIVATE"}
        />
        <Pressable
          disabled={busy}
          accessibilityRole="button"
          onPress={() => router.push(`/cards/edit?id=${card.id}`)}
        >
          <Text style={ui.link}>Düzenle</Text>
        </Pressable>
      </View>
      <Panel>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            backgroundColor: theme.colors.accent,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 22,
          }}
        >
          <Text style={{ color: theme.colors.primary, fontSize: 22, fontWeight: "600" }}>
            {card.firstName[0]}
            {card.lastName[0]}
          </Text>
        </View>
        <Text
          style={{
            color: "#222",
            fontSize: 29,
            fontWeight: "700",
            letterSpacing: -0.8,
          }}
        >
          {card.firstName} {card.lastName}
        </Text>
        <Text style={[ui.muted, { marginTop: 8 }]}>
          {[card.title, card.company].filter(Boolean).join(" · ")}
        </Text>
        {!showQr &&
          fields.map(([k, v]) => (
            <View key={k} style={{ marginTop: 22 }}>
              <Text style={[ui.muted, { fontSize: 11 }]}>{k}</Text>
              <Text selectable style={ui.text}>
                {v}
              </Text>
            </View>
          ))}
        {showQr && shareable && (
          <View style={{ alignItems: "center", marginTop: 28 }}>
            <BrandedQr
              value={card.publicUrl}
              size={Math.max(160, Math.min(264, width - 100))}
              svgRef={svg}
            />
            <Text style={[ui.muted, { marginTop: 14, textAlign: "center" }]}>
              Kartviziti açmak için kamerayla okutun.
            </Text>
          </View>
        )}
      </Panel>
      {!internetReady && (
        <Notice error>Bu kartın internet bağlantısı henüz hazır değil. Telefondan açılabilen HTTPS adresi ayarlanana kadar QR paylaşımı kullanılamaz.</Notice>
      )}
      {(card.status === "PASSIVE" || card.visibility === "PRIVATE") && (
        <Notice>
          {card.status === "PASSIVE"
            ? "Bu kart pasif. Paylaşım bağlantısı ve daha önce yazılmış NFC kartları bilgilerinizi açmaz."
            : "Bu kart özel. QR veya NFC ile paylaşmak için düzenleme ekranından bağlantıyla erişimi açınız."}
        </Notice>
      )}
      {!!error && <Notice error>{error}</Notice>}
      {!!notice && <Notice>{notice}</Notice>}
      {shareable && (
        <>
          <Button
            title={showQr ? "Bilgileri göster" : "QR kodu göster"}
            disabled={busy}
            onPress={() => setShowQr(!showQr)}
          />
          {showQr && (
            <>
              <Button
                secondary
                title="QR PNG kaydet"
                busy={busy}
                onPress={() =>
                  void run(async () =>
                    saveQr(await qrImage(card.publicUrl, svg.current)),
                  )
                }
              />
              <Button
                secondary
                title="QR paylaş"
                disabled={busy}
                onPress={() =>
                  void run(async () =>
                    saveQr(await qrImage(card.publicUrl, svg.current), true),
                  )
                }
              />
              <Button
                secondary
                title="QR görselini kopyala"
                disabled={busy}
                onPress={() =>
                  void run(async () =>
                    copyQr(await qrImage(card.publicUrl, svg.current)),
                  )
                }
              />
            </>
          )}
          <Button
            secondary
            title="vCard linkini kopyala"
            disabled={busy}
            onPress={() => void run(() => copyLink(card.publicUrl))}
          />
          <Button
            secondary
            title="Bağlantıyı paylaş"
            disabled={busy}
            onPress={() => void run(() => shareLink(card.publicUrl))}
          />
        </>
      )}
      <Button
        secondary
        title="vCard dosyasını paylaş (.vcf)"
        disabled={busy}
        onPress={() => void run(() => saveVcf(card))}
      />
      <Button
        secondary
        title={card.status === "ACTIVE" ? "Kartı pasif yap" : "Kartı aktif yap"}
        disabled={busy}
        onPress={() =>
          void run(async () => {
            const target = card.status === "ACTIVE" ? "PASSIVE" : "ACTIVE";
            if (
              await confirm(
                target === "PASSIVE" ? "Kartı pasif yap" : "Kartı aktif yap",
                target === "PASSIVE"
                  ? "Bu bağlantıdaki bilgiler gizlenecek. Önceden indirilmiş dosyalar ve rehbere kaydedilmiş bilgiler geri alınamaz."
                  : "Paylaşım tercihinize göre bağlantı yeniden erişilebilir olacak.",
              )
            ) {
              setCard(await cardService.status(card.id, target));
              return "Kart durumu güncellendi.";
            }
          })
        }
      />
      <Button
        danger
        title="vCard'ı sil"
        disabled={busy}
        onPress={() =>
          void run(async () => {
            if (
              await confirm(
                "vCard silinsin mi?",
                "Bu işlem geri alınamaz. Paylaşım bağlantısı kapanır.",
                true,
              )
            ) {
              await cardService.remove(card.id);
              router.replace("/cards");
            }
          })
        }
      />
    </Screen>
  );
}
