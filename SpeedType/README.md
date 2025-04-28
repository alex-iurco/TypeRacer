# Test update

## Shared Utilities & Code Reuse

To avoid code duplication and ensure consistency, all logic that should be shared between frontend and backend (such as text sanitization, validation, etc.) lives in the `shared/` directory at the project root.

- **For the backend**, import shared utilities via [`backend/src/utils/shared.ts`](backend/src/utils/shared.ts). This file acts as a single entry point for all shared logic.
- **For the frontend**, import directly from the `shared/` directory.

**To add a new shared utility:**
1. Place the utility in the `shared/` directory.
2. Re-export it from [`backend/src/utils/shared.ts`](backend/src/utils/shared.ts) for backend use.
3. Import from `../utils/shared` in backend code, or from `../../shared/` in frontend code.

---

## Backend (`/SpeedType/backend`)

*   Built with Node.js, Express, TypeScript, and Socket.IO.
*   Handles real-time race logic, player progress tracking, and WPM calculation.
*   Manages multiple race rooms.
*   Provides API endpoints for health checks and dynamic quote sourcing (using Claude AI with caching).
*   See `SpeedType/backend/README.md` for detailed setup and API documentation.
