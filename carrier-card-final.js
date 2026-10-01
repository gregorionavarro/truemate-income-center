(() => {
  // Legacy compatibility shim.
  // The authoritative dashboard card is carrier-global-card-v3.js.
  // This file intentionally does NOT render or observe the dashboard anymore,
  // because the two renderers were fighting each other after month changes.
  window.__tmCarrierCardFinalLoaded = true;
  window.tmRefreshFinalCarrierCard = function(){
    if(typeof window.tmRefreshGlobalCarrierCard==='function'){
      return window.tmRefreshGlobalCarrierCard();
    }
  };
})();