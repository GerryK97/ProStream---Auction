## 2024-05-25 - Information Disclosure in API Error Handling
**Vulnerability:** The API endpoint `src/app/api/upload/route.ts` logged internal environment variable presence to stdout and returned specific Cloudinary setup instructions and error details to clients in its JSON response.
**Learning:** Detailed API error handling can inadvertently leak server architecture or service configurations to clients. By providing generic user-facing errors, potential attackers learn less about the server's internals.
**Prevention:** Implement standard centralized error handlers or ensure catching blocks never return the raw exception objects/messages or service configuration checks to the client.
