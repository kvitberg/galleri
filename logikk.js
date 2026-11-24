// Ren logikk for galleriet: sortering, filter og tekster. Brukes av side.js i nettleseren og av testene i Node.
(function (rot) {
  const L = {
    gyldigId(id) {
      const s = String(id || "");
      return /^[a-f0-9]{32}$/.test(s) || /^demo-(nedlasting|valg)$/.test(s);
    },
    sorter(bilder, visning, rekkefolge) {
      const rek = rekkefolge || [];
      const plass = (r) => { const i = rek.indexOf(r); return i < 0 ? rek.length : i; };
      return bilder.slice().sort(visning === "rom" ? (a, b) => plass(a.rom) - plass(b.rom) || a.nr - b.nr : (a, b) => a.nr - b.nr);
    },
    filtrer(bilder, filter) {
      const min = (filter && filter.min) || 0, rom = filter && filter.rom;
      return bilder.filter((b) => (b.stjerner || 0) >= min && (!rom || b.rom === rom));
    },
    romTelling(bilder, rekkefolge) {
      return (rekkefolge || []).filter((r) => bilder.some((b) => b.rom === r)).map((rom) => ({ rom, antall: bilder.filter((b) => b.rom === rom).length }));
    },
    grupper(bilder, visning, rekkefolge) {
      if (visning !== "rom") return [{ rom: null, bilder }];
      return L.romTelling(bilder, rekkefolge).map((r) => ({ rom: r.rom, bilder: bilder.filter((b) => b.rom === r.rom) }));
    },
    stjerner(n) { return n ? "★".repeat(n) + "☆".repeat(5 - n) : ""; },
    harStjerner(bilder) { return (bilder || []).some((b) => b.stjerner > 0); },
    antallTekst(n, modus) { return modus === "valg" ? `${n} ${n === 1 ? "vinkel" : "vinkler"}` : `${n} ${n === 1 ? "bilde" : "bilder"}`; },
    datoTekst(iso) {
      const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
      return m ? `${+m[3]}.${+m[2]}.${m[1]}` : "";
    },
    zipNavn(tittel) { return (String(tittel || "").replace(/[\\/:*?"<>|]+/g, "").trim() || "bilder") + ".zip"; },
  };
  if (typeof module !== "undefined" && module.exports) module.exports = L; else rot.GalleriLogikk = L;
})(this);
