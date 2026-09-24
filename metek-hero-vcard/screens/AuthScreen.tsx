import { theme } from "../theme";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loginSchema, registerSchema } from "../shared/schema";
import { authService } from "../services/authService";
import { useAuth } from "../store/auth";
import { Button, Field, Notice, Screen, ui } from "../components/ui";
const schema = registerSchema
  .extend({ repeatPassword: z.string() })
  .refine((d) => d.password === d.repeatPassword, {
    path: ["repeatPassword"],
    message: "Şifreler eşleşmiyor.",
  });
const loginFormSchema = loginSchema.extend({
  firstName: z.string(),
  lastName: z.string(),
  repeatPassword: z.string(),
});
type Form = z.infer<typeof schema>;
export function AuthScreen({ register = false }: { register?: boolean }) {
  const [error, setError] = useState("");
  const auth = useAuth();
  const form = useForm<Form>({
    resolver: zodResolver(register ? schema : loginFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      repeatPassword: "",
    },
  });
  if (auth.user) return <Redirect href="/" />;
  const submit = form.handleSubmit(async (data) => {
    setError("");
    try {
      auth.setUser(
        register
          ? await authService.register(data)
          : await authService.login(data),
      );
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Giriş yapılamadı.");
    }
  });
  const field = (name: keyof Form, label: string, secure = false) => (
    <Controller
      key={name}
      control={form.control}
      name={name}
      render={({ field: f, fieldState }) => (
        <Field
          label={label}
          value={f.value}
          onChangeText={f.onChange}
          onBlur={f.onBlur}
          error={fieldState.error?.message}
          secureTextEntry={secure}
          autoCapitalize={name === "email" || secure ? "none" : "words"}
          keyboardType={name === "email" ? "email-address" : "default"}
          autoComplete={
            name === "email"
              ? "email"
              : name === "password"
                ? register
                  ? "new-password"
                  : "current-password"
                : "off"
          }
          placeholder={
            name === "email"
              ? "adiniz@sirketiniz.com"
              : secure
                ? "••••••••"
                : label
          }
        />
      )}
    />
  );
  return (
    <Screen back={false}>
      <View
        style={{
          alignSelf: "flex-start",
          backgroundColor: theme.colors.accent,
          borderRadius: 20,
          paddingHorizontal: 12,
          paddingVertical: 7,
          marginBottom: 22,
        }}
      >
        <Text
          style={{
            color: theme.colors.accentText,
            fontSize: 11,
            fontWeight: "600",
            letterSpacing: 1,
          }}
        >
          TEK KART. TÜM BAĞLANTILARINIZ.
        </Text>
      </View>
      <Text
        accessibilityRole="header"
        style={{
          fontSize: 42,
          lineHeight: 47,
          color: "#222",
          fontWeight: "700",
          letterSpacing: -1.5,
          marginBottom: 16,
        }}
      >
        {register ? "Yeni bir\nbağlantı kurun." : "Tanışmanın\nyeni yolu."}
      </Text>
      <Text
        style={[ui.muted, { fontSize: 16, lineHeight: 25, marginBottom: 34 }]}
      >
        {register
          ? "Hesabınızı oluşturun, ilk dijital kartvizitinizi hazırlayın."
          : "Dijital kartvizitinizi oluşturun. QR ve NFC ile her tanışmayı bir bağlantıya dönüştürün."}
      </Text>
      {register && (
        <>
          {field("firstName", "Adınız")}
          {field("lastName", "Soyadınız")}
        </>
      )}
      {field("email", "E-posta adresi")}
      {field("password", "Şifre", true)}
      {register && field("repeatPassword", "Şifre tekrar", true)}
      {register && (
        <Text style={[ui.muted, { marginBottom: 12 }]}>
          En az 8 karakter, bir büyük harf, bir küçük harf ve bir rakam
          kullanınız.
        </Text>
      )}
      {!!error && <Notice error>{error}</Notice>}
      <Button
        title={register ? "Hesap oluştur" : "Giriş yap"}
        busy={form.formState.isSubmitting}
        onPress={() => void submit()}
      />
      {!register && (
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push("/forgot-password")}
        >
          <Text style={ui.link}>Şifremi unuttum</Text>
        </Pressable>
      )}
      <View
        style={{
          marginTop: 20,
          borderTopWidth: 1,
          borderColor: theme.colors.border,
          paddingTop: 12,
        }}
      >
        <Pressable
          accessibilityRole="link"
          onPress={() => router.replace(register ? "/login" : "/register")}
        >
          <Text style={ui.link}>
            {register
              ? "Zaten hesabınız var mı? Giriş yapın"
              : "Henüz hesabınız yok mu? Üye olun"}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
