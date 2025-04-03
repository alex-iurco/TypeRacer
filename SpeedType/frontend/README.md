# SpeedType Frontend

The frontend application for SpeedType, a real-time multiplayer typing race game.

## Technology Stack
- React 18
- Vite
- Socket.IO Client
- CSS3 for styling

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```
The development server will start at http://localhost:3000

## Building for Production

```bash
npm run build
```

The build output will be in the `dist` directory.

## Deployment

The frontend is automatically deployed to GitHub Pages using GitHub Actions when changes are pushed to the main branch. The deployment workflow:

1. Builds the React application
2. Configures the custom domain (speedtype.robocat.ai)
3. Deploys to GitHub Pages
4. Verifies the deployment

### Custom Domain Setup

The application is served from https://speedtype.robocat.ai with:
- CNAME record pointing to alex-iurco.github.io
- Automatic HTTPS enabled
- GitHub Pages configuration in repository settings

## Environment Configuration

The application connects to the backend service at:
- Production: https://speedtype-backend-production.up.railway.app
- Development: http://localhost:3001

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build locally

## Project Structure

```
src/
├── components/
│   ├── RaceTrack/
│   │   ├── RaceTrack.jsx
│   │   └── RaceTrack.css
│   ├── TypingArea/
│   │   ├── TypingArea.jsx
│   │   └── TypingArea.css
│   └── CarIcon/
│       └── CarIcon.jsx
├── App.jsx
└── main.jsx
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

For detailed contribution guidelines, see the main repository README.
