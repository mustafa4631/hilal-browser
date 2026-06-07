export const HilalBoostsShared = {
  activeSheetUri: null,
  activeSheetUris: new Map(),
  activeSheetCSS: "",
  sheetType: null,
};

export class HilalBoostsParent extends JSWindowActorParent {
  receiveMessage(aMessage) {
    switch (aMessage.name) {
      case "HilalBoosts:ElementZapped": {
        const window = this.browsingContext.top.embedderElement.ownerGlobal;
        if (window && window.gHilalBoosts) {
          window.gHilalBoosts.handleZappedElement(aMessage.data.selector);
        }
        break;
      }
    }
  }
}
