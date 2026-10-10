/**
 * THEORY & MNEMONIC GUIDE MODULE
 * Generates interactive diagrams for Lines (Çizgiler), Spaces (Aralıklar), and Reference Table
 */

class TheoryGuide {
  init() {
    this.renderLinesVisual();
    this.renderSpacesVisual();
    this.populateSummaryTable();
  }

  /**
   * Renders the 5 Lines diagram (Mi, Sol, Si, Re, Fa)
   */
  renderLinesVisual() {
    const container = document.getElementById('guide-lines-staff');
    if (!container) return;

    const lineNotes = [
      { id: 'e4', name: 'Mi', lineIdx: 0, x: 100 },
      { id: 'g4', name: 'Sol', lineIdx: 1, x: 160 },
      { id: 'b4', name: 'Si', lineIdx: 2, x: 220 },
      { id: 'd5', name: 'Re', lineIdx: 3, x: 280 },
      { id: 'f5', name: 'Fa', lineIdx: 4, x: 340 }
    ];

    const baseLineY = 110;
    const lineSpacing = 16;
    const startX = 30;
    const endX = 380;

    let linesSvg = '';
    for (let i = 0; i < 5; i++) {
      const y = baseLineY - (i * lineSpacing);
      linesSvg += `<line x1="${startX}" y1="${y}" x2="${endX}" y2="${y}" class="staff-line" />`;
      linesSvg += `<text x="${startX - 12}" y="${y + 4}" class="staff-guide-label active">${i + 1}</text>`;
    }

    let notesSvg = '';
    lineNotes.forEach(n => {
      const noteY = baseLineY - (n.lineIdx * lineSpacing);
      const isStemUp = n.lineIdx < 2;
      const stemX = isStemUp ? n.x + 7 : n.x - 7;
      const stemY2 = isStemUp ? noteY - 35 : noteY + 35;

      notesSvg += `
        <g class="guide-note-item" style="cursor:pointer;" onclick="window.pianoAudio.playNote(${this.getFreqForGuideNote(n.name, n.lineIdx)})">
          <line x1="${stemX}" y1="${noteY}" x2="${stemX}" y2="${stemY2}" class="note-stem" />
          <ellipse cx="${n.x}" cy="${noteY}" rx="9" ry="6.8" transform="rotate(-22, ${n.x}, ${noteY})" class="note-head" />
          <text x="${n.x}" y="${isStemUp ? stemY2 - 8 : stemY2 + 18}" class="staff-note-label">${n.name}</text>
        </g>
      `;
    });

    const clefSvg = `
      <g class="clef-group">
        <text x="32" y="102" class="clef-symbol" font-family="'Noto Music', 'Bravura', 'Apple Music', 'Segoe UI Symbol', sans-serif" font-size="76" text-anchor="start">&#x1D11E;</text>
      </g>
    `;

    container.innerHTML = `
      <svg viewBox="0 0 400 150" class="staff-svg">
        ${linesSvg}
        ${clefSvg}
        ${notesSvg}
      </svg>
    `;
  }

  /**
   * Renders the 4 Spaces diagram (Fa, La, Do, Mi)
   */
  renderSpacesVisual() {
    const container = document.getElementById('guide-spaces-staff');
    if (!container) return;

    const spaceNotes = [
      { id: 'f4', name: 'Fa', spaceIdx: 0.5, x: 120 },
      { id: 'a4', name: 'La', spaceIdx: 1.5, x: 190 },
      { id: 'c5', name: 'Do', spaceIdx: 2.5, x: 260 },
      { id: 'e5', name: 'Mi', spaceIdx: 3.5, x: 330 }
    ];

    const baseLineY = 110;
    const lineSpacing = 16;
    const startX = 30;
    const endX = 380;

    let linesSvg = '';
    for (let i = 0; i < 5; i++) {
      const y = baseLineY - (i * lineSpacing);
      linesSvg += `<line x1="${startX}" y1="${y}" x2="${endX}" y2="${y}" class="staff-line" />`;
    }

    const clefSvg = `
      <g class="clef-group">
        <text x="32" y="102" class="clef-symbol" font-family="'Noto Music', 'Bravura', 'Apple Music', 'Segoe UI Symbol', sans-serif" font-size="76" text-anchor="start">&#x1D11E;</text>
      </g>
    `;

    let notesSvg = '';
    spaceNotes.forEach((n, idx) => {
      const noteY = baseLineY - (n.spaceIdx * lineSpacing);
      const isStemUp = n.spaceIdx < 2;
      const stemX = isStemUp ? n.x + 7 : n.x - 7;
      const stemY2 = isStemUp ? noteY - 35 : noteY + 35;

      notesSvg += `
        <g class="guide-note-item" style="cursor:pointer;" onclick="window.pianoAudio.playNote(${this.getFreqForSpaceNote(n.name, idx)})">
          <line x1="${stemX}" y1="${noteY}" x2="${stemX}" y2="${stemY2}" class="note-stem" />
          <ellipse cx="${n.x}" cy="${noteY}" rx="9" ry="6.8" transform="rotate(-22, ${n.x}, ${noteY})" class="note-head" />
          <text x="${n.x}" y="${isStemUp ? stemY2 - 8 : stemY2 + 18}" class="staff-note-label">${n.name}</text>
        </g>
      `;
    });

    container.innerHTML = `
      <svg viewBox="0 0 400 150" class="staff-svg">
        ${linesSvg}
        ${clefSvg}
        ${notesSvg}
      </svg>
    `;
  }

  getFreqForGuideNote(name, lineIdx) {
    const map = { 'Mi': 329.63, 'Sol': 392.00, 'Si': 493.88, 'Re': 587.33, 'Fa': 698.46 };
    return map[name] || 440;
  }

  getFreqForSpaceNote(name, idx) {
    const map = { 'Fa': 349.23, 'La': 440.00, 'Do': 523.25, 'Mi': 659.25 };
    return map[name] || 440;
  }

  /**
   * Fills the comparative summary table
   */
  populateSummaryTable() {
    const tbody = document.getElementById('theory-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    NOTES_DATA.forEach(n => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong style="color:var(--accent-gold);">${n.nameSolfege}</strong></td>
        <td><code>${n.nameEnglish}</code></td>
        <td>${n.positionText}</td>
        <td><span class="detail-type-badge">${n.shortPos}</span></td>
        <td>${n.frequency.toFixed(2)} Hz</td>
        <td>Klavye: <code>${n.keyboardKey}</code></td>
        <td>
          <button class="play-table-btn" onclick="window.pianoAudio.playNote(${n.frequency})">
            ▶ Dinle
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }
}

// Global instance
window.theoryGuide = new TheoryGuide();
