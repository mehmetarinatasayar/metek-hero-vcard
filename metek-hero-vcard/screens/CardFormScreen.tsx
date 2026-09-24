import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Switch,
  Text,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { router, useLocalSearchParams } from "expo-router";
import { cardSchema, emptyCard, type CardInput } from "../shared/schema";
import { cardService } from "../services/cardService";
import { PhoneField } from "../components/PhoneField";
import { theme } from "../theme";
import {
  Button,
  Field,
  Notice,
  Screen,
  SectionTitle,
  ui,
} from "../components/ui";

export function CardFormScreen() {
  const params = useLocalSearchParams<{ id?: string; mode?: string }>();
  const [loading, setLoading] = useState(!!params.id),
    [error, setError] = useState(""),
    [showDate, setShowDate] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CardInput>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      ...emptyCard,
      visibility: params.mode === "qr" ? "PUBLIC" : "PRIVATE",
    },
  });
  useEffect(() => {
    let alive = true;
    if (params.id)
      void cardService
        .get(params.id)
        .then((c) => {
          if (alive) reset(c);
        })
        .catch((e) => {
          if (alive) setError(e.message);
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
    return () => {
      alive = false;
    };
  }, [params.id, reset]);
  const submit = handleSubmit(async (data) => {
    setError("");
    try {
      const card = await cardService.save(data, params.id);
      router.replace(`/cards/${card.id}${params.mode === "qr" ? "?qr=1" : ""}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "vCard kaydedilemedi.");
    }
  });
  function field(
    name: Exclude<keyof CardInput, "visibility" | "birthDate">,
    label: string,
    keyboard: "default" | "email-address" | "phone-pad" | "url" = "default",
  ) {
    return (
      <Controller
        key={name}
        control={control}
        name={name}
        render={({ field: f, fieldState }) => (
          <Field
            label={label}
            value={f.value}
            onChangeText={f.onChange}
            onBlur={f.onBlur}
            error={fieldState.error?.message}
            keyboardType={keyboard}
            autoCapitalize={
              keyboard === "email-address" || keyboard === "url"
                ? "none"
                : "words"
            }
            multiline={name === "address"}
            placeholder={
              name === "website" ? "www.sirketiniz.com" : undefined
            }
          />
        )}
      />
    );
  }
  const phoneField = (name: "phone" | "mobilePhone", label: string) => (
    <Controller control={control} name={name} render={({ field: f, fieldState }) => (
      <PhoneField label={label} mobile={name === "mobilePhone"} value={f.value}
        onChangeText={f.onChange} onBlur={f.onBlur} error={fieldState.error?.message} />
    )} />
  );
  return (
    <Screen
      title={
        params.id
          ? "vCard düzenle"
          : params.mode === "qr"
            ? "QR vCard oluştur"
            : "vCard oluştur"
      }
      subtitle="Sizi anlatan bilgileri ekleyin. * işaretli alanlar zorunludur."
    >
      {loading ? (
        <ActivityIndicator />
      ) : (
        <>
          <SectionTitle>Kişisel bilgiler</SectionTitle>
          {field("firstName", "Adı *")}
          {field("lastName", "Soyadı *")}
          <SectionTitle>İş bilgileri</SectionTitle>
          {field("company", "Şirket")}
          {field("department", "Departman")}
          {field("title", "Unvan")}
          <SectionTitle>İletişim</SectionTitle>
          {phoneField("mobilePhone", "Cep telefonu")}
          {phoneField("phone", "Şirket telefonu")}
          {field("email", "E-posta", "email-address")}
          {field("website", "Web sitesi", "url")}
          {field("address", "Adres")}
          <Controller
            control={control}
            name="birthDate"
            render={({ field: f, fieldState }) =>
              Platform.OS === "web" ? (
                <Field
                  label="Doğum tarihi (YYYY-AA-GG)"
                  placeholder="1990-05-21"
                  value={f.value}
                  onChangeText={f.onChange}
                  error={fieldState.error?.message}
                />
              ) : (
                <View>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setShowDate(true)}
                    style={{ minHeight: 54, justifyContent: "center" }}
                  >
                    <Text style={ui.text}>
                      Doğum tarihi: {f.value || "Seçiniz"}
                    </Text>
                  </Pressable>
                  {!!f.value && (
                    <Button
                      secondary
                      title="Doğum tarihini kaldır"
                      onPress={() => f.onChange("")}
                    />
                  )}
                  {!!fieldState.error && (
                    <Notice error>{fieldState.error.message}</Notice>
                  )}
                  {showDate && (
                    <DateTimePicker
                      value={
                        f.value
                          ? new Date(f.value + "T12:00:00")
                          : new Date(1990, 0, 1)
                      }
                      mode="date"
                      minimumDate={new Date(1900, 0, 1)}
                      maximumDate={new Date()}
                      onChange={(event, date) => {
                        setShowDate(false);
                        if (event.type === "set" && date)
                          f.onChange(
                            `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
                          );
                      }}
                    />
                  )}
                </View>
              )
            }
          />
          <SectionTitle>Paylaşım tercihi</SectionTitle>
          <Controller
            control={control}
            name="visibility"
            render={({ field: f }) => (
              <>
                <View style={ui.row}>
                  <Text style={[ui.text, { flex: 1 }]}>
                    Bağlantıyla erişime aç
                  </Text>
                  <Switch
                    accessibilityLabel="Bağlantıyla erişime aç"
                    value={f.value === "PUBLIC"}
                    onValueChange={(v) => f.onChange(v ? "PUBLIC" : "PRIVATE")}
                    trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
                  />
                </View>
                <Notice>
                  {f.value === "PUBLIC"
                    ? "Bu bağlantıyı alan herkes, doğum tarihi dahil kartvizite eklediğiniz bilgileri görebilir. QR ve NFC paylaşımı için bağlantı açık olmalıdır."
                    : "Bu kartı yalnızca hesabınızdan görebilirsiniz. QR ve NFC paylaşımı kapalıdır."}
                </Notice>
              </>
            )}
          />
          {!!error && <Notice error>{error}</Notice>}
          <Button
            title={
              params.id
                ? "Değişiklikleri kaydet"
                : params.mode === "qr"
                  ? "Kaydet ve QR oluştur"
                  : "vCard oluştur"
            }
            busy={isSubmitting}
            onPress={() => void submit()}
          />
        </>
      )}
    </Screen>
  );
}
