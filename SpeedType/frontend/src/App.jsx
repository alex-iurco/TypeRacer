import { useState, useEffect, useCallback } from 'react'
import io from 'socket.io-client'
import './App.css'
import RaceTrack from './components/RaceTrack'
import TypingArea from './components/TypingArea'
import { APP_VERSION } from './config/version'
import { config } from './config/env'

// Create socket with configuration from env
const socket = io(config.BACKEND_URL, {
  ...config.SOCKET_CONFIG,
  timeout: config.SOCKET_TIMEOUT
});

// Utility function for handling promises with timeout
const withTimeout = (promise, ms = config.SOCKET_TIMEOUT) => {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Operation timed out')), ms);
  });
  return Promise.race([promise, timeout]);
};

// Utility function to ensure socket is ready
const ensureSocketReady = () => {
  return new Promise((resolve) => {
    if (socket.connected) {
      resolve();
    } else {
      socket.once('connect', resolve);
    }
  });
};

// Fisher-Yates shuffle algorithm
const shuffle = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex > 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

const fallbackQuotes = [
  '"Success is not final, failure is not fatal: it is the courage to continue that counts. Every day may not be good, but there is something good in every day. Keep your face always toward the sunshine, and shadows will fall behind you." - Winston Churchill',
  '"The future depends on what you do today. Yesterday is history, tomorrow is a mystery, but today is a gift. That is why it is called the present. Make the most of yourself, for that is all there is of you." - Mahatma Gandhi',
  '"Life is like riding a bicycle. To keep your balance, you must keep moving. Just as energy is the basis of life itself, and ideas the source of innovation, so is innovation the vital spark of all human change, improvement, and progress." - Albert Einstein',
  '"The only limit to our realization of tomorrow will be our doubts of today. Success is walking from failure to failure with no loss of enthusiasm. The harder you work for something, the greater you will feel when you achieve it." - George Addair',
  '"It does not matter how slowly you go as long as you do not stop. Our greatest glory is not in never falling, but in rising every time we fall. Life is not about waiting for the storm to pass but learning to dance in the rain." - Confucius',
  '"Twenty years from now you will be more disappointed by the things that you did not do than by the ones you did do. So throw off the bowlines. Sail away from the safe harbor. Catch the trade winds in your sails. Explore. Dream. Discover." - Mark Twain',
  '"The best way to predict the future is to create it. Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful. The journey of a thousand miles begins with one step." - Peter Drucker',
  '"What lies behind us and what lies before us are tiny matters compared to what lies within us. The only person you are destined to become is the person you decide to be. Be yourself; everyone else is already taken." - Ralph Waldo Emerson',
  '"Do not watch the clock; do what it does. Keep going. The difference between ordinary and extraordinary is that little extra. The harder you work for something, the greater you will feel when you achieve it." - Sam Levenson',
  '"Your time is limited, do not waste it living someone else\'s life. Do not be trapped by dogma, which is living with the results of other people\'s thinking. Do not let the noise of other\'s opinions drown out your own inner voice." - Steve Jobs',
  '"The only impossible journey is the one you never begin. Life is not measured by the number of breaths we take, but by the moments that take our breath away. The purpose of our lives is to be happy and to make others happy." - Anthony Robbins',
  '"Success usually comes to those who are too busy to be looking for it. The future belongs to those who believe in the beauty of their dreams. Hard work beats talent when talent does not work hard." - Henry David Thoreau',
  '"The greatest glory in living lies not in never falling, but in rising every time we fall. Education is not preparation for life; education is life itself. The beautiful thing about learning is that no one can take it away from you." - Nelson Mandela',
  '"Everything you have ever wanted is on the other side of fear. Success is walking from failure to failure with no loss of enthusiasm. The only way to do great work is to love what you do." - George Addair',
  '"You are never too old to set another goal or to dream a new dream. The future depends on what you do today. Do not let yesterday take up too much of today. Life is what happens while you are busy making other plans." - C.S. Lewis'
];

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected)
  const [connectionError, setConnectionError] = useState(null)
  const [raceState, setRaceState] = useState('waiting') // 'waiting', 'racing', 'finished'
  const [textToType, setTextToType] = useState('')
  const [racers, setRacers] = useState([])
  const [myProgress, setMyProgress] = useState(0)
  const [customText, setCustomText] = useState('') // State for the text area
  const [typedText, setTypedText] = useState('') // Add state for the input field content
  const [myWpm, setMyWpm] = useState(0) // Add state for WPM
  const [quotes, setQuotes] = useState([])
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false)
  const [countdown, setCountdown] = useState(0) // Add state for countdown
  const [currentRoom, setCurrentRoom] = useState(null)
  const [isMultiplayer, setIsMultiplayer] = useState(false)
  const [isJoiningRoom, setIsJoiningRoom] = useState(false)

  // Reset game state
  const resetGameState = useCallback(() => {
    setRaceState('waiting')
    setTextToType('')
    setRacers([])
    setMyProgress(0)
    setTypedText('')
    setMyWpm(0)
    setCountdown(0)
    setCurrentRoom(null)
    setConnectionError(null)
  }, []);

  // Fetch quotes with error handling and retries
  const fetchQuotes = async (retries = 3) => {
    setIsLoadingQuotes(true);
    try {
      const response = await withTimeout(
        fetch(`${config.BACKEND_URL}/api/quotes`),
        config.SOCKET_TIMEOUT
      );
      if (!response.ok) {
        throw new Error('Failed to fetch quotes');
      }
      const data = await response.json();
      setQuotes(data);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      if (retries > 0 && error.message === 'Operation timed out') {
        setTimeout(() => fetchQuotes(retries - 1), config.RETRY_DELAY);
        return;
      }
      // Fallback to local quotes if all retries fail
      const shuffledQuotes = shuffle([...fallbackQuotes]).slice(0, 5);
      setQuotes(shuffledQuotes);
    } finally {
      setIsLoadingQuotes(false);
    }
  };

  // Socket event handlers with error recovery
  useEffect(() => {
    function onConnect() {
      console.log('Connected to backend');
      setIsConnected(true);
      setConnectionError(null);
      
      // Attempt to rejoin room if we were in one
      if (currentRoom) {
        socket.emit('joinRoom', currentRoom);
      }
    }

    function onDisconnect(reason) {
      console.log('Disconnected from backend:', reason);
      setIsConnected(false);
      setConnectionError(`Connection lost: ${reason}`);
      resetGameState();
    }

    function onConnectError(error) {
      console.error('Connection error:', error);
      setConnectionError(`Failed to connect: ${error.message}`);
      setIsConnected(false);
    }

    function onError(error) {
      console.error('Socket error:', error);
      setConnectionError(`Socket error: ${error.message}`);
    }

    function onRoomState(state) {
      console.log('Room state:', state);
      if (state.error) {
        setConnectionError(`Room error: ${state.error}`);
        return;
      }
      if (raceState !== 'finished') {
        setRaceState(state.status);
      }
    }

    function onRaceUpdate(updatedRacers) {
      if (!Array.isArray(updatedRacers)) {
        console.error('Invalid race update:', updatedRacers);
        return;
      }

      setRacers(currentRacers => {
        const myRacer = updatedRacers.find(r => r.id === socket.id) || 
                       currentRacers.find(r => r.id === socket.id);
        const otherRacers = updatedRacers.filter(r => r.id !== socket.id);
        
        if (raceState === 'finished' && myRacer) {
          myRacer.progress = 100;
        }
        
        return [...otherRacers, myRacer].filter(Boolean);
      });
    }

    function onCountdown(value) {
      console.log('Countdown:', value);
      setCountdown(value);
      
      if (value === 3) {
        console.log('Race starting, resetting state');
        setMyProgress(0);
        setTypedText('');
        setMyWpm(0);
      }
      
      if (value === 0) {
        console.log('Race beginning with text:', textToType);
        if (!textToType) {
          setConnectionError('No text received for race');
          resetGameState();
          return;
        }
        setRaceState('racing');
      }
    }

    function onReceiveText(text) {
      console.log('Received race text');
      if (typeof text !== 'string' || !text.trim()) {
        setConnectionError('Invalid race text received');
        return;
      }
      setTextToType(text.trim());
    }

    // Register event handlers
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('error', onError);
    socket.on('room_state', onRoomState);
    socket.on('race_text', onReceiveText);
    socket.on('race_update', onRaceUpdate);
    socket.on('countdown', onCountdown);

    return () => {
      // Cleanup event handlers
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('error', onError);
      socket.off('room_state', onRoomState);
      socket.off('race_text', onReceiveText);
      socket.off('race_update', onRaceUpdate);
      socket.off('countdown', onCountdown);
    };
  }, [currentRoom, raceState, textToType, resetGameState]);

  // Handle race start with proper error handling
  const handleStartRace = async () => {
    try {
      if (!isConnected) {
        throw new Error('Not connected to server');
      }
      
      if (isJoiningRoom) {
        return;
      }
      
      setIsJoiningRoom(true);
      setConnectionError(null);
      
      // Ensure socket is connected
      await withTimeout(ensureSocketReady(), config.SOCKET_TIMEOUT);
      
      const raceText = customText.trim() || quotes[Math.floor(Math.random() * quotes.length)] || fallbackQuotes[0];
      console.log('Starting race');
      
      const singlePlayerRoom = `single-player-${Date.now()}`;
      
      // Reset state
      setRaceState('waiting');
      setMyProgress(0);
      setTypedText('');
      setMyWpm(0);
      setTextToType(raceText);
      
      setRacers([{
        id: socket.id,
        name: 'You',
        progress: 0,
        wpm: 0
      }]);

      // Join room with timeout
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Room join timeout'));
        }, config.SOCKET_TIMEOUT);

        socket.emit('joinRoom', singlePlayerRoom);
        setCurrentRoom(singlePlayerRoom);

        socket.once('roomJoined', () => {
          clearTimeout(timeout);
          socket.emit('submit_custom_text', raceText);
          setTimeout(() => {
            socket.emit('ready');
            resolve();
          }, config.RETRY_DELAY);
        });
      });
    } catch (error) {
      console.error('Failed to start race:', error);
      setConnectionError(`Failed to start race: ${error.message}`);
      resetGameState();
    } finally {
      setIsJoiningRoom(false);
    }
  };

  // Handle multiplayer ready state with error handling
  const handleReady = async () => {
    try {
      if (!isConnected) {
        throw new Error('Not connected to server');
      }
      
      if (isJoiningRoom) {
        return;
      }
      
      setIsJoiningRoom(true);
      setConnectionError(null);
      
      await withTimeout(ensureSocketReady(), config.SOCKET_TIMEOUT);
      
      const roomId = 'default-room';
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Room join timeout'));
        }, config.SOCKET_TIMEOUT);

        socket.emit('joinRoom', roomId);
        setCurrentRoom(roomId);

        socket.once('roomJoined', () => {
          clearTimeout(timeout);
          setTimeout(() => {
            socket.emit('ready');
            resolve();
          }, config.RETRY_DELAY);
        });
      });
    } catch (error) {
      console.error('Failed to join multiplayer:', error);
      setConnectionError(`Failed to join multiplayer: ${error.message}`);
      resetGameState();
    } finally {
      setIsJoiningRoom(false);
    }
  };

  // Navigation handling
  useEffect(() => {
    const handlePopState = () => {
      if (isMultiplayer) {
        backToSinglePlayer();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isMultiplayer]);

  const startMultiplayerMode = () => {
    if (!isConnected) {
      setConnectionError('Cannot start multiplayer: not connected');
      return;
    }
    setIsMultiplayer(true);
    resetGameState();
    window.history.pushState({}, '', window.location.pathname);
  };

  const backToSinglePlayer = () => {
    if (currentRoom) {
      socket.emit('leaveRoom', currentRoom);
    }
    setIsMultiplayer(false);
    resetGameState();
  };

  const handleTypingProgress = (progress, currentInput, wpm) => {
    if (raceState !== 'racing' && raceState !== 'finished') return;
    if (raceState === 'finished') return; // Don't process updates if race is finished

    setTypedText(currentInput);
    
    // Update our local state
    setMyProgress(progress);
    setMyWpm(wpm);
    
    // Update our racer in the list
    setRacers(currentRacers => {
      const otherRacers = currentRacers.filter(r => r.id !== socket.id);
      const me = { 
        ...currentRacers.find(r => r.id === socket.id),
        progress,
        wpm
      };
      return [...otherRacers, me];
    });
    
    // Send updates to server
    socket.emit('progress_update', { progress });
    socket.emit('wpm_update', { wpm });

    // Check if race is complete
    if (progress >= 100) {
      setRaceState('finished');
      socket.emit('progress_update', { progress: 100 });
      socket.emit('wpm_update', { wpm });
      
      // Notify server that we finished
      socket.emit('race_complete');
    }
  };

  const handleQuoteSelect = (quote) => {
    setCustomText(quote);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>
          SpeedType Racing
          <span className="version">v{APP_VERSION}</span>
          <span className={`env-indicator ${import.meta.env.MODE}`}>
            {import.meta.env.MODE}
          </span>
        </h1>
      </header>
      <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? 'Connected' : 'Disconnected'}
      </div>
      {connectionError && (
        <div className="error-message">
          {connectionError}
        </div>
      )}
      <div className="race-container">
        {!isMultiplayer && raceState === 'waiting' && countdown === 0 && (
          <div className="race-setup">
            <div className="quote-selection">
              <h2>Select a Quote or Type Your Own</h2>
              <div className="quotes-grid">
                {isLoadingQuotes ? (
                  <p>Loading quotes...</p>
                ) : (
                  quotes.map((quote, index) => (
                    <div
                      key={index}
                      className={`quote-card ${customText === quote ? 'selected' : ''}`}
                      onClick={() => handleQuoteSelect(quote)}
                    >
                      <p>{quote.length > 100 ? quote.substring(0, 100) + '...' : quote}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="custom-text-input">
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Or type your own text here..."
                  rows={4}
                />
              </div>
              <button 
                className="start-button"
                onClick={handleStartRace}
                disabled={!isConnected}
              >
                Start Single Player Race
              </button>
              <button 
                className="multiplayer-button"
                onClick={startMultiplayerMode}
                disabled={!isConnected}
              >
                Join Multiplayer Race
              </button>
            </div>
          </div>
        )}

        {isMultiplayer && raceState === 'waiting' && (
          <div className="multiplayer-waiting">
            <h2>Multiplayer Race</h2>
            <div className="multiplayer-controls">
              <button 
                className="ready-button"
                onClick={handleReady}
                disabled={!isConnected}
              >
                Ready to Race
              </button>
              <button 
                className="back-button"
                onClick={backToSinglePlayer}
              >
                Back to Single Player
              </button>
            </div>
          </div>
        )}

        {countdown > 0 && (
          <div className="countdown-overlay">
            <div className="countdown">{countdown}</div>
            {textToType && (
              <div className="race-text" data-testid="race-text">
                {textToType}
              </div>
            )}
          </div>
        )}

        {textToType && (countdown > 0 || raceState === 'racing' || raceState === 'finished') && (
          <>
            <RaceTrack 
              racers={racers} 
              myProgress={myProgress} 
              countdown={countdown}
              isReady={true}
              raceState={raceState}
            />
            <TypingArea
              textToType={textToType}
              onProgress={handleTypingProgress}
              typedText={typedText}
              setTypedText={setTypedText}
              onStart={handleStartRace}
              isRaceComplete={raceState === 'finished'}
              isStarted={raceState === 'racing' || countdown > 0}
              isMultiplayer={isMultiplayer}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App
