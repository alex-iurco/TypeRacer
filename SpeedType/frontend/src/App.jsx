import { useState, useEffect } from 'react'
import io from 'socket.io-client'
import './App.css'
import RaceTrack from './components/RaceTrack'
import TypingArea from './components/TypingArea'

// Connect to the backend server
// Make sure the backend server is running on this address
const socket = io('http://localhost:3001')

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
  const fetchQuotes = async () => {
    setIsLoadingQuotes(true);
    try {
      console.log('Fetching quotes...');
      // First try to get longer quotes from Quotable API
      const response = await fetch('https://api.quotable.io/quotes/random?limit=5&tags=inspirational|motivation');
      console.log('Response received:', response);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Quotes data:', data);
      
      // Get 5 random quotes from the data
      const randomQuotes = data
        .sort(() => 0.5 - Math.random())
        .slice(0, 5)
        .map(quote => `"${quote.content}" - ${quote.author || 'Unknown'}`);
      
      console.log('Formatted quotes:', randomQuotes);
      setQuotes(randomQuotes);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      // Set longer fallback quotes in case of error
      setQuotes([
        '"The only way to do great work is to love what you do. If you haven\'t found it yet, keep looking. Don\'t settle. As with all matters of the heart, you\'ll know when you find it. And, like any great relationship, it just gets better and better as the years roll on." - Steve Jobs',
        '"Success is not final, failure is not fatal: it is the courage to continue that counts. The journey of a thousand miles begins with one step. Every great achievement was once considered impossible." - Winston Churchill',
        '"Believe you can and you\'re halfway there. The future belongs to those who believe in the beauty of their dreams. The only limit to our realization of tomorrow will be our doubts of today." - Theodore Roosevelt',
        '"The future belongs to those who believe in the beauty of their dreams. Everything you can imagine is real. The only way to do great work is to love what you do." - Eleanor Roosevelt',
        '"Everything you can imagine is real. The only way to do great work is to love what you do. Success is not final, failure is not fatal: it is the courage to continue that counts." - Pablo Picasso'
      ]);
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
      <h1>SpeedType</h1>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>

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
