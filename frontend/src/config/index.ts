/**
 * Application configuration
 * Centralizes all environment variables and constants
 */

// Helper function to get environment variables with fallback
const getEnvVar = (key: string, fallback: string = ''): string => {
  return import.meta.env[key] || fallback;
};

const getBooleanEnvVar = (key: string, fallback: boolean = false): boolean => {
  const value = getEnvVar(key);
  if (!value) return fallback;
  return value.toLowerCase() === 'true';
};

const getNumericEnvVar = (key: string, fallback: number = 0): number => {
  const value = getEnvVar(key);
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
};

export const config = {
  // Application Information
  app: {
    name: getEnvVar('VITE_APP_NAME', 'TechFolks'),
    version: getEnvVar('VITE_APP_VERSION', '1.0.0'),
    description: getEnvVar('VITE_APP_DESCRIPTION', 'Competitive coding platform for developers'),
    environment: getEnvVar('VITE_ENV', 'development'),
  },

  // API Configuration
  api: {
    baseUrl: getEnvVar('VITE_API_URL', 'http://localhost:8000/api'),
    timeout: getNumericEnvVar('VITE_API_TIMEOUT', 10000),
    uploadTimeout: getNumericEnvVar('VITE_UPLOAD_TIMEOUT', 30000),
  },

  // WebSocket Configuration
  websocket: {
    url: getEnvVar('VITE_WS_URL', 'ws://localhost:3000'),
  },

  // Authentication Configuration
  auth: {
    tokenKey: getEnvVar('VITE_AUTH_TOKEN_KEY', 'techfolks_auth_token'),
    refreshTokenKey: getEnvVar('VITE_REFRESH_TOKEN_KEY', 'techfolks_refresh_token'),
    sessionTimeout: getNumericEnvVar('VITE_SESSION_TIMEOUT', 604800000), // 7 days
    maxLoginAttempts: getNumericEnvVar('VITE_MAX_LOGIN_ATTEMPTS', 5),
  },

  // Feature Flags
  features: {
    groups: getBooleanEnvVar('VITE_ENABLE_GROUPS', true),
    contests: getBooleanEnvVar('VITE_ENABLE_CONTESTS', true),
    discussions: getBooleanEnvVar('VITE_ENABLE_DISCUSSIONS', true),
    leaderboard: getBooleanEnvVar('VITE_ENABLE_LEADERBOARD', true),
    adminConsole: getBooleanEnvVar('VITE_ENABLE_ADMIN_CONSOLE', true),
    socialAuth: getBooleanEnvVar('VITE_ENABLE_SOCIAL_AUTH', true),
    codeExecution: getBooleanEnvVar('VITE_ENABLE_CODE_EXECUTION', true),
  },

  // UI Configuration
  ui: {
    defaultTheme: getEnvVar('VITE_DEFAULT_THEME', 'system') as 'light' | 'dark' | 'system',
    storagePrefix: getEnvVar('VITE_STORAGE_PREFIX', 'techfolks'),
    defaultPageSize: getNumericEnvVar('VITE_DEFAULT_PAGE_SIZE', 20),
    maxPageSize: getNumericEnvVar('VITE_MAX_PAGE_SIZE', 100),
  },

  // Rate Limiting
  rateLimits: {
    maxSubmissionsPerMinute: getNumericEnvVar('VITE_MAX_SUBMISSIONS_PER_MINUTE', 5),
  },

  // Monaco Editor Configuration
  editor: {
    themes: getEnvVar('VITE_MONACO_THEMES', 'vs-dark,vs-light,hc-black').split(','),
    defaultLanguage: 'javascript',
    fontSize: 14,
    tabSize: 2,
  },

  // External Links
  links: {
    github: getEnvVar('VITE_GITHUB_URL', 'https://github.com/techfolks/platform'),
    docs: getEnvVar('VITE_DOCS_URL', 'https://docs.techfolks.dev'),
    supportEmail: getEnvVar('VITE_SUPPORT_EMAIL', 'support@techfolks.dev'),
  },

  // Third Party Services
  services: {
    github: {
      clientId: getEnvVar('VITE_GITHUB_CLIENT_ID'),
    },
    google: {
      clientId: getEnvVar('VITE_GOOGLE_CLIENT_ID'),
    },
    analytics: {
      gaTrackingId: getEnvVar('VITE_GA_TRACKING_ID'),
    },
    sentry: {
      dsn: getEnvVar('VITE_SENTRY_DSN'),
    },
  },

  // Development helpers
  isDevelopment: getEnvVar('VITE_ENV', 'development') === 'development',
  isProduction: getEnvVar('VITE_ENV', 'development') === 'production',
  isStaging: getEnvVar('VITE_ENV', 'development') === 'staging',
};

// Constants that should not be configurable
export const constants = {
  // HTTP Status Codes
  httpStatus: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
  },

  // User Roles
  userRoles: {
    USER: 'user',
    ADMIN: 'admin',
    PROBLEM_SETTER: 'problem_setter',
    MODERATOR: 'moderator',
  },

  // Problem Difficulties
  problemDifficulties: {
    BEGINNER: 'beginner',
    INTERMEDIATE: 'intermediate',
    ADVANCED: 'advanced',
    EXPERT: 'expert',
  },

  // Contest Status
  contestStatus: {
    UPCOMING: 'upcoming',
    RUNNING: 'running',
    ENDED: 'ended',
  },

  // Submission Status
  submissionStatus: {
    PENDING: 'pending',
    RUNNING: 'running',
    ACCEPTED: 'accepted',
    WRONG_ANSWER: 'wrong_answer',
    TIME_LIMIT_EXCEEDED: 'time_limit_exceeded',
    MEMORY_LIMIT_EXCEEDED: 'memory_limit_exceeded',
    RUNTIME_ERROR: 'runtime_error',
    COMPILATION_ERROR: 'compilation_error',
  },

  // Programming Languages
  programmingLanguages: {
    JAVASCRIPT: 'javascript',
    PYTHON: 'python',
    JAVA: 'java',
    CPP: 'cpp',
    C: 'c',
    GO: 'go',
    RUST: 'rust',
    TYPESCRIPT: 'typescript',
  },

  // Local Storage Keys
  storageKeys: {
    THEME: `${getEnvVar('VITE_STORAGE_PREFIX', 'techfolks')}-theme`,
    SETTINGS: `${getEnvVar('VITE_STORAGE_PREFIX', 'techfolks')}-settings`,
    EDITOR_PREFERENCES: `${getEnvVar('VITE_STORAGE_PREFIX', 'techfolks')}-editor`,
    USER_PREFERENCES: `${getEnvVar('VITE_STORAGE_PREFIX', 'techfolks')}-user-prefs`,
  },
};

export default config;