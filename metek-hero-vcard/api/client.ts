import { Platform } from "react-native";
import Constants from "expo-constants";
import { resolveApiUrl } from "../shared/apiUrl";

const configured = process.env.EXPO_PUBLIC_API_URL;
export const apiUrl = resolveApiUrl({platform:Platform.OS, development:__DEV__, configured, hostUri:Constants.expoConfig?.hostUri});
let token: string | null = null;
let onUnauthorized = () => {};
export function setApiToken(value: string | null) {
  token = value;
}
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  if (!apiUrl)
    throw new Error(
      "API adresi tanımlı değil. Kurulum rehberindeki telefon bağlantısı adımını tamamlayınız.",
    );
  if (!__DEV__ && !apiUrl.startsWith("https://"))
    throw new Error("Canlı ortamda HTTPS bağlantısı gereklidir.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(apiUrl + path, {
      ...init,
      signal: controller.signal,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
    if (!response.ok) {
      const payload: { message?: string } = await response
        .json()
        .catch(() => ({}));
      if (response.status === 401 && !path.startsWith("/auth/"))
        onUnauthorized();
      throw new ApiError(
        response.status,
        payload.message || "İşlem tamamlanamadı. Tekrar deneyiniz.",
      );
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new Error(
      "Sunucuya bağlanılamadı. İnternet bağlantısını ve API servisinin açık olduğunu kontrol ediniz.",
    );
  } finally {
    clearTimeout(timeout);
  }
}
