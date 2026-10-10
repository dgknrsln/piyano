/**
 * INTERACTIVE PIANO KEYBOARD ENGINE
 * Renders SVG/DOM realistic piano keys with touch, mouse, and keyboard listeners
 */

class PianoKeyboard {
  constructor() {
    this.whiteKeyWidth = 54;
    this.whiteKeyHeight = 200;
    this.blackKeyWidth = 32;
    this.blackKeyHeight = 125;
    this.showLabels = true;
    this.onNotePlayCallback = null;
    this.activeKeyElements = new Map();
  }

  /**
   * Initializes the main full piano keyboard in the specified container
   * @param {string} containerId
   * @param {Function} onNotePlay
   */
  init(containerId = 'main-piano-keyboard', onNotePlay = null) {
    this.container = document.getElementById(containerId);
    this.onNotePlayCallback = onNotePlay;
    if (!this.container) return;

    this.renderMainKeyboard();
    this.bindKeyboardShortcuts();
  }

  /**
   * Renders full octave piano keys (C4 to C5) with accurate black key offsets
   */
  renderMainKeyboard() {
    if (!this.container) return;
    this.container.innerHTML = '';

    // White keys layout: C4 to G5 (12 white keys)
    const whiteKeys = [
      { id: 'c4', note: 'DO', en: 'C4', freq: 261.63, kbd: 'A' },
      { id: 'd4', note: 'RE', en: 'D4', freq: 293.66, kbd: 'S' },
      { id: 'e4', note: 'Mİ', en: 'E4', freq: 329.63, kbd: 'D' },
      { id: 'f4', note: 'FA', en: 'F4', freq: 349.23, kbd: 'F' },
      { id: 'g4', note: 'SOL', en: 'G4', freq: 392.00, kbd: 'G' },
      { id: 'a4', note: 'LA', en: 'A4', freq: 440.00, kbd: 'H' },
      { id: 'b4', note: 'Sİ', en: 'B4', freq: 493.88, kbd: 'J' },
      { id: 'c5', note: 'DO', en: 'C5', freq: 523.25, kbd: 'K' },
      { id: 'd5', note: 'RE', en: 'D5', freq: 587.33, kbd: 'L' },
      { id: 'e5', note: 'Mİ', en: 'E5', freq: 659.25, kbd: 'Ş' },
      { id: 'f5', note: 'FA', en: 'F5', freq: 698.46, kbd: 'İ' },
      { id: 'g5', note: 'SOL', en: 'G5', freq: 783.99, kbd: ',' }
    ];

    // Black keys with explicit pixel offsets relative to white keys (54px key width)
    const blackKeys = [
      { id: 'c4_sharp', note: 'DO#', en: 'C#4', freq: 277.18, kbd: 'W', left: 38 },
      { id: 'd4_sharp', note: 'RE#', en: 'D#4', freq: 311.13, kbd: 'E', left: 92 },
      { id: 'f4_sharp', note: 'FA#', en: 'F#4', freq: 369.99, kbd: 'T', left: 200 },
      { id: 'g4_sharp', note: 'SOL#', en: 'G#4', freq: 415.30, kbd: 'Y', left: 254 },
      { id: 'a4_sharp', note: 'LA#', en: 'A#4', freq: 466.16, kbd: 'U', left: 308 },
      { id: 'c5_sharp', note: 'DO#', en: 'C#5', freq: 554.37, kbd: 'O', left: 416 },
      { id: 'd5_sharp', note: 'RE#', en: 'D#5', freq: 622.25, kbd: 'P', left: 470 },
      { id: 'f5_sharp', note: 'FA#', en: 'F#5', freq: 739.99, kbd: 'Ğ', left: 578 }
    ];

    const keysWrapper = document.createElement('div');
    keysWrapper.className = 'piano-keys-wrapper';

    // 1. Create White Keys
    whiteKeys.forEach(k => {
      const keyEl = document.createElement('div');
      keyEl.className = 'piano-key-white';
      keyEl.dataset.noteId = k.id;
      keyEl.dataset.freq = k.freq;
      keyEl.dataset.kbd = k.kbd;

      keyEl.innerHTML = `
        <span class="key-label-name">${k.note}</span>
        <span class="key-shortcut-tag"><kbd>${k.kbd}</kbd></span>
      `;

      this.bindKeyEvents(keyEl, k);
      keysWrapper.appendChild(keyEl);
      this.activeKeyElements.set(k.id, keyEl);
    });

    // 2. Create Black Keys
    blackKeys.forEach(k => {
      const keyEl = document.createElement('div');
      keyEl.className = 'piano-key-black';
      keyEl.dataset.noteId = k.id;
      keyEl.dataset.freq = k.freq;
      keyEl.dataset.kbd = k.kbd;
      keyEl.style.left = `${k.left}px`;

      keyEl.innerHTML = `
        <span class="key-label-name">${k.note}</span>
        <span class="key-shortcut-tag"><kbd>${k.kbd}</kbd></span>
      `;

      this.bindKeyEvents(keyEl, k);
      keysWrapper.appendChild(keyEl);
      this.activeKeyElements.set(k.id, keyEl);
    });

    this.container.appendChild(keysWrapper);
  }

  /**
   * Bind mouse/touch events to a key
   */
  bindKeyEvents(keyEl, keyData) {
    const handlePress = (e) => {
      e.preventDefault();
      this.triggerKey(keyData.id, true);
    };

    const handleRelease = (e) => {
      e.preventDefault();
      this.releaseKey(keyData.id);
    };

    keyEl.addEventListener('pointerdown', handlePress);
    keyEl.addEventListener('pointerup', handleRelease);
    keyEl.addEventListener('pointerleave', handleRelease);
    keyEl.addEventListener('pointercancel', handleRelease);
  }

  /**
   * Triggers a key press programmatically or from user action
   */
  triggerKey(noteId, notifyCallback = true) {
    const keyData = FULL_OCTAVE_KEYS.find(k => k.id === noteId) || NOTES_DATA.find(n => n.id === noteId);
    if (!keyData) return;

    // Visual active state
    const el = this.activeKeyElements.get(noteId);
    if (el) {
      el.classList.add('active');
    }

    // Play Sound
    if (window.pianoAudio) {
      window.pianoAudio.playNote(keyData.freq || keyData.frequency, 1.8, 0.85);
    }

    // Callback notification
    if (notifyCallback && this.onNotePlayCallback) {
      const fullNoteObj = NOTES_DATA.find(n => n.id === noteId) || {
        id: noteId,
        nameSolfege: keyData.name || keyData.nameSolfege,
        nameEnglish: keyData.nameEn || keyData.nameEnglish,
        frequency: keyData.freq || keyData.frequency,
        positionText: 'Piyano tuşu',
        shortPos: 'Serbest Çalım'
      };
      this.onNotePlayCallback(fullNoteObj);
    }
  }

  releaseKey(noteId) {
    const el = this.activeKeyElements.get(noteId);
    if (el) {
      el.classList.remove('active');
    }
  }

  /**
   * Bind physical keyboard shortcuts (A, S, D, F, G, H, J, K, L, Ş, İ)
   */
  bindKeyboardShortcuts() {
    const keyMap = {
      'a': 'c4', 'w': 'c4_sharp',
      's': 'd4', 'e': 'd4_sharp',
      'd': 'e4',
      'f': 'f4', 't': 'f4_sharp',
      'g': 'g4', 'y': 'g4_sharp',
      'h': 'a4', 'u': 'a4_sharp',
      'j': 'b4',
      'k': 'c5', 'o': 'c5_sharp',
      'l': 'd5', 'p': 'd5_sharp',
      'ş': 'e5', 's;': 'e5',
      'i': 'f5', 'ı': 'f5', 'İ': 'f5', 'ğ': 'f5_sharp'
    };

    const activeKeys = new Set();

    window.addEventListener('keydown', (e) => {
      // Don't intercept if user is typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const key = e.key.toLowerCase();
      if (keyMap[key] && !activeKeys.has(key)) {
        activeKeys.add(key);
        this.triggerKey(keyMap[key], true);
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      if (keyMap[key]) {
        activeKeys.delete(key);
        this.releaseKey(keyMap[key]);
      }
    });
  }

  /**
   * Generates a mini piano HTML preview with a highlighted target key (covering all 11 notes)
   * @param {string} targetNoteId - e.g. 'c4', 'd4', 'e4', 'f4', 'g4', 'a4', 'b4', 'c5', 'd5', 'e5', 'f5'
   */
  renderMiniPiano(targetNoteId) {
    const whiteNotes = ['c4', 'd4', 'e4', 'f4', 'g4', 'a4', 'b4', 'c5', 'd5', 'e5', 'f5'];
    const whiteLabels = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si', 'Do', 'Re', 'Mi', 'Fa'];
    const blackOffsets = [
      { id: 'c4_sharp', left: 16 },
      { id: 'd4_sharp', left: 40 },
      { id: 'f4_sharp', left: 88 },
      { id: 'g4_sharp', left: 112 },
      { id: 'a4_sharp', left: 136 },
      { id: 'c5_sharp', left: 184 },
      { id: 'd5_sharp', left: 208 }
    ];

    let whitesHtml = '';
    whiteNotes.forEach((id, i) => {
      const isTarget = id === targetNoteId;
      whitesHtml += `
        <div class="mini-key-white ${isTarget ? 'highlighted' : ''}" data-mini-note="${id}" title="${whiteLabels[i]}">
          ${isTarget ? '●' : ''}
        </div>
      `;
    });

    let blacksHtml = '';
    blackOffsets.forEach(b => {
      const isTarget = b.id === targetNoteId;
      blacksHtml += `
        <div class="mini-key-black ${isTarget ? 'highlighted' : ''}" style="left: ${b.left}px;" data-mini-note="${b.id}"></div>
      `;
    });

    return `
      <div class="mini-piano">
        ${whitesHtml}
        ${blacksHtml}
      </div>
    `;
  }

  /**
   * Renders mini piano into a DOM element
   */
  renderMiniPianoInto(containerId, targetNoteId) {
    const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!container) return;
    container.innerHTML = this.renderMiniPiano(targetNoteId);
  }

  /**
   * Toggle key label display
   */
  setLabelVisibility(visible) {
    this.showLabels = visible;
    const labels = document.querySelectorAll('.piano-keys-wrapper .key-label-name, .piano-keys-wrapper .key-shortcut-tag');
    labels.forEach(l => {
      l.style.display = visible ? '' : 'none';
    });
  }
}

// Global instance
window.pianoKeyboard = new PianoKeyboard();
