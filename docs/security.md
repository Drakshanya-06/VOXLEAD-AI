# Security Notes

Implemented in this MVP: bcrypt password hashing, JWT-protected API routes, Helmet headers, CORS origin configuration, request rate limiting, server-side environment variables and user-scoped queries in the primary list/create endpoints.

Before production:
- Replace development fallback JWT secret with a mandatory strong secret and rotate it.
- Add strict schema validation, payload size limits and centralized redacted logging.
- Audit every database operation for tenant/user ownership, including all update/delete routes.
- Use HTTPS, managed secrets, encryption at rest/in transit and secure backups.
- Add token revocation/refresh strategy, MFA where appropriate and audit events.
- Obtain explicit consent for voice processing and transcript retention; provide deletion/export and retention controls.
- Perform dependency scanning, penetration testing and security review.

Never commit `.env` or expose the Gemini API key in browser code.
