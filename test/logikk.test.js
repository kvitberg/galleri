// Ren logikk for galleriet. Kjør: node --test test/*.test.js
const test = require("node:test");
const assert = require("node:assert");
const L = require("../logikk.js");

const ROM = ["Stue", "Spisestue", "Kjøkken", "Sov 1", "Sov 2", "Bad", "Gang", "Ute", "Detaljer", "Annet"];
const B = [
  { nr: 1, rom: "Gang", stjerner: 2 }, { nr: 2, rom: "Stue", stjerner: 5 }, { nr: 3, rom: "Sov 2", stjerner: 4 },
  { nr: 4, rom: "Stue", stjerner: 3 }, { nr: 5, rom: "Kjøkken", stjerner: 5 }, { nr: 6, rom: "Sov 1", stjerner: null },
];

test("gyldige og ugyldige id-er", () => {
  assert.ok(L.gyldigId("abcdef1234567890abcdef1234567890"));
  assert.ok(L.gyldigId("demo-valg") && L.gyldigId("demo-nedlasting"));
  ["", "abc", "ABCDEF1234567890ABCDEF1234567890", "demo-x", "abcdef1234567890abcdef1234567890x"].forEach((id) => assert.ok(!L.gyldigId(id), id));
});

test("sortering tatt og etter rom", () => {
  assert.deepStrictEqual(L.sorter(B.slice().reverse(), "tatt", ROM).map((b) => b.nr), [1, 2, 3, 4, 5, 6]);
  assert.deepStrictEqual(L.sorter(B, "rom", ROM).map((b) => b.nr), [2, 4, 5, 6, 3, 1]);
});

test("filter på stjerner og rom", () => {
  assert.deepStrictEqual(L.filtrer(B, { min: 4 }).map((b) => b.nr), [2, 3, 5]);
  assert.deepStrictEqual(L.filtrer(B, { min: 0, rom: "Stue" }).map((b) => b.nr), [2, 4]);
});

test("romtelling og grupper følger romrekkefølgen", () => {
  assert.deepStrictEqual(L.romTelling(B, ROM), [{ rom: "Stue", antall: 2 }, { rom: "Kjøkken", antall: 1 }, { rom: "Sov 1", antall: 1 }, { rom: "Sov 2", antall: 1 }, { rom: "Gang", antall: 1 }]);
  assert.deepStrictEqual(L.grupper(B, "tatt", ROM), [{ rom: null, bilder: B }]);
  assert.deepStrictEqual(L.grupper(L.sorter(B, "rom", ROM), "rom", ROM).map((g) => [g.rom, g.bilder.map((b) => b.nr)]),
    [["Stue", [2, 4]], ["Kjøkken", [5]], ["Sov 1", [6]], ["Sov 2", [3]], ["Gang", [1]]]);
});

test("tekster", () => {
  assert.strictEqual(L.stjerner(3), "★★★☆☆");
  assert.strictEqual(L.stjerner(null), "");
  assert.deepStrictEqual([L.antallTekst(1, "valg"), L.antallTekst(18, "valg"), L.antallTekst(1, "nedlasting"), L.antallTekst(47, "nedlasting")], ["1 vinkel", "18 vinkler", "1 bilde", "47 bilder"]);
  assert.strictEqual(L.datoTekst("2026-11-03"), "3.11.2026");
  assert.strictEqual(L.datoTekst(""), "");
  assert.strictEqual(L.zipNavn("Hans Nielsen Hauges gate 4, 0481 OSLO"), "Hans Nielsen Hauges gate 4, 0481 OSLO.zip");
  assert.strictEqual(L.zipNavn('a/b:c*?"<>|'), "abc.zip");
  assert.strictEqual(L.zipNavn(""), "bilder.zip");
});
