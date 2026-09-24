import { theme } from "../../theme";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { QrCode, ContactRound, Nfc, Layers, LogOut } from "lucide-react-native";
import { ActionCard, Notice, Screen, ui } from "../../components/ui";
import { useAuth } from "../../store/auth";
export default function Dashboard() {
  const { user, logout } = useAuth();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Screen back={false}>
      <View style={[ui.row, { marginBottom: 10 }]}>
        <Text style={{ color: theme.colors.muted, fontSize: 14 }}>
          Hoş geldiniz, {user?.firstName}
        </Text>
        <Pressable
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Çıkış yap"
          style={{
            minWidth: 44,
            minHeight: 44,
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={async () => {
            setBusy(true);
            try {
              await logout();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Çıkış yapılamadı.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <LogOut size={20} color={theme.colors.muted} />
        </Pressable>
      </View>
      <Text
        accessibilityRole="header"
        style={{
          fontSize: 35,
          lineHeight: 41,
          fontWeight: "700",
          letterSpacing: -1,
          marginBottom: 14,
          color: "#222",
        }}
      >
        {"Bir sonraki bağlantınız\nburada başlar."}
      </Text>
      <Text style={[ui.muted, { marginBottom: 30 }]}>
        Kartvizitinizi hazırlayın, dilediğiniz gibi paylaşın.
      </Text>
      {!!error && <Notice error>{error}</Notice>}
      <ActionCard
        title="QR vCard Oluştur"
        description="Bilgilerinizi okutulabilir bir QR koda dönüştürün."
        icon={<QrCode size={24} color={theme.colors.primary} />}
        onPress={() => router.push("/cards/new?mode=qr")}
        featured
      />
      <ActionCard
        title="vCard Oluştur"
        description="Size özel dijital kartvizitinizi hazırlayın."
        icon={<ContactRound size={24} color={theme.colors.primary} />}
        onPress={() => router.push("/cards/new")}
      />
      <ActionCard
        title="NFC Karta Yaz"
        description="Kartvizitinizi tek dokunuşla paylaşın."
        icon={<Nfc size={24} color={theme.colors.primary} />}
        onPress={() => router.push("/nfc")}
      />
      <ActionCard
        title="vCard'larım"
        description="Kartvizitlerinizi görüntüleyin ve düzenleyin."
        icon={<Layers size={24} color={theme.colors.primary} />}
        onPress={() => router.push("/cards")}
      />
    </Screen>
  );
}
