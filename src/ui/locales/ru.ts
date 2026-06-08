import type { UiCopy } from "./en.js"

export const ruCopy = {
  language: "Язык",
  scanner: {
    eyebrow: "Проверка запуска VibeSec",
    title: "Скан. Оценка. Реклама.",
    subtitle: "Проверьте риски и получите оценку для публикации.",
    urlLabel: "URL сайта",
    placeholder: "your-app.com или https://your-app.vercel.app",
    runScan: "Получить оценку",
    scanning: "Сканирование",
  },
  home: {
    eyebrow: "Рекламная доска VibeSec",
    title: "Рекламируйте сервис здесь",
    pitch: "Проверьте приложение и бесплатно добавьте его на рекламную доску.",
    submitCta: "Рекламировать бесплатно",
    viewAll: "Смотреть доску",
    beta: "Бесплатная бета-реклама",
  },
  showcase: {
    title: "Рекламируйте приложение на VibeSec",
    scanYourApp: "Проверить приложение",
    loading: "Загрузка рекламной доски.",
    noPublic: "Рекламируемых приложений пока нет.",
    back: "Назад к рекламной доске",
    loadingReport: "Загрузка публичного отчета.",
    notFound: "Публичный отчет не найден.",
    publicReport: "Публичный отчет",
    visitApp: "Открыть приложение",
    scannedBy: "Проверено VibeSec",
    scoreLine: (score: number, risk: string, date: string) =>
      `Оценка ${score}/100, риск: ${risk}, последняя проверка ${date}`,
    vibesecTagline: "Проверка безопасности перед запуском AI-веб-приложений.",
    securityCategory: "Безопасность",
  },
  report: {
    securityScore: "Оценка безопасности",
    risk: { Low: "Низкий риск", Medium: "Средний риск", High: "Высокий риск" },
    noBlocking: "Критичных препятствий для запуска нет",
    summary: (issues: number, groups: number) =>
      `${issues} находок в ${groups} приоритетных группах`,
    target: "Цель",
    scanned: "Проверено",
    detected: "Обнаружено",
    noFingerprint: "Следы провайдеров не найдены",
    findings: "Находки",
    counts: {
      dangerous: "опасных",
      needsAttention: "требуют внимания",
      niceToFix: "желательно исправить",
    },
    severity: {
      Dangerous: "Опасно",
      "Needs attention": "Требует внимания",
      "Nice to fix": "Желательно исправить",
      Passed: "Пройдено",
    },
    noGroupFindings: "В этой группе находок нет.",
    checklistTitle: "Чеклист запуска",
    checklist: [
      "Скрыть приватные переменные окружения",
      "Защитить admin и debug маршруты",
      "Отключить публичные sourcemap, если они не нужны",
      "Включить Supabase RLS или аналогичный контроль доступа",
      "Добавить rate limit для AI, auth, upload и webhook endpoint",
    ],
    fixesTitle: "Готовые исправления",
    copied: "Скопировано",
    copy: "Копировать",
    issueCopy: {
      "cookie-missing-secure": {
        title: "Cookie без Secure",
        evidence: "В заголовке Set-Cookie нет Secure",
        recommendation: "Перед запуском включите Secure для session и auth cookie.",
      },
      "cookie-missing-httponly": {
        title: "Cookie без HttpOnly",
        evidence: "В заголовке Set-Cookie нет HttpOnly",
        recommendation: "Включите HttpOnly для cookie, которым не нужен доступ из JavaScript.",
      },
      "cookie-missing-samesite": {
        title: "Cookie без SameSite",
        evidence: "В заголовке Set-Cookie нет SameSite",
        recommendation: "Для session cookie используйте SameSite=Lax или SameSite=Strict.",
      },
      "missing-csp": {
        title: "Нет Content-Security-Policy",
        evidence: "Нет заголовка Content-Security-Policy",
        recommendation: "Добавьте CSP перед публичным запуском.",
      },
      "missing-hsts": {
        title: "Нет HSTS",
        evidence: "Нет заголовка Strict-Transport-Security",
        recommendation: "Добавьте HSTS после проверки HTTPS на всех subdomain.",
      },
      "wildcard-cors": {
        title: "CORS разрешает любой origin",
        evidence: "Access-Control-Allow-Origin: *",
        recommendation: "Замените wildcard CORS на небольшой allowlist production origin.",
      },
      "missing-frame-policy": {
        title: "Нет защиты от frame",
        evidence: "Не найден X-Frame-Options или CSP frame-ancestors",
        recommendation:
          "Настройте CSP frame-ancestors или X-Frame-Options для чувствительных страниц.",
      },
      "missing-referrer-policy": {
        title: "Нет Referrer-Policy",
        evidence: "Нет заголовка Referrer-Policy",
        recommendation: "Установите Referrer-Policy на strict-origin-when-cross-origin или строже.",
      },
      "missing-permissions-policy": {
        title: "Нет Permissions-Policy",
        evidence: "Нет заголовка Permissions-Policy",
        recommendation: "Отключите неиспользуемые возможности браузера через Permissions-Policy.",
      },
      "public-env": {
        title: "Публичный .env доступен",
        evidence: "Чувствительный файл вернул HTTP-ответ",
        recommendation: "Удалите файл из публичного хостинга и сразу замените раскрытые secrets.",
      },
      "public-git-config": {
        title: "Публичный .git/config доступен",
        evidence: "Конфиг репозитория вернул HTTP-ответ",
        recommendation: "Заблокируйте dotfiles на edge и redeploy без директории репозитория.",
      },
      "public-sourcemap": {
        title: "Публичный source map доступен",
        evidence: "Source map вернул HTTP-ответ",
        recommendation:
          "Отключите публичные production source maps или загружайте их только в error tracker.",
      },
      "robots-sensitive-routes": {
        title: "robots.txt раскрывает чувствительные routes",
        evidence: "robots.txt вернул HTTP-ответ",
        recommendation: "Не публикуйте admin, debug, dev или staging routes в robots.txt.",
      },
      "sitemap-sensitive-routes": {
        title: "sitemap.xml раскрывает чувствительные routes",
        evidence: "sitemap.xml вернул HTTP-ответ",
        recommendation: "Уберите приватные и операционные routes из public sitemap.",
      },
      "provider-hints": {
        title: "Видны следы Cloud/AI провайдеров",
        evidence: "В публичных ответах найдены следы провайдеров",
        recommendation: "Проверьте, что у каждого найденного сервиса минимальные права.",
      },
    },
    providerEvidence: (providers: string) => `В публичных ответах найдено: ${providers}`,
    exposureEvidence: (path: string, status: string) => `${path} вернул HTTP ${status}`,
    fixNotes: {
      next: "Используйте как стартовую точку, затем настройте CSP domains под реальное приложение.",
      supabaseDetected:
        "Обнаружен Supabase. Anon key может быть нормой, но RLS должен быть включен.",
      supabaseDefault: "Используйте это, если приложение подключается к Supabase из браузера.",
      firebase:
        "Firebase config может быть публичным, но Database и Storage rules не должны быть открыты.",
      aiApi: "Защитите chat, generate, upload и webhook routes от неконтролируемого расхода.",
    },
  },
  publish: {
    title: "Добавить на рекламную доску VibeSec",
    appName: "Название приложения",
    tagline: "Короткое описание",
    category: "Категория",
    stack: "Стек: Vercel, Supabase, OpenAI",
    publishing: "Публикация",
    publish: "Опубликовать",
    viewPublicPage: "Открыть публичную страницу",
    defaultCategory: "AI-инструменты",
  },
  dateLocale: "ru-RU",
} satisfies UiCopy
