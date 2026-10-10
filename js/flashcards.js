/**
 * FLASHCARD LEARNING ENGINE
 * 3D Card Flipping, Spaced Repetition Mastery, Sound Preview, Filter Chips
 */

class FlashcardController {
  constructor() {
    this.allNotes = [...NOTES_DATA]; // All 11 notes (Orta Do & Re + 5 lines + 4 spaces)
    this.filteredNotes = [...this.allNotes]; // Default to all 11 notes
    this.currentIndex = 0;
    this.isFlipped = false;
    this.filterMode = 'all'; // 'all', 'ledger', 'lines', 'spaces'
    
    // Mastery state (persisted in LocalStorage)
    this.masteredNoteIds = new Set();
    this.reviewNoteIds = new Set();

    this.cardElement = null;
    this.wrapperElement = null;
  }

  init() {
    this.cardElement = document.getElementById('main-flashcard');
    this.wrapperElement = document.getElementById('flashcard-wrapper');
    
    this.loadState();
    this.bindEvents();
    this.renderFilterPills();
    this.renderCurrentCard();
    this.updateStats();
  }

  loadState() {
    try {
      const savedMastered = localStorage.getItem('piyano_mastered_notes');
      if (savedMastered) {
        this.masteredNoteIds = new Set(JSON.parse(savedMastered));
      }
    } catch (e) {
      console.warn('Storage read error:', e);
    }
  }

  saveState() {
    try {
      localStorage.setItem('piyano_mastered_notes', JSON.stringify(Array.from(this.masteredNoteIds)));
    } catch (e) {}
  }

  bindEvents() {
    // 1. Flip on Card Click or Flip Buttons
    if (this.wrapperElement) {
      this.wrapperElement.addEventListener('click', (e) => {
        // Prevent flipping if clicking listen buttons or interactive elements
        if (e.target.closest('button') || e.target.closest('.mini-piano') || e.target.closest('svg')) return;
        this.toggleFlip();
      });
    }

    const flipBtn = document.getElementById('card-flip-btn');
    if (flipBtn) flipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleFlip();
    });

    const reflipBtn = document.getElementById('card-reflip-btn');
    if (reflipBtn) reflipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleFlip();
    });

    // 2. Audio Listen Buttons
    const listenFront = document.getElementById('card-listen-btn');
    if (listenFront) {
      listenFront.addEventListener('click', (e) => {
        e.stopPropagation();
        this.playCurrentNoteSound();
      });
    }

    const listenBack = document.getElementById('back-listen-btn');
    if (listenBack) {
      listenBack.addEventListener('click', (e) => {
        e.stopPropagation();
        this.playCurrentNoteSound();
      });
    }

    // 3. Navigation Buttons
    const prevBtn = document.getElementById('prev-card-btn');
    if (prevBtn) prevBtn.addEventListener('click', () => this.prevCard());

    const nextBtn = document.getElementById('next-card-btn');
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextCard());

    // 4. Mastery Buttons
    const markMastered = document.getElementById('btn-mark-mastered');
    if (markMastered) {
      markMastered.addEventListener('click', () => this.markAsMastered());
    }

    const markRepeat = document.getElementById('btn-mark-repeat');
    if (markRepeat) {
      markRepeat.addEventListener('click', () => this.markForReview());
    }

    // 5. Filter Chips (All, Ledger, Lines, Spaces)
    const filterChips = document.querySelectorAll('.mode-chip');
    filterChips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.applyFilter(chip.dataset.filter);
      });
    });

    // 6. Keyboard navigation (Space to flip, Left/Right arrows)
    window.addEventListener('keydown', (e) => {
      const activeSection = document.querySelector('.view-section.active');
      if (!activeSection || activeSection.id !== 'view-flashcards') return;

      if (e.code === 'Space') {
        e.preventDefault();
        this.toggleFlip();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        this.nextCard();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        this.prevCard();
      }
    });
  }

  applyFilter(filter) {
    this.filterMode = filter;
    if (filter === 'ledger') {
      this.filteredNotes = this.allNotes.filter(n => n.id === 'c4' || n.id === 'd4');
    } else if (filter === 'lines') {
      this.filteredNotes = this.allNotes.filter(n => n.positionType === 'line');
    } else if (filter === 'spaces') {
      this.filteredNotes = this.allNotes.filter(n => n.positionType === 'space' && n.spaceNumber);
    } else {
      this.filteredNotes = [...this.allNotes];
    }
    this.currentIndex = 0;
    this.renderCurrentCard();
    this.renderFilterPills();
  }

  getCurrentNote() {
    return this.filteredNotes[this.currentIndex] || this.allNotes[0];
  }

  toggleFlip() {
    this.isFlipped = !this.isFlipped;
    if (this.cardElement) {
      this.cardElement.classList.toggle('flipped', this.isFlipped);
    }
  }

  setFlipped(flipped) {
    this.isFlipped = flipped;
    if (this.cardElement) {
      this.cardElement.classList.toggle('flipped', this.isFlipped);
    }
  }

  prevCard() {
    this.setFlipped(false);
    this.currentIndex = (this.currentIndex - 1 + this.filteredNotes.length) % this.filteredNotes.length;
    setTimeout(() => this.renderCurrentCard(), 150);
  }

  nextCard() {
    this.setFlipped(false);
    this.currentIndex = (this.currentIndex + 1) % this.filteredNotes.length;
    setTimeout(() => this.renderCurrentCard(), 150);
  }

  goToNote(noteId) {
    const idx = this.filteredNotes.findIndex(n => n.id === noteId);
    if (idx !== -1) {
      this.setFlipped(false);
      this.currentIndex = idx;
      setTimeout(() => this.renderCurrentCard(), 150);
    }
  }

  playCurrentNoteSound() {
    const note = this.getCurrentNote();
    if (window.pianoAudio && note) {
      window.pianoAudio.playNote(note.frequency, 1.8, 0.9);
    }
  }

  renderCurrentCard() {
    const note = this.getCurrentNote();
    if (!note) return;

    // 1. Render Front Staff SVG
    const staffContainer = document.getElementById('card-staff-container');
    if (staffContainer && window.staffRenderer) {
      window.staffRenderer.renderIntoElement(staffContainer, note, {
        showLabels: false,
        showHelpers: true,
        animated: true
      });
    }

    // 2. Render Back Details
    const backName = document.getElementById('back-note-name');
    const backAlt = document.getElementById('back-note-alt');
    const backPos = document.getElementById('back-porte-pos');
    const backType = document.getElementById('back-porte-type');
    const backMnemonic = document.getElementById('back-mnemonic');

    const isAnglo = window.appState && window.appState.notationSystem === 'anglo';

    if (backName) backName.textContent = isAnglo ? note.nameEnglish : note.nameSolfege;
    if (backAlt) backAlt.textContent = isAnglo ? `(${note.nameSolfege} - ${note.title})` : `(${note.nameEnglish} - ${note.title})`;
    if (backPos) backPos.textContent = note.positionText;
    if (backMnemonic) backMnemonic.textContent = note.mnemonic;

    if (backType) {
      if (note.positionType === 'line') {
        backType.textContent = `${note.lineNumber}. Çizgi (Line ${note.lineNumber})`;
      } else if (note.positionType === 'space') {
        backType.textContent = `${note.spaceNumber ? note.spaceNumber + '. Aralık' : 'Çizgi Altı Boşluk'}`;
      } else {
        backType.textContent = 'Ek Çizgi (Ledger Line)';
      }
    }

    // 3. Render Mini Piano on Card Back
    const miniPianoBox = document.getElementById('mini-piano-container');
    if (miniPianoBox && window.pianoKeyboard) {
      window.pianoKeyboard.renderMiniPianoInto(miniPianoBox, note.id);
    }

    // 4. Update Progress Text & Bar
    const progressFill = document.getElementById('card-progress-fill');
    const currentIdxEl = document.getElementById('current-card-idx');
    const totalCardsEl = document.getElementById('total-cards-count');

    if (currentIdxEl) currentIdxEl.textContent = this.currentIndex + 1;
    if (totalCardsEl) totalCardsEl.textContent = this.filteredNotes.length;

    if (progressFill) {
      const pct = Math.round(((this.currentIndex + 1) / this.filteredNotes.length) * 100);
      progressFill.style.width = `${pct}%`;
    }

    // 5. Update Quick Pills active state
    this.updatePillsActiveState();
  }

  renderFilterPills() {
    const pillsContainer = document.getElementById('quick-note-pills');
    if (!pillsContainer) return;

    pillsContainer.innerHTML = '';
    this.filteredNotes.forEach((note, i) => {
      const pill = document.createElement('button');
      pill.className = `note-pill ${i === this.currentIndex ? 'active' : ''} ${this.masteredNoteIds.has(note.id) ? 'mastered' : ''}`;
      pill.dataset.noteId = note.id;
      pill.innerHTML = `<span>${note.nameSolfege}</span>`;

      pill.addEventListener('click', () => {
        this.goToNote(note.id);
      });

      pillsContainer.appendChild(pill);
    });
  }

  updatePillsActiveState() {
    const pills = document.querySelectorAll('.quick-note-pills .note-pill');
    pills.forEach((p, idx) => {
      p.classList.toggle('active', idx === this.currentIndex);
      const note = this.filteredNotes[idx];
      if (note) {
        p.classList.toggle('mastered', this.masteredNoteIds.has(note.id));
      }
    });
  }

  markAsMastered() {
    const note = this.getCurrentNote();
    if (!note) return;

    this.masteredNoteIds.add(note.id);
    this.reviewNoteIds.delete(note.id);
    this.saveState();

    if (window.pianoAudio) {
      window.pianoAudio.playSuccessChime();
    }
    if (window.appState) {
      window.appState.addXp(15);
    }

    this.updateStats();
    this.nextCard();
  }

  markForReview() {
    const note = this.getCurrentNote();
    if (!note) return;

    this.reviewNoteIds.add(note.id);
    this.masteredNoteIds.delete(note.id);
    this.saveState();

    this.updateStats();
    this.nextCard();
  }

  updateStats() {
    const masteredCountEl = document.getElementById('mastered-counter');
    if (masteredCountEl) {
      masteredCountEl.textContent = `${this.masteredNoteIds.size} / ${this.allNotes.length}`;
    }
    this.updatePillsActiveState();
  }
}

// Global instance
window.flashcardController = new FlashcardController();
