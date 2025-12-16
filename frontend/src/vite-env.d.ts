/// <reference types="vite/client" />

interface ImportMetaEnv {
  // API Configuration
  readonly VITE_API_URL: string
  readonly VITE_WS_URL: string
  readonly VITE_API_TIMEOUT: string
  readonly VITE_UPLOAD_TIMEOUT: string

  // Application Configuration
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_APP_DESCRIPTION: string
  readonly VITE_ENV: string

  // Authentication
  readonly VITE_AUTH_TOKEN_KEY: string
  readonly VITE_REFRESH_TOKEN_KEY: string
  readonly VITE_SESSION_TIMEOUT: string
  readonly VITE_MAX_LOGIN_ATTEMPTS: string

  // Feature Flags
  readonly VITE_ENABLE_GROUPS: string
  readonly VITE_ENABLE_CONTESTS: string
  readonly VITE_ENABLE_DISCUSSIONS: string
  readonly VITE_ENABLE_LEADERBOARD: string
  readonly VITE_ENABLE_ADMIN_CONSOLE: string
  readonly VITE_ENABLE_SOCIAL_AUTH: string
  readonly VITE_ENABLE_CODE_EXECUTION: string

  // UI Configuration
  readonly VITE_DEFAULT_THEME: string
  readonly VITE_STORAGE_PREFIX: string
  readonly VITE_DEFAULT_PAGE_SIZE: string
  readonly VITE_MAX_PAGE_SIZE: string

  // Rate Limiting
  readonly VITE_MAX_SUBMISSIONS_PER_MINUTE: string

  // Monaco Editor
  readonly VITE_MONACO_THEMES: string

  // External Links
  readonly VITE_GITHUB_URL: string
  readonly VITE_DOCS_URL: string
  readonly VITE_SUPPORT_EMAIL: string

  // Third Party Services
  readonly VITE_GITHUB_CLIENT_ID: string
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_GA_TRACKING_ID: string
  readonly VITE_SENTRY_DSN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}