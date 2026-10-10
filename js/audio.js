/**
 * WEB AUDIO API PIANO SYNTHESIZER & SFX ENGINE
 * Realistic multi-harmonic piano sound with hammer attack simulation
 */

class PianoAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.activeVoices = new Map();
    this.initialized = false;
  }

  // Initialize on first user interaction to comply with browser autoplay policies
  init() {
    if (this.initialized) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      // Master output limiter and gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);

      // Lowpass anti-aliasing / warmth filter
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(6500, this.ctx.currentTime);
      this.filter.Q.setValueAtTime(0.8, this.ctx.currentTime);

      this.masterGain.connect(this.filter);
      this.filter.connect(this.ctx.destination);

      this.initialized = true;

      // Hide toast if visible
      const toast = document.getElementById('audio-toast');
      if (toast) toast.classList.add('hidden');
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  ensureContext() {
    if (!this.initialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Set Mute state
  setMute(mute) {
    this.isMuted = mute;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(mute ? 0 : 0.75, this.ctx.currentTime, 0.02);
    }
  }

  toggleMute() {
    this.setMute(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Plays a rich realistic acoustic piano note using additive harmonic synthesis + hammer strike
   * @param {number} freq - Frequency in Hz (e.g. 261.63 for C4)
   * @param {number} duration - Note sustain duration in seconds (default: 1.8)
   * @param {number} velocity - Velocity / volume scaling from 0.1 to 1.0 (default: 0.8)
   */
  playNote(freq, duration = 1.8, velocity = 0.8) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const noteGain = this.ctx.createGain();
    noteGain.connect(this.masterGain);

    // Harmonic partial profiles for authentic piano timbre
    // Fundamental + 2nd, 3rd, 4th, 5th, 6th harmonics with slight natural inharmonicity
    const harmonics = [
      { mult: 1.000, gain: 1.00 * velocity, decay: duration },
      { mult: 2.002, gain: 0.60 * velocity, decay: duration * 0.85 },
      { mult: 3.006, gain: 0.35 * velocity, decay: duration * 0.65 },
      { mult: 4.012, gain: 0.18 * velocity, decay: duration * 0.50 },
      { mult: 5.020, gain: 0.09 * velocity, decay: duration * 0.35 },
      { mult: 6.030, gain: 0.04 * velocity, decay: duration * 0.25 }
    ];

    // Detuned second string chorus effect for warmth (piano strings are grouped in unisons)
    const oscillators = [];

    harmonics.forEach(h => {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const hGain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';

      // Slight natural chorus detune (± 1.2 cents)
      osc1.frequency.setValueAtTime(freq * h.mult, now);
      osc2.frequency.setValueAtTime(freq * h.mult * 1.0008, now);

      // Amplitude Envelope for harmonic
      hGain.gain.setValueAtTime(0, now);
      // Fast attack
      hGain.gain.linearRampToValueAtTime(h.gain, now + 0.006);
      // Natural exponential decay curve
      hGain.gain.exponentialRampToValueAtTime(0.0001, now + h.decay);

      osc1.connect(hGain);
      osc2.connect(hGain);
      hGain.connect(noteGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + h.decay + 0.05);
      osc2.stop(now + h.decay + 0.05);

      oscillators.push(osc1, osc2);
    });

    // Hammer Strike Transient (Percussive Thump)
    try {
      const bufferSize = this.ctx.sampleRate * 0.02; // 20ms noise burst
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const hammerFilter = this.ctx.createBiquadFilter();
      hammerFilter.type = 'bandpass';
      hammerFilter.frequency.setValueAtTime(freq * 1.5, now);
      hammerFilter.Q.setValueAtTime(2.0, now);

      const hammerGain = this.ctx.createGain();
      hammerGain.gain.setValueAtTime(0.2 * velocity, now);
      hammerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      noise.connect(hammerFilter);
      hammerFilter.connect(hammerGain);
      hammerGain.connect(noteGain);

      noise.start(now);
    } catch (e) {
      // Noise burst fallback ignored safely
    }

    return { oscillators, noteGain };
  }

  /**
   * Sound effect: Happy correct answer chime (Major Triad Arpeggio)
   */
  playSuccessChime() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playNote(freq, 0.8, 0.7);
      }, idx * 75);
    });
  }

  /**
   * Sound effect: Gentle wrong answer feedback
   */
  playErrorTone() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  /**
   * Sound effect: Streak combo celebration
   */
  playStreakBonusSound() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const chords = [392.00, 493.88, 587.33, 783.99]; // G4, B4, D5, G5
    chords.forEach((freq, i) => {
      setTimeout(() => {
        this.playNote(freq, 1.2, 0.6);
      }, i * 50);
    });
  }
}

// Global instance
window.pianoAudio = new PianoAudioEngine();

// Auto-bind click/keydown listeners to wake AudioContext
document.addEventListener('pointerdown', () => window.pianoAudio.ensureContext(), { once: true });
document.addEventListener('keydown', () => window.pianoAudio.ensureContext(), { once: true });
