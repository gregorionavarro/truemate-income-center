const OWNER_EMAIL = "gregorio.navarro@truemategroup.com";

const DEFAULT_STATE = {
  r: [],
  p: ["Greg", "Carlos", "Paulina", "Fabiola"],
  c: ["Imperial PFS", "Great West", "RPS"],
  t: [],
  a: [],
  l: {
    "RPS": "https://rpsins.epaypolicy.com/",
    "Guardian": "https://guardian-ins.epaypolicy.com/",
    "Rocklake": "https://rocklakeig.epaypolicy.com/",
    "Burns and Wilcox": "https://burnsandwilcox.epaypolicy.com/"
  },
  w: {
    users: [
      { name: "Gregorio Navarro", email: "gregorio.navarro@truemategroup.com", active: true },
      { name: "Paulina Bermudez", email: "paula.bermudez@truemategroup.com", active: true },
      { name: "Camila", email: "camila@truemategroup.com", active: true },
      { name: "Fabiola Bermudez", email: "fabiola.bermudez@truemategroup.com", active: true }
    ],
    assignments: {
      carrierReview: "paula.bermudez@truemategroup.com",
      carrierPayment: "gregorio.navarro@truemategroup.com",
      deferredCollection: "camila@truemategroup.com"
    },
    internalNotifications: true
  },
  h: [],
  n: []
};

async function ensureTable(DB) {
  await DB.prepare(`
    CREATE TABLE IF NOT EXISTS app_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      json TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(init.headers || {})
    }
  });
}

function requestEmail(request) {
  return String(request.headers.get("cf-access-authenticated-user-email") || "").trim().toLowerCase();
}

function normalize(parsed) {
  return {
    ...DEFAULT_STATE,
    ...parsed,
    a: Array.isArray(parsed?.a) ? parsed.a : [],
    l: parsed?.l && typeof parsed.l === "object" && !Array.isArray(parsed.l) ? parsed.l : DEFAULT_STATE.l,
    w: parsed?.w && typeof parsed.w === "object" && !Array.isArray(parsed.w) ? parsed.w : DEFAULT_STATE.w,
    h: Array.isArray(parsed?.h) ? parsed.h : [],
    n: Array.isArray(parsed?.n) ? parsed.n : []
  };
}

export async function onRequestGet(context) {
  const { DB } = context.env;
  if (!DB) return json({ ok: false, error: "D1 binding DB no disponible" }, { status: 500 });

  await ensureTable(DB);
  const row = await DB.prepare("SELECT json, updated_at FROM app_state WHERE id = 1").first();
  if (!row) return json({ ok: true, exists: false, state: DEFAULT_STATE, updated_at: null });

  let state = DEFAULT_STATE;
  try { state = normalize(JSON.parse(row.json)); } catch (_) {}
  return json({ ok: true, exists: true, state, updated_at: row.updated_at });
}

export async function onRequestPost(context) {
  const { DB } = context.env;
  if (!DB) return json({ ok: false, error: "D1 binding DB no disponible" }, { status: 500 });
  await ensureTable(DB);

  let body;
  try { body = await context.request.json(); }
  catch (_) { return json({ ok: false, error: "JSON inválido" }, { status: 400 }); }

  const state = body?.state || body;
  if (!state || !Array.isArray(state.r) || !Array.isArray(state.p) || !Array.isArray(state.c) || !Array.isArray(state.t)) {
    return json({ ok: false, error: "Estado inválido" }, { status: 400 });
  }

  const existingRow = await DB.prepare("SELECT json FROM app_state WHERE id = 1").first();
  let existing = DEFAULT_STATE;
  if (existingRow?.json) {
    try { existing = normalize(JSON.parse(existingRow.json)); } catch (_) {}
  }

  const email = requestEmail(context.request);
  const owner = email === OWNER_EMAIL;

  // Workflow users/responsibilities are owner-only. Non-owner saves keep the server copy.
  const protectedWorkflow = owner && state.w && typeof state.w === "object" && !Array.isArray(state.w)
    ? state.w
    : existing.w;

  const payload = JSON.stringify({
    r: state.r,
    p: state.p,
    c: state.c,
    t: state.t,
    a: Array.isArray(state.a) ? state.a : [],
    l: state.l && typeof state.l === "object" && !Array.isArray(state.l) ? state.l : DEFAULT_STATE.l,
    w: protectedWorkflow,
    h: Array.isArray(state.h) ? state.h.slice(-2000) : existing.h,
    n: Array.isArray(state.n) ? state.n.slice(-1000) : existing.n
  });

  await DB.prepare(`
    INSERT INTO app_state (id, json, updated_at)
    VALUES (1, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET json = excluded.json, updated_at = CURRENT_TIMESTAMP
  `).bind(payload).run();

  const row = await DB.prepare("SELECT updated_at FROM app_state WHERE id = 1").first();
  return json({ ok: true, updated_at: row?.updated_at || null, owner });
}
