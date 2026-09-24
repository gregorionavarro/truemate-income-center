const DEFAULT_STATE = {
  r: [],
  p: ["Greg", "Carlos", "Paulina", "Fabiola"],
  c: ["Imperial PFS", "Great West", "RPS"],
  t: []
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

export async function onRequestGet(context) {
  const { DB } = context.env;
  if (!DB) return json({ ok: false, error: "D1 binding DB no disponible" }, { status: 500 });

  await ensureTable(DB);
  const row = await DB.prepare("SELECT json, updated_at FROM app_state WHERE id = 1").first();

  if (!row) {
    return json({ ok: true, exists: false, state: DEFAULT_STATE, updated_at: null });
  }

  let state = DEFAULT_STATE;
  try {
    state = JSON.parse(row.json);
  } catch (_) {}

  return json({ ok: true, exists: true, state, updated_at: row.updated_at });
}

export async function onRequestPost(context) {
  const { DB } = context.env;
  if (!DB) return json({ ok: false, error: "D1 binding DB no disponible" }, { status: 500 });

  await ensureTable(DB);

  let body;
  try {
    body = await context.request.json();
  } catch (_) {
    return json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const state = body?.state || body;
  if (!state || !Array.isArray(state.r) || !Array.isArray(state.p) || !Array.isArray(state.c) || !Array.isArray(state.t)) {
    return json({ ok: false, error: "Estado inválido" }, { status: 400 });
  }

  const payload = JSON.stringify({ r: state.r, p: state.p, c: state.c, t: state.t });
  await DB.prepare(`
    INSERT INTO app_state (id, json, updated_at)
    VALUES (1, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET json = excluded.json, updated_at = CURRENT_TIMESTAMP
  `).bind(payload).run();

  const row = await DB.prepare("SELECT updated_at FROM app_state WHERE id = 1").first();
  return json({ ok: true, updated_at: row?.updated_at || null });
}
