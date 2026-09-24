import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { request, setApiToken } from "../api/client";
import type { User } from "../shared/schema";

const key = "metek.session";
type Session = { token: string; user: User };
async function accept(session: Session) {
  if (Platform.OS !== "web") {
    await SecureStore.setItemAsync(key, session.token);
    setApiToken(session.token);
  }
  return session.user;
}
export const authService = {
  async restore() {
    if (Platform.OS !== "web") setApiToken(await SecureStore.getItemAsync(key));
    return request<User>("/users/me");
  },
  async login(input: { email: string; password: string }) {
    return accept(
      await request<Session>("/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    );
  },
  async register(input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) {
    return accept(
      await request<Session>("/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    );
  },
  async logout() {
    await request<void>("/auth/logout", { method: "POST" });
    await this.clear();
  },
  async clear() {
    setApiToken(null);
    if (Platform.OS !== "web") await SecureStore.deleteItemAsync(key);
  },
};
