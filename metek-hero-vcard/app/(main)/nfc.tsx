import { theme } from "../../theme";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { Nfc, CheckCircle2, Circle } from "lucide-react-native";
import Constants from "expo-constants";
import { useCards } from "../../hooks/useCards";
import { Button, Notice, Panel, Screen, ui } from "../../components/ui";
import { cancelNfc, checkNfc, writeNfc } from "../../services/nfcService";
import { cardService } from "../../services/cardService";
export default function NfcScreen() {
  const expoGo = Constants.executionEnvironment === "storeClient";
  const { cards, loading, error } = useCards();
  const [selected, setSelected] = useState(""),
    [status, setStatus] = useState("NFC kontrol ediliyor."),
    [busy, setBusy] = useState(false),
    [failure, setFailure] = useState("");
  const locked = useRef(false);
  useEffect(() => {
    let active = true;
    void checkNfc().then((s) => {
      if (active) setStatus(s);
    });
    return () => {
      active = false;
      void cancelNfc();
    };
  }, []);
  const available = cards.filter(
    (c) => c.status === "ACTIVE" && c.visibility === "PUBLIC",
  );
  async function write() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setFailure("");
    try {
      const card = await cardService.get(selected);
      if (card.status !== "ACTIVE" || card.visibility !== "PUBLIC")
        throw new Error("Paylaşıma açık, aktif bir vCard seçiniz.");
      const result = await writeNfc(card.publicUrl, setStatus);
      setStatus(
        result.verified
          ? "NFC kart başarıyla programlandı ve bağlantı doğrulandı."
          : "Yazma tamamlandı, ancak tekrar okuma doğrulanamadı. Kartı başka bir telefonla kontrol ediniz.",
      );
      try {
        await cardService.logNfc(card.id, result.verified);
      } catch {
        setFailure("Kart yazıldı; işlem günlüğü sunucuya kaydedilemedi.");
      }
    } catch (e) {
      setFailure(e instanceof Error ? e.message : "Yazım tamamlanamadı.");
      setStatus("İşlem sonlandı.");
    } finally {
      setBusy(false);
      locked.current = false;
    }
  }
  return (
    <Screen
      title="NFC karta yaz"
      subtitle="Dijital kartvizitinizi fiziksel kartınızla buluşturun."
    >
      <Panel>
        <View style={{ alignItems: "center", paddingVertical: 16, gap: 18 }}>
          <View
            style={{
              backgroundColor: theme.colors.accent,
              padding: 24,
              borderRadius: 50,
            }}
          >
            <Nfc size={48} color={theme.colors.primary} />
          </View>
          <Text style={[ui.text, { textAlign: "center", fontWeight: "600" }]}>
            {status}
          </Text>
          {busy && <ActivityIndicator color={theme.colors.primary} />}
        </View>
      </Panel>
      <Text style={[ui.text, { marginBottom: 18, fontWeight: "600" }]}>
        1. Paylaşılacak vCard'ı seçin
      </Text>
      {loading ? (
        <ActivityIndicator />
      ) : error ? (
        <Notice error>{error}</Notice>
      ) : available.length === 0 ? (
        <Notice>
          Önce bağlantıyla erişime açık, aktif bir vCard oluşturunuz.
        </Notice>
      ) : (
        available.map((c) => (
          <Pressable
            key={c.id}
            disabled={busy}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected === c.id }}
            onPress={() => setSelected(c.id)}
          >
            <Panel>
              <View style={ui.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[ui.text, { fontWeight: "600" }]}>
                    {c.firstName} {c.lastName}
                  </Text>
                  <Text style={ui.muted}>{c.company}</Text>
                </View>
                {selected === c.id ? (
                  <CheckCircle2 size={24} color={theme.colors.primary} />
                ) : (
                  <Circle size={24} color={theme.colors.muted} />
                )}
              </View>
            </Panel>
          </Pressable>
        ))
      )}
      {!!failure && <Notice error>{failure}</Notice>}
      <Button
        title="2. NFC karta yaz"
        disabled={!selected || Platform.OS === "web" || expoGo}
        busy={busy}
        onPress={() => void write()}
      />
      {busy && (
        <Button secondary title="İptal et" onPress={() => void cancelNfc()} />
      )}
      <Text style={[ui.muted, { marginTop: 20 }]}>
        Yazılabilir ve NDEF uyumlu bir kart gerekir. 13.56 MHz veya MIFARE adı
        tek başına uyumluluk garantisi değildir. Kart formatlama ve kalıcı
        kilitleme bu sürümde yapılmaz.
      </Text>
    </Screen>
  );
}
