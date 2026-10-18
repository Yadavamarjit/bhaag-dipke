// @ts-nocheck
import * as THREE from "three";

/* ==========================================================================
       1. DELHI SOUND SYSTEM (Web Audio API Synthesizer)
       ========================================================================== */
    class DelhiAudioEngine {
      constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.initialized = false;
        this.turnBuffer = null;
        this.jumpBuffer = null;
        this.endBuffer = null;
        this.introMemeBuffer = null;
        this.wooBuffer = null;
        this._turnRaw = null;
        this._jumpRaw = null;
        this._endRaw = null;
        this._introMemeRaw = null;
        this._wooRaw = null;
        this.isYelePlaying = false;
        this._hasPlayedGameOver = false;

        this._loadSound('/sfx/aree.mp3', (buf) => {
          this._turnRaw = buf;
          this._decodeBuffer('_turnRaw', 'turnBuffer');
        }, '/sfx/areee.mp3');

        this._loadSound('/sfx/yele2.mp3', (buf) => {
          this._jumpRaw = buf;
          this._decodeBuffer('_jumpRaw', 'jumpBuffer');
        }, '/sfx/yele_2.mp3');

        this._loadSound('/sfx/hosh.mp3', (buf) => {
          this._endRaw = buf;
          this._decodeBuffer('_endRaw', 'endBuffer');
        });

        this._loadSound('/sfx/intro.mp3', (buf) => {
          this._introMemeRaw = buf;
          this._decodeBuffer('_introMemeRaw', 'introMemeBuffer');
        }, '/intro.mp3');

        this._loadSound('/sfx/woo.mp3', (buf) => {
          this._wooRaw = buf;
          this._decodeBuffer('_wooRaw', 'wooBuffer');
        }, '/woo.mp3');
      }

      _loadSound(url, onData, fallbackUrl) {
        fetch(url)
          .then((r) => {
            if (!r.ok && fallbackUrl) return fetch(fallbackUrl);
            return r;
          })
          .then((r) => r.arrayBuffer())
          .then((buf) => onData(buf))
          .catch(() => {
            if (fallbackUrl) {
              fetch(fallbackUrl)
                .then((r) => r.arrayBuffer())
                .then((buf) => onData(buf))
                .catch(() => {});
            }
          });
      }

      _decodeBuffer(rawProp, bufferProp) {
        if (!this.ctx || !this[rawProp] || this[bufferProp]) return;
        const copy = this[rawProp].slice(0);
        this.ctx.decodeAudioData(copy).then((buffer) => {
          this[bufferProp] = buffer;
        }).catch(() => {});
      }

      _decodeAll() {
        this._decodeBuffer('_turnRaw', 'turnBuffer');
        this._decodeBuffer('_jumpRaw', 'jumpBuffer');
        this._decodeBuffer('_endRaw', 'endBuffer');
        this._decodeBuffer('_introMemeRaw', 'introMemeBuffer');
        this._decodeBuffer('_wooRaw', 'wooBuffer');
      }

      init() {
        if (this.initialized) return;
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          this.ctx = new AudioContext();
          this.initialized = true;
          this._decodeAll();
        } catch (e) {
          console.warn('Web Audio not supported');
        }
      }

      ensureCtx() {
        if (!this.initialized) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        if (this.ctx && !this._unlocked) {
          try {
            const buf = this.ctx.createBuffer(1, 1, 22050);
            const src = this.ctx.createBufferSource();
            src.buffer = buf;
            src.connect(this.ctx.destination);
            src.start(0);
            this._unlocked = true;
          } catch (e) {}
        }
      }

      resetGameOverSound() {
        this._hasPlayedGameOver = false;
      }

      playPoliceSiren() {
        if (!this.ctx || this.isMuted) return;
        try {
          this.ensureCtx();
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(650, now);
          osc.frequency.linearRampToValueAtTime(950, now + 0.35);
          osc.frequency.linearRampToValueAtTime(650, now + 0.7);

          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.72);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.75);
        } catch (e) {}
      }

      playHorn() {
        if (!this.ctx || this.isMuted) return;
        try {
          this.ensureCtx();
          const now = this.ctx.currentTime;
          const freqs = [410, 490];

          freqs.forEach(f => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(f, now);
            gain.gain.setValueAtTime(0.07, now);
            gain.gain.setValueAtTime(0, now + 0.08);
            gain.gain.setValueAtTime(0.08, now + 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.3);
          });
        } catch (e) {}
      }

      playPickup() {
        if (!this.ctx || this.isMuted) return;
        try {
          this.ensureCtx();
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(850, now);
          osc.frequency.exponentialRampToValueAtTime(1450, now + 0.12);

          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.16);
        } catch (e) {}
      }

      playJump() {
        if (this.isMuted) return;
        this.ensureCtx();
        try {
          if (this.ctx) {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(520, now + 0.18);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.22);
          }
        } catch (e) {}

        // Play yele on jump full but once
        if (this.isYelePlaying) return;

        this.isYelePlaying = true;
        const resetYele = () => {
          this.isYelePlaying = false;
        };
        setTimeout(resetYele, 2000);

        if (this.jumpBuffer && this.ctx) {
          try {
            const src = this.ctx.createBufferSource();
            src.buffer = this.jumpBuffer;
            const gain = this.ctx.createGain();
            gain.gain.value = 1.0;
            src.connect(gain);
            gain.connect(this.ctx.destination);
            src.onended = resetYele;
            src.start();
          } catch (e) {
            resetYele();
          }
        } else {
          try {
            const audioEl = new Audio('/sfx/yele2.mp3');
            audioEl.onended = resetYele;
            audioEl.onerror = () => {
              const alt = new Audio('/sfx/yele_2.mp3');
              alt.onended = resetYele;
              alt.onerror = resetYele;
              alt.play().catch(resetYele);
            };
            audioEl.play().catch(() => {
              const alt = new Audio('/sfx/yele_2.mp3');
              alt.onended = resetYele;
              alt.onerror = resetYele;
              alt.play().catch(resetYele);
            });
          } catch (e) {
            resetYele();
          }
        }
      }

      playMetroRumble() {
        if (!this.ctx || this.isMuted) return;
        try {
          this.ensureCtx();
          const ctx = this.ctx;
          const now = ctx.currentTime;
          const dur = 4.2;
          const rate = ctx.sampleRate;

          const master = ctx.createGain();
          master.gain.setValueAtTime(0.001, now);
          master.gain.exponentialRampToValueAtTime(1, now + 1.45);
          master.gain.setValueAtTime(1, now + 2.15);
          master.gain.exponentialRampToValueAtTime(0.001, now + dur);
          master.connect(ctx.destination);

          const noiseLen = Math.floor(rate * dur);
          const noiseBuf = ctx.createBuffer(1, noiseLen, rate);
          const noise = noiseBuf.getChannelData(0);
          for (let i = 0; i < noiseLen; i++) noise[i] = Math.random() * 2 - 1;

          const hiss = ctx.createBufferSource();
          hiss.buffer = noiseBuf;
          const hissFilter = ctx.createBiquadFilter();
          hissFilter.type = "bandpass";
          hissFilter.Q.value = 0.65;
          hissFilter.frequency.setValueAtTime(900, now);
          hissFilter.frequency.linearRampToValueAtTime(1700, now + 1.7);
          hissFilter.frequency.linearRampToValueAtTime(800, now + dur);
          const hissGain = ctx.createGain();
          hissGain.gain.value = 0.07;
          hiss.connect(hissFilter);
          hissFilter.connect(hissGain);
          hissGain.connect(master);
          hiss.start(now);
          hiss.stop(now + dur);

          const body = ctx.createBufferSource();
          body.buffer = noiseBuf;
          const bodyFilter = ctx.createBiquadFilter();
          bodyFilter.type = "lowpass";
          bodyFilter.frequency.value = 240;
          const bodyGain = ctx.createGain();
          bodyGain.gain.value = 0.045;
          body.connect(bodyFilter);
          bodyFilter.connect(bodyGain);
          bodyGain.connect(master);
          body.start(now);
          body.stop(now + dur);

          const clackLen = Math.floor(rate * 0.04);
          const clackBuf = ctx.createBuffer(1, clackLen, rate);
          const clack = clackBuf.getChannelData(0);
          for (let i = 0; i < clackLen; i++) {
            clack[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / clackLen, 2);
          }
          const clackFilter = ctx.createBiquadFilter();
          clackFilter.type = "bandpass";
          clackFilter.frequency.value = 1600;
          clackFilter.Q.value = 3;
          clackFilter.connect(master);
          for (let t = 0.12; t < dur - 0.08; t += 0.2) {
            const src = ctx.createBufferSource();
            src.buffer = clackBuf;
            const g = ctx.createGain();
            const closeness = 1 - Math.min(1, Math.abs(t - 1.85) / 2);
            g.gain.value = 0.05 + closeness * 0.16;
            src.connect(g);
            g.connect(clackFilter);
            src.start(now + t);
          }

          [92, 138].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq * 1.03, now);
            osc.frequency.linearRampToValueAtTime(freq, now + 1.6);
            osc.frequency.linearRampToValueAtTime(freq * 0.94, now + dur);
            g.gain.value = i === 0 ? 0.03 : 0.016;
            osc.connect(g);
            g.connect(master);
            osc.start(now);
            osc.stop(now + dur);
          });
        } catch (e) {}
      }

      _decodeTurn() {
        this._decodeBuffer('_turnRaw', 'turnBuffer');
      }

      playSlide() {
        this.playTurn();
      }

      playTurn() {
        if (this.isMuted) return;
        this.ensureCtx();
        if (this.turnBuffer && this.ctx) {
          try {
            const src = this.ctx.createBufferSource();
            src.buffer = this.turnBuffer;
            const gain = this.ctx.createGain();
            gain.gain.value = 1.0;
            src.connect(gain);
            gain.connect(this.ctx.destination);
            src.start();
          } catch (e) {}
        } else {
          try {
            const audioEl = new Audio('/sfx/aree.mp3');
            audioEl.play().catch(() => {
              const alt = new Audio('/sfx/areee.mp3');
              alt.play().catch(() => {});
            });
          } catch (e) {}
        }
      }

      playGameOver() {
        if (this.isMuted) return;
        this.ensureCtx();
        if (this._hasPlayedGameOver) return;
        this._hasPlayedGameOver = true;
        if (this.endBuffer && this.ctx) {
          try {
            const src = this.ctx.createBufferSource();
            src.buffer = this.endBuffer;
            const gain = this.ctx.createGain();
            gain.gain.value = 1.0;
            src.connect(gain);
            gain.connect(this.ctx.destination);
            src.start();
          } catch (e) {}
        } else {
          try {
            const audioEl = new Audio('/sfx/hosh.mp3');
            audioEl.play().catch(() => {});
          } catch (e) {}
        }
      }

      playIntroMeme() {
        if (this.isMuted) return;
        this.ensureCtx();
        if (this.introMemeBuffer && this.ctx) {
          try {
            const src = this.ctx.createBufferSource();
            src.buffer = this.introMemeBuffer;
            const gain = this.ctx.createGain();
            gain.gain.value = 1.0;
            src.connect(gain);
            gain.connect(this.ctx.destination);
            src.start();
          } catch (e) {}
        } else {
          try {
            const audioEl = new Audio('/sfx/intro.mp3');
            audioEl.play().catch(() => {
              const alt = new Audio('/intro.mp3');
              alt.play().catch(() => {});
            });
          } catch (e) {}
        }
      }

      playTehelka() {
        this.playIntroMeme();
      }

      playYeLe() {
        this.playIntroMeme();
      }

      playPowerup() {
        if (!this.ctx || this.isMuted) return;
        try {
          this.ensureCtx();
          const now = this.ctx.currentTime;
          [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);

            gain.gain.setValueAtTime(0.1, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.26);
          });
        } catch (e) {}
      }

      playWoo() {
        if (this.isMuted) return;
        this.ensureCtx();
        if (this.wooBuffer && this.ctx) {
          try {
            const src = this.ctx.createBufferSource();
            src.buffer = this.wooBuffer;
            const gain = this.ctx.createGain();
            gain.gain.value = 1.0;
            src.connect(gain);
            gain.connect(this.ctx.destination);
            src.start();
          } catch (e) {}
        } else {
          try {
            const audioEl = new Audio('/sfx/woo.mp3');
            audioEl.play().catch(() => {
              const alt = new Audio('/woo.mp3');
              alt.play().catch(() => {});
            });
          } catch (e) {}
        }
      }

      playFlightRocket() {
        this.playWoo();
        if (!this.ctx || this.isMuted) return;
        try {
          this.ensureCtx();
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.6);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.7);
        } catch (e) {}
      }

      playRingDing() {
        if (!this.ctx || this.isMuted) return;
        try {
          this.ensureCtx();
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1200, now);
          osc.frequency.exponentialRampToValueAtTime(1900, now + 0.2);
          gain.gain.setValueAtTime(0.16, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.25);
        } catch (e) {}
      }

      playCrash() {
        if (!this.ctx || this.isMuted) return;
        try {
          this.ensureCtx();
          const now = this.ctx.currentTime;
          const node = this.ctx.createBufferSource();
          const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.45, this.ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < buffer.length; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / buffer.length);
          }
          node.buffer = buffer;
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.28, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
          node.connect(gain);
          gain.connect(this.ctx.destination);
          node.start(now);
        } catch (e) {}
      }

      // Police biting sound effect
      playBite() {
        if (!this.ctx || this.isMuted) return;
        try {
          this.ensureCtx();
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(260, now);
          osc.frequency.exponentialRampToValueAtTime(90, now + 0.12);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.15);
        } catch (e) {}
      }

      // Lathi beatdown punch sound effect
      playDishoom() {
        if (!this.ctx || this.isMuted) return;
        try {
          this.ensureCtx();
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.exponentialRampToValueAtTime(45, now + 0.22);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.24);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.25);
        } catch (e) {}
      }

      playCountdownBeep(isGo = false, freq = 520) {
        if (!this.ctx || this.isMuted) return;
        try {
          this.ensureCtx();
          const ctx = this.ctx;
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = isGo ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, now);
          if (isGo) {
            osc.frequency.exponentialRampToValueAtTime(1250, now + 0.2);
          }
          gain.gain.setValueAtTime(0.32, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.38 : 0.16));
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + (isGo ? 0.4 : 0.18));
        } catch (e) {}
      }
    }

    const audio = new DelhiAudioEngine();

    /* ==========================================================================
       2. THREE.JS GAME ENGINE CONSTANTS AND GLOBALS
       ========================================================================== */
    const LANES = [-3.2, 0, 3.2];
    const SEGMENT_LENGTH = 70;
    const TOTAL_SEGMENTS = 4;
    const ROAD_WIDTH = 10.5;

    let scene, camera, renderer;
    let dipkeGroup, dipkeBody, dipkeHead, dipkeFaceGroup, dipkeLimbs = {};
    let policeOfficers = [];
    let copTex = null;
    let caughtStills = null;
    let caughtFrames = [];
    let caughtTrio = null;
    let caughtTrioMat = null;
    let roadSegments = [];
    let obstacles = [];
    let collectibles = [];
    let dustParticles;

    // Game state enum
    const STATE = {
      MENU: 0,
      CUTSCENE: 1,
      PLAYING: 2,
      CAUGHT: 3,     // Dramatic tackle and biting sequence
      GAMEOVER: 4,
      COUNTDOWN: 5
    };
    let currentGameState = STATE.MENU;
    let countdownTimer = 0;
    let countdownStep = -1;

    let cutsceneProgress = 0;
    const CUTSCENE_DURATION = 16.4;
    let runnersShownTimer = 0;
    let tehelkaPlayedInCutscene = false;

    // Caught tackle variables
    let caughtTimer = 0;
    const CAUGHT_DURATION = 4.2;
    let pendingCrashReason = 'BUS';
    let cameraShake = { x: 0, y: 0 };

    const DELHI_LANDMARKS = [
      "Connaught Place Radial (Inner Circle)",
      "Janpath Market Road",
      "Jantar Mantar Protest Point",
      "India Gate Rajpath",
      "Mandi House Circle",
      "Lajpat Nagar Central Market",
      "Mukherjee Nagar Study Hub",
      "Red Fort Ring Road"
    ];

    const HINDI_QUIPS = [
      { text: "अरे Dipke भाई! चालान कट गया!", desc: "Delhi Police caught you! Caught sprinting without helmet or speed limit." },
      { text: "ओये होये! DTC बस से टक्कर!", desc: "Never cross paths with Delhi's iconic green DTC low-floor bus!" },
      { text: "धरने में फंस गए Dipke!", desc: "The march left Jantar Mantar and sat down in your lane." },
      { text: "बैरिकेड तोड़ दी Dipke!", desc: "You ran straight into a Delhi Police barricade." },
      { text: "ऑटो वाले भैया ने कट मार दिया!", desc: "CNG Auto rickshaw turned sharply without indicator near CP!" }
    ];

    // Procedural Materials
    const mats = {
      asphalt: new THREE.MeshLambertMaterial({ color: 0x323236 }),
      roadLines: new THREE.MeshBasicMaterial({ color: 0xfacc15 }),
      sidewalk: new THREE.MeshLambertMaterial({ color: 0x9ca3af }),
      metroConcrete: new THREE.MeshLambertMaterial({ color: 0x94a3b8 }),
      metroYellow: new THREE.MeshLambertMaterial({ color: 0xeab308 }),
      metroSilver: new THREE.MeshLambertMaterial({ color: 0xe8eef4 }),
      metroStripeRed: new THREE.MeshBasicMaterial({ color: 0xdc2626 }),
      dtcGreen: new THREE.MeshLambertMaterial({ color: 0x15803d }),
      dtcBlue: new THREE.MeshLambertMaterial({ color: 0x0284c7 }),
      autoYellow: new THREE.MeshLambertMaterial({ color: 0xfacc15 }),
      autoGreen: new THREE.MeshLambertMaterial({ color: 0x166534 }),
      headlightGlow: new THREE.MeshBasicMaterial({ color: 0xfef08a }),
      policeYellow: new THREE.MeshLambertMaterial({ color: 0xfbbf24 }),
      policeKhaki: new THREE.MeshLambertMaterial({ color: 0xbfa170 }),
      policeCapRed: new THREE.MeshLambertMaterial({ color: 0xb91c1c }),
      policeCapNavy: new THREE.MeshLambertMaterial({ color: 0x1e3a8a }),
      lathiBrown: new THREE.MeshLambertMaterial({ color: 0x78350f }),
      skin: new THREE.MeshLambertMaterial({ color: 0xd97706 }),
      kurta: new THREE.MeshLambertMaterial({ color: 0x991b1b }),
      jeans: new THREE.MeshLambertMaterial({ color: 0x1e293b }),
      gold: new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.2, metalness: 0.85 }),
      samosaCrust: new THREE.MeshLambertMaterial({ color: 0xd97706 }),
      goldenSamosa: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.9, emissive: 0xb45309 }),
      ringGlow: new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
      jetpackMetal: new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 }),
      jetpackFlame: new THREE.MeshBasicMaterial({ color: 0xf97316 }),
      blackRubber: new THREE.MeshLambertMaterial({ color: 0x171717 }),
      glass: new THREE.MeshLambertMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.7 }),
      protestBanner: new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide }),
      treeGreen: new THREE.MeshLambertMaterial({ color: 0x15803d }),
      treeTrunk: new THREE.MeshLambertMaterial({ color: 0x713f12 }),
      monumentSandstone: new THREE.MeshLambertMaterial({ color: 0xd97706 }),
      monumentBeige: new THREE.MeshLambertMaterial({ color: 0xfde68a }),
      cpWhite: new THREE.MeshLambertMaterial({ color: 0xf4f4f1 }),
      cpPillarBase: new THREE.MeshLambertMaterial({ color: 0xe2e4e8 }),
      cpShadowWall: new THREE.MeshLambertMaterial({ color: 0x222226 }),
      cpWindow: new THREE.MeshLambertMaterial({ color: 0x1e293b }),
      cpWindowTrim: new THREE.MeshLambertMaterial({ color: 0xffffff }),
      cpCornice: new THREE.MeshLambertMaterial({ color: 0xdedede }),
      cpDoorway: new THREE.MeshLambertMaterial({ color: 0x171717 }),
      cpRoofGravel: new THREE.MeshLambertMaterial({ color: 0x78716c }),
      sintexBlack: new THREE.MeshLambertMaterial({ color: 0x18181b }),
      acChillerGrey: new THREE.MeshLambertMaterial({ color: 0x94a3b8 }),
      cityTerrain: new THREE.MeshLambertMaterial({ color: 0x1c1917 }),
      skylineGlass: new THREE.MeshLambertMaterial({ color: 0x0284c7 }),
      skylineSandstone: new THREE.MeshLambertMaterial({ color: 0xb45309 }),
      skylineWhite: new THREE.MeshLambertMaterial({ color: 0xd6d3d1 }),
      treeCanopyLush: new THREE.MeshLambertMaterial({ color: 0x14532d })
    };

    let jetpackModel = null;
    let jetpackFlames = [];
    let metroTrain = null;
    let metroTrainActive = false;
    let metroTrainZ = 0;
    let metroTimer = 5.0;
    let horizonGroup = null;
    let kerbWaves = [];
    let footstepDust = [];

    let player = {
      laneIndex: 1,
      targetX: 0,
      x: 0,
      y: 0,
      z: 0,
      vy: 0,
      isGrounded: true,
      isSliding: false,
      slideTimer: 0,
      runAnimTime: 0,
      baseSpeed: 21,
      speed: 21,
      maxSpeed: 38,
      distance: 0,
      coins: 0,
      score: 0,
      powerup: null,
      powerupTimer: 0,
      policeGap: 7.5,
      isFlying: false,
      flightTargetY: 8.5,
      flightDuration: 10.0,
      vx: 0,
      prevZ: 0,
      coyoteLeft: 0.12,
      jumpBuffer: 0,
      landSquash: 0,
      mass: 72
    };

    let hostEl = null;
    let backTex = null;
    let frontTex = null;
    let backMat = null;
    let frontMat = null;
    let dipkeShadow = null;
    let dipkeFront = null;
    let sideTex = null;
    let sidePos = null;
    let sideNeg = null;
    let sideBaseY = 0;
    let flyBackTex = null;
    let flyFrontTex = null;
    let backFrames = [];
    let frontFrames = [];
    let lastRunFrame = -1;
    let dipkeFrontSheet = null;
    let dipkeBackSheet = null;
    const copSheets = {
      delhi: { front: null, back: null },
      raf: { front: null, back: null }
    };
    let photoOverride = false;
    let footDrop = 0.1;
    let bodyH = 2.5;
    let bodyW = 0.96;
    let hornTimer = null;
    let disposed = false;
    let physAcc = 0;
    let generation = 0;
    let injectedKeys = null;
    let prevInjected = new Set();
    const cleanups = [];
    const ragdoll = {
      y: 0, vy: 0, pitch: 0, roll: 0, yaw: 0, wp: 0, wr: 0, wy: 0
    };

    function initThree() {
      policeOfficers = [];
      roadSegments = [];
      obstacles = [];
      collectibles = [];
      jetpackFlames = [];
      footstepDust = [];
      currentGameState = STATE.MENU;
      lastTime = 0;
      physAcc = 0;
      cutsceneProgress = 0;
      const container = hostEl || document.getElementById('game-canvas-container');
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xfdba74);
      scene.fog = new THREE.FogExp2(0xfba26b, 0.011);

      camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 400);
      camera.position.set(0, 4.3, 7.5);

      if (!renderer || !renderer.domElement || renderer.domElement.parentNode !== container) {
        renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);
      }

      const ambient = new THREE.AmbientLight(0xffedd5, 1.05);
      scene.add(ambient);

      const dirLight = new THREE.DirectionalLight(0xffedd5, 1.35);
      dirLight.position.set(25, 45, 20);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 130;
      dirLight.shadow.camera.left = -22;
      dirLight.shadow.camera.right = 22;
      dirLight.shadow.camera.top = 22;
      dirLight.shadow.camera.bottom = -22;
      scene.add(dirLight);

      createDelhiSkylineHorizon();
      createOverheadMetroTrain();
      createDipkeCharacter();
      createPoliceOfficers();
      createEndlessRoad();
      createDustParticles();
      initFootstepDust();

      window.addEventListener('resize', onWindowResize);
      cleanups.push(() => window.removeEventListener('resize', onWindowResize));
      setupControls();
      loadHighScores();

      hornTimer = setInterval(() => {
        if (currentGameState === STATE.PLAYING && Math.random() < 0.35) {
          audio.playHorn();
        }
      }, 4000);
    }

    function createDelhiSkylineHorizon() {
      horizonGroup = new THREE.Group();

      // India Gate Monument
      const indiaGate = new THREE.Group();
      const pillarL = new THREE.Mesh(new THREE.BoxGeometry(4.5, 22, 5), mats.monumentSandstone);
      pillarL.position.set(-8, 11, 0);
      indiaGate.add(pillarL);

      const pillarR = new THREE.Mesh(new THREE.BoxGeometry(4.5, 22, 5), mats.monumentSandstone);
      pillarR.position.set(8, 11, 0);
      indiaGate.add(pillarR);

      const lintel = new THREE.Mesh(new THREE.BoxGeometry(22, 6, 6), mats.monumentSandstone);
      lintel.position.set(0, 24, 0);
      indiaGate.add(lintel);

      const topDome = new THREE.Mesh(new THREE.BoxGeometry(16, 4, 5.2), mats.monumentBeige);
      topDome.position.set(0, 29, 0);
      indiaGate.add(topDome);

      const flame = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 2.5, 8), mats.gold);
      flame.position.set(0, 1.25, 0);
      indiaGate.add(flame);

      indiaGate.position.set(28, 0, -180);
      horizonGroup.add(indiaGate);

      // Rashtrapati Bhavan Dome
      const rashtrapati = new THREE.Group();
      const basePalace = new THREE.Mesh(new THREE.BoxGeometry(42, 10, 14), mats.monumentSandstone);
      basePalace.position.set(0, 5, 0);
      rashtrapati.add(basePalace);

      const drum = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 5, 24), mats.monumentBeige);
      drum.position.set(0, 12.5, 0);
      rashtrapati.add(drum);

      const dome = new THREE.Mesh(new THREE.SphereGeometry(7, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), mats.monumentSandstone);
      dome.position.set(0, 15, 0);
      rashtrapati.add(dome);

      rashtrapati.position.set(-45, 0, -220);
      horizonGroup.add(rashtrapati);

      // Connaught Place Colonnaded Curve
      const cpBlock = new THREE.Group();
      const cpWall = new THREE.Mesh(new THREE.BoxGeometry(32, 9, 8), mats.sidewalk);
      cpWall.position.set(0, 4.5, 0);
      cpBlock.add(cpWall);

      for (let p = -14; p <= 14; p += 3.5) {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 9, 10), mats.sidewalk);
        pillar.position.set(p, 4.5, 4.2);
        cpBlock.add(pillar);
      }
      cpBlock.position.set(-36, 0, -130);
      horizonGroup.add(cpBlock);

      scene.add(horizonGroup);
    }

    function createOverheadMetroTrain() {
      metroTrain = new THREE.Group();
      const carLength = 11;
      const totalCars = 4;

      const darkMetal = new THREE.MeshLambertMaterial({ color: 0x1e293b });
      const rubberBlack = new THREE.MeshLambertMaterial({ color: 0x0f172a });
      const roofSilver = new THREE.MeshLambertMaterial({ color: 0xd1d5db });
      const brightHeadlight = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const redTailLight = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const copperPantograph = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.9, roughness: 0.3 });

      const destCanvas = document.createElement('canvas');
      destCanvas.width = 256;
      destCanvas.height = 64;
      const dctx = destCanvas.getContext('2d');
      if (dctx) {
        dctx.fillStyle = '#0f172a';
        dctx.fillRect(0, 0, 256, 64);
        dctx.fillStyle = '#f59e0b';
        dctx.font = 'bold 20px monospace';
        dctx.textAlign = 'center';
        dctx.fillText('DMRC • YELLOW LINE', 128, 40);
      }
      const destTex = new THREE.CanvasTexture(destCanvas);
      const destMat = new THREE.MeshBasicMaterial({ map: destTex });

      for (let c = 0; c < totalCars; c++) {
        const car = new THREE.Group();
        const isFrontCab = (c === totalCars - 1);
        const isRearCab = (c === 0);
        const isCab = isFrontCab || isRearCab;
        const cabDir = isFrontCab ? 1 : (isRearCab ? -1 : 0);

        const bodyLength = carLength - 0.5;
        const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.3, bodyLength), mats.metroSilver);
        body.position.y = 1.35;
        body.castShadow = true;
        car.add(body);

        const roof = new THREE.Mesh(new THREE.BoxGeometry(2.48, 0.22, bodyLength - 0.1), roofSilver);
        roof.position.y = 2.55;
        car.add(roof);

        const redStripe = new THREE.Mesh(new THREE.BoxGeometry(2.64, 0.32, bodyLength), mats.metroStripeRed);
        redStripe.position.y = 1.25;
        car.add(redStripe);

        const lowerSkirt = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.28, bodyLength), darkMetal);
        lowerSkirt.position.y = 0.32;
        car.add(lowerSkirt);

        [-3.2, 3.2].forEach(bz => {
          const bogie = new THREE.Group();
          bogie.position.set(0, 0.25, bz);
          const bFrame = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.25, 2.2), darkMetal);
          bogie.add(bFrame);
          [-0.75, 0.75].forEach(wz => {
            [-1.05, 1.05].forEach(wx => {
              const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.12, 12), darkMetal);
              wheel.rotation.z = Math.PI / 2;
              wheel.position.set(wx, -0.05, wz);
              bogie.add(wheel);
            });
          });
          car.add(bogie);
        });

        [-2.2, 2.2].forEach(dz => {
          [-1.31, 1.31].forEach(dx => {
            const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.7, 1.3), darkMetal);
            doorFrame.position.set(dx, 1.35, dz);
            car.add(doorFrame);
            const doorSeam = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.65, 0.04), rubberBlack);
            doorSeam.position.set(dx, 1.35, dz);
            car.add(doorSeam);
            const doorGlassL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.45), mats.glass);
            doorGlassL.position.set(dx, 1.5, dz - 0.3);
            car.add(doorGlassL);
            const doorGlassR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.45), mats.glass);
            doorGlassR.position.set(dx, 1.5, dz + 0.3);
            car.add(doorGlassR);
          });
        });

        [-4.0, 0, 4.0].forEach(wz => {
          [-1.31, 1.31].forEach(wx => {
            const win = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.78, 1.45), mats.glass);
            win.position.set(wx, 1.5, wz);
            car.add(win);
          });
        });

        [-2.5, 2.5].forEach(acz => {
          const ac = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.32, 2.4), roofSilver);
          ac.position.set(0, 2.76, acz);
          car.add(ac);
          const grille = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 1.8), darkMetal);
          grille.position.set(0, 2.93, acz);
          car.add(grille);
        });

        if (c === 1 || c === 2) {
          const pantoGroup = new THREE.Group();
          pantoGroup.position.set(0, 2.75, 0);
          const pBase = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 1.4), darkMetal);
          pBase.position.y = 0.06;
          pantoGroup.add(pBase);
          const lowerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.75, 6), darkMetal);
          lowerArm.rotation.x = 0.55;
          lowerArm.position.set(0, 0.4, -0.2);
          pantoGroup.add(lowerArm);
          const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.75, 6), darkMetal);
          upperArm.rotation.x = -0.55;
          upperArm.position.set(0, 0.72, 0.15);
          pantoGroup.add(upperArm);
          const shoe = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.16), copperPantograph);
          shoe.position.set(0, 1.05, 0);
          pantoGroup.add(shoe);
          car.add(pantoGroup);
        }

        if (isCab) {
          const cabZ = (bodyLength / 2) * cabDir;
          const cabNose = new THREE.Group();
          cabNose.position.set(0, 0, cabZ);

          const noseMesh = new THREE.Mesh(new THREE.BoxGeometry(2.58, 1.5, 1.1), darkMetal);
          noseMesh.position.set(0, 1.5, 0.55 * cabDir);
          noseMesh.rotation.x = -0.22 * cabDir;
          cabNose.add(noseMesh);

          const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 0.08), mats.glass);
          windshield.position.set(0, 1.58, 1.08 * cabDir);
          windshield.rotation.x = -0.22 * cabDir;
          cabNose.add(windshield);

          const destBoard = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.28, 0.06), destMat);
          destBoard.position.set(0, 2.22, 0.88 * cabDir);
          cabNose.add(destBoard);

          const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.65, 0.9), darkMetal);
          bumper.position.set(0, 0.55, 0.5 * cabDir);
          cabNose.add(bumper);

          const coupler = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.5, 8), darkMetal);
          coupler.rotation.x = Math.PI / 2;
          coupler.position.set(0, 0.55, 1.1 * cabDir);
          cabNose.add(coupler);

          const lightMat = isFrontCab ? brightHeadlight : redTailLight;
          [-0.88, 0.88].forEach(lx => {
            const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 12), rubberBlack);
            bezel.rotation.x = Math.PI / 2;
            bezel.position.set(lx, 0.82, 0.98 * cabDir);
            cabNose.add(bezel);
            const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 12), lightMat);
            lens.rotation.x = Math.PI / 2;
            lens.position.set(lx, 0.82, 1.02 * cabDir);
            cabNose.add(lens);
          });

          if (isFrontCab) {
            const beam = new THREE.Mesh(
              new THREE.ConeGeometry(1.5, 10, 16, 1, true),
              new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.16, side: THREE.DoubleSide })
            );
            beam.rotation.x = Math.PI / 2;
            beam.position.set(0, 0.85, 5.8);
            cabNose.add(beam);
          }

          car.add(cabNose);
        }

        if (c < totalCars - 1) {
          const gangway = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.15, 0.55), rubberBlack);
          gangway.position.set(0, 1.35, (bodyLength / 2) + 0.28);
          car.add(gangway);
        }

        car.position.z = (c - totalCars / 2) * carLength;
        metroTrain.add(car);
      }

      metroTrain.position.set(-8.2, 9.05, -300);
      metroTrain.visible = false;
      scene.add(metroTrain);
    }

    function triggerMetroTrainPass() {
      if (metroTrainActive) return;
      metroTrainActive = true;
      metroTrainZ = player.z - 140;
      metroTrain.position.set(-8.2, 9.05, metroTrainZ);
      metroTrain.visible = true;
      audio.playMetroRumble();
    }

    function updateMetroTrain(dt) {
      if (!metroTrainActive) {
        metroTimer -= dt;
        if (metroTimer <= 0) {
          triggerMetroTrainPass();
          metroTimer = 10.0 + Math.random() * 8.0;
        }
        return;
      }

      metroTrainZ += 55 * dt;
      metroTrain.position.z = metroTrainZ;

      if (metroTrainZ > player.z + 90) {
        metroTrainActive = false;
        metroTrain.visible = false;
      }
    }

    function initFootstepDust() {
      for (let i = 0; i < 16; i++) {
        const dust = new THREE.Mesh(
          new THREE.SphereGeometry(0.25, 5, 5),
          new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.7 })
        );
        dust.visible = false;
        scene.add(dust);
        footstepDust.push({ mesh: dust, life: 0 });
      }
    }

    function emitFootstepDust(x, z, scale = 1.0) {
      const p = footstepDust.find(d => d.life <= 0);
      if (!p) return;
      p.mesh.position.set(x + (Math.random() - 0.5) * 0.4, 0.1, z + 0.3);
      p.mesh.scale.set(scale, scale, scale);
      p.mesh.material.opacity = 0.65;
      p.mesh.visible = true;
      p.life = 0.35;
    }

    function updateFootstepDust(dt) {
      footstepDust.forEach(d => {
        if (d.life > 0) {
          d.life -= dt;
          d.mesh.position.y += 0.8 * dt;
          d.mesh.scale.multiplyScalar(1.0 + 1.8 * dt);
          d.mesh.material.opacity = Math.max(0, d.life / 0.35);
          if (d.life <= 0) d.mesh.visible = false;
        }
      });
    }

    function spriteStandY() {
      return bodyH / 2 - footDrop;
    }

    function poseSprite(y, sx, sy) {
      const sX = sx == null ? 1 : sx;
      const sY = sy == null ? 1 : sy;
      if (dipkeBody) {
        dipkeBody.position.y = y;
        dipkeBody.scale.set(sX, sY, 1);
      }
      if (dipkeFront) {
        dipkeFront.position.y = y;
        dipkeFront.scale.set(sX, sY, 1);
      }
    }

    function showFull(tex) {
      if (!tex) return;
      tex.repeat.set(1, 1);
      tex.offset.set(0, 0);
    }

    function prepSheet(tex, cols, rows, count) {
      tex.generateMipmaps = false;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.needsUpdate = true;
      return { tex, cols, rows, count };
    }

    function putFrame(tex, idx, cols, rows) {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const w = (tex.image && tex.image.width) || cols;
      const h = (tex.image && tex.image.height) || rows;
      const padU = 1 / w;
      const padV = 1 / h;
      const du = 1 / cols;
      const dv = 1 / rows;
      tex.repeat.set(du - padU * 2, dv - padV * 2);
      tex.offset.set(col * du + padU, 1 - (row + 1) * dv + padV);
    }

    function applySheet(mat, sheet, idx) {
      if (!mat || !sheet) return;
      if (mat.map !== sheet.tex) {
        mat.map = sheet.tex;
        mat.needsUpdate = true;
      }
      putFrame(sheet.tex, idx, sheet.cols, sheet.rows);
    }

    function dipkeFrameCount() {
      return Math.max(
        dipkeFrontSheet ? dipkeFrontSheet.count : 0,
        dipkeBackSheet ? dipkeBackSheet.count : 0,
        backFrames.length
      );
    }

    function paintDipke(idx) {
      if (photoOverride) return;
      const n = dipkeFrameCount();
      if (n <= 1) return;
      const i = ((idx % n) + n) % n;
      let changed = i !== lastRunFrame;
      if (dipkeBackSheet && backMat && backMat.map !== dipkeBackSheet.tex) changed = true;
      if (dipkeFrontSheet && frontMat && frontMat.map !== dipkeFrontSheet.tex) changed = true;
      if (!changed) return;
      lastRunFrame = i;
      if (dipkeBackSheet) applySheet(backMat, dipkeBackSheet, i);
      if (dipkeFrontSheet) applySheet(frontMat, dipkeFrontSheet, i);
    }

    function showFlyPose() {
      if (photoOverride) return;
      if (flyBackTex && backMat && backMat.map !== flyBackTex) {
        showFull(flyBackTex);
        backMat.map = flyBackTex;
        backMat.needsUpdate = true;
      }
      if (flyFrontTex && frontMat && frontMat.map !== flyFrontTex) {
        showFull(flyFrontTex);
        frontMat.map = flyFrontTex;
        frontMat.needsUpdate = true;
      }
      lastRunFrame = -1;
    }

    function updateDipkeView() {}

    function showRunFrame(animTime) {
      paintDipke(Math.floor(animTime * 3.15));
    }

    function showPoseFrame(i) {
      paintDipke(i);
    }

    function ensureCaughtTrio() {
      if (caughtTrio || !caughtFrames.length) return;
      const img = caughtFrames[0].image;
      const aspect = img && img.width ? img.width / img.height : 1400 / 900;
      const h = 2.95;
      const geo = new THREE.PlaneGeometry(h * aspect, h);
      caughtTrioMat = new THREE.MeshBasicMaterial({
        map: caughtFrames[0],
        transparent: true,
        alphaTest: 0.12,
        side: THREE.DoubleSide
      });
      caughtTrio = new THREE.Mesh(geo, caughtTrioMat);
      caughtTrio.position.y = h / 2 - h * (40 / 900);
      caughtTrio.rotation.y = Math.PI;
      caughtTrio.visible = false;
      scene.add(caughtTrio);
    }

    function createDipkeCharacter() {
      dipkeGroup = new THREE.Group();

      const sample = (backFrames[0] && backFrames[0].image) || (backTex && backTex.image);
      const aspect = sample && sample.width && sample.height ? sample.width / sample.height : 640 / 1024;
      bodyH = 2.95;
      bodyW = bodyH * aspect;
      const solePad = sample && sample.height ? Math.max(0, sample.height - 990) : 34;
      const imgH = sample && sample.height ? sample.height : 1024;
      footDrop = bodyH * (solePad / imgH);

      const geo = new THREE.PlaneGeometry(bodyW, bodyH);
      backMat = new THREE.MeshBasicMaterial({
        map: backFrames[0] || backTex,
        transparent: true,
        alphaTest: 0.15,
        side: THREE.FrontSide
      });
      frontMat = new THREE.MeshBasicMaterial({
        map: frontFrames[0] || frontTex,
        transparent: true,
        alphaTest: 0.15,
        side: THREE.FrontSide
      });

      const standY = spriteStandY();
      const backMesh = new THREE.Mesh(geo, backMat);
      backMesh.position.set(0, standY, 0.04);
      backMesh.castShadow = true;
      dipkeGroup.add(backMesh);
      dipkeBody = backMesh;
      dipkeHead = backMesh;

      dipkeFront = new THREE.Mesh(geo, frontMat);
      dipkeFront.position.set(0, standY, -0.04);
      dipkeFront.rotation.y = Math.PI;
      dipkeFront.castShadow = true;
      dipkeGroup.add(dipkeFront);

      dipkeLimbs = {
        leftArm: new THREE.Group(),
        rightArm: new THREE.Group(),
        leftLeg: new THREE.Group(),
        rightLeg: new THREE.Group()
      };

      // Jetpack on the back, toward the camera (+Z)
      jetpackModel = new THREE.Group();
      const tankGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.75, 10);
      const tank1 = new THREE.Mesh(tankGeo, mats.jetpackMetal);
      tank1.position.set(-0.2, 0, 0);
      jetpackModel.add(tank1);

      const tank2 = new THREE.Mesh(tankGeo, mats.jetpackMetal);
      tank2.position.set(0.2, 0, 0);
      jetpackModel.add(tank2);

      const nozzleGeo = new THREE.ConeGeometry(0.14, 0.25, 8);
      const nozzle1 = new THREE.Mesh(nozzleGeo, mats.jetpackMetal);
      nozzle1.position.set(-0.2, -0.45, 0);
      nozzle1.rotation.x = Math.PI;
      jetpackModel.add(nozzle1);

      const nozzle2 = new THREE.Mesh(nozzleGeo, mats.jetpackMetal);
      nozzle2.position.set(0.2, -0.45, 0);
      nozzle2.rotation.x = Math.PI;
      jetpackModel.add(nozzle2);

      const flameGeo = new THREE.ConeGeometry(0.12, 0.6, 6);
      const flame1 = new THREE.Mesh(flameGeo, mats.jetpackFlame);
      flame1.position.set(-0.2, -0.75, 0);
      flame1.rotation.x = Math.PI;
      jetpackModel.add(flame1);
      jetpackFlames.push(flame1);

      const flame2 = new THREE.Mesh(flameGeo, mats.jetpackFlame);
      flame2.position.set(0.2, -0.75, 0);
      flame2.rotation.x = Math.PI;
      jetpackModel.add(flame2);
      jetpackFlames.push(flame2);

      jetpackModel.position.set(0, bodyH * 0.58, 0.24);
      jetpackModel.visible = false;
      dipkeGroup.add(jetpackModel);

      dipkeShadow = new THREE.Mesh(
        new THREE.CircleGeometry(0.55, 24),
        new THREE.MeshBasicMaterial({ color: 0x1a0f08, transparent: true, opacity: 0.38, depthWrite: false })
      );
      dipkeShadow.rotation.x = -Math.PI / 2;
      dipkeShadow.position.y = 0.025;
      scene.add(dipkeShadow);

      dipkeGroup.position.set(0, 0, 0);
      scene.add(dipkeGroup);
      ensureCaughtTrio();
    }

    function createPoliceOfficers() {
      const specs = [
        { kind: "delhi", x: -1.15, z: 4.8 },
        { kind: "raf", x: 1.15, z: 5.6 }
      ];
      if (copTex && copTex.delhi && copTex.raf) {
        specs.forEach((cfg) => {
          const pack = copTex[cfg.kind];
          const sample = pack.back[0] && pack.back[0].image;
          const aspect = sample && sample.width ? sample.width / sample.height : 640 / 1024;
          const h = 2.85;
          const w = h * aspect;
          const footDrop = h * (34 / 1024);
          const geo = new THREE.PlaneGeometry(w, h);
          const mat = new THREE.MeshBasicMaterial({
            map: pack.back[0],
            transparent: true,
            alphaTest: 0.15,
            side: THREE.DoubleSide
          });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.y = h / 2 - footDrop;
          mesh.castShadow = true;
          const cop = new THREE.Group();
          cop.add(mesh);
          cop.position.set(cfg.x, 0, cfg.z);
          scene.add(cop);
          policeOfficers.push({
            group: cop,
            mesh,
            mat,
            kind: cfg.kind,
            back: pack.back,
            front: pack.front,
            frontSheet: copSheets[cfg.kind] && copSheets[cfg.kind].front,
            backSheet: copSheets[cfg.kind] && copSheets[cfg.kind].back,
            bite: pack.bite,
            frame: -1,
            facing: "back",
            baseOffsetX: cfg.x,
            baseOffsetZ: cfg.z
          });
        });
        return;
      }
      const offsets = [
        { x: -1.2, z: 4.8 },
        { x: 1.2, z: 5.6 }
      ];

      offsets.forEach((cfg, i) => {
        const cop = new THREE.Group();

        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.05, 0.52), mats.policeKhaki);
        torso.position.y = 1.45;
        torso.castShadow = true;
        cop.add(torso);

        const belt = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.16, 0.54), mats.blackRubber);
        belt.position.y = 1.1;
        cop.add(belt);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.5), mats.skin);
        head.position.y = 2.2;
        head.castShadow = true;
        cop.add(head);

        // Cap with visor pointing forward (-Z)
        const capCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.32, 0.2, 12), mats.policeCapNavy);
        capCrown.position.set(0, 2.55, -0.02);
        cop.add(capCrown);

        const capBand = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.08, 12), mats.policeCapRed);
        capBand.position.set(0, 2.48, -0.02);
        cop.add(capBand);

        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.25), mats.blackRubber);
        visor.position.set(0, 2.46, -0.22);
        cop.add(visor);

        const stache = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.07, 0.04), mats.blackRubber);
        stache.position.set(0, 2.05, -0.26);
        cop.add(stache);

        const armGeo = new THREE.BoxGeometry(0.22, 0.8, 0.22);
        const lArm = new THREE.Mesh(armGeo, mats.policeKhaki);
        lArm.position.set(-0.56, 1.45, 0);
        cop.add(lArm);

        const rArm = new THREE.Mesh(armGeo, mats.policeKhaki);
        rArm.position.set(0.56, 1.45, 0);
        cop.add(rArm);

        // Police Danda in right hand
        const lathi = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.3, 8), mats.lathiBrown);
        lathi.position.set(0, -0.4, -0.2);
        lathi.rotation.x = Math.PI / 4;
        rArm.add(lathi);

        const legGeo = new THREE.BoxGeometry(0.28, 0.95, 0.3);
        const lLeg = new THREE.Mesh(legGeo, mats.policeKhaki);
        lLeg.position.set(-0.25, 0.48, 0);
        cop.add(lLeg);

        const rLeg = new THREE.Mesh(legGeo, mats.policeKhaki);
        rLeg.position.set(0.25, 0.48, 0);
        cop.add(rLeg);

        const bootGeo = new THREE.BoxGeometry(0.3, 0.2, 0.45);
        const lBoot = new THREE.Mesh(bootGeo, mats.blackRubber);
        lBoot.position.set(0, -0.45, -0.06);
        lLeg.add(lBoot);

        const rBoot = new THREE.Mesh(bootGeo, mats.blackRubber);
        rBoot.position.set(0, -0.45, -0.06);
        rLeg.add(rBoot);

        cop.position.set(cfg.x, 0, cfg.z);
        scene.add(cop);

        policeOfficers.push({
          group: cop,
          baseOffsetX: cfg.x,
          baseOffsetZ: cfg.z,
          lArm, rArm, lLeg, rLeg, head
        });
      });
    }

    function createEndlessRoad() {
      for (let i = 0; i < TOTAL_SEGMENTS; i++) {
        const seg = buildRoadSegment(-i * SEGMENT_LENGTH);
        roadSegments.push(seg);
        scene.add(seg);
      }
      // Stays behind the start. Not recycled, so the opening train is on the viaduct.
      scene.add(buildRoadSegment(SEGMENT_LENGTH));
      scene.add(buildRoadSegment(SEGMENT_LENGTH * 2));
    }

    // Shared Connaught Place geometries (cached & shared to maintain 60 FPS on mobile)
    const cpPillarGeo = new THREE.CylinderGeometry(0.38, 0.42, 6.0, 8);
    const cpPillarBaseGeo = new THREE.BoxGeometry(1.0, 0.4, 1.0);
    const cpPillarCapitalGeo = new THREE.BoxGeometry(1.0, 0.35, 1.0);
    const cpArchitraveBeamGeo = new THREE.BoxGeometry(1.3, 0.65, SEGMENT_LENGTH);
    const cpFacadeUpperGeo = new THREE.BoxGeometry(2.6, 5.0, SEGMENT_LENGTH);
    const cpWalkwayBackWallGeo = new THREE.BoxGeometry(0.8, 6.0, SEGMENT_LENGTH);
    const cpRoofCorniceGeo = new THREE.BoxGeometry(3.0, 0.45, SEGMENT_LENGTH);
    const cpParapetRailingGeo = new THREE.BoxGeometry(2.4, 0.85, SEGMENT_LENGTH);
    const cpWalkwayFloorGeo = new THREE.BoxGeometry(6.5, 0.35, SEGMENT_LENGTH);
    const cpWindowGeo = new THREE.PlaneGeometry(1.2, 2.0);
    const cpWindowTrimGeo = new THREE.BoxGeometry(1.4, 0.18, 0.15);
    const cpDoorGeo = new THREE.PlaneGeometry(2.0, 3.8);

    // City Depth, Rooftop, Foliage & Skyline Geometries (Full 3D city from high camera angles)
    const cityGroundGeo = new THREE.PlaneGeometry(360, SEGMENT_LENGTH);
    const cpBuildingBlockGeo = new THREE.BoxGeometry(16.0, 11.5, SEGMENT_LENGTH);
    const cpTerraceFloorGeo = new THREE.BoxGeometry(16.0, 0.35, SEGMENT_LENGTH);
    const cpTerraceParapetGeo = new THREE.BoxGeometry(0.35, 0.85, SEGMENT_LENGTH);
    const cpPenthouseGeo = new THREE.BoxGeometry(5.0, 2.8, 6.0);
    const sintexTankGeo = new THREE.CylinderGeometry(0.65, 0.65, 1.4, 10);
    const tankStandGeo = new THREE.BoxGeometry(1.5, 0.45, 1.5);
    const acUnitGeo = new THREE.BoxGeometry(1.6, 1.0, 1.2);
    const dishAntennaGeo = new THREE.CylinderGeometry(0.5, 0.05, 0.2, 10);
    const lushCanopyGeo = new THREE.DodecahedronGeometry(2.8);
    const skylineTower1Geo = new THREE.BoxGeometry(16, 32, 18);
    const skylineTower2Geo = new THREE.BoxGeometry(18, 42, 22);
    const skylineTower3Geo = new THREE.BoxGeometry(14, 26, 16);
    const skylineCrownGeo = new THREE.CylinderGeometry(4.5, 6.0, 4.0, 12);

    const CP_BLOCKS = [
      { block: "BLOCK A • CONNAUGHT PLACE", shop: "WENGER'S BAKERY 1926", shopColor: "#881337" },
      { block: "BLOCK B • INNER CIRCLE", shop: "KEVENTERS MILKSHAKES", shopColor: "#0284c7" },
      { block: "BLOCK C • CONNAUGHT CIRCUS", shop: "ODEON DELUXE • CP", shopColor: "#15803d" },
      { block: "BLOCK D • RAJIV CHOWK", shop: "DELHI KHADI BHAWAN", shopColor: "#b45309" }
    ];

    function createCPColonnadeBlock(side, zIndex) {
      const blockGroup = new THREE.Group();
      const isRight = side === 'right';
      const xBase = isRight ? (ROAD_WIDTH / 2 + 4.8) : -(ROAD_WIDTH / 2 + 8.8);
      const faceDir = isRight ? -1 : 1;
      const info = CP_BLOCKS[Math.abs(zIndex || 0) % CP_BLOCKS.length];

      // 0. Stone Verandah Pavement Plinth
      const floor = new THREE.Mesh(cpWalkwayFloorGeo, mats.sidewalk);
      floor.position.set(xBase - faceDir * 0.8, 0.17, 0);
      floor.receiveShadow = true;
      blockGroup.add(floor);

      // 1. Shaded Covered Verandah Back Wall
      const backWall = new THREE.Mesh(cpWalkwayBackWallGeo, mats.cpShadowWall);
      backWall.position.set(xBase - faceDir * 2.5, 3.0, 0);
      blockGroup.add(backWall);

      // 2. Colonnade Walkway Architrave Beam
      const beam = new THREE.Mesh(cpArchitraveBeamGeo, mats.cpWhite);
      beam.position.set(xBase, 6.2, 0);
      beam.castShadow = true;
      beam.receiveShadow = true;
      blockGroup.add(beam);

      // 3. Classical Tuscan Pillars along the 70m block
      const pillarCount = 13;
      const stepZ = (SEGMENT_LENGTH - 6) / (pillarCount - 1);
      for (let i = 0; i < pillarCount; i++) {
        const pz = -SEGMENT_LENGTH / 2 + 3 + i * stepZ;

        // Pillar shaft
        const pillar = new THREE.Mesh(cpPillarGeo, mats.cpWhite);
        pillar.position.set(xBase, 3.0, pz);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        blockGroup.add(pillar);

        // Pedestal base & capital
        const pBase = new THREE.Mesh(cpPillarBaseGeo, mats.cpPillarBase);
        pBase.position.set(xBase, 0.2, pz);
        blockGroup.add(pBase);

        const pCap = new THREE.Mesh(cpPillarCapitalGeo, mats.cpPillarBase);
        pCap.position.set(xBase, 5.85, pz);
        blockGroup.add(pCap);

        // Upper floor Georgian sash windows
        if (i < pillarCount - 1) {
          const wz = pz + stepZ / 2;
          const win = new THREE.Mesh(cpWindowGeo, mats.cpWindow);
          win.position.set(xBase + faceDir * 1.32, 9.0, wz);
          win.rotation.y = isRight ? -Math.PI / 2 : Math.PI / 2;
          blockGroup.add(win);

          const sill = new THREE.Mesh(cpWindowTrimGeo, mats.cpWindowTrim);
          sill.position.set(xBase + faceDir * 1.34, 7.9, wz);
          sill.rotation.y = isRight ? -Math.PI / 2 : Math.PI / 2;
          blockGroup.add(sill);

          const lintel = new THREE.Mesh(cpWindowTrimGeo, mats.cpWindowTrim);
          lintel.position.set(xBase + faceDir * 1.34, 10.1, wz);
          lintel.rotation.y = isRight ? -Math.PI / 2 : Math.PI / 2;
          blockGroup.add(lintel);
        }

        // Shop entrance doors along shaded walkway
        if (i % 3 === 1) {
          const door = new THREE.Mesh(cpDoorGeo, mats.cpDoorway);
          door.position.set(xBase - faceDir * 2.08, 1.9, pz + stepZ / 2);
          door.rotation.y = isRight ? -Math.PI / 2 : Math.PI / 2;
          blockGroup.add(door);
        }
      }

      // 4. Second Story White Facade Wall
      const upperWall = new THREE.Mesh(cpFacadeUpperGeo, mats.cpWhite);
      upperWall.position.set(xBase - faceDir * 0.65, 9.0, 0);
      upperWall.castShadow = true;
      upperWall.receiveShadow = true;
      blockGroup.add(upperWall);

      // Roofline Cornice & Top Parapet Railing
      const cornice = new THREE.Mesh(cpRoofCorniceGeo, mats.cpCornice);
      cornice.position.set(xBase - faceDir * 0.65, 11.65, 0);
      blockGroup.add(cornice);

      const parapet = new THREE.Mesh(cpParapetRailingGeo, mats.cpWhite);
      parapet.position.set(xBase - faceDir * 0.65, 12.25, 0);
      blockGroup.add(parapet);

      // 5. Full 3D CP Building Block (16m deep structure behind the colonnade)
      const buildingBlock = new THREE.Mesh(cpBuildingBlockGeo, mats.cpWhite);
      buildingBlock.position.set(xBase - faceDir * 7.5, 5.75, 0);
      buildingBlock.castShadow = true;
      buildingBlock.receiveShadow = true;
      blockGroup.add(buildingBlock);

      // Terrace Gravel/Stone Floor
      const terrace = new THREE.Mesh(cpTerraceFloorGeo, mats.cpRoofGravel);
      terrace.position.set(xBase - faceDir * 7.5, 11.55, 0);
      terrace.receiveShadow = true;
      blockGroup.add(terrace);

      // Rear Parapet Border Wall on Terrace
      const backParapet = new THREE.Mesh(cpTerraceParapetGeo, mats.cpWhite);
      backParapet.position.set(xBase - faceDir * 15.3, 12.0, 0);
      blockGroup.add(backParapet);

      // 6. Authentic Delhi Rooftop Details: Sintex Tanks, AC Chillers & Penthouse
      // Penthouse / Rooftop Stairwell Room
      const penthouse = new THREE.Mesh(cpPenthouseGeo, mats.cpWhite);
      penthouse.position.set(xBase - faceDir * 7.5, 12.9, -12);
      blockGroup.add(penthouse);

      // Black Sintex Water Tanks on stands
      [-18, 8, 22].forEach(tz => {
        const stand = new THREE.Mesh(tankStandGeo, mats.cpPillarBase);
        stand.position.set(xBase - faceDir * 11.0, 11.8, tz);
        blockGroup.add(stand);

        const tank = new THREE.Mesh(sintexTankGeo, mats.sintexBlack);
        tank.position.set(xBase - faceDir * 11.0, 12.6, tz);
        blockGroup.add(tank);
      });

      // Rooftop AC Outdoor Chiller Units
      [-6, 14, -24].forEach(az => {
        const ac = new THREE.Mesh(acUnitGeo, mats.acChillerGrey);
        ac.position.set(xBase - faceDir * 4.5, 12.1, az);
        blockGroup.add(ac);
      });

      // Satellite Dish Antenna
      const dishStand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6), mats.blackRubber);
      dishStand.position.set(xBase - faceDir * 3.5, 12.2, 3);
      blockGroup.add(dishStand);

      const dish = new THREE.Mesh(dishAntennaGeo, mats.acChillerGrey);
      dish.position.set(xBase - faceDir * 3.5, 12.7, 3);
      dish.rotation.x = 0.6;
      blockGroup.add(dish);

      // 7. Lutyens' Delhi Lush Green Tree Canopies (Filling space behind the building)
      for (let tz = -SEGMENT_LENGTH / 2 + 5; tz < SEGMENT_LENGTH / 2; tz += 11) {
        const canopy = new THREE.Mesh(lushCanopyGeo, mats.treeCanopyLush);
        canopy.position.set(xBase - faceDir * (17.5 + ((Math.abs(tz) % 3) * 1.5)), 3.8 + ((Math.abs(tz) % 2) * 0.8), tz);
        blockGroup.add(canopy);
      }

      // 8. Barakhamba / Central Delhi Skyline Backdrop (High-Rise Towers in Distance)
      const towerVariant = Math.abs(zIndex || 0) % 3;
      if (towerVariant === 0) {
        // Sandstone Corporate Tower (e.g. Gopal Das / LIC style)
        const tower1 = new THREE.Mesh(skylineTower1Geo, mats.skylineSandstone);
        tower1.position.set(xBase - faceDir * 36.0, 16.0, -14);
        blockGroup.add(tower1);

        // Modern Glass Tower
        const tower2 = new THREE.Mesh(skylineTower2Geo, mats.skylineGlass);
        tower2.position.set(xBase - faceDir * 44.0, 21.0, 14);
        blockGroup.add(tower2);
      } else if (towerVariant === 1) {
        // Statesman House style tower with glass crown
        const tower3 = new THREE.Mesh(skylineTower3Geo, mats.skylineWhite);
        tower3.position.set(xBase - faceDir * 38.0, 13.0, 0);
        blockGroup.add(tower3);

        const crown = new THREE.Mesh(skylineCrownGeo, mats.skylineGlass);
        crown.position.set(xBase - faceDir * 38.0, 27.5, 0);
        blockGroup.add(crown);

        const towerB = new THREE.Mesh(skylineTower1Geo, mats.skylineSandstone);
        towerB.position.set(xBase - faceDir * 48.0, 16.0, 20);
        blockGroup.add(towerB);
      } else {
        const towerC = new THREE.Mesh(skylineTower2Geo, mats.skylineSandstone);
        towerC.position.set(xBase - faceDir * 40.0, 21.0, -8);
        blockGroup.add(towerC);

        const towerD = new THREE.Mesh(skylineTower1Geo, mats.skylineWhite);
        towerD.position.set(xBase - faceDir * 42.0, 16.0, 18);
        blockGroup.add(towerD);
      }

      // 9. Iconic CP Blue Block Signboard
      const blockSign = labelPlane(info.block, "#002b80", "#ffffff", 7.2, 1.15);
      blockSign.position.set(xBase + faceDir * 0.68, 6.2, 0);
      blockSign.rotation.y = isRight ? -Math.PI / 2 : Math.PI / 2;
      blockGroup.add(blockSign);

      // 10. Iconic Vintage CP Shop Sign
      const shopSign = labelPlane(info.shop, info.shopColor, "#ffffff", 5.6, 0.9);
      shopSign.position.set(xBase + faceDir * 0.68, 5.0, 14);
      shopSign.rotation.y = isRight ? -Math.PI / 2 : Math.PI / 2;
      blockGroup.add(shopSign);

      return blockGroup;
    }

    function buildRoadSegment(zOffset) {
      const segmentGroup = new THREE.Group();
      segmentGroup.position.z = zOffset;

      // Vast City Ground Plane (Eliminates void drop-off from ANY high camera angle)
      const cityGround = new THREE.Mesh(cityGroundGeo, mats.cityTerrain);
      cityGround.rotation.x = -Math.PI / 2;
      cityGround.position.set(0, -0.02, 0);
      cityGround.receiveShadow = true;
      segmentGroup.add(cityGround);

      const roadGeo = new THREE.PlaneGeometry(ROAD_WIDTH, SEGMENT_LENGTH);
      const road = new THREE.Mesh(roadGeo, mats.asphalt);
      road.rotation.x = -Math.PI / 2;
      road.receiveShadow = true;
      segmentGroup.add(road);

      const lineGeo = new THREE.PlaneGeometry(0.18, 2.6);
      for (let z = -SEGMENT_LENGTH / 2 + 2; z < SEGMENT_LENGTH / 2; z += 5.5) {
        const lineL = new THREE.Mesh(lineGeo, mats.roadLines);
        lineL.rotation.x = -Math.PI / 2;
        lineL.position.set(-1.6, 0.01, z);
        segmentGroup.add(lineL);

        const lineR = new THREE.Mesh(lineGeo, mats.roadLines);
        lineR.rotation.x = -Math.PI / 2;
        lineR.position.set(1.6, 0.01, z);
        segmentGroup.add(lineR);
      }

      const kerbGeo = new THREE.BoxGeometry(3.5, 0.35, SEGMENT_LENGTH);
      const kerbL = new THREE.Mesh(kerbGeo, mats.sidewalk);
      kerbL.position.set(-(ROAD_WIDTH / 2 + 1.75), 0.17, 0);
      kerbL.receiveShadow = true;
      segmentGroup.add(kerbL);

      const kerbR = new THREE.Mesh(kerbGeo, mats.sidewalk);
      kerbR.position.set(ROAD_WIDTH / 2 + 1.75, 0.17, 0);
      kerbR.receiveShadow = true;
      segmentGroup.add(kerbR);

      const pillarGeo = new THREE.CylinderGeometry(0.75, 0.85, 8.5, 12);
      const p1 = new THREE.Mesh(pillarGeo, mats.metroConcrete);
      p1.position.set(-8.2, 4.2, -15);
      p1.castShadow = true;
      segmentGroup.add(p1);

      const p2 = new THREE.Mesh(pillarGeo, mats.metroConcrete);
      p2.position.set(-8.2, 4.2, 15);
      p2.castShadow = true;
      segmentGroup.add(p2);

      const track = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.2, SEGMENT_LENGTH), mats.metroConcrete);
      track.position.set(-8.2, 8.5, 0);
      segmentGroup.add(track);

      const metroStripe = new THREE.Mesh(new THREE.BoxGeometry(3.65, 0.25, SEGMENT_LENGTH), mats.metroYellow);
      metroStripe.position.set(-8.2, 8.5, 0);
      segmentGroup.add(metroStripe);

      // Add Connaught Place Colonnades on Both Sides of the Road!
      const cpIdx = Math.round(Math.abs(zOffset) / SEGMENT_LENGTH);
      const cpRight = createCPColonnadeBlock('right', cpIdx);
      segmentGroup.add(cpRight);

      const cpLeft = createCPColonnadeBlock('left', cpIdx + 1);
      segmentGroup.add(cpLeft);

      if (Math.random() > 0.28) {
        const protest = createProtestDharnaScene();
        const side = Math.random() > 0.5 ? 7.5 : -7.5;
        protest.position.set(side, 0, Math.random() > 0.5 ? -14 : 8);
        segmentGroup.add(protest);
      }

      if (Math.random() > 0.45) {
        const stall = createChaiStall();
        stall.position.set(7.5, 0, 18);
        segmentGroup.add(stall);
      }

      if (Math.random() > 0.55) {
        const closed = createClosedParkBoard();
        closed.position.set(-6.8, 0, 16);
        closed.rotation.y = -Math.PI / 2;
        segmentGroup.add(closed);
      }

      if (Math.random() > 0.58) {
        const metro = createClosedMetro();
        metro.position.set(7.5, 0, -20);
        metro.rotation.y = -Math.PI / 2;
        segmentGroup.add(metro);
      }

      if (Math.random() > 0.62) {
        const parked = createDtcBus();
        parked.position.set(7.5, 0, 2);
        parked.rotation.y = Math.PI / 2;
        const tag = labelPlane("DETENTION BUS\nHOUSE FULL", "#111827", "#facc15", 3.4, 0.95);
        tag.position.set(0, 2.2, 1.25);
        parked.add(tag);
        const tagBack = tag.clone();
        tagBack.position.z = -1.25;
        tagBack.rotation.y = Math.PI;
        parked.add(tagBack);
        segmentGroup.add(parked);
      }

      createStreetTree(segmentGroup, 7.6, -22);
      createStreetTree(segmentGroup, 7.6, 22);

      if (Math.random() > 0.5) {
        createDelhiSignboard(segmentGroup, -6.2, 0);
      }

      return segmentGroup;
    }

    function labelPlane(text, bg, fg, w, h) {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 512, 256);
      ctx.fillStyle = fg;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const lines = String(text).split("\n");
      const longest = lines.reduce((m, line) => Math.max(m, line.length), 0);
      ctx.font = `bold ${longest > 18 ? 40 : longest > 12 ? 52 : 72}px Arial, sans-serif`;
      const start = 128 - (lines.length - 1) * 34;
      lines.forEach((line, i) => ctx.fillText(line, 256, start + i * 68));
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      return new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })
      );
    }

    let tirangaMat = null;
    function tirangaMesh(w, h) {
      if (!tirangaMat) {
        const canvas = document.createElement("canvas");
        canvas.width = 180;
        canvas.height = 120;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ff9933";
        ctx.fillRect(0, 0, 180, 40);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 40, 180, 40);
        ctx.fillStyle = "#138808";
        ctx.fillRect(0, 80, 180, 40);
        ctx.strokeStyle = "#1d4ed8";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(90, 60, 12, 0, Math.PI * 2);
        ctx.stroke();
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tirangaMat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
      }
      return new THREE.Mesh(new THREE.PlaneGeometry(w, h), tirangaMat);
    }

    function createProtestDharnaScene() {
      const dharna = new THREE.Group();
      const lines = [
        "LEHRA DO",
        "JANTAR MANTAR\nBAND HAI",
        "NAAM LIST\nMEIN NAHI",
        "METRO BAND\nPAIDAL CHALO",
        "DELHI POLICE\nCALM DOWN"
      ];
      const bannerText = lines[Math.floor(Math.random() * lines.length)];
      const bannerMesh = labelPlane(bannerText, "#fef08a", "#b91c1c", 3.2, 1.05);
      bannerMesh.position.set(0, 2.15, 0);
      dharna.add(bannerMesh);

      const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.6, 6);
      const pole1 = new THREE.Mesh(poleGeo, mats.lathiBrown);
      pole1.position.set(-1.6, 1.3, 0);
      dharna.add(pole1);
      const pole2 = new THREE.Mesh(poleGeo, mats.lathiBrown);
      pole2.position.set(1.6, 1.3, 0);
      dharna.add(pole2);

      const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 6), mats.lathiBrown);
      flagPole.position.set(2.15, 1.5, 0.2);
      dharna.add(flagPole);
      const flag = tirangaMesh(0.85, 0.55);
      flag.position.set(2.55, 2.35, 0.2);
      dharna.add(flag);
      kerbWaves.push(flag);

      const protesterColors = [0xf97316, 0xffffff, 0x15803d];
      for (let p = 0; p < 3; p++) {
        const person = new THREE.Group();
        const pMat = new THREE.MeshLambertMaterial({ color: protesterColors[p] });
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.8, 0.32), pMat);
        b.position.y = 0.9;
        person.add(b);
        const h = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.36, 0.32), mats.skin);
        h.position.y = 1.45;
        person.add(h);
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 0.1), pMat);
        arm.position.set(0.28, 1.45, 0);
        arm.rotation.z = -0.8;
        person.add(arm);
        person.position.set((p - 1) * 0.85, 0, 0.45);
        dharna.add(person);
      }

      return dharna;
    }

    function createClosedParkBoard() {
      const board = new THREE.Group();
      const sign = labelPlane("CENTRAL PARK CLOSED\nTHIS WAY  →", "#b91c1c", "#fef9c3", 2.6, 1.15);
      sign.position.y = 1.7;
      board.add(sign);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.7, 6), mats.metroConcrete);
      pole.position.y = 0.85;
      board.add(pole);
      return board;
    }

    function createClosedMetro() {
      const gate = new THREE.Group();
      const frame = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.8, 0.35), mats.metroConcrete);
      frame.position.y = 1.4;
      gate.add(frame);
      const shutter = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 2.25, 0.08),
        new THREE.MeshLambertMaterial({ color: 0x64748b })
      );
      shutter.position.set(0, 1.35, 0.18);
      gate.add(shutter);
      const sign = labelPlane("STATION BAND", "#0f172a", "#f8fafc", 2.1, 0.48);
      sign.position.set(0, 2.85, 0.2);
      gate.add(sign);
      return gate;
    }

    function createChaiStall() {
      const stall = new THREE.Group();
      const table = new THREE.Mesh(new THREE.BoxGeometry(2, 0.9, 1.4), new THREE.MeshLambertMaterial({ color: 0x854d0e }));
      table.position.y = 0.45;
      table.castShadow = true;
      stall.add(table);

      const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.8, 4), new THREE.MeshLambertMaterial({ color: 0xef4444 }));
      canopy.position.set(0, 1.8, 0);
      canopy.rotation.y = Math.PI / 4;
      stall.add(canopy);

      const ketli = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.4, 8), mats.gold);
      ketli.position.set(0.3, 1.05, 0);
      stall.add(ketli);

      const sign = labelPlane("DETAINED?\nSAMOSA BAAD MEIN", "#fef08a", "#7f1d1d", 2.2, 0.7);
      sign.position.set(0, 2.45, 0);
      stall.add(sign);

      return stall;
    }

    function createDelhiSignboard(parent, x, z) {
      const boardGroup = new THREE.Group();
      const signCanvas = document.createElement('canvas');
      signCanvas.width = 512;
      signCanvas.height = 256;
      const sctx = signCanvas.getContext('2d');

      sctx.fillStyle = '#15803d';
      sctx.fillRect(0, 0, 512, 256);
      sctx.strokeStyle = '#ffffff';
      sctx.lineWidth = 8;
      sctx.strokeRect(10, 10, 492, 236);

      sctx.fillStyle = '#ffffff';
      sctx.textAlign = 'center';
      sctx.font = 'bold 38px sans-serif';
      sctx.fillText('कनॉट प्लेस | CONNAUGHT PLACE', 256, 75);

      sctx.font = 'bold 32px sans-serif';
      sctx.fillStyle = '#fde047';
      sctx.fillText('इंडिया गेट | INDIA GATE  5 km ➔', 256, 140);

      sctx.font = 'bold 28px sans-serif';
      sctx.fillStyle = '#ffffff';
      sctx.fillText('आई.टी.ओ | ITO  2 km ➔', 256, 205);

      const signTex = new THREE.CanvasTexture(signCanvas);
      const signMat = new THREE.MeshBasicMaterial({ map: signTex });

      const board = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.8, 0.12), signMat);
      board.position.set(x, 4.5, z);
      boardGroup.add(board);

      const poleGeo = new THREE.CylinderGeometry(0.09, 0.09, 4.6, 8);
      const pole1 = new THREE.Mesh(poleGeo, mats.metroConcrete);
      pole1.position.set(x - 1.4, 2.3, z);
      boardGroup.add(pole1);

      const pole2 = new THREE.Mesh(poleGeo, mats.metroConcrete);
      pole2.position.set(x + 1.4, 2.3, z);
      boardGroup.add(pole2);

      parent.add(boardGroup);
    }

    function createStreetTree(parent, x, z) {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 2.5, 8), mats.treeTrunk);
      trunk.position.set(x, 1.25, z);
      tree.add(trunk);

      const leaves = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4, 1), mats.treeGreen);
      leaves.position.set(x, 3.2, z);
      leaves.castShadow = true;
      tree.add(leaves);

      parent.add(tree);
    }

    function waveKerbFlags(t) {
      const swing = Math.sin(t * 5) * 0.45;
      for (let i = 0; i < kerbWaves.length; i++) kerbWaves[i].rotation.y = swing;
    }

    let busBits = null;
    function busParts() {
      if (busBits) return busBits;
      const sign = document.createElement("canvas");
      sign.width = 512;
      sign.height = 128;
      const sctx = sign.getContext("2d");
      sctx.fillStyle = "#111827";
      sctx.fillRect(0, 0, 512, 128);
      sctx.fillStyle = "#facc15";
      sctx.font = "bold 86px Arial, sans-serif";
      sctx.textAlign = "center";
      sctx.textBaseline = "middle";
      sctx.fillText("DTC", 256, 68);
      const signTex = new THREE.CanvasTexture(sign);
      signTex.colorSpace = THREE.SRGBColorSpace;

      const side = document.createElement("canvas");
      side.width = 512;
      side.height = 128;
      const xctx = side.getContext("2d");
      xctx.clearRect(0, 0, 512, 128);
      xctx.fillStyle = "#f8fafc";
      xctx.font = "bold 100px Arial, sans-serif";
      xctx.textAlign = "center";
      xctx.textBaseline = "middle";
      xctx.fillText("DTC", 256, 68);
      const sideTex = new THREE.CanvasTexture(side);
      sideTex.colorSpace = THREE.SRGBColorSpace;

      const wheel = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 12);
      wheel.rotateZ(Math.PI / 2);
      const hub = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 8);
      hub.rotateZ(Math.PI / 2);

      busBits = {
        skirt: new THREE.BoxGeometry(2.26, 0.62, 7.15),
        cabin: new THREE.BoxGeometry(2.16, 1.22, 7.1),
        roof: new THREE.BoxGeometry(2.22, 0.1, 7.2),
        stripe: new THREE.BoxGeometry(2.3, 0.08, 7.18),
        window: new THREE.BoxGeometry(0.07, 0.48, 0.72),
        windshield: new THREE.BoxGeometry(1.95, 0.72, 0.06),
        board: new THREE.PlaneGeometry(1.45, 0.36),
        light: new THREE.SphereGeometry(0.13, 8, 8),
        tail: new THREE.BoxGeometry(0.32, 0.16, 0.06),
        door: new THREE.BoxGeometry(0.06, 1.2, 0.78),
        side: new THREE.PlaneGeometry(2.1, 0.42),
        ac: new THREE.BoxGeometry(1.35, 0.22, 2.1),
        wheel,
        hub,
        skirtMat: new THREE.MeshLambertMaterial({ color: 0x1c1917 }),
        windowMat: new THREE.MeshLambertMaterial({ color: 0x0b1f33 }),
        hubMat: new THREE.MeshLambertMaterial({ color: 0xd6d3d1 }),
        boardMat: new THREE.MeshBasicMaterial({ map: signTex }),
        sideMat: new THREE.MeshBasicMaterial({ map: sideTex, transparent: true, side: THREE.DoubleSide })
      };
      return busBits;
    }

    function createDtcBus() {
      const bus = new THREE.Group();
      const isGreen = Math.random() > 0.35;
      const busMat = isGreen ? mats.dtcGreen : mats.dtcBlue;
      const p = busParts();

      const skirt = new THREE.Mesh(p.skirt, p.skirtMat);
      skirt.position.y = 0.95;
      skirt.castShadow = true;
      bus.add(skirt);

      const cabin = new THREE.Mesh(p.cabin, busMat);
      cabin.position.y = 1.84;
      cabin.castShadow = true;
      bus.add(cabin);

      const stripe = new THREE.Mesh(p.stripe, mats.metroYellow);
      stripe.position.y = 1.28;
      bus.add(stripe);

      const roof = new THREE.Mesh(p.roof, busMat);
      roof.position.y = 2.48;
      bus.add(roof);

      [-2.45, -1.45, -0.4, 0.7].forEach((z) => {
        [-1.11, 1.11].forEach((x) => {
          const win = new THREE.Mesh(p.window, p.windowMat);
          win.position.set(x, 1.9, z);
          bus.add(win);
        });
      });

      const door = new THREE.Mesh(p.door, p.windowMat);
      door.position.set(1.11, 1.42, 2.35);
      bus.add(door);

      const glass = new THREE.Mesh(p.windshield, mats.glass);
      glass.position.set(0, 1.95, 3.58);
      bus.add(glass);

      const board = new THREE.Mesh(p.board, p.boardMat);
      board.position.set(0, 2.46, 3.6);
      bus.add(board);

      [[-0.7, 1.05], [0.7, 1.05]].forEach(([x, y]) => {
        const lamp = new THREE.Mesh(p.light, mats.headlightGlow);
        lamp.position.set(x, y, 3.6);
        bus.add(lamp);
      });

      const backGlass = new THREE.Mesh(p.windshield, mats.glass);
      backGlass.position.set(0, 1.95, -3.58);
      bus.add(backGlass);

      [[-0.72, 1.02], [0.72, 1.02]].forEach(([x, y]) => {
        const tail = new THREE.Mesh(p.tail, mats.metroStripeRed);
        tail.position.set(x, y, -3.6);
        bus.add(tail);
      });

      [[-1.18, 2.2], [1.18, 2.2], [-1.18, -2.2], [1.18, -2.2]].forEach(([x, z]) => {
        const wheel = new THREE.Mesh(p.wheel, mats.blackRubber);
        wheel.position.set(x, 0.38, z);
        bus.add(wheel);
        const hub = new THREE.Mesh(p.hub, p.hubMat);
        hub.position.set(x > 0 ? x + 0.05 : x - 0.05, 0.38, z);
        bus.add(hub);
      });

      [-1.14, 1.14].forEach((x) => {
        const label = new THREE.Mesh(p.side, p.sideMat);
        label.position.set(x, 1.46, -0.35);
        label.rotation.y = x > 0 ? -Math.PI / 2 : Math.PI / 2;
        bus.add(label);
      });

      if (Math.random() < 0.4) {
        const ac = new THREE.Mesh(p.ac, p.skirtMat);
        ac.position.set(0, 2.64, -0.3);
        bus.add(ac);
      }

      bus.userData = {
        type: 'BUS',
        width: 2.3,
        height: 2.7,
        length: 7.5,
        canSlideUnder: false
      };
      return bus;
    }

    let autoWheelGeo = null;
    let autoRoofGeo = null;
    function createAutoRickshaw() {
      const tuktuk = new THREE.Group();
      if (!autoWheelGeo) {
        autoWheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.18, 12);
        autoWheelGeo.rotateZ(Math.PI / 2);
      }
      if (!autoRoofGeo) {
        autoRoofGeo = new THREE.CylinderGeometry(0.66, 0.66, 1.2, 16, 1, false, 0, Math.PI);
        autoRoofGeo.rotateZ(Math.PI / 2);
        autoRoofGeo.rotateY(Math.PI / 2);
      }

      const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.12, 2.4), mats.blackRubber);
      chassis.position.set(0, 0.26, -0.05);
      tuktuk.add(chassis);

      const body = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.4, 1.55), mats.autoGreen);
      body.position.set(0, 0.52, 0.22);
      tuktuk.add(body);

      const nose = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.26, 0.72), mats.autoGreen);
      nose.position.set(0, 0.46, -0.95);
      tuktuk.add(nose);

      const back = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.88, 0.08), mats.autoYellow);
      back.position.set(0, 1.02, 0.98);
      tuktuk.add(back);

      const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.34, 0.05), mats.glass);
      rearGlass.position.set(0, 1.18, 1.03);
      tuktuk.add(rearGlass);

      [-0.5, 0.5].forEach((x) => {
        const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.04), mats.metroStripeRed);
        lamp.position.set(x, 0.76, 1.03);
        tuktuk.add(lamp);
      });

      const roof = new THREE.Mesh(autoRoofGeo, mats.autoYellow);
      roof.scale.y = 0.42;
      roof.position.set(0, 1.46, 0.38);
      tuktuk.add(roof);

      const screen = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.5, 0.05), mats.glass);
      screen.position.set(0, 1.15, -0.2);
      screen.rotation.x = 0.5;
      tuktuk.add(screen);

      [-0.64, 0.64].forEach((x) => {
        const side = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.62, 1.05), mats.autoYellow);
        side.position.set(x, 0.98, 0.32);
        tuktuk.add(side);
      });

      const headlight = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), mats.headlightGlow);
      headlight.position.set(0, 0.52, -1.32);
      tuktuk.add(headlight);

      [[-0.8, 0.45], [0.8, 0.45]].forEach(([x, z]) => {
        const guard = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.52), mats.autoYellow);
        guard.position.set(x, 0.58, z);
        tuktuk.add(guard);
      });

      [[-0.8, 0.45], [0.8, 0.45], [0, -1.2]].forEach(([x, z]) => {
        const wheel = new THREE.Mesh(autoWheelGeo, mats.blackRubber);
        wheel.position.set(x, 0.3, z);
        tuktuk.add(wheel);
      });

      const isMoving = Math.random() < 0.45;
      tuktuk.userData = {
        type: 'AUTO',
        width: 1.9,
        height: 2.1,
        length: 2.8,
        canSlideUnder: false,
        isMovingTraffic: isMoving,
        trafficSpeed: isMoving ? 8 + Math.random() * 6 : 0
      };
      return tuktuk;
    }

    let delhiPoliceTex = null;
    function delhiPoliceLabel() {
      if (delhiPoliceTex) return delhiPoliceTex;
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 160;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, 512, 160);
      ctx.fillStyle = "#dc2626";
      ctx.font = 'bold 78px "Yatra One", "Noto Sans Devanagari", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("दिल्ली पुलिस", 256, 84);
      delhiPoliceTex = new THREE.CanvasTexture(canvas);
      delhiPoliceTex.colorSpace = THREE.SRGBColorSpace;
      delhiPoliceTex.anisotropy = 8;
      if (document.fonts && document.fonts.load) {
        document.fonts.load('78px "Yatra One"').then(() => {
          ctx.clearRect(0, 0, 512, 160);
          ctx.fillStyle = "#dc2626";
          ctx.font = 'bold 78px "Yatra One", "Noto Sans Devanagari", sans-serif';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("दिल्ली पुलिस", 256, 84);
          delhiPoliceTex.needsUpdate = true;
        }).catch(() => {});
      }
      return delhiPoliceTex;
    }

    function createPoliceBarricade() {
      const barricade = new THREE.Group();

      const board = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 0.12), mats.policeYellow);
      board.position.y = 0.85;
      board.castShadow = true;
      barricade.add(board);

      const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.41, 0.16, 0.14), mats.dtcBlue);
      stripe.position.y = 0.48;
      barricade.add(stripe);

      const labelMat = new THREE.MeshBasicMaterial({
        map: delhiPoliceLabel(),
        transparent: true,
        side: THREE.DoubleSide
      });
      const label = new THREE.Mesh(new THREE.PlaneGeometry(2.15, 0.58), labelMat);
      label.position.set(0, 0.98, 0.07);
      barricade.add(label);
      const labelBack = label.clone();
      labelBack.position.z = -0.07;
      labelBack.rotation.y = Math.PI;
      barricade.add(labelBack);

      const legGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8);
      const l1 = new THREE.Mesh(legGeo, mats.metroConcrete);
      l1.position.set(-1.0, 0.6, 0);
      barricade.add(l1);

      const l2 = new THREE.Mesh(legGeo, mats.metroConcrete);
      l2.position.set(1.0, 0.6, 0);
      barricade.add(l2);

      barricade.userData = {
        type: 'BARRICADE',
        width: 2.4,
        height: 1.1,
        length: 0.5,
        canJumpOver: true,
        canSlideUnder: false
      };
      return barricade;
    }

    function createSamosaMesh(isGolden = false) {
      const samosa = new THREE.Group();
      const geom = new THREE.ConeGeometry(isGolden ? 0.5 : 0.42, isGolden ? 0.65 : 0.55, 3);
      const mesh = new THREE.Mesh(geom, isGolden ? mats.goldenSamosa : mats.samosaCrust);
      mesh.rotation.x = Math.PI / 2;
      samosa.add(mesh);

      samosa.userData = { type: 'SAMOSA', value: isGolden ? 3 : 1, isSkyItem: isGolden };
      return samosa;
    }

    function createSkyRingMesh() {
      const ringGroup = new THREE.Group();
      const ringGeo = new THREE.TorusGeometry(0.85, 0.1, 8, 20);
      const mesh = new THREE.Mesh(ringGeo, mats.ringGlow);
      ringGroup.add(mesh);

      ringGroup.userData = { type: 'SKY_RING', value: 15, isSkyItem: true };
      return ringGroup;
    }

    function createPowerupMesh(type) {
      const pGroup = new THREE.Group();

      if (type === 'FLYING_JETPACK') {
        const jetGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 8);
        const tank = new THREE.Mesh(jetGeo, mats.jetpackMetal);
        pGroup.add(tank);

        const wingGeo = new THREE.BoxGeometry(1.6, 0.15, 0.4);
        const wing = new THREE.Mesh(wingGeo, new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
        wing.position.set(0, 0.1, 0);
        pGroup.add(wing);

        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), mats.jetpackFlame);
        beacon.position.set(0, 0.45, 0);
        pGroup.add(beacon);

        pGroup.userData = { type: 'FLYING_JETPACK', name: 'Udta Dipke Jetpack' };
      } else if (type === 'METRO_SPEED') {
        const geo = new THREE.TorusGeometry(0.4, 0.12, 8, 16);
        const mat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
        pGroup.add(new THREE.Mesh(geo, mat));
        pGroup.userData = { type: 'METRO_SPEED', name: 'Metro Speed Sprint' };
      } else if (type === 'MAGNET') {
        const geo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 8);
        const mat = new THREE.MeshLambertMaterial({ color: 0xef4444 });
        pGroup.add(new THREE.Mesh(geo, mat));
        pGroup.userData = { type: 'MAGNET', name: 'Chai Magnet' };
      } else {
        const geo = new THREE.CylinderGeometry(0.28, 0.2, 0.5, 10);
        const mat = new THREE.MeshLambertMaterial({ color: 0xb45309 });
        pGroup.add(new THREE.Mesh(geo, mat));
        pGroup.userData = { type: 'CHAI_POWER', name: '2x Chai Multiplier' };
      }

      return pGroup;
    }

    function createDustParticles() {
      const count = 75;
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);

      for (let i = 0; i < count * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 16;
        positions[i + 1] = Math.random() * 4;
        positions[i + 2] = -Math.random() * 60;
      }

      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
        color: 0xfde047,
        size: 0.15,
        transparent: true,
        opacity: 0.6
      });

      dustParticles = new THREE.Points(geo, mat);
      scene.add(dustParticles);
    }

    function updateDustParticles() {
      const positions = dustParticles.geometry.attributes.position.array;
      for (let i = 2; i < positions.length; i += 3) {
        positions[i] += player.speed * 0.025;
        if (positions[i] > 10) {
          positions[i] = -60 - Math.random() * 20;
        }
      }
      dustParticles.geometry.attributes.position.needsUpdate = true;
    }

    let lastSpawnZ = -30;
    const SPAWN_INTERVAL = 30;

    function manageSpawns() {
      while (lastSpawnZ > player.z - 180) {
        spawnCluster(lastSpawnZ);
        lastSpawnZ -= SPAWN_INTERVAL;
      }

      roadSegments.forEach(seg => {
        if (seg.position.z > player.z + SEGMENT_LENGTH) {
          seg.position.z -= TOTAL_SEGMENTS * SEGMENT_LENGTH;
        }
      });

      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        if (obs.position.z > player.z + 18) {
          scene.remove(obs);
          obstacles.splice(i, 1);
        }
      }

      for (let i = collectibles.length - 1; i >= 0; i--) {
        const col = collectibles[i];
        if (col.position.z > player.z + 18) {
          scene.remove(col);
          collectibles.splice(i, 1);
        }
      }
    }

    function laneAt(x) {
      let best = 0;
      let bestD = Infinity;
      for (let i = 0; i < LANES.length; i++) {
        const d = Math.abs(LANES[i] - x);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      return bestD < 1.6 ? best : -1;
    }

    function lanesBlockedNear(zPos) {
      const blocked = new Set();
      for (let i = 0; i < obstacles.length; i++) {
        const obs = obstacles[i];
        const ud = obs.userData || {};
        const half = (ud.length || 2) / 2;
        const reach = half + 5 + (ud.isMovingTraffic ? 8 : 0);
        if (Math.abs(obs.position.z - zPos) > reach) continue;
        const lane = laneAt(obs.position.x);
        if (lane >= 0) blocked.add(lane);
      }
      return blocked;
    }

    function spawnCluster(zPos) {
      const blocked = lanesBlockedNear(zPos);
      const open = [];
      for (let lane = 0; lane < 3; lane++) {
        if (!blocked.has(lane)) open.push(lane);
      }
      if (!open.length) return;

      const freeLane = open[Math.floor(Math.random() * open.length)];
      const obstacleTypes = ['BUS', 'AUTO', 'BARRICADE'];
      const canSpawnObstacles = (player.distance >= 40);

      for (let lane = 0; lane < 3; lane++) {
        if (blocked.has(lane)) continue;
        if (lane === freeLane || !canSpawnObstacles) {
          if (Math.random() < 0.28) {
            spawnPowerup(lane, zPos);
          } else {
            spawnSamosaTrail(lane, zPos);
          }
          continue;
        }

        const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        let obsMesh;

        if (type === 'BUS') obsMesh = createDtcBus();
        else if (type === 'AUTO') obsMesh = createAutoRickshaw();
        else obsMesh = createPoliceBarricade();

        obsMesh.userData.anchorZ = zPos;
        obsMesh.position.set(LANES[lane], 0, zPos);
        scene.add(obsMesh);
        obstacles.push(obsMesh);
      }

      spawnSkyCourse(zPos);
    }

    function spawnSkyCourse(zPos) {
      const skyLane = Math.floor(Math.random() * 3);
      if (Math.random() < 0.5) {
        const golden = createSamosaMesh(true);
        golden.position.set(LANES[skyLane], 8.5, zPos);
        scene.add(golden);
        collectibles.push(golden);
      } else {
        const ring = createSkyRingMesh();
        ring.position.set(LANES[skyLane], 8.5, zPos);
        scene.add(ring);
        collectibles.push(ring);
      }
    }

    function spawnSamosaTrail(lane, zPos) {
      for (let k = 0; k < 3; k++) {
        const samosa = createSamosaMesh(false);
        samosa.position.set(LANES[lane], 0.9, zPos + (k - 1) * 3);
        scene.add(samosa);
        collectibles.push(samosa);
      }
    }

    function spawnPowerup(lane, zPos) {
      const canFly = player.distance >= 200;
      let chosen;

      if (canFly && Math.random() < 0.12) {
        chosen = 'FLYING_JETPACK';
      } else {
        const standardTypes = ['METRO_SPEED', 'MAGNET', 'CHAI_POWER'];
        chosen = standardTypes[Math.floor(Math.random() * standardTypes.length)];
      }

      const p = createPowerupMesh(chosen);
      p.position.set(LANES[lane], 1.25, zPos);
      scene.add(p);
      collectibles.push(p);
    }

    function setupControls() {
      const onKeyDown = (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'Space') {
          e.preventDefault();
        }
        if (currentGameState !== STATE.PLAYING) return;
        handleCode(e.code);
      };
      window.addEventListener('keydown', onKeyDown);
      cleanups.push(() => window.removeEventListener('keydown', onKeyDown));

      const bindClick = (id, fn) => {
        const el = document.getElementById(id);
        if (!el) return;
        const handler = (e) => { e.stopPropagation(); fn(); };
        el.addEventListener('click', handler);
        cleanups.push(() => el.removeEventListener('click', handler));
      };
      bindClick('btn-left', () => moveLane(-1));
      bindClick('btn-right', () => moveLane(1));
      bindClick('btn-jump', () => jump());

      let touchStartX = 0, touchStartY = 0;
      let touchStartTime = 0;
      const onTouchStart = (e) => {
        try { audio.ensureCtx(); } catch (err) {}
        if (!e.touches[0]) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = performance.now();
      };
      const onTouchEnd = (e) => {
        if (currentGameState !== STATE.PLAYING) return;
        if (!e.changedTouches[0]) return;
        const touch = e.changedTouches[0];
        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const duration = performance.now() - touchStartTime;

        if (dist > 25) {
          if (Math.abs(dx) > Math.abs(dy)) {
            moveLane(dx > 0 ? 1 : -1);
          } else if (dy < 0) {
            jump();
          } else if (dy > 0) {
            slide();
          }
        } else if (duration < 350) {
          // Tap zones on screen: left 40% dodges left, right 40% dodges right, center jumps
          const w = window.innerWidth;
          if (touch.clientX < w * 0.4) {
            moveLane(-1);
          } else if (touch.clientX > w * 0.6) {
            moveLane(1);
          } else {
            jump();
          }
        }
      };
      window.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchend', onTouchEnd, { passive: true });
      cleanups.push(() => window.removeEventListener('touchstart', onTouchStart));
      cleanups.push(() => window.removeEventListener('touchend', onTouchEnd));

      const unlockAudio = () => {
        try { audio.ensureCtx(); } catch (err) {}
      };
      window.addEventListener('touchstart', unlockAudio, { passive: true, once: true });
      window.addEventListener('touchend', unlockAudio, { passive: true, once: true });
      window.addEventListener('pointerdown', unlockAudio, { passive: true, once: true });
      cleanups.push(() => {
        window.removeEventListener('touchstart', unlockAudio);
        window.removeEventListener('touchend', unlockAudio);
        window.removeEventListener('pointerdown', unlockAudio);
      });

      bindClick('btn-start', startCutsceneIntro);
      bindClick('btn-restart', startCutsceneIntro);

      const audioBtn = document.getElementById('btn-audio-toggle');
      if (audioBtn) {
        audioBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          audio.isMuted = !audio.isMuted;
          const icon = document.getElementById('audio-toggle-icon');
          if (icon) icon.textContent = audio.isMuted ? '🔇' : '🔊';
          if (audioBtn.lastChild) {
            audioBtn.lastChild.textContent = audio.isMuted ? ' Sound OFF' : ' Sound ON';
          }
        });
      }

      const shareBtn = document.getElementById('btn-share-score');
      if (shareBtn) {
        shareBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const dist = Math.floor(player.distance);
          const coins = player.coins;
          const score = player.score;
          const text = `🚨 Delhi Police caught me in Bhaag Dipke Bhaag!\n🏃 Distance: ${dist}m\n🥟 Samosas: ${coins}\n🏆 Score: ${score}\nCan you escape the Delhi Police? Play now: https://bhaag-dipke.vercel.app/`;
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
              const label = document.getElementById('share-btn-text');
              if (label) {
                const prev = label.textContent;
                label.textContent = "✅ Challan Copied to Clipboard!";
                setTimeout(() => { if (label) label.textContent = prev; }, 2200);
              }
            }).catch(() => {});
          }
        });
      }

      const photoInput = document.getElementById('photo-input');
      if (photoInput) {
        const onPhoto = (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;
          const url = URL.createObjectURL(file);
          const img = new Image();
          img.onload = () => {
            coverPhoto(img);
            URL.revokeObjectURL(url);
          };
          img.src = url;
        };
        photoInput.addEventListener('change', onPhoto);
        cleanups.push(() => photoInput.removeEventListener('change', onPhoto));
      }
    }

    function moveLane(dir) {
      if (currentGameState !== STATE.PLAYING && currentGameState !== STATE.CUTSCENE) return;
      const targetLane = player.laneIndex + dir;
      if (targetLane >= 0 && targetLane <= 2) {
        player.laneIndex = targetLane;
        player.targetX = LANES[targetLane];
        audio.playSlide();
      }
    }

    function doJump() {
      player.vy = 11.5;
      player.isGrounded = false;
      player.coyoteLeft = 0;
      player.isSliding = false;
      player.jumpBuffer = 0;
      audio.playJump();
    }

    function jump() {
      if (currentGameState !== STATE.PLAYING || player.isFlying) return;
      if (player.isGrounded || player.coyoteLeft > 0) doJump();
      else player.jumpBuffer = 0.14;
    }

    function slide() {
      if (currentGameState !== STATE.PLAYING) return;
      if (player.isGrounded && !player.isSliding) {
        player.isSliding = true;
        player.slideTimer = 0.7;
        audio.playSlide();
      } else if (!player.isGrounded) {
        player.vy = -16;
      }
    }

    function startCountdown() {
      countdownStep = 3;
      countdownTimer = 0;

      const overlay = document.getElementById('countdown-overlay');
      if (overlay) overlay.classList.remove('hidden');

      showCountdownNumber(3);
    }

    function showCountdownNumber(num: number) {
      const el = document.getElementById('countdown-number');
      const sub = document.getElementById('countdown-subtext');
      if (!el || !sub) return;

      el.classList.remove('countdown-pop');
      void el.offsetWidth;
      el.classList.add('countdown-pop');

      if (num === 3) {
        el.textContent = "3";
        el.className = "text-8xl sm:text-9xl font-bungee font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-amber-500 drop-shadow-[0_14px_35px_rgba(0,0,0,0.95)] countdown-pop";
        sub.textContent = "READY? • तैयार हो जाओ!";
        audio.playCountdownBeep(false, 520);
      } else if (num === 2) {
        el.textContent = "2";
        el.className = "text-8xl sm:text-9xl font-bungee font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-400 to-orange-500 drop-shadow-[0_14px_35px_rgba(0,0,0,0.95)] countdown-pop";
        sub.textContent = "SET! • ध्यान से!";
        audio.playCountdownBeep(false, 640);
      } else if (num === 1) {
        el.textContent = "1";
        el.className = "text-8xl sm:text-9xl font-bungee font-black text-transparent bg-clip-text bg-gradient-to-b from-orange-500 to-red-500 drop-shadow-[0_14px_35px_rgba(0,0,0,0.95)] countdown-pop";
        sub.textContent = "POLICE IS HERE! • पुलिस आ गई!";
        audio.playCountdownBeep(false, 800);
      } else if (num === 0) {
        el.textContent = "भाग!";
        el.className = "text-8xl sm:text-9xl font-bungee font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-yellow-300 to-amber-400 drop-shadow-[0_14px_35px_rgba(0,0,0,0.95)] countdown-pop scale-110";
        sub.textContent = "BHAAG DIPKE BHAAG! 🏃💨";
        audio.playCountdownBeep(true, 1174);
        audio.playHorn();
      }
    }

    function updateCountdown(dt: number) {
      countdownTimer += dt;

      if (countdownStep === 3 && countdownTimer >= 0.75) {
        countdownStep = 2;
        showCountdownNumber(2);
      } else if (countdownStep === 2 && countdownTimer >= 1.5) {
        countdownStep = 1;
        showCountdownNumber(1);
      } else if (countdownStep === 1 && countdownTimer >= 2.25) {
        countdownStep = 0;
        showCountdownNumber(0);
      } else if (countdownStep === 0 && countdownTimer >= 2.9) {
        countdownStep = -1;
        const overlay = document.getElementById('countdown-overlay');
        if (overlay) overlay.classList.add('hidden');
      }
    }

    function startCutsceneIntro() {
      audio.ensureCtx();
      audio.resetGameOverSound();
      audio.playPoliceSiren();
      runnersShownTimer = 0;
      tehelkaPlayedInCutscene = false;

      player.laneIndex = 1;
      player.targetX = 0;
      player.x = 0;
      player.y = 0;
      player.z = 0;
      player.vy = 0;
      player.isGrounded = true;
      player.isSliding = false;
      player.speed = player.baseSpeed;
      player.distance = 0;
      player.coins = 0;
      player.powerup = null;
      player.powerupTimer = 0;
      player.isFlying = false;
      player.policeGap = 3.6;
      lastSpawnZ = -40;

      // Reset dipke posture & limbs
      dipkeGroup.rotation.set(0, 0, 0);
      dipkeGroup.position.set(0, 0, 0);
      player.vx = 0;
      player.vy = 0;
      player.prevZ = 0;
      player.coyoteLeft = 0.12;
      player.jumpBuffer = 0;
      player.landSquash = 0;
      ragdoll.y = 0;
      ragdoll.vy = 0;
      ragdoll.pitch = 0;
      ragdoll.roll = 0;
      ragdoll.yaw = 0;
      ragdoll.wp = 0;
      ragdoll.wr = 0;
      ragdoll.wy = 0;
      poseSprite(spriteStandY(), 1, 1);
      dipkeLimbs.leftArm.rotation.set(0, 0, 0);
      dipkeLimbs.rightArm.rotation.set(0, 0, 0);
      dipkeLimbs.leftLeg.rotation.set(0, 0, 0);
      dipkeLimbs.rightLeg.rotation.set(0, 0, 0);
      if (dipkeLimbs.leftElbow) dipkeLimbs.leftElbow.rotation.set(0, 0, 0);
      if (dipkeLimbs.rightElbow) dipkeLimbs.rightElbow.rotation.set(0, 0, 0);
      if (dipkeLimbs.leftKnee) dipkeLimbs.leftKnee.rotation.set(0, 0, 0);
      if (dipkeLimbs.rightKnee) dipkeLimbs.rightKnee.rotation.set(0, 0, 0);

      // Reset police officers
      policeOfficers.forEach((cop) => {
        cop.group.rotation.set(0, 0, 0);
        cop.group.visible = true;
        cop.group.position.set(cop.baseOffsetX, 0, cop.baseOffsetZ);
        cop.frame = -1;
        if (cop.mat) {
          cop.mat.opacity = 1;
          cop.mat.depthWrite = true;
        }
        if (cop.head) {
          cop.head.rotation.set(0, 0, 0);
          cop.head.position.y = 2.2;
          cop.head.position.z = 0;
        }
      });

      // Clear caught & flight UI
      if (caughtTrio) caughtTrio.visible = false;

      if (jetpackModel) jetpackModel.visible = false;
      document.getElementById('flight-fx').classList.add('opacity-0');
      document.getElementById('speed-fx').classList.add('opacity-0');
      document.getElementById('hud-powerup').classList.add('hidden');

      obstacles.forEach(o => scene.remove(o));
      obstacles = [];
      collectibles.forEach(c => scene.remove(c));
      collectibles = [];

      roadSegments.forEach((seg, idx) => {
        seg.position.z = -idx * SEGMENT_LENGTH;
      });

      document.getElementById('menu-modal').classList.add('hidden');
      document.getElementById('gameover-modal').classList.add('hidden');
      document.getElementById('countdown-overlay')?.classList.add('hidden');
      document.getElementById('hud').classList.add('hidden');
      audio.playMetroRumble();

      currentGameState = STATE.CUTSCENE;
      cutsceneProgress = 0;
    }

    let lastTime = 0;

    function gameLoop(time) {
      if (disposed) return;
      pollInjectedKeys();
      if (!lastTime) lastTime = time;
      const frameDt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;
      waveKerbFlags(time * 0.001);
      const PHYS = 1 / 60;

      if (currentGameState === STATE.CUTSCENE) {
        updateCutscene(frameDt);
      } else if (currentGameState === STATE.PLAYING) {
        physAcc += frameDt;
        let steps = 0;
        while (physAcc >= PHYS && steps < 8) {
          updateGameplay(PHYS);
          physAcc -= PHYS;
          steps++;
        }
      } else if (currentGameState === STATE.CAUGHT) {
        physAcc += frameDt;
        let steps = 0;
        while (physAcc >= PHYS && steps < 8) {
          updateCaughtAnimation(PHYS);
          physAcc -= PHYS;
          steps++;
        }
      } else {
        player.runAnimTime += frameDt * 6;
        animateDipkeLimbs(player.runAnimTime);
        syncShadow();
        camera.position.x = Math.sin(time * 0.001) * 0.8;
        camera.position.y = 4.1;
        camera.position.z = 7.2;
        camera.lookAt(0, 1.5, -6);
      }

      updateDipkeView();
      renderer.render(scene, camera);
    }

    function smooth01(u) {
      const x = Math.max(0, Math.min(1, u));
      return x * x * (3 - 2 * x);
    }

    function mix(a, b, u) {
      return a + (b - a) * u;
    }

    function samplePath(keys, t) {
      const n = keys.length;
      if (t <= keys[0].t) return keys[0];
      if (t >= keys[n - 1].t) return keys[n - 1];
      let i = 0;
      while (i < n - 2 && t > keys[i + 1].t) i++;
      const span = keys[i + 1].t - keys[i].t;
      const u = span <= 0 ? 1 : smooth01((t - keys[i].t) / span);
      const a = keys[i];
      const b = keys[i + 1];
      return {
        t,
        x: mix(a.x, b.x, u),
        y: mix(a.y, b.y, u),
        z: mix(a.z, b.z, u),
        lx: mix(a.lx, b.lx, u),
        ly: mix(a.ly, b.ly, u),
        lz: mix(a.lz, b.lz, u)
      };
    }

    function placeIntroMetro(elapsed, pz) {
      if (!metroTrain) return;
      const keys = [0, 72, 2.2, 18, 4.3, -16, 7, -78, 16.4, -140];
      let z = keys[1];
      for (let i = 0; i < keys.length - 2; i += 2) {
        if (elapsed >= keys[i] && elapsed <= keys[i + 2]) {
          const u = (elapsed - keys[i]) / (keys[i + 2] - keys[i]);
          z = mix(keys[i + 1], keys[i + 3], u);
          break;
        }
      }
      if (elapsed >= 16.4) z = -140;
      metroTrain.visible = true;
      metroTrainActive = true;
      metroTrainZ = pz + z;
      metroTrain.position.set(-8.2, 9.05, metroTrainZ);
    }

    function updateCutscene(dt) {
      cutsceneProgress += dt / CUTSCENE_DURATION;
      const elapsed = cutsceneProgress * CUTSCENE_DURATION;

      const introSpeed = player.baseSpeed * 0.85;
      player.z -= introSpeed * dt;
      player.runAnimTime += dt * (introSpeed * 0.35);

      stepLane(dt);
      animateDipkeLimbs(player.runAnimTime);
      dipkeGroup.rotation.set(0.04, 0, 0);
      dipkeGroup.position.set(player.x, 0, player.z);
      syncShadow();
      updatePoliceChasers(dt, introSpeed);
      placeIntroMetro(elapsed, player.z);
      if (horizonGroup) horizonGroup.position.z = player.z;

      const px = player.x;
      const pz = player.z;
      const path = [
        { t: 0.0, x: -24, y: 21, z: 10, lx: -8.2, ly: 11.2, lz: 48 },
        { t: 1.7, x: -21, y: 19, z: 7, lx: -8.2, ly: 11, lz: 22 },
        { t: 3.1, x: -19, y: 17.6, z: 0, lx: -8.2, ly: 10.6, lz: -6 },
        { t: 4.5, x: -17, y: 17.2, z: -12, lx: -8.2, ly: 10.4, lz: -32 },
        { t: 5.45, x: -3.5, y: 8.5, z: -9, lx: 0, ly: 2.2, lz: -4 },
        { t: 6.45, x: 0.05, y: 2.5, z: -8, lx: 0, ly: 1.48, lz: 0.2 },
        { t: 11.15, x: 0, y: 1.72, z: -4.5, lx: 0, ly: 1.38, lz: 0.15 },
        { t: 12.05, x: -3.6, y: 2.05, z: -5.1, lx: 0, ly: 1.35, lz: 0.1 },
        { t: 12.6, x: -7.2, y: 2.7, z: -2.6, lx: 0.2, ly: 1.3, lz: -1.5 },
        { t: 13.15, x: -6.4, y: 3.5, z: 5.2, lx: 0, ly: 1.45, lz: -7 },
        { t: 13.75, x: -0.3, y: 4.15, z: 8.1, lx: 0, ly: 1.5, lz: -6 },
        { t: 16.4, x: 0, y: 4.2, z: 7.5, lx: 0, ly: 1.8, lz: -12 }
      ];

      const p = samplePath(path, elapsed);
      const bob = elapsed < 11.15 ? Math.sin(elapsed * 0.9) * 0.06 : 0;
      camera.up.set(0, 1, 0);
      camera.position.set(px + p.x, p.y + bob, pz + p.z);
      camera.lookAt(px + p.lx, p.ly, pz + p.lz);

      const crossing = p.z > -1.15 && p.z < 2.6;
      const showRunners = elapsed > 6.15 && !crossing;

      if (showRunners) {
        runnersShownTimer += dt;
        if (runnersShownTimer >= 1.0 && !tehelkaPlayedInCutscene) {
          tehelkaPlayedInCutscene = true;
          audio.playIntroMeme();
        }
      }

      if (dipkeGroup) dipkeGroup.visible = showRunners;
      if (dipkeShadow) dipkeShadow.visible = showRunners;
      policeOfficers.forEach((c) => {
        if (c.group) c.group.visible = showRunners;
      });

      roadSegments.forEach(seg => {
        if (seg.position.z > player.z + SEGMENT_LENGTH) {
          seg.position.z -= TOTAL_SEGMENTS * SEGMENT_LENGTH;
        }
      });

      if (cutsceneProgress >= 1.0) {
        camera.up.set(0, 1, 0);
        if (dipkeGroup) dipkeGroup.visible = true;
        if (dipkeShadow) dipkeShadow.visible = true;
        policeOfficers.forEach((c) => { if (c.group) c.group.visible = true; });
        if (metroTrain) {
          metroTrainActive = false;
          metroTrain.visible = false;
        }
        metroTimer = 8;
        currentGameState = STATE.PLAYING;
        document.getElementById('hud')?.classList.remove('hidden');
        audio.playHorn();
        startCountdown();
      }
    }

    function updateGameplay(dt) {
      if (countdownStep >= 0) {
        updateCountdown(dt);
      }
      let speedMultiplier = 1.0;
      if (player.isFlying) {
        speedMultiplier = 1.6;
      } else if (player.powerup === 'METRO_SPEED') {
        speedMultiplier = 1.45;
      }

      player.speed = Math.min(player.baseSpeed + (player.distance * 0.008), player.maxSpeed);
      const currentSpeed = player.speed * speedMultiplier;

      player.prevZ = player.z;
      player.z -= currentSpeed * dt;
      player.distance += currentSpeed * dt * 0.25;

      if (player.isFlying) {
        const lift = (player.flightTargetY - player.y) * 18 - player.vy * 5.5;
        player.vy += lift * dt;
        player.y += player.vy * dt;
        if (player.y < 0.15) {
          player.y = 0.15;
          if (player.vy < 0) player.vy = 0;
        }
        player.isGrounded = false;
        player.isSliding = false;
        player.policeGap = Math.min(player.policeGap + dt * 4.0, 35);

        jetpackFlames.forEach(f => {
          f.scale.y = 0.8 + Math.random() * 0.5;
        });
      } else {
        if (player.policeGap > 12) {
          player.policeGap -= dt * 2.5;
        } else if (player.policeGap < 10) {
          player.policeGap += dt * 1.5;
        }
      }

      document.getElementById('police-dist').textContent = Math.floor(player.policeGap) + 'm';

      stepLane(dt);

      if (!player.isFlying) {
        if (player.isGrounded) player.coyoteLeft = 0.12;
        else player.coyoteLeft = Math.max(0, player.coyoteLeft - dt);

        if (!player.isGrounded) {
          // Tuned runner gravity (arcade, not 9.8) so cows and barricades stay jumpable.
          player.vy -= 30 * dt;
          player.vy -= player.vy * Math.abs(player.vy) * 0.008 * dt;
          player.y += player.vy * dt;
          if (player.y <= 0) {
            if (player.vy < -8) player.landSquash = Math.min(0.22, -player.vy * 0.012);
            player.y = 0;
            player.vy = 0;
            player.isGrounded = true;
          }
        } else {
          player.y = 0;
          player.vy = 0;
        }

        if (player.jumpBuffer > 0) {
          player.jumpBuffer -= dt;
          if (player.isGrounded || player.coyoteLeft > 0) doJump();
        }

        if (player.isSliding) {
          player.slideTimer -= dt;
          if (player.slideTimer <= 0) player.isSliding = false;
        }
        player.landSquash = Math.max(0, player.landSquash - dt * 1.6);
      }

      dipkeGroup.position.set(player.x, player.y, player.z);
      const lean = Math.max(-0.42, Math.min(0.42, -player.vx * 0.032));

      if (player.isFlying) {
        dipkeGroup.rotation.x = -1.05;
        dipkeGroup.rotation.z = lean * 0.25;
        showFlyPose();
        poseSprite(spriteStandY(), 1, 1);
      } else {
        dipkeGroup.rotation.z = lean;
        player.runAnimTime += dt * (currentSpeed * 0.42);

        if (player.isSliding) {
          dipkeGroup.rotation.x = -1.05;
          showPoseFrame(6);
          poseSprite(spriteStandY() - 0.35, 1.06, 0.62);
          if (Math.random() < 0.4) emitFootstepDust(player.x, player.z, 1.4);
        } else if (!player.isGrounded) {
          dipkeGroup.rotation.x = Math.max(-0.28, Math.min(0.4, -player.vy * 0.03));
          showPoseFrame(player.vy > 0 ? 3 : 8);
          poseSprite(spriteStandY(), 0.96, 1.06);
        } else {
          dipkeGroup.rotation.x = 0.06;
          animateDipkeLimbs(player.runAnimTime);
          if (Math.sin(player.runAnimTime * 10) > 0.9) {
            emitFootstepDust(player.x, player.z, 0.8);
          }
        }
      }
      syncShadow();

      updatePoliceChasers(dt, currentSpeed);
      updateMovingTraffic(dt);
      updateMetroTrain(dt);

      if (horizonGroup) {
        horizonGroup.position.z = player.z;
      }

      camera.up.set(0, 1, 0);
      camera.position.x += (player.x - camera.position.x) * 8 * dt;
      if (player.isFlying) {
        camera.position.y += ((player.y + 3.2) - camera.position.y) * 4 * dt;
        camera.position.z = player.z + 9.5;
        camera.lookAt(player.x, player.y + 0.5, player.z - 15);
      } else {
        camera.position.y = player.y + 4.2;
        camera.position.z = player.z + 7.5;
        camera.lookAt(player.x, player.y + 1.8, player.z - 12);
      }

      if (player.powerup) {
        player.powerupTimer -= dt;
        const totalDuration = player.isFlying ? player.flightDuration : 8.0;
        const percent = Math.max(0, (player.powerupTimer / totalDuration) * 100);
        document.getElementById('powerup-bar').style.width = percent + '%';

        if (player.powerupTimer <= 0) {
          if (player.isFlying) {
            endFlyingMode();
          }
          player.powerup = null;
          document.getElementById('hud-powerup').classList.add('hidden');
          document.getElementById('speed-fx').classList.add('opacity-0');
        }
      }

      updateCollectibles(dt);
      checkObstacleCollisions(dt);
      manageSpawns();
      updateDustParticles();
      updateFootstepDust(dt);
      updateHUD();
    }

    function updateMovingTraffic(dt) {
      obstacles.forEach(obs => {
        const ud = obs.userData;
        if (!ud || !ud.isMovingTraffic) return;
        const next = obs.position.z - ud.trafficSpeed * dt;
        const cap = ud.anchorZ == null ? next : ud.anchorZ - 8;
        obs.position.z = next < cap ? cap : next;
      });
    }

    function startFlyingMode() {
      player.isFlying = true;
      player.powerup = 'FLYING_JETPACK';
      player.powerupTimer = player.flightDuration;

      if (jetpackModel) jetpackModel.visible = true;
      document.getElementById('flight-fx').classList.remove('opacity-0');

      audio.playWoo();
      audio.playFlightRocket();
      audio.playPowerup();

      const hudPower = document.getElementById('hud-powerup');
      const pName = document.getElementById('powerup-name');
      const pIcon = document.getElementById('powerup-icon');
      hudPower.classList.remove('hidden');
      pName.textContent = 'Udta Dipke Jetpack';
      pIcon.textContent = '🚀';
    }

    function endFlyingMode() {
      player.isFlying = false;
      if (jetpackModel) jetpackModel.visible = false;
      document.getElementById('flight-fx').classList.add('opacity-0');
      player.vy = -3.5;
    }

    function animateDipkeLimbs(animTime) {
      showRunFrame(animTime);
      const squat = player.landSquash || 0;
      poseSprite(spriteStandY() - squat * 0.08, 1 + squat * 0.12, 1 - squat * 0.45);
    }

    function stepLane(dt) {
      const mass = player.mass || 72;
      const k = 9000;
      const c = 1100;
      let ax = (k * (player.targetX - player.x) - c * player.vx) / mass;
      if (ax > 240) ax = 240;
      if (ax < -240) ax = -240;
      player.vx += ax * dt;
      if (player.vx > 18) player.vx = 18;
      if (player.vx < -18) player.vx = -18;
      player.x += player.vx * dt;
    }

    function syncShadow() {
      if (!dipkeShadow) return;
      const h = Math.max(0, player.y);
      const sc = Math.max(0.35, 1 - h * 0.07);
      dipkeShadow.position.set(player.x, 0.03, player.z + (player.isSliding ? 0.3 : 0));
      dipkeShadow.scale.set(sc, sc, sc);
      dipkeShadow.material.opacity = Math.max(0.08, 0.4 - h * 0.035);
    }

    function playerHitbox() {
      if (player.isSliding) return { w: 0.72, d: 0.95 };
      return { w: 0.66, d: 0.55 };
    }

    function handleCode(code) {
      switch (code) {
        case 'ArrowLeft': case 'KeyA': moveLane(-1); break;
        case 'ArrowRight': case 'KeyD': moveLane(1); break;
        case 'ArrowUp': case 'KeyW': case 'Space': jump(); break;
        default: break;
      }
    }

    function pollInjectedKeys() {
      if (!injectedKeys) return;
      injectedKeys.forEach((code) => {
        if (!prevInjected.has(code)) handleCode(code);
      });
      prevInjected = new Set(injectedKeys);
    }

    function coverPhoto(img) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      const ir = img.width / img.height;
      const cr = canvas.width / canvas.height;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (ir > cr) {
        sh = img.height;
        sw = sh * cr;
        sx = (img.width - sw) / 2;
        sy = 0;
      } else {
        sw = img.width;
        sh = sw / cr;
        sx = 0;
        sy = Math.max(0, (img.height - sh) * 0.12);
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      tex.needsUpdate = true;
      photoOverride = true;
      lastRunFrame = -1;
      if (backMat) {
        backMat.map = tex;
        backMat.needsUpdate = true;
      }
      if (frontMat) {
        frontMat.map = tex;
        frontMat.needsUpdate = true;
      }
    }

    function showCopRun(cop) {
      if (!cop.mesh || !camera) return;
      const front = camera.position.z < cop.group.position.z;
      const facing = front ? "front" : "back";
      if (cop.facing !== facing) {
        cop.facing = facing;
        cop.frame = -1;
      }
      cop.mesh.rotation.set(0, front ? Math.PI : 0, 0);
      cop.mesh.scale.x = front ? -1 : 1;
      const sheet = front ? cop.frontSheet : cop.backSheet;
      if (sheet) {
        const n = sheet.count;
        const shift = cop.kind === "raf" ? 3 : 0;
        const idx = ((Math.floor(player.runAnimTime * 1.7) + shift) % n + n) % n;
        if (cop.mat.map !== sheet.tex) {
          cop.mat.map = sheet.tex;
          cop.mat.needsUpdate = true;
          cop.frame = -1;
        }
        if (idx === cop.frame) return;
        cop.frame = idx;
        putFrame(sheet.tex, idx, sheet.cols, sheet.rows);
        return;
      }
      const frames = front ? cop.front : cop.back;
      if (!frames || !frames.length) return;
      if (frames.length === 1) {
        if (cop.mat.map !== frames[0]) {
          showFull(frames[0]);
          cop.mat.map = frames[0];
          cop.mat.needsUpdate = true;
          cop.frame = 0;
        }
        return;
      }
      const n = frames.length;
      const shift = cop.kind === "raf" ? 3 : 0;
      const idx = ((Math.floor(player.runAnimTime * 1.7) + shift) % n + n) % n;
      if (idx === cop.frame) return;
      cop.frame = idx;
      cop.mat.map = frames[idx];
    }

    function showCopBite(cop) {
      if (!cop.mesh || !cop.bite || !camera) return;
      const dx = camera.position.x - cop.group.position.x;
      const dz = camera.position.z - cop.group.position.z;
      cop.mesh.rotation.order = "YXZ";
      cop.mesh.rotation.set(0.25, Math.atan2(dx, dz), 0);
      cop.mesh.scale.x = 1;
      if (cop.mat.map !== cop.bite) {
        cop.mat.map = cop.bite;
        cop.frame = -1;
      }
    }

    function updatePoliceChasers(dt, runSpeed) {
      const fadeStart = 25;
      const fadeSpan = 16;
      let fade = 0;
      if (player.distance > fadeStart) {
        fade = Math.min(1, (player.distance - fadeStart) / fadeSpan);
        fade = fade * fade * (3 - 2 * fade);
      }
      const cameraBehind = camera && camera.position.z > player.z + 0.35;
      policeOfficers.forEach((cop, idx) => {
        const side = idx === 0 ? -1.22 : 1.22;
        const visualGap = cameraBehind ? 0.32 + idx * 0.2 : 0.02;
        const targetZ = player.z + visualGap + fade * 8.2;
        const targetX = player.x + side + side * fade * 2.6;
        if (cop.group) {
          cop.group.visible = fade < 0.98;
          cop.group.position.z += (targetZ - cop.group.position.z) * 6 * dt;
          cop.group.position.x += (targetX - cop.group.position.x) * 5 * dt;
        }
        if (cop.mat) {
          cop.mat.opacity = 1 - fade;
          cop.mat.depthWrite = fade < 0.04;
        }
        if (!cop.mesh || fade >= 0.98) return;
        showCopRun(cop);
      });
    }

    function updateCollectibles(dt) {
      for (let i = collectibles.length - 1; i >= 0; i--) {
        const item = collectibles[i];
        item.rotation.y += 3.5 * dt;

        if (player.powerup === 'MAGNET') {
          const distToPlayer = item.position.distanceTo(dipkeGroup.position);
          if (distToPlayer < 14) {
            item.position.x += (player.x - item.position.x) * 12 * dt;
            item.position.y += (player.y + 1.0 - item.position.y) * 12 * dt;
            item.position.z += (player.z - item.position.z) * 12 * dt;
          }
        }

        const dx = Math.abs(item.position.x - player.x);
        const dy = Math.abs(item.position.y - player.y);
        const dz = Math.abs(item.position.z - player.z);

        if (dx < 1.3 && dy < 2.0 && dz < 1.6) {
          if (item.userData.type === 'SAMOSA') {
            const multi = (player.powerup === 'CHAI_POWER') ? 2 : 1;
            player.coins += (item.userData.value || 1) * multi;
            audio.playPickup();
          } else if (item.userData.type === 'SKY_RING') {
            player.coins += item.userData.value;
            player.distance += 25;
            audio.playRingDing();
          } else if (item.userData.type === 'FLYING_JETPACK') {
            startFlyingMode();
          } else {
            activatePowerup(item.userData.type);
            audio.playPowerup();
          }

          scene.remove(item);
          collectibles.splice(i, 1);
        }
      }
    }

    function activatePowerup(type) {
      if (type === 'FLYING_JETPACK') {
        startFlyingMode();
        return;
      }

      player.powerup = type;
      player.powerupTimer = 8.0;

      const hudPower = document.getElementById('hud-powerup');
      const pName = document.getElementById('powerup-name');
      const pIcon = document.getElementById('powerup-icon');
      hudPower.classList.remove('hidden');

      if (type === 'METRO_SPEED') {
        pName.textContent = 'Metro Speed Sprint';
        pIcon.textContent = '⚡';
        document.getElementById('speed-fx').classList.remove('opacity-0');
      } else if (type === 'MAGNET') {
        pName.textContent = 'Chai Magnet Active';
        pIcon.textContent = '🧲';
      } else {
        pName.textContent = '2x Samosa Multiplier';
        pIcon.textContent = '☕';
      }
    }

    function checkObstacleCollisions(dt) {
      // Complete invulnerability while flying high in the sky!
      if (player.isFlying || player.y > 3.0) return;
      const hb = playerHitbox();

      for (let i = 0; i < obstacles.length; i++) {
        const obs = obstacles[i];
        const ud = obs.userData;
        // Swept along Z so a fast frame cannot tunnel through a thin barricade.
        let prevObsZ = obs.position.z;
        if (ud.isMovingTraffic) prevObsZ += (ud.trafficSpeed || 0) * dt;
        const halfO = ud.length / 2;
        const halfP = hb.d / 2;
        const c0 = player.prevZ - prevObsZ;
        const c1 = player.z - obs.position.z;
        const rad = halfP + halfO;
        const zHit = Math.abs(c0) <= rad || Math.abs(c1) <= rad || (c0 * c1 <= 0);
        if (!zHit) continue;

        const dx = Math.abs(obs.position.x - player.x);
        if (dx >= (ud.width / 2 + hb.w / 2)) continue;

        if (ud.canJumpOver) {
          if (player.y < ud.height) {
            triggerPoliceTackle(ud.type);
            return;
          }
        } else {
          triggerPoliceTackle(ud.type);
          return;
        }
      }
    }

    function triggerPoliceTackle(crashSource) {
      if (currentGameState === STATE.CAUGHT || currentGameState === STATE.GAMEOVER) return;

      currentGameState = STATE.CAUGHT;
      pendingCrashReason = crashSource || 'BUS';
      caughtTimer = 0;
      player.isFlying = false;
      if (jetpackModel) jetpackModel.visible = false;
      document.getElementById('flight-fx').classList.add('opacity-0');

      audio.playCrash();
      audio.playPoliceSiren();
      audio.playGameOver();
      document.getElementById('hud').classList.add('hidden');
    }

    function beginRagdoll() {
      ragdoll.y = Math.max(player.y, 0);
      ragdoll.vy = Math.max(3.1, player.vy * 0.25 + 2.4);
      ragdoll.pitch = dipkeGroup.rotation.x || 0;
      ragdoll.roll = dipkeGroup.rotation.z || 0;
      ragdoll.yaw = 0;
      ragdoll.wp = -3.1;
      ragdoll.wr = player.vx * 0.05;
      ragdoll.wy = (Math.random() - 0.5) * 2.4;
    }

    function stepRagdoll(dt) {
      ragdoll.vy -= 30 * dt;
      ragdoll.y += ragdoll.vy * dt;
      ragdoll.pitch += ragdoll.wp * dt;
      ragdoll.roll += ragdoll.wr * dt;
      ragdoll.yaw += ragdoll.wy * dt;
      ragdoll.wp *= (1 - 0.8 * dt);
      ragdoll.wr *= (1 - 1.4 * dt);
      ragdoll.wy *= (1 - 0.9 * dt);
      if (ragdoll.y <= 0.04) {
        ragdoll.y = 0.04;
        if (ragdoll.vy < -0.8) {
          ragdoll.vy = -ragdoll.vy * 0.34;
          ragdoll.wp *= -0.4;
          ragdoll.wr *= 0.45;
        } else {
          ragdoll.vy = 0;
        }
      }
      if (ragdoll.pitch < -1.28) {
        ragdoll.pitch = -1.28;
        if (ragdoll.wp < 0) ragdoll.wp *= -0.25;
      }
      dipkeGroup.position.set(player.x, ragdoll.y, player.z);
      dipkeGroup.rotation.set(ragdoll.pitch, ragdoll.yaw, ragdoll.roll);
      syncShadow();
    }

    function updateCaughtAnimation(dt) {
      caughtTimer += dt;
      const x = player.x;
      const z = player.z - 1.2;

      if (dipkeGroup) dipkeGroup.visible = false;
      if (dipkeShadow) dipkeShadow.visible = false;
      policeOfficers.forEach((cop) => {
        if (cop.group) cop.group.visible = false;
      });
      obstacles.forEach((obs) => { obs.visible = false; });
      collectibles.forEach((item) => { item.visible = false; });

      if (caughtTrio && caughtFrames.length) {
        caughtTrio.visible = true;
        caughtTrio.position.x = x;
        caughtTrio.position.z = z;
        const n = caughtFrames.length;
        const idx = Math.floor(caughtTimer * 5) % n;
        if (caughtTrioMat.map !== caughtFrames[idx]) caughtTrioMat.map = caughtFrames[idx];
      }

      camera.position.set(x, 1.55, z - 5.6);
      camera.lookAt(x, 1.2, z);

      if (caughtTimer >= CAUGHT_DURATION) {
        lastRunFrame = -1;
        if (caughtTrio) caughtTrio.visible = false;
        if (dipkeGroup) dipkeGroup.visible = true;
        if (dipkeShadow) dipkeShadow.visible = true;
        gameOver(pendingCrashReason);
      }
    }

    function gameOver(crashSource) {
      currentGameState = STATE.GAMEOVER;
      audio.playGameOver();

      const prevBestDist = parseInt(localStorage.getItem('bhaag_best_dist') || '0', 10);
      const isNewRecord = Math.floor(player.distance) > prevBestDist && player.distance > 50;

      player.score = Math.floor(player.distance + player.coins * 10);
      const quip = HINDI_QUIPS[Math.floor(Math.random() * HINDI_QUIPS.length)];
      const hindiQuipEl = document.getElementById('go-hindi-quip');
      if (hindiQuipEl) hindiQuipEl.textContent = quip.text;
      const reasonEl = document.getElementById('go-reason');
      if (reasonEl) reasonEl.textContent = quip.desc;

      const goDistEl = document.getElementById('go-dist');
      if (goDistEl) goDistEl.textContent = Math.floor(player.distance) + ' m';
      const goCoinsEl = document.getElementById('go-coins');
      if (goCoinsEl) goCoinsEl.textContent = player.coins + ' 🥟';
      const goScoreEl = document.getElementById('go-score');
      if (goScoreEl) goScoreEl.textContent = player.score.toString();

      const newRecordBadge = document.getElementById('go-new-record');
      if (newRecordBadge) {
        if (isNewRecord) newRecordBadge.classList.remove('hidden');
        else newRecordBadge.classList.add('hidden');
      }

      saveHighScores();

      const hud = document.getElementById('hud');
      if (hud) hud.classList.add('hidden');
      const goModal = document.getElementById('gameover-modal');
      if (goModal) goModal.classList.remove('hidden');
    }

    function updateHUD() {
      document.getElementById('hud-distance').textContent = Math.floor(player.distance);
      document.getElementById('hud-coins').textContent = player.coins;

      const landmarkIdx = Math.floor((player.distance / 160) % DELHI_LANDMARKS.length);
      document.getElementById('hud-landmark').textContent = DELHI_LANDMARKS[landmarkIdx];
    }

    function saveHighScores() {
      try {
        const bestDist = Math.max(Math.floor(player.distance), parseInt(localStorage.getItem('bhaag_best_dist') || '0', 10));
        const bestCoins = Math.max(player.coins, parseInt(localStorage.getItem('bhaag_best_coins') || '0', 10));

        localStorage.setItem('bhaag_best_dist', bestDist.toString());
        localStorage.setItem('bhaag_best_coins', bestCoins.toString());

        document.getElementById('menu-best-dist').textContent = bestDist + ' m';
        document.getElementById('menu-best-coins').textContent = bestCoins + ' 🥟';
      } catch (e) {}
    }

    function loadHighScores() {
      try {
        const bestDist = localStorage.getItem('bhaag_best_dist') || '0';
        const bestCoins = localStorage.getItem('bhaag_best_coins') || '0';
        document.getElementById('menu-best-dist').textContent = bestDist + ' m';
        document.getElementById('menu-best-coins').textContent = bestCoins + ' 🥟';
      } catch (e) {}
    }

    function onWindowResize() {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    let bootLoaded = 0;
    let bootClosed = false;
    const bootTotal = 3;

    function setBoot(label, pct) {
      const bar = document.getElementById("boot-bar");
      const pctEl = document.getElementById("boot-pct");
      const labelEl = document.getElementById("boot-label");
      const n = Math.max(0, Math.min(100, Math.round(pct)));
      if (bar) bar.style.width = n + "%";
      if (pctEl) pctEl.textContent = n + "%";
      if (labelEl && label) labelEl.innerHTML = '<span class="boot-runner">🏃</span> ' + label;
    }

    function loadTex(url, opts) {
      const countBoot = !opts || opts.boot !== false;
      const loader = new THREE.TextureLoader();
      return new Promise((resolve, reject) => {
        const tick = () => {
          if (!countBoot || bootClosed) return;
          bootLoaded += 1;
          setBoot(null, (bootLoaded / bootTotal) * 100);
        };
        loader.load(url, (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = 8;
          tick();
          resolve(tex);
        }, undefined, (err) => {
          tick();
          reject(err);
        });
      });
    }

    function bindCopSheets() {
      policeOfficers.forEach((cop) => {
        const pack = copSheets[cop.kind];
        if (!pack) return;
        if (pack.front) cop.frontSheet = pack.front;
        if (pack.back) cop.backSheet = pack.back;
        cop.frame = -1;
      });
    }

    function streamSheet(gen, url, cols, rows, count, take) {
      loadTex(url, { boot: false }).then((tex) => {
        if (gen !== generation) {
          tex.dispose();
          return;
        }
        take(prepSheet(tex, cols, rows, count));
      }).catch(() => {});
    }

    let retainers = 0;
    let boot = null;
    let stopper = null;

    export function retainGame(host) {
      retainers += 1;
      if (!boot) {
        boot = mountGame(host).then((stop) => {
          stopper = stop;
          if (retainers <= 0) {
            stopper = null;
            boot = null;
            stop();
          }
          return stop;
        });
      }
      let released = false;
      return () => {
        if (released) return;
        released = true;
        retainers -= 1;
        if (retainers <= 0 && stopper) {
          const stop = stopper;
          stopper = null;
          boot = null;
          retainers = 0;
          stop();
        }
      };
    }

    async function mountGame(host) {
      const my = ++generation;
      disposed = false;
      bootClosed = false;
      bootLoaded = 0;
      dipkeFrontSheet = null;
      dipkeBackSheet = null;
      copSheets.delhi.front = null;
      copSheets.delhi.back = null;
      copSheets.raf.front = null;
      copSheets.raf.back = null;
      hostEl = host;
      let pendingStart = false;
      window.__dipkeReady = false;
      window.__dipkeWantStart = false;
      const startBtn = document.getElementById("btn-start");
      const startLabel = document.getElementById("btn-start-label");
      const hint = document.getElementById("boot-hint");
      const onEarlyStart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        pendingStart = true;
        try { audio.ensureCtx(); } catch (err) {}
        if (startLabel) startLabel.textContent = "STARTING AS SOON AS READY";
        if (hint) hint.textContent = "Got your tap. Don’t keep clicking — the chase starts the second Delhi is loaded.";
        startBtn && startBtn.classList.add("brightness-110");
      };
      if (startBtn) startBtn.addEventListener("click", onEarlyStart);
      setBoot("Waking Dipke", 3);
      if (host && (!renderer || renderer.domElement.parentNode !== host)) {
        renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setClearColor(0xfdba74, 1);
        host.appendChild(renderer.domElement);
      }
      const ids8 = ["00", "01", "02", "03", "04", "05", "06", "07"];
      const postersP = Promise.all([
        loadTex("/characters/bearded/front/00.webp"),
        loadTex("/characters/cops/delhi/front/00.webp"),
        loadTex("/characters/cops/raf/front/00.webp")
      ]);
      streamSheet(my, "/characters/sheets/dipke-front.webp", 4, 3, 12, (sheet) => {
        dipkeFrontSheet = sheet;
        lastRunFrame = -1;
      });
      streamSheet(my, "/characters/sheets/dipke-back.webp", 4, 3, 12, (sheet) => {
        dipkeBackSheet = sheet;
        lastRunFrame = -1;
      });
      streamSheet(my, "/characters/sheets/delhi-front.webp", 4, 2, 8, (sheet) => {
        copSheets.delhi.front = sheet;
        bindCopSheets();
      });
      streamSheet(my, "/characters/sheets/delhi-back.webp", 4, 2, 8, (sheet) => {
        copSheets.delhi.back = sheet;
        bindCopSheets();
      });
      streamSheet(my, "/characters/sheets/raf-front.webp", 4, 2, 8, (sheet) => {
        copSheets.raf.front = sheet;
        bindCopSheets();
      });
      streamSheet(my, "/characters/sheets/raf-back.webp", 4, 2, 8, (sheet) => {
        copSheets.raf.back = sheet;
        bindCopSheets();
      });
      let bFrames;
      let fFrames;
      try {
        const [dipkeF, delhiF, rafF] = await postersP;
        bFrames = [dipkeF];
        fFrames = [dipkeF];
        copTex = {
          delhi: { back: [delhiF], front: [delhiF], bite: null },
          raf: { back: [rafF], front: [rafF], bite: null }
        };
      } catch (e) {
        bFrames = [await loadTex("/characters/dipke-back.png")];
        fFrames = [await loadTex("/characters/dipke-front.png")];
        copTex = null;
      }
      if (my !== generation) {
        bFrames.forEach((t) => t.dispose());
        fFrames.forEach((t) => t.dispose());
        return () => {};
      }
      backFrames.forEach((t) => { try { t.dispose(); } catch (err) {} });
      frontFrames.forEach((t) => { try { t.dispose(); } catch (err) {} });
      backFrames = bFrames;
      frontFrames = fFrames;
      backTex = bFrames[0];
      frontTex = fFrames[0];
      lastRunFrame = -1;
      if (startBtn) startBtn.removeEventListener("click", onEarlyStart);
      setBoot("Opening the road", 96);
      initThree();
      bindCopSheets();
      bootClosed = true;
      setBoot("Delhi is ready", 100);
      if (startLabel) startLabel.textContent = "BHAAG DIPKE! (START)";
      if (hint) hint.textContent = "Delhi is ready. Tap once and run.";
      const bootPanel = document.getElementById("boot-panel");
      if (bootPanel && !pendingStart && !window.__dipkeWantStart) bootPanel.classList.add("hidden");
      window.__dipkeReady = true;
      if (pendingStart || window.__dipkeWantStart) startCutsceneIntro();
      const bootGen = my;
      Promise.all([
        loadTex("/characters/bearded/back/fly.webp"),
        loadTex("/characters/bearded/front/fly.webp")
      ]).then(([flyB, flyF]) => {
        if (bootGen !== generation) return;
        flyBackTex = flyB;
        flyFrontTex = flyF;
      }).catch(() => {});
      Promise.all(ids8.map((id) => loadTex(`/characters/caught/hold/${id}.webp`))).then((frames) => {
        if (bootGen !== generation) return;
        caughtFrames = frames;
        ensureCaughtTrio();
      }).catch(() => {});
      window.__controlsTest = {
        getYaw: () => -player.x,
        getSpeed: () => player.speed,
        setSteer: (v) => {
          if (v > 0.2) moveLane(-1);
          else if (v < -0.2) moveLane(1);
        },
        setKeys: (codes) => {
          injectedKeys = new Set(codes || []);
        }
      };
      renderer.setAnimationLoop(gameLoop);
      return function dispose() {
        if (generation !== my) return;
        generation += 1;
        disposed = true;
        if (hornTimer) clearInterval(hornTimer);
        hornTimer = null;
        if (renderer) renderer.setAnimationLoop(null);
        while (cleanups.length) {
          const fn = cleanups.pop();
          try { fn(); } catch (e) {}
        }
        if (window.__controlsTest) delete window.__controlsTest;
        if (renderer) {
          renderer.dispose();
          if (renderer.domElement && renderer.domElement.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
          }
        }
      };
    }
