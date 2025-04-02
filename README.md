# SpeedType - Real-time Multiplayer Typing Race Game

A competitive typing application where users race against each other by typing provided text as quickly and accurately as possible. Progress is visually represented by cars moving across the screen, with real-time performance metrics.

Current Version: v1.0.1

## Live Demo
- Frontend: https://speedtype.robocat.ai
- Backend: https://speedtype-backend-production.up.railway.app

## Features

### Core Racing Experience
- Real-time multiplayer racing with visual car progression
- Character-by-character typing feedback with color coding:
  - Untyped: Dimmed (#666)
  - Correct: Light green (#a0d9a0)
  - Incorrect: Light red (#d9a0a0) with dark red background (#4d3030)
- Word-level error detection and visual feedback
- WPM (Words Per Minute) display at finish line
- Place rankings (1st, 2nd, 3rd) upon race completion
- Custom text input support
- Dark theme optimized for readability
- Version display for tracking updates

### Race Track Visualization
- SVG car icons with unique colors per racer
- Smooth animations for car movement
- Dashed lane separators
- Real-time WPM statistics
- Responsive layout for different screen sizes

## Technology Stack

### Frontend
- React with Vite
- Socket.IO client for real-time communication
- CSS3 for styling and animations
- GitHub Pages for hosting

### Backend
- Node.js
- Express
- Socket.IO for real-time race updates
- Railway for hosting

## Getting Started

### Prerequisites
- Node.js (v18.19.1 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/alex-iurco/SpeedType.git
cd SpeedType
```

2. Install backend dependencies:
```bash
cd SpeedType/backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Development Setup

1. Start the backend server locally (optional, as production uses Railway):
```bash
cd SpeedType/backend
node server.js
```
The server will start on port 3001.

2. Start the frontend development server:
```bash
cd SpeedType/frontend
npm run dev
```
The frontend will be available at http://localhost:5173

### Production Deployment

The application is deployed using:
- Frontend: GitHub Pages with custom domain (speedtype.robocat.ai)
- Backend: Railway with automatic deployments
- Custom domain configuration with proper SSL/HTTPS support

For detailed deployment instructions, see the [Product Requirements Document](prd.md).

### Network Access
For local development, the backend server listens on all network interfaces (0.0.0.0).
In production, the application uses:
- Frontend: https://speedtype.robocat.ai
- Backend: https://speedtype-backend-production.up.railway.app

## Development

### Project Structure
```
SpeedType/
├── backend/
│   ├── server.js
│   ├── railway.toml
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── RaceTrack.jsx
    │   │   ├── RaceTrack.css
    │   │   ├── TypingArea.jsx
    │   │   ├── TypingArea.css
    │   │   └── CarIcon.jsx
    │   ├── App.jsx
    │   └── main.jsx
    ├── public/
    │   └── CNAME
    └── package.json
```

### Key Components

#### RaceTrack
- Visualizes race progress with car icons
- Displays WPM at finish line
- Shows place rankings upon completion

#### TypingArea
- Handles text input and validation
- Provides real-time typing feedback
- Calculates WPM and accuracy

#### CarIcon
- SVG-based car visualization
- Supports custom colors per racer

## Future Enhancements
(As per PRD)
- User authentication and profiles
- Skill-based matchmaking
- Tournament system
- Advanced statistics and analytics
- Social features and leaderboards
- Customization options (car skins, themes)
- Learning resources and practice modes

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments
- Inspired by the original SpeedType game
- Built with modern web technologies
- Focused on user experience and real-time feedback 