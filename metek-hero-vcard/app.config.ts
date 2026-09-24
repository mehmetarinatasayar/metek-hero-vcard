import type { ExpoConfig } from "expo/config";
const config: ExpoConfig = {
  name: "METEK HERO vCard",
  slug: "metek-hero-vcard",
  version: "0.1.0",
  scheme: "metekhero",
  orientation: "portrait",
  userInterfaceStyle: "light",
  ios: { supportsTablet: true, bundleIdentifier: "com.metek.hero.vcard" },
  android: {
    package: "com.metek.hero.vcard",
    permissions: ["android.permission.NFC"],
  },
  web: { bundler: "metro", name: "METEK HERO vCard" },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-sharing",
    [
      "react-native-nfc-manager",
      {
        nfcPermission:
          "vCard bağlantınızı NFC kartınıza yazmak için NFC erişimi kullanılır.",
        includeNdefEntitlement: false,
      },
    ],
  ],
};
export default config;
