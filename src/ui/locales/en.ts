export const enCopy = {
  language: "Language",
  scanner: {
    eyebrow: "VibeSec launch checker",
    title: "Scan. Score. Showcase.",
    subtitle: "Check launch risks and earn a shareable score.",
    urlLabel: "Website URL",
    placeholder: "https://your-app.vercel.app",
    runScan: "Get score",
    scanning: "Scanning",
  },
  home: {
    eyebrow: "VibeSec Showcase",
    title: "Want your app here?",
    pitch: "Submit your app. Want the first spot? Get featured.",
    submitCta: "Submit app",
    featureCta: "Get featured",
    viewAll: "View all",
    beta: "Public beta launch",
  },
  showcase: {
    title: "Want your app here? Get featured.",
    scanYourApp: "Scan your app",
    loading: "Loading showcase.",
    noPublic: "No public launches yet.",
    back: "Back to Showcase",
    loadingReport: "Loading public report.",
    notFound: "Public report not found.",
    publicReport: "Public report",
    visitApp: "Visit app",
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
  },
  publish: {
    title: "Add to VibeSec Showcase",
    appName: "App name",
    tagline: "One-line pitch",
    category: "Category",
    stack: "Stack: Vercel, Supabase, OpenAI",
    accessCode: "Showcase access code",
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
