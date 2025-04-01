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

  const handleTypingProgress = (progress, currentInput) => {
    if (raceState !== 'racing') return

    setTypedText(currentInput) // Update local state from TypingArea
    setMyProgress(progress)
    // Update local racer state immediately for responsiveness
    setRacers(currentRacers =>
      currentRacers.map(racer =>
        racer.id === socket.id ? { ...racer, progress: progress } : racer
      )
    )
    // Send progress update to the server
    socket.emit('progress_update', { progress })
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

  return (
    <div className="App">
      <h1>SpeedType</h1>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>

      {isConnected && raceState === 'waiting' && (
        <div className="config-area">
          <h2>Enter Race Text</h2>
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
            typedText={typedText} // Pass state down
            setTypedText={setTypedText} // Pass setter down
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
