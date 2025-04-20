# Type Racer Application - Product Requirements Document (PRD)

## 1. Product Overview

**Product Name:** SpeedType

**Vision Statement:** SpeedType aims to be the premier typing competition platform that helps users improve their typing speed and accuracy through engaging real-time races against other users worldwide.

**Product Description:** SpeedType is a competitive typing application where users race against each other by typing provided text as quickly and accurately as possible. Users' progress is visually represented by cars moving across the screen, with performance metrics displayed in real-time.

## 2. User Personas

### Casual Typist
- **Name:** Alex
- **Age:** 18-30
- **Goals:** Improve typing speed for productivity, have fun in short sessions
- **Pain Points:** Gets bored with traditional typing tutors, needs motivation

### Professional Typist
- **Name:** Taylor
- **Age:** 25-45
- **Goals:** Maintain top-tier typing speeds, compete globally
- **Pain Points:** Struggles to find challenging competitors, needs detailed metrics

### Student
- **Name:** Jordan
- **Age:** 14-22
- **Goals:** Improve typing for schoolwork, compete with friends
- **Pain Points:** Limited attention span, needs engaging practice methods

## 3. Key Features

### 3.1 User Authentication & Profiles
- Account creation and login system
- Customizable user profiles
- Profile statistics and history tracking
- Achievement badges and rankings display

### 3.2 Race Matchmaking System
- Quick match options for casual users
- Skill-based matchmaking for competitive races
- Private race rooms with invitations
- Tournament scheduling and participation
- Built-in motivational passages for quick race starts:
  - Curated collection of 15 longer passages (2-4 sentences each)
  - Random selection of 5 passages displayed at a time
  - One-click refresh for new passage selection
  - One-click passage selection for race text
  - High-quality quotes from notable historical figures and thought leaders
  - Optimized for typing practice with varied sentence structures
  - Local quote management for reliable performance (Fallback Mechanism)
  - Dynamic sourcing via backend API (Primary Mechanism - see 4.2.1)
  - Fisher-Yates shuffle algorithm for true randomization

### 3.3 Racing Experience

#### 3.3.1 Text Input and Display
- Text selection from diverse categories (literature, code, quotes)
- Support for custom text input before race start
- Real-time character-by-character feedback:
  - Untyped characters displayed in dimmed color (#666)
  - Correctly typed characters in light green (#a0d9a0)
  - Incorrectly typed characters in light red (#d9a0a0) with dark red background (#4d3030)
  - Incorrect characters are underlined for additional visibility
  - Special handling for spaces to show errors in whitespace
- Word-level error detection:
  - Input field background changes to dark red when current word contains errors
  - Visual feedback helps users identify mistakes immediately
- Typing input features:
  - Auto-focus on race start
  - Click-to-focus anywhere in typing area
  - Disabled autocorrect, spellcheck, and autocomplete
  - Dark theme optimized for readability
- Real-time WPM and accuracy calculations:
  - WPM calculation starts from first keystroke
  - Words counted based on whitespace separation
  - Updates in real-time as user types
  - Resets when starting new race
  - Shows 0 WPM when not typing
  - Displays at finish line for each racer
- Difficulty levels based on text complexity

#### 3.3.2 Race Progress Visualization
- Each racer represented by a colored car on a horizontal track
  - Car colors assigned from a predefined palette (#4169e1, #dc143c, #8b0000, #4682b4, #32cd32, #ffd700)
  - Car icons implemented as SVG graphics for crisp rendering
  - Racer name displayed below each car
- Cars move left to right proportional to typing progress (0-95% of track width)
- Horizontal dashed lines (#444) separating racing lanes
- Dark theme with contrasting backgrounds:
  - Container background: #1a1a1a
  - Track background: #2a2a2a
- Race statistics display:
  - WPM (words per minute) shown at finish line for each racer
  - Place rankings (1st Place!, 2nd Place., etc.) appear when racers finish
  - Stats aligned to right edge with consistent spacing
- Smooth animations for car movement using CSS transitions
- Responsive layout adapting to different screen sizes

### 3.4 Statistics & Analytics
- Historical performance tracking
- Personal best records
- Progress charts and improvement metrics
- Heat maps for error patterns
- Insights and recommendations for improvement

### 3.5 Social & Competitive Elements
- Global and regional leaderboards
- Friend system and challenges
- Achievement system with unlockable rewards
- Weekly and monthly competitions
- Clan/team racing capabilities

### 3.6 Learning Resources
- Typing technique guides
- Practice exercises tailored to user weaknesses
- Keyboard shortcut tutorials
- Progress-based lesson recommendations

### 3.7 Customization Options
- Car skins and colors (some unlockable)
- Track themes and backgrounds
- Keyboard sound effects and race ambiance
- Custom keyboard layout support

## 4. Technical Requirements

### 4.1 Platforms
- Web application (responsive design)
- Native mobile applications (iOS and Android)
- Desktop applications (Windows, macOS, Linux)

### 4.2 Backend Requirements
- Real-time synchronization with <50ms latency
- User database with secure authentication
- Content management system for text passages (Original Plan - superseded by 4.2.1)
- Dynamic Quote Sourcing via Claude AI (Current Plan - see 4.2.1)
- Analytics processing pipeline
- Leaderboard and ranking systems

### 4.2.1 Dynamic Quote Sourcing via Claude AI

**Goal:** Enhance the variety and freshness of text passages used for typing races by dynamically fetching them from an external AI service instead of relying solely on the hardcoded fallback list in the frontend.

**Mechanism:**

1.  **Backend Endpoint:** Implemented via `GET /api/quotes` within the existing Express backend (`server.ts`).
2.  **Configuration:** The use of this feature is controlled by the `ENABLE_AI_QUOTES` environment variable. If set to `"true"` (case-insensitive), the backend attempts to contact the AI service. Otherwise, the endpoint returns an error (e.g., 503), triggering the frontend fallback.
3.  **AI Service Integration:** Uses the Anthropic Claude AI API.
    *   **SDK:** Utilizes the official `@anthropic-ai/sdk` Node.js package.
    *   **Authentication:** Requires an `ANTHROPIC_API_KEY` environment variable configured securely (using `.env` locally with `.gitignore`, and Railway environment variables for deployment). The server validates the presence of this key.
    *   **Model:** Targets `claude-3-haiku-20240307`.
4.  **Prompting Strategy:**
    *   Requests 7 distinct paragraphs suitable for typing tests (150-400 characters each), neutral or inspirational tone, avoiding complex jargon.
    *   Instructs Claude to respond *only* with a valid JSON array of 7 strings.
5.  **Response Handling & Filtering:**
    *   The backend parses the JSON response from Claude.
    *   It filters the received array, keeping only quotes that are valid strings and have a length of **500 characters or less**.
    *   From the filtered valid quotes, it **randomly selects exactly 6 quotes** if 6 or more are available. If fewer than 6 valid quotes were received/filtered, it returns all of them.
6.  **Caching:**
    *   The backend implements an in-memory cache for the successfully fetched and selected quotes to reduce API calls and improve performance.
    *   **Duration:** Configurable via `AI_QUOTE_CACHE_MINUTES` (default 10 minutes).
    *   **Request Threshold:** Configurable via `AI_QUOTE_MIN_REQUESTS_BEFORE_REFRESH` (default 10 requests).
    *   **Proactive Refresh:** The cache is checked periodically in the background. A refresh is triggered only if *both* the cache duration has expired *and* the request count threshold has been met since the last successful refresh.
    *   **Initial Population:** An attempt to populate the cache is made when the server starts.
7.  **Frontend Interaction:**
    *   The backend returns the final array of 0-6 quotes (from cache or a fresh fetch) with a 200 OK status to the frontend.
    *   The frontend `fetchQuotes` function consumes this array.
8.  **Error Handling & Fallback:**
    *   If `ENABLE_AI_QUOTES` is false or API key is missing, the endpoint returns an error (e.g., 503).
    *   If the cache is empty and an immediate fetch from Claude fails (API error, parsing error, etc.), the backend returns an appropriate HTTP error status (e.g., 500, 503) to the frontend.
    *   The frontend's existing `catch` block in `fetchQuotes` handles these errors by activating the fallback mechanism (using hardcoded `fallbackQuotes`).

### 4.3 Frontend Requirements
- Responsive UI supporting multiple screen sizes
- Smooth animations for race visualization
- Keyboard input handling with anti-cheat measures
- Real-time progress updates and statistics
- Offline mode capabilities (Note: Dynamic quote fetching requires online connectivity)

### 4.4 Integration Requirements
- Social media authentication options
- Share race results to social platforms
- Import/export user data
- API for third-party integrations

### 4.5 Deployment and Setup

#### 4.5.1 Development Environment Requirements
- Node.js v18.19.1 or higher
- npm package manager
- Git for version control
- Modern web browser (Chrome, Firefox, Safari)
- Anthropic API Key (for dynamic quote feature, stored in `.env`)
- `ENABLE_AI_QUOTES` environment variable (optional, set to `"true"` in `.env` to enable AI quotes locally)

#### 4.5.2 Method 1: Local Development (Frontend + Backend)

1. Clone the repository:
   ```bash
   git clone https://github.com/alex-iurco/SpeedType.git
   cd SpeedType
   ```
2. Backend Setup:
   ```bash
   cd SpeedType/backend
   npm install
   # Create .env file (if not present)
   # Add ANTHROPIC_API_KEY=your_key_here to .env
   # Optionally add ENABLE_AI_QUOTES="true" to .env
   # Ensure .env is in .gitignore
   node server.js  # Runs on port 3001
   ```
   You should see: "Server listening on *:3001"

3. Frontend Setup (in a new terminal):
   ```bash
   cd SpeedType/frontend
   npm install
   npm run dev     # Runs on port 5173 (or as configured)
   ```

4. Access the application:
   - Open http://localhost:5173 (or configured port) in your browser
   - Frontend will automatically connect to backend on port 3001
   - Multiple browser windows can be used to simulate multiple players

Troubleshooting:
- If port 3001 is in use, kill the existing process:
  ```bash
  pkill -f "node server.js"
  ```
- If changes don't appear, clear browser cache or use incognito mode

#### 4.5.3 Method 2: Production Deployment (GitHub Pages + Railway)

Current Version: v1.0.1

This method hosts the frontend on GitHub Pages and the backend on Railway, providing a robust production environment.

1. Backend Deployment to Railway:
   - The backend is automatically deployed to Railway on push to the `main` branch *if* changes are detected within the `SpeedType/backend/` directory or the `railway-deploy.yml` workflow file.
   - This is handled by the `.github/workflows/railway-deploy.yml` GitHub Actions workflow.
   - Configuration is managed through `railway.toml`.
   - **Environment variables (including `ANTHROPIC_API_KEY` and optionally `ENABLE_AI_QUOTES="true"`) must be managed securely in the Railway dashboard.**

2. Frontend Deployment to GitHub Pages:
   - The frontend is automatically deployed to GitHub Pages by the `.github/workflows/deploy.yml` GitHub Actions workflow.
   - This workflow triggers on pushes to the `main` branch affecting `SpeedType/frontend/` or the workflow file itself, and also upon successful completion of the "Version Bump" workflow.
   - It uses the official GitHub Actions for Pages (`actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`).
   - The workflow builds the frontend (`npm run build` in `SpeedType/frontend`), uploads the `dist` directory as an artifact, and deploys it.
   - It automatically creates the `CNAME` file required for the custom domain (`speedtype.robocat.ai`) during the build process.
   - Base URL configuration is handled within `vite.config.js`.

3. Version Bumping:
   - Versioning is managed by the `.github/workflows/version-bump.yml` GitHub Actions workflow.
   - **Triggers:**
     - Manually via the GitHub Actions UI (`workflow_dispatch`), allowing selection of `patch`, `minor`, or `