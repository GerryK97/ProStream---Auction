## 2024-05-21 - Information Disclosure in API Error Responses
**Vulnerability:** The image upload API (`/api/upload`) was returning detailed error messages directly to the client, including the status of environment variables (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) and raw, unhandled Cloudinary error objects.
**Learning:** Returning raw internal error details to the client can leak sensitive configuration states and infrastructure details, providing an attacker with valuable reconnaissance information.
**Prevention:** Always catch exceptions in API routes and return generic error messages to the client. Detailed error information should be logged strictly on the server side for debugging purposes, avoiding exposure to the end-user.
