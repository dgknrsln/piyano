/**
 * QUIZ & PRACTICE ARENA ENGINE
 * Dizekteki 5 Çizgi ve 4 Aralıktaki 9 Notanın Tamamı (Her seferinde farklı rastgele sırada 9 Soru)
 */

class QuizEngine {
  constructor() {
    this.totalQuestions = 11; // 11 questions (Orta Do + Re + 5 lines + 4 spaces)
    this.questions = [];
    this.currentIndex = 0;
    this.score = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.lives = 3;
    this.maxLives = 3;
    this.timerSeconds = 70;
    this.timerInterval = null;
    this.inputMode = 'buttons'; // 'buttons' or 'piano'
    this.isAnswerLocked = false;
    this.correctCount = 0;
  }

  init() {
    this.bindEvents();
    this.startNewQuiz();
  }

  bindEvents() {
    // 1. Mode switches (Buttons vs Piano)
    const modeButtons = document.getElementById('quiz-mode-buttons');
    const modePiano = document.getElementById('quiz-mode-piano');

    if (modeButtons && modePiano) {
      modeButtons.addEventListener('click', () => this.setInputMode('buttons'));
      modePiano.addEventListener('click', () => this.setInputMode('piano'));
    }

    // 2. Sound Repeat Button in question card
    const soundRepeatBtn = document.getElementById('quiz-sound-repeat-btn');
    if (soundRepeatBtn) {
      soundRepeatBtn.addEventListener('click', () => this.playTargetNoteSound());
    }

    // 3. Reset Button
    const resetBtn = document.getElementById('quiz-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.startNewQuiz());
    }

    // 4. Modal actions
    const playAgainBtn = document.getElementById('modal-play-again-btn');
    if (playAgainBtn) {
      playAgainBtn.addEventListener('click', () => {
        this.hideResultModal();
        this.startNewQuiz();
      });
    }

    const goFlashcardsBtn = document.getElementById('modal-go-flashcards-btn');
    if (goFlashcardsBtn) {
      goFlashcardsBtn.addEventListener('click', () => {
        this.hideResultModal();
        if (window.appState) {
          window.appState.switchTab('flashcards');
        }
      });
    }

    // 5. Physical keyboard shortcuts for multiple choice (Keys 1, 2, 3, 4)
    window.addEventListener('keydown', (e) => {
      const activeSection = document.querySelector('.view-section.active');
      if (!activeSection || activeSection.id !== 'view-quiz') return;

      if (this.inputMode === 'buttons' && ['1', '2', '3', '4'].includes(e.key)) {
        const optionButtons = document.querySelectorAll('.option-btn');
        const index = parseInt(e.key, 10) - 1;
        if (optionButtons[index] && !this.isAnswerLocked) {
          optionButtons[index].click();
        }
      }
    });
  }

  setInputMode(mode) {
    this.inputMode = mode;

    const modeButtons = document.getElementById('quiz-mode-buttons');
    const modePiano = document.getElementById('quiz-mode-piano');
    const optionsGrid = document.getElementById('quiz-options-grid');
    const pianoInputArea = document.getElementById('quiz-piano-input');

    if (mode === 'buttons') {
      modeButtons?.classList.add('active');
      modePiano?.classList.remove('active');
      optionsGrid?.classList.remove('hidden');
      pianoInputArea?.classList.add('hidden');
    } else {
      modePiano?.classList.add('active');
      modeButtons?.classList.remove('active');
      optionsGrid?.classList.add('hidden');
      pianoInputArea?.classList.remove('hidden');
      this.renderQuizPianoInput();
    }
  }

  startNewQuiz() {
    this.currentIndex = 0;
    this.score = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.lives = this.maxLives;
    this.correctCount = 0;
    this.isAnswerLocked = false;
    this.timerSeconds = 60;

    this.generateQuestionsList();
    this.updateHUD();
    this.hideFeedbackBanner();
    this.hideResultModal();
    this.startTimer();
    this.renderCurrentQuestion();
  }

  /**
   * Generates exactly 11 questions covering all 11 notes (Orta Do, Re + 5 lines + 4 spaces) in a randomized order
   */
  generateQuestionsList() {
    const all11Notes = ALL_11_NOTES_IDS.map(id => getNoteById(id));
    this.questions = [...all11Notes];
    this.shuffleArray(this.questions); // Randomize sequence every time
    this.totalQuestions = this.questions.length;
  }

  startTimer() {
    clearInterval(this.timerInterval);
    const timerEl = document.getElementById('quiz-timer');

    this.timerInterval = setInterval(() => {
      this.timerSeconds--;
      if (timerEl) {
        timerEl.textContent = `${this.timerSeconds}s`;
        timerEl.classList.toggle('urgent', this.timerSeconds <= 15);
      }

      if (this.timerSeconds <= 0) {
        clearInterval(this.timerInterval);
        this.finishQuiz(true); // Timed out
      }
    }, 1000);
  }

  stopTimer() {
    clearInterval(this.timerInterval);
  }

  getCurrentTargetNote() {
    return this.questions[this.currentIndex] || NOTES_DATA[2]; // Default to Mi (E4)
  }

  playTargetNoteSound() {
    const note = this.getCurrentTargetNote();
    if (window.pianoAudio && note) {
      window.pianoAudio.playNote(note.frequency, 1.5, 0.85);
    }
  }

  renderCurrentQuestion() {
    if (this.currentIndex >= this.totalQuestions || this.lives <= 0) {
      this.finishQuiz(false);
      return;
    }

    this.isAnswerLocked = false;
    this.hideFeedbackBanner();

    const targetNote = this.getCurrentTargetNote();

    // 1. Question index number (e.g. Soru 1 / 9)
    const qNumEl = document.getElementById('quiz-q-num');
    if (qNumEl) qNumEl.textContent = this.currentIndex + 1;

    const qTotalEl = document.getElementById('quiz-q-total');
    if (qTotalEl) qTotalEl.textContent = this.totalQuestions;

    // 2. Render Target Note on Staff
    const staffBox = document.getElementById('quiz-staff-container');
    if (staffBox && window.staffRenderer) {
      window.staffRenderer.renderIntoElement(staffBox, targetNote, {
        showLabels: false,
        showHelpers: false,
        animated: true
      });
    }

    // Play note sound smoothly after a tiny delay
    setTimeout(() => this.playTargetNoteSound(), 100);

    // 3. Render Answer Options (Multiple Choice)
    this.renderMultipleChoiceOptions(targetNote);

    // 4. Render Piano Input if mode is piano
    if (this.inputMode === 'piano') {
      this.renderQuizPianoInput();
    }
  }

  renderMultipleChoiceOptions(targetNote) {
    const optionsGrid = document.getElementById('quiz-options-grid');
    if (!optionsGrid) return;
    optionsGrid.innerHTML = '';

    const isAnglo = window.appState && window.appState.notationSystem === 'anglo';

    // Pick 3 unique distractor notes from the 9 staff notes or full dataset
    const otherNotes = NOTES_DATA.filter(n => n.id !== targetNote.id);
    this.shuffleArray(otherNotes);
    const distractors = otherNotes.slice(0, 3);

    const optionsList = [targetNote, ...distractors];
    this.shuffleArray(optionsList);

    optionsList.forEach((optNote, idx) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.dataset.noteId = optNote.id;

      const mainLabel = isAnglo ? optNote.nameEnglish : optNote.nameSolfege;
      const posLabel = optNote.shortPos;

      btn.innerHTML = `
        <span class="opt-name">${mainLabel} <small style="color:var(--text-muted);font-size:0.8em;font-weight:600">(${posLabel})</small></span>
        <span class="opt-key-tag">${idx + 1}</span>
      `;

      btn.addEventListener('click', () => {
        if (!this.isAnswerLocked) {
          this.handleAnswer(optNote.id, btn);
        }
      });

      optionsGrid.appendChild(btn);
    });
  }

  renderQuizPianoInput() {
    const pianoWrapper = document.getElementById('quiz-piano-wrapper');
    if (!pianoWrapper) return;
    pianoWrapper.innerHTML = '';

    // Expanded 1.5 octave range to cover all 9 staff notes (E4 to F5)
    const whiteNotes = [
      { id: 'c4', label: 'Do', en: 'C4' },
      { id: 'd4', label: 'Re', en: 'D4' },
      { id: 'e4', label: 'Mi', en: 'E4' },
      { id: 'f4', label: 'Fa', en: 'F4' },
      { id: 'g4', label: 'Sol', en: 'G4' },
      { id: 'a4', label: 'La', en: 'A4' },
      { id: 'b4', label: 'Si', en: 'B4' },
      { id: 'c5', label: 'Do', en: 'C5' },
      { id: 'd5', label: 'Re', en: 'D5' },
      { id: 'e5', label: 'Mi', en: 'E5' },
      { id: 'f5', label: 'Fa', en: 'F5' },
      { id: 'g5', label: 'Sol', en: 'G5' }
    ];

    const blackNotes = [
      { id: 'c4_sharp', left: 22 },
      { id: 'd4_sharp', left: 54 },
      { id: 'f4_sharp', left: 118 },
      { id: 'g4_sharp', left: 150 },
      { id: 'a4_sharp', left: 182 },
      { id: 'c5_sharp', left: 246 },
      { id: 'd5_sharp', left: 278 },
      { id: 'f5_sharp', left: 342 }
    ];

    const pianoEl = document.createElement('div');
    pianoEl.className = 'mini-piano';
    pianoEl.style.transform = 'scale(1.15)';
    pianoEl.style.margin = '1rem auto';

    const isAnglo = window.appState && window.appState.notationSystem === 'anglo';

    whiteNotes.forEach(w => {
      const key = document.createElement('div');
      key.className = 'mini-key-white';
      key.dataset.noteId = w.id;
      key.style.width = '32px';
      key.style.height = '85px';
      key.innerHTML = `<span style="font-size:8px;font-weight:800">${isAnglo ? w.en : w.label}</span>`;

      key.addEventListener('click', () => {
        if (!this.isAnswerLocked) {
          this.handleAnswer(w.id, key);
        }
      });

      pianoEl.appendChild(key);
    });

    blackNotes.forEach(b => {
      const key = document.createElement('div');
      key.className = 'mini-key-black';
      key.style.left = `${b.left}px`;
      key.style.width = '18px';
      key.style.height = '52px';
      key.dataset.noteId = b.id;

      key.addEventListener('click', () => {
        if (!this.isAnswerLocked) {
          this.handleAnswer(b.id, key);
        }
      });

      pianoEl.appendChild(key);
    });

    pianoWrapper.appendChild(pianoEl);
  }

  handleAnswer(selectedNoteId, triggerElement) {
    if (this.isAnswerLocked) return;
    this.isAnswerLocked = true;

    const targetNote = this.getCurrentTargetNote();
    const isCorrect = selectedNoteId === targetNote.id;

    // Visual button feedback
    if (triggerElement) {
      triggerElement.classList.add(isCorrect ? 'correct-choice' : 'wrong-choice');
    }

    if (isCorrect) {
      // 1. Correct Answer Flow
      this.correctCount++;
      this.streak++;
      if (this.streak > this.bestStreak) this.bestStreak = this.streak;

      // Base 100 points + combo streak multiplier
      const earnedScore = 100 + ((this.streak - 1) * 25);
      this.score += earnedScore;

      // Audio feedback
      if (window.pianoAudio) {
        if (this.streak % 3 === 0) {
          window.pianoAudio.playStreakBonusSound();
        } else {
          window.pianoAudio.playSuccessChime();
        }
      }

      // Banner Feedback
      this.showFeedbackBanner(true, `Harika! Doğru Cevap: ${targetNote.nameSolfege} (${targetNote.nameEnglish}) - ${targetNote.shortPos} +${earnedScore} Puan`);

      // Add XP to global progression
      if (window.appState) {
        window.appState.addXp(15);
      }

    } else {
      // 2. Wrong Answer Flow
      this.streak = 0;
      this.lives--;

      // Audio feedback
      if (window.pianoAudio) {
        window.pianoAudio.playErrorTone();
      }

      // Highlight correct choice
      const allOptionButtons = document.querySelectorAll('.option-btn');
      allOptionButtons.forEach(btn => {
        if (btn.dataset.noteId === targetNote.id) {
          btn.classList.add('correct-choice');
        }
      });

      this.showFeedbackBanner(false, `Yanlış! Doğru cevap: ${targetNote.nameSolfege} (${targetNote.nameEnglish}) - ${targetNote.positionText}`);
    }

    this.updateHUD();

    // Advance to next question after short delay
    setTimeout(() => {
      this.currentIndex++;
      if (this.lives <= 0 || this.currentIndex >= this.totalQuestions) {
        this.finishQuiz(false);
      } else {
        this.renderCurrentQuestion();
      }
    }, 1400);
  }

  showFeedbackBanner(isCorrect, message) {
    const banner = document.getElementById('quiz-feedback-banner');
    const msgEl = document.getElementById('feedback-message');
    const iconEl = document.getElementById('feedback-icon');

    if (banner && msgEl && iconEl) {
      banner.className = `quiz-feedback-banner ${isCorrect ? 'correct' : 'wrong'}`;
      iconEl.textContent = isCorrect ? '✓' : '✗';
      msgEl.textContent = message;
      banner.classList.remove('hidden');
    }
  }

  hideFeedbackBanner() {
    const banner = document.getElementById('quiz-feedback-banner');
    if (banner) banner.classList.add('hidden');
  }

  updateHUD() {
    const scoreEl = document.getElementById('quiz-score');
    const streakEl = document.getElementById('quiz-streak');
    const livesBox = document.getElementById('quiz-lives');

    if (scoreEl) scoreEl.textContent = this.score;
    if (streakEl) streakEl.textContent = `x${this.streak}`;

    if (livesBox) {
      const hearts = livesBox.querySelectorAll('.heart');
      hearts.forEach((h, idx) => {
        h.classList.toggle('lost', idx >= this.lives);
      });
    }
  }

  finishQuiz(isTimeOut = false) {
    this.stopTimer();

    const modal = document.getElementById('quiz-result-modal');
    const finalScoreEl = document.getElementById('modal-final-score');
    const accuracyEl = document.getElementById('modal-accuracy');
    const bestStreakEl = document.getElementById('modal-best-streak');
    const xpGainedEl = document.getElementById('modal-xp-gained');
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-desc');
    const trophyEl = document.getElementById('modal-trophy');

    const accuracyPct = Math.round((this.correctCount / this.totalQuestions) * 100);
    const xpAwarded = Math.round(this.score * 0.15);

    if (finalScoreEl) finalScoreEl.textContent = this.score;
    if (accuracyEl) accuracyEl.textContent = `${accuracyPct}% (${this.correctCount}/${this.totalQuestions})`;
    if (bestStreakEl) bestStreakEl.textContent = this.bestStreak;
    if (xpGainedEl) xpGainedEl.textContent = `+${xpAwarded} XP`;

    if (window.appState) {
      window.appState.addXp(xpAwarded);
    }

    if (accuracyPct === 100) {
      if (trophyEl) trophyEl.textContent = '👑';
      if (modalTitle) modalTitle.textContent = 'Kusursuz 11/11! Dizek Ustası';
      if (modalDesc) modalDesc.textContent = 'Dizekteki 5 çizgi, 4 aralık ve dizek altı Do ve Re dahil tüm 11 notayı hatasız bildiniz!';
      if (window.pianoAudio) window.pianoAudio.playSuccessChime();
    } else if (accuracyPct >= 70) {
      if (trophyEl) trophyEl.textContent = '🏆';
      if (modalTitle) modalTitle.textContent = 'Harika Başarı!';
      if (modalDesc) modalDesc.textContent = 'Dizek üzerindeki notalarda harika bir hakimiyet gösterdiniz.';
      if (window.pianoAudio) window.pianoAudio.playSuccessChime();
    } else if (accuracyPct >= 40) {
      if (trophyEl) trophyEl.textContent = '🥈';
      if (modalTitle) modalTitle.textContent = 'İyi Çalışma!';
      if (modalDesc) modalDesc.textContent = 'Birkaç notayı daha pekiştirmek için Flashcard modundaki tekerlemelere göz atabilirsiniz.';
    } else {
      if (trophyEl) trophyEl.textContent = '💡';
      if (modalTitle) modalTitle.textContent = 'Tekrar Deneyin';
      if (modalDesc) modalDesc.textContent = 'Orta Do, Re, Çizgiler (Mi-Sol-Si-Re-Fa) ve Aralıklar (Fa-La-Do-Mi) tekerlemelerini hatırlayın!';
    }

    if (modal) modal.classList.remove('hidden');
  }

  hideResultModal() {
    const modal = document.getElementById('quiz-result-modal');
    if (modal) modal.classList.add('hidden');
  }

  shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
}

// Global instance
window.quizEngine = new QuizEngine();
