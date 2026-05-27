# Localization Workflow

Hilal follows the operating system language when a matching bundled locale is
installed. If no installed locale matches the system language, Firefox's locale
negotiation falls back to the packaged `en-US` locale.

The default is controlled by:

```js
pref("intl.locale.requested", "");
```

## Adding a New Language

1. Add the signed Firefox language pack to:

   ```text
   prefs/browser/app/distribution/extensions/langpack-<locale>@firefox.mozilla.org.xpi
   ```

2. Add Hilal-specific Fluent translations under:

   ```text
   prefs/browser/locales/<locale>/browser/
   ```

   This directory mirrors the language pack path after
   `browser/localization/<locale>/browser/`. For example:

   ```text
   prefs/browser/locales/tr/browser/browser.ftl
   prefs/browser/locales/tr/browser/sidebar.ftl
   prefs/browser/locales/tr/browser/preferences/preferences.ftl
   ```

3. Run:

   ```bash
   scripts/apply.sh
   ```

   The apply step syncs the XPI into Firefox and then runs
   `scripts/patch-langpack.py`. The script patches every bundled
   `langpack-*@firefox.mozilla.org.xpi`, overwrites Mozilla branding strings
   with Hilal branding, and appends the Hilal Fluent files for that locale.

4. Build or package normally.

## Notes

- Brand strings are not translated. Each bundled langpack receives the Hilal
  brand values from `branding/hilal/locales/en-US/`.
- Keep Hilal-specific strings in matching files across locales where practical.
  Missing translations can fall back to English, but complete locale overlays
  avoid noisy Fluent missing-message logs.
- `browser/app/distribution/moz.build` includes bundled langpacks with a
  wildcard, so new language packs do not need a moz.build edit.

## User Language Selection Settings

The interface language can be set explicitly by the user in **Settings → Hilal Preferences → Language Selection**:
1. Choosing **System Language (Default)** sets `intl.locale.requested` to `""`, falling back to the OS system language negotiation.
2. Selecting a specific language sets `intl.locale.requested` to that locale code (e.g., `"tr"`).
3. The available options in the dropdown are fetched dynamically from the bundled language packs, with a static fallback to `["en-US", "tr"]` if dynamic detection fails.
4. When a new language is applied, the user is prompted to restart the browser to apply the settings.

