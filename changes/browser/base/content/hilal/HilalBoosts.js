(function() {
  "use strict";

  const { HilalBoostsShared } = ChromeUtils.importESModule(
    "chrome://browser/content/hilal/HilalBoostsActorParent.sys.mjs"
  );

  const PREF_DATA = "hilal.boosts.data";
  const PREF_ENABLED = "hilal.boosts.enabled";
  const DEFAULT_ACCENT_COLOR = "#7c5cff";
  const DEFAULT_SECONDARY_COLOR = "#00d4ff";

  const sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
    Ci.nsIStyleSheetService
  );

  class HilalBoostsManager {
    constructor() {
      this._boosts = {};
      this._enabled = true;
      this._activeSheetUri = null;
      this._zapping = false;
      this._draggingColor = false;
      this._lastPulseAt = 0;
      this._browserFrameOverlay = null;
      this._buttonListener = event => this.togglePanel(event);
      this._panelCommandListener = event => this.onPanelCommand(event.target);
      this._zapButtonListener = () => this.startZapMode();
      this._colorPresetListener = event => this._onColorPresetClick(event);
      this._colorPickerPointerDown = event => this._onColorPickerPointerDown(event);
      this._colorPickerPointerMove = event => this._onColorPickerPointerMove(event);
      this._colorPickerPointerUp = () => {
        this._draggingColor = false;
      };

      // Register preferences observer
      this._prefObserver = () => {
        this._loadData();
        this._applyStyles();
        this._updateUIState();
        this._updatePanelUI();
      };
    }

    init() {
      this._loadData();
      this._applyStyles();

      Services.prefs.addObserver(PREF_DATA, this._prefObserver);
      Services.prefs.addObserver(PREF_ENABLED, this._prefObserver);

      // Listen to tab selection/navigation to update panel state
      this._tabSelectListener = () => {
        this._updateUIState();
      };
      window.gBrowser.tabContainer.addEventListener("TabSelect", this._tabSelectListener);

      this._tabsProgressListener = {
        onLocationChange: (browser, webProgress, request, locationURI) => {
          this._updateUIState();
        }
      };
      window.gBrowser.addTabsProgressListener(this._tabsProgressListener);

      // Register zapper window actor programmatically
      try {
        ChromeUtils.registerWindowActor("HilalBoosts", {
          parent: {
            esModuleURI: "chrome://browser/content/hilal/HilalBoostsActorParent.sys.mjs",
          },
          child: {
            esModuleURI: "chrome://browser/content/hilal/HilalBoostsActorChild.sys.mjs",
          },
          allFrames: true,
          remoteTypes: ["web", "file"],
        });
      } catch (e) {
        // Might already be registered
      }

      this._updateUIState();
      this._bindButton();
      this._bindPanelControls();

      window.addEventListener("unload", () => this.destroy(), { once: true });
    }

    destroy() {
      if (this._prefObserver) {
        Services.prefs.removeObserver(PREF_DATA, this._prefObserver);
        Services.prefs.removeObserver(PREF_ENABLED, this._prefObserver);
      }
      if (this._tabSelectListener) {
        window.gBrowser.tabContainer.removeEventListener("TabSelect", this._tabSelectListener);
      }
      if (this._tabsProgressListener) {
        window.gBrowser.removeTabsProgressListener(this._tabsProgressListener);
      }
      const btn = document.getElementById("hilal-boosts-button");
      if (btn && this._buttonListener) {
        btn.removeEventListener("click", this._buttonListener);
        btn.removeEventListener("keypress", this._buttonListener);
      }
      const picker = document.getElementById("hilal-boosts-color-picker");
      if (picker) {
        picker.removeEventListener("pointerdown", this._colorPickerPointerDown);
      }
      document.getElementById("hilal-boosts-zap-btn")
        ?.removeEventListener("click", this._zapButtonListener);
      for (const preset of document.querySelectorAll(".hilal-boosts-color-preset")) {
        preset.removeEventListener("click", this._colorPresetListener);
      }
      this._removePanelCommandListeners();
      window.removeEventListener("pointermove", this._colorPickerPointerMove);
      window.removeEventListener("pointerup", this._colorPickerPointerUp);
      this._removeBrowserFrameOverlay();
    }

    _loadData() {
      try {
        this._enabled = Services.prefs.getBoolPref(PREF_ENABLED, true);
      } catch (e) {
        this._enabled = true;
      }
      try {
        const dataStr = Services.prefs.getStringPref(PREF_DATA, "{}");
        this._boosts = JSON.parse(dataStr);
      } catch (e) {
        console.error("HilalBoosts: failed to load data", e);
        this._boosts = {};
      }
    }

    _saveData() {
      try {
        Services.prefs.setStringPref(PREF_DATA, JSON.stringify(this._boosts));
      } catch (e) {
        console.error("HilalBoosts: failed to save data", e);
      }
    }

    get activeDomain() {
      try {
        const uri = window.gBrowser.selectedBrowser?.currentURI;
        if (uri && (uri.schemeIs("http") || uri.schemeIs("https"))) {
          return uri.host;
        }
      } catch (e) {}
      return null;
    }

    getBoostForDomain(domain) {
      if (!domain) return null;
      if (!this._boosts[domain]) {
        this._boosts[domain] = {
          enabled: false,
          fontFamily: "",
          fontSize: 100,
          textCase: "none",
          smartInvert: false,
          colorEnabled: false,
          accentColor: DEFAULT_ACCENT_COLOR,
          secondaryColor: DEFAULT_SECONDARY_COLOR,
          colorIntensity: 35,
          colorBrightness: 100,
          customCSS: "",
          zappedSelectors: []
        };
      }
      return this._normalizeBoost(this._boosts[domain]);
    }

    saveBoostForDomain(domain, data) {
      if (!domain) return;
      this._boosts[domain] = data;
      this._saveData();
      this._applyStyles();
      this._updateUIState();
      this._pulseContentBorder();
    }

    _applyStyles() {
      const nextSheets = new Map();
      let combinedCSS = "/* Hilal Site Boosts */\n";
      let hasActiveBoosts = false;

      if (this._enabled) {
        for (const [domain, rawBoost] of Object.entries(this._boosts)) {
          const boost = this._normalizeBoost(rawBoost);
          if (!boost.enabled) continue;

          hasActiveBoosts = true;
          let css = `/* Hilal Site Boosts: ${domain} */\n`;
          css += `@-moz-document domain("${domain}") {\n`;

          // Font family
          if (boost.fontFamily) {
            css += `  body *:not(.material-icons, .fa, .fas, .far, .google-symbols) { font-family: ${boost.fontFamily} !important; }\n`;
          }

          // Font size
          if (boost.fontSize && boost.fontSize !== 100) {
            css += `  html { font-size: ${boost.fontSize}% !important; }\n`;
          }

          // Text transform
          if (boost.textCase && boost.textCase !== "none") {
            css += `  body *:not(script, style) { text-transform: ${boost.textCase} !important; }\n`;
          }

          if (boost.colorEnabled && this._isHexColor(boost.accentColor)) {
            const intensity = this._clampNumber(boost.colorIntensity, 0, 100, 35);
            const brightness = this._clampNumber(boost.colorBrightness, 80, 120, 100);
            const accentColor = this._adjustHexBrightness(boost.accentColor, brightness);
            const secondaryColor = this._adjustHexBrightness(boost.secondaryColor, brightness);
            const pageMix = Math.round(2 + intensity * 0.12);
            const surfaceMix = Math.round(2 + intensity * 0.08);
            const controlMix = Math.round(3 + intensity * 0.1);
            const linkMix = Math.round(28 + intensity * 0.22);
            css += `  html { accent-color: ${accentColor} !important; background-color: color-mix(in srgb, Canvas ${100 - pageMix}%, ${accentColor} ${pageMix}%) !important; }\n`;
            css += `  body { background-color: color-mix(in srgb, Canvas ${100 - pageMix}%, ${accentColor} ${pageMix}%) !important; color: color-mix(in srgb, CanvasText 96%, ${secondaryColor} 4%) !important; }\n`;
            css += `  body ::selection { background: color-mix(in srgb, ${accentColor} ${Math.max(38, linkMix)}%, Highlight) !important; color: HighlightText !important; }\n`;
            css += `  body :is(a, area, summary, [role="link"]) { color: color-mix(in srgb, ${accentColor} ${linkMix}%, LinkText) !important; text-decoration-color: color-mix(in srgb, ${secondaryColor} ${Math.max(24, linkMix - 8)}%, currentColor) !important; }\n`;
            css += `  body :is(button, input, textarea, select, progress, meter, [role="button"], [role="tab"], [role="switch"]) { accent-color: ${accentColor} !important; background-color: color-mix(in srgb, Field ${100 - controlMix}%, ${accentColor} ${controlMix}%) !important; color: FieldText !important; }\n`;
            css += `  body :is(dialog, [role="dialog"], [role="menu"], [role="listbox"], popover) { background-color: color-mix(in srgb, Canvas ${100 - surfaceMix}%, ${secondaryColor} ${surfaceMix}%) !important; color: CanvasText !important; }\n`;
          }

          // Smart invert (dark mode)
          if (boost.smartInvert) {
            css += `  html { color-scheme: dark !important; background: #101114 !important; }\n`;
            css += `  body { background-color: #101114 !important; color: #f2f4f8 !important; }\n`;
            css += `  body :is(input, textarea, select, button, dialog, [role="dialog"], [role="menu"], [role="listbox"]) { background-color: #1a1c22 !important; color: #f2f4f8 !important; }\n`;
            css += `  body :is(a, [role="link"]) { color: #8ab4ff !important; }\n`;
          }

          // Zaps
          if (boost.zappedSelectors && boost.zappedSelectors.length > 0) {
            for (const selector of boost.zappedSelectors) {
              if (selector.trim()) {
                css += `  ${selector} { display: none !important; }\n`;
              }
            }
          }

          // Custom CSS
          if (boost.customCSS) {
            css += `  ${boost.customCSS}\n`;
          }

          css += `}\n`;
          nextSheets.set(domain, css);
          combinedCSS += css;
        }
      }

      if (!hasActiveBoosts) {
        this._unregisterAllSheets();
        return;
      }

      this._syncDomainSheets(nextSheets, combinedCSS);
    }

    _syncDomainSheets(nextSheets, combinedCSS) {
      const sheetType = sss.AGENT_SHEET;
      if (!HilalBoostsShared.activeSheetUris) {
        HilalBoostsShared.activeSheetUris = new Map();
      }

      if (HilalBoostsShared.activeSheetUri) {
        this._unregisterSheet(HilalBoostsShared.activeSheetUri);
        HilalBoostsShared.activeSheetUri = null;
      }

      for (const [domain, entry] of HilalBoostsShared.activeSheetUris) {
        if (!nextSheets.has(domain) || nextSheets.get(domain) !== entry.css) {
          this._unregisterSheet(entry.uri);
          HilalBoostsShared.activeSheetUris.delete(domain);
        }
      }

      for (const [domain, css] of nextSheets) {
        const current = HilalBoostsShared.activeSheetUris.get(domain);
        if (current?.css === css && sss.sheetRegistered(current.uri, sheetType)) {
          continue;
        }

        if (current) {
          this._unregisterSheet(current.uri);
        }

        try {
          const dataUriStr = "data:text/css;charset=utf-8," + encodeURIComponent(css);
          const uri = Services.io.newURI(dataUriStr);
          sss.loadAndRegisterSheet(uri, sheetType);
          HilalBoostsShared.activeSheetUris.set(domain, { uri, css });
        } catch (e) {
          console.error(`HilalBoosts: failed to register stylesheet for ${domain}`, e);
        }
      }

      HilalBoostsShared.activeSheetCSS = combinedCSS;
      HilalBoostsShared.sheetType = sheetType;
    }

    _unregisterAllSheets() {
      if (HilalBoostsShared.activeSheetUri) {
        this._unregisterSheet(HilalBoostsShared.activeSheetUri);
        HilalBoostsShared.activeSheetUri = null;
      }

      if (HilalBoostsShared.activeSheetUris) {
        for (const { uri } of HilalBoostsShared.activeSheetUris.values()) {
          this._unregisterSheet(uri);
        }
        HilalBoostsShared.activeSheetUris.clear();
      }

      HilalBoostsShared.activeSheetCSS = "";
      HilalBoostsShared.sheetType = null;
    }

    _unregisterSheet(uri) {
      for (const sheetType of [sss.AGENT_SHEET, sss.USER_SHEET]) {
        try {
          if (sss.sheetRegistered(uri, sheetType)) {
            sss.unregisterSheet(uri, sheetType);
          }
        } catch (e) {
          console.error("HilalBoosts: failed to unregister sheet", e);
        }
      }
    }

    _updateUIState() {
      const btn = document.getElementById("hilal-boosts-button");
      if (!btn) return;

      const domain = this.activeDomain;
      if (!domain) {
        btn.setAttribute("hidden", "true");
        return;
      }

      btn.removeAttribute("hidden");
      const boost = this.getBoostForDomain(domain);
      if (boost && boost.enabled) {
        btn.setAttribute("active", "true");
      } else {
        btn.removeAttribute("active");
      }
    }

    _updatePanelUI() {
      const panel = document.getElementById("hilal-boosts-panel");
      if (!panel || panel.state !== "open") return;

      // Force refresh panel contents
      this.populatePanel();
    }

    _bindButton() {
      const btn = document.getElementById("hilal-boosts-button");
      if (!btn) return;

      btn.addEventListener("click", this._buttonListener);
      btn.addEventListener("keypress", this._buttonListener);
    }

    _bindPanelControls() {
      const picker = document.getElementById("hilal-boosts-color-picker");
      if (picker) {
        picker.addEventListener("pointerdown", this._colorPickerPointerDown);
      }

      this._addPanelCommandListener("hilal-boosts-enable", "change");
      this._addPanelCommandListener("hilal-boosts-scale", "input");
      this._addPanelCommandListener("hilal-boosts-font", "change");
      this._addPanelCommandListener("hilal-boosts-case", "change");
      this._addPanelCommandListener("hilal-boosts-invert", "change");
      this._addPanelCommandListener("hilal-boosts-color-enable", "change");
      this._addPanelCommandListener("hilal-boosts-color", "input");
      this._addPanelCommandListener("hilal-boosts-color-secondary", "input");
      this._addPanelCommandListener("hilal-boosts-color-intensity", "input");
      this._addPanelCommandListener("hilal-boosts-color-brightness", "input");
      this._addPanelCommandListener("hilal-boosts-css", "input");
      document.getElementById("hilal-boosts-zap-btn")
        ?.addEventListener("click", this._zapButtonListener);
      for (const preset of document.querySelectorAll(".hilal-boosts-color-preset")) {
        preset.addEventListener("click", this._colorPresetListener);
      }
      window.addEventListener("pointermove", this._colorPickerPointerMove);
      window.addEventListener("pointerup", this._colorPickerPointerUp);
    }

    _addPanelCommandListener(id, type) {
      const element = document.getElementById(id);
      if (!element) return;
      element.addEventListener(type, this._panelCommandListener);
    }

    _removePanelCommandListeners() {
      const bindings = [
        ["hilal-boosts-enable", "change"],
        ["hilal-boosts-scale", "input"],
        ["hilal-boosts-font", "change"],
        ["hilal-boosts-case", "change"],
        ["hilal-boosts-invert", "change"],
        ["hilal-boosts-color-enable", "change"],
        ["hilal-boosts-color", "input"],
        ["hilal-boosts-color-secondary", "input"],
        ["hilal-boosts-color-intensity", "input"],
        ["hilal-boosts-color-brightness", "input"],
        ["hilal-boosts-css", "input"],
      ];
      for (const [id, type] of bindings) {
        const element = document.getElementById(id);
        element?.removeEventListener(type, this._panelCommandListener);
      }
    }

    togglePanel(event) {
      if (event?.type === "keypress" && event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event?.preventDefault();
      event?.stopPropagation();

      const domain = this.activeDomain;
      if (!domain) return;

      const btn = document.getElementById("hilal-boosts-button");
      const panel = document.getElementById("hilal-boosts-panel");
      if (!btn || !panel) return;

      this.populatePanel();

      if (panel.state === "open" || panel.state === "showing") {
        panel.hidePopup();
        btn.removeAttribute("open");
        return;
      }

      const anchor = this._getPopupAnchor(btn);
      btn.setAttribute("open", "true");
      panel.addEventListener("popuphidden", () => {
        btn.removeAttribute("open");
      }, { once: true });
      panel.openPopup(anchor.node, anchor.position, 0, 0, false, false, event);
      this._pulseContentBorder(true);
    }

    _getPopupAnchor(btn) {
      const btnRect = btn.getBoundingClientRect();
      if (btnRect.width && btnRect.height) {
        return { node: btn, position: "bottomright topright" };
      }

      const urlbar = document.getElementById("urlbar");
      const urlbarRect = urlbar?.getBoundingClientRect();
      if (urlbarRect?.width && urlbarRect?.height) {
        return { node: urlbar, position: "bottomright topright" };
      }

      return { node: document.documentElement, position: "overlap" };
    }

    populatePanel() {
      const domain = this.activeDomain;
      if (!domain) return;

      const boost = this.getBoostForDomain(domain);

      document.getElementById("hilal-boosts-panel-title").textContent = domain;
      document.getElementById("hilal-boosts-enable").checked = boost.enabled;

      // Scale
      const scaleInput = document.getElementById("hilal-boosts-scale");
      const scaleValue = document.getElementById("hilal-boosts-scale-value");
      scaleInput.value = boost.fontSize || 100;
      scaleValue.textContent = (boost.fontSize || 100) + "%";

      // Font Family
      document.getElementById("hilal-boosts-font").value = boost.fontFamily || "";

      // Text Case
      document.getElementById("hilal-boosts-case").value = boost.textCase || "none";

      // Smart Invert
      document.getElementById("hilal-boosts-invert").checked = boost.smartInvert || false;

      // Color Boost
      document.getElementById("hilal-boosts-color-enable").checked = !!boost.colorEnabled;
      const colorInput = document.getElementById("hilal-boosts-color");
      colorInput.value = boost.accentColor;
      const secondaryColorInput = document.getElementById("hilal-boosts-color-secondary");
      secondaryColorInput.value = boost.secondaryColor;

      const intensityInput = document.getElementById("hilal-boosts-color-intensity");
      const intensityValue = document.getElementById("hilal-boosts-color-intensity-value");
      intensityInput.value = boost.colorIntensity;
      intensityValue.textContent = boost.colorIntensity + "%";

      const brightnessInput = document.getElementById("hilal-boosts-color-brightness");
      const brightnessValue = document.getElementById("hilal-boosts-color-brightness-value");
      brightnessInput.value = boost.colorBrightness;
      brightnessValue.textContent = boost.colorBrightness + "%";
      this._updateColorPickerVisuals(boost);

      // Custom CSS
      document.getElementById("hilal-boosts-css").value = boost.customCSS || "";

      // Zaps
      const zapsList = document.getElementById("hilal-boosts-zaps-list");
      zapsList.textContent = "";
      if (boost.zappedSelectors && boost.zappedSelectors.length > 0) {
        for (const selector of boost.zappedSelectors) {
          const item = document.createElement("div");
          item.className = "hilal-boosts-zap-item";
          
          const label = document.createElement("span");
          label.textContent = selector;
          label.className = "hilal-boosts-zap-label";
          label.title = selector;
          
          const removeBtn = document.createElement("button");
          removeBtn.textContent = "×";
          removeBtn.className = "hilal-boosts-zap-remove";
          removeBtn.addEventListener("click", () => {
            boost.zappedSelectors = boost.zappedSelectors.filter(s => s !== selector);
            this.saveBoostForDomain(domain, boost);
            this.populatePanel();
          });

          item.appendChild(label);
          item.appendChild(removeBtn);
          zapsList.appendChild(item);
        }
      } else {
        const placeholder = document.createElement("div");
        placeholder.textContent = "No active element blocks";
        placeholder.className = "hilal-boosts-zap-placeholder";
        zapsList.appendChild(placeholder);
      }
    }

    onPanelCommand(target) {
      const domain = this.activeDomain;
      if (!domain) return;

      const boost = this.getBoostForDomain(domain);

      if (target.id === "hilal-boosts-enable") {
        boost.enabled = target.checked;
      } else if (target.id === "hilal-boosts-scale") {
        boost.fontSize = parseInt(target.value);
        document.getElementById("hilal-boosts-scale-value").textContent = boost.fontSize + "%";
      } else if (target.id === "hilal-boosts-font") {
        boost.fontFamily = target.value;
      } else if (target.id === "hilal-boosts-case") {
        boost.textCase = target.value;
      } else if (target.id === "hilal-boosts-invert") {
        boost.smartInvert = target.checked;
      } else if (target.id === "hilal-boosts-color-enable") {
        boost.colorEnabled = target.checked;
        if (target.checked) {
          boost.enabled = true;
          document.getElementById("hilal-boosts-enable").checked = true;
        }
      } else if (target.id === "hilal-boosts-color") {
        boost.accentColor = this._normalizeHexColor(target.value);
        boost.colorEnabled = true;
        boost.enabled = true;
        document.getElementById("hilal-boosts-enable").checked = true;
        document.getElementById("hilal-boosts-color-enable").checked = true;
        this._updateColorPickerVisuals(boost);
      } else if (target.id === "hilal-boosts-color-secondary") {
        boost.secondaryColor = this._normalizeHexColor(target.value, DEFAULT_SECONDARY_COLOR);
        boost.colorEnabled = true;
        boost.enabled = true;
        document.getElementById("hilal-boosts-enable").checked = true;
        document.getElementById("hilal-boosts-color-enable").checked = true;
        this._updateColorPickerVisuals(boost);
      } else if (target.id === "hilal-boosts-color-intensity") {
        boost.colorIntensity = this._clampNumber(target.value, 0, 100, 35);
        boost.colorEnabled = true;
        boost.enabled = true;
        document.getElementById("hilal-boosts-enable").checked = true;
        document.getElementById("hilal-boosts-color-enable").checked = true;
        document.getElementById("hilal-boosts-color-intensity-value").textContent = boost.colorIntensity + "%";
      } else if (target.id === "hilal-boosts-color-brightness") {
        boost.colorBrightness = this._clampNumber(target.value, 80, 120, 100);
        boost.colorEnabled = true;
        boost.enabled = true;
        document.getElementById("hilal-boosts-enable").checked = true;
        document.getElementById("hilal-boosts-color-enable").checked = true;
        document.getElementById("hilal-boosts-color-brightness-value").textContent = boost.colorBrightness + "%";
      } else if (target.id === "hilal-boosts-css") {
        boost.customCSS = target.value;
      }

      this.saveBoostForDomain(domain, boost);
    }

    _onColorPresetClick(event) {
      const color = event.currentTarget?.dataset?.color;
      if (!this._isHexColor(color)) return;

      const domain = this.activeDomain;
      if (!domain) return;

      const boost = this.getBoostForDomain(domain);
      boost.accentColor = color;
      boost.secondaryColor = this._rotateHexColor(color, 52);
      boost.colorEnabled = true;
      boost.enabled = true;
      document.getElementById("hilal-boosts-enable").checked = true;
      document.getElementById("hilal-boosts-color-enable").checked = true;
      document.getElementById("hilal-boosts-color").value = boost.accentColor;
      document.getElementById("hilal-boosts-color-secondary").value = boost.secondaryColor;
      this._updateColorPickerVisuals(boost);
      this.saveBoostForDomain(domain, boost);
    }

    _onColorPickerPointerDown(event) {
      if (event.button !== 0) return;
      this._draggingColor = true;
      this._updateColorFromPickerEvent(event);
    }

    _onColorPickerPointerMove(event) {
      if (!this._draggingColor) return;
      this._updateColorFromPickerEvent(event);
    }

    _updateColorFromPickerEvent(event) {
      const domain = this.activeDomain;
      if (!domain) return;

      event.preventDefault();
      const picker = document.getElementById("hilal-boosts-color-picker");
      const rect = picker.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = event.clientX - centerX;
      const dy = event.clientY - centerY;
      const radius = Math.min(rect.width, rect.height) * 0.42;
      const distance = Math.min(Math.sqrt(dx * dx + dy * dy), radius);
      const angle = Math.atan2(dy, dx);
      const hue = (angle * 180 / Math.PI + 360) % 360;
      const saturation = Math.round(distance / radius * 100);
      const color = this._hslToHex(hue, saturation, 55);

      const boost = this.getBoostForDomain(domain);
      boost.accentColor = color;
      boost.secondaryColor = this._rotateHexColor(color, 52);
      boost.colorEnabled = true;
      boost.enabled = true;
      document.getElementById("hilal-boosts-enable").checked = true;
      document.getElementById("hilal-boosts-color-enable").checked = true;
      document.getElementById("hilal-boosts-color").value = color;
      document.getElementById("hilal-boosts-color-secondary").value = boost.secondaryColor;
      this._updateColorPickerVisuals(boost);
      this.saveBoostForDomain(domain, boost);
    }

    _updateColorPickerVisuals(boost) {
      const picker = document.getElementById("hilal-boosts-color-picker");
      const dot = document.getElementById("hilal-boosts-color-dot");
      const secondaryDot = document.getElementById("hilal-boosts-color-dot-secondary");
      const preview = document.getElementById("hilal-boosts-gradient-preview");
      if (!picker || !dot || !secondaryDot) return;

      const color = this._normalizeHexColor(boost.accentColor);
      const secondaryColor = this._normalizeHexColor(boost.secondaryColor, DEFAULT_SECONDARY_COLOR);
      picker.style.setProperty("--hilal-boosts-accent", color);
      picker.style.setProperty("--hilal-boosts-secondary", secondaryColor);
      this._positionColorDot(dot, color, 42);
      this._positionColorDot(secondaryDot, secondaryColor, 36);
      dot.style.backgroundColor = color;
      secondaryDot.style.backgroundColor = secondaryColor;
      if (preview) {
        preview.style.setProperty("--hilal-boosts-accent", color);
        preview.style.setProperty("--hilal-boosts-secondary", secondaryColor);
      }
      for (const preset of document.querySelectorAll(".hilal-boosts-color-preset")) {
        preset.toggleAttribute("active", preset.dataset.color === color);
      }
    }

    _positionColorDot(dot, color, radiusScale) {
      const { h, s } = this._hexToHsl(color);
      const angle = h * Math.PI / 180;
      const distance = s / 100 * radiusScale;
      dot.style.left = (50 + Math.cos(angle) * distance) + "%";
      dot.style.top = (50 + Math.sin(angle) * distance) + "%";
    }

    _normalizeBoost(boost) {
      boost.colorEnabled = boost.colorEnabled === true;
      boost.accentColor = this._normalizeHexColor(boost.accentColor);
      boost.secondaryColor = this._normalizeHexColor(
        boost.secondaryColor,
        DEFAULT_SECONDARY_COLOR
      );
      boost.colorIntensity = this._clampNumber(boost.colorIntensity, 0, 100, 35);
      boost.colorBrightness = this._clampNumber(boost.colorBrightness, 80, 120, 100);
      if (!Array.isArray(boost.zappedSelectors)) {
        boost.zappedSelectors = [];
      }
      return boost;
    }

    _clampNumber(value, min, max, fallback) {
      const number = Number(value);
      if (!Number.isFinite(number)) {
        return fallback;
      }
      return Math.min(max, Math.max(min, Math.round(number)));
    }

    _normalizeHexColor(value, fallback = DEFAULT_ACCENT_COLOR) {
      if (this._isHexColor(value)) {
        return value.toLowerCase();
      }
      return fallback;
    }

    _isHexColor(value) {
      return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
    }

    _hexToHsl(hex) {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const lightness = (max + min) / 2;
      const delta = max - min;
      let hue = 0;
      let saturation = 0;

      if (delta) {
        saturation = delta / (1 - Math.abs(2 * lightness - 1));
        if (max === r) {
          hue = ((g - b) / delta) % 6;
        } else if (max === g) {
          hue = (b - r) / delta + 2;
        } else {
          hue = (r - g) / delta + 4;
        }
        hue *= 60;
        if (hue < 0) hue += 360;
      }

      return { h: hue, s: saturation * 100, l: lightness * 100 };
    }

    _adjustHexBrightness(hex, brightness) {
      const amount = (brightness - 100) / 100;
      const channels = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16));
      const adjusted = channels.map(channel => {
        if (amount >= 0) {
          return channel + (255 - channel) * amount;
        }
        return channel * (1 + amount);
      });
      return "#" + adjusted
        .map(channel => Math.round(Math.min(255, Math.max(0, channel)))
          .toString(16)
          .padStart(2, "0"))
        .join("");
    }

    _rotateHexColor(hex, degrees) {
      const { h, s, l } = this._hexToHsl(this._normalizeHexColor(hex));
      return this._hslToHex((h + degrees) % 360, Math.max(55, s), Math.max(48, l));
    }

    _hslToHex(hue, saturation, lightness) {
      const s = saturation / 100;
      const l = lightness / 100;
      const c = (1 - Math.abs(2 * l - 1)) * s;
      const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
      const m = l - c / 2;
      let r = 0;
      let g = 0;
      let b = 0;

      if (hue < 60) {
        r = c; g = x;
      } else if (hue < 120) {
        r = x; g = c;
      } else if (hue < 180) {
        g = c; b = x;
      } else if (hue < 240) {
        g = x; b = c;
      } else if (hue < 300) {
        r = x; b = c;
      } else {
        r = c; b = x;
      }

      const toHex = channel => Math.round((channel + m) * 255)
        .toString(16)
        .padStart(2, "0");
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    // Interactive element zapper trigger
    startZapMode() {
      const domain = this.activeDomain;
      if (!domain) return;

      // Close the panel
      const panel = document.getElementById("hilal-boosts-panel");
      if (panel) {
        panel.hidePopup();
      }

      const browser = window.gBrowser.selectedBrowser;
      const actor = browser.browsingContext.currentWindowGlobal.getActor("HilalBoosts");
      if (actor) {
        const boost = this.getBoostForDomain(domain);
        this._zapping = true;
        actor.sendAsyncMessage("HilalBoosts:StartZap", {
          accentColor: boost.accentColor,
          secondaryColor: boost.secondaryColor,
        });
        this._pulseContentBorder(true);
      }
    }

    _pulseContentBorder(force = false) {
      const now = Date.now();
      if (!force && now - this._lastPulseAt < 280) {
        return;
      }
      this._lastPulseAt = now;

      try {
        const domain = this.activeDomain;
        const boost = domain ? this.getBoostForDomain(domain) : null;
        const rect = this._getContentFrameRect();
        if (!rect) {
          return;
        }

        const overlay = this._ensureBrowserFrameOverlay();
        const wave = overlay.firstElementChild;
        const accentColor = boost?.accentColor || DEFAULT_ACCENT_COLOR;
        const secondaryColor = boost?.secondaryColor || DEFAULT_SECONDARY_COLOR;

        overlay.style.left = rect.left + "px";
        overlay.style.top = rect.top + "px";
        overlay.style.width = rect.width + "px";
        overlay.style.height = rect.height + "px";
        overlay.style.borderColor = this._hexToRgba(accentColor, 0.54);
        overlay.style.boxShadow =
          `inset 0 0 0 1px ${this._hexToRgba(secondaryColor, 0.24)}, ` +
          `0 0 22px ${this._hexToRgba(accentColor, 0.16)}`;
        wave.style.borderTopColor = this._hexToRgba(secondaryColor, 0.82);
        wave.style.borderRightColor = this._hexToRgba(accentColor, 0.72);

        overlay.getAnimations().forEach(animation => animation.cancel());
        wave.getAnimations().forEach(animation => animation.cancel());
        overlay.animate(
          [
            { opacity: 0, transform: "scale(.997)" },
            { opacity: 1, transform: "scale(1)", offset: 0.22 },
            { opacity: 0, transform: "scale(1.006)" },
          ],
          { duration: 760, easing: "cubic-bezier(.2,.8,.2,1)" }
        );
        wave.animate(
          [
            { opacity: 0, transform: "rotate(-16deg)" },
            { opacity: 1, transform: "rotate(4deg)", offset: 0.28 },
            { opacity: 0, transform: "rotate(32deg)" },
          ],
          { duration: 760, easing: "cubic-bezier(.2,.8,.2,1)" }
        );
      } catch (e) {
        console.error("HilalBoosts: failed to pulse content border", e);
      }
    }

    _getContentFrameRect() {
      const candidates = [
        window.gBrowser?.selectedBrowser,
        document.getElementById("tabbrowser-tabbox"),
        document.getElementById("appcontent"),
        document.getElementById("browser"),
      ];

      for (const node of candidates) {
        const rect = node?.getBoundingClientRect?.();
        if (rect?.width && rect?.height) {
          return rect;
        }
      }

      if (window.innerWidth && window.innerHeight) {
        return {
          left: 0,
          top: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        };
      }
      return null;
    }

    _ensureBrowserFrameOverlay() {
      if (this._browserFrameOverlay?.isConnected) {
        return this._browserFrameOverlay;
      }

      const overlay = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
      overlay.id = "hilal-boosts-content-frame";
      overlay.style.cssText = [
        "position: fixed",
        "pointer-events: none",
        "z-index: 2147483647",
        "border: 1px solid transparent",
        "border-radius: 10px",
        "opacity: 0",
        "box-sizing: border-box",
        "contain: layout style paint",
      ].join(";");

      const wave = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
      wave.style.cssText = [
        "position: absolute",
        "inset: -2px",
        "border: 2px solid transparent",
        "border-radius: inherit",
        "opacity: 0",
      ].join(";");
      overlay.appendChild(wave);
      document.documentElement.appendChild(overlay);
      this._browserFrameOverlay = overlay;
      return overlay;
    }

    _removeBrowserFrameOverlay() {
      this._browserFrameOverlay?.remove();
      this._browserFrameOverlay = null;
    }

    _hexToRgba(hex, alpha) {
      const color = this._normalizeHexColor(hex);
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    handleZappedElement(selector) {
      const domain = this.activeDomain;
      if (!domain || !selector) return;

      const boost = this.getBoostForDomain(domain);
      if (!boost.zappedSelectors) {
        boost.zappedSelectors = [];
      }
      if (!boost.zappedSelectors.includes(selector)) {
        boost.zappedSelectors.push(selector);
      }
      boost.enabled = true; // Auto-enable boost when zapping
      this.saveBoostForDomain(domain, boost);
    }
  }

  function tryInit() {
    if (window.gHilalBoosts) {
      return;
    }
    if (typeof gBrowser === "undefined" || !gBrowser.tabContainer) {
      setTimeout(tryInit, 50);
      return;
    }
    window.gHilalBoosts = new HilalBoostsManager();
    window.gHilalBoosts.init();
  }

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", tryInit, { once: true });
  } else {
    tryInit();
  }

})();
