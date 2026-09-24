import { theme } from "../theme";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuth } from "../store/auth";
import { Button, Notice, Screen } from "../components/ui";
export default function RootLayout() {
  const { ready, restore, restoreError, user } = useAuth();
  useEffect(() => {
    void restore();
  }, [restore]);
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {!ready ? (
        <View
          style={{
            flex: 1,
            backgroundColor: theme.colors.background,
            justifyContent: "center",
          }}
        >
          <ActivityIndicator
            accessibilityLabel="Oturum kontrol ediliyor"
            color={theme.colors.primary}
          />
        </View>
      ) : restoreError ? (
        <Screen back={false} title="Bağlantı kurulamadı">
          <Notice error>{restoreError}</Notice>
          <Button title="Tekrar dene" onPress={() => void restore()} />
        </Screen>
      ) : (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        >
          <Stack.Protected guard={!user}>
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="forgot-password" />
          </Stack.Protected>
          <Stack.Protected guard={!!user}>
            <Stack.Screen name="(main)" />
          </Stack.Protected>
        </Stack>
      )}
    </SafeAreaProvider>
  );
}
