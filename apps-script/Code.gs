/* =====================================================================
   BASE DE DATOS — Cuasiexperimento «Lectura de la mirada» (RMET)
   Google Apps Script + Google Sheets

   Instalación (detalle en README.md):
     1. Crea una hoja de Google vacía (p. ej. «CuasiIE_datos»).
     2. Extensiones > Apps Script. Borra el contenido y pega este archivo.
     3. Cambia CLAVE_RESULTADOS por una palabra que solo sepas tú.
     4. Ejecuta una vez la función «preparar» (autoriza los permisos).
     5. Implementar > Nueva implementación > Aplicación web
          - Ejecutar como: Yo
          - Quién tiene acceso: Cualquier usuario
        Copia la URL que termina en /exec y pégala en js/config.js (ENDPOINT).

   Pestañas que se crean:
     Pre   → una fila por persona en la parte 1 (forma A del RMET)
     Post  → una fila por persona en la parte 2 (forma B del RMET)
     Datos → unión automática por código: grupo, zona, pre, post y ganancia

   Los datos solo los ve quien tenga la hoja o la clave de resultados.
   Las escrituras pasan por LockService (no se pisan si llegan a la vez) y
   cada envío lleva un id único (si la web reenvía, no se duplica).
   ===================================================================== */

const CLAVE_RESULTADOS = "cambia-esta-clave";   // <-- ¡CÁMBIALA!

const ITEMS_A = [1, 4, 5, 8, 9, 12, 13, 16, 17, 20, 21, 24, 25, 28, 29, 32, 33, 36];
const ITEMS_B = [2, 3, 6, 7, 10, 11, 14, 15, 18, 19, 22, 23, 26, 27, 30, 31, 34, 35];
const cols_ = (lista) => lista.map(n => "I" + ("0" + n).slice(-2)).reduce((a, p) => a.concat([p + "_resp", p + "_ok", p + "_tr"]), []);

const COLUMNAS = {
  Pre: ["id", "sesion", "codigo", "sexo", "lado", "zona", "fila", "fila_global", "grupo_asignado",
        "aciertos_pre", "n_items", "duracion_s", "tr_mediana_ms", "movil", "forma", "fase",
        "fecha_inicio", "fecha_fin", "recibido"].concat(cols_(ITEMS_A)),
  Post: ["id", "sesion", "codigo", "grupo_declarado", "hablo_otro_grupo",
         "aciertos_post", "n_items", "duracion_s", "tr_mediana_ms", "movil", "forma", "fase",
         "fecha_inicio", "fecha_fin", "recibido"].concat(cols_(ITEMS_B))
};
const COLS_DATOS = ["sesion", "codigo", "sexo", "lado", "zona", "fila_global", "grupo_asignado", "grupo_declarado",
  "coincide_grupo", "hablo_otro_grupo", "pre", "post", "ganancia", "tiene_pre", "tiene_post"];

/* ---------- GET ---------- */
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.accion === "confirmar") return json_({ existe: existeId_(p.hoja === "post" ? "Post" : "Pre", p.id || "") });
  if (p.accion === "datos") {
    if (p.clave !== CLAVE_RESULTADOS) return json_({ error: "clave incorrecta" });
    return json_({ pre: leer_("Pre", p.sesion), post: leer_("Post", p.sesion) });
  }
  return json_({ ok: true, info: "Servicio del cuasiexperimento activo" });
}

/* ---------- POST: guardar una fila ---------- */
function doPost(e) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return json_({ error: "servidor ocupado, reintentar" });
  try {
    const cuerpo = JSON.parse(e.postData.contents);
    const nombre = cuerpo.hoja === "post" ? "Post" : cuerpo.hoja === "pre" ? "Pre" : null;
    if (cuerpo.accion !== "guardar" || !nombre || !cuerpo.fila || !cuerpo.fila.id) return json_({ error: "petición no válida" });
    const fila = cuerpo.fila;
    if (existeId_(nombre, fila.id)) return json_({ ok: true, duplicado: true });
    fila.recibido = new Date().toISOString();
    const h = hoja_(nombre);
    let cab = cabecera_(h, COLUMNAS[nombre]);
    const nuevas = Object.keys(fila).filter(k => cab.indexOf(k) === -1);
    if (nuevas.length) {
      h.getRange(1, cab.length + 1, 1, nuevas.length).setValues([nuevas]).setFontWeight("bold");
      cab = cab.concat(nuevas);
    }
    h.appendRow(cab.map(k => (fila[k] === undefined || fila[k] === null) ? "" : fila[k]));
    actualizarDatos_();
    SpreadsheetApp.flush();
    return json_({ ok: true });
  } catch (err) {
    return json_({ error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* ---------- Pestaña «Datos»: une Pre y Post por sesión + código ----------
   Si alguien envió dos veces, se usa su último envío. */
function actualizarDatos_() {
  const ultimo = (filas) => { const m = {}; filas.forEach(f => { m[f.sesion + "|" + f.codigo] = f; }); return m; };
  const pre = ultimo(leer_("Pre")), post = ultimo(leer_("Post"));
  const claves = Object.keys(pre).concat(Object.keys(post).filter(k => !(k in pre)));
  const filas = claves.map(k => {
    const a = pre[k] || {}, b = post[k] || {};
    const vPre = a.aciertos_pre === "" || a.aciertos_pre === undefined ? "" : Number(a.aciertos_pre);
    const vPost = b.aciertos_post === "" || b.aciertos_post === undefined ? "" : Number(b.aciertos_post);
    return [a.sesion || b.sesion, a.codigo || b.codigo, a.sexo || "", a.lado || "", a.zona || "", a.fila_global || "",
      a.grupo_asignado || "", b.grupo_declarado || "",
      (a.grupo_asignado && b.grupo_declarado) ? (a.grupo_asignado === b.grupo_declarado ? 1 : 0) : "",
      b.hablo_otro_grupo || "", vPre, vPost, (vPre !== "" && vPost !== "") ? vPost - vPre : "",
      k in pre ? 1 : 0, k in post ? 1 : 0];
  });
  const h = hoja_("Datos");
  h.clear();   // borra valores y formato (incluida la fila de ejemplo de la plantilla)
  h.getRange(1, 1, 1, COLS_DATOS.length).setValues([COLS_DATOS]).setFontWeight("bold").setFontColor("#FFFFFF").setBackground("#0047E8");
  h.setFrozenRows(1);
  if (filas.length) h.getRange(2, 1, filas.length, COLS_DATOS.length).setValues(filas);
}

/* ---------- Utilidades ---------- */
function cabecera_(h, base) {
  if (h.getLastRow() === 0 || h.getRange(1, 1).getValue() === "") {
    h.getRange(1, 1, 1, base.length).setValues([base]).setFontWeight("bold");
    h.setFrozenRows(1);
    return base.slice();
  }
  return h.getRange(1, 1, 1, h.getLastColumn()).getValues()[0];
}

function existeId_(nombre, id) {
  if (!id) return false;
  const h = hoja_(nombre);
  if (h.getLastRow() < 2) return false;
  return !!h.getRange(2, 1, h.getLastRow() - 1, 1).createTextFinder(id).matchEntireCell(true).findNext();
}

function leer_(nombre, sesion) {
  const h = hoja_(nombre);
  if (h.getLastRow() < 2) return [];
  const v = h.getRange(1, 1, h.getLastRow(), h.getLastColumn()).getValues();
  const cab = v[0];
  return v.slice(1).map(r => { const o = {}; cab.forEach((k, i) => o[k] = r[i]); return o; })
          .filter(o => !sesion || String(o.sesion) === sesion);
}

function hoja_(nombre) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(nombre) || ss.insertSheet(nombre);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* Ejecutar UNA vez desde el editor para crear las pestañas y autorizar permisos. */
function preparar() {
  ["Pre", "Post"].forEach(n => {
    const h = hoja_(n);
    if (h.getLastRow() === 0) {
      h.getRange(1, 1, 1, COLUMNAS[n].length).setValues([COLUMNAS[n]])
       .setFontWeight("bold").setFontColor("#FFFFFF").setBackground("#0047E8");
      h.setFrozenRows(1);
    }
  });
  actualizarDatos_();
  const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Hoja 1") || SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
  if (s && s.getLastRow() === 0 && SpreadsheetApp.getActiveSpreadsheet().getSheets().length > 1) SpreadsheetApp.getActiveSpreadsheet().deleteSheet(s);
  SpreadsheetApp.getActiveSpreadsheet().toast("Hoja preparada. Ahora: Implementar > Nueva implementación > Aplicación web.");
}

/* Tras probar la web, borra las filas de prueba (deja las cabeceras).
   Ejecútala a mano desde el editor ANTES de la clase. */
function borrarDatosDePrueba() {
  ["Pre", "Post"].forEach(n => { const h = hoja_(n); if (h.getLastRow() > 1) h.deleteRows(2, h.getLastRow() - 1); });
  actualizarDatos_();
  SpreadsheetApp.getActiveSpreadsheet().toast("Filas de prueba borradas.");
}
