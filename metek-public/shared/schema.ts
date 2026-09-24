import { z } from "zod";

const text = (max = 160) =>
  z.string().trim().max(max, `En fazla ${max} karakter giriniz.`);
const name = text(80).min(1, "Bu alan zorunludur.");
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Geçerli bir e-posta adresi giriniz.")
  .max(254);
export const passwordSchema = z
  .string()
  .min(8, "Şifre en az 8 karakter olmalıdır.")
  .max(128)
  .regex(/[A-Z]/, "Şifre en az bir büyük harf içermelidir.")
  .regex(/[a-z]/, "Şifre en az bir küçük harf içermelidir.")
  .regex(/[0-9]/, "Şifre en az bir rakam içermelidir.");
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Şifrenizi giriniz.").max(128),
});
export const registerSchema = z.object({
  firstName: name,
  lastName: name,
  email: emailSchema,
  password: passwordSchema,
});
const phone = text(30).refine(
  (v) =>
    !v ||
    (/^[+\d\s().-]+$/.test(v) &&
      v.replace(/\D/g, "").length >= 7 &&
      v.replace(/\D/g, "").length <= 15),
  "Geçerli bir telefon numarası giriniz.",
);
export const cardSchema = z.object({
  firstName: name,
  lastName: name,
  company: text(),
  department: text(),
  title: text(),
  phone,
  mobilePhone: phone,
  email: z.union([z.literal(""), emailSchema]),
  address: text(500),
  website: text(300).refine((v) => {
    if (!v) return true;
    try {
      return ["https:", "http:"].includes(new URL(v).protocol);
    } catch {
      return false;
    }
  }, "https:// ile başlayan geçerli bir adres giriniz."),
  birthDate: text(10).refine((v) => {
    if (!v) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
    const d = new Date(v + "T00:00:00Z");
    return (
      !Number.isNaN(d.getTime()) &&
      d.toISOString().slice(0, 10) === v &&
      v <= new Date().toISOString().slice(0, 10) &&
      v >= "1900-01-01"
    );
  }, "Geçerli bir doğum tarihi seçiniz."),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
});
export type CardInput = z.infer<typeof cardSchema>;
export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMIN" | "USER";
  status: "ACTIVE" | "PASSIVE";
  emailVerified: boolean;
};
export type VCard = CardInput & {
  id: string;
  userId: string;
  publicToken: string;
  publicUrl: string;
  status: "ACTIVE" | "PASSIVE";
  createdAt: string;
  updatedAt: string;
};
export const emptyCard: CardInput = {
  firstName: "",
  lastName: "",
  company: "",
  department: "",
  title: "",
  phone: "",
  mobilePhone: "",
  email: "",
  address: "",
  website: "",
  birthDate: "",
  visibility: "PRIVATE",
};
