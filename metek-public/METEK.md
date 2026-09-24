# METEK HERO vCard — HTTPS kart servisi

Bu Site, QR/NFC bağlantılarının bilgisayar kapalıyken ve mobil internetten açılması için kartvizit verilerini Cloudflare D1 üzerinde saklar. Halka açık sayfa `/v/<rastgele-token>`, rehber dosyası `/v/<rastgele-token>/file` adresindedir. Liste/dizin yoktur. Özel, pasif veya sahibi pasif kartlar anonim ziyaretçiye kapalıdır. Sayfalar ve dosyalar önbelleğe alınmaz; arama motorları için noindex kullanılır.

Hesaplar, şifreler ve oturumlar mevcut yerel Express uygulamasında kalır. Kart yönetimi mevcut uygulamadaki yetkilendirmeden sonra `/internal/cards` üzerinden yapılır. Bu sunucular arası uç, 256 bit `METEK_SERVICE_KEY` olmadan işlem kabul etmez ve kart sahipliğini ayrıca kontrol eder. Anahtarı tarayıcıya, EXPO_PUBLIC değişkenlerine veya kaynak koduna koymayın. Sites ortamında gizli değer olarak ayarlayın. Yerelde `.env.local` kullanılabilir.

Sites ortamı: `METEK_SERVICE_KEY` (gizli), `PUBLIC_BASE_URL` (bu Site'ın HTTPS kökü). `.openai/hosting.json` yalnızca Site kimliği ve DB bağını taşır. Drizzle geçişleri `drizzle/` altında; yayın paketindeki geçişler otomatik uygulanır. Standart starter derleme ve yayınlama akışı korunmuştur.

Yerel Express ayarları: `REMOTE_CARDS_URL`, `REMOTE_CARDS_KEY`, `PUBLIC_BASE_URL`. Aktarım için `node --import tsx server/migrateRemoteCards.ts` çalıştırılır. Kullanıcı şifreleri ve oturumlar aktarılmaz. UUID, paylaşım belirteci, durum, gizlilik ve zamanlar korunur. Yerel veritabanı yedek olarak tutulur; aktarım sonrası kart değişikliklerinde yetkili kayıt D1'dir. Tamamlanan aktarım işaretlenir ve tekrar çalıştırılmaz.

Hesap pasifleştirme/yönetici ekranı ileride eklendiğinde yerel kullanıcı durumunu değiştiren işlem bu serviste `owner-status` komutunu da uygulamalıdır. Mevcut başlangıç uygulamasında yönetici/hesap pasifleştirme akışı henüz yoktur.

Kontrol: `METEK_SERVICE_KEY` ortam değişkenini ayarlayıp `node scripts/check-cards.mjs <origin>` çalıştırın. Kontrol kendi deneme kartını oluşturur ve siler; yetkilendirme, sahiplik, güncelleme, özel/pasif kart, hesap durumu, VCF ve silme davranışlarını doğrular. Gerçek kişilerin kartlarını değiştirmez.
