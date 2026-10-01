(() => {
  if (window.__tmSyncBridgeLoaded) return;
  window.__tmSyncBridgeLoaded = true;

  function readJson(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key) || '');
      return v ?? fallback;
    } catch (_) {
      return fallback;
    }
  }

  function syncIntoApp() {
    try {
      // S is the app's in-memory state. It is a global lexical binding, so scripts
      // loaded in the same page can update its properties even though window.S is undefined.
      if (typeof S !== 'undefined' && S) {
        S.r = readJson('tmic_r', []);
        S.p = readJson('tmic_p', S.p || []);
        S.c = readJson('tmic_c', S.c || []);
        S.t = readJson('tmic_t', []);
      }
    } catch (e) {
      console.warn('TrueMate sync bridge: no se pudo actualizar S', e);
    }

    try { if (typeof render === 'function') render(); } catch (_) {}
    try { window.tmRefreshMonthlyExecutive?.(); } catch (_) {}
    try { window.tmRefreshRecentMovements?.(); } catch (_) {}
    try { window.tmRefreshSummaryPayments?.(); } catch (_) {}
    try { window.tmRefreshStableDashboard?.(); } catch (_) {}
    try { window.tmRefreshDashboardExtras?.(); } catch (_) {}
    try { window.tmRefreshGlobalCarrierCard?.(); } catch (_) {}
    try { window.tmRefreshFinalCarrierCard?.(); } catch (_) {}
  }

  window.addEventListener('tm-state-updated', syncIntoApp);
  window.tmSyncStateNow = syncIntoApp;
})();
