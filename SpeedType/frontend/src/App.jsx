import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import io from 'socket.io-client'
import './App.css'
import RaceTrack from './components/RaceTrack'
import TypingArea from './components/TypingArea'
import packageJson from '../package.json'

// Connect to the local backend server for development
const socket = io('http://localhost:3001', {
  transports: ['websocket', 'polling'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
})

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

  // Fetch motivational quotes
  const fetchQuotes = async () => {
    setIsLoadingQuotes(true);
    try {
      const response = await fetch('http://localhost:3001/api/quotes');
      if (!response.ok) {
        throw new Error('Failed to fetch quotes');
      }
      const data = await response.json();
      setQuotes(data);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      // Fallback to local quotes if API fails
      const shuffledQuotes = shuffle([...fallbackQuotes]).slice(0, 5);
      setQuotes(shuffledQuotes);
    } finally {
      setIsLoadingQuotes(false);
    }
  };

  // Fetch quotes when component mounts
  useEffect(() => {
    fetchQuotes();
  }, []);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true)
      console.log('Connected to backend')
      // If we're in a room, rejoin it
      if (currentRoom) {
        socket.emit('joinRoom', currentRoom)
      }
    }

    function onDisconnect() {
      setIsConnected(false)
      console.log('Disconnected from backend')
      setTextToType('')
      setRacers([])
      setMyProgress(0)
      setRaceState('waiting')
      setCustomText('')
      setMyWpm(0)
      setCountdown(0)
    }

    function onRoomState(state) {
      console.log('Received room state:', state)
      // Only update race state if we're not already finished
      if (raceState !== 'finished') {
        setRaceState(state.status)
      }
    }

    function onRaceUpdate(updatedRacers) {
      console.log('Received race update:', updatedRacers)
      // Find our racer
      const myRacer = updatedRacers.find(r => r.id === socket.id);
      
      // Update other racers without affecting our state
      setRacers(currentRacers => {
        const otherRacers = updatedRacers.filter(r => r.id !== socket.id);
        const me = currentRacers.find(r => r.id === socket.id) || myRacer;
        
        // If we're finished, ensure our progress stays at 100%
        if (raceState === 'finished' && me) {
          me.progress = 100;
        }
        
        return [...otherRacers, me];
      });
    }

    function onCountdown(value) {
      console.log('Countdown:', value);
      setCountdown(value);
      
      // Reset state and ensure text is set at countdown start
      if (value === 3) {
        console.log('Countdown started, resetting state');
        setMyProgress(0);
        setTypedText('');
        setMyWpm(0);
      }
      
      // Start race when countdown ends
      if (value === 0) {
        console.log('Countdown ended, starting race with text:', textToType);
        setRaceState('racing');
        // Ensure text is set
        if (!textToType) {
          console.error('No text set when countdown ended');
        }
      }
    }

    function onReceiveText(text) {
      console.log('Received text:', text);
      if (typeof text === 'string' && text.trim()) {
        const formattedText = text.trim();
        console.log('Setting received text:', formattedText);
        setTextToType(formattedText);
      } else {
        console.error('Invalid text received:', text);
      }
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('room_state', onRoomState)
    socket.on('race_text', onReceiveText)
    socket.on('race_update', onRaceUpdate)
    socket.on('countdown', onCountdown)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('room_state', onRoomState)
      socket.off('race_text', onReceiveText)
      socket.off('race_update', onRaceUpdate)
      socket.off('countdown', onCountdown)
    }
  }, [currentRoom, raceState, textToType])

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

  // Handler for the Start Race button
  const handleStartRace = () => {
    const raceText = customText.trim() || quotes[Math.floor(Math.random() * quotes.length)] || fallbackQuotes[0];
    console.log('Starting race with text:', raceText);
    
    // Create unique room and join it
    const singlePlayerRoom = `single-player-${Date.now()}`;
    console.log('Creating room:', singlePlayerRoom);
    
    // Initialize race state before joining room
    setRaceState('waiting');
    setMyProgress(0);
    setTypedText('');
    setMyWpm(0);
    setTextToType(raceText);
    
    // Set initial racer state
    setRacers([{
      id: socket.id,
      name: 'You',
      progress: 0,
      wpm: 0
    }]);

    // Join room and handle race start
    socket.emit('joinRoom', singlePlayerRoom);
    setCurrentRoom(singlePlayerRoom);

    // Listen for room joined event
    socket.once('roomJoined', () => {
      console.log('Room joined, submitting text:', raceText);
      // Submit text and emit ready state
      socket.emit('submit_custom_text', raceText);
      // Mark player as ready after a short delay to ensure text is received
      setTimeout(() => {
        console.log('Marking player as ready');
        socket.emit('ready');
      }, 500);
    });
  };

  const handleQuoteSelect = (quote) => {
    setCustomText(quote);
  };

  const handleReady = () => {
    console.log('Player ready');
    if (!currentRoom) {
      const roomId = 'default-room';
      console.log('Joining default room:', roomId);
      socket.emit('joinRoom', roomId);
      setCurrentRoom(roomId);
    }
    socket.emit('ready');
  };

  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <h1>
            SpeedType Racing
            <span className="version">v{packageJson.version}</span>
          </h1>
        </header>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
        <Routes>
          <Route path="/" element={<Navigate to="/race" replace />} />
          <Route
            path="/race"
            element={
              <div className="race-container">
                <h1>SpeedType Racing</h1>
                {/* Show setup screen only when in waiting state and no countdown */}
                {raceState === 'waiting' && countdown === 0 && (
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
                        onClick={() => window.location.href = '/race/multiplayer'}
                        disabled={!isConnected}
                      >
                        Join Multiplayer Race
                      </button>
                    </div>
                  </div>
                )}
                {/* Show countdown overlay when countdown is active */}
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
                {/* Show race components when text is available and either countdown is active or race is in progress */}
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
                      isMultiplayer={false}
                    />
                  </>
                )}
              </div>
            }
          />
          <Route
            path="/race/multiplayer"
            element={
              <div className="race-container">
                <h1>Multiplayer Race</h1>
                {raceState === 'waiting' ? (
                  <div className="multiplayer-waiting">
                    <h2>Waiting for Players</h2>
                    <button 
                      className="ready-button"
                      onClick={handleReady}
                      disabled={!isConnected}
                    >
                      Ready to Race
                    </button>
                  </div>
                ) : (
                  <>
                    {countdown > 0 && (
                      <div className="countdown-overlay">
                        <div className="countdown">{countdown}</div>
                      </div>
                    )}
                    <RaceTrack 
                      racers={racers} 
                      myProgress={myProgress} 
                      countdown={countdown}
                      isReady={true}
                      onReady={handleReady}
                      raceState={raceState}
                    />
                    <TypingArea
                      textToType={textToType}
                      onProgress={handleTypingProgress}
                      typedText={typedText}
                      setTypedText={setTypedText}
                      isRaceComplete={raceState === 'finished'}
                      isStarted={raceState === 'racing'}
                    />
                  </>
                )}
              </div>
            }
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
