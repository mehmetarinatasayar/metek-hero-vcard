import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, ArrowUpRight } from "lucide-react-native";
import { router } from "expo-router";
import { theme } from "../theme";

const c = theme.colors;
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[s.brand, compact && s.brandCompact]}>
      <View style={s.logoFrame}>
        <Image source={require("../assets/metek-grup-logo-onayli.png")} accessibilityLabel="METEK Grup logosu"
          resizeMode="contain" style={s.logo} />
      </View>
      {!compact && <View style={s.brandProduct}>
        <Text style={s.brandName}>HERO vCard</Text>
        <Text style={s.brandSub}>DİJİTAL KARTVİZİT</Text>
      </View>}
    </View>
  );
}
export function Screen({
  children,
  title,
  subtitle,
  back = true,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  back?: boolean;
}) {
  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={s.safe}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={s.page}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.header}>
            {back && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Geri dön"
                onPress={() =>
                  router.canGoBack() ? router.back() : router.replace("/")
                }
                style={s.back}
              >
                <ArrowLeft color={c.text} size={23} />
              </Pressable>
            )}
            <Brand compact={back} />
          </View>
          {title && (
            <Text accessibilityRole="header" style={s.title}>
              {title}
            </Text>
          )}
          {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
          {children}
          <Text style={s.footer}>METEK HERO vCard</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Button({
  title,
  onPress,
  busy = false,
  disabled = false,
  secondary = false,
  danger = false,
}: {
  title: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  secondary?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: busy || disabled, busy }}
      disabled={busy || disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        danger && { backgroundColor: c.danger },
        (busy || disabled) && { opacity: 0.5 },
        pressed && { opacity: 0.75 },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={secondary ? c.primary : "#fff"} />
      ) : (
        <Text style={[s.buttonText, secondary && { color: c.primary }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
export function Field({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.muted}
        selectionColor={c.primary}
        style={[
          s.input,
          props.multiline && { minHeight: 96, textAlignVertical: "top" },
          !!error && { borderColor: c.danger },
        ]}
        {...props}
      />
      {error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
    </View>
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <View style={[s.notice, error && { backgroundColor: c.dangerBg }]}>
      <Text
        accessibilityRole={error ? "alert" : "text"}
        style={{
          color: error ? c.danger : c.accentText,
          fontSize: 14,
          lineHeight: 21,
        }}
      >
        {children}
      </Text>
    </View>
  );
}
export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={s.section}>{children}</Text>;
}
export function Panel({ children }: { children: ReactNode }) {
  return <View style={s.panel}>{children}</View>;
}
export function Status({
  active,
  privateCard = false,
}: {
  active: boolean;
  privateCard?: boolean;
}) {
  return (
    <View
      style={[s.badge, { backgroundColor: active ? "#ECF3E3" : "#F2EAE7" }]}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: active ? "#55783C" : "#866456",
        }}
      />
      <Text
        style={{
          color: active ? "#40592F" : "#785747",
          fontSize: 12,
          fontWeight: "600",
        }}
      >
        {active ? "Aktif" : "Pasif"}
        {privateCard ? " · Özel" : ""}
      </Text>
    </View>
  );
}
export function ActionCard({
  title,
  description,
  icon,
  onPress,
  featured = false,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  onPress: () => void;
  featured?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        s.action,
        featured && { backgroundColor: c.primary, borderColor: c.primary },
        pressed && { opacity: 0.8 },
      ]}
    >
      <View style={[s.iconBox, featured && { backgroundColor: c.accent }]}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.actionTitle, featured && { color: "#fff" }]}>
          {title}
        </Text>
        <Text style={[s.actionDesc, featured && { color: c.onPrimaryMuted }]}>
          {description}
        </Text>
      </View>
      <ArrowUpRight size={20} color={featured ? c.onPrimaryMuted : c.muted} />
    </Pressable>
  );
}
export const ui = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  gap: { gap: 12 },
  text: { color: c.text, fontSize: 16, lineHeight: 24 },
  muted: { color: c.muted, fontSize: 14, lineHeight: 22 },
  link: {
    color: c.primary,
    fontWeight: "600",
    paddingVertical: 14,
    textAlign: "center",
  },
});
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  page: {
    width: "100%",
    maxWidth: 620,
    alignSelf: "center",
    padding: 24,
    paddingBottom: 40,
    flexGrow: 1,
  },
  header: { minHeight: 52, marginBottom: 28, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  brand: { alignItems: "flex-start", gap: 12, backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderRadius: 20, padding: 18, width: "100%" },
  brandCompact: { width: 200, flexShrink: 1, padding: 10, borderRadius: 13 },
  logoFrame: { width: "100%", maxWidth: 360, aspectRatio: 567 / 189 },
  logo: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" },
  brandProduct: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" },
  brandName: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: c.primary,
  },
  brandSub: { fontSize: 8, letterSpacing: 1.2, color: c.muted },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "700",
    letterSpacing: -1.2,
    color: c.text,
    marginBottom: 12,
  },
  subtitle: { fontSize: 16, lineHeight: 24, color: c.muted, marginBottom: 28 },
  footer: {
    fontSize: 10,
    letterSpacing: 1.8,
    color: c.muted,
    textAlign: "center",
    marginTop: 40,
  },
  back: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    minHeight: 54,
    borderRadius: 15,
    backgroundColor: c.primary,
    justifyContent: "center",
    alignItems: "center",
    padding: 14,
    marginTop: 8,
  },
  secondary: { backgroundColor: "#fff", borderColor: c.border, borderWidth: 1 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  field: { marginBottom: 17 },
  label: { color: c.text, fontSize: 13, fontWeight: "600", marginBottom: 8 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: c.border,
    minHeight: 54,
    borderRadius: 13,
    paddingHorizontal: 16,
    paddingVertical: 15,
    color: c.text,
    fontSize: 16,
  },
  error: { color: c.danger, fontSize: 12, marginTop: 6 },
  notice: {
    backgroundColor: c.accent,
    padding: 16,
    borderRadius: 14,
    marginVertical: 12,
  },
  section: {
    fontWeight: "700",
    fontSize: 18,
    color: c.text,
    marginBottom: 18,
    marginTop: 20,
  },
  panel: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: c.border,
    marginBottom: 16,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 21,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 22,
    marginBottom: 14,
    minHeight: 116,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: c.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  actionTitle: { fontSize: 17, fontWeight: "600", color: c.text },
  actionDesc: { fontSize: 13, lineHeight: 19, color: c.muted, marginTop: 6 },
});
