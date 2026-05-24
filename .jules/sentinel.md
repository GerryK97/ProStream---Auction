
## 2024-05-24 - Information Disclosure in API Error Responses
**Vulnerability:** The `/api/upload` endpoint was returning detailed configuration and service error messages (such as missing specific environment variables and detailed Cloudinary internal errors) directly to the client.
**Learning:** Detailed API error responses can leak sensitive internal configuration and service state to external clients, increasing the attack surface.
**Prevention:** Always catch and log detailed errors internally for debugging, but return generic, sanitized error messages (e.g., "Server configuration error" or "Failed to process request") to the client.
