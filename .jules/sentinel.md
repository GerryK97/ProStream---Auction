
## 2024-05-30 - Cloudinary Error Data Leak in Upload Route
**Vulnerability:** The `/api/upload` endpoint leaked detailed internal Cloudinary API errors (e.g. `cloudinaryError` object, `http_code`) in the JSON response when an image upload failed.
**Learning:** Detailed error logging was mixed with client response construction, causing internal service data (and potential configuration hints) to be exposed to external clients in the case of failure.
**Prevention:** Always separate internal logging from client-facing error messages. Catch blocks handling external APIs (like Cloudinary) should log full details via `console.error` on the server but return only generic, safe messages (e.g., "Failed to upload image") to the client.
