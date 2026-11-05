/* =====================================================================
   CONFIGURACIÓN — es el único archivo que hay que tocar.
   ===================================================================== */
window.CONFIG = {
  // 1. URL de la aplicación web de Google Apps Script (termina en /exec).
  //    Vacío = MODO PRUEBA: nada se envía; los datos se guardan solo en este navegador.
  ENDPOINT: "",

  // 2. Identificador de la sesión (cambiarlo cada curso o cada grupo de clase).
  SESION: "MDI-2026-cuasi-IE",

  // 3. Regla de asignación por zona del aula (mirando hacia la pizarra).
  GRUPO_IZQUIERDA: "A",
  GRUPO_DERECHA: "B",

  // 4. Secuencia en una sola aula: B se queda primero (actividad + parte 2) y sale;
  //    después entra A (actividad + parte 2). Qué se le dice a cada grupo:
  INSTRUCCIONES_GRUPO: {
    A: { sale: true,  texto: "Sal del aula con tu móvil y espera fuera, cerca de la puerta, hasta que te avisen para volver a entrar (unos 20 minutos). Mientras esperas, no comentes las fotografías con nadie." },
    B: { sale: false, texto: "Quédate en tu sitio. Las personas guía te explicarán ahora la siguiente actividad." }
  },
  // Mensaje al terminar la parte 2, según el grupo que declara cada estudiante.
  FINAL_PARTE2: {
    A: "Quédate en tu sitio y sin comentar las fotografías. Cuando vuelva el grupo B veremos juntos los resultados de toda la clase.",
    B: "Sal del aula en silencio y espera fuera hasta que te avisen para volver. No comentes nada con el grupo A: todavía les falta su parte."
  },

  // 5. Etiquetas que SOLO se ven en la página de resultados (debriefing).
  ETIQUETAS: { A: "Grupo A · izquierda · entrenamiento", B: "Grupo B · derecha · control" },

  // 6. Cabecera y responsable (aparece en el consentimiento).
  ASIGNATURA: "Métodos y Diseños de Investigación",
  ACTIVIDAD: "Actividad en clase · Lectura de la mirada",
  RESPONSABLE: "el profesor de la asignatura",
  CONTACTO: ""   // p. ej. "nombre.apellido@esic.university" (vacío = no se muestra)
};
