# Project Requirements & Vision: Input-to-Music Background Agent

## Original Prompt & Requirements

I want you to create a Windows-compatible application (or a browser extension) that generates musical sounds based on my keyboard input, mouse movement, mouse clicks, and mouse wheel rotation. It should function in the background, even when I am typing or using other apps, without being visible.

### Core Requirements

#### 1. Sound Generation Based on Input
- **Each type of input should be mappable to different musical events:**
  - Keystrokes → beats, leads, harmonies, instruments, or notes
  - Mouse movement → musical events
  - Mouse clicks → musical events
  - Mouse wheel rotation → musical events

- **Full customization capability:**
  - Ability to fully customize which sound or note each input produces
  - Real-time mapping changes without restart
  - Support for complex input combinations (chords, sequences)

#### 2. Full Audio Control
- **Instrument Management:**
  - Ability to change instruments in real-time
  - Switch between different beats/patterns
  - Apply lead/harmony layers
  - Multiple instrument types (sine, square, sawtooth, triangle, noise, etc.)

- **Audio Effects:**
  - Real-time adjustment of bass, echo, reverb, and other audio effects
  - Smooth parameter transitions
  - Effect presets and custom configurations

- **Multi-channel Audio:**
  - Support for multiple audio channels
  - Overlapping sounds don't cut each other off
  - Polyphonic capabilities

#### 3. Performance Requirements
- **Low Latency:**
  - Must run smoothly with very low latency
  - No noticeable lag when generating sound
  - Optimized for real-time performance

- **Background Operation:**
  - Must work when app is not focused
  - Minimal CPU usage when idle
  - Stable long-term operation

#### 4. User Interface & Control
- **Music Controller Interface:**
  - Full-featured music controller interface
  - Map inputs to sounds
  - Adjust effects in real-time
  - Select instruments and presets
  - Controller can be optional or hidden when running in background

- **Visual Feedback:**
  - Real-time input visualization
  - Keystroke counter (including repeats)
  - Audio level meters
  - Effect parameter displays

#### 5. Platform & Technology
- **Windows Desktop Application (Preferred):**
  - Full control over system resources
  - Global input capture capabilities
  - Background operation with system tray
  - Native performance

- **Browser Extension (Alternative):**
  - Cross-platform compatibility
  - Easy distribution and updates
  - Limited global input access

- **Technology Stack:**
  - Fast and efficient technologies for low-latency sound
  - Web Audio API for browser-based solutions
  - Desktop audio libraries for Windows applications
  - Modern web technologies (React, TypeScript, Vite)

#### 6. Additional Features
- **Recording Capability:**
  - Ability to record the generated music
  - Export in common audio formats
  - Session recording and playback

- **Profile Management:**
  - Support multiple profiles/configurations
  - Different sound mappings for different use cases
  - Save/load configurations
  - Profile switching without restart

- **Customization:**
  - User-defined input mappings
  - Custom instrument definitions
  - Effect chain configuration
  - Visual theme options

## Technical Implementation Details

### Audio Engine Requirements
- **Web Audio API Integration:**
  - Low-latency audio context
  - Multiple oscillator types
  - Real-time effect processing
  - Voice management and polyphony

- **Sound Quality:**
  - High-quality audio synthesis
  - Smooth envelope transitions (ADSR)
  - Anti-aliasing for digital oscillators
  - Proper voice stealing for polyphony

- **Effects Chain:**
  - Low-pass filter for bass emphasis
  - Delay/echo with feedback control
  - Reverb with impulse response
  - Compressor for dynamic control
  - Master volume and gain staging

### Input Handling
- **Global Input Capture:**
  - System-wide keyboard monitoring
  - Global mouse event capture
  - Wheel rotation detection
  - Input event filtering and processing

- **Input Mapping System:**
  - Flexible key-to-sound mapping
  - Velocity-sensitive triggers
  - Modifier key combinations
  - Mouse sensitivity controls

### User Experience
- **Intuitive Interface:**
  - Clean, modern design
  - Real-time parameter adjustment
  - Visual feedback for all interactions
  - Keyboard shortcuts for quick access

- **Background Operation:**
  - System tray integration
  - Minimal resource usage
  - Silent operation mode
  - Easy enable/disable toggle

## Project Goals

### Primary Objectives
1. **Create a seamless background music generation system** that responds to all user input
2. **Achieve professional-quality audio** with low latency and high fidelity
3. **Provide extensive customization** without compromising performance
4. **Ensure reliable background operation** across different Windows configurations

### Secondary Objectives
1. **Develop a modular architecture** for easy extension and maintenance
2. **Create comprehensive documentation** for users and developers
3. **Implement robust error handling** and recovery mechanisms
4. **Optimize for various hardware configurations** and performance levels

### Future Enhancements
1. **Machine Learning Integration:**
   - AI-powered sound generation
   - Adaptive input mapping
   - Pattern recognition and learning

2. **Advanced Audio Features:**
   - MIDI input/output support
   - VST plugin compatibility
   - Advanced synthesis methods

3. **Collaboration Features:**
   - Multi-user sessions
   - Real-time sharing
   - Cloud synchronization

## Success Criteria

### Functional Requirements
- ✅ All input types (keyboard, mouse, wheel) generate musical sounds
- ✅ Background operation works reliably
- ✅ Real-time parameter adjustment without lag
- ✅ Multiple audio channels with proper polyphony
- ✅ Recording functionality works correctly
- ✅ Profile management and persistence

### Performance Requirements
- ✅ Audio latency < 50ms
- ✅ CPU usage < 5% when idle
- ✅ Memory usage < 100MB
- ✅ Stable operation for 8+ hours

### User Experience Requirements
- ✅ Intuitive interface for all skill levels
- ✅ Comprehensive documentation
- ✅ Easy installation and setup
- ✅ Reliable background operation
- ✅ Professional audio quality

## Current Implementation Status

### Completed Features
- ✅ Web Audio engine with polyphonic voices
- ✅ ADSR envelopes and dual detuned oscillators for sweet sound
- ✅ Real-time effects chain (bass, echo, reverb, compressor)
- ✅ Input mapping system for keyboard and mouse
- ✅ Keystroke counter with repeat detection
- ✅ Recording to WebM format
- ✅ Electron integration for global input capture
- ✅ System tray background operation
- ✅ React-based control panel UI
- ✅ TypeScript for type safety

### In Progress
- 🔄 Global input capture via uiohook-napi
- 🔄 Profile save/load system
- 🔄 Advanced mapping editor UI

### Planned Features
- ⏳ MIDI input/output support
- ⏳ VST plugin compatibility
- ⏳ Advanced synthesis methods
- ⏳ Machine learning integration
- ⏳ Multi-user collaboration

## Development Philosophy

### Code Quality
- **Type Safety:** Full TypeScript implementation
- **Modular Design:** Clean separation of concerns
- **Performance First:** Optimized for real-time audio
- **User-Centric:** Intuitive and responsive interface

### Testing Strategy
- **Unit Tests:** Core audio engine functions
- **Integration Tests:** Input mapping and effects
- **Performance Tests:** Latency and resource usage
- **User Testing:** Real-world usage scenarios

### Documentation Standards
- **Comprehensive README:** Setup, usage, and troubleshooting
- **Code Comments:** Clear explanations of complex logic
- **API Documentation:** Type definitions and interfaces
- **User Guide:** Step-by-step tutorials and examples

This project represents a unique fusion of real-time audio synthesis, global input monitoring, and user interface design, creating a new paradigm for interactive music generation that works seamlessly in the background of any computing activity.
