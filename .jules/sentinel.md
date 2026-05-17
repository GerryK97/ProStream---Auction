## 2024-05-17 - Error Response Sanitization
**Vulnerability:** Detailed Cloudinary and API service errors were being exposed in the HTTP 500 response bodies in `/api/upload/route.ts`.
**Learning:** Returning `error: error.message` in Catch blocks directly surfaces internal server configurations, credentials status, and backend stack implementation details.
**Prevention:** Always log the detailed error internally (`console.error`) and return a generic `NextResponse.json({ error: "Failed to perform action" })` to the client API response.
