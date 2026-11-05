/* Funciones compartidas por fase1.html y fase2.html */
(function () {
  const C = window.CONFIG;
  const $ = (s) => document.querySelector(s);
  window.$ = $;

  document.addEventListener("DOMContentLoaded", () => {
    const a = $("#asig"); if (a) a.textContent = C.ASIGNATURA;
    const t = $("#tema"); if (t) t.textContent = C.ACTIVIDAD;
    if (!C.ENDPOINT) document.querySelectorAll(".modo-prueba").forEach(e => e.classList.remove("oculto"));
  });

  /* ---------- Navegación entre pantallas ---------- */
  window.mostrar = function (id) {
    document.querySelectorAll(".pantalla").forEach(p => p.classList.remove("activa"));
    $("#" + id).classList.add("activa");
    window.scrollTo(0, 0);
  };

  /* ---------- Código personal ---------- */
  window.normalizarCodigo = (v) => (v || "").trim().toUpperCase()
    .normalize("NFD").replace(/[̀-̂̄-ͯ]/g, "").normalize("NFC").replace(/\s+/g, "");
  window.codigoValido = (v) => /^[A-ZÑ]{2}(0[1-9]|[12][0-9]|3[01])$/.test(v);

  window.memoria = {
    get(k) { try { return JSON.parse(localStorage.getItem("cuasiIE_" + k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem("cuasiIE_" + k, JSON.stringify(v)); } catch (e) {} }
  };

  window.nuevoId = (prefijo) => prefijo + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);

  /* ---------- Prueba RMET (sin retroalimentación) ---------- */
  window.Prueba = function (forma, contenedor, alTerminar) {
    const items = forma.map(n => window.RMET[n]);
    const pre = items.map(it => { const i = new Image(); i.src = `img/rmet/rmet${String(it.n).padStart(2, "0")}.jpg`; return i; });
    const res = []; let k = 0, eleccion = null, t0 = 0;
    const inicio = Date.now();

    function pintar() {
      const it = items[k]; eleccion = null;
      const defs = it.o.map(w => `<dt>${w}</dt><dd>${window.GLOSARIO[w] || "—"}</dd>`).join("");
      contenedor.innerHTML = `
        <div class="contador"><span>Fotografía ${k + 1} de ${items.length}</span><span>${Math.round(k / items.length * 100)} %</span></div>
        <div class="barra"><div style="width:${k / items.length * 100}%"></div></div>
        <p style="font-weight:600">¿Qué palabra describe mejor lo que esta persona está pensando o sintiendo?</p>
        <div class="rmet">
          <div class="foto"><img src="${pre[k].src}" alt="Región de los ojos, fotografía ${k + 1}"></div>
          ${it.o.map((w, j) => `<button class="op" data-j="${j}">${w}</button>`).join("")}
        </div>
        <details class="glosario"><summary>¿Dudas con alguna palabra? Ver su significado</summary><dl>${defs}</dl></details>
        <div class="botones"><button id="sig" disabled>${k === items.length - 1 ? "Terminar" : "Siguiente →"}</button></div>`;
      contenedor.querySelectorAll(".op").forEach(b => b.addEventListener("click", () => {
        contenedor.querySelectorAll(".op").forEach(x => x.classList.remove("sel"));
        b.classList.add("sel"); eleccion = Number(b.dataset.j); $("#sig").disabled = false;
      }));
      $("#sig").addEventListener("click", siguiente);
      t0 = performance.now();
    }
    function siguiente() {
      if (eleccion === null) return;
      const it = items[k];
      res.push({ n: it.n, resp: eleccion, ok: eleccion === it.c ? 1 : 0, tr: Math.round(performance.now() - t0) });
      k++;
      if (k < items.length) pintar();
      else {
        const trs = res.map(r => r.tr).sort((a, b) => a - b);
        alTerminar({
          aciertos: res.reduce((s, r) => s + r.ok, 0),
          n_items: items.length,
          duracion_s: Math.round((Date.now() - inicio) / 1000),
          tr_mediana_ms: trs[Math.floor(trs.length / 2)],
          detalle: res
        });
      }
    }
    pintar();
  };

  /* Convierte el detalle por ítem en columnas I01_resp, I01_ok, I01_tr… */
  window.columnasItems = function (detalle) {
    const o = {};
    detalle.forEach(r => {
      const p = "I" + String(r.n).padStart(2, "0");
      o[p + "_resp"] = window.RMET[r.n].o[r.resp]; o[p + "_ok"] = r.ok; o[p + "_tr"] = r.tr;
    });
    return o;
  };

  /* ---------- Envío a la hoja de cálculo (cola con reintentos) ---------- */
  let enviando = false;
  window.enviar = function (hoja, fila, alCambiarEstado) {
    const cola = memoria.get("cola") || [];
    cola.push({ hoja, fila });
    memoria.set("cola", cola);
    vaciarCola(alCambiarEstado);
  };
  async function vaciarCola(cb) {
    cb = cb || (() => {});
    if (!C.ENDPOINT) {
      const local = memoria.get("prueba_local") || [];
      (memoria.get("cola") || []).forEach(x => local.push(x));
      memoria.set("prueba_local", local); memoria.set("cola", []);
      console.log("[MODO PRUEBA] Datos que se habrían enviado:", local);
      cb("prueba"); return;
    }
    if (enviando) return;
    enviando = true;
    try {
      let cola = memoria.get("cola") || [];
      while (cola.length) {
        const x = cola[0];
        cb("enviando");
        await fetch(C.ENDPOINT, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ accion: "guardar", hoja: x.hoja, fila: x.fila }) });
        const r = await fetch(`${C.ENDPOINT}?accion=confirmar&hoja=${x.hoja}&id=${encodeURIComponent(x.fila.id)}`);
        const j = await r.json();
        if (!j.existe) throw new Error("no confirmado");
        cola = (memoria.get("cola") || []).filter(y => y.fila.id !== x.fila.id);
        memoria.set("cola", cola);
      }
      cb("ok");
    } catch (e) {
      cb("error");
      setTimeout(() => vaciarCola(cb), 4000);
    } finally { enviando = false; }
  }
  window.reintentarEnvio = vaciarCola;

  window.pintarEstado = function (el) {
    return function (s) {
      const m = { enviando: ["Guardando tus respuestas… no cierres esta página.", ""],
        ok: ["✓ Respuestas guardadas.", "ok"],
        error: ["Sin conexión: reintentando automáticamente… no cierres esta página.", "mal"],
        prueba: ["Modo prueba: los datos no se han enviado (falta configurar la hoja).", "mal"] }[s];
      el.textContent = m[0]; el.className = "estado " + m[1];
    };
  };
})();
