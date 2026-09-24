import { Alert, Platform } from "react-native";
export function confirm(
  title: string,
  message: string,
  destructive = false,
): Promise<boolean> {
  if (Platform.OS === "web")
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) =>
    Alert.alert(
      title,
      message,
      [
        { text: "Vazgeç", style: "cancel", onPress: () => resolve(false) },
        {
          text: "Onayla",
          style: destructive ? "destructive" : "default",
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    ),
  );
}
