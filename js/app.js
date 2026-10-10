/**
 * MAIN APP CONTROLLER & STATE MANAGER
 * Tab navigation, Notation toggle, Live Piano Explorer Sync, LocalStorage Persistence
 */

class AppController {
  constructor() {
    this.activeTab = 'flashcards';
    this.notationSystem = 'solfege'; // 'solfege' (Do-Re-Mi) or 'anglo' (C-D-E)
    this.theme = 'light'; // 'light' (Açık) or 'dark' (Koyu)
    this.xp = 0;
    this.streakDays = 1;
    this.soundEnabled = true;
  }

  init() {
    this.loadState();
    this.applyTheme(this.theme);
    this.bindNavigation();
    this.bindHeaderControls();
    this.initExplorerMode();

    // Initialize Submodules
    if (window.flashcardController) window.flashcardController.init();
    if (window.theoryGuide) window.theoryGuide.init();
    if (window.pianoKeyboard) {
      window.pianoKeyboard.init('main-piano-keyboard', (noteObj) => {
        this.onExplorerNotePlay(noteObj);
      });
    }

    this.updateUserStatsUI();
  }

  loadState() {
    try {
      const savedTheme = localStorage.getItem('piyano_theme');
      if (savedTheme) this.theme = savedTheme;

      const savedXp = localStorage.getItem('piyano_user_xp');
      if (savedXp) this.xp = parseInt(savedXp, 10);

      const savedNotation = localStorage.getItem('piyano_notation_system');
      if (savedNotation) this.notationSystem = savedNotation;

      const lastVisit = localStorage.getItem('piyano_last_visit_date');
      const today = new Date().toDateString();
      const savedStreak = localStorage.getItem('piyano_streak_days');

      if (lastVisit) {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (lastVisit === today) {
          this.streakDays = parseInt(savedStreak || '1', 10);
        } else if (lastVisit === yesterday) {
          this.streakDays = (parseInt(savedStreak || '1', 10)) + 1;
          localStorage.setItem('piyano_streak_days', this.streakDays.toString());
        } else {
          this.streakDays = 1;
          localStorage.setItem('piyano_streak_days', '1');
        }
      } else {
        this.streakDays = 1;
        localStorage.setItem('piyano_streak_days', '1');
      }
      localStorage.setItem('piyano_last_visit_date', today);

    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  saveState() {
    try {
      localStorage.setItem('piyano_theme', this.theme);
      localStorage.setItem('piyano_user_xp', this.xp.toString());
      localStorage.setItem('piyano_notation_system', this.notationSystem);
    } catch (e) {}
  }

  applyTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    const themeIcon = document.getElementById('theme-icon');
    const themeLabel = document.getElementById('theme-label');
    if (themeIcon) themeIcon.textContent = theme === 'light' ? '☀️' : '🌙';
    if (themeLabel) themeLabel.textContent = theme === 'light' ? 'Açık' : 'Koyu';
  }

  toggleTheme() {
    const newTheme = this.theme === 'light' ? 'dark' : 'light';
    this.applyTheme(newTheme);
    this.saveState();
  }

  addXp(amount) {
    this.xp += amount;
    this.saveState();
    this.updateUserStatsUI();
  }

  updateUserStatsUI() {
    const xpEl = document.getElementById('xp-counter');
    const streakEl = document.getElementById('streak-counter');
    const notationLabel = document.getElementById('notation-system-label');

    if (xpEl) xpEl.textContent = this.xp;
    if (streakEl) streakEl.textContent = this.streakDays;
    if (notationLabel) {
      notationLabel.textContent = this.notationSystem === 'solfege' ? 'Do-Re-Mi' : 'C-D-E';
    }
  }

  bindNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchTab(btn.dataset.tab);
      });
    });
  }

  switchTab(tabId) {
    this.activeTab = tabId;

    // Update Tab Buttons UI
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Update View Sections
    const views = document.querySelectorAll('.view-section');
    views.forEach(v => {
      v.classList.remove('active');
    });

    const activeView = document.getElementById(`view-${tabId}`);
    if (activeView) {
      activeView.classList.add('active');
    }

    // Tab-specific lifecycle actions
    if (tabId === 'quiz') {
      if (window.quizEngine) {
        window.quizEngine.init();
      }
    } else if (tabId === 'flashcards') {
      if (window.flashcardController) {
        window.flashcardController.renderCurrentCard();
      }
    }
  }

  bindHeaderControls() {
    // Theme Toggle (Açık ⟷ Koyu)
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    // Notation Toggle (Do-Re-Mi ⟷ C-D-E)
    const notationBtn = document.getElementById('notation-toggle-btn');
    if (notationBtn) {
      notationBtn.addEventListener('click', () => {
        this.notationSystem = this.notationSystem === 'solfege' ? 'anglo' : 'solfege';
        this.saveState();
        this.updateUserStatsUI();

        // Refresh current active view
        if (window.flashcardController) window.flashcardController.renderCurrentCard();
        if (this.activeTab === 'quiz' && window.quizEngine) window.quizEngine.renderCurrentQuestion();
      });
    }

    // Sound Mute Toggle
    const soundBtn = document.getElementById('sound-toggle-btn');
    const soundIconOn = document.getElementById('sound-icon-on');
    const soundIconOff = document.getElementById('sound-icon-off');

    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        if (window.pianoAudio) {
          const isMuted = window.pianoAudio.toggleMute();
          soundIconOn?.classList.toggle('hidden', isMuted);
          soundIconOff?.classList.toggle('hidden', !isMuted);
        }
      });
    }
  }

  /**
   * Interactive Explorer Mode (Canlı Piyano & Porte Eşitlemesi)
   */
  initExplorerMode() {
    const defaultNote = NOTES_DATA[0]; // Do (C4)
    this.updateExplorerStaff(defaultNote);

    // Toggle key labels
    const toggleLabels = document.getElementById('toggle-key-labels');
    if (toggleLabels) {
      toggleLabels.addEventListener('change', (e) => {
        if (window.pianoKeyboard) {
          window.pianoKeyboard.setLabelVisibility(e.target.checked);
        }
      });
    }
  }

  onExplorerNotePlay(noteObj) {
    this.updateExplorerStaff(noteObj);
  }

  updateExplorerStaff(noteObj) {
    const container = document.getElementById('explorer-staff-container');
    const expName = document.getElementById('exp-note-name');
    const expFreq = document.getElementById('exp-note-freq');
    const expDetail = document.getElementById('exp-note-detail');

    if (container && window.staffRenderer) {
      window.staffRenderer.renderIntoElement(container, noteObj, {
        showLabels: true,
        showHelpers: true,
        animated: true
      });
    }

    if (expName) {
      const isAnglo = this.notationSystem === 'anglo';
      expName.textContent = isAnglo ? `${noteObj.nameEnglish} (${noteObj.nameSolfege})` : `${noteObj.nameSolfege} (${noteObj.nameEnglish})`;
    }

    if (expFreq && noteObj.frequency) {
      expFreq.textContent = `${noteObj.frequency.toFixed(2)} Hz • ${noteObj.title || 'Notalar'}`;
    }

    if (expDetail && noteObj.positionText) {
      expDetail.textContent = noteObj.positionText;
    }
  }
}

// Instantiate and Boot App on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.appState = new AppController();
  window.appState.init();
});
