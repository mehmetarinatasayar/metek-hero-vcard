import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { Phone, Smartphone } from "lucide-react-native";
import { formatPhone } from "../shared/phone";
import { theme } from "../theme";

type Props = {
  label: string; mobile?: boolean; value: string;
  onChangeText: (value: string) => void; onBlur: () => void; error?: string;
};
export function PhoneField({ label, mobile = false, value, onChangeText, onBlur, error }: Props) {
  const [focused, setFocused] = useState(false);
  const Icon = mobile ? Smartphone : Phone;
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <View style={[s.container, focused && s.focused, !!error && { borderColor: c.danger }]}>
        <View style={s.icon}><Icon size={21} color={c.primary} /></View>
        <TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onChangeText(formatPhone(value)); onBlur(); }}
          keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber"
          autoCorrect={false} maxLength={30}
          placeholder={mobile ? "0532 123 45 67" : "0212 123 45 67"}
          placeholderTextColor={c.muted} selectionColor={c.primary} style={s.input} />
      </View>
      {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> :
        <Text style={s.hint}>Yurt dışı numaralarda ülke kodunu ekleyin.</Text>}
    </View>
  );
}
const c = theme.colors;
const s = StyleSheet.create({
  field: { marginBottom: 20 },
  label: { color: c.text, fontSize: 13, fontWeight: "600", marginBottom: 8 },
  container: { flexDirection: "row", alignItems: "center", backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 16, minHeight: 62, paddingLeft: 10, paddingRight: 14 },
  focused: { borderColor: c.primary },
  icon: { width: 40, height: 40, backgroundColor: c.accent, borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 12 },
  input: { flex: 1, minWidth: 0, minHeight: 60, fontSize: 17, color: c.text, fontVariant: ["tabular-nums"], paddingVertical: 12 },
  hint: { fontSize: 11, color: c.muted, marginTop: 7 },
  error: { fontSize: 12, color: c.danger, marginTop: 7 },
});
