// Galleriet kunden ser. Henter alt fra galleritjenesten og har ingen hemmeligheter.
(function () {
  "use strict";
  const TJENESTE = ""; // tjenestens /exec-adresse, settes når tjenesten er distribuert
  const L = window.GalleriLogikk;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const id = new URLSearchParams(location.search).get("g") || "";
  const demo = id.indexOf("demo-") === 0;
  const t = { data: null, visning: "tatt", min: 0, rom: null, valgt: new Set(), apen: -1, kommentar: "", sender: false, x0: null };

  function melding(tekst, feil) {
    const m = $("#melding");
    m.textContent = tekst;
    m.className = "melding vis" + (feil ? " feil" : "");
    clearTimeout(m._t);
    m._t = setTimeout(() => (m.className = "melding"), 6000);
  }
  const KONTAKT = "Fikk ikke kontakt. Prøv igjen.";
  // Nettverks-, HTTP- og JSON-feil blir alltid én fast norsk tekst, aldri nettleserens egen
  async function hentJson(url, valg) {
    try {
      const r = await fetch(url, valg);
      if (!r.ok) throw new Error();
      return await r.json();
    } catch (e) { throw new Error(KONTAKT); }
  }
  const postJson = (data) => hentJson(TJENESTE, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(data) });
  const demoBilde = (rom, nr) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#ece6dc"/><text x="24" y="372" font-family="monospace" font-size="28" fill="#5c5054">${rom} · ${nr}</text></svg>`);

  async function last() {
    if (!L.gyldigId(id)) return visStengt("Lenken er ikke gyldig. Sjekk at du har med hele lenken fra mailen.");
    try {
      let d;
      if (demo) {
        d = await hentJson(`demo/${id.slice(5)}.json`);
        d.bilder.forEach((b) => { if (b.url.indexOf("demo:") === 0) b.url = demoBilde(b.rom, b.nr); });
      } else {
        if (!TJENESTE) throw new Error("Ikke koblet til");
        d = await hentJson(`${TJENESTE}?a=galleri&g=${encodeURIComponent(id)}`);
      }
      if (!d.ok) return visStengt(d.feil || "Fant ikke galleriet.");
      if (d.stengt) return visStengt("Bildene er ikke lenger tilgjengelige.", d.fotograf);
      t.data = d;
      document.title = `${d.tittel} – Fotostallen`;
      tegn();
    } catch (e) { visStengt("Fikk ikke hentet bildene. Prøv igjen om litt."); }
  }

  function visStengt(tekst, fotograf) {
    $("#innhold").innerHTML = `<div class="stengt"><h1>${esc(tekst)}</h1>`
      + (fotograf && fotograf.epost ? `<p>Ta kontakt med ${esc(fotograf.navn || "fotografen")}: <a href="mailto:${esc(fotograf.epost)}">${esc(fotograf.epost)}</a></p>` : "") + `</div>`;
    $("#bunn").hidden = true;
  }

  const synlige = () => L.sorter(L.filtrer(t.data.bilder, { min: t.min, rom: t.rom }), t.visning, t.data.romRekkefolge);

  function tegn() {
    const d = t.data, valg = d.modus === "valg", vis = synlige();
    const knapp = (attr, verdi, tekst, paa) => `<button type="button" class="chip" ${attr}="${esc(verdi)}" aria-pressed="${paa}">${esc(tekst)}</button>`;
    const flis = (b) => {
      const paa = t.valgt.has(b.nr);
      return `<figure class="flis${paa ? " valgt" : ""}">`
        + `<button type="button" class="aapne" data-i="${vis.indexOf(b)}" aria-label="Vis bilde ${b.nr} stort"><img src="${esc(b.url)}" alt="${esc(b.rom)}, bilde ${b.nr}" loading="lazy"></button>`
        + `<label class="kryss"><input type="checkbox" data-nr="${b.nr}"${paa ? " checked" : ""}><span>${valg ? "Rediger dette" : "Velg"}</span></label>`
        + `<figcaption><span class="stjerner" aria-label="${b.stjerner || 0} av 5 stjerner">${L.stjerner(b.stjerner)}</span><span>${esc(b.rom)}${valg && b.antall > 1 ? ` · ${b.antall} bilder` : ""}</span></figcaption></figure>`;
    };
    $("#innhold").innerHTML =
      `<div class="meta">Fotostallen · ${valg ? "Valg av bilder" : "Bildeleveranse"}</div>`
      + `<header class="topp"><div class="kicker">(01) — ${valg ? "Velg bilder" : "Bildene"}</div><h1>${esc(d.tittel)}</h1><p>${esc(d.fotograf.navn)} · ${esc(L.datoTekst(d.dato))} · ${esc(L.antallTekst(d.bilder.length, d.modus))}</p>`
      + (valg ? `<p class="hjelp">Kryss av vinklene du vil ha redigert, og trykk «Send valget» nederst.</p>` : "") + `</header>`
      + `<nav class="verktoy" aria-label="Sortering og filter"><span class="l">Vis</span>${knapp("data-vis", "tatt", "Rekkefølge tatt", t.visning === "tatt")}${knapp("data-vis", "rom", "Etter rom", t.visning === "rom")}`
      + `<span class="l">Stjerner</span>${[[0, "Alle"], [3, "3★ og opp"], [4, "4★ og opp"], [5, "5★"]].map(([k, x]) => knapp("data-min", k, x, t.min === k)).join("")}`
      + `<span class="l">Rom</span>${knapp("data-rom", "", "Alle", !t.rom)}${L.romTelling(d.bilder, d.romRekkefolge).map((r) => knapp("data-rom", r.rom, `${r.rom} (${r.antall})`, t.rom === r.rom)).join("")}</nav>`
      + `<div id="lenker"></div>`
      + (vis.length
        ? L.grupper(vis, t.visning, d.romRekkefolge).map((g) => (g.rom ? `<h2 class="romtittel">${esc(g.rom)}</h2>` : "") + `<div class="rutenett">${g.bilder.map(flis).join("")}</div>`).join("")
        : `<p class="tom">Ingen bilder med dette filteret.</p>`);
    tegnBunn();
  }

  function tegnBunn() {
    const d = t.data, n = t.valgt.size, bunn = $("#bunn");
    bunn.hidden = false;
    bunn.innerHTML = d.modus === "valg"
      ? `<span class="teller">${n} valgt</span><textarea id="kommentar" rows="1" placeholder="Noe vi bør vite?" aria-label="Noe vi bør vite?">${esc(t.kommentar)}</textarea><button type="button" class="hoved" id="sendValg">Send valget</button>`
      : `<span class="teller">${n} valgt</span>${d.zip ? `<button type="button" class="ghost" id="lastAlle">Last ned alle</button>` : ""}<button type="button" class="hoved" id="lastValgte">Last ned valgte (${n})</button>`;
    plassTilBunn();
  }
  function oppdaterBunn() {
    const n = t.valgt.size;
    $(".teller").textContent = `${n} valgt`;
    const k = $("#lastValgte");
    if (k) k.textContent = `Last ned valgte (${n})`;
  }
  // Bunnlinja ligger fast over innholdet og blir høyere når den brytes på smale skjermer: like mye luft under siste rad
  function plassTilBunn() {
    const bunn = $("#bunn");
    document.body.style.paddingBottom = bunn.hidden ? "" : `${bunn.offsetHeight + 24}px`;
  }

  function visStor(i) {
    const vis = synlige();
    if (i < 0 || i >= vis.length) return;
    t.apen = i;
    const b = vis[i], v = $("#viser");
    v.innerHTML = `<button type="button" class="lukk" aria-label="Lukk">×</button><button type="button" class="pil forrige" aria-label="Forrige bilde">‹</button>`
      + `<img src="${esc(b.url)}" alt="${esc(b.rom)}, bilde ${b.nr}"><button type="button" class="pil neste" aria-label="Neste bilde">›</button>`
      + `<div class="viser-tekst"><span class="stjerner">${L.stjerner(b.stjerner)}</span> ${esc(b.rom)} · ${i + 1} av ${vis.length}</div>`;
    v.hidden = false;
    document.body.classList.add("laast");
    v.querySelector(".lukk").focus();
  }
  function lukkStor() {
    $("#viser").hidden = true;
    t.apen = -1;
    document.body.classList.remove("laast");
  }

  async function lenke(nr) {
    const r = await hentJson(`${TJENESTE}?a=lenke&g=${encodeURIComponent(id)}&nr=${nr}`);
    if (!r.ok) throw new Error(r.feil || "Fikk ikke lenken.");
    return r;
  }
  function lagreFil(blob, navn) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = navn;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }
  // Uten zip i nettleseren (for eksempel når Dropbox ikke tillater det): én lenke per bilde
  async function visLenker(nr) {
    const linjer = [];
    for (const n of nr) { try { const l = await lenke(n); linjer.push(`<a href="${esc(l.url)}" download>Last ned ${esc(l.navn)}</a>`); } catch (e) { linjer.push(`<span>Bilde ${n} kunne ikke hentes.</span>`); } }
    $("#lenker").innerHTML = `<div class="lenker"><b>Last ned ett og ett:</b>${linjer.join("")}</div>`;
    $("#lenker").scrollIntoView({ block: "center" });
  }
  async function lastNedValgte() {
    const nr = [...t.valgt].sort((a, b) => a - b);
    if (!nr.length) return melding("Kryss av bildene du vil laste ned først.");
    if (demo) return melding("Dette er en demo. Her lastes ingenting ned.");
    const knapp = $("#lastValgte");
    try {
      if (nr.length === 1) {
        knapp.textContent = "Henter …";
        const l = await lenke(nr[0]);
        try { const r = await fetch(l.url); if (!r.ok) throw new Error(); lagreFil(await r.blob(), l.navn); } catch (e) { location.href = l.url; }
        return;
      }
      const zip = new JSZip();
      for (let i = 0; i < nr.length; i++) {
        knapp.textContent = `Henter ${i + 1} av ${nr.length} …`;
        const l = await lenke(nr[i]);
        const r = await fetch(l.url);
        if (!r.ok) throw new Error();
        zip.file(l.navn, await r.blob());
      }
      knapp.textContent = "Pakker …";
      lagreFil(await zip.generateAsync({ type: "blob" }), L.zipNavn(t.data.tittel));
    } catch (e) {
      melding("Fikk ikke pakket bildene. Her er lenkene ett og ett.", true);
      await visLenker(nr);
    } finally { oppdaterBunn(); }
  }

  async function sendValg() {
    if (t.sender) return;
    const nr = [...t.valgt].sort((a, b) => a - b);
    if (!nr.length) return melding("Kryss av minst én vinkel først.");
    if (demo) return melding(`Dette er en demo. Valget (${L.antallTekst(nr.length, "valg")}) ble ikke sendt.`);
    t.sender = true;
    const knapp = $("#sendValg");
    knapp.textContent = "Sender …";
    try {
      const r = await postJson({ handling: "valg", galleriId: id, nr, kommentar: t.kommentar.trim() });
      if (!r.ok) throw new Error(r.feil || "Valget ble ikke sendt. Prøv igjen.");
      melding(`Takk! Valget er sendt (${L.antallTekst(r.antall, "valg")}). Du får en kvittering på mail.`);
      knapp.textContent = "Send valget på nytt";
    } catch (e) {
      melding(e.message, true);
      knapp.textContent = "Send valget";
    } finally { t.sender = false; }
  }

  document.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (chip) {
      if (chip.dataset.vis) t.visning = chip.dataset.vis;
      if (chip.dataset.min !== undefined) t.min = Number(chip.dataset.min);
      if (chip.dataset.rom !== undefined) t.rom = chip.dataset.rom || null;
      return tegn();
    }
    const aapne = e.target.closest(".aapne");
    if (aapne) return visStor(Number(aapne.dataset.i));
    if (e.target.closest("#viser")) {
      if (e.target.closest(".lukk") || e.target.id === "viser") return lukkStor();
      if (e.target.closest(".forrige")) return visStor(t.apen - 1);
      if (e.target.closest(".neste")) return visStor(t.apen + 1);
    }
    if (e.target.closest("#lastValgte")) return lastNedValgte();
    if (e.target.closest("#lastAlle")) { if (demo) return melding("Dette er en demo. Her lastes ingenting ned."); location.href = t.data.zip; return; }
    if (e.target.closest("#sendValg")) return sendValg();
  });
  document.addEventListener("change", (e) => {
    const k = e.target.closest("input[data-nr]");
    if (!k) return;
    const nr = Number(k.dataset.nr);
    if (k.checked) t.valgt.add(nr); else t.valgt.delete(nr);
    k.closest(".flis").classList.toggle("valgt", k.checked);
    oppdaterBunn();
  });
  document.addEventListener("input", (e) => { if (e.target.id === "kommentar") t.kommentar = e.target.value; });
  document.addEventListener("keydown", (e) => {
    if ($("#viser").hidden) return;
    if (e.key === "Escape") lukkStor();
    if (e.key === "ArrowLeft") visStor(t.apen - 1);
    if (e.key === "ArrowRight") visStor(t.apen + 1);
  });
  window.addEventListener("resize", plassTilBunn);
  // Også når linja endrer høyde av seg selv: skriften lastes, teksten endres eller kommentarfeltet dras større
  if (window.ResizeObserver) new ResizeObserver(plassTilBunn).observe($("#bunn"));
  $("#viser").addEventListener("touchstart", (e) => { t.x0 = e.touches[0].clientX; }, { passive: true });
  $("#viser").addEventListener("touchend", (e) => {
    if (t.x0 === null) return;
    const dx = e.changedTouches[0].clientX - t.x0;
    t.x0 = null;
    if (Math.abs(dx) > 40) visStor(t.apen + (dx < 0 ? 1 : -1));
  });

  last();
})();
