
## 2024-05-30 - Prevent Information Disclosure in Upload Endpoints
**Vulnerability:** The `/api/upload` endpoint was leaking sensitive internal configuration details (such as the presence or absence of specific Cloudinary environment variables) and detailed third-party service errors (like Cloudinary stack traces and HTTP codes) directly to the client in the 500 error response.
**Learning:** Returning detailed error objects or stack traces from third-party services, or explicit validation checks for server configuration variables, directly to the client exposes internal architectural details that attackers can use to map the backend infrastructure or exploit misconfigurations.
**Prevention:** Always catch exceptions or validation errors internally, log the detailed error for debugging, and return a sanitized, generic error message (e.g., 'Internal server error') to the client.
