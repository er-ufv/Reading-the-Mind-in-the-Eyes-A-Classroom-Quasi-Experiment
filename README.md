# Cuasiexperimento «Lectura de la mirada» (Tema 8)

Pretest-postest con grupo de cuasi control. La asignación **no es aleatoria**: depende del lado del aula en el que cada estudiante se ha sentado (izquierda → grupo A, entrenamiento; derecha → grupo B, control).

Todo ocurre en una sola aula y en este orden: parte 1 (todos) → A sale y espera fuera → control con B + parte 2 de B → B sale y entra A → entrenamiento con A + parte 2 de A → vuelve B y se ven los resultados. Las tres personas guía dirigen las dos actividades (instructivo de lectura fácil en `../instructivo_guias.pdf`).

| Archivo | Para qué |
|---|---|
| `fase1.html` | Bienvenida, explicación, consentimiento, código (p. ej. ER16), RMET forma A (18 ítems, sin retroalimentación), mapa del aula (5 filas a cada lado) y asignación de grupo |
| `fase2.html` | Código + grupo declarado, RMET forma B (18 ítems), pregunta de contaminación |
| `resultados.html` | Solo para el profesor (pide clave). Gráficos y tablas para el debriefing, y modo con datos simulados para ensayar |
| `index.html` | Portada con enlaces a las dos partes |
| `apps-script/Code.gs` | Guarda los datos en una hoja de Google (pestañas Pre, Post y Datos) |
| `js/config.js` | Lo único que hay que editar: URL de la hoja, sesión, regla de asignación y textos |

Formas paralelas: A = ítems 1, 4, 5, 8, 9, 12, 13, 16, 17, 20, 21, 24, 25, 28, 29, 32, 33 y 36; B = el resto (reparto ABBA por posición). Las dos condiciones hacen A antes y B después, así que una posible diferencia de dificultad entre formas afecta igual a ambos grupos.

## Puesta en marcha (unos 15 minutos, una sola vez)

1. **Hoja de datos.** Crea una hoja de Google vacía (p. ej. «CuasiIE_datos»). Extensiones › Apps Script › pega `apps-script/Code.gs`. Cambia `CLAVE_RESULTADOS`. Ejecuta `preparar` y autoriza.
2. **Publicar el servicio.** Implementar › Nueva implementación › Aplicación web · Ejecutar como: *Yo* · Acceso: *Cualquier usuario*. Copia la URL que termina en `/exec`.
3. **Configurar.** Pega esa URL en `js/config.js` → `ENDPOINT`. Si quieres, rellena `CONTACTO` (aparece en el consentimiento).
4. **Publicar la web.** Igual que el experimento factorial: un repositorio nuevo en GitHub (p. ej. `er-ufv/cuasi-mirada`), sube el contenido de esta carpeta y activa GitHub Pages (Settings › Pages › rama `main`, carpeta raíz).
5. **QR.** Genera un QR para `…/fase1.html` y otro para `…/fase2.html`. Proyecta el de la parte 2 al terminar cada actividad (primero para B, después para A).

## Antes de la clase

- Haz una prueba completa con dos móviles (uno a la izquierda y otro a la derecha) y mira la hoja: deben aparecer filas en *Pre*, *Post* y *Datos*.
- En Apps Script, ejecuta `borrarDatosDePrueba` para dejar la hoja limpia.
- Abre `resultados.html`, prueba la clave y ensaya con **Ver con datos simulados**.
- Las tres personas guía no hacen la prueba (conocen el material).

## Notas

- Sin `ENDPOINT` la web funciona en **modo prueba** (aviso naranja; nada se envía).
- Si un móvil pierde la conexión, las respuestas quedan en cola y se reenvían solas; el estudiante ve «Respuestas guardadas ✓» cuando llegan. Un reenvío nunca duplica filas.
- Si alguien envía dos veces con el mismo código, en *Datos* y en resultados se usa su último envío.
- `grupo_declarado` (fase 2) frente a `grupo_asignado` (fase 1) y `hablo_otro_grupo` permiten comentar la fidelidad y la contaminación.
- Para otro curso o grupo, cambia `SESION` en `config.js`.
- Ítems: Baron-Cohen et al. (2001), adaptación española de Huerta-Ramos et al. (2021).
