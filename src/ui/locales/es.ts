import type { UiCopy } from "./en.js"

export const esCopy = {
  language: "Idioma",
  scanner: {
    eyebrow: "Verificador de lanzamiento VibeSec",
    title: "Escanea. Puntúa. Promociona.",
    subtitle: "Revisa riesgos y consigue un score para compartir.",
    urlLabel: "URL del sitio",
    placeholder: "your-app.com o https://your-app.vercel.app",
    runScan: "Obtener score",
    scanning: "Escaneando",
  },
  home: {
    eyebrow: "Showcase de VibeSec",
    title: "Quieres tu app aquí?",
    pitch: "Envía tu app. Quieres el primer lugar? Destácala.",
    submitCta: "Enviar app",
    featureCta: "Destacar",
    viewAll: "Ver todo",
    beta: "Beta pública",
  },
  showcase: {
    title: "Quieres tu app aquí? Destácala.",
    scanYourApp: "Escanear mi app",
    loading: "Cargando showcase.",
    noPublic: "Aún no hay lanzamientos públicos.",
    back: "Volver al Showcase",
    loadingReport: "Cargando reporte público.",
    notFound: "Reporte público no encontrado.",
    publicReport: "Reporte público",
    visitApp: "Visitar app",
    scannedBy: "Escaneado por VibeSec",
    scoreLine: (score: number, risk: string, date: string) =>
      `Puntuación ${score}/100, ${risk}, último escaneo ${date}`,
    vibesecTagline: "Verificador de seguridad de lanzamiento para apps web con AI.",
    securityCategory: "Seguridad",
  },
  report: {
    securityScore: "Puntuación de seguridad",
    risk: { Low: "Riesgo bajo", Medium: "Riesgo medio", High: "Riesgo alto" },
    noBlocking: "No hay hallazgos que bloqueen el lanzamiento",
    summary: (issues: number, groups: number) =>
      `${issues} hallazgos en ${groups} grupos prioritarios`,
    target: "Objetivo",
    scanned: "Escaneado",
    detected: "Detectado",
    noFingerprint: "No se detectaron proveedores",
    findings: "Hallazgos",
    counts: {
      dangerous: "peligrosos",
      needsAttention: "requieren atención",
      niceToFix: "conviene arreglar",
    },
    severity: {
      Dangerous: "Peligroso",
      "Needs attention": "Requiere atención",
      "Nice to fix": "Conviene arreglar",
      Passed: "Aprobado",
    },
    noGroupFindings: "No hay hallazgos en este grupo.",
    checklistTitle: "Checklist de lanzamiento",
    checklist: [
      "Ocultar variables de entorno privadas",
      "Proteger rutas admin y debug",
      "Desactivar sourcemaps públicos salvo que sean intencionales",
      "Activar Supabase RLS o controles equivalentes de acceso a datos",
      "Aplicar rate limit a endpoints de AI, auth, upload y webhook",
    ],
    fixesTitle: "Arreglos para copiar y pegar",
    copied: "Copiado",
    copy: "Copiar",
    issueCopy: {
      "cookie-missing-secure": {
        title: "La cookie no tiene Secure",
        evidence: "Falta Secure en el header Set-Cookie",
        recommendation: "Activa Secure en cookies de sesión y auth antes del lanzamiento.",
      },
      "cookie-missing-httponly": {
        title: "La cookie no tiene HttpOnly",
        evidence: "Falta HttpOnly en el header Set-Cookie",
        recommendation: "Usa HttpOnly en cookies que no necesiten acceso desde JavaScript.",
      },
      "cookie-missing-samesite": {
        title: "La cookie no tiene SameSite",
        evidence: "Falta SameSite en el header Set-Cookie",
        recommendation: "Usa SameSite=Lax o SameSite=Strict en cookies de sesión.",
      },
      "missing-csp": {
        title: "Falta Content-Security-Policy",
        evidence: "Falta el header Content-Security-Policy",
        recommendation: "Añade un header CSP antes del lanzamiento público.",
      },
      "missing-hsts": {
        title: "Falta HSTS",
        evidence: "Falta el header Strict-Transport-Security",
        recommendation: "Añade HSTS después de confirmar HTTPS en todos los subdominios.",
      },
      "wildcard-cors": {
        title: "CORS permite cualquier origin",
        evidence: "Access-Control-Allow-Origin: *",
        recommendation:
          "Cambia el wildcard CORS por una allowlist pequeña de origins de producción.",
      },
      "missing-frame-policy": {
        title: "Falta protección contra frames",
        evidence: "No se detectó X-Frame-Options ni CSP frame-ancestors",
        recommendation: "Configura CSP frame-ancestors o X-Frame-Options en páginas sensibles.",
      },
      "missing-referrer-policy": {
        title: "Falta Referrer-Policy",
        evidence: "Falta el header Referrer-Policy",
        recommendation:
          "Configura Referrer-Policy como strict-origin-when-cross-origin o más estricto.",
      },
      "missing-permissions-policy": {
        title: "Falta Permissions-Policy",
        evidence: "Falta el header Permissions-Policy",
        recommendation: "Desactiva capacidades del navegador que no uses con Permissions-Policy.",
      },
      "public-env": {
        title: "Archivo .env público accesible",
        evidence: "Un archivo sensible devolvió respuesta HTTP",
        recommendation: "Elimina el archivo del hosting público y rota los secretos expuestos.",
      },
      "public-git-config": {
        title: ".git/config público accesible",
        evidence: "La configuración del repositorio devolvió respuesta HTTP",
        recommendation:
          "Bloquea dotfiles en el edge y redespliega sin el directorio del repositorio.",
      },
      "public-sourcemap": {
        title: "Source map público accesible",
        evidence: "El source map devolvió respuesta HTTP",
        recommendation:
          "Desactiva source maps públicos o súbelos solo a tu herramienta de errores.",
      },
      "robots-sensitive-routes": {
        title: "robots.txt revela rutas sensibles",
        evidence: "robots.txt devolvió respuesta HTTP",
        recommendation: "No publiques rutas admin, debug, dev o staging en robots.txt.",
      },
      "sitemap-sensitive-routes": {
        title: "sitemap.xml revela rutas sensibles",
        evidence: "sitemap.xml devolvió respuesta HTTP",
        recommendation: "Mantén rutas privadas y operativas fuera del sitemap público.",
      },
      "provider-hints": {
        title: "Huellas de proveedores Cloud/AI visibles",
        evidence: "Se detectaron huellas de proveedores en respuestas públicas",
        recommendation: "Verifica que cada servicio detectado tenga permisos mínimos.",
      },
    },
    providerEvidence: (providers: string) => `Se detectó ${providers} en respuestas públicas`,
    exposureEvidence: (path: string, status: string) => `${path} devolvió HTTP ${status}`,
    fixNotes: {
      next: "Úsalo como punto de partida y ajusta los dominios CSP de tu app real.",
      supabaseDetected:
        "Se detectó Supabase. La anon key puede ser normal, pero RLS debe estar activo.",
      supabaseDefault: "Úsalo cuando tu app se conecte a Supabase desde el navegador.",
      firebase:
        "La config de Firebase puede ser pública, pero Database y Storage no deben estar abiertos.",
      aiApi: "Protege rutas chat, generate, upload y webhook contra uso descontrolado.",
    },
  },
  publish: {
    title: "Añadir al Showcase de VibeSec",
    appName: "Nombre de la app",
    tagline: "Pitch de una línea",
    category: "Categoría",
    stack: "Stack: Vercel, Supabase, OpenAI",
    publishing: "Publicando",
    publish: "Publicar",
    viewPublicPage: "Ver página pública",
    defaultCategory: "Herramientas AI",
  },
  dateLocale: "es",
} satisfies UiCopy
