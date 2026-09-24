# METEK HERO vCard mimarisi ve geliştirme kapsamı

## Teknoloji seçimi

11 Eylül QR düzeltmesi: Kart kayıtları artık Sites üzerindeki D1 servisinde kalıcıdır. Mevcut Node/SQLite API hesap, oturum ve işlem kayıtlarını tutar; oturum doğrulandıktan sonra kart işlemlerini sunucu anahtarıyla bulut servisine iletir. Bulut servisi kart sahipliğini yeniden doğrular. Yerel SQLite kartları aktarım öncesi yedektir, bulut bağlantısı açıkken okunmaz/yazılmaz. Eski yerel public rotalar HTTPS servisine yönlenir. Bulut hizmeti çalışmıyorsa 503 döner; eski veriye sessizce dönülmez. Bulut kaynakları teslimdeki `metek-public` klasöründedir; ayrıntılar oradaki METEK.md dosyasındadır.

Expo 57.0.22, React Native 0.86.3, React 19.2.3 ve strict TypeScript kullanılıyor. Expo Go hazırlığında SDK 57 paketleri uyumluluk denetimine göre güncellendi. Mobil gezinme Expo Router; formlar React Hook Form ve Zod; oturum durumu Zustand; güvenli mobil saklama SecureStore ile sağlanır. [Expo SDK 57](https://expo.dev/changelog/sdk-57)

QR için `react-native-qrcode-svg`, SVG çizimi ve web/native PNG çıktısı için `react-native-svg`, paylaşım için React Native Share ve Expo Sharing, dosya için Expo FileSystem, pano için Expo Clipboard, mobil tarih seçimi için community DateTimePicker kullanılır. İkonlar Lucide, tema merkezi olarak `theme/index.ts` dosyasındadır; ana renk #B22222'dir. Kullanıcının doğrudan gönderdiği son METEK GRUP logosu `assets/metek-grup-logo-onayli.png` dosyasındadır. 567 × 189 PNG renkleri ve içeriği değiştirilmeden, ortak Brand bileşeninde beyaz zemin üzerinde kendi en/boy oranıyla gösterilir. Kaynak bilgisi `assets/BRAND.md` dosyasındadır.

API, Node 24 üzerinde Express 5 ve SQLite kullanır. Yerel geliştirmede ek veritabanı kurulumu gerektirmez. Veritabanı canlı ortama taşınmadan önce sürümlü migration, yedekleme, saklama süreleri ve işletim modeli tamamlanmalıdır. Çoklu sunucu hedefinde PostgreSQL'e geçiş planlanır; bu sürümde PostgreSQL bağlantısı yoktur.

## Klasörler

```text
metek-hero-vcard/
  app/                 Expo Router ekranları ve korunan rotalar
    (main)/            Giriş gerektiren ekranlar
      cards/           Liste, oluşturma, düzenleme, detay ve QR
      nfc.tsx          NFC cihaz ve yazım akışı
  screens/             Ortak giriş/üyelik ve vCard form ekranları
  components/          Marka, buton, alan, panel ve işlem kartları
  api/                 HTTP istemcisi ve hata eşlemesi
  services/            Kimlik, kart, NFC, dosya ve paylaşım servisleri
  store/               Zustand oturum durumu
  hooks/               Odaklanınca kayıt yenileme
  shared/              Mobil ve API için ortak tipler, Zod ve vCard üretimi
  utils/               Platforma uygun onay diyaloğu
  theme/               Merkezi renk ve tema tanımları
  server/              REST API, yetki kontrolleri ve SQLite şeması
  tests/               Veri standardı, doğrulama ve API entegrasyon testleri
  assets/              Uygulama görselleri için ayrılan alan
  data/                Çalışma sırasında oluşur; teslim/Git dışında tutulur
  app.config.ts        Uygulama adı, platformlar ve native eklentiler
  eas.json             Development, preview ve production derleme profilleri
  .env.example         Örnek ortam değişkenleri
```

Tipler ve doğrulama ayrı boş klasörlere dağıtılmadan `shared/schema.ts` içinde paylaşılır. Ekranlar doğrudan HTTP isteği yapmaz; servisleri çağırır. Native NFC kodu web paketine alınmaz; web adaptörü açık bir desteklenmiyor mesajı verir.

## Veritabanı ve oturum

| Tablo      | Başlıca alanlar ve sorumluluk                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------- |
| users      | UUID, ad/soyad, tekil e-posta, parola hash'i, rol, durum, e-posta doğrulama bayrağı, tarihler     |
| sessions   | Token hash'i, kullanıcı ID'si, son kullanma zamanı; kullanıcı silinirse oturum da silinir         |
| vcards     | UUID, sahip kullanıcı, benzersiz 256 bit public token, doğrulanmış kart verisi, durum ve tarihler |
| audit_logs | İşlemi yapan ID, işlem türü, hedef ID ve zaman; ad, e-posta, parola veya token tutulmaz           |

İlk sürümde roller `USER`/`ADMIN` kontrolüyle users tablosundadır. Genel rol/izin kataloğu ve ayrı `roles` tablosu, yönetim aşamasında migration ile eklenecektir. Kart alanları başlangıçta doğrulanmış JSON olarak tutulur; arama/raporlama gereksinimleri arttığında sütunlara ayrılabilir. NFC kayıtları audit tablosunda istemcinin bildirdiği sonuç olarak işaretlenir; sunucu fiziksel yazımı kendi başına doğrulamış sayılmaz.

Parolalar rastgele salt ve scrypt ile hash'lenir (N=131072, r=8, p=1). Girişte kriptografik rastgele 32 bayt oturum anahtarı üretilir; sunucuda SHA-256 hash'i tutulur. Oturum 7 gün geçerlidir. Native uygulama anahtarı SecureStore'da saklar. Web önizlemesi HttpOnly, SameSite=Strict çerez kullanır; üretimde Secure bayrağı eklenir. LocalStorage'a token yazılmaz. Çıkış sunucudaki oturumu da iptal eder. Otomatik yenilenen refresh-token akışı henüz yoktur.

Yeni üyeler daima USER olur. İstek gövdesinden rol atanamaz. API her kart işleminde sahiplik denetler; başka kullanıcının kayıt ID'sini bilen normal kullanıcıya da 404 döner. ADMIN için sunucu yetki kontrolü temeli vardır; yönetici atama akışı, admin rotaları ve yönetim ekranları bu teslimde açılmamıştır.

## vCard ve paylaşım

İç kayıt UUID'si ile paylaşım token'ı ayrıdır. Public URL kişi bilgisi içermez: `/v/<rastgele-token>`. Token'ı bilen kişi yalnızca PUBLIC ve ACTIVE bir kartın bilgilerini görebilir. Hesabı pasif kullanıcının kartları da public olarak açılmaz. Özel/silinmiş kart 404, pasif paylaşılan kart 410 verir. Public JSON yanıtta sahip kullanıcı ID'si ve iç kayıt ID'si yer almaz.

Kart güncellenirken URL sabit kalır; fiziksel NFC kartını yeniden yazmadan bilgiler değişir. Erişimi kapatmak önceki VCF indirmelerini, ekran görüntülerini veya telefon rehberine kaydedilmiş kişileri geri alamaz. Rastgele URL, bağlantıyı elinde tutan kişiye karşı şifreleme değildir.

vCard 3.0 çıktısı UTF-8, CRLF satır sonu, metin kaçışları ve 75 bayt satır katlaması kullanır. ORG şirket ve departmanı birlikte taşır. QR içerisine kişi metni yerine URL yazılır; M hata düzeltmesi, beyaz zemin ve boş kenar korunur. BrandedQr bileşenindeki kırmızı METEK HERO şeridi boş kenarın dışındadır. Kaydetme, paylaşma ve kopyalama aynı SVG'nin 1024 × 1200 PNG çıktısını kullanır. Native dosya kaydetme/paylaşma sistem paylaşım menüsünü kullanır. Ayrı SVG indirme düğmesi henüz eklenmedi.

Web sitesi alanı www ile başlayan veya doğrudan alan adı içeren girişleri kabul eder. Ortak şema, kayıttan önce eksik protokolü HTTPS olarak tamamlar; mevcut HTTP/HTTPS adresleri desteklenir, diğer protokoller reddedilir. Aynı doğrulama yerel API'de ve bulut kart servisine iletilmeden önce uygulanır. `phone` alanı Şirket telefonu, `mobilePhone` alanı Cep telefonu olarak gösterilir; veri anahtarları ve vCard WORK/CELL eşlemesi değişmez. Türkiye numaraları alan odağı kaybolduğunda gruplanır, ülke kodu kendiliğinden eklenmez.

## NFC yaklaşımı ve sınırlar

`react-native-nfc-manager` 4.0.0-beta.9 yeni React Native mimarisi için seçildi. Kütüphanenin v3 kolu eski mimari içindir. Bu beta bağımlılığı cihaz doğrulaması gerektirir. [Kütüphane sürüm notları ve uyumluluk tablosu](https://github.com/revtel/react-native-nfc-manager)

Yazım sırası: aktif/paylaşılabilir kartı API'den tekrar al; NFC desteğini kontrol et; NDEF oturumu aç; yazılabilirliği ve bayt kapasitesini sorgula; mevcut NDEF'i oku; doluysa oturumu kapatıp onay iste; aynı kartı yeniden okut ve içerik/varsa ID eşleşmesini kontrol et; NDEF URI yaz; tekrar okuyarak tek URL kaydını doğrula; oturumu her durumda kapat. Kart bekleme süresi 30 saniyedir. Geri okuma başarısızsa tam doğrulama başarısı gösterilmez.

- **Android:** NFC donanımı ve açık NFC ayarı gerekir. MIFARE Classic desteği tüm Android cihazlarda zorunlu değildir. NDEF desteği ayrıca kontrol edilir. [Android MIFARE Classic](https://developer.android.com/reference/android/nfc/tech/MifareClassic)
- **iOS:** Core NFC destekli iPhone, uygun imzalama/yetki ve aktif tarama oturumu gerekir. MIFARE Classic, kütüphanenin iOS uyumluluk tablosunda desteklenmez. Ultralight veya DESFire adı tek başına NDEF yazılabilirlik garantisi değildir. [Apple Core NFC](https://developer.apple.com/documentation/corenfc), [kütüphane uyumluluğu](https://github.com/revtel/react-native-nfc-manager)
- **Kart:** NDEF biçimlendirmesi, yazma kilidi ve kapasite belirleyicidir. Bu sürüm formatlama, sektör anahtarı yönetimi veya kartı kalıcı kilitleme yapmaz. [Android NDEF](https://developer.android.com/reference/android/nfc/tech/Ndef)

## Ekranlar ve sonraki aşamalar

Hazır ekranlar: giriş, üyelik, şifremi unuttum bilgilendirmesi, dört işlemli ana sayfa, kart formu, kart listesi/arama, kart detayı/QR, NFC yazım ekranı, uygulama dışında public kart ve VCF indirme.

1. **Yönetim:** ADMIN paneli, kullanıcı CRUD, rol/durum yönetimi, tüm kartların filtrelenmesi, kullanıcı silmenin bağlı kayıtlara etkisi ve yetki testleri.
2. **E-posta:** Tek kullanımlık ve süreli doğrulama/sıfırlama token'ları, e-posta sağlayıcısı, parola değişince oturum iptali. Mevcut `emailVerified=false` alanı tek başına doğrulama sistemi değildir.
3. **Canlı altyapı:** HTTPS alan adı, sunucu dağıtımı, sürümlü migration, yedek/geri yükleme, paylaşımlı rate-limit deposu, hesap bazlı brute-force koruması, izleme ve log saklama politikası. Mevcut rate limit tek API süreci ve IP bazındadır.
4. **Cihaz doğrulaması:** Android/iOS derleme, farklı kartlarla gerçek NFC testi, iptal/kart uzaklaştırma/düşük kapasite/kilitli kart durumları, QR kamera testi, VCF rehbere alma, erişilebilirlik ve klavye testi.
5. **Yayın hazırlığı:** Bağımlılık uyarılarının giderilmesi, uygulama simgesi, gizlilik/aydınlatma içeriği, veri saklama ve hesap silme akışları, mağaza imzalama. Bu prototip bir KVKK uygunluk belgesi değildir.

Sosyal medya, sohbet, CRM, ödeme, PDKS ve erişim kontrolü kapsam dışındadır.

