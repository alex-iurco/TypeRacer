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
- Pre-loaded motivational passages for quick race starts:
  - Random selection of 5 longer passages (3-5 sentences each)
  - Option to refresh passages for new selections
  - Fallback passages available if API is unavailable
  - One-click passage selection for race text
  - Passages sourced from Quotable API with curated fallback options

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
- Content management system for text passages
- Analytics processing pipeline
- Leaderboard and ranking systems

### 4.3 Frontend Requirements
- Responsive UI supporting multiple screen sizes
- Smooth animations for race visualization
- Keyboard input handling with anti-cheat measures
- Real-time progress updates and statistics
- Offline mode capabilities

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
   node server.js  # Runs on port 3001
   ```
   You should see: "Server listening on *:3001"

3. Frontend Setup (in a new terminal):
   ```bash
   cd SpeedType/frontend
   npm install
   npm run dev     # Runs on port 5173
   ```

4. Access the application:
   - Open http://localhost:5173 in your browser
   - Frontend will automatically connect to backend on port 3001
   - Multiple browser windows can be used to simulate multiple players

Troubleshooting:
- If port 3001 is in use, kill the existing process:
  ```bash
  pkill -f "node server.js"
  ```
- If changes don't appear, clear browser cache or use incognito mode

#### 4.5.3 Method 2: Production Deployment (GitHub Pages + Railway)

This method hosts the frontend on GitHub Pages and the backend on Railway.

1. Backend Deployment to Railway:
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login to Railway
   railway login --browserless
   
   # Initialize and deploy
   cd SpeedType/backend
   railway init  # Select your project name
   railway up    # Deploy to Railway
   ```
   - Railway will provide a domain like: `https://your-app-name.railway.app`
   - The backend will be automatically deployed on push to main branch

2. Frontend Deployment to GitHub Pages:
   ```bash
   cd SpeedType/frontend
   # Update the socket connection URL in src/App.jsx
   npm run deploy
   ```

3. Custom Domain Setup (Optional):
   - Configure DNS settings for your domain
   - Add CNAME record pointing to GitHub Pages
   - Update CORS settings in backend for your domain
   - Configure custom domain in GitHub repository settings

4. Access the application:
   - Production: https://speedtype.robocat.ai
   - The frontend will automatically connect to the Railway backend
   - All features are available in production environment

Configuration Requirements:
- Railway account with available credits
- GitHub repository with GitHub Pages enabled
- Custom domain (optional) with proper DNS configuration
- Environment variables set in Railway dashboard

Security Considerations:
- CORS settings properly configured for production domains
- Secure WebSocket connections (WSS) enabled
- Environment variables used for sensitive configurations
- Regular security updates and monitoring

## 5. User Journey

### 5.1 Onboarding
- Welcome screen with tutorial option
- Account creation or guest mode selection
- Initial typing test to establish baseline
- Introduction to core features
- First race with guided instructions

### 5.2 Daily Usage
- Dashboard showing daily challenges and statistics
- Quick match button for immediate racing
- Notifications for friend activities and challenges
- Daily goals and rewards
- Practice recommendations based on previous performance

### 5.3 Progression
- Level-up system based on races completed and performance
- Unlockable content at milestone achievements
- Skill-based matchmaking adjustment
- Advanced statistics unlocked at higher levels
- Tournament eligibility based on consistent performance

## 6. Success Metrics

### 6.1 User Engagement
- Daily active users (DAU) and monthly active users (MAU)
- Average session length
- Races completed per user per day
- Retention rates (1-day, 7-day, 30-day)

### 6.2 Performance Metrics
- Server response time and reliability
- Application crash frequency
- Match completion rate
- Feature usage statistics

### 6.3 Business Metrics
- User acquisition cost
- Conversion rate to premium features
- Revenue per user
- Overall platform growth

## 7. Monetization Strategy

### 7.1 Freemium Model
- Core racing functionality free for all users
- Premium subscription with enhanced features
- Tournament entry fees with prize pools
- Ad-supported free tier

### 7.2 Premium Features
- Advanced analytics and insights
- Exclusive car skins and customizations
- Ad-free experience
- Private tournament hosting capabilities
- Priority matchmaking

## 8. Implementation Timeline

### 8.1 Phase 1 - MVP (Months 0-3)
- Core racing functionality
- Basic user accounts
- Fundamental race visualization
- Initial matchmaking system
- Web platform release

### 8.2 Phase 2 - Enhancement (Months 4-6)
- Mobile application development
- Advanced statistics implementation
- Social features and friend system
- Expanded text library
- Customization options

### 8.3 Phase 3 - Expansion (Months 7-12)
- Tournament system
- Team/clan features
- Desktop application release
- Advanced customization options
- API for third-party integration

## 9. Risks and Mitigation

### 9.1 Technical Risks
- **Risk:** Latency issues affecting race fairness
  - **Mitigation:** Regional servers, optimized networking code
- **Risk:** Cheating or automation tools
  - **Mitigation:** Pattern detection, replay analysis, reporting system

### 9.2 Market Risks
- **Risk:** Competition from established platforms
  - **Mitigation:** Unique features, superior UX, targeted marketing
- **Risk:** Low user acquisition
  - **Mitigation:** Freemium model, social sharing incentives

## 10. Appendix

### 10.1 User Interface Mockups
- Key screens including racing visualization as per provided image reference
- Dashboard design
- Profile and statistics views
- Customization interfaces

### 10.2 Competitive Analysis
- Feature comparison with similar typing games and other competitors
- Market positioning strategy
- Unique value propositions

### 10.3 Technical Architecture
- System design diagram
- Database schema
- API documentation
- Third-party service dependencies