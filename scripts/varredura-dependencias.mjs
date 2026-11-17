#!/usr/bin/env node
/**
 * Varredura da regra de dependência (Clean Architecture) no back-end do OptiVan.
 *
 * Lê todos os arquivos .ts de src/ (sem alterar nada), extrai as importações
 * (import ... from, import type, export ... from, import() e require()) e verifica:
 *
 *   domain    -> só pode importar domain
 *   useCases  -> só pode importar domain e useCases
 *   infra     -> pode importar domain, useCases e infra
 *   main      -> pode importar qualquer camada (raiz de composição)
 *
 * Além disso, domain e useCases não podem importar bibliotecas de infraestrutura
 * (Prisma, Express, bcrypt, jsonwebtoken etc.). Os testes (*.test.ts) de domain e
 * useCases são verificados com a mesma regra (o Vitest é permitido).
 *
 * Uso (a partir da raiz do back-end):
 *   node scripts/varredura-dependencias.mjs                 # usa ./src
 *   node scripts/varredura-dependencias.mjs caminho/src     # outra pasta
 *   node scripts/varredura-dependencias.mjs src --md saida.md
 *
 * Saída: relatório no terminal e arquivo Markdown (padrão: varredura-dependencias.md,
 * na pasta em que o comando foi executado). Código de saída 0 = nenhuma violação.
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, resolve, dirname, relative, sep } from "node:path";

// ---------------------------------------------------------------- argumentos
const args = process.argv.slice(2);
const mdIdx = args.indexOf("--md");
const mdPath = mdIdx >= 0 ? args[mdIdx + 1] : "varredura-dependencias.md";
const positional = args.filter((a, i) => !a.startsWith("--") && i !== mdIdx + 1);
const SRC = resolve(positional[0] ?? "src");

// ---------------------------------------------------------------- configuração
const LAYERS = ["domain", "useCases", "infra", "main"];
const ALLOWED = {
  domain: ["domain"],
  useCases: ["domain", "useCases"],
  infra: ["domain", "useCases", "infra"],
  main: ["domain", "useCases", "infra", "main"],
};
// Bibliotecas de infraestrutura proibidas em domain e useCases
const FORBIDDEN_PACKAGES = [
  "@prisma/client", "prisma", "express", "cors", "bcrypt", "jsonwebtoken",
  "dotenv", "axios", "pg",
];
// Permitidas apenas em arquivos de teste
const TEST_PACKAGES = ["vitest"];
const SCANNED_LAYERS = ["domain", "useCases"]; // camadas que precisam ser "puras"

// ---------------------------------------------------------------- leitura dos arquivos
function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "generated") continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx|mts)$/.test(name) && !name.endsWith(".d.ts")) out.push(full);
  }
  return out;
}

function stripComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:\\])\/\/.*$/gm, "$1");
}

const IMPORT_RE = [
  /\bimport\s+(?:type\s+)?[^'";]*?\bfrom\s*['"]([^'"]+)['"]/g, // import x from "y"
  /\bexport\s+(?:type\s+)?[^'";]*?\bfrom\s*['"]([^'"]+)['"]/g, // export ... from "y"
  /\bimport\s*['"]([^'"]+)['"]/g,                              // import "y"
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,                    // import("y")
  /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,                   // require("y")
];

function extractImports(file) {
  const raw = readFileSync(file, "utf8");
  const code = stripComments(raw);
  const found = [];
  for (const re of IMPORT_RE) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(code))) {
      const line = code.slice(0, m.index).split("\n").length;
      found.push({ spec: m[1], line });
    }
  }
  // remove duplicatas (mesmo spec na mesma linha, capturado por duas regex)
  const seen = new Set();
  return found.filter((f) => {
    const k = `${f.line}|${f.spec}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function layerOf(absFile) {
  const rel = relative(SRC, absFile);
  if (rel.startsWith("..")) return "fora";
  const first = rel.split(sep)[0];
  return LAYERS.includes(first) ? first : "outra";
}

const isTest = (f) => /\.(test|spec)\.tsx?$/.test(f);
const isNodeBuiltin = (s) => s.startsWith("node:");
const pkgName = (s) => (s.startsWith("@") ? s.split("/").slice(0, 2).join("/") : s.split("/")[0]);

// ---------------------------------------------------------------- análise
const files = walk(SRC);
const stats = {};
for (const l of LAYERS) stats[l] = { prod: 0, test: 0, rel: 0, ext: 0 };
const matrix = {};   // código de produção: de -> para -> n
const matrixTest = {}; // testes
for (const l of LAYERS) { matrix[l] = {}; matrixTest[l] = {}; }
const externals = {}; // camada -> pacote -> n  (produção)
const violations = [];

for (const file of files) {
  const from = layerOf(file);
  if (!LAYERS.includes(from)) continue;
  const test = isTest(file);
  stats[from][test ? "test" : "prod"]++;
  const m = test ? matrixTest : matrix;

  for (const { spec, line } of extractImports(file)) {
    const where = `${relative(SRC, file).split(sep).join("/")}:${line}`;

    if (spec.startsWith(".")) {
      const target = layerOf(resolve(dirname(file), spec));
      stats[from].rel++;
      m[from][target] = (m[from][target] ?? 0) + 1;
      if (LAYERS.includes(target) && !ALLOWED[from].includes(target)) {
        violations.push({ where, spec, motivo: `${from} não pode depender de ${target}` });
      } else if (!LAYERS.includes(target)) {
        violations.push({ where, spec, motivo: `importação fora das camadas conhecidas (${target})` });
      }
    } else {
      stats[from].ext++;
      const name = isNodeBuiltin(spec) ? spec : pkgName(spec);
      if (!test) {
        externals[from] ??= {};
        externals[from][name] = (externals[from][name] ?? 0) + 1;
      }
      if (SCANNED_LAYERS.includes(from)) {
        if (FORBIDDEN_PACKAGES.includes(name)) {
          violations.push({ where, spec, motivo: `${from} não pode importar a biblioteca de infraestrutura "${name}"` });
        } else if (test && TEST_PACKAGES.includes(name)) {
          // permitido
        } else if (isNodeBuiltin(spec) || !TEST_PACKAGES.includes(name)) {
          violations.push({ where, spec, motivo: `importação externa em ${from} a revisar ("${name}")` });
        }
      }
    }
  }
}

// ---------------------------------------------------------------- relatório
const cols = ["domain", "useCases", "infra", "main"];
const pad = (s, n) => String(s).padEnd(n);
const lines = [];
const out = (s = "") => lines.push(s);

out("# Varredura da regra de dependência");
out();
out(`Pasta analisada: \`${relative(process.cwd(), SRC) || "."}\` | Data: ${new Date().toISOString().slice(0, 10)} | Arquivos .ts lidos: ${files.length}`);
out();
out("## 1. Arquivos e importações por camada");
out();
out("| Camada | Arquivos de produção | Arquivos de teste | Importações relativas | Importações de pacotes |");
out("|---|---:|---:|---:|---:|");
for (const l of LAYERS) {
  const s = stats[l];
  out(`| ${l} | ${s.prod} | ${s.test} | ${s.rel} | ${s.ext} |`);
}
out();
out("## 2. Matriz de dependências (código de produção)");
out();
out("Cada célula é a quantidade de importações da camada da linha para a camada da coluna.");
out();
out(`| de \\ para | ${cols.join(" | ")} |`);
out(`|---|${cols.map(() => "---:").join("|")}|`);
for (const l of LAYERS) {
  out(`| **${l}** | ${cols.map((c) => matrix[l][c] ?? 0).join(" | ")} |`);
}
out();
out("## 3. Matriz de dependências (arquivos de teste)");
out();
out(`| de \\ para | ${cols.join(" | ")} |`);
out(`|---|${cols.map(() => "---:").join("|")}|`);
for (const l of LAYERS) {
  out(`| **${l}** | ${cols.map((c) => matrixTest[l][c] ?? 0).join(" | ")} |`);
}
out();
out("## 4. Pacotes externos usados no código de produção");
out();
for (const l of LAYERS) {
  const e = externals[l] ?? {};
  const names = Object.keys(e).sort();
  out(`- **${l}:** ${names.length ? names.map((n) => `${n} (${e[n]})`).join(", ") : "nenhum"}`);
}
out();
out("## 5. Violações");
out();
if (violations.length === 0) {
  out("Nenhuma violação encontrada em domain e useCases (produção e testes).");
} else {
  out("| Local | Importação | Motivo |");
  out("|---|---|---|");
  for (const v of violations) out(`| ${v.where} | \`${v.spec}\` | ${v.motivo} |`);
}
out();
out("## 6. Resultado");
out();
const ok = violations.length === 0;
out(ok
  ? "**APROVADO:** domain depende apenas de domain; useCases depende apenas de domain e useCases; nenhuma biblioteca de infraestrutura é importada nessas camadas."
  : `**REPROVADO:** ${violations.length} ocorrência(s) a analisar (seção 5).`);
out();
out("Regra aplicada: domain → {domain}; useCases → {domain, useCases}; infra → {domain, useCases, infra}; main → todas. Bibliotecas proibidas em domain e useCases: " + FORBIDDEN_PACKAGES.join(", ") + ".");

const text = lines.join("\n") + "\n";
console.log(text);
writeFileSync(mdPath, text, "utf8");
console.log(`Relatório salvo em: ${resolve(mdPath)}`);
process.exit(ok ? 0 : 1);
