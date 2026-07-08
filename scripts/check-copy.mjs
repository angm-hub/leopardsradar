#!/usr/bin/env node
/**
 * Garde-fou copy — bloque le build si un tiret cadratin (U+2014) traîne
 * dans du texte affiché (chaînes ou texte JSX). Les commentaires de code
 * sont ignorés : ils ne sont pas rendus.
 *
 * Règle éditoriale Léopards Radar : zéro tiret cadratin dans le copy.
 * On remplace par « · », « : » ou une virgule selon le contexte.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../src", import.meta.url).pathname;
const EM_DASH = "—";

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(tsx?|css)$/.test(name)) yield p;
  }
}

/** Retire les commentaires (// …, /* … *\/) pour ne garder que le rendu. */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

const offenders = [];
for (const file of walk(ROOT)) {
  const cleaned = stripComments(readFileSync(file, "utf8"));
  if (cleaned.includes(EM_DASH)) {
    const lines = cleaned.split("\n");
    lines.forEach((line, i) => {
      if (line.includes(EM_DASH)) {
        offenders.push(`${file.replace(ROOT, "src")}:${i + 1}: ${line.trim().slice(0, 100)}`);
      }
    });
  }
}

if (offenders.length > 0) {
  console.error("BUILD BLOQUE : tiret cadratin dans du texte affiché.\n");
  for (const o of offenders) console.error("  " + o);
  console.error(`\n${offenders.length} occurrence(s). Remplacer par « · », « : » ou une virgule.`);
  process.exit(1);
}
console.log("check-copy : zéro tiret cadratin dans le copy, OK.");
