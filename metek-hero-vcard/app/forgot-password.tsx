import { router } from "expo-router";
import { Button, Notice, Screen } from "../components/ui";
export default function ForgotPassword() {
  return (
    <Screen title="Şifremi unuttum" subtitle="Hesabınıza yeniden erişin.">
      <Notice>
        Şifre sıfırlama ve e-posta doğrulama, e-posta servisi kurulacak sonraki
        aşamada açılacak. Bu başlangıç sürümü sıfırlama e-postası göndermez.
      </Notice>
      <Button title="Girişe dön" onPress={() => router.replace("/login")} />
    </Screen>
  );
}
