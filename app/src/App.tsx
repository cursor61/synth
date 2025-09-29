import { useEffect, useRef, useState } from 'react'
import './App.css'
import { AudioEngine, type EffectSettings, type InstrumentType } from './audio/AudioEngine'
import { InputMapper } from './input/InputMapper'
import ControlPanel from './ui/ControlPanel'

function App() {
  const engineRef = useRef<AudioEngine | null>(null)
  const [instrument, setInstrument] = useState<InstrumentType>('sine')
  const [isRecording, setIsRecording] = useState(false)
  const [settings, setSettings] = useState<EffectSettings>({ masterVolume: 0.6, bassHz: 180, bassQ: 0.7, echoTime: 0.2, echoFeedback: 0.25, echoMix: 0.25, reverbMix: 0.3 })

  useEffect(() => {
    const engine = new AudioEngine({ numVoices: 24 })
    engineRef.current = engine
    const mapper = new InputMapper(engine)
    mapper.onCountChange = (n)=>{
      setKeystrokes(n)
    }
    mapper.attach()
    return () => mapper.detach()
  }, [])

  useEffect(() => { engineRef.current?.applySettings(settings) }, [settings])
  useEffect(() => { engineRef.current?.setInstrument(instrument) }, [instrument])

  // Listen for global input from Electron if available
  useEffect(() => {
    if (!window.synthIPC || !engineRef.current) return
    const mapper = new InputMapper(engineRef.current)
    mapper.onCountChange = (n)=>setKeystrokes(n)
    window.synthIPC.onGlobalKey((e) => {
      // uiohook keycode -> try to map to a KeyboardEvent.code style where possible
      // For a simple prototype, map number row and A-K approximations
      const map: Record<number, string> = {
        30: 'KeyA', 31: 'KeyS', 32: 'KeyD', 33: 'KeyF', 34: 'KeyG', 35: 'KeyH', 36: 'KeyJ', 37: 'KeyK',
        2: 'Digit1', 3: 'Digit2', 4: 'Digit3', 5: 'Digit4'
      }
      const code = map[e.keycode ?? -1]
      if (code) mapper.triggerByKeyCode(code)
    })
    window.synthIPC.onGlobalMouseDown(() => mapper.triggerMouseDown())
    window.synthIPC.onGlobalMouseMove((e) => mapper.triggerMouseMove(4))
    window.synthIPC.onGlobalWheel((e) => mapper.triggerWheel(e.direction ?? 1))
  }, [])

  const [keystrokes, setKeystrokes] = useState(0)

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
      <div style={{ display: 'grid', gap: 16 }}>
        <h2 style={{ textAlign: 'center' }}>Input-to-Music Prototype</h2>
        <div style={{ textAlign: 'center', color: '#bbb' }}>Keystrokes: {keystrokes}</div>
        <ControlPanel
          engine={engineRef.current!}
          settings={settings}
          onChangeSettings={(s)=>setSettings(prev=>({ ...prev, ...s }))}
          instrument={instrument}
          onChangeInstrument={(i)=>setInstrument(i)}
          isRecording={isRecording}
          onRecordToggle={async ()=>{
            if (!engineRef.current) return
            if (!isRecording) {
              await engineRef.current.resume()
              engineRef.current.startRecording()
              setIsRecording(true)
            } else {
              const blob = await engineRef.current.stopRecording()
              setIsRecording(false)
              if (blob) {
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'session.webm'
                a.click()
                URL.revokeObjectURL(url)
              }
            }
          }}
        />
        <small style={{ color: '#888' }}>Tip: Use A-K keys, move mouse, click, and scroll.</small>
      </div>
    </div>
  )
}

export default App
