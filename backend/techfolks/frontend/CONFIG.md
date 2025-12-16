# Configuration Guide

This document explains how to configure the TechFolks frontend application.

## Environment Variables

The application uses environment variables for configuration. Variables should be prefixed with `VITE_` to be accessible in the frontend.

### Environment Files

- `.env` - Default configuration (development)
- `.env.production` - Production environment configuration
- `.env.staging` - Staging environment configuration

### Available Configuration Options

#### Application Information
- `VITE_APP_NAME` - Application name (default: "TechFolks")
- `VITE_APP_VERSION` - Application version (default: "1.0.0")
- `VITE_APP_DESCRIPTION` - Application description
- `VITE_ENV` - Environment (development, staging, production)

#### API Configuration
- `VITE_API_URL` - Backend API URL
- `VITE_WS_URL` - WebSocket URL
- `VITE_API_TIMEOUT` - API request timeout in milliseconds
- `VITE_UPLOAD_TIMEOUT` - File upload timeout in milliseconds

#### Authentication
- `VITE_AUTH_TOKEN_KEY` - localStorage key for auth token
- `VITE_REFRESH_TOKEN_KEY` - localStorage key for refresh token
- `VITE_SESSION_TIMEOUT` - Session timeout in milliseconds
- `VITE_MAX_LOGIN_ATTEMPTS` - Maximum login attempts before lockout

#### Feature Flags
- `VITE_ENABLE_GROUPS` - Enable/disable groups feature
- `VITE_ENABLE_CONTESTS` - Enable/disable contests feature
- `VITE_ENABLE_DISCUSSIONS` - Enable/disable discussions feature
- `VITE_ENABLE_LEADERBOARD` - Enable/disable leaderboard feature
- `VITE_ENABLE_ADMIN_CONSOLE` - Enable/disable admin console
- `VITE_ENABLE_SOCIAL_AUTH` - Enable/disable social authentication
- `VITE_ENABLE_CODE_EXECUTION` - Enable/disable code execution

#### UI Configuration
- `VITE_DEFAULT_THEME` - Default theme (light, dark, system)
- `VITE_STORAGE_PREFIX` - localStorage prefix for app data
- `VITE_DEFAULT_PAGE_SIZE` - Default pagination size
- `VITE_MAX_PAGE_SIZE` - Maximum pagination size

#### Rate Limiting
- `VITE_MAX_SUBMISSIONS_PER_MINUTE` - Maximum submissions per minute
- `VITE_MAX_LOGIN_ATTEMPTS` - Maximum login attempts

#### Monaco Editor
- `VITE_MONACO_THEMES` - Available editor themes (comma-separated)

#### External Links
- `VITE_GITHUB_URL` - GitHub repository URL
- `VITE_DOCS_URL` - Documentation URL
- `VITE_SUPPORT_EMAIL` - Support email address

#### Third Party Services
- `VITE_GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `VITE_GOOGLE_CLIENT_ID` - Google OAuth client ID
- `VITE_GA_TRACKING_ID` - Google Analytics tracking ID
- `VITE_SENTRY_DSN` - Sentry error tracking DSN

## Using Configuration in Code

Import the configuration object:

```typescript
import { config, constants } from '@/config'

// Use application information
console.log(config.app.name) // "TechFolks"
console.log(config.app.version) // "1.0.0"

// Use API configuration
const response = await fetch(config.api.baseUrl + '/endpoint')

// Use feature flags
if (config.features.contests) {
  // Show contests feature
}

// Use constants
if (user.role === constants.userRoles.ADMIN) {
  // Show admin features
}
```

## Configuration Object Structure

The configuration is organized into logical sections:

- `config.app` - Application information
- `config.api` - API configuration
- `config.websocket` - WebSocket configuration
- `config.auth` - Authentication settings
- `config.features` - Feature flags
- `config.ui` - UI configuration
- `config.rateLimits` - Rate limiting settings
- `config.editor` - Monaco editor settings
- `config.links` - External links
- `config.services` - Third party services
- `constants` - Non-configurable constants

## Development vs Production

Different environment files allow for different configurations:

### Development (.env)
- Uses localhost URLs
- Longer timeouts for debugging
- All features enabled
- No analytics tracking

### Staging (.env.staging)
- Uses staging server URLs
- App name includes "(Staging)"
- Social auth disabled
- Different storage prefix

### Production (.env.production)
- Uses production URLs
- Optimized timeouts
- Analytics enabled
- Production service credentials

## Best Practices

1. **Never commit sensitive credentials** - Use placeholder values in committed files
2. **Use environment-specific values** - Different timeouts, URLs for each environment
3. **Feature flags for gradual rollouts** - Disable features that aren't ready
4. **Meaningful defaults** - Always provide fallback values
5. **Document new variables** - Update this file when adding new configuration options

## Adding New Configuration

To add a new configuration option:

1. Add the environment variable to all `.env` files
2. Add the variable to the config object in `src/config/index.ts`
3. Use the helper functions (`getEnvVar`, `getBooleanEnvVar`, `getNumericEnvVar`)
4. Document the new variable in this file
5. Update components to use the new configuration value

Example:

```typescript
// In src/config/index.ts
export const config = {
  // ... existing config
  newFeature: {
    enabled: getBooleanEnvVar('VITE_NEW_FEATURE_ENABLED', false),
    apiEndpoint: getEnvVar('VITE_NEW_FEATURE_API', '/api/new-feature'),
  }
}

// In component
import { config } from '@/config'

if (config.newFeature.enabled) {
  // Use new feature
}
```