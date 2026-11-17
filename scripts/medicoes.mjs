// Medições dos requisitos não funcionais do OptiVan.
// Uso: node medicoes.mjs "caminho/OptiVan - local.postman_environment.json"
// Requer Node 18+ (usa fetch). O servidor precisa estar no ar e a van parada.
// Lê do ambiente do Postman: baseUrl, driverEmail/Password, studentEmail/Password, vanId.
import { readFileSync, writeFileSync } from "node:fs";

const envPath = process.argv[2];
if (!envPath) {
  console.error('Uso: node medicoes.mjs "<arquivo do ambiente do Postman>.json"');
  process.exit(1);
}
const envFile = JSON.parse(readFileSync(envPath, "utf-8"));
const env = Object.fromEntries(envFile.values.map((v) => [v.key, v.value]));
for (const k of ["baseUrl", "driverEmail", "driverPassword", "studentEmail", "studentPassword", "vanId"]) {
  if (!env[k]) { console.error(`Faltou a variável ${k} no ambiente.`); process.exit(1); }
}

const QUICK = process.env.QUICK === "1"; // execução reduzida, só para testar o script
const N_REPS = QUICK ? 5 : 30;       // repetições por endpoint
const N_ROUTE = QUICK ? 3 : 10;      // repetições da geração de rota (OSRM público: ~1 req/s)
const DRIVER_CYCLES = QUICK ? 3 : 8; // envios do motorista no teste de propagação (a cada 10 s)
const LOAD_CLIENTS = QUICK ? 5 : 50; // alunos simultâneos no teste de carga
const LOAD_POLLS = QUICK ? 2 : 6;    // consultas por aluno (a cada 5 s)
const SEND_MS = 10_000, POLL_MS = 5_000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const today = () => new Date().toISOString().slice(0, 10);

async function call(method, path, token, body) {
  const t0 = performance.now();
  let status = 0, data = null;
  try {
    const res = await fetch(env.baseUrl + path, {
      method,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    status = res.status;
    data = await res.json().catch(() => null);
  } catch { status = 0; }
  return { status, data, ms: performance.now() - t0, at: Date.now() };
}

const pct = (arr, p) => { const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)]; };
const stats = (arr) => arr.length ? ({
  n: arr.length,
  mean: arr.reduce((a, b) => a + b, 0) / arr.length,
  median: pct(arr, 50), p95: pct(arr, 95), min: Math.min(...arr), max: Math.max(...arr),
}) : null;
const f = (x, d = 1) => (x === undefined || x === null ? "-" : x.toFixed(d));

const results = { data: new Date().toISOString(), config: { N_REPS, N_ROUTE, DRIVER_CYCLES, LOAD_CLIENTS, LOAD_POLLS } };
const log = (...a) => console.log(...a);

// ---------- preparação ----------
log("Preparando: login e trajeto parado...");
const dLogin = await call("POST", "/login", null, { email: env.driverEmail, password: env.driverPassword });
const sLogin = await call("POST", "/login", null, { email: env.studentEmail, password: env.studentPassword });
if (dLogin.status !== 200 || sLogin.status !== 200) { console.error("Falha no login. Confira e-mails e senhas do ambiente."); process.exit(1); }
const dTok = dLogin.data.token, sTok = sLogin.data.token;
const vanPath = `/vans/${env.vanId}`;
await call("POST", `${vanPath}/trip/end`, dTok); // garante van parada

// ---------- A. Latência por endpoint ----------
log("A. Latência por endpoint...");
const lat = {};
const rep = async (name, n, fn, gap = 0) => {
  const times = [], codes = new Set();
  for (let i = 0; i < n; i++) { const r = await fn(i); times.push(r.ms); codes.add(r.status); if (gap) await sleep(gap); }
  lat[name] = { ...stats(times), codes: [...codes].join("/") };
};
await rep("POST /login (bcrypt)", Math.min(N_REPS, 15), () => call("POST", "/login", null, { email: env.studentEmail, password: env.studentPassword }));
await rep("GET /attendance/confirmed", N_REPS, () => call("GET", `/attendance/confirmed?vanId=${env.vanId}&date=${today()}`, dTok));
const start = await call("POST", `${vanPath}/trip/start`, dTok);
if (start.status !== 200) { console.error("Não foi possível iniciar o trajeto:", start.status, start.data); process.exit(1); }
await rep("PUT /vans/:id/location", N_REPS, (i) => call("PUT", `${vanPath}/location`, dTok, { lat: -25.42 + i * 1e-4, long: -49.27 }));
await rep("GET /vans/:id/location", N_REPS, () => call("GET", `${vanPath}/location`, sTok));
await rep("POST /routes/generate", N_ROUTE, () => call("POST", "/routes/generate", dTok, {
  vanId: env.vanId, date: today(), driverLocation: { lat: -25.4284, long: -49.2733 }, persist: false,
}), 1200);
results.latencia = lat;

// ---------- B. Propagação da posição (motorista a cada 10 s, aluno consulta a cada 5 s) ----------
log(`B. Propagação da posição (${DRIVER_CYCLES} envios, ~${Math.round((DRIVER_CYCLES * SEND_MS) / 1000)} s)...`);
const sentAt = new Map();      // updatedAt -> instante em que o envio terminou (relógio local)
const firstSeen = new Map();   // updatedAt -> primeiro instante em que o aluno viu
const ages = [];               // idade da posição vista pelo aluno em cada consulta
let running = true, lastSentUpdatedAt = null, lastSentLocal = 0;

const driverLoop = (async () => {
  for (let i = 0; i < DRIVER_CYCLES; i++) {
    const r = await call("PUT", `${vanPath}/location`, dTok, { lat: -25.5 + i * 1e-3, long: -49.3 });
    if (r.status === 200) { sentAt.set(r.data.updatedAt, r.at); lastSentUpdatedAt = r.data.updatedAt; lastSentLocal = r.at; }
    if (i < DRIVER_CYCLES - 1) await sleep(SEND_MS);
  }
  await sleep(POLL_MS + 1000); // deixa o aluno consultar mais uma vez e ver o último envio
  running = false;
})();
const studentLoop = (async () => {
  await sleep(Math.random() * POLL_MS); // o aluno abre a tela em um momento qualquer (fase aleatória)
  while (running) {
    const r = await call("GET", `${vanPath}/location`, sTok);
    const u = r.data?.location?.updatedAt;
    if (u && sentAt.has(u)) {
      if (!firstSeen.has(u)) firstSeen.set(u, r.at);
      ages.push((r.at - sentAt.get(u)) / 1000);
    }
    await sleep(POLL_MS + Math.random() * 600); // pequena variação, como em dois aparelhos independentes
  }
})();
await Promise.all([driverLoop, studentLoop]);
const delays = [...firstSeen].map(([u, t]) => (t - sentAt.get(u)) / 1000);
results.propagacao = {
  atrasoAteAlunoVer_s: stats(delays), idadeDaPosicaoVista_s: stats(ages),
  teoricoMax_s: (SEND_MS + POLL_MS) / 1000,
};

// ---------- C. Detecção de "sem sinal" ----------
log("C. Detecção de sem sinal (motorista para de enviar)...");
let staleAfter = null;
const tStop = lastSentLocal || Date.now();
for (let i = 0; i < 60; i++) {
  const r = await call("GET", `${vanPath}/location`, sTok);
  if (r.data?.location?.stale === true) { staleAfter = (r.at - tStop) / 1000; break; }
  await sleep(1000);
}
results.semSinal = { segundosAteStale: staleAfter, limite_s: 30 };

// ---------- D. Carga: alunos consultando ao mesmo tempo ----------
log(`D. Carga: ${LOAD_CLIENTS} alunos consultando a cada 5 s...`);
await call("PUT", `${vanPath}/location`, dTok, { lat: -25.42, long: -49.27 });
const loadTimes = []; let loadErr = 0; const tLoad0 = performance.now();
await Promise.all(Array.from({ length: LOAD_CLIENTS }, async (_, c) => {
  await sleep((c / LOAD_CLIENTS) * POLL_MS); // espalha o início dentro da janela de 5 s
  for (let p = 0; p < LOAD_POLLS; p++) {
    const r = await call("GET", `${vanPath}/location`, sTok);
    if (r.status === 200) loadTimes.push(r.ms); else loadErr++;
    if (p < LOAD_POLLS - 1) await sleep(POLL_MS);
  }
}));
results.carga = { alunos: LOAD_CLIENTS, requisicoes: loadTimes.length + loadErr, erros: loadErr,
  duracao_s: (performance.now() - tLoad0) / 1000, latencia_ms: stats(loadTimes) };
// pico: todos ao mesmo tempo
const burst = await Promise.all(Array.from({ length: LOAD_CLIENTS * 2 }, () => call("GET", `${vanPath}/location`, sTok)));
results.pico = { simultaneas: burst.length, erros: burst.filter((r) => r.status !== 200).length, latencia_ms: stats(burst.filter((r) => r.status === 200).map((r) => r.ms)) };

await call("POST", `${vanPath}/trip/end`, dTok);

// ---------- saída ----------
const L = results.latencia, P = results.propagacao, S = results.semSinal, C = results.carga, K = results.pico;
const md = [];
md.push(`# Medições do OptiVan (${results.data.slice(0, 10)})\n`);
md.push("## Latência por endpoint (ms)\n", "| Endpoint | n | Média | Mediana | P95 | Mín | Máx | Códigos |", "|---|---|---|---|---|---|---|---|");
for (const [k, v] of Object.entries(L)) md.push(`| ${k} | ${v.n} | ${f(v.mean)} | ${f(v.median)} | ${f(v.p95)} | ${f(v.min)} | ${f(v.max)} | ${v.codes} |`);
md.push("\n## Atraso da localização (motorista a cada 10 s, aluno consulta a cada 5 s)\n",
  "| Métrica | n | Média | Mediana | Máx |", "|---|---|---|---|---|",
  `| Do envio até o aluno ver (s) | ${P.atrasoAteAlunoVer_s?.n} | ${f(P.atrasoAteAlunoVer_s?.mean)} | ${f(P.atrasoAteAlunoVer_s?.median)} | ${f(P.atrasoAteAlunoVer_s?.max)} |`,
  `| Idade da posição na tela do aluno (s) | ${P.idadeDaPosicaoVista_s?.n} | ${f(P.idadeDaPosicaoVista_s?.mean)} | ${f(P.idadeDaPosicaoVista_s?.median)} | ${f(P.idadeDaPosicaoVista_s?.max)} |`,
  `\nLimite teórico: ${P.teoricoMax_s} s (10 s de envio + 5 s de consulta).`);
md.push(`\n## Sem sinal\n\nApós o motorista parar de enviar, a posição foi marcada como desatualizada em ${f(S.segundosAteStale)} s (limite configurado: ${S.limite_s} s).`);
md.push("\n## Carga\n", "| Cenário | Requisições | Erros | Média (ms) | P95 (ms) | Máx (ms) |", "|---|---|---|---|---|---|",
  `| ${C.alunos} alunos consultando a cada 5 s por ${f(C.duracao_s, 0)} s | ${C.requisicoes} | ${C.erros} | ${f(C.latencia_ms?.mean)} | ${f(C.latencia_ms?.p95)} | ${f(C.latencia_ms?.max)} |`,
  `| Pico: ${K.simultaneas} consultas simultâneas | ${K.simultaneas} | ${K.erros} | ${f(K.latencia_ms?.mean)} | ${f(K.latencia_ms?.p95)} | ${f(K.latencia_ms?.max)} |`);
writeFileSync("resultados-medicoes.json", JSON.stringify(results, null, 2));
writeFileSync("resultados-medicoes.md", md.join("\n") + "\n");
log("\n" + md.join("\n"));
log("\nArquivos gerados: resultados-medicoes.md e resultados-medicoes.json");
