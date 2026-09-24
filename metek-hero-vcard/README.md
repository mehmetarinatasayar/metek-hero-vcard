# METEK HERO vCard

Bu proje, verilen METEK HERO vCard belgesindeki mobil uygulamanın 0.1 başlangıç sürümüdür. Expo uygulaması ve gerçek bir yerel REST API içerir. İlk hedef, hesap açıp bir dijital kartvizit oluşturmak, QR üretmek ve kartın erişimini yönetmektir.

## Bu teslimde hazır olanlar

- Türkçe giriş, üyelik ve dört işlem kartından oluşan ana ekran.
- Gerçek API üzerinden kayıt, giriş, oturumu geri yükleme ve çıkış.
- Kalıcı SQLite veritabanında kullanıcıya ait vCard oluşturma, listeleme, arama, düzenleme, silme ve aktif/pasif işlemleri.
- Tüm istenen kişi, şirket, iletişim ve doğum tarihi alanları; ortak form doğrulaması.
- Özel kart / bağlantıyla erişilebilir kart ayrımı. Normal vCard varsayılan olarak özeldir; QR oluşturma akışında paylaşım bilgisi görünür biçimde açıktır.
- Rastgele bağlantı, mobil uyumlu paylaşım sayfası, Rehbere Ekle ve UTF-8 vCard 3.0 çıktısı.
- QR önizlemesi, yüksek çözünürlüklü PNG, bağlantı kopyalama ve paylaşım servisleri.
- Gerçek NFC kütüphanesine bağlı NDEF yazma servisi ve ekranı; kapasite, yazılabilirlik, mevcut kayıt onayı, iptal ve geri okuma kontrolü. Fiziksel cihazda henüz doğrulanmadı.

Admin yönetim ekranları, şifre sıfırlama, e-posta doğrulama, hesap/yönetim API'sinin buluta taşınması ve mağaza dağıtımı sonraki aşamalardadır. Kart paylaşım servisi HTTPS üzerinden yayındadır; tam mobil uygulama kapsamı henüz tamamlanmamıştır. Ayrıntılar MIMARI.md ve TESTLER.md dosyalarındadır.

## Marka ve iletişim alanları güncellemesi

- Ana tema #B22222 koyu kırmızı; sağlanan METEK logosu girişte ve uygulama ekranlarında görünür.
- Cep telefonu ve Şirket telefonu alanları simgeli girişler ve okunabilir numara grupları kullanır. Mevcut veri alanları korunur.
- Web sitesi için `www.metekgrup.com` veya `metekgrup.com` yazmak yeterlidir. Gerekli bağlantı ön eki otomatik tamamlanır.
- QR'ın beyaz boşluğu dışında METEK HERO marka şeridi bulunur. PNG kaydetme, paylaşma ve kopyalama aynı markalı 1024 × 1200 görseli kullanır. Eski indirilmiş görselleri güncellemek için kartın QR ekranından tekrar kaydedin; kart bağlantısı değişmez.

## QR bağlantısı düzeltmesi — 11 Eylül 2026

Kart paylaşım servisi: https://metek-hero-vcard.arinatasayar.chatgpt.site

Bu bilgisayardaki mevcut uygulama servise bağlandı ve mevcut iki kart aktarıldı. Yeni QR bağlantıları mobil internetten açılır; kartviziti görüntülemek için bilgisayarın açık olması gerekmez. Kart oluşturma/düzenleme için mevcut yerel uygulama ve API açık kalmalıdır. Kartı düzenlemek veya pasife almak, aynı bağlantıya yansır.

Eski indirilen QR görselleri `localhost` içerdiğinden değişmez. Uygulamada kartı açıp ekranı yenileyin; **QR PNG kaydet** ile yeni görseli indirin. İnternete uygun HTTPS adresi yoksa QR paylaşımı artık açık bir mesajla engellenir.

Canlı bağlantı ayarları çalışma kopyasının `.env` dosyasındadır. Hizmet anahtarı, kişisel kartlar, kullanıcılar ve oturumlar bu kaynak ZIP'ine eklenmez. ZIP'ten yeni bir kurulum yaparken `.env.example` açıklamalarına göre bağlantı ayarları ayrıca sağlanmalıdır. `EXPO_PUBLIC_API_URL` yönetim API'sidir ve bu aşamada localhost olarak kalır; onu kart paylaşım Sites adresine çevirmeyin.

## ADIM 1 — Bilgisayarda çalıştırma

### Expo Go ile telefonda açma

Expo Go'nun SDK 57 destekleyen güncel sürümünü kullanın. Önce bilgisayardaki Expo CLI ve telefondaki Expo Go'da **aynı Expo hesabıyla** oturum açın. Bilgisayarda `npx.cmd expo login --browser` giriş sayfasını açar; ardından `npx.cmd expo whoami` ile kullanıcı adını kontrol edin. Telefonun Expo Go profilinde aynı kullanıcı adı görünmelidir. Bu Expo hesabı, METEK uygulamasındaki kartvizit hesabından ayrıdır. [Expo'nun 3 Eylül 2026 giriş duyurusu](https://expo.dev/changelog/expo-go-57-login)

API ve Expo Go bağlantısı hazır olduğunda `METEK_EXPO_GO.png` uygulamanın açılış QR'ıdır; kartvizit paylaşım QR'ı ayrı bir görseldir. Android'de Expo Go içindeki tarayıcıyla, iPhone'da Kamera ile okutun ve Expo Go'da açın. METEK giriş ekranı açılınca kartvizit hesabınızla giriş yapabilirsiniz.

Yeniden başlatmak için bu projenin yapılandırılmış çalışma klasöründe bir terminalde `npm.cmd run api`, ikinci terminalde `npm.cmd run go` çalıştırın. Ekranda verilen yeni QR'ı okutun. Bilgisayar, API ve Expo süreci açık kalmalıdır. Önizleme bağlantısı geçicidir; terminal yeniden başlatıldığında değişebilir. Halka açık HTTPS kartvizit bağlantıları bu önizlemeden bağımsız çalışır.

Bu bilgisayardaki son oturumda Expo'nun ortak ngrok hizmeti eşzamanlı bağlantı limitine ulaştığı için `npm.cmd run go:cloudflare` ile alternatif önizleme kullanıldı. Bu komut, CLI'da açık Expo hesabını kontrol edip Cloudflare Quick Tunnel ve Expo Go sunucusunu birlikte başlatır. `cloudflared` PATH üzerinde, `CLOUDFLARED_PATH` ile belirtilen yerde veya çalışma klasörünün yanındaki `tools/cloudflared.exe` konumunda bulunmalıdır. Araç bu bilgisayarda hazırlanmıştır; kaynak ZIP'ine çalıştırılabilir üçüncü taraf dosyası eklenmez. Yeni bir bilgisayar için [Cloudflare resmî indirmelerini](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/downloads/) kullanın. Bu bağlantı da geliştirme içindir ve bilgisayar kapanınca sona erer.

Giriş, kart yönetimi ve QR paylaşımı Expo Go'da kullanılabilir. NFC modülü Expo Go'da bulunmadığından NFC yazma butonu bu ortamda devre dışıdır; bunun için ayrı Development Build gerekir. Fiziksel cihazdaki dosya paylaşımı ve rehbere alma kullanıcı cihazında ayrıca doğrulanmalıdır.

Expo Go geliştirme oturumunda API adresi `Constants.expoConfig.hostUri` üzerinden otomatik bulunur. `/__metek_api` geliştirme yönlendirmesi istekleri sadece bilgisayardaki `127.0.0.1:3001` API'sine aktarır; giriş ve kart sahipliği kontrolleri korunur. `--tunnel` kullanımında telefon ile bilgisayarın aynı Wi-Fi'de olması gerekmez. Aynı ağda daha hızlı bağlantı için `npm.cmd run go:lan` kullanılabilir. Web API adresi ve yayınlanmış kart bağlantıları aynı kalır. Üretim uygulaması otomatik geliştirme adresini kullanmaz; gerçek HTTPS yönetim API'si ister.

### Yerel web önizlemesi

Bu bilgisayarda Node.js 24.19.0 bulundu ve kullanıldı. Başka bilgisayarda Node.js 24 LTS kurulu olmalıdır. PowerShell'de kontrol edin:

```powershell
node --version
npm.cmd --version
```

Node bulunamıyorsa [resmî Node.js indirme sayfasından](https://nodejs.org/en/download) Node 24 LTS kurun; terminali kapatıp yeniden açın. Global Expo kurulumu gerekmez.

ZIP'i açtıktan sonra `package.json` dosyasının bulunduğu `metek-hero-vcard` klasörünü Dosya Gezgini'nde açın. Adres çubuğuna `powershell` yazıp Enter'a basın. Böylece terminal doğru klasörde açılır.

```powershell
npm.cmd ci
Copy-Item -LiteralPath '.env.example' -Destination '.env'
npm.cmd run api
```

Beklenen sonuç: `METEK HERO vCard API hazır: 3001`. İlk açılışta `data/metek.sqlite` dosyası otomatik oluşturulur. Bu terminali açık bırakın. `.env` zaten varsa kopyalama adımını tekrar uygulamayın; mevcut ayarları koruyun.

Aynı klasörde ikinci bir PowerShell penceresi açın:

```powershell
npm.cmd run web
```

Tarayıcıdan [yerel önizlemeyi](http://localhost:8081) açın. İlk hazırlık biraz sürebilir. Giriş ekranı gelince **Üye olun** ile bir deneme hesabı oluşturun. Önceden tanımlı bir yönetici veya ortak varsayılan şifre yoktur.

1. Ana ekrandan **QR vCard Oluştur** seçin.
2. Ad ve soyadı girin; paylaşım açıklamasını okuyun.
3. **Kaydet ve QR oluştur** ile kartı kaydedin.
4. **QR PNG kaydet** ve **vCard linkini kopyala** işlemlerini deneyin.
5. Bağlantıyı aynı bilgisayardaki başka bir sekmede açın.
6. Kartı pasif yapın; paylaşım sayfasında bilgilerin kapandığını doğrulayın.

Yeni ve bağlantı ayarları yapılmamış kurulumda `localhost` yalnızca bilgisayardan açılır; QR paylaşımı kapalı olur. Bu bilgisayardaki yapılandırılmış çalışma kopyası HTTPS kart servisine bağlıdır. NFC servisi yerel HTTP bağlantısının fiziksel karta yazılmasını engeller.

Çalışmayı durdurmak için iki terminalde de `Ctrl+C` kullanın. Kayıtlar veritabanında korunur. Yeniden başlatmak için yalnızca `npm.cmd run api` ve `npm.cmd run web` yeterlidir.

## Sık karşılaşılan durumlar

| Durum                                | Yapılacak işlem                                                                                                                                 |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| PowerShell `npm.ps1` çalıştırılmıyor | Komutları rehberdeki gibi `npm.cmd` ve `npx.cmd` ile kullanın; sistem yürütme politikasını değiştirmeniz gerekmez.                              |
| Sunucuya bağlanılamadı               | API terminalinin açık olduğunu, `.env` adreslerini ve `http://localhost:3001/health` sonucunu kontrol edin.                                     |
| Port kullanımda                      | Önceki METEK API/Expo terminalini `Ctrl+C` ile kapatın. Başka bir projeye ait süreci kapatmayın.                                                |
| Paket indirirken bağlantı kesildi    | Bağlantı düzeldikten sonra `npm.cmd ci` komutunu tekrar çalıştırın.                                                                             |
| Değişiklik görünmüyor                | Expo terminalini durdurup `npx.cmd expo start --web --clear --port 8081` çalıştırın.                                                            |
| Çok fazla giriş denemesi mesajı      | Giriş sınırının dolmasını bekleyin; giriş denemeleri 15 dakikalık pencerede sınırlandırılır.                                                    |
| Expo Go NFC uyarısı                  | Beklenen davranıştır. NFC için aşağıdaki Development Build aşaması gerekir.                                                                     |
| Expo Go / Expo CLI hesap uyuşmazlığı | Bilgisayarda `npx.cmd expo login --browser` ile telefondaki aynı Expo hesabına giriş yapın. Expo Go bağlantısını yeniden başlatıp güncel QR'ı okutun. |
| A server with the specified hostname could not be found | Geçici Expo Go adresi sona ermiş olabilir. Bu bilgisayarda önizlemeyi `npm.cmd run go:cloudflare` ile yeniden başlatın; eski proje geçmişi yerine yeni QR'ı okutun. API de açık kalmalıdır. |
| NFC kartı okunmuyor                  | Kartın NDEF olarak hazırlanmış, yazılabilir ve telefonla uyumlu olduğunu kontrol edin. Metal yüzey, kılıf ve anten konumu sonucu etkileyebilir. |

## Telefon ve NFC için sonraki kurulum

NFC, Expo Go'nun içinde bulunmayan bir native modül kullanır. Bu yüzden Android/iOS için **Development Build** gerekir. [Expo açıklaması](https://docs.expo.dev/develop/development-builds/introduction/)

Kart paylaşım servisi Sites üzerinde yayınlandı. Telefon kamerasıyla QR açmak için bu HTTPS servisi yeterlidir. Mobil uygulamadan hesap/kart yönetimi ve NFC donanım testi için yönetim API'sinin ayrıca HTTPS üzerinden erişilebilir olması gerekir. `EXPO_PUBLIC_API_URL` yönetim API'sidir; `PUBLIC_BASE_URL` kart bağlantılarının adresidir. `REMOTE_CARDS_KEY` yalnızca sunucuda tutulan gizli anahtardır; EXPO_PUBLIC değişkeni olarak tanımlamayın.

Sunucu kurulduğunda mobil `.env` içindeki `EXPO_PUBLIC_API_URL` ve sunucudaki `PUBLIC_BASE_URL` HTTPS adresine alınır. Üretim API'si `NODE_ENV=production` ile çalışır; yalnızca güvenilen ters proxy kullanılıyorsa `TRUST_PROXY=1` ayarlanır. API portu dışarıya doğrudan açılmamalıdır. Web önizlemesi ile API çerezleri için aynı site altında dağıtım tercih edilir.

HTTPS test adresi ayarlandıktan sonra, Android Studio ve Android SDK bulunan bilgisayarda gerçek telefonla:

```powershell
npx.cmd expo run:android --device
```

USB hata ayıklamasını telefonda açın ve bilgisayar bağlantısına telefondan izin verin. Emülatör, fiziksel NFC doğrulamasının yerine geçmez.

Bulut derleme tercih edildiğinde kullanıcı kendi Expo hesabıyla oturum açar ve projeyi hesabına bağlar:

```powershell
npx.cmd eas-cli@latest login
npx.cmd eas-cli@latest build:configure
npx.cmd eas-cli@latest build --profile development --platform android
```

Oluşan APK telefona kurulduktan sonra `npx.cmd expo start --dev-client` çalıştırılır. iOS için `--platform ios` kullanılır; Apple imzalama ve NFC yetkisi gerekir. Windows üzerinde yerel iOS derlemesi yapılamaz; yerel derleme için macOS/Xcode gerekir. Bu komutlar bu çalışma sırasında çalıştırılmadı.

`com.metek.hero.vcard` başlangıç uygulama kimliğidir. Mağaza kaydından önce kuruluş hesabıyla uygunluğu kontrol edilmelidir. Android/iOS derlemeleri ve imzalama tamamlanmış değildir.

## Denetimleri çalıştırma

```powershell
npm.cmd run typecheck
npm.cmd test
npx.cmd expo-doctor
npx.cmd expo export --platform all --output-dir dist-check
```

`expo export` JavaScript paketlerini hazırlar; APK/IPA veya gerçek NFC çalışma kanıtı üretmez. Bu sürümde kalan uyarılar TESTLER.md içinde açıkça kayıtlıdır. `npm audit fix --force` kullanmayın; önerilen otomatik geri dönüşler Expo sürümünü bozabilir.
