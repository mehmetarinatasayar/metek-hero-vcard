import type Svg from "react-native-svg";
export function qrImage(_value: string, svg: Svg | null): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!svg) return reject(new Error("QR henüz hazır değil."));
    const timeout = setTimeout(() => reject(new Error("QR görseli hazırlanamadı. Tekrar deneyiniz.")), 10000);
    try {
      svg.toDataURL((base64) => { clearTimeout(timeout); resolve(base64); }, { width: 1024, height: 1200 });
    } catch (error) { clearTimeout(timeout); reject(error); }
  });
}
