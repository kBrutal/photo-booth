// AETHERBOOTH - Application Controller

// Safe LocalStorage wrapper for sandboxed browser environments
const SafeStorage = {
  _memoryDb: {},
  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn("Storage access denied, falling back to memory:", e);
      return this._memoryDb[key] || null;
    }
  },
  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("Storage access denied, writing to memory:", e);
      this._memoryDb[key] = value;
    }
  }
};

// Audio Synthesizer via Web Audio API
class AudioSynthesizer {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playBeep(freq = 800, duration = 0.08) {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playShutter() {
    this.init();
    
    // Synthesize shutter clicking noise
    const bufferSize = this.ctx.sampleRate * 0.15; // 0.15s duration
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;

    // Filter to make noise metallic
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noiseNode.start();
  }

  playWin() {
    this.init();
    const now = this.ctx.currentTime;
    // C-major arpeggio
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      
      gain.gain.setValueAtTime(0.06, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.35);
    });
  }
}

const sound = new AudioSynthesizer();

// Confetti Effect Engine
class ConfettiEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.active = false;
    this.animationId = null;
  }

  start() {
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '300';
    document.body.appendChild(this.canvas);
    
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    this.particles = [];
    const colors = ['#9333ea', '#ec4899', '#06b6d4', '#10b981', '#fbbf24', '#f87171'];
    
    for (let i = 0; i < 100; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height - this.canvas.height,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: Math.random() * 4 - 2,
        speedY: Math.random() * 5 + 3,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 4 - 2
      });
    }
    
    this.active = true;
    this.loop();
    
    // Stop after 5 seconds
    setTimeout(() => this.stop(), 5000);
  }

  resize() {
    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  }

  loop() {
    if (!this.active) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    let finished = true;
    
    this.particles.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX;
      p.rotation += p.rotationSpeed;
      
      if (p.y < this.canvas.height) {
        finished = false;
      }
      
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      this.ctx.restore();
    });
    
    if (!finished) {
      this.animationId = requestAnimationFrame(() => this.loop());
    } else {
      this.stop();
    }
  }

  stop() {
    this.active = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}

const confetti = new ConfettiEngine();

// Main Application Logic
const AetherBooth = {
  // Config variables
  filmWidth: 460,
  filmHeight: 1060,
  photoWidth: 400,
  photoHeight: 300,
  photoPaddingSide: 30,
  photoPaddingTop: 40,
  photoSpacing: 20,
  
  // State
  mediaStream: null,
  capturedFrames: [], // Holds the 3 canvas snapshots of size 400x300
  currentCaptureIndex: 0, // 0, 1, or 2
  selectedFilter: 'normal',
  selectedFrame: 'none',
  currentFacingMode: 'user', // 'user' (front) or 'environment' (back)
  compiledStripDataUrl: null,

  // Live Canvas Preview variables
  previewLoopId: null,
  dynamicPreviewInterval: null,

  // Puzzle State
  puzzleState: [], // Array of 9 pieces { correctIndex, canvas }
  isSolving: false,

  // Active dragging states
  draggedIndex: null,
  activePointerId: null,
  draggedElement: null,
  placeholderElement: null,
  dragOffset: { x: 0, y: 0 },
  lastHoveredIndex: null,

  // Dom Elements
  dom: {},

  init() {
    this.cacheDomElements();
    this.bindEvents();
    this.loadGallery();
  },

  cacheDomElements() {
    this.dom.welcomeScreen = document.getElementById('welcome-screen');
    this.dom.boothScreen = document.getElementById('booth-screen');
    this.dom.puzzleScreen = document.getElementById('puzzle-screen');
    this.dom.galleryContainer = document.getElementById('gallery-container');

    this.dom.cameraCanvas = document.getElementById('camera-canvas');
    this.dom.videoPreview = document.getElementById('video-preview');
    this.dom.countdownOverlay = document.getElementById('countdown-overlay');
    this.dom.countdownNumber = document.getElementById('countdown-number');
    this.dom.flashOverlay = document.getElementById('flash-overlay');
    this.dom.captureIndicator = document.getElementById('capture-indicator');

    this.dom.btnStart = document.getElementById('btn-start');
    this.dom.btnCapture = document.getElementById('btn-capture');
    this.dom.btnBackHome = document.getElementById('btn-back-home');
    this.dom.btnFlipCamera = document.getElementById('btn-flip-camera');
    this.dom.cameraError = document.getElementById('camera-error');

    this.dom.filterOptions = document.getElementById('filter-options');
    this.dom.frameOptions = document.getElementById('frame-options');
    this.dom.frameOverlay = document.getElementById('frame-overlay');

    this.dom.boothStatusTitle = document.getElementById('booth-status-title');
    this.dom.boothStatusDesc = document.getElementById('booth-status-desc');

    this.dom.puzzleBoard = document.getElementById('puzzle-board');
    this.dom.puzzleGhostGuide = document.getElementById('puzzle-ghost-guide');
    this.dom.btnHint = document.getElementById('btn-hint');
    this.dom.btnResetPuzzle = document.getElementById('btn-reset-puzzle');
    this.dom.btnRetake = document.getElementById('btn-retake');
    this.dom.puzzleTitle = document.getElementById('puzzle-title');

    this.dom.unlockOverlay = document.getElementById('unlock-overlay');
    this.dom.btnUnlockContinue = document.getElementById('btn-unlock-continue');
    this.dom.unlockTitle = document.getElementById('unlock-title');
    this.dom.unlockMessage = document.getElementById('unlock-message');

    this.dom.successOverlay = document.getElementById('success-overlay');
    this.dom.solvedCanvasPreview = document.getElementById('solved-canvas-preview');
    this.dom.btnDownloadAgain = document.getElementById('btn-download-again');
    this.dom.btnSuccessNew = document.getElementById('btn-success-new');

    this.dom.galleryList = document.getElementById('gallery-list');
    this.dom.galleryEmptyState = document.getElementById('gallery-empty-state');

    this.dom.galleryModal = document.getElementById('gallery-modal');
    this.dom.modalImgPreview = document.getElementById('modal-img-preview');
    this.dom.btnModalDownload = document.getElementById('btn-modal-download');
    this.dom.btnModalDelete = document.getElementById('btn-modal-delete');
    this.dom.btnCloseModal = document.getElementById('btn-close-modal');

    this.dom.offscreenCanvas = document.getElementById('offscreen-canvas');
  },

  bindEvents() {
    // Navigation & Start
    this.dom.btnStart.addEventListener('click', () => this.startCameraSession());
    this.dom.btnBackHome.addEventListener('click', () => this.stopCameraSession());
    this.dom.btnSuccessNew.addEventListener('click', () => this.restartCaptureFromSuccess());
    this.dom.btnRetake.addEventListener('click', () => this.restartCaptureFromPuzzle());
    this.dom.btnUnlockContinue.addEventListener('click', () => this.continueToNextPhoto());
    if (this.dom.btnFlipCamera) {
      this.dom.btnFlipCamera.addEventListener('click', () => this.flipCamera());
    }

    // Capturing
    this.dom.btnCapture.addEventListener('click', () => this.startCaptureSequence());

    // Frame selection
    if (this.dom.frameOptions) {
      this.dom.frameOptions.addEventListener('click', (e) => {
        const btn = e.target.closest('.frame-btn');
        if (!btn) return;

        this.dom.frameOptions.querySelectorAll('.frame-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        this.selectedFrame = btn.dataset.frame;
        this.applyFrameToPreview();
      });
    }

    // Filters selection
    this.dom.filterOptions.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;

      this.dom.filterOptions.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      this.selectedFilter = btn.dataset.filter;
      this.applyFilterToPreview();
    });

    // Puzzle view guide toggle & Skip
    this.dom.btnHint.addEventListener('mousedown', () => this.toggleGuide(true));
    this.dom.btnHint.addEventListener('mouseup', () => this.toggleGuide(false));
    this.dom.btnHint.addEventListener('mouseleave', () => this.toggleGuide(false));
    this.dom.btnHint.addEventListener('touchstart', (e) => { e.preventDefault(); this.toggleGuide(true); });
    this.dom.btnHint.addEventListener('touchend', () => this.toggleGuide(false));
    
    this.dom.btnResetPuzzle.addEventListener('click', () => this.scramblePuzzle(true));
    
    // Success Actions
    this.dom.btnDownloadAgain.addEventListener('click', () => this.downloadCompiledStrip());
    
    // Gallery modal actions
    this.dom.btnCloseModal.addEventListener('click', () => this.closeGalleryModal());
    this.dom.btnModalDownload.addEventListener('click', () => this.downloadModalItem());
    this.dom.btnModalDelete.addEventListener('click', () => this.deleteModalItem());
  },

  // View Controller Helper
  showView(section) {
    [this.dom.welcomeScreen, this.dom.boothScreen, this.dom.puzzleScreen].forEach(view => {
      view.classList.remove('active');
      setTimeout(() => { view.style.display = 'none'; }, 300);
    });
    
    setTimeout(() => {
      section.style.display = 'block';
      section.offsetHeight;
      section.classList.add('active');
    }, 310);
    
    if (section === this.dom.welcomeScreen) {
      this.dom.galleryContainer.classList.remove('hidden');
    } else {
      this.dom.galleryContainer.classList.add('hidden');
    }
  },

  /* ==========================================
     CAMERA AND STREAM CONTROL & PREVIEW LOOP
     ========================================== */
  async startCameraSession() {
    this.dom.cameraError.classList.add('hidden');
    
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: this.currentFacingMode
        },
        audio: false
      });
      
      this.dom.videoPreview.srcObject = this.mediaStream;
      
      // Setup display canvas size
      this.dom.cameraCanvas.width = this.photoWidth;
      this.dom.cameraCanvas.height = this.photoHeight;
      
      this.showView(this.dom.boothScreen);
      this.dom.captureIndicator.classList.remove('hidden');
      
      this.currentCaptureIndex = 0;
      this.selectedFilter = 'normal';
      this.applyFilterToPreview();
      
      this.resetBoothSlots();
      this.updateBoothStatusText();
      
      sound.init(); // Warmup Audio
      
      // Start real-time preview canvas loop
      this.startLivePreviewLoop();
      
      // Initial dynamic snapshot capture once camera adjusts exposure (1.2s delay)
      setTimeout(() => {
        this.captureDynamicPreview();
      }, 1200);
      
      // Periodically refresh the dynamic filter previews every 2.5 seconds for accuracy
      this.dynamicPreviewInterval = setInterval(() => {
        this.captureDynamicPreview();
      }, 2500);
      
    } catch (err) {
      console.error("Camera connection failed:", err);
      this.dom.cameraError.classList.remove('hidden');
    }
  },

  stopCameraSession() {
    if (this.dynamicPreviewInterval) {
      clearInterval(this.dynamicPreviewInterval);
      this.dynamicPreviewInterval = null;
    }
    if (this.previewLoopId) {
      cancelAnimationFrame(this.previewLoopId);
      this.previewLoopId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.dom.videoPreview.srcObject = null;
    this.dom.captureIndicator.classList.add('hidden');
    
    // Reset previews background to default vector silhouette on stop
    const previews = this.dom.filterOptions.querySelectorAll('.filter-preview');
    previews.forEach(p => {
      p.style.backgroundImage = '';
    });
    
    this.showView(this.dom.welcomeScreen);
  },

  startLivePreviewLoop() {
    if (this.previewLoopId) {
      cancelAnimationFrame(this.previewLoopId);
    }
    
    const render = () => {
      if (this.mediaStream && this.dom.videoPreview.readyState >= 2) {
        this.renderLiveFrame();
      }
      this.previewLoopId = requestAnimationFrame(render);
    };
    
    this.previewLoopId = requestAnimationFrame(render);
  },

  async flipCamera() {
    this.currentFacingMode = (this.currentFacingMode === 'user') ? 'environment' : 'user';
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: this.currentFacingMode
        },
        audio: false
      });
      this.dom.videoPreview.srcObject = this.mediaStream;
    } catch (err) {
      console.warn("Could not switch camera mode:", err);
    }
  },

  renderLiveFrame() {
    const canvas = this.dom.cameraCanvas;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    if (this.currentFacingMode === 'user') {
      ctx.translate(this.photoWidth, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(this.dom.videoPreview, 0, 0, this.photoWidth, this.photoHeight);
    ctx.restore();
  },

  captureDynamicPreview() {
    if (!this.mediaStream || this.dom.videoPreview.readyState < 2) return;
    
    // Generate small 100x75 thumbnail snapshot
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 100;
    tempCanvas.height = 75;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Mirror the frame to keep view matches correct
    tempCtx.translate(100, 0);
    tempCtx.scale(-1, 1);
    tempCtx.drawImage(this.dom.videoPreview, 0, 0, 100, 75);
    
    try {
      const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.6);
      
      // Update background of all tabs
      const previews = this.dom.filterOptions.querySelectorAll('.filter-preview');
      previews.forEach(p => {
        p.style.backgroundImage = `url(${dataUrl})`;
      });
    } catch (e) {
      console.warn("Could not capture dynamic filter preview thumbnail: ", e);
    }
  },

  applyFilterToPreview() {
    this.dom.cameraCanvas.className = '';
    if (this.selectedFilter !== 'normal') {
      this.dom.cameraCanvas.classList.add(`filter-${this.selectedFilter}`);
    }
  },

  applyFrameToPreview() {
    if (!this.dom.frameOverlay) return;
    this.dom.frameOverlay.className = 'frame-overlay';
    if (this.selectedFrame && this.selectedFrame !== 'none') {
      this.dom.frameOverlay.classList.add(`frame-${this.selectedFrame}`);
    } else {
      this.dom.frameOverlay.classList.add('frame-none');
    }
  },

  drawFrameOverlayToCanvas(ctx, width, height, frame) {
    if (!frame || frame === 'none') return;

    ctx.save();

    if (frame === 'dslr') {
      // 1. DSLR Pro Viewfinder (Wide dark bezel, AF box, grid lines & LCD status)
      const border = 24;
      ctx.fillStyle = 'rgba(12, 12, 14, 0.75)';
      ctx.fillRect(0, 0, width, border);
      ctx.fillRect(0, height - border, width, border);
      ctx.fillRect(0, 0, border, height);
      ctx.fillRect(width - border, 0, border, height);

      // Inner glass border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(border, border, width - border * 2, height - border * 2);

      // Rule-of-thirds grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(width / 3, border); ctx.lineTo(width / 3, height - border);
      ctx.moveTo((width / 3) * 2, border); ctx.lineTo((width / 3) * 2, height - border);
      ctx.moveTo(border, height / 3); ctx.lineTo(width - border, height / 3);
      ctx.moveTo(border, (height / 3) * 2); ctx.lineTo(width - border, (height / 3) * 2);
      ctx.stroke();

      // Center AF Focus Target Box & Crosshairs
      const cx = width / 2;
      const cy = height / 2;
      ctx.strokeStyle = '#00ff66';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - 24, cy - 24, 48, 48);

      ctx.beginPath();
      ctx.moveTo(cx - 8, cy); ctx.lineTo(cx + 8, cy);
      ctx.moveTo(cx, cy - 8); ctx.lineTo(cx, cy + 8);
      ctx.stroke();

      // Top REC & Battery Status
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(28, 4, 110, 18);
      ctx.font = 'bold 10px "Courier New", monospace';
      ctx.fillStyle = '#ff4d4d';
      ctx.fillText('REC 🔴 00:04:12', 32, 17);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(width - 130, 4, 102, 18);
      ctx.fillStyle = '#00ff66';
      ctx.fillText('🔋 98%  SD:OK', width - 124, 17);

      // Bottom Camera LCD Status Readout
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(width / 2 - 135, height - 20, 270, 18);
      ctx.strokeStyle = 'rgba(0, 255, 102, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(width / 2 - 135, height - 20, 270, 18);

      ctx.font = 'bold 10px "Courier New", monospace';
      ctx.fillStyle = '#00ff66';
      ctx.textAlign = 'center';
      ctx.fillText('1/250s   f/1.8   ISO 200   EV +0.3   [03/36]', width / 2, height - 7);
      ctx.textAlign = 'left';

    } else if (frame === 'film') {
      // 2. Authentic 35mm Film Negative Roll
      const border = 26;
      ctx.fillStyle = '#0d0d0f';
      ctx.fillRect(0, 0, width, border);
      ctx.fillRect(0, height - border, width, border);
      ctx.fillRect(0, 0, border, height);
      ctx.fillRect(width - border, 0, border, height);

      // Top film markings
      ctx.font = 'bold 10px "Courier New", monospace';
      ctx.fillStyle = '#d99b26';
      ctx.fillText('▶ KODAK SAFETY FILM 5063  •  ISO 400', 16, 17);

      // Bottom film markings
      ctx.fillText('▶ 12A  •  EASTMAN KODAK CO.  •  24 EXP', width - 230, height - 7);

      // Viewfinder corner marks
      ctx.strokeStyle = '#d99b26';
      ctx.lineWidth = 2;
      const t = 32;
      // Top-Left corner tick
      ctx.beginPath(); ctx.moveTo(t, border + 4); ctx.lineTo(border + 4, border + 4); ctx.lineTo(border + 4, t); ctx.stroke();
      // Top-Right corner tick
      ctx.beginPath(); ctx.moveTo(width - t, border + 4); ctx.lineTo(width - border - 4, border + 4); ctx.lineTo(width - border - 4, t); ctx.stroke();
      // Bottom-Left corner tick
      ctx.beginPath(); ctx.moveTo(t, height - border - 4); ctx.lineTo(border + 4, height - border - 4); ctx.lineTo(border + 4, height - t); ctx.stroke();
      // Bottom-Right corner tick
      ctx.beginPath(); ctx.moveTo(width - t, height - border - 4); ctx.lineTo(width - border - 4, height - border - 4); ctx.lineTo(width - border - 4, height - t); ctx.stroke();

    } else if (frame === 'instax') {
      // 3. Wide Instax / Polaroid Frame
      const topBorder = 20;
      const sideBorder = 22;
      const bottomBorder = 48;

      ctx.fillStyle = '#f8f6f0';
      ctx.fillRect(0, 0, width, topBorder);
      ctx.fillRect(0, height - bottomBorder, width, bottomBorder);
      ctx.fillRect(0, 0, sideBorder, height);
      ctx.fillRect(width - sideBorder, 0, sideBorder, height);

      // Inner shadow border around photo
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.lineWidth = 2;
      ctx.strokeRect(sideBorder, topBorder, width - sideBorder * 2, height - topBorder - bottomBorder);

      // Top stamp text
      ctx.font = 'bold 9px "Courier New", monospace';
      ctx.fillStyle = '#4a453f';
      ctx.fillText('INSTAX WIDE • READY 📸', width - 150, 14);

      // Bottom handwritten chin text
      ctx.font = 'italic bold 14px Georgia, serif';
      ctx.fillStyle = '#2d1f10';
      ctx.textAlign = 'center';
      ctx.fillText('★ PHOTO BOOTH MEMORIES ★', width / 2, height - 16);
      ctx.textAlign = 'left';
    }

    ctx.restore();
  },

  updateBoothStatusText() {
    const num = this.currentCaptureIndex + 1;
    this.dom.boothStatusTitle.innerText = `Ready for Photo ${num}?`;
    this.dom.boothStatusDesc.innerText = `Click the button below to start the countdown for Photo ${num} of 3.`;
    this.dom.btnCapture.innerHTML = `<i class="fa-solid fa-camera"></i> Take Photo ${num}`;
    this.dom.btnCapture.disabled = false;
  },

  resetBoothSlots() {
    this.capturedFrames = [];
    for (let i = 0; i < 3; i++) {
      const slot = document.getElementById(`slot-${i}`);
      slot.innerHTML = `<div class="slot-placeholder"><i class="fa-solid fa-image"></i><span>Photo ${i+1}</span></div>`;
      slot.classList.remove('captured');
    }
  },

  /* ==========================================
     PURE PIXEL MATRIX FILTER TRANSFORMERS
     ========================================== */
  applyFilterToCanvas(ctx, width, height, filter) {
    if (!filter || filter === 'normal') return;
    
    const imgData = ctx.getImageData(0, 0, width, height);
    const d = imgData.data;
    
    switch (filter) {
      case 'kodachrome':
        for (let i = 0; i < d.length; i += 4) {
          let r = d[i] * 1.15 + 10;
          let g = d[i+1] * 1.05 + 5;
          let b = d[i+2] * 0.90 - 5;
          d[i]   = Math.min(255, Math.max(0, (r - 128) * 1.15 + 128));
          d[i+1] = Math.min(255, Math.max(0, (g - 128) * 1.15 + 128));
          d[i+2] = Math.min(255, Math.max(0, (b - 128) * 1.15 + 128));
        }
        break;

      case 'polaroid':
        for (let i = 0; i < d.length; i += 4) {
          let r = d[i] * 0.85 + 30;
          let g = d[i+1] * 0.82 + 25;
          let b = d[i+2] * 0.72 + 35;
          d[i]   = Math.min(255, Math.max(0, r));
          d[i+1] = Math.min(255, Math.max(0, g));
          d[i+2] = Math.min(255, Math.max(0, b));
        }
        break;

      case 'sunkissed':
        for (let i = 0; i < d.length; i += 4) {
          let r = d[i] * 1.20 + 15;
          let g = d[i+1] * 1.08 + 10;
          let b = d[i+2] * 0.80 - 10;
          d[i]   = Math.min(255, Math.max(0, r));
          d[i+1] = Math.min(255, Math.max(0, g));
          d[i+2] = Math.min(255, Math.max(0, b));
        }
        break;

      case 'autumn':
        for (let i = 0; i < d.length; i += 4) {
          let r = d[i] * 1.35 + 10;
          let g = d[i+1] * 0.95 - 5;
          let b = d[i+2] * 0.65 - 15;
          d[i]   = Math.min(255, Math.max(0, (r - 128) * 1.25 + 128));
          d[i+1] = Math.min(255, Math.max(0, (g - 128) * 1.25 + 128));
          d[i+2] = Math.min(255, Math.max(0, (b - 128) * 1.25 + 128));
        }
        break;

      case 'flash':
        for (let i = 0; i < d.length; i += 4) {
          let r = d[i] * 1.25 + 20;
          let g = d[i+1] * 1.25 + 20;
          let b = d[i+2] * 1.35 + 25;
          d[i]   = Math.min(255, Math.max(0, r));
          d[i+1] = Math.min(255, Math.max(0, g));
          d[i+2] = Math.min(255, Math.max(0, b));
        }
        break;

      case 'trix':
        for (let i = 0; i < d.length; i += 4) {
          let gray = 0.45 * d[i] + 0.45 * d[i+1] + 0.10 * d[i+2];
          let contrastGray = Math.min(255, Math.max(0, (gray - 128) * 1.45 + 128));
          d[i]   = contrastGray;
          d[i+1] = contrastGray;
          d[i+2] = contrastGray;
        }
        break;

      case 'fuji':
        for (let i = 0; i < d.length; i += 4) {
          let r = d[i] * 0.92;
          let g = d[i+1] * 1.12 + 10;
          let b = d[i+2] * 1.15 + 15;
          d[i]   = Math.min(255, Math.max(0, r));
          d[i+1] = Math.min(255, Math.max(0, g));
          d[i+2] = Math.min(255, Math.max(0, b));
        }
        break;

      case 'vhs':
        for (let i = 0; i < d.length; i += 4) {
          let r = d[i] * 1.25 - 10;
          let g = d[i+1] * 1.10;
          let b = d[i+2] * 1.35 + 20;
          d[i]   = Math.min(255, Math.max(0, r));
          d[i+1] = Math.min(255, Math.max(0, g));
          d[i+2] = Math.min(255, Math.max(0, b));
        }
        break;
    }
    
    ctx.putImageData(imgData, 0, 0);
  },

  /* ==========================================
     SNAPSHOT CAPTURE SEQUENCE
     ========================================== */
  async startCaptureSequence() {
    this.dom.btnCapture.disabled = true;
    this.dom.btnCapture.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Posing...';
    
    // Run Countdown (3 seconds)
    await this.runCountdown(3);
    
    // Shutter Sound & Flash
    sound.playShutter();
    this.triggerFlashEffect();
    
    // Capture snapshot from display canvas
    const imageCanvas = document.createElement('canvas');
    imageCanvas.width = this.photoWidth;
    imageCanvas.height = this.photoHeight;
    const sctx = imageCanvas.getContext('2d');
    sctx.drawImage(this.dom.cameraCanvas, 0, 0);
    
    this.capturedFrames[this.currentCaptureIndex] = imageCanvas;
    
    // Show thumbnail slot
    this.renderThumbnailToSlot(this.currentCaptureIndex, imageCanvas);
    
    // Stop preview loop temporarily
    if (this.previewLoopId) {
      cancelAnimationFrame(this.previewLoopId);
      this.previewLoopId = null;
    }
    if (this.dynamicPreviewInterval) {
      clearInterval(this.dynamicPreviewInterval);
      this.dynamicPreviewInterval = null;
    }
    
    // Switch to Puzzle Slicing and Board generation
    setTimeout(() => {
      this.preparePuzzle();
    }, 600);
  },

  runCountdown(seconds) {
    return new Promise(resolve => {
      this.dom.countdownOverlay.classList.remove('hidden');
      let count = seconds;
      this.dom.countdownNumber.innerText = count;
      
      // Play initial beep
      sound.playBeep(750, 0.08);
      
      const interval = setInterval(() => {
        count--;
        if (count > 0) {
          this.dom.countdownNumber.innerText = count;
          sound.playBeep(750, 0.08);
        } else {
          clearInterval(interval);
          this.dom.countdownOverlay.classList.add('hidden');
          resolve();
        }
      }, 950);
    });
  },

  triggerFlashEffect() {
    this.dom.flashOverlay.classList.remove('flash-active');
    this.dom.flashOverlay.offsetWidth;
    this.dom.flashOverlay.classList.add('flash-active');
    setTimeout(() => {
      this.dom.flashOverlay.classList.remove('flash-active');
    }, 450);
  },

  renderThumbnailToSlot(index, canvasElement) {
    const slot = document.getElementById(`slot-${index}`);
    slot.innerHTML = '';
    
    // Create miniature view
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 100;
    thumbCanvas.height = 75;
    const tctx = thumbCanvas.getContext('2d');
    tctx.drawImage(canvasElement, 0, 0, thumbCanvas.width, thumbCanvas.height);
    this.applyFilterToCanvas(tctx, 100, 75, this.selectedFilter);
    
    slot.appendChild(thumbCanvas);
    slot.classList.add('captured');
  },

  /* ==========================================
     PUZZLE SETUP & GAME MECHANICS
     ========================================== */
  preparePuzzle() {
    const activePhoto = this.capturedFrames[this.currentCaptureIndex];
    
    // Create a temporary canvas containing the captured photo with the filter applied
    const filteredCanvas = document.createElement('canvas');
    filteredCanvas.width = this.photoWidth;
    filteredCanvas.height = this.photoHeight;
    const fctx = filteredCanvas.getContext('2d');
    fctx.drawImage(activePhoto, 0, 0);
    this.applyFilterToCanvas(fctx, this.photoWidth, this.photoHeight, this.selectedFilter);
    this.drawFrameOverlayToCanvas(fctx, this.photoWidth, this.photoHeight, this.selectedFrame);
    
    const photoDataUrl = filteredCanvas.toDataURL('image/jpeg', 0.9);
    
    // Setup ghost guide hint image
    this.dom.puzzleGhostGuide.style.backgroundImage = `url(${photoDataUrl})`;
    
    const sliceWidth = this.photoWidth / 3;
    const sliceHeight = this.photoHeight / 3;
    
    this.puzzleState = [];
    
    // Slice into 3x3 chunks
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const correctIdx = r * 3 + c;
        
        // Render piece
        const pieceCanvas = document.createElement('canvas');
        pieceCanvas.width = sliceWidth;
        pieceCanvas.height = sliceHeight;
        const pctx = pieceCanvas.getContext('2d');
        
        pctx.drawImage(
          filteredCanvas,
          c * sliceWidth, r * sliceHeight, sliceWidth, sliceHeight, // Source slice
          0, 0, sliceWidth, sliceHeight // Canvas destination
        );
        
        this.puzzleState.push({
          correctIndex: correctIdx,
          canvas: pieceCanvas
        });
      }
    }
    
    this.scramblePuzzle(false);
    
    // Set headers
    const num = this.currentCaptureIndex + 1;
    this.dom.puzzleTitle.innerText = `Unscramble Photo ${num}`;
    
    // Transition view
    this.showView(this.dom.puzzleScreen);
  },

  scramblePuzzle(isReset) {
    let tempArray = [...this.puzzleState];
    let scrambles = [];
    
    let isSame = true;
    while (isSame) {
      scrambles = [];
      const indexList = [0, 1, 2, 3, 4, 5, 6, 7, 8];
      
      for (let i = indexList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indexList[i], indexList[j]] = [indexList[j], indexList[i]];
      }
      
      for (let i = 0; i < 9; i++) {
        scrambles.push(tempArray[indexList[i]]);
      }
      
      isSame = scrambles.every((piece, idx) => piece.correctIndex === idx);
    }
    
    this.puzzleState = scrambles;
    this.renderPuzzleBoard();
    this.isSolving = true;
  },

  toggleGuide(show) {
    if (show) {
      this.dom.puzzleGhostGuide.classList.remove('hidden');
    } else {
      this.dom.puzzleGhostGuide.classList.add('hidden');
    }
  },

  renderPuzzleBoard() {
    this.dom.puzzleBoard.innerHTML = '';
    
    this.puzzleState.forEach((piece, gridIdx) => {
      const cell = document.createElement('div');
      cell.classList.add('puzzle-cell');
      cell.dataset.gridIndex = gridIdx;
      cell.dataset.correctIndex = piece.correctIndex;
      
      cell.appendChild(piece.canvas);
      
      if (piece.correctIndex === gridIdx) {
        cell.classList.add('solved');
      }
      
      cell.addEventListener('pointerdown', (e) => this.onPointerDown(e, cell));
      this.dom.puzzleBoard.appendChild(cell);
    });
  },

  /* ==========================================
     POINTER EVENTS DRAG & SWAP
     ========================================== */
  onPointerDown(e, cell) {
    if (!this.isSolving) return;
    if (this.activePointerId !== null) return;
    
    e.preventDefault();
    
    this.activePointerId = e.pointerId;
    this.draggedIndex = parseInt(cell.dataset.gridIndex);
    this.draggedElement = cell;
    
    cell.setPointerCapture(e.pointerId);
    
    const rect = cell.getBoundingClientRect();
    this.dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    this.placeholderElement = document.createElement('div');
    this.placeholderElement.classList.add('puzzle-cell');
    this.placeholderElement.style.visibility = 'hidden';
    
    this.dom.puzzleBoard.insertBefore(this.placeholderElement, cell);
    
    this.draggedElement.classList.add('dragging');
    this.draggedElement.style.position = 'absolute';
    this.draggedElement.style.width = `${rect.width}px`;
    this.draggedElement.style.height = `${rect.height}px`;
    
    const boardRect = this.dom.puzzleBoard.getBoundingClientRect();
    const initLeft = rect.left - boardRect.left + this.dom.puzzleBoard.scrollLeft;
    const initTop = rect.top - boardRect.top + this.dom.puzzleBoard.scrollTop;
    
    this.draggedElement.style.left = `${initLeft}px`;
    this.draggedElement.style.top = `${initTop}px`;
    
    this.onPointerMoveBound = (evt) => this.onPointerMove(evt);
    this.onPointerUpBound = (evt) => this.onPointerUp(evt);
    
    window.addEventListener('pointermove', this.onPointerMoveBound);
    window.addEventListener('pointerup', this.onPointerUpBound);
  },

  onPointerMove(e) {
    if (e.pointerId !== this.activePointerId) return;
    
    const boardRect = this.dom.puzzleBoard.getBoundingClientRect();
    const leftX = e.clientX - boardRect.left - this.dragOffset.x;
    const topY = e.clientY - boardRect.top - this.dragOffset.y;
    
    this.draggedElement.style.left = `${leftX}px`;
    this.draggedElement.style.top = `${topY}px`;
    
    const cellIdx = this.getCellIndexFromPointer(e.clientX, e.clientY);
    this.dom.puzzleBoard.querySelectorAll('.puzzle-cell').forEach(c => c.classList.remove('drag-over'));
    
    if (cellIdx !== null && cellIdx !== this.draggedIndex) {
      const targetCell = this.dom.puzzleBoard.querySelector(`[data-grid-index="${cellIdx}"]`);
      if (targetCell && targetCell !== this.placeholderElement) {
        targetCell.classList.add('drag-over');
        this.lastHoveredIndex = cellIdx;
      }
    } else {
      this.lastHoveredIndex = null;
    }
  },

  onPointerUp(e) {
    if (e.pointerId !== this.activePointerId) return;
    
    window.removeEventListener('pointermove', this.onPointerMoveBound);
    window.removeEventListener('pointerup', this.onPointerUpBound);
    
    this.draggedElement.releasePointerCapture(this.activePointerId);
    
    this.draggedElement.classList.remove('dragging');
    this.draggedElement.style.position = '';
    this.draggedElement.style.width = '';
    this.draggedElement.style.height = '';
    this.draggedElement.style.left = '';
    this.draggedElement.style.top = '';
    
    if (this.placeholderElement && this.placeholderElement.parentNode) {
      this.placeholderElement.parentNode.removeChild(this.placeholderElement);
    }
    
    const targetIdx = this.lastHoveredIndex;
    
    if (targetIdx !== null && targetIdx !== undefined && targetIdx !== this.draggedIndex) {
      const temp = this.puzzleState[this.draggedIndex];
      this.puzzleState[this.draggedIndex] = this.puzzleState[targetIdx];
      this.puzzleState[targetIdx] = temp;
      
      sound.playBeep(450, 0.05); // snap feedback
    }
    
    this.draggedIndex = null;
    this.activePointerId = null;
    this.draggedElement = null;
    this.placeholderElement = null;
    this.lastHoveredIndex = null;
    
    this.renderPuzzleBoard();
    this.checkPuzzleSolve();
  },

  getCellIndexFromPointer(clientX, clientY) {
    const boardRect = this.dom.puzzleBoard.getBoundingClientRect();
    
    if (
      clientX < boardRect.left ||
      clientX > boardRect.right ||
      clientY < boardRect.top ||
      clientY > boardRect.bottom
    ) {
      return null;
    }
    
    const localX = clientX - boardRect.left;
    const localY = clientY - boardRect.top;
    
    const colWidth = boardRect.width / 3;
    const rowHeight = boardRect.height / 3;
    
    const col = Math.floor(localX / colWidth);
    const row = Math.floor(localY / rowHeight);
    
    const finalCol = Math.min(Math.max(col, 0), 2);
    const finalRow = Math.min(Math.max(row, 0), 2);
    
    return finalRow * 3 + finalCol;
  },

  checkPuzzleSolve() {
    const isSolved = this.puzzleState.every((piece, idx) => piece.correctIndex === idx);
    
    if (isSolved) {
      this.triggerPuzzleComplete();
    }
  },

  /* ==========================================
     SOLVE HANDLING & VICTORY FLOW
     ========================================== */
  triggerPuzzleComplete() {
    this.isSolving = false;
    sound.playWin();
    
    if (this.currentCaptureIndex < 2) {
      const num = this.currentCaptureIndex + 1;
      this.dom.unlockTitle.innerText = `Photo ${num} Unlocked!`;
      this.dom.unlockMessage.innerText = `Great job! Ready to strike a pose for Photo ${num + 1}?`;
      this.dom.unlockOverlay.classList.remove('hidden');
    } else {
      this.compileFinalFilmStrip();
      confetti.start();
    }
  },

  continueToNextPhoto() {
    this.dom.unlockOverlay.classList.add('hidden');
    this.currentCaptureIndex++;
    
    // Re-enable camera preview loop
    this.startLivePreviewLoop();
    
    // Start repeating interval again for dynamic previews
    this.dynamicPreviewInterval = setInterval(() => {
      this.captureDynamicPreview();
    }, 2500);
    
    this.updateBoothStatusText();
    this.showView(this.dom.boothScreen);
  },

  restartCaptureFromSuccess() {
    this.dom.successOverlay.classList.add('hidden');
    this.startCameraSession();
  },

  restartCaptureFromPuzzle() {
    this.startLivePreviewLoop();
    
    // Restart repeating interval
    this.dynamicPreviewInterval = setInterval(() => {
      this.captureDynamicPreview();
    }, 2500);
    
    this.updateBoothStatusText();
    this.showView(this.dom.boothScreen);
  },

  /* ==========================================
     FILM STRIP ASSEMBLY
     ========================================== */
  compileFinalFilmStrip() {
    const canvas = this.dom.offscreenCanvas;
    canvas.width = this.filmWidth;
    canvas.height = this.filmHeight;
    const ctx = canvas.getContext('2d');
    
    // 1. Draw Background (Retro off-black film base)
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, this.filmWidth, this.filmHeight);
    
    // 2. Draw film sprocket holes
    ctx.fillStyle = '#cc5a16';
    const drawSprockets = (x) => {
      for (let y = 15; y < this.filmHeight; y += 32) {
        ctx.beginPath();
        ctx.roundRect(x, y, 8, 14, 2);
        ctx.fill();
      }
    };
    drawSprockets(11);
    drawSprockets(this.filmWidth - 19);
    
    // 3. Draw Photos
    this.capturedFrames.forEach((frame, idx) => {
      const topY = this.photoPaddingTop + idx * (this.photoHeight + this.photoSpacing);
      
      // Border around photo
      ctx.strokeStyle = '#2d1f10';
      ctx.lineWidth = 3;
      ctx.strokeRect(this.photoPaddingSide - 1, topY - 1, this.photoWidth + 2, this.photoHeight + 2);
      
      // Draw frame canvas
      const tempFrame = document.createElement('canvas');
      tempFrame.width = this.photoWidth;
      tempFrame.height = this.photoHeight;
      const tfCtx = tempFrame.getContext('2d');
      tfCtx.drawImage(frame, 0, 0, this.photoWidth, this.photoHeight);
      
      // Apply pixel matrix filter cleanly without context corruption
      this.applyFilterToCanvas(tfCtx, this.photoWidth, this.photoHeight, this.selectedFilter);
      
      // Draw onto final strip
      ctx.drawImage(tempFrame, this.photoPaddingSide, topY, this.photoWidth, this.photoHeight);
    });
    
    // 4. Draw Footer Title & Date Info
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.fillStyle = '#cc5a16';
    ctx.textAlign = 'center';
    
    const now = new Date();
    const dateStr = now.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' }).toUpperCase();
    const timeStr = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
    
    ctx.fillText(`KODAK 400TX  •  ${dateStr} ${timeStr}`, this.filmWidth / 2, 1022);
    
    // Convert canvas synchronously to data URL (fast, robust, prevents corrupt PNG exports)
    const dataUrl = canvas.toDataURL('image/png');
    this.compiledStripDataUrl = dataUrl;
    
    // Render to success card preview
    this.dom.solvedCanvasPreview.width = this.filmWidth;
    this.dom.solvedCanvasPreview.height = this.filmHeight;
    const sctx = this.dom.solvedCanvasPreview.getContext('2d');
    sctx.drawImage(canvas, 0, 0);
    
    // Show victory overlay
    this.dom.successOverlay.classList.remove('hidden');
    
    // Trigger automatic file download
    this.downloadCompiledStrip(dataUrl);
    
    // Save item to gallery
    this.saveToGallery(dataUrl);
  },

  downloadCompiledStrip(overrideUrl) {
    const url = overrideUrl || this.compiledStripDataUrl;
    if (!url) return;
    
    const link = document.createElement('a');
    link.download = `aetherbooth-${Date.now()}.png`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (link.parentNode) link.parentNode.removeChild(link);
    }, 100);
  },

  /* ==========================================
     BROWSER LOCALSTORAGE GALLERY
     ========================================== */
  saveToGallery(dataUrl) {
    const imgData = dataUrl || this.dom.offscreenCanvas.toDataURL('image/jpeg', 0.85);
    
    let gallery = JSON.parse(SafeStorage.getItem('aether_gallery') || '[]');
    
    const newItem = {
      id: String(Date.now()),
      timestamp: Date.now(),
      imageData: imgData
    };
    
    gallery.unshift(newItem);
    
    if (gallery.length > 9) {
      gallery = gallery.slice(0, 9);
    }
    
    try {
      SafeStorage.setItem('aether_gallery', JSON.stringify(gallery));
    } catch (err) {
      console.warn("Storage warning - clearing space:", err);
      gallery.pop();
      SafeStorage.setItem('aether_gallery', JSON.stringify(gallery));
    }
    
    this.loadGallery();
  },

  loadGallery() {
    this.dom.galleryList.querySelectorAll('.gallery-item').forEach(el => el.remove());
    
    const gallery = JSON.parse(SafeStorage.getItem('aether_gallery') || '[]');
    
    if (gallery.length === 0) {
      this.dom.galleryEmptyState.classList.remove('hidden');
      return;
    }
    
    this.dom.galleryEmptyState.classList.add('hidden');
    
    gallery.forEach(item => {
      const card = document.createElement('div');
      card.classList.add('gallery-item');
      card.dataset.itemId = item.id;
      
      const img = document.createElement('img');
      img.src = item.imageData;
      img.alt = "Film Strip";
      
      const date = new Date(item.timestamp);
      const dateText = document.createElement('div');
      dateText.classList.add('gallery-item-date');
      dateText.innerText = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      
      card.appendChild(img);
      card.appendChild(dateText);
      
      card.addEventListener('click', () => this.openGalleryModal(item));
      
      this.dom.galleryList.appendChild(card);
    });
  },

  // Fullscreen modal interactions
  activeModalItem: null,

  openGalleryModal(item) {
    this.activeModalItem = item;
    this.dom.modalImgPreview.src = item.imageData;
    this.dom.galleryModal.classList.remove('hidden');
  },

  closeGalleryModal() {
    this.dom.galleryModal.classList.add('hidden');
    this.activeModalItem = null;
  },

  downloadModalItem() {
    if (!this.activeModalItem) return;
    
    const link = document.createElement('a');
    link.download = `aetherbooth-saved-${this.activeModalItem.id}.png`;
    link.href = this.activeModalItem.imageData;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (link.parentNode) link.parentNode.removeChild(link);
    }, 100);
  },

  deleteModalItem() {
    if (!this.activeModalItem) return;
    
    let gallery = JSON.parse(SafeStorage.getItem('aether_gallery') || '[]');
    gallery = gallery.filter(item => item.id !== this.activeModalItem.id);
    SafeStorage.setItem('aether_gallery', JSON.stringify(gallery));
    
    this.closeGalleryModal();
    this.loadGallery();
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => AetherBooth.init());
} else {
  AetherBooth.init();
}
