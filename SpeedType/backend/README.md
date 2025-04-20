# SpeedType Backend

This is the backend server for the SpeedType typing race application. It handles race logic via Socket.IO and provides API endpoints, including dynamic quote generation.

## Features

*   Real-time multiplayer race management using Socket.IO.
*   Single-player race coordination.
*   Dynamic quote sourcing via Claude AI (Anthropic API).
*   In-memory caching for AI-generated quotes with proactive background refresh.
*   Basic API endpoints for health checks and status.

## Setup

1.  Navigate to the `backend` directory:
    ```bash
    cd SpeedType/backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file by copying `.env.example`:
    ```bash
    cp .env.example .env
    ```
4.  Configure environment variables in `.env` (see below).

## Environment Variables

Configure the following variables in your `.env` file for local development or in your deployment environment (e.g., Railway secrets/variables):

*   `PORT` (Optional): The port the server will listen on. Defaults to `3001`.
*   `ALLOWED_ORIGINS` (Optional): Comma-separated list of frontend URLs allowed to connect (CORS). Important for production. Defaults to permissive settings for local development (`http://localhost:3000`, `http://localhost:5173`, `*`).
    *Example:* `https://speedtype.robocat.ai,http://localhost:3000`
*   `ENABLE_AI_QUOTES` (Required): Set to `true` to enable fetching quotes from the Claude AI API. Set to `false` or omit to disable the feature (currently results in an error on the `/api/quotes` endpoint if disabled).
*   `ANTHROPIC_API_KEY` (Required if `ENABLE_AI_QUOTES=true`):
    *   Your API key for the Anthropic (Claude) API.
    *   **SECURITY WARNING:** This is a sensitive secret. Do **NOT** commit it to your repository. Use your deployment platform's secrets management (e.g., Railway variables) in production and the local `.env` file (which should be in `.gitignore`) for development.
*   `AI_QUOTE_CACHE_MINUTES` (Optional):
    *   The duration (in minutes) that fetched AI quotes are cached in memory before a background refresh is considered.
    *   Defaults to `10` minutes.
*   `AI_QUOTE_MIN_REQUESTS_BEFORE_REFRESH` (Optional):
    *   The minimum number of requests the `/api/quotes` endpoint must receive since the last refresh before a background refresh is triggered (in addition to the cache duration expiring).
    *   Defaults to `10` requests.

## Running Locally

1.  Ensure all required environment variables are set in `.env`.
2.  Start the server:
    ```bash
    npm run dev
    ```
    The server will typically run on `http://localhost:3001`.

## API Endpoints

*   `GET /api/`: Returns basic status information, including whether AI quotes are enabled and cache status.
*   `GET /api/health`: Simple health check endpoint.
*   `GET /api/quotes`:
    *   If `ENABLE_AI_QUOTES` is `true` and `ANTHROPIC_API_KEY` is valid:
        *   Returns an array of 0-6 unique quote strings suitable for typing tests.
        *   Quotes are sourced from the Claude AI API.
        *   **Caching:** Results are cached in memory based on `AI_QUOTE_CACHE_MINUTES`. The cache is proactively refreshed in the background if the cache duration has passed **and** the request count since the last refresh meets the `AI_QUOTE_MIN_REQUESTS_BEFORE_REFRESH` threshold.
        *   If the cache is empty on request (e.g., server restart), it attempts an immediate fetch from the AI.
    *   If `ENABLE_AI_QUOTES` is `false` or the API key is missing/invalid:
        *   Currently returns a `503 Service Unavailable` or `500 Internal Server Error`.

## WebSockets

The server uses Socket.IO (typically available at the `/socket.io/` path) for real-time communication during races. See `src/socket/raceSocket.ts` for implementation details.

## Testing

*   Run unit/integration tests:
    ```bash
    npm test
    ```
*   Run integration tests specifically:
    ```bash
    npm run test:integration
    ``` 