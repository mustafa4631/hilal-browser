# HILAL BROWSER — GUNCEL DENETIM VE RELEASE READINESS RAPORU

**Rapor versiyonu:** 2.0
**Rapor tarihi:** 2026-05-26
**Incelenen repo durumu:** local `main` / `2d08316` (`Add smart bang fallback`)
**Public latest release:** `v0.2.0-alpha.3` (GitHub Releases, 2026-05-24)
**Firefox local checkout:** `hilal-patches` / `15541e093f90`
**Kaynak model:** Firefox uzerine patch + overlay katmani, fork degil
**Amac:** Surum yayinlamadan once ne iyi, ne eksik, ne riskli sorusuna pratik cevap vermek.

---

## 0. Kisa Sonuc

Hilal Browser, **alpha/pre-release olarak yayinlanabilir seviyeye yaklasmis** durumda. Urunun en guclu yani; Firefox uzerine hafif kalmaya calisan patch mimarisi, workspace/container izolasyonu, varsayilan uBlock Origin, modern sidebar ve kullanici tarafindan ozellestirilebilir bang/sidebar akislari.

Ancak **production/stable gibi sunulmamali**. Bunun ana nedenleri:

- Imzali otomatik update zinciri tamamlanmamis.
- CI/CD sadece release olusturuyor; build/test/sign/notarize yapmiyor.
- `www` TypeScript lint su anda kirik.
- Firefox patch serisinin temiz checkout uzerine bastan uygulanabilirligi bu makinede disk yetersizligi nedeniyle tam dogrulanamadi.
- Split view + workspace etkilesimi ve browser chrome CSS guvenlik gostergeleri icin otomatik regresyon testi yok.

**Yayin onerisi:** `v0.2.0-alpha.4` gibi acikca alpha/prerelease olarak yayinlanabilir. Stable/production dili kullanilmasin.

---

## 1. Guncel Durum Tablosu

| Alan | Durum |
|---|---|
| Local branch | `main` |
| Local HEAD | `2d08316` |
| Public latest release | `v0.2.0-alpha.3` |
| Acik GitHub issue | 2 adet: #12 native macOS sidebar vibrancy, #13 Gemini native sidebar |
| Repo dirty state | `hilal-browser-audit-report.md` degisiyor; baska repo dosyasi dirty degil |
| `firefox/` tree | Patch uygulanmis local build tree; dirty olmasi beklenen durum |
| Patch sayisi | 18 patch (`patches/series`) |
| Website build | `npm run build` basarili |
| Website TypeScript lint | Basarisiz: `React` namespace hatasi |
| Website prod audit | `npm audit --audit-level=moderate --omit=dev` temiz |
| Full clean patch apply check | Denendi, disk doldugu icin tamamlanamadi |
| Disk durumu | Yaklasik 3.4 GiB bos alan; Firefox build/release icin riskli |

---

## 2. Ne Guzel? Guclu Yanlar

### 2.1 Patch + Overlay Mimarisi

Hilal'in Firefox'u tam fork'lamayip patch/overlay katmani olarak kalmasi dogru karar. `patches/series`, `branding/`, `prefs/` ve workflow scriptleri bu ayrimi net tutuyor. Bu sayede upstream Firefox'a yakin kalma sansi var.

**Durum:** Guclu.
**Risk:** Patch sayisi arttikca upstream rebase maliyeti artacak.

### 2.2 Workspace + Contextual Identity Izolasyonu

`prefs/browser/base/content/hilal/HilalWorkspaces.js` icinde workspace sistemi, Firefox contextual identity/container altyapisiyla baglanmis. Workspace silerken `Services.clearData.deleteDataFromOriginAttributesPattern({ userContextId })` kullanilmasi dogru yonde ciddi bir gizlilik iyilestirmesi.

**Iyi olanlar:**
- Sekmeler workspace metadata ile ayriliyor.
- Workspace container rengi/adi guncelleniyor.
- Container silinirken site verisi temizleniyor.
- Host mapping ve workspace bookmark folder entegrasyonu var.

**Kalan risk:**
- Split view tasinirken `state.splitViewId` siliniyor; workspace/split view birlikte kullanildiginda davranis kirilgan kalabilir.
- Bu davranis icin otomatik browser chrome testi yok.

### 2.3 uBlock Origin Varsayilan

`scripts/apply.sh` uBlock Origin'i sabit surumle indiriyor:

- `UBO_VERSION="1.57.2"`
- `UBO_SHA256="9928e79a52cecf7cfa231fdb0699c7d7a427660d94eb10d711ed5a2f10d2eb89"`

Bu, onceki `latest.xpi` tarzi degisken supply-chain riskini ciddi azaltmis.

**Durum:** Alpha icin iyi.
**Kalan risk:** uBO surumu eski kalabilir; update stratejisi veya per-release refresh checklist'i gerekli.

### 2.4 Bang Sistemi

Bang sistemi artik `prefs/browser/modules/HilalBangs.sys.mjs` uzerinden ortak veri modeli kullaniyor. `resolveQuery(query, { fallbackToDuckDuckGo })` helper'i eklendi.

**Guncel davranis:**
- Bilinen bang: local haritadan direkt hedef siteye gider.
- Custom bang: `hilal.bangs.custom` pref'inden gelir.
- Bilinmeyen bang: tekrar DuckDuckGo bang handler'a gider (`https://duckduckgo.com/?q=!bang+query`).

**Onemli not:** Onceki audit'teki "bilinmeyen bang DuckDuckGo'ya gitmiyor" iddiasi artik guncel degil. #11 sonrasi bilinmeyen bang'ler bilincli olarak DuckDuckGo'ya paslaniyor. Bu bir ozellik karari; privacy dokumantasyonunda acik yazilmali.

**Guzel taraf:** DuckDuckGo'nun devasa bang ekosisteminden faydalanir.
**Kotu taraf:** Bilinmeyen bang kullanimi DuckDuckGo'ya sorgu gonderir. Bu, kullaniciya acikca anlatilmali.

### 2.5 Sidebar Redesign ve Custom Sidebar Shortcuts

`patches/0017-sidebar-layout-redesign.patch` ile Hilal sidebar ciddi sekilde urunlesmis:

- Workspace rail
- Open tabs panel
- Bookmark alanlari
- Footer item toggles
- Custom sidebar shortcuts
- Favicon destekli custom shortcut render

#10 sonrasi custom sidebar shortcut ikonlari Firefox `page-icon:` protokoluyle favicon cache'ten geliyor. Bu iyi bir privacy karari: favicon icin manuel web fetch yapilmiyor.

**Durum:** Kullanici deneyimi acisindan guclu.
**Kalan risk:** Sidebar Firefox upstream revamp koduna yakin oldugu icin rebase conflict ihtimali yuksek.

### 2.6 Privacy Levels

`HilalWorkspaces.js` icindeki `PRIVACY_LEVEL_PREFS` ile Standard / Strict / Extreme seviyeleri runtime pref olarak uygulanabiliyor. "Tor-like" dilinden uzaklasip "not Tor" vurgusu yapmak dogru.

**Iyi olanlar:**
- Strict tracking protection baseline korunuyor.
- WebRTC, FPI, RFP, history, JS, permission default'lari seviyeye gore degisiyor.
- Welcome flow ve Preferences UI ile kullaniciya secim veriliyor.

**Kalan risk:**
- Bu seviyeler "network anonymity" saglamiyor; dokumantasyon ve UI bunu hep acik tutmali.
- Site uyumluluk regresyon testleri yok.

### 2.7 macOS Native Gorunum

`patches/0002-hilal-transparent-macos-chrome.patch` Cocoa seviyesinde transparent chrome/vibrancy entegrasyonu iceriyor. Bu Hilal'in urun kimligi icin guclu bir ayristirici.

**Durum:** Guclu ama #12 ile daha da iyilestirilmek isteniyor.
**Kalan is:** Dikey sekmeler sidebar'inin native macOS vibrancy hissi icin acik enhancement var.

### 2.8 Website ve Update API Yuzeyi

`www` Vite + React + TypeScript altyapisina gecmis. `www/api/update.ts` ve `www/api/releases.ts` release/update metadatasini sunacak yapiya sahip.

**Iyi olanlar:**
- `npm run build` basarili.
- `npm audit --audit-level=moderate --omit=dev` temiz.
- Update XML endpoint mantigi var.

**Kotu olan:** `npm run lint` kirik. Detaylar asagida.

---

## 3. Ne Eksik? Release Oncesi Bloklayicilar

### K-1. Repo Release Tag Icin Temiz Degil

**Durum:** `hilal-browser-audit-report.md` degisik.
**Etki:** Tag/Release atilmadan once bu rapor commit'lenmeli veya bilerek geri alinmali.
**Oncelik:** Release hygiene icin yuksek.

### K-2. Website TypeScript Lint Kirik

Komut:

```bash
cd www
npm run lint
```

Hata:

```text
src/App.tsx(86,37): error TS2503: Cannot find namespace 'React'.
src/App.tsx(91,38): error TS2503: Cannot find namespace 'React'.
```

Kod:

- `handleSliderMouseDown = (e: React.MouseEvent)`
- `handleSliderTouchStart = (e: React.TouchEvent)`

**Muhtemel cozum:** `import type { MouseEvent, TouchEvent } from "react";` ekleyip tipleri `MouseEvent` / `TouchEvent` olarak kullanmak veya `React` type namespace import etmek.

**Etki:** Web build gecse bile CI kalite kapisi yoksa lint kirik release edilir.
**Oncelik:** Alpha release oncesi duzeltilmeli.

### K-3. Imzali Otomatik Update Zinciri Tam Degil

`mozconfigs/base` desktop updater'i aciyor; `patches/0014-hilal-update-policy.patch` Hilal `AppUpdateURL` policy'sini ekliyor; `scripts/make-full-update.sh` complete MAR uretebiliyor.

Ama `docs/UPDATES.md` henuz tamamlanmamis production maddelerini acikca listeliyor:

- Hilal-owned MAR signing certs
- Signing key'lerin repo disinda tutulmasi
- Signed MAR, signed/notarized platform artifacts
- Checksum, SBOM, provenance
- Eski build -> test MAR -> "Restart to Update" smoke testi

**Etki:** Stable/production release icin bloklayici.
**Alpha icin:** Release notes'ta otomatik update'in sinirli/deneysel oldugu yazilmali.

### K-4. CI/CD Pipeline Build/Test Yapmiyor

`.github/workflows/release.yml` sadece GitHub release olusturuyor. Build, test, packaging, signing, notarization, artifact checksum yok.

**Etki:** GitHub release'deki artifact'larin bu commit'ten uretildigi otomatik kanitlanmiyor.
**Oncelik:** Production oncesi kritik.

### K-5. Patch Serisi Temiz Uygulama Kontrolu Tamamlanamadi

Temiz Firefox worktree uzerine `patches/series` uygulanabilirligini kontrol etmek istedim. Firefox worktree olusturma sirasinda disk doldu:

```text
No space left on device
```

Diskte yaklasik 3.4 GiB bos alan kaldi. Bu Firefox build/package icin cok az.

**Etki:** Release oncesi gercek temiz checkout apply/build dogrulamasi eksik kaldi.
**Oncelik:** Release oncesi disk acilip `scripts/apply.sh --force` ve build smoke kosulmali.

---

## 4. Ne Kotu? Teknik Riskler

### R-1. Browser Chrome CSS Cok Buyuk

`patches/0011-hilal-ui-fix.patch` ve `prefs/browser/themes/shared/hilal-ui-fix.css` cok buyuk bir browser chrome CSS yuzeyi tasiyor.

**Risk:** Yanlis CSS selector'lari; lock icon, permission prompts, download warnings, update banners veya security error UI gibi kritik yuzeyleri etkileyebilir.

**Gereken:** En azindan su senaryolar icin gorsel smoke test:

- HTTPS lock icon gorunuyor mu?
- HTTP/not-secure indicator gorunuyor mu?
- Certificate error sayfasi net mi?
- Permission prompt'lari gorunur mu?
- Download warning / update notification gizlenmiyor mu?

### R-2. Workspace + Split View Cakismasi

Workspace tab move/retarget akisi session state'i yeniden yaziyor ve `splitViewId` siliyor. Bu pratikte split view'i workspace izolasyonu lehine bozabilir.

**Risk:** Kullanici split view ile calisirken workspace degistirirse UI/state karisabilir.
**Gereken:** Ya split view tabs workspace tasimasinda desteklenmeli ya da UI'da bu kombinasyon engellenmeli.

### R-3. Bilinmeyen Bang DuckDuckGo Fallback Privacy Metni

#11 ile bilinmeyen bang'ler DuckDuckGo bang handler'a bilincli olarak paslaniyor. Bu iyi UX olabilir ama privacy acisindan kullaniciya anlatilmali.

**Gereken UI/Docs metni:** "Hilal once local/custom bang'leri cozer; taninmayan bang'ler DuckDuckGo'nun bang yonlendiricisine gonderilir."

### R-4. uBO Pin Eski Kalabilir

uBO pin ve checksum iyi; ama surum guncelleme sureci yoksa zamanla eski kalir.

**Gereken:** Her release checklist'inde uBO latest signed release ve checksum kontrolu.

### R-5. Website Metinleri Fazla Iddiali

`www/src/App.tsx` ve `www/src/utils/github.ts` icinde "secure", "gold standard", "up to 40%" gibi iddiali pazarlama ifadeleri var.

**Risk:** Alpha urun icin beklentiyi fazla yukseltebilir. "Alpha", "experimental", "not audited", "updates/signing in progress" gibi dengeleyici dil eklenmeli.

---

## 5. Tam Eksik veya Sonraki Surum Isi

| Eksik | Durum | Not |
|---|---|---|
| Native macOS sidebar vibrancy | Acik issue #12 | Enhancement, alpha bloklayici degil |
| Gemini native sidebar | Acik issue #13 | Enhancement, privacy/API key modeli netlesmeden eklenmemeli |
| Otomatik update smoke testi | Yok | Production oncesi gerekli |
| Platform signing/notarization | Belirsiz/yok | Production oncesi gerekli |
| SBOM/provenance | Yok | Production oncesi gerekli |
| Privacy policy / data-flow inventory | Eksik | Release sayfasinda linklenmeli |
| Browser chrome visual regression | Yok | UI guvenlik gostergeleri icin gerekli |
| Workspace/split-view automated test | Yok | Known-risk |
| Patch apply CI | Yok | Her PR/tag icin kosmali |
| TypeScript lint fix | Gerekli | Web release yuzeyi icin hizli fix |

---

## 6. Rakiplerle Kisa Gerceklik Matrisi

| Kriter | Chrome | Firefox | Brave | Arc/Zen benzeri | Hilal |
|---|---|---|---|---|---|
| Imzali otomatik update | Evet | Evet | Evet | Evet | Kismen altyapi, production degil |
| Varsayilan reklam engelleme | Hayir | Hayir | Evet | Degisir | Evet, uBO |
| Workspace + container | Profil/sekme gruplari | Extension ile | Sinirli | Workspace var | Guclu, yerlesik |
| Dikey sekmeler | Hayir | Yeni/deneysel | Hayir | Evet | Evet |
| macOS native glass | Hayir | Hayir | Hayir | Evet | Kismen/guclu, #12 acik |
| Bang search | Hayir | Hayir | Hayir | Degisir | Evet, local/custom + DDG fallback |
| Privacy dashboard | Kismen | Kismen | Guclu | Degisir | Eksik |
| Production release maturity | Yuksek | Yuksek | Yuksek | Degisir | Alpha |

---

## 7. Release Onerisi

### Alpha release icin minimum checklist

1. `hilal-browser-audit-report.md` bu guncel haliyle commit'lensin.
2. `www` lint hatasi duzeltilsin.
3. Disk alani acilsin. Firefox build icin 50+ GiB bos alan hedeflensin.
4. Temiz kontrol kosulsun:

```bash
scripts/apply.sh --force
scripts/build-macos.sh faster
(cd firefox && ./mach run)
```

5. Manuel smoke:
   - Ilk acilis welcome flow
   - Workspace create/delete ve container data cleanup
   - Custom bang ekleme ve `!yt test`
   - Bilinmeyen bang: `!rust ownership` DuckDuckGo bang handler'a gidiyor mu?
   - Custom sidebar shortcut favicon fallback
   - uBO installed/enabled
   - HTTPS lock/security UI gorunuyor mu?

### Stable/production icin minimum checklist

1. CI build/test pipeline.
2. Signed/notarized platform artifacts.
3. Signed MAR update pipeline.
4. Update smoke test.
5. Checksums + SBOM + provenance.
6. Privacy policy + data-flow inventory.
7. Browser chrome visual regression tests.

---

## 8. Son Degerlendirme

Hilal'in iyi tarafi "sadece tema" olmamasi: workspace/container izolasyonu, uBO default, bang sistemi, privacy profiles ve sidebar deneyimi gercek urun farki yaratiyor.

Kotu tarafi ise henuz "release engineering" kasinin zayif olmasi: imza, otomatik test, temiz apply/build kaniti, update zinciri ve web lint kalitesi stable seviyede degil.

Bu nedenle en dogru mesaj:

> Hilal Browser `v0.2.0-alpha.x`, erken test surumudur. Gizlilik ve verimlilik odakli Firefox tabanli deneyler icerir; otomatik update/signing ve bazi UI regresyon testleri henuz tamamlanmamistir.

Bu dille yayinlamak dogru ve durust olur.

---

## 9. Bu Rapor Icin Kosulan Kontroller

```text
git status --short
git log --oneline -12
gh issue list --repo VastSea0/hilal-browser --state open --limit 20
gh release list --repo VastSea0/hilal-browser --limit 10
cd www && npm run lint
cd www && npm run build
cd www && npm audit --audit-level=moderate --omit=dev
```

Sonuclar:

- `npm run build`: basarili
- `npm audit --omit=dev`: 0 vulnerability
- `npm run lint`: basarisiz, `React` namespace type hatasi
- clean Firefox worktree patch apply denemesi: disk doldugu icin tamamlanamadi
