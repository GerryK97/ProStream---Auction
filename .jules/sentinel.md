## 2024-05-15 - Unauthenticated Debug Endpoint Exposure
**Vulnerability:** A public debug endpoint (`src/app/debug/route.ts`) exposed sensitive environment variables, including the first 60 characters of the `MONGODB_URI` and internal status flags. This was available without authentication.
**Learning:** Development tools and debug routes must be removed or strictly authenticated before deploying to production. Even partially obfuscated credentials can lead to database compromise, especially if the string includes the username and password.
**Prevention:** Never commit debug endpoints to the main branch or deployment paths unless they are behind robust authentication and authorization checks. Use internal tooling or secure log management for debugging in production environments.
