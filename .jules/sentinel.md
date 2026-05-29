## 2024-05-18 - Sanitize Third-Party Error Responses
**Vulnerability:** The API upload endpoint was exposing detailed internal configuration state (e.g. missing Cloudinary credentials) and raw third-party error objects (`cloudinaryError`) directly to clients in HTTP 500 responses.
**Learning:** Developers often pass full error objects from third-party services (like Cloudinary, AWS, etc) down to the client for debugging, inadvertently leaking internal architecture details and potentially sensitive configurations.
**Prevention:** Always fail securely by catching exceptions, logging the detailed error object strictly server-side, and returning a generic, safe error message to the API consumer.
