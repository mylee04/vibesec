import type { UiCopy } from "./en.js"

export const jaCopy = {
  language: "言語",
  scanner: {
    eyebrow: "VibeSec 公開前チェック",
    title: "AIアプリはすぐ作れる。公開前にチェック。",
    subtitle: "URLを貼るだけで、公開前のリスクを1分以内に確認できます。",
    urlLabel: "WebサイトURL",
    placeholder: "your-app.com または https://your-app.vercel.app",
    runScan: "無料でチェック",
    scanning: "スキャン中",
  },
  nav: {
    scan: "スキャン",
    community: "コミュニティ",
  },
  home: {
    eyebrow: "VibeSec サービス掲示板",
    title: "あなたのサービスを紹介",
    pitch: "アプリを検査して、コミュニティで紹介できます。",
    submitCta: "アプリを投稿",
    viewAll: "コミュニティを見る",
    beta: "公開ベータコミュニティ",
  },
  showcase: {
    title: "サービス掲示板",
    scanYourApp: "自分のアプリを検査",
    loading: "掲示板を読み込み中。",
    noPublic: "紹介されたサービスはまだありません。",
    back: "掲示板に戻る",
    loadingReport: "公開ページを読み込み中。",
    notFound: "投稿が見つかりません。",
    publicReport: "詳細を見る",
    visitApp: "サービスを見る",
    hot: "話題順",
    latest: "最新順",
    popular: "人気順",
    upvote: "おすすめ",
    upvotes: "おすすめ",
    comments: "コメント",
    commentName: "名前",
    commentBody: "コメントを書く",
    commentSubmit: "コメント",
    commenting: "投稿中",
    noComments: "まだコメントはありません。",
    voteError: "おすすめに失敗しました。",
    commentError: "コメントを投稿できませんでした。",
    scannedBy: "VibeSecで検査済み",
    scoreLine: (score: number, risk: string, date: string) =>
      `スコア ${score}/100、${risk}、最終スキャン ${date}`,
    vibesecTagline: "AI Webアプリ向けの公開前セキュリティチェックツール。",
    securityCategory: "セキュリティ",
  },
  report: {
    securityScore: "セキュリティスコア",
    risk: { Low: "低リスク", Medium: "中リスク", High: "高リスク" },
    noBlocking: "公開を妨げる検出事項はありません",
    summary: (issues: number, groups: number) => `${groups}グループで${issues}件の検出`,
    target: "対象",
    scanned: "スキャン日時",
    detected: "検出",
    noFingerprint: "プロバイダーの痕跡は検出されませんでした",
    findings: "検出事項",
    counts: {
      dangerous: "危険",
      needsAttention: "要確認",
      niceToFix: "改善推奨",
    },
    severity: {
      Dangerous: "危険",
      "Needs attention": "要確認",
      "Nice to fix": "改善推奨",
      Passed: "合格",
    },
    noGroupFindings: "このグループに検出事項はありません。",
    checklistTitle: "公開前チェックリスト",
    checklist: [
      "非公開の環境変数を隠す",
      "admin と debug ルートを保護する",
      "意図していない公開 sourcemap を無効化する",
      "Supabase RLS または同等のデータアクセス制御を有効化する",
      "AI、auth、upload、webhook エンドポイントに rate limit を適用する",
    ],
    fixesTitle: "コピーして使える修正",
    copied: "コピー済み",
    copy: "コピー",
    issueCopy: {
      "cookie-missing-secure": {
        title: "Cookie に Secure がありません",
        evidence: "Set-Cookie ヘッダーに Secure がありません",
        recommendation: "公開前にセッション/認証 Cookie に Secure を設定してください。",
      },
      "cookie-missing-httponly": {
        title: "Cookie に HttpOnly がありません",
        evidence: "Set-Cookie ヘッダーに HttpOnly がありません",
        recommendation: "JavaScript アクセスが不要な Cookie には HttpOnly を設定してください。",
      },
      "cookie-missing-samesite": {
        title: "Cookie に SameSite がありません",
        evidence: "Set-Cookie ヘッダーに SameSite がありません",
        recommendation: "セッション Cookie には SameSite=Lax または Strict を設定してください。",
      },
      "missing-csp": {
        title: "Content-Security-Policy がありません",
        evidence: "Content-Security-Policy ヘッダーがありません",
        recommendation: "公開前に CSP ヘッダーを追加してください。",
      },
      "missing-hsts": {
        title: "HSTS がありません",
        evidence: "Strict-Transport-Security ヘッダーがありません",
        recommendation: "全サブドメインの HTTPS を確認してから HSTS を追加してください。",
      },
      "wildcard-cors": {
        title: "CORS がすべての origin を許可",
        evidence: "Access-Control-Allow-Origin: *",
        recommendation: "ワイルドカード CORS を本番 origin の allowlist に変更してください。",
      },
      "missing-frame-policy": {
        title: "フレーム保護がありません",
        evidence: "X-Frame-Options または CSP frame-ancestors が検出されません",
        recommendation:
          "機密ページには CSP frame-ancestors または X-Frame-Options を設定してください。",
      },
      "missing-referrer-policy": {
        title: "Referrer-Policy がありません",
        evidence: "Referrer-Policy ヘッダーがありません",
        recommendation:
          "Referrer-Policy を strict-origin-when-cross-origin 以上に設定してください。",
      },
      "missing-permissions-policy": {
        title: "Permissions-Policy がありません",
        evidence: "Permissions-Policy ヘッダーがありません",
        recommendation: "不要なブラウザ機能を Permissions-Policy で無効化してください。",
      },
      "public-env": {
        title: "公開 .env ファイルにアクセス可能",
        evidence: "機密ファイルが HTTP レスポンスを返しました",
        recommendation:
          "公開ホスティングから削除し、漏えいした secret をすぐにローテーションしてください。",
      },
      "public-git-config": {
        title: "公開 .git/config にアクセス可能",
        evidence: "リポジトリ設定が HTTP レスポンスを返しました",
        recommendation:
          "edge で dotfile をブロックし、リポジトリディレクトリなしで再デプロイしてください。",
      },
      "public-sourcemap": {
        title: "公開 source map にアクセス可能",
        evidence: "source map が HTTP レスポンスを返しました",
        recommendation:
          "本番 source map の公開を無効化するか、エラートラッカーのみにアップロードしてください。",
      },
      "robots-sensitive-routes": {
        title: "robots.txt が機密ルートを公開",
        evidence: "robots.txt が HTTP レスポンスを返しました",
        recommendation: "admin、debug、dev、staging ルートを robots.txt に載せないでください。",
      },
      "sitemap-sensitive-routes": {
        title: "sitemap.xml が機密ルートを公開",
        evidence: "sitemap.xml が HTTP レスポンスを返しました",
        recommendation: "非公開/運用ルートは public sitemap から外してください。",
      },
      "provider-hints": {
        title: "Cloud/AI プロバイダーの痕跡が公開されています",
        evidence: "公開レスポンスでプロバイダーの痕跡を検出しました",
        recommendation: "検出された各サービスが最小権限になっているか確認してください。",
      },
    },
    providerEvidence: (providers: string) => `公開レスポンスで ${providers} を検出`,
    exposureEvidence: (path: string, status: string) => `${path} が HTTP ${status} を返しました`,
    fixNotes: {
      next: "このコードを出発点にして、実際のアプリに合わせて CSP ドメインを調整してください。",
      supabaseDetected:
        "Supabase の痕跡を検出しました。anon key は通常でも、RLS は必ず有効にしてください。",
      supabaseDefault: "ブラウザから Supabase に接続するアプリで確認してください。",
      firebase:
        "Firebase config は公開されてもよい場合がありますが、Database/Storage ルールは開けないでください。",
      aiApi: "chat、generate、upload、webhook ルートを過剰利用から保護してください。",
    },
  },
  publish: {
    title: "VibeSec コミュニティに投稿",
    appName: "アプリ名",
    tagline: "一行紹介",
    category: "カテゴリ",
    stack: "スタック: Vercel, Supabase, OpenAI",
    publishing: "公開中",
    publish: "公開",
    viewPublicPage: "公開ページを見る",
    defaultCategory: "AIツール",
  },
  dateLocale: "ja-JP",
} satisfies UiCopy
