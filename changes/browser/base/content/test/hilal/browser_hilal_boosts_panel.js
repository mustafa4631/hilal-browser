/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

const { HilalBoostsShared } = ChromeUtils.importESModule(
  "chrome://browser/content/hilal/HilalBoostsActorParent.sys.mjs"
);

add_task(async function test_boosts_button_opens_panel() {
  await SpecialPowers.pushPrefEnv({
    set: [
      ["hilal.boosts.enabled", true],
      ["hilal.boosts.data", "{}"],
    ],
  });

  await BrowserTestUtils.withNewTab(
    "https://example.com/browser/browser/base/content/test/general/dummy_page.html",
    async () => {
      await TestUtils.waitForCondition(
        () => window.gHilalBoosts,
        "Hilal Boosts manager should initialize"
      );

      const button = document.getElementById("hilal-boosts-button");
      const panel = document.getElementById("hilal-boosts-panel");

      ok(button, "Hilal Boosts button exists");
      ok(panel, "Hilal Boosts panel exists");

      await TestUtils.waitForCondition(
        () => !button.hidden,
        "Hilal Boosts button should be visible on web pages"
      );

      const shown = BrowserTestUtils.waitForEvent(panel, "popupshown");
      button.click();
      await shown;

      is(panel.state, "open", "Hilal Boosts panel should open from the button");
      is(
        document.getElementById("hilal-boosts-panel-title").textContent,
        "example.com",
        "Panel title should show the active domain"
      );
      is(
        Services.prefs.getStringPref("hilal.boosts.data"),
        "{}",
        "Opening the panel should not persist a default site boost"
      );

      const colorInput = document.getElementById("hilal-boosts-color");
      colorInput.value = "#ff3366";
      colorInput.dispatchEvent(new Event("input", { bubbles: true }));

      const secondaryColorInput = document.getElementById("hilal-boosts-color-secondary");
      secondaryColorInput.value = "#00d4ff";
      secondaryColorInput.dispatchEvent(new Event("input", { bubbles: true }));

      const boost = window.gHilalBoosts.getBoostForDomain("example.com");
      ok(boost.enabled, "Changing color should enable the site boost");
      ok(boost.colorEnabled, "Changing color should enable color boost");
      is(boost.accentColor, "#ff3366", "Accent color should update immediately");
      is(
        boost.secondaryColor,
        "#00d4ff",
        "Secondary gradient color should update immediately"
      );

      await TestUtils.waitForCondition(
        () => HilalBoostsShared.activeSheetCSS.includes("#ff3366") &&
          HilalBoostsShared.activeSheetCSS.includes("#00d4ff"),
        "Generated stylesheet should include the live gradient colors"
      );

      is(
        HilalBoostsShared.sheetType,
        Ci.nsIStyleSheetService.AGENT_SHEET,
        "Generated stylesheet should use the same sheet level as Zen-style boosts"
      );
      ok(
        HilalBoostsShared.activeSheetCSS.includes("accent-color"),
        "Generated stylesheet should apply accent-color override"
      );
      ok(
        !HilalBoostsShared.activeSheetCSS.includes("filter:"),
        "Generated stylesheet should not apply page-level filters"
      );
      ok(
        !HilalBoostsShared.activeSheetCSS.includes("box-shadow") &&
          !HilalBoostsShared.activeSheetCSS.includes("border-color"),
        "Generated stylesheet should not add neon borders to page elements"
      );
      ok(
        !HilalBoostsShared.activeSheetCSS.includes("img") &&
          !HilalBoostsShared.activeSheetCSS.includes("video") &&
          !HilalBoostsShared.activeSheetCSS.includes("canvas"),
        "Generated stylesheet should not target media elements"
      );

      window.gHilalBoosts._pulseContentBorder(true);
      await TestUtils.waitForCondition(
        () => document.getElementById("hilal-boosts-content-frame"),
        "Content frame animation should be drawn by browser chrome"
      );

      const hidden = BrowserTestUtils.waitForEvent(panel, "popuphidden");
      panel.hidePopup();
      await hidden;
    }
  );

  await SpecialPowers.popPrefEnv();
});

add_task(async function test_boosts_global_disable_clears_chrome_state() {
  const boostData = {
    "example.com": {
      enabled: true,
      fontFamily: "",
      fontSize: 100,
      textCase: "none",
      smartInvert: false,
      colorEnabled: true,
      autoPaletteEnabled: false,
      browserUIEnabled: true,
      accentColor: "#ff3366",
      secondaryColor: "#00d4ff",
      colorIntensity: 35,
      colorBrightness: 100,
      customCSS: "",
      zappedSelectors: [],
    },
  };

  await SpecialPowers.pushPrefEnv({
    set: [
      ["hilal.boosts.enabled", true],
      ["hilal.boosts.data", JSON.stringify(boostData)],
    ],
  });

  await BrowserTestUtils.withNewTab(
    "https://example.com/browser/browser/base/content/test/general/dummy_page.html",
    async () => {
      await TestUtils.waitForCondition(
        () => window.gHilalBoosts,
        "Hilal Boosts manager should initialize"
      );

      window.gHilalBoosts._applyStyles();
      window.gHilalBoosts._updateUIState();

      await TestUtils.waitForCondition(
        () => HilalBoostsShared.activeSheetCSS.includes("#ff3366") &&
          document.documentElement.getAttribute("hilal-boosts-ui") === "true",
        "Enabled boost should register page and browser UI styling"
      );

      Services.prefs.setBoolPref("hilal.boosts.enabled", false);

      await TestUtils.waitForCondition(
        () => !HilalBoostsShared.activeSheetCSS &&
          !document.documentElement.hasAttribute("hilal-boosts-ui"),
        "Global disable should clear boost styles and browser UI tint"
      );
    }
  );

  await SpecialPowers.popPrefEnv();
});
