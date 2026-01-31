# Security Guidelines for Space-Sim

## API Key Management

### ⚠️ CRITICAL: Never Commit API Keys

This project uses the Google Gemini API which requires an API key. **Never commit your API key to the repository.**

### Setup Instructions

1. Create a `.env.local` file in the project root (this file is gitignored)
2. Add your Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```
3. Get your API key from: https://aistudio.google.com/apikey

### How It Works

- The Vite configuration (`vite.config.ts`) reads `GEMINI_API_KEY` from the environment
- It exposes the key to the client-side code via `process.env.API_KEY`
- **Note**: Client-side code means the API key is visible in the browser

### Production Considerations

For production deployments:

1. **Best Practice**: Move API calls to a backend server
   - Keep API keys server-side only
   - Client calls your backend, backend calls Gemini API
   - This prevents API key exposure and allows rate limiting

2. **Alternative**: Use environment variables in your hosting platform
   - Vercel, Netlify, etc. support environment variables
   - Set `GEMINI_API_KEY` in your platform's settings
   - The key will be embedded in the build (still client-visible)

3. **API Key Restrictions**: In Google AI Studio
   - Restrict your API key to specific domains
   - Enable rate limiting
   - Monitor usage regularly

## Reported Vulnerabilities

### Fixed Issues

- ✅ **npm audit vulnerability (jws)**: Fixed via `npm audit fix`
  - Updated jws package to secure version
  - Date fixed: 2026-01-31

### Current Security Status

- No known vulnerabilities in dependencies
- API key management follows documented best practices
- Input validation in place for localStorage operations
- JSON parsing includes error handling

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do not** open a public issue
2. Email the maintainers privately
3. Include steps to reproduce
4. Allow time for a fix before public disclosure

## Security Checklist for Contributors

- [ ] Never commit `.env.local` or files with API keys
- [ ] Review changes for hardcoded secrets before committing
- [ ] Run `npm audit` before submitting PRs
- [ ] Validate user inputs before processing
- [ ] Use try-catch for JSON parsing and API calls
