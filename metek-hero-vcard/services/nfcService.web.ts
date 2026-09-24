const message =
  "NFC yazımı tarayıcı önizlemesinde kullanılamaz. NFC destekli telefon ve Development Build gereklidir.";
export async function checkNfc(): Promise<string> {
  return message;
}
export async function cancelNfc(): Promise<void> {}
export async function writeNfc(
  _url: string,
  _update: (message: string) => void,
): Promise<{ verified: boolean }> {
  throw new Error(message);
}
