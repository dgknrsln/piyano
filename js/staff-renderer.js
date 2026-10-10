/**
 * VECTOR MUSICAL STAFF (PORTE / DİZEK) SVG RENDERER
 * Generates responsive, pixel-perfect SVG music notation for Sol Anahtarı (Treble Clef)
 */

class StaffRenderer {
  constructor() {
    // Staff geometry configuration
    this.config = {
      viewBoxWidth: 420,
      viewBoxHeight: 180,
      startX: 40,
      endX: 380,
      lineSpacing: 16,
      // Base line (Line 1 / Mi / E4) vertical coordinate
      baseLineY: 125,
      noteX: 250,
      noteRadiusX: 9.5,
      noteRadiusY: 7.2,
      noteAngle: -22
    };
  }

  /**
   * Generates complete SVG HTML for a given note
   * @param {Object} noteObj - Note object from NOTES_DATA
   * @param {Object} options - Render options: { showLabels: bool, showHelpers: bool, animated: bool, highlightLine: number }
   */
  renderStaffSvg(noteObj, options = {}) {
    const opts = {
      showLabels: false,
      showHelpers: true,
      animated: true,
      highlightLine: null,
      customNoteX: this.config.noteX,
      ...options
    };

    const { viewBoxWidth, viewBoxHeight, startX, endX, lineSpacing, baseLineY, noteRadiusX, noteRadiusY, noteAngle } = this.config;
    const noteX = opts.customNoteX;

    // Calculate vertical Y position of the note
    // staffIndex: -1 (C4 ledger), -0.5 (D4 space), 0 (E4 line 1), 0.5 (F4 space 1), 1.0 (G4 line 2), etc.
    const noteY = baseLineY - (noteObj.staffIndex * lineSpacing);

    // 1. Generate the 5 horizontal staff lines (Aşağıdan yukarıya 1'den 5'e)
    let linesSvg = '';
    for (let i = 0; i < 5; i++) {
      const lineY = baseLineY - (i * lineSpacing);
      const isHighlighted = (opts.highlightLine === (i + 1)) || (noteObj.positionType === 'line' && noteObj.lineNumber === (i + 1) && opts.showHelpers);
      const lineClass = isHighlighted ? 'staff-line highlighted' : 'staff-line';
      linesSvg += `<line x1="${startX}" y1="${lineY}" x2="${endX}" y2="${lineY}" class="${lineClass}" />\n`;
      
      // Optional line number markers (1..5 on the right side)
      if (opts.showHelpers) {
        linesSvg += `<text x="${endX + 12}" y="${lineY + 3.5}" class="staff-guide-label ${isHighlighted ? 'active' : ''}">${i + 1}</text>\n`;
      }
    }

    // 2. High-Precision Authentic Sol Anahtarı (Treble Clef)
    // Positioned on the 2nd line (Sol line) using standard music typography
    const clefX = startX + 16;
    const clefY = baseLineY - (1 * lineSpacing) + 24;
    const clefSvg = `
      <g class="clef-group">
        <text x="${clefX}" y="${clefY}" class="clef-symbol" font-family="'Noto Music', 'Bravura', 'Apple Music', 'Segoe UI Symbol', sans-serif" font-size="80" text-anchor="start">&#x1D11E;</text>
      </g>
    `;

    // 3. Ledger Line for notes outside staff (e.g. C4 / Orta Do at staffIndex: -1.0)
    let ledgerLinesSvg = '';
    if (noteObj.hasLedgerLine || noteObj.staffIndex <= -1.0) {
      // Draw ledger line segment
      const ledgerY = baseLineY - (-1.0 * lineSpacing);
      ledgerLinesSvg += `
        <line x1="${noteX - 22}" y1="${ledgerY}" x2="${noteX + 22}" y2="${ledgerY}" class="ledger-line active" />
      `;
    }

    // 4. Stem Calculation
    // Stem direction rule: up for notes below 3rd line, down for 3rd line and above
    const isStemUp = noteObj.stemDirection === 'up';
    const stemLength = 40;
    const stemX = isStemUp ? noteX + 7.5 : noteX - 7.5;
    const stemY1 = isStemUp ? noteY - 1 : noteY + 1;
    const stemY2 = isStemUp ? noteY - stemLength : noteY + stemLength;

    const stemSvg = `<line x1="${stemX}" y1="${stemY1}" x2="${stemX}" y2="${stemY2}" class="note-stem" />`;

    // 5. Note Label / Text (if option enabled)
    let noteLabelSvg = '';
    if (opts.showLabels) {
      const labelY = isStemUp ? stemY2 - 12 : stemY2 + 20;
      noteLabelSvg = `<text x="${noteX}" y="${labelY}" class="staff-note-label">${noteObj.nameSolfege}</text>`;
    }

    // 6. Assemble Full SVG
    return `
      <svg viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}" class="staff-svg" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Porte: ${noteObj.fullName}">
        <!-- Subtle background glow behind note -->
        <circle cx="${noteX}" cy="${noteY}" r="22" fill="url(#noteGlowGrad)" opacity="0.35" class="note-glow-pulse" />

        <!-- 5 Staff Lines -->
        <g class="staff-lines-group">
          ${linesSvg}
        </g>

        <!-- Clef Symbol -->
        ${clefSvg}

        <!-- Ledger Lines -->
        ${ledgerLinesSvg}

        <!-- Note Group (Head, Stem, Animation) -->
        <g class="note-group ${opts.animated ? 'note-enter-animate' : ''}" data-note-id="${noteObj.id}">
          <!-- Note Stem -->
          ${stemSvg}

          <!-- Note Head (Rotated Ellipse) -->
          <ellipse cx="${noteX}" cy="${noteY}" rx="${noteRadiusX}" ry="${noteRadiusY}" transform="rotate(${noteAngle}, ${noteX}, ${noteY})" class="note-head" />

          <!-- Note Labels (optional) -->
          ${noteLabelSvg}
        </g>

        <!-- SVG Gradients -->
        <defs>
          <radialGradient id="noteGlowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="#F59E0B" stop-opacity="0"/>
          </radialGradient>
        </defs>
      </svg>
    `;
  }

  /**
   * Renders staff directly into a DOM container element
   */
  renderIntoElement(elementId, noteObj, options = {}) {
    const container = typeof elementId === 'string' ? document.getElementById(elementId) : elementId;
    if (!container) return;
    container.innerHTML = this.renderStaffSvg(noteObj, options);
  }
}

// Global instance
window.staffRenderer = new StaffRenderer();
