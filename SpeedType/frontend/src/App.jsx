import { useState, useEffect } from 'react'
import io from 'socket.io-client'
import './App.css'
import RaceTrack from './components/RaceTrack'
import TypingArea from './components/TypingArea'

// Connect to the backend server on Railway
const socket = io('https://speedtype-backend-production.up.railway.app', {
  secure: true,
  rejectUnauthorized: false, // Only use this in development
  transports: ['websocket', 'polling'],
  withCredentials: true,
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
  '"The only limit to our realization of tomorrow will be our doubts of today. Let us move forward with strong and active faith. Courage is not having the strength to go on; it is going on when you do not have the strength." - Franklin D. Roosevelt',
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

  // Fetch motivational quotes
  const fetchQuotes = () => {
    setIsLoadingQuotes(true);
    // Get 5 random quotes using Fisher-Yates shuffle
    const shuffledQuotes = shuffle([...fallbackQuotes]).slice(0, 5);
    console.log('Selected quotes:', shuffledQuotes);
    setQuotes(shuffledQuotes);
    setIsLoadingQuotes(false);
  };

  // Fetch quotes when component mounts
  useEffect(() => {
    fetchQuotes();
  }, []);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true)
      console.log('Connected to backend')
      // Don't request text automatically anymore
      // socket.emit('request_text')
      // Request current state if already racing?
      // socket.emit('get_race_state') // Could be added later
    }

    function onDisconnect() {
      setIsConnected(false)
      console.log('Disconnected from backend')
      setTextToType('')
      setRacers([])
      setMyProgress(0)
      setRaceState('waiting') // Reset state
      setCustomText('')
      setMyWpm(0) // Reset WPM
    }

    function onReceiveText(text) {
      console.log('Received text to start race:', text)
      setTextToType(text)
      setMyProgress(0)
      setTypedText('') // Clear local typed text
      setRaceState('racing') // Start the race visually
      // The backend should now send the initial racer list with the text or in the first race_update
      // setRacers([{ id: socket.id, name: 'You', progress: 0 }]) // Remove this, rely on backend
    }

    function onRaceUpdate(updatedRacers) {
      // Ensure the local user's name is set correctly if they join mid-race or reconnect
      const localRacerIndex = updatedRacers.findIndex(r => r.id === socket.id)
      if (localRacerIndex !== -1 && updatedRacers[localRacerIndex].name !== 'You') {
        updatedRacers[localRacerIndex].name = 'You'
      }
      setRacers(updatedRacers)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('race_text', onReceiveText)
    socket.on('race_update', onRaceUpdate)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('race_text', onReceiveText)
      socket.off('race_update', onRaceUpdate)
    }
  }, [])

  const handleTypingProgress = (progress, currentInput, wpm) => {
    if (raceState !== 'racing') return

    setTypedText(currentInput) // Update local state from TypingArea
    setMyProgress(progress)
    setMyWpm(wpm) // Update WPM state
    // Update local racer state immediately for responsiveness
    setRacers(currentRacers =>
      currentRacers.map(racer =>
        racer.id === socket.id ? { ...racer, progress: progress, wpm: wpm } : racer
      )
    )
    // Send progress update to the server
    socket.emit('progress_update', { progress, wpm })
  }

  // Handler for the Start Race button
  const handleStartRace = () => {
    if (customText.trim()) { // Check if text is not empty
      console.log('Submitting custom text:', customText)
      socket.emit('submit_custom_text', customText)
      // Optionally clear the text area after submitting
      // setCustomText('')
    } else {
      alert('Please enter text for the race.')
    }
  }

  const handleQuoteSelect = (quote) => {
    setCustomText(quote);
  };

  return (
    <div className="App">
      <div className="app-header">
        <h1>SpeedType <span className="version">v1.0.1</span></h1>
        <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      </div>

      {isConnected && raceState === 'waiting' && (
        <div className="config-area">
          <h2>Enter Race Text</h2>
          <div className="quotes-section">
            <h3>Suggested Motivational Quotes:</h3>
            {isLoadingQuotes ? (
              <p>Loading quotes...</p>
            ) : (
              <div className="quotes-list">
                {quotes.map((quote, index) => (
                  <button
                    key={index}
                    className="quote-button"
                    onClick={() => handleQuoteSelect(quote)}
                  >
                    {quote}
                  </button>
                ))}
              </div>
            )}
            <button 
              className="refresh-quotes"
              onClick={fetchQuotes}
              disabled={isLoadingQuotes}
            >
              Refresh Quotes
            </button>
          </div>
          <textarea
            rows="6"
            placeholder="Paste or type the text for the race here..."
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            disabled={!isConnected}
          />
          <button onClick={handleStartRace} disabled={!isConnected || !customText.trim()}>
            Start Race with This Text
          </button>
        </div>
      )}

      {isConnected && raceState === 'racing' && (
        <>
          <RaceTrack racers={racers} />
          <TypingArea
            textToType={textToType}
            onProgress={handleTypingProgress}
            typedText={typedText}
            setTypedText={setTypedText}
            key={textToType}
          />
        </>
      )}

      {isConnected && raceState !== 'waiting' && raceState !== 'racing' && (
        <p>Race finished or in an unknown state.</p> // Placeholder for other states
      )}

      {!isConnected && (
        <p>Connecting...</p>
      )}
    </div>
  )
}

export default App
