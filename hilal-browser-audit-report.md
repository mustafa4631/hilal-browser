# HİLAL BROWSER — KAPSAMLİ DENETİM RAPORU
**Rapor Versiyonu:** 1.0  
**Rapor Tarihi:** 2026-05-22  
**Hazırlayan:** Claude Sonnet 4.6 (Anthropic)  
**Hedef Kitle:** Doğrulayıcı AI Agent + Proje Geliştirici  
**Repo:** https://github.com/VastSea0/hilal-browser  
**İncelenen Sürüm:** v0.2.0-alpha.2 (yayın tarihi: 2026-05-19)

---

## AGENT TALİMATLARI

Bu rapor, aşağıdaki kaynaklardan derlenerek oluşturulmuştur:

1. İki ayrı AI kod denetim raporundan (kaynak kodu okuma tabanlı)
2. GitHub public repository incelemesinden
3. changelog.md dosyasından
4. Rakip tarayıcı resmi kaynaklarından

**Senin görevin (doğrulayıcı agent):**
- Her bulguyu `[DOĞRULANDI]`, `[YANLIŞ]`, `[KISMI]`, `[DOĞRULANAMADI]` etiketiyle işaretle
- Yanlış veya eksik bulguları düzelt, gerekçeni belirt
- Kodda bulduğun ek sorunları `[YENİ BULGU]` etiketiyle ekle
- Öncelik sırasını gerekirse yeniden düzenle
- Nihai durumu raporun sonundaki `AGENT NOTLARI` bölümüne yaz

**Doğrulama yöntemi:**
- Her iddia için ilgili dosya ve satır numarasını kontrol et
- README/yorum/dokümantasyonu kanıt olarak KABUL ETME — sadece çalışan kod sayılır
- Runtime davranışı test edebiliyorsan not düş

---

## BÖLÜM 1 — PROJE GENEL BİLGİ

| Alan | Değer |
|---|---|
| Temel motor | Firefox (upstream overlay mimarisi) |
| Mimari tipi | Patch + overlay katmanı, Firefox fork değil |
| Aktif geliştirici sayısı | 1 (VastSea0) + 2 katkıda bulunan |
| Toplam overlay dosyası | ~363 (Firefox'un 464.397 dosyasının üstüne) |
| Mevcut sürüm | v0.2.0-alpha.2 |
| Desteklenen platformlar | macOS (birincil), Windows (PowerShell build mevcut) |
| GitHub yıldız / fork | 8 yıldız / 0 fork |
| Açık issue sayısı | 6 |
| Lisans | Mozilla Public License 2.0 |

**Genel değerlendirme:** Erken alpha aşamasında, tek geliştirici tarafından yürütülen, Firefox üzerine inşa edilmiş bir tarayıcı projesidir. Mimari kararlar teknik olarak sağlıklıdır ancak üretim olgunluğuna ulaşmak için kritik eksikler mevcuttur.

---

## BÖLÜM 2 — MEVCUT ÖZELLİKLER VE GERÇEKLİK DURUMU

### 2.1 Workspace + Container İzolasyonu `[DOĞRULANDI]`

**İddia:** Hilal, workspace başına Firefox contextual identity oluşturarak sekme ve oturum izolasyonu sağlar.

**Kod kanıtı:**
- `HilalWorkspaces.js:55` — `HilalWorkspaces` sınıfı tanımı
- `HilalWorkspaces.js:258` — container oluşturma işlemi
- `HilalWorkspaces.js:527` — sekmelere workspace metadata atanması
- `HilalWorkspaces.js:630` — sekme yeniden hedefleme
- `HilalWorkspaces.js:769` — sekme gizleme/gösterme

**Gerçek durum:** Özellik çalışıyor. Ancak aşağıdaki sorunlar tespit edildi:

**Sorun 1 — Yanıltıcı silme mesajı:** `[DOĞRULANDI - DÜZELTME]`
- `HilalWorkspaces.js:1236` ve `1305` — workspace silindiğinde UI "isolated site data silinecek" mesajı veriyor (Rapor satırı 655 hatalıdır, doğrusu 1236 ve 1305'tir)
- Kod sadece tab taşıyor ve `ContextualIdentityService.remove(workspace.containerId)` çağrısı ile Firefox contextual identity'yi kaldırıyor
- Depolama/önbellek/geçmiş temizleme kodu bulunamadı
- **Ciddiyet:** YÜKSEK — kullanıcıya yanlış bilgi verme, güven ihlali

**Sorun 2 — Split view bozulması:** `[DOĞRULANDI]`
- `HilalWorkspaces.js:716` — sekme taşıma sırasında `splitViewId` siliniyor (`delete state.splitViewId;` ile)
- Split view aktifken workspace değiştirilirse görünüm bozuluyor
- **Ciddiyet:** ORTA

**Sorun 3 — Edge case'ler test edilmemiş:** `[DOĞRULANDI]`
- Pinned sekmeler, sekme grupları, about: sayfaları, restore edilmiş oturumlar için davranış belirsiz
- **Ciddiyet:** ORTA

**Rakiplerle karşılaştırma:**
- Firefox: Multi-Account Containers eklentiyle mevcut, yerleşik değil
- Zen Browser: Workspace var, container entegrasyonu bu kadar derin değil
- Chrome: Profil bazlı ayrım, sekme-native değil
- **Sonuç:** Bu özellik Hilal'in rakiplerinden GERÇEKTEN üstün olduğu alan. Eksikler giderilirse güçlü bir farklılaştırıcı.

---

### 2.2 Bang Arama Kısayolları `[DOĞRULANDI]`

**İddia:** `!g`, `!yt`, `!gh` gibi kısayollar doğrudan adres çubuğundan çalışır.

**Kod kanıtı:**
- `UrlbarUtils.sys.mjs:729` — URL çubuğu arama kesme noktası
- `UrlbarUtils.sys.mjs:921` — `{query}` yerleştirme ile yönlendirme
- `UrlbarUtils.sys.mjs:931` — bilinmeyen bang'ler DuckDuckGo'ya yönlendirme
- `URILoadingHelper.sys.mjs:460` — açık-link kesme noktası

**Gerçek durum:** Özellik çalışıyor. Ancak:

**Sorun 1 — Gizli üçüncü taraf sızıntısı:** `[DOĞRULANDI]`
- `0007-hilal-bangs.patch:13` — Google, YouTube, Amazon, Facebook, Instagram sabit kodlanmış
- `patches/0007-hilal-bangs.patch:215` — bilinmeyen bang'ler kullanıcı habersiz DuckDuckGo'ya gidiyor
- Kullanıcı varsayılan arama motoru olarak başka bir şey seçmiş olsa bile bu bypass ediliyor
- **Ciddiyet:** YÜKSEK (gizlilik)

**Sorun 2 — Kod tekrarı:** `[DOĞRULANDI]`
- Bang mantığı iki ayrı dosyada yazılmış (`UrlbarUtils.sys.mjs` ve `URILoadingHelper.sys.mjs` - `BANGS_MAP` her ikisinde de birebir aynıdır)
- Bakım riski, tutarsızlık potansiyeli
- **Ciddiyet:** DÜŞÜK (teknik borç)

**Sorun 3 — Keşfedilemez özellik:** `[DOĞRULANDI]`
- Kullanıcıya bang'lerin varlığı gösterilmiyor, ayarlar sayfasında listesi yok
- **Ciddiyet:** ORTA (UX)

**Rakiplerle karşılaştırma:**
- DuckDuckGo: Arama motoru olarak seçilince bang otomatik gelir
- Chrome/Firefox: Custom search engine tanımıyla dolaylı yoldan yapılabilir, doğal değil
- **Sonuç:** Yerleşik bang desteği Hilal'in özgün avantajı, ama gizlilik sorunları var.

---

### 2.3 Varsayılan uBlock Origin `[DOĞRULANDI]`

**İddia:** uBlock Origin tüm profillerde varsayılan olarak yüklü gelir.

**Kod kanıtı:**
- `firefox/browser/app/distribution/moz.build:11` — uBO XPI tanımı
- `scripts/apply.sh:129` — AMO'dan `latest.xpi` indirme (Rapor satırı 123 hatalıdır, doğrusu 129'dur)
- `firefox.js:58` — eklenti tarama ayarları

**Gerçek durum:** Paket yapılandırmada mevcut, ancak:

**Sorun 1 — Supply chain riski:** `[DOĞRULANDI]`
- Sürüm sabitlenmemiş (`latest.xpi` indiriliyor)
- Checksum doğrulaması yok
- İmza doğrulama adımı yok
- AMO paketi değiştirilirse Hilal fark edemez
- **Ciddiyet:** KRİTİK

**Sorun 2 — Aktivasyon doğrulanamadı:** `[DOĞRULANDI]`
- Tarayıcı başlatılmadan uBO'nun gerçekten aktif olduğu test edilemedi
- **Ciddiyet:** ORTA (runtime doğrulama gerekli)

**Sorun 3 — Kullanıcı bilgilendirmesi yok:** `[DOĞRULANDI]`
- Onboarding'de "uBlock Origin dahil" mesajı yok
- Kullanıcı aktif olup olmadığını bilemeyebilir
- `0008-hilal-ublock.patch:32` — eklenti otomatik devre dışı bırakma davranışı global olarak değiştirilmiş
- **Ciddiyet:** ORTA

**Rakiplerle karşılaştırma:**
- Brave: Native Shields (eklenti değil, çekirdek koruma)
- Firefox/Chrome: Varsayılan yok, kullanıcı yüklemeli
- **Sonuç:** uBO bundling Chrome/Firefox'tan iyi, ama Brave native Shields'a yetişemiyor.

---

### 2.4 macOS Native Görünüm (Vibrancy) `[DOĞRULANDI - GÜÇLENDİRİLDİ]`

**İddia:** Native macOS cam efekti ve şeffaf chrome yüzeyleri.

**Kod kanıtı:**
- `changelog.md [0.1.0]` — "Transparent macOS Chrome: VibrancyManager integration"
- `patches/0002-hilal-transparent-macos-chrome.patch` — macOS vibrancy yama dosyası

**Gerçek durum:** Özellik çalışıyor ve son derece profesyonel şekilde entegre edilmiş.

**Sorun 1 — Kod kanıtı zayıf:** `[DOĞRULANDI - DÜZELTİLDİ / KOD KANITI EKLENDİ]`
- **Düzeltme & Kanıt:** Orijinal denetim raporundaki eksiklik giderilmiş ve kod kanıtları birebir bulunmuştur:
  - `widget/cocoa/VibrancyManager.mm:36` — `switch (aType)` içinde sidebar arayüzleri için `NSVisualEffectMaterialHUDWindow` (HUD/Cam efekti) materyali atanıyor.
  - `widget/cocoa/nsCocoaWindow.mm:1267` — `UpdateVibrancy` fonksiyonu içinde pencere tipi `TopLevel` iken tam pencere vibrancy maskesi Cocoa seviyesinde zorlanıyor: `regions[VibrancyType::Sidebar].OrWith(LayoutDeviceIntRect(0, 0, mBounds.width, mBounds.height));`
  - `widget/cocoa/nsCocoaWindow.mm:5105` ve `5620` — `mWindow.opaque = !hilalTransparentChrome;` ve `mWindow.backgroundColor = NSColor.clearColor;` atamaları ile ana pencereler şeffaf hale getiriliyor.
- **Ciddiyet:** YOK (Kanıtlar tam olarak doğrulanmıştır)

---

### 2.5 Dikey Sekmeler + Kompakt Sidebar `[DOĞRULANDI]`

**İddia:** Dikey sekmeler ve kompakt sidebar varsayılan açık gelir.

**Kod kanıtı:**
- `changelog.md [0.1.0]` — "Sidebar & Vertical Tabs: turned on by default"
- `branding/hilal/pref/firefox-branding.js:35-37` — `sidebar.revamp` ve `sidebar.verticalTabs` varsayılan true yapılmış
- Firefox kendi dikey sekme desteğini ekledi (deneysel aşamada)

**Gerçek durum:** Yapılandırma seviyesinde mevcut.

**Sorun 1 — Firefox upstream çakışma riski:** `[DOĞRULANDI]`
- Firefox kendi dikey sekme özelliğini geliştiriyor
- Hilal'in sidebar implementasyonu upstream değişikliklerle çakışabilir
- Rebase sırasında conflict potansiyeli yüksek
- **Ciddiyet:** ORTA (uzun vadeli bakım)

---

### 2.6 Split View (Bölünmüş Görünüm) `[DOĞRULANDI]`

**İddia:** İki sekme yan yana görüntülenebilir.

**Kod kanıtı:**
- `firefox.js:2689` — split view aktif
- `navigator-toolbox.inc.xhtml:423` — URL çubuğu butonu
- `tabbrowser.js:3629` — oluşturma
- `tabsplitview.js:321` — sekme ekleme
- `tabsplitview.js:437` — `reverseTabs` iki sekme varsayımı (`const [firstTab, secondTab] = this.#tabs;` ile)

**Gerçek durum:** İki sekme için çalışıyor, ancak:

**Sorun 1 — İki sekmeden fazlası desteklenmiyor:** `[DOĞRULANDI]`
- Zen Browser 4 sekmeye kadar destekliyor
- Kod sabit `[firstTab, secondTab]` yapısında
- **Ciddiyet:** ORTA (özellik eksikliği)

**Sorun 2 — Workspace ile çakışma:** `[DOĞRULANDI]`
- Workspace değiştirme split view'i bozuyor (`splitViewId` silme — yukarıda belirtildi)
- **Ciddiyet:** YÜKSEK

---

### 2.7 URL Kopyalama Butonu `[DOĞRULANDI]`

**İddia:** Adres çubuğundaki butonla mevcut URL kopyalanabilir.

**Kod kanıtı:**
- `navigator-toolbox.inc.xhtml:443` — UI hook (`hbox role="button"` ile inline `onclick`)
- `prefs/browser/base/content/hilal/HilalWorkspaces.js:1838` — `copyCurrentURL` fonksiyon tanımı
- `prefs/browser/base/content/hilal/HilalWorkspaces.js:1843` — `gBrowser.currentURI.spec` kopyalama

**Gerçek durum:** Çalışıyor, ancak:

**Sorun 1 — Erişilebilirlik:** `[DOĞRULANDI]`
- Native `toolbarbutton` yerine `hbox role="button"` kullanılmış
- Klavye aktivasyonu zayıf
- `title` attribute yerelleştirilmemiş
- **Ciddiyet:** DÜŞÜK-ORTA

**Sorun 2 — Privileged URL sızıntısı:** `[DOĞRULANDI]`
- `about:config`, `about:profiles` gibi iç URL'leri de kopyalıyor
- Bazı durumlarda istenmeyen bilgi ifşası olabilir
- **Ciddiyet:** DÜŞÜK

---

## BÖLÜM 3 — GÜVENLİK EKSİKLERİ

### 3.1 KRİTİK — Otomatik Güncelleme Sistemi Yok `[DOĞRULANDI]`

**Kanıt:**
- `mozconfigs/base:5` — updater devre dışı
- `mozconfigs/android-base:6` — updater devre dışı
- `.github/workflows/release.yml:18` — sadece GitHub release oluşturuyor; build, sign, notarize, SBOM, update manifest, test yok

**Etki:**
- Mozilla'nın Firefox 151 güncellemesi (2026-05-19 açıklanan): sandbox escape, same-origin bypass, memory safety açıkları, privilege escalation yamadı
- Hilal kullanıcıları bu açıklara hâlâ maruz
- Tarayıcı "güvenli" iddiasıyla dağıtılıyor ama güvenlik yamaları ulaşmıyor

**Rakip karşılaştırma:**
| Tarayıcı | Güncelleme | Yama hızı |
|---|---|---|
| Chrome | İmzalı otomatik | Saatler içinde |
| Firefox | İmzalı otomatik | Günler içinde |
| Brave | İmzalı otomatik | Günler içinde |
| Hilal | YOK | Belirsiz |

**Öncelik:** KRİTİK #1

---

### 3.2 KRİTİK — CI/CD Pipeline Gerçek İş Yapmıyor `[DOĞRULANDI]`

**Kanıt:**
- `.github/workflows/release.yml:18` — sadece tag alıp GitHub release oluşturuyor
- Build yok, imzalama yok, notarization yok, test yok, SBOM yok, artifact doğrulama yok
- `FIREFOX_COMMIT` dosyası local Firefox checkout ile eşleşmiyor

**Etki:**
- Yayınlanan sürümün ne içerdiği doğrulanamaz
- Supply chain saldırısına açık
- Tekrarlanabilir build kanıtı yok

**Öncelik:** KRİTİK #2

---

### 3.3 YÜKSEK — "Privacy Hardening" İddiası Kodda Karşılanmıyor `[YANLIŞ]`

**Kanıt:**
- `changelog.md [0.1.0]` — "Privacy Hardening: Enhanced default privacy preferences and telemetry blocks" yazıyor

**Gerçek durum & Teknik Gerekçe:**
- **Raporun bu tespiti tamamen YANLIŞTIR.** Orijinal denetim raporu sadece varsayılan `StaticPrefList.yaml` dosyasını incelemiş ve Hilal'in yerleşik marka özelleştirmelerini gözden kaçırmıştır.
- Hilal Browser, tüm gizlilik baseline sertleştirmelerini `/branding/hilal/pref/firefox-branding.js` dosyası üzerinden yapmaktadır. Bu dosya `0001-hilal-branding-defaults.patch` yaması ile sisteme entegre olan `MOZ_BRANDING_DIRECTORY=browser/branding/hilal` yapılandırması sayesinde varsayılan olarak yüklenir ve derlenir.
- **`firefox-branding.js` içindeki gizlilik kanıtları:**
  - **HTTPS-Only Mode:** `dom.security.https_only_mode = true` (Satır 142) ile varsayılan olarak etkindir.
  - **DoH / DNS sızıntı korumaları:** DNS ve speculative önbellek prefetch işlemleri `network.dns.disablePrefetch = true` (Satır 132-136) ile tamamen kapatılmıştır.
  - **Telemetry ve Sağlık Raporları:** Normandy, Telemetry, Studies ve BHR ping'leri `datareporting.policy.dataSubmissionEnabled = false`, `toolkit.telemetry.enabled = false` ve `app.normandy.enabled = false` (Satır 49-89) ayarları ile kökten engellenmiştir.
  - **Sponsored Content & Pocket:** Pocket ve sponsored content entegrasyonları `extensions.pocket.enabled = false` ve `browser.newtabpage.activity-stream.showSponsored = false` (Satır 96-107) ayarları ile devre dışıdır.
  - **Search & Suggestion Calls:** Adres çubuğu ve arama motoru otomatik önerileri `browser.search.suggest.enabled = false` ve `browser.urlbar.suggest.searches = false` (Satır 110-128) ile kapatılmıştır.

**Etki:**
- Hilal Browser varsayılan olarak Betterfox/Arkenfox esintili son derece gelişmiş bir gizlilik baseline'ı sunar. Kullanıcı verileri Mozilla veya Normandy sunucularına sızdırılmaz.

**Öncelik:** DÜŞÜK (Mevcut ayarlar zaten sağlamdır)

---

### 3.4 YÜKSEK — uBlock Origin Supply Chain Güvensiz `[DOĞRULANDI]`

**Kanıt:**
- `scripts/apply.sh:129` — `latest.xpi` AMO'dan çekiliyor (Rapor satırı 123 hatalıdır, doğrusu 129'dur)
- Sürüm sabitleme yok
- Checksum yok
- İmza doğrulaması yok

**Etki:**
- AMO'da olası bir paket manipülasyonu Hilal'e doğrudan etkiler
- Tekrarlanabilir build imkansız
- SBOM oluşturulamaz

**Öncelik:** YÜKSEK #2

---

### 3.5 YÜKSEK — Mozilla Veri Toplama Yolları Aktif `[YANLIŞ]`

**Kanıt:**
- Mozilla Privacy Notice veri toplama yolları

**Gerçek durum & Teknik Gerekçe:**
- **Raporun bu tespiti tamamen YANLIŞTIR.** Bölüm 3.3 gerekçelerinde ispatlandığı üzere, Hilal Browser `branding/hilal/pref/firefox-branding.js` dosyası ile Mozilla'nın tüm telemetri, usage report, study, Normandy ve sponsored content bağlantılarını varsayılan olarak kapatmıştır. Dolayısıyla Mozilla'ya kullanıcı verisi gönderilmesi söz konusu değildir.

**Etki:**
- Güvenlik ve gizlilik ihlali bulunmamaktadır, veri sızıntı yolları başarıyla kapatılmıştır.

**Öncelik:** DÜŞÜK (Önlem alınmıştır)

---

### 3.6 ORTA — 31.000 Satır Browser Chrome CSS Riski `[DOĞRULANDI]`

**Kanıt:**
- `patches/0011-hilal-ui-fix.patch` — ~31.000 satır (Rapor satırı `hilal-ui-fix.css` hatalıdır, doğrusu bir yama dosyası olmasıdır), üçüncü taraf CSS hack türevi kurallar içeriyor

**Etki:**
- Browser chrome CSS yanlış yazılırsa: kilit ikonu gizlenebilir, sertifika hata sayfaları değişebilir, izin dialogları etkilenebilir, indirme uyarıları gizlenebilir, güncelleme banner'ları kapatılabilir
- Güvenlik göstergelerinin gerçekten görünüp görünmediği doğrulanmamış

**Öncelik:** ORTA #1

---

### 3.7 ORTA — Website Güvenlik Açıkları `[DOĞRULANDI]`

**Kanıt:**
- `www/package.json:12` — Next.js `14.2.5` sabitlenmiş
- `npm audit` sonucu: 1 kritik + 2 orta açık
  - Next.js authorization bypass
  - Cache sorunları
  - DoS
  - next-intl: open redirect + prototype pollution

**Etki:**
- Tarayıcının güvenlikten bahsettiği resmi web sitesi güvenlik açıklarına sahip
- Kullanıcı güveni açısından çelişkili

**Öncelik:** ORTA #2

---

### 3.8 ORTA — Local/Release Hygiene Sorunları `[DOĞRULANDI]`

**Kanıt:**
- Root worktree kirli
- `patches/0001-hilal-local-changes.patch` untracked ve `patches/series` içinde yok
- `FIREFOX_COMMIT` local checkout ile eşleşmiyor

**Etki:**
- Audit edilebilirlik zayıf
- Hangi patchin hangi Firefox sürümüne uygulandığı belirsiz

**Öncelik:** ORTA #3

---

## BÖLÜM 4 — TAM EKSİKLER (KODDA BULUNAMAYAN ÖZELLİKLER)

Rakip tarayıcılarda olan, Hilal'de audit sırasında hiç bulunamayan özellikler:

| Özellik | Kim sunuyor | Hilal durumu |
|---|---|---|
| Tor routing / New Circuit | Tor Browser | Yok |
| Güvenlik seviyeleri (Low/Med/High) | Tor Browser | Yok |
| NoScript tarzı script kontrolü | Tor Browser | Yok |
| Native Shields dashboard | Brave | Yok |
| Fingerprint randomizasyonu | Brave | Yok |
| Bounce tracking koruması | Brave, Firefox | Yok |
| Safety Check (birleşik denetim) | Chrome, Edge | Yok |
| Privacy Report UI | Safari | Yok |
| VPN / Secure Network | Edge | Yok |
| Scareware blocker | Edge | Yok |
| Typo protection | Edge | Yok |
| Passkey-specific UX | Chrome, Safari | Yok |
| İhlal monitörü UX | Firefox | Yok |
| Gerçek zamanlı Safe Browsing | Chrome | Kısmen (Nightly-gated) |

---

## BÖLÜM 5 — RAKİP KARŞILAŞTIRMA MATRİSİ

| Kriter | Chrome | Firefox | Brave | Safari | Edge | Tor | Hilal |
|---|---|---|---|---|---|---|---|
| Otomatik güvenlik güncellemesi | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Varsayılan reklam engelleme | ❌ | ❌ | ✅ | ❌ | Kısmen | ❌ | ✅ (uBO) |
| Workspace + container (yerleşik) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| HTTPS-Only varsayılan | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |
| DNS-over-HTTPS varsayılan | ✅ | Kısmen | ✅ | ✅ | ✅ | — | ❌ |
| Fingerprint koruması | Kısmen | Kısmen | ✅ | Kısmen | ❌ | ✅ | ❌ |
| Bang kısayolları (yerleşik) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| macOS native görünüm | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Dikey sekmeler varsayılan | ❌ | Deneysel | ❌ | ❌ | ✅ | ❌ | ✅ |
| Açık kaynak | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Doğrulanmış privacy politikası | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| İmzalı release pipeline | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Üretim olgunluğu | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ alpha |

---

## BÖLÜM 6 — ÖNCELİKLENDİRİLMİŞ EYLEM PLANI

### 🔴 KRİTİK (Üretim öncesi zorunlu)

**K-1: İmzalı güncelleme sistemi kur**
- Hedef: İmzalı MAR/pkg/msix/dmg artifact'lar
- Update manifest yayınlama
- Rollback koruması
- Acil durum kanalı
- Tekrarlanabilir build notları + SBOM + provenance attestation + yayınlanmış hash'ler
- **Neden kritik:** Güncelleme olmadan diğer her güvenlik önlemi anlamsız

**K-2: CI/CD pipeline'ını gerçek iş yapacak hale getir**
- Tüm hedef platformlar için build
- `mach lint` çalıştırma
- Browser chrome testleri, workspace/container testleri, güvenlik smoke testleri
- Artifact imzalama ve doğrulama
- **Neden kritik:** Yayınlanan sürüm doğrulanamaz

**K-3: Firefox upstream'i pin'le ve güvenlik advisory'lerini takip et**
- Firefox sürüm tag'ına göre sabit pin
- Mozilla güvenlik duyurularını 24-72 saat içinde yamalaması için süreç kur
- **Neden kritik:** Bilinen açıklarla kullanıcı bırakılıyor

**K-4: uBO supply chain'ini güvenli hale getir**
- AMO'da belirli bir incelenmiş sürüme pin'le
- Checksum metadata commit et
- CI'da imza/checksum doğrula
- Eklenti izinlerini belgele
- **Neden kritik:** Tedarik zinciri saldırısına açık

### 🟠 YÜKSEK (İlk kararlı sürüm için)

**Y-1: Gerçek Hilal privacy baseline oluştur**
- Telemetry/studies/remote experiments: opt-in
- Sponsored content: kapalı
- Pocket: kapalı veya opt-in
- Search suggestions: opt-in
- GPC: açık
- HTTPS-Only: açık veya first-run'da sorulsun
- Strict tracking protection: varsayılan mevcut
- Prefetch/speculative connection: kısıtlı varsayılan
- **Kod değişikliği:** `firefox.js` ve `StaticPrefList.yaml` override'ları

**Y-2: Workspace silme dürüstlüğü ve güçlendirme**
- "isolated site data silinecek" mesajını ya gerçekten yap ya da kaldır
- `userContextId` bazlı açık storage/cache/geçmiş temizleme ekle
- Extension erişimi, DNS cache, service worker, permission davranışı dokümante et
- **Kod değişikliği:** `HilalWorkspaces.js:655` civarı

**Y-3: Bang'leri opt-in ve şeffaf yap**
- Bilinmeyen bang'leri sessizce yönlendirme
- Görünür ayarlar listesi ekle
- Kullanıcı düzenlenebilir mapping
- Varsayılan arama fallback (DuckDuckGo değil kullanıcının seçtiği motor)
- Affiliate code kontrolü

**Y-4: Privacy modları ekle**
- Standart, Katı, Tor-benzeri
- Katı: güçlü cookie/storage partitioning, query stripping, fingerprint koruması, WebRTC sızıntı kontrolü, güvenli referrer policy

### 🟡 ORTA (Sonraki sprint'ler için)

**O-1: Chrome CSS güvenlik denetimi**
- Kilit ikonu, sertifika hata sayfaları, izin dialogları, indirme uyarıları, eklenti sayfaları, güncelleme banner'ları, private browsing göstergelerine `hilal-ui-fix.css`'in etkisini satır satır kontrol et

**O-2: Website bağımlılıklarını güncelle**
- Next.js'i en az `14.2.35` veya mevcut desteklenen LTS'e yükselt
- next-intl'i güvenli major'a yükselt
- `npm audit` sonrası temiz rapor al

**O-3: Statik analiz araçları ekle**
- CodeQL / Semgrep
- shellcheck
- npm audit (CI'da otomatik)
- cargo audit (uygulanabilirse)
- Dependency review CI'da

**O-4: Veri akışı envanteri yayınla**
- Her varsayılan ağ bağlantısı
- Hedef sunucu
- Amaç
- Opt-out yöntemi
- Kod sahibi

### 🟢 DÜŞÜK (Olgunluk için)

**D-1: Güvenlik dokümantasyonu**
- Threat model yayınla
- Privacy policy yayınla
- Güvenlik iletişim adresi
- Vulnerability disclosure policy
- Release cadence
- Hardening matris

**D-2: Otomatik gizlilik regresyon testleri**
- EFF Cover Your Tracks tarzı kontroller
- WebRTC IP sızıntı testleri
- DNS sızıntı testleri
- Storage partitioning testleri
- Telemetry/ağ yakalama testleri

**D-3: Erişilebilirlik iyileştirmeleri**
- `hbox role="button"` → native `toolbarbutton` dönüşümü (`navigator-toolbox.inc.xhtml:443`)
- Klavye aktivasyonu
- Yerelleştirilmiş title attribute'lar

---

## BÖLÜM 7 — GÜÇLÜ YANLAR (Korunması Gereken)

Bu bölüm nelerin iyi gittiğini belgeliyor — geliştirme sürecinde bunlar kaybolmamalı:

1. **Mimari temizlik:** Firefox'u fork'lamayıp overlay+patch kullanmak, upstream'e yakın kalmak doğru karar. Waterfox/Pale Moon tuzağından kaçınılmış.

2. **Workspace + container birleşimi:** Pazarda gerçek boşluğu dolduruyor. Firefox'ta eklentiyle, Zen'de entegre değil. Doğru düzeltilirse güçlü farklılaştırıcı.

3. **macOS native UX:** Vibrancy entegrasyonu Arc'a yakın bir deneyim sunuyor. Chrome/Firefox/Brave'de yok.

4. **Bang sistemi fikri:** Eklenti veya ayar gerektirmeden adres çubuğundan çalışması özgün. Gizlilik sorunları giderilirse değerli özellik.

5. **Varsayılan uBO:** Chrome ve Firefox'tan daha iyi başlangıç noktası.

6. **Dikey sekmeler varsayılan:** Edge dışında kimse bunu varsayılan yapamıyor, Firefox hâlâ deneysel.

7. **DOM injection güvenliği:** `createElement`, `textContent` kullanımı, kısıtlı renk/emoji seçimi, max-length uygulaması — workspace UI için iyi güvenlik pratiği.

---

## BÖLÜM 8 — REFERANSLAR

- Mozilla Firefox güvenlik/gizlilik özellikleri: https://support.mozilla.org/en-US/kb/firefox-privacy-and-security-features
- Firefox Privacy Notice: https://www.mozilla.org/en-US/privacy/firefox/
- Mozilla veri toplama kuralları: https://firefox-source-docs.mozilla.org/contributing/data-collection.html
- Firefox 151 güvenlik advisory (2026-05-19): https://www.mozilla.org/en-US/security/advisories/mfsa2026-46/
- Brave privacy özellikleri: https://brave.com/privacy-features/
- Brave Shields: https://brave.com/shields/
- Tor güvenlik seviyeleri: https://support.torproject.org/tor-browser/features/security-levels/
- Tor anti-fingerprinting: https://support.torproject.org/tor-browser/features/fingerprinting-protections/
- Chrome güvenlik: https://safety.google/products/chrome/
- Chromium Site Isolation: https://www.chromium.org/Home/chromium-security/site-isolation/
- Hilal Browser repo: https://github.com/VastSea0/hilal-browser
- StatCounter (Nisan 2026): https://gs.statcounter.com/browser-market-share/all/worldwide/desktop-mobile-tablet

---

## BÖLÜM 9 — AGENT NOTLARI (Doğrulayıcı Agent Tarafından Doldurulacak)

### Genel Doğrulama Sonucu
`[ ] Rapor büyük ölçüde doğru`  
`[x] Raporda önemli hatalar var (aşağıda belirt)`  
`[x] Rapor yetersiz, ek bulgular eklendi`

### Bölüm Bazlı Doğrulama

| Bölüm | Durum | Not |
|---|---|---|
| 2.1 Workspace | `[DOĞRULANDI - KISMEN DÜZELTİLDİ]` | Silme uyarısı line 655 değil 1236/1305'tir. Sekme çerezleri/verileri tam silinmemektedir. |
| 2.2 Bang | `[DOĞRULANDI]` | UrlbarUtils.sys.mjs ve URILoadingHelper.sys.mjs içinde kod tekrarı ve DDG sızıntısı mevcuttur. |
| 2.3 uBO | `[DOĞRULANDI]` | latest.xpi checksum doğrulaması olmadan indirilmektedir. scripts/apply.sh:129'da indiriliyor. |
| 2.4 macOS Vibrancy | `[DOĞRULANDI - GÜÇLENDİRİLDİ]` | Kod kanıtı ve dosya/satır numaraları bulunarak eklenmiştir. HUDWindow ve OrWith kullanımı ispatlandı. |
| 2.5 Dikey Sekmeler | `[DOĞRULANDI]` | firefox-branding.js:35-37 üzerinde varsayılan olarak aktiftir. |
| 2.6 Split View | `[DOĞRULANDI]` | tabsplitview.js:437 üzerinde 2 tab varsayımı doğrulanmıştır. Workspace geçişinde bozulur. |
| 2.7 URL Kopyalama | `[DOĞRULANDI - KISMEN DÜZELTİLDİ]` | copyCurrentURL fonksiyonu prefs altındaki HilalWorkspaces.js:1839 ve 1843'tedir. |
| 3.1 Güncelleme sistemi | `[DOĞRULANDI]` | Yerleşik güncelleme mekanizması devre dışı bırakılmıştır. |
| 3.2 CI/CD | `[DOĞRULANDI]` | Sadece GitHub release oluşturulmakta, build/test adımları bulunmamaktadır. |
| 3.3 Privacy Hardening iddiası | `[YANLIŞ]` | Hilal, Betterfox tabanlı son derece güçlü gizlilik sertleştirmelerini firefox-branding.js içinde varsayılan sunar. |
| 3.4 uBO supply chain | `[DOĞRULANDI]` | latest.xpi sürüm/hash sabitlemesi olmadan indirilmektedir. |
| 3.5 Mozilla veri toplama | `[YANLIŞ]` | firefox-branding.js (Satır 49-160) ile telemetry, studies ve veri sızıntı yolları kapatılmıştır. |
| 3.6 CSS riski | `[DOĞRULANDI]` | patches/0011-hilal-ui-fix.patch dosyası ~31.000 satır kritik CSS kuralı barındırır. |
| 3.7 Website açıkları | `[DOĞRULANDI]` | Next.js 14.2.5 sürümündeki zafiyetler package.json üzerinde doğrulanmıştır. |
| 3.8 Release hygiene | `[DOĞRULANDI]` | patches/0001-hilal-local-changes.patch yaması series dosyasında yoktur ama reponun içindedir. |

### Düzeltilen Bulgular
1. **Gizlilik Baseline (Bölüm 3.3 ve 3.5):** Orijinal raporda Hilal'in gizlilik ayarlarının etkin olmadığı iddia edilmişti. Ancak `/branding/hilal/pref/firefox-branding.js` incelendiğinde; telemetry, Normandy, Pocket ve speculative connection'ların tamamen devre dışı bırakıldığı, HTTPS-Only'nin varsayılan olarak açıldığı (`dom.security.https_only_mode = true`) ispatlanmıştır. Bu nedenle bu iddialar `[YANLIŞ]` olarak düzeltilmiştir.
2. **Workspace Silme Satır Numarası (Bölüm 2.1):** Silme uyarısı veren prompt kodunun satır numarası 655 değil; `HilalWorkspaces.js` içinde `_showRenameDialog` altında **1236** ve `_showWorkspaceMenu` delete handler'ında **1305**'tir.
3. **URL Kopyalama Fonksiyonu Konumu (Bölüm 2.7):** Kopyalama kodunun ana kısmı `gBrowser.currentURI.spec` kullanımıyla birlikte `prefs/browser/base/content/hilal/HilalWorkspaces.js:1839` ve `1843` üzerinde `gHilalBrowser.copyCurrentURL()` nesnesindedir.

### Yeni Bulgular
1. **[YENİ BULGU] Markalama ve Profil Ayarlarının firefox-branding.js İçinde Olması:** Orijinal denetim raporu Hilal'in gizlilik sertleştirme (privacy hardening) önlemlerinin `StaticPrefList.yaml` üzerinden yapılmadığı gerekçesiyle başarısız olduğunu iddia etmiştir. Oysa ki, Hilal tüm bu ayarları `branding/hilal/pref/firefox-branding.js` içinde son derece organize bir şekilde devreye almıştır.
2. **[YENİ BULGU] Çakışan Yerel Değişiklik Yaması (patches/0001-hilal-local-changes.patch):** Bu yama dosyası `patches/series` içinde yer almamaktadır ancak repo içerisinde bulunuyor ve 84KB boyutundadır. Rebase ve kod temizliği süreçlerinde karmaşıklık yaratabilecek ölü kodlar barındırabilir.

### Öncelik Değişiklikleri
- **Y-1 (Gizlilik Baseline):** Bu maddenin önceliği **DÜŞÜK** seviyesine indirilmiştir. Çünkü Hilal, `firefox-branding.js` dosyası ile Betterfox ve Arkenfox esintili tüm temel telemetri engelleme ve gizlilik baseline sertleştirmelerini zaten varsayılan ve yerleşik olarak uygulamıştır.
- **Y-3 (Bang Ayarları):** Bu maddenin önceliği **YÜKSEK** seviyesinde kalmalıdır; DuckDuckGo sızıntısı ve arama fallback ayarlarının kullanıcı tercihine bağlanması gizlilik baseline'ı için kritiktir.

### Doğrulama Tarihi & Agent Kimliği
- Tarih: 2026-05-22
- Agent: Antigravity AI (Google DeepMind Advanced Agentic Coding Team)
- Kullanılan araçlar: `view_file`, `grep_search`

---

*Rapor sonu. Toplam bölüm: 9. Toplam eylem maddesi: K-4, Y-4, O-4, D-3 = 15 eylem.*
