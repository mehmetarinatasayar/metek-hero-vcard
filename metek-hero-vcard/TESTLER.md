# METEK HERO vCard doğrulama kaydı

11 Eylül 2026 tarihinde yerel Windows ortamında yapılan kontroller:

Expo Go hostname hatası: Önceki Quick Tunnel adresi DNS ENOTFOUND döndürdü; bağlantı kayıtları tünelin kapandığını doğruladı. Yeni tünel açıldı. Yeni adreste oturumsuz erişimin reddi, test hesabıyla giriş/kart listesi/çıkış, Expo hesap eşleşmesi ve iOS/Android paketleri başarılı. Ayrıca cihaz kayıtlarında görülen "Text strings must be rendered within a Text component" hatası için doğum tarihi bölümündeki View altında kalan açık boşluk metni kaldırıldı. Native yerleşimlerde bu tür sabit metinleri yakalayan kontrol eklendi; TypeScript ve toplam 10 test grubu geçti. Telefonun yeni QR ile tekrar açılması kullanıcı cihazında doğrulanmalıdır.

Son logo düzenlemesi: Şirket sitesindeki tam METEK GRUP logosu kendi renkleriyle beyaz zemin üzerinde kullanıldı. TypeScript kontrolü geçti. Giriş, ana sayfa ve iç ekran başlığı 390/320 piksel genişliklerde kontrol edildi; orijinal 1484 × 401 logo yüklendi, yatay taşma veya tarayıcı çalışma hatası görülmedi. Bu düzenleme kart verisi, telefon/web adresi davranışı veya QR içeriğini değiştirmez.

Marka ve form güncellemesi: Ana renk #B22222, orijinal logo, cep/şirket telefonu etiketleri ve numara gruplaması uygulandı. TypeScript ve 9 otomatik test grubu geçti. Alan adıyla web sitesi girişi, HTTP/HTTPS desteği, zararlı protokol reddi, buluta iletmeden önce normalizasyon ve VCF bağlantısı test edildi. Ayrı tarayıcı oturumunda 390 ve 320 piksel genişliklerde giriş, logo, telefon alanları, kart kaydı ve QR indirme kontrol edildi; tarayıcı çalışma hatası görülmedi. İndirilen 1024 × 1200 PNG bağımsız QR okuyucusuyla çözüldü ve kartın mevcut HTTPS URL'siyle eşleşti. Kırmızı marka şeridi QR'ın beyaz boşluğunun dışındadır. Sentetik kart test sonunda silindi. Mevcut kullanıcı kartları değiştirilmedi. iOS/Android JavaScript paketleri, Expo hesap eşleşmesi ve internet tünelindeki API erişimi yeniden doğrulandı. Native SVG'den PNG üretimi, sistem paylaşım menüsü ve fiziksel kamera taraması cihazda ayrıca doğrulanmalıdır.

Expo Go hazırlığı: SDK 57 paket uyumluluk kontrolü güncel, TypeScript ve yedi test grubu başarılı. iOS/Android Expo Go manifestleri ve her iki JavaScript paketi internet tünelinden HTTP 200 ile indirildi; manifestteki sunucu adresi tünelle eşleşti. Paketlerde gizli kart servisi anahtarının bulunmadığı kontrol edildi. Aynı tünelde sentetik hesapla gerçek giriş, kart listesi ve çıkış başarılı; oturumsuz kart isteği 401 döndü. Expo Go içinde NFC yazma butonu devre dışı. Bu kontroller fiziksel telefonda uygulamayı açma testinin yerine geçmez.

Kullanıcının iPhone denemesinde Expo Go/CLI hesap uyuşmazlığı görüldü. SDK 57 iPhone sürümü iki tarafta aynı Expo hesabıyla giriş gerektiriyor. İlk HTTP/bundle kontrolleri bu koşulu doğrulamamıştı; hazırlık kontrolüne CLI oturumu zorunluluğu eklendi. Fiziksel cihazda açılış, hesap eşleştirmesinden sonra yeniden doğrulanmalıdır.

Hesap eşleştirmesi tamamlandı: Expo CLI ve iOS/Android manifestlerindeki `expoGo.username` alanı `mehmetarinatasayar` olarak doğrulandı. Expo'nun ortak ngrok kotası ERR_NGROK_108 döndürdüğü için yeni oturum Cloudflare Quick Tunnel üzerinden açıldı. API adresi bu bağlantıda HTTPS kullanır. Sentetik hesapla internet üzerinden giriş, kart listesi ve çıkış yeniden geçti; iOS ve Android paketleri indirildi. TypeScript ve önizleme adresi/yönlendirme testleri başarılı. Telefonun Expo Go profilinde aynı kullanıcı adıyla tekrar QR okutulması gerekir.

QR düzeltmesi sonrası: TypeScript geçti, beş otomatik test grubu geçti. İnternete uygun olmayan QR adreslerinin reddi, bulut aktarımında oturum denetimi ve hizmet kesintisinde eski veriye dönmeme kontrol edildi. Sites yerel ve canlı HTTPS ortamlarında servis anahtarı, kart sahipliği, oluşturma/güncelleme, private/passive, pasif hesap, silme ve VCF davranışları sentetik kartla doğrulandı; deneme kartı silindi. Canlı denemeler çerez veya ziyaretçi girişi kullanmadan yapıldı. Mevcut iki kart taşındı, kullanıcı hesabındaki Arın Atasayar kartı uygulamadan yeniden indirildi ve 1024 × 1024 PNG bağımsız QR okuyucusuyla çözüldü: canlı HTTPS kart URL'si ile eşleşti. Fiziksel telefon kamerasıyla tarama kullanıcı cihazında ayrıca denenebilir.

| Kontrol                                                                            | Sonuç                                  |
| ---------------------------------------------------------------------------------- | -------------------------------------- |
| TypeScript strict denetimi                                                         | Geçti                                  |
| UTF-8 vCard, kaçışlar, 75 bayt katlama ve satır enjeksiyonu                        | Geçti                                  |
| Geçersiz tarih, URL ve telefon reddi                                               | Geçti                                  |
| Gerçek API ile üyelik, giriş, çıkış ve çerezle oturum                              | Geçti                                  |
| Rolü istekten ADMIN yapma girişimi                                                 | USER olarak kaldı                      |
| İkinci hesabın başka kullanıcı kartını okuma/değiştirme/silme/durum/NFC log isteği | Engellendi                             |
| Public, private, aktif, pasif ve silinmiş bağlantılar                              | Beklenen durum kodları doğrulandı      |
| Pasif kullanıcının API ve public kart erişimi                                      | Engellendi                             |
| HTML içindeki script metninin kaçışlanması                                         | Geçti                                  |
| Kaynak dışı Origin ile yazma isteği                                                | Engellendi                             |
| Kullanıcı bilgisi veya parola içermeyen audit kaydı                                | Kontrol edildi                         |
| Web, Android ve iOS JavaScript export                                              | Üçü de başarıyla üretildi              |
| Tarayıcıda üyelik, form, vCard oluşturma/düzenleme, yenilemeden sonra oturum       | Çalıştı                                |
| 390 piksel genişlikte QR detay ekranı                                              | Görsel olarak kontrol edildi           |
| QR PNG indirme                                                                     | 1023 × 1023 piksel PNG oluştu          |
| İndirilen QR'ın bağımsız okuyucuyla çözülmesi                                      | Beklenen rastgele vCard URL'sini verdi |
| Bağlantıyı kopyalama ve public sayfayı açma                                        | Çalıştı                                |

İlk doğrulama üç test grubu içeriyordu; QR düzeltmesiyle toplam beş gruba çıktı. API grubunda çok sayıda uç nokta ve yetki senaryosu bulunur. İn-memory test veritabanı her test sonunda kapatılır. Çalışma veritabanı, hizmet anahtarı ve oturumlar dağıtılan kaynak paketine eklenmedi.

## Açık kontroller

- `expo-doctor`: 21 kontrolden 20'si geçti. Kalan kontrol, NFC kütüphanesinin React Native Directory'de yeni mimari için test edilmemiş görünmesidir. Uyarı gizlenmedi; beta sürüm ve fiziksel cihaz testi gerekliliği korundu.
- `npm audit`: Expo Go hazırlığı sonrasında 5 orta seviye bildirim var. Üçü `expo-router → query-string → decode-uri-component`, ikisi yalnızca geliştirmede kullanılan `@expo/ngrok → uuid` zincirinden geliyor. Expo'nun önerilen kararlı paket setini bozan otomatik sürüm düşürme uygulanmadı. Üretim dağıtımı öncesi uyumlu düzeltme ve regresyon testi gerekiyor.
- `xcode` aracının eski `uuid` bağımlılığı, kullandığı CommonJS `v4` API'sini koruyan 11.1.1 sürümüne hedefli override ile alındı; böylece bu zincirdeki bildirimler kaldırıldı.
- APK/IPA üretilmedi. JavaScript export, native derleme veya çalışma zamanı testi değildir.
- SecureStore, native tarih seçici, native dosya paylaşımı, iOS/Android kişi uygulamasına VCF alma ve fiziksel NFC yazma/okuma henüz gerçek cihazda doğrulanmadı.
- Şifre sıfırlama, e-posta doğrulama ve admin ekranları henüz uygulanmadığından tamamlandı olarak test edilmedi.
- Sunucu yük testi, çok süreçli rate limit, TLS dağıtımı, yedekleme/geri yükleme ve kapsamlı erişilebilirlik testleri sonraki aşamadadır.
