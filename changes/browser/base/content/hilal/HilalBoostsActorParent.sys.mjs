export const HilalBoostsShared = {
  activeSheetUri: null,
  activeSheetUris: new Map(),
  activeSheetCSS: "",
  sheetType: null,
};

export class HilalBoostsParent extends JSWindowActorParent {
  receiveMessage(aMessage) {
    switch (aMessage.name) {
      case "HilalBoosts:GetBoostForDomain": {
        const domain = aMessage.data.domain;
        try {
          const dataStr = Services.prefs.getStringPref("hilal.boosts.data", "{}");
          const boosts = JSON.parse(dataStr);
          return boosts[domain] || null;
        } catch (e) {
          return null;
        }
      }
      case "HilalBoosts:ElementZapped": {
        const window = this.browsingContext.top.embedderElement.ownerGlobal;
        if (window && window.gHilalBoosts) {
          window.gHilalBoosts.handleZappedElement(aMessage.data.selector);
        }
        break;
      }
      case "HilalBoosts:ThemeColorExtracted": {
        const window = this.browsingContext.top.embedderElement?.ownerGlobal;
        if (window && window.gHilalBoosts) {
          window.gHilalBoosts.handleExtractedThemeColor(
            aMessage.data.domain,
            aMessage.data.themeColor
          );
        }
        break;
      }
    }
    return null;
  }
}
