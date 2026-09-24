import { theme } from "../../../theme";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { ArrowUpRight, ContactRound } from "lucide-react-native";
import { useCards } from "../../../hooks/useCards";
import {
  Button,
  Field,
  Notice,
  Panel,
  Screen,
  Status,
  ui,
} from "../../../components/ui";
export default function CardList() {
  const { cards, loading, error, reload } = useCards();
  const [query, setQuery] = useState("");
  const filtered = cards.filter((c) =>
    `${c.firstName} ${c.lastName} ${c.company}`
      .toLocaleLowerCase("tr")
      .includes(query.toLocaleLowerCase("tr")),
  );
  return (
    <Screen title="vCard'larım" subtitle="Tüm bağlantılarınız, tek bir yerde.">
      <Button
        title="Yeni vCard oluştur"
        onPress={() => router.push("/cards/new")}
      />
      <View style={{ height: 24 }} />
      {!!cards.length && (
        <Field
          label="Kartvizit ara"
          placeholder="Ad, soyad veya şirket"
          value={query}
          onChangeText={setQuery}
        />
      )}
      {loading ? (
        <ActivityIndicator />
      ) : error ? (
        <>
          <Notice error>{error}</Notice>
          <Button title="Tekrar dene" onPress={() => void reload()} />
        </>
      ) : cards.length === 0 ? (
        <Panel>
          <ContactRound color={theme.colors.primary} size={40} />
          <Text style={[ui.text, { marginTop: 18, fontWeight: "600" }]}>
            Henüz oluşturulmuş bir vCard bulunmuyor.
          </Text>
          <Text style={[ui.muted, { marginTop: 8 }]}>
            İlk vCard'ınızı oluşturun ve bilgilerinizi kolayca paylaşın.
          </Text>
        </Panel>
      ) : (
        <>
          {filtered.length === 0 && (
            <Notice>Aramanızla eşleşen bir kartvizit bulunamadı.</Notice>
          )}
          {filtered.map((c) => (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={`${c.firstName} ${c.lastName} kartvizitini aç`}
              onPress={() => router.push(`/cards/${c.id}`)}
            >
              <Panel>
                <View style={ui.row}>
                  <Status
                    active={c.status === "ACTIVE"}
                    privateCard={c.visibility === "PRIVATE"}
                  />
                  <ArrowUpRight size={20} color={theme.colors.muted} />
                </View>
                <Text
                  style={{
                    fontSize: 23,
                    fontWeight: "700",
                    color: "#222",
                    marginTop: 18,
                  }}
                >
                  {c.firstName} {c.lastName}
                </Text>
                <Text style={[ui.muted, { marginTop: 6 }]}>
                  {[c.title, c.company].filter(Boolean).join(" · ") ||
                    "Dijital kartvizit"}
                </Text>
                <Text style={[ui.muted, { fontSize: 11, marginTop: 16 }]}>
                  Oluşturulma:{" "}
                  {new Date(c.createdAt).toLocaleDateString("tr-TR")} ·
                  Güncelleme:{" "}
                  {new Date(c.updatedAt).toLocaleDateString("tr-TR")}
                </Text>
              </Panel>
            </Pressable>
          ))}
        </>
      )}
    </Screen>
  );
}
