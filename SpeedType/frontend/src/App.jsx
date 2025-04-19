import { useState, useEffect, useCallback, useRef } from 'react'
import io from 'socket.io-client'
import './App.css'
import RaceTrack from './components/RaceTrack'
import TypingArea from './components/TypingArea'
import { APP_VERSION } from './config/version'
import { config } from './config/env'

// Test change that should trigger version bump
// Debug logging for Socket.IO configuration
console.log('Socket.IO Configuration:', {
  backendUrl: config.BACKEND_URL,
  socketConfig: config.SOCKET_CONFIG,
  timeout: config.SOCKET_TIMEOUT,
  environment: import.meta.env.MODE
});

// Third test change to reach the 3-commit threshold for version bump
// Create socket with configuration from env
let socket;
try {
  // Force polling first to ensure connection
  const socketConfig = {
    ...config.SOCKET_CONFIG,
    timeout: config.SOCKET_TIMEOUT,
    autoConnect: false, // Prevent auto-connection before we're ready
    transports: ['polling'], // Start with polling only
    withCredentials: true,
    extraHeaders: {
      'X-Client-Version': '1.0.1'
    },
    // Another test change that should trigger the version bump workflow
    reconnectionAttempts: 3,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 5000,
    randomizationFactor: 0.3
  };

  socket = io(config.BACKEND_URL, socketConfig);

  // Debug socket events
  socket.on('connect_error', (error) => {
    console.error('Socket.IO Connect Error:', {
      message: error.message,
      type: error.type,
      transport: socket.io.engine?.transport?.name,
      url: config.BACKEND_URL
    });
  });

  socket.on('error', (error) => {
    console.error('Socket.IO Error:', error);
  });

  socket.io.on('reconnect_attempt', (attempt) => {
    console.log('Socket.IO Reconnection Attempt:', attempt);
    // Reset game state on reconnection attempts
    resetGameState();
  });

  // After successful polling connection, enable WebSocket upgrade
  socket.on('connect', () => {
    console.log('Socket.IO Connected with transport:', socket.io.engine?.transport?.name);
    
    // Enable WebSocket upgrade after successful polling connection
    socket.io.opts.transports = ['polling', 'websocket'];
  });

  // Start the connection
  socket.connect();
} catch (error) {
  console.error('Socket.IO Initialization Error:', error);
  socket = null;
}

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

function App({ initialMultiplayer = false }) {
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
  const [isMultiplayer, setIsMultiplayer] = useState(initialMultiplayer)
  const [isJoiningRoom, setIsJoiningRoom] = useState(false)
  const lastProgressRef = useRef(0);
  const lastWpmRef = useRef(0);

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

  // Add useEffect to fetch quotes on mount
  useEffect(() => {
    console.log('Fetching initial quotes');
    fetchQuotes();
  }, []); // Empty dependency array means this runs once on mount

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
      
      // Only update race state if it's a valid transition
      if (state.status === 'waiting' && raceState !== 'waiting') {
        setRaceState('waiting');
        setCountdown(0);
      } else if (state.status === 'racing' && raceState === 'waiting') {
        setRaceState('racing');
      } else if (state.status === 'finished' && raceState === 'racing') {
        setRaceState('finished');
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
          // Preserve non-zero WPM values when race is finished
          if (myRacer.wpm === 0 && lastWpmRef.current > 0) {
            myRacer.wpm = lastWpmRef.current;
          }
        }
        
        return [...otherRacers, myRacer].filter(Boolean);
      });
    }

    function onCountdown(value) {
      console.log('Countdown:', value);
      
      // Prevent countdown updates if we're in an invalid state
      if (!isConnected || !textToType) {
        console.log('Ignoring countdown update due to invalid state');
        return;
      }

      setCountdown(value);
      
      if (value === 3) {
        console.log('Race starting, resetting state');
        setMyProgress(0);
        setTypedText('');
        setMyWpm(0);
      }
      
      if (value === 0) {
        console.log('Race beginning with text:', textToType);
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
      setCountdown(0);
      
      // Join room with timeout
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Room join timeout'));
        }, config.SOCKET_TIMEOUT);

        socket.emit('joinRoom', singlePlayerRoom);
        setCurrentRoom(singlePlayerRoom);

        socket.once('roomJoined', () => {
          clearTimeout(timeout);
          // Set text and racers after room join
          setTextToType(raceText);
          setRacers([{
            id: socket.id,
            name: 'You',
            progress: 0,
            wpm: 0
          }]);
          
          // Submit text and emit ready after a short delay
          setTimeout(() => {
            if (!socket.connected) {
              reject(new Error('Socket disconnected'));
              return;
            }
            socket.emit('submit_custom_text', raceText);
            // Wait for text to be processed before sending ready
            setTimeout(() => {
              if (!socket.connected) {
                reject(new Error('Socket disconnected'));
                return;
              }
              socket.emit('ready');
              resolve();
            }, 500);
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
      
      // Ensure socket is connected before proceeding
      if (!socket.connected) {
        console.log('Socket not connected, attempting to connect...');
        socket.connect();
        
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Socket connection timeout'));
          }, config.SOCKET_TIMEOUT);
          
          socket.once('connect', () => {
            clearTimeout(timeout);
            console.log('Socket connected successfully');
            resolve();
          });
        });
      }
      
      const roomId = 'default-room';
      console.log('Joining multiplayer room:', roomId);
      
      try {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Room join timeout'));
          }, config.SOCKET_TIMEOUT);
          
          // First try to join the room
          socket.emit('joinRoom', roomId);
          setCurrentRoom(roomId);
          
          socket.once('roomJoined', (data) => {
            clearTimeout(timeout);
            console.log('Joined room successfully:', data);
            
            // After joining room, signal ready state
            setTimeout(() => {
              console.log('Emitting ready signal');
              socket.emit('ready');
              resolve();
            }, 500); // Small delay to ensure room state is processed
          });
        });
        
        console.log('Ready state signaled successfully');
      } catch (error) {
        console.error('Failed to handle multiplayer ready state:', error);
        setConnectionError(`Failed to join multiplayer: ${error.message}`);
        resetGameState();
      }
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
    window.history.pushState({}, '', '/race/multiplayer');
  };

  const backToSinglePlayer = () => {
    if (currentRoom) {
      socket.emit('leaveRoom', currentRoom);
    }
    setIsMultiplayer(false);
    resetGameState();
    window.history.pushState({}, '', '/');
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
        wpm: wpm > 0 ? wpm : lastWpmRef.current // Use last WPM if current is 0
      };
      return [...otherRacers, me];
    });
    
    // Debounce socket updates to prevent flooding
    // Send progress update immediately if it's a significant change
    if (Math.abs(progress - lastProgressRef.current) >= 5 || progress === 100) {
      lastProgressRef.current = progress;
      socket.emit('progress_update', { progress });
    }
    
    // Send WPM update only on significant changes
    if (Math.abs(wpm - lastWpmRef.current) >= 5 || wpm > 0) {
      // Store the WPM if it's valid (non-zero)
      if (wpm > 0) {
        lastWpmRef.current = wpm;
      }
      socket.emit('wpm_update', { wpm: wpm > 0 ? wpm : lastWpmRef.current });
    }

    // Check if race is complete
    if (progress >= 100) {
      socket.emit('progress_update', { progress: 100 });
      // Make sure we're sending a valid WPM value when race completes
      if (wpm === 0 && lastWpmRef.current > 0) {
        socket.emit('wpm_update', { wpm: lastWpmRef.current });
      } else {
        socket.emit('wpm_update', { wpm });
      }
      
      // Notify server that we finished
      socket.emit('race_complete');
    }
  };

  const handleQuoteSelect = (quote) => {
    setCustomText(quote);
  };

  // Initialize multiplayer mode from route if specified
  useEffect(() => {
    if (initialMultiplayer && isConnected) {
      // Only auto-join multiplayer if we're connected
      // Similar to startMultiplayerMode but doesn't need to push state
      setIsMultiplayer(true);
      resetGameState();
    }
  }, [initialMultiplayer, isConnected, resetGameState]);

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
        <div className="connection-status-container">
          <span className="connection-status" data-testid="connection-status">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          {connectionError && <div className="connection-error">{connectionError}</div>}
        </div>
      </header>
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
