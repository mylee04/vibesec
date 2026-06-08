export const enCopy = {
  language: "Language",
  scanner: {
    eyebrow: "VibeSec launch checker",
    title: "Scan. Score. Launch.",
    subtitle: "Check launch risks and earn a shareable score.",
    urlLabel: "Website URL",
    placeholder: "your-app.com or https://your-app.vercel.app",
    runScan: "Get score",
    scanning: "Scanning",
  },
  home: {
    eyebrow: "VibeSec Launch Board",
    title: "Introduce your app",
    pitch: "Scan your app and share what you built on the Launch Board.",
    submitCta: "Submit your app",
    viewAll: "Launch Board",
    beta: "Public beta launch board",
  },
  showcase: {
    title: "Launch Board",
    scanYourApp: "Scan your app",
    loading: "Loading Launch Board.",
    noPublic: "No launches yet.",
    back: "Back to Launch Board",
    loadingReport: "Loading public report.",
    notFound: "Public report not found.",
    publicReport: "Public report",
    visitApp: "Visit app",
    latest: "Latest",
    popular: "Popular",
    upvote: "Upvote",
    upvotes: "Upvotes",
    comments: "Comments",
    commentName: "Your name",
    commentBody: "Add a comment",
    commentSubmit: "Comment",
    commenting: "Posting",
    noComments: "No comments yet.",
    voteError: "Could not upvote this launch.",
    commentError: "Could not post this comment.",
    scannedBy: "Scanned by VibeSec",
    scoreLine: (score: number, risk: string, date: string) =>
      `Score ${score}/100, ${risk}, last scanned ${date}`,
    vibesecTagline: "Launch security checker for AI-built web apps.",
    securityCategory: "Security",
  },
  report: {
    securityScore: "Security Score",
    risk: { Low: "Low Risk", Medium: "Medium Risk", High: "High Risk" },
    noBlocking: "No launch-blocking findings",
    summary: (issues: number, groups: number) =>
      `${issues} findings across ${groups} priority groups`,
    target: "Target",
    scanned: "Scanned",
    detected: "Detected",
    noFingerprint: "No provider fingerprint",
    findings: "Findings",
    counts: {
      dangerous: "dangerous",
      needsAttention: "needs attention",
      niceToFix: "nice to fix",
    },
    severity: {
      Dangerous: "Dangerous",
      "Needs attention": "Needs attention",
      "Nice to fix": "Nice to fix",
      Passed: "Passed",
    },
    noGroupFindings: "No findings in this group.",
    checklistTitle: "Launch Checklist",
    checklist: [
      "Hide private environment variables",
      "Protect admin and debug routes",
      "Disable public source maps unless intentionally published",
      "Enable Supabase RLS or equivalent data access controls",
      "Rate limit AI, auth, upload, and webhook endpoints",
    ],
    fixesTitle: "Copy-paste Fixes",
    copied: "Copied",
    copy: "Copy",
    issueCopy: {
      "cookie-missing-secure": {
        title: "Cookie lacks Secure",
        evidence: "Set-Cookie header lacks Secure",
        recommendation: "Set Secure on session and auth cookies before launch.",
      },
      "cookie-missing-httponly": {
        title: "Cookie lacks HttpOnly",
        evidence: "Set-Cookie header lacks HttpOnly",
        recommendation: "Set HttpOnly on cookies that do not need browser JavaScript access.",
      },
      "cookie-missing-samesite": {
        title: "Cookie lacks SameSite",
        evidence: "Set-Cookie header lacks SameSite",
        recommendation: "Set SameSite=Lax or SameSite=Strict for session cookies.",
      },
      "missing-csp": {
        title: "Missing Content-Security-Policy",
        evidence: "Content-Security-Policy header missing",
        recommendation: "Add a CSP header before public launch.",
      },
      "missing-hsts": {
        title: "Missing HSTS",
        evidence: "Strict-Transport-Security header missing",
        recommendation: "Add HSTS after confirming every subdomain supports HTTPS.",
      },
      "wildcard-cors": {
        title: "CORS allows every origin",
        evidence: "Access-Control-Allow-Origin: *",
        recommendation: "Replace wildcard CORS with a small allowlist of production origins.",
      },
      "missing-frame-policy": {
        title: "Missing frame protection",
        evidence: "No X-Frame-Options or CSP frame-ancestors detected",
        recommendation: "Set CSP frame-ancestors or X-Frame-Options for sensitive pages.",
      },
      "missing-referrer-policy": {
        title: "Missing Referrer-Policy",
        evidence: "Referrer-Policy header missing",
        recommendation: "Set Referrer-Policy to strict-origin-when-cross-origin or stricter.",
      },
      "missing-permissions-policy": {
        title: "Missing Permissions-Policy",
        evidence: "Permissions-Policy header missing",
        recommendation: "Disable unused browser capabilities with a Permissions-Policy header.",
      },
      "public-env": {
        title: "Public .env file is reachable",
        evidence: "Sensitive file returned HTTP response",
        recommendation:
          "Remove the file from public hosting and rotate exposed secrets immediately.",
      },
      "public-git-config": {
        title: "Public .git/config is reachable",
        evidence: "Repository config returned HTTP response",
        recommendation: "Block dotfiles at the edge and redeploy without the repository directory.",
      },
      "public-sourcemap": {
        title: "Public source map is reachable",
        evidence: "Source map returned HTTP response",
        recommendation:
          "Disable public production source maps or upload them only to your error tracker.",
      },
      "robots-sensitive-routes": {
        title: "robots.txt reveals sensitive routes",
        evidence: "robots.txt returned HTTP response",
        recommendation: "Do not advertise admin, debug, dev, or staging paths in robots.txt.",
      },
      "sitemap-sensitive-routes": {
        title: "sitemap.xml reveals sensitive routes",
        evidence: "sitemap.xml returned HTTP response",
        recommendation: "Keep private and operational routes out of public sitemaps.",
      },
      "provider-hints": {
        title: "Cloud and AI provider fingerprints are visible",
        evidence: "Detected provider fingerprints in public responses",
        recommendation: "Verify each detected service has least-privilege configuration.",
      },
    },
    providerEvidence: (providers: string) => `Detected ${providers} in public responses`,
    exposureEvidence: (path: string, status: string) => `${path} returned HTTP ${status}`,
    fixNotes: {
      next: "Use this as a starting point, then tune CSP domains for your real app.",
      supabaseDetected:
        "Supabase patterns were detected. The anon key is normal, but RLS must be enabled.",
      supabaseDefault: "Use this when your app connects to Supabase from the browser.",
      firebase: "Firebase config can be public, but database and storage rules must not be open.",
      aiApi: "Protect chat, generate, upload, and webhook routes from runaway usage.",
    },
  },
  publish: {
    title: "Submit to VibeSec Launch Board",
    appName: "App name",
    tagline: "One-line pitch",
    category: "Category",
    stack: "Stack: Vercel, Supabase, OpenAI",
    publishing: "Publishing",
    publish: "Publish",
    viewPublicPage: "View public page",
    defaultCategory: "AI Tools",
  },
  dateLocale: "en",
} as const

type WidenCopy<T> = T extends string
  ? string
  : T extends (...args: infer Args) => infer Return
    ? (...args: Args) => Return
    : T extends readonly (infer Item)[]
      ? readonly WidenCopy<Item>[]
      : { readonly [Key in keyof T]: WidenCopy<T[Key]> }

export type UiCopy = WidenCopy<typeof enCopy>
