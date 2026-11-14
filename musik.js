/* Emerald Caverns – Musik-Engine
 * Erzeugt pro Level einen eigenen Track per Web Audio (keine Audiodateien nötig).
 * Liedaufbau: Intro → Strophe → Refrain → Break → Strophe → Refrain (Variation) → …
 * Vier Schlagzeug-/Bass-Stile, drei Arpeggio-Muster, Fills und Übergänge.
 * Nutzung:  const m = EmeraldMusic.create(audioContext, zielNode);
 *           m.start(levelIndex, startZeit);  m.tick();  m.stop();
 */
(() => {
  'use strict';
  const hz = n => 440 * Math.pow(2, (n - 69) / 12);

  // Themen: Grundtöne (je Takt), Dur/Moll je Takt, Melodie (16 Achtel = 2 Takte)
  const THEMES = [
    {name:'Neonstollen',        bpm:132, roots:[38,34,36,33], modes:'mMMm', lead:[74,null,77,79,null,81,79,null,72,null,76,79,null,76,74,null]},
    {name:'Grünes Licht',       bpm:128, roots:[40,36,38,35], modes:'mMmM', lead:[76,79,null,83,81,null,79,76,74,null,76,79,81,null,79,null]},
    {name:'Kristallfunk',       bpm:118, roots:[33,36,38,40], modes:'mMMm', lead:[69,null,72,76,74,72,null,69,76,null,79,81,null,79,76,null]},
    {name:'Basalt Beat',        bpm:136, roots:[35,31,38,33], modes:'mMmM', lead:[71,74,78,null,81,78,74,null,69,71,null,74,78,null,76,null]},
    {name:'Moos im Morgenlicht',bpm:126, roots:[36,33,40,38], modes:'MmMm', lead:[72,null,76,79,76,null,72,69,71,null,74,76,79,null,76,null]},
    {name:'Tiefenpuls',         bpm:140, roots:[31,38,35,33], modes:'mMmM', lead:[67,70,74,null,77,74,null,70,69,72,76,null,79,76,72,null]},
    {name:'Emerald Rush',       bpm:138, roots:[41,38,36,40], modes:'mMMm', lead:[77,null,81,84,81,79,null,77,72,76,null,79,81,null,84,null]},
    {name:'Schwarze Ader',      bpm:124, roots:[34,31,33,29], modes:'mMmM', lead:[70,73,null,77,75,null,73,70,68,null,70,73,77,null,75,null]},
    {name:'Echo Chamber',       bpm:134, roots:[39,35,37,32], modes:'mMMm', lead:[75,null,78,82,null,80,78,75,73,75,null,78,82,85,null,82]},
    {name:'Herzschlag',         bpm:142, roots:[38,41,34,36], modes:'mMmM', lead:[74,77,81,null,84,81,79,null,77,74,null,72,74,77,81,null]}
  ];

  // Schlagzeug/Bass-Stile (16 Schritte = 1 Takt)
  const STYLES = [
    { // 0 House: gerade Bassdrum, Offbeat-Bass
      kick:[0,4,8,12], snare:[], clap:[4,12], hat:'offbeat', bass:[2,6,10,14], bassOct:[6,14], stab:[3,7,11,15]
    },
    { // 1 Breakbeat: synkopiert
      kick:[0,7,10], snare:[4,12], clap:[], ghost:[9,15], hat:'eighth', bass:[0,3,6,10,13], bassFifth:[6,13], stab:[2,10]
    },
    { // 2 Drive: treibende Sechzehntel im Bass
      kick:[0,4,8,12,14], snare:[4,12], clap:[], hat:'sixteenth', bass:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], bassOct:[2,6,10,14], stab:[0,6,12]
    },
    { // 3 Electro: Kick-Muster mit Lücken, Oktavsprünge
      kick:[0,6,8,11], snare:[], clap:[4,12], hat:'sixteenthAccent', bass:[0,2,3,8,10,11], bassOct:[3,11], stab:[4,14]
    },
    { // 4 Synthwave: halbes Tempo-Gefühl, treibende Achtel im Bass, große Flächen
      kick:[0,8], snare:[8], clap:[], hat:'eighth', bass:[0,2,4,6,8,10,12,14], bassOct:[2,6,10,14], stab:[], padAll:true
    },
    { // 5 Chiptune: schnell und hüpfend
      kick:[0,8,10], snare:[4,12], clap:[], hat:'sixteenth', bass:[0,2,4,6,8,10,12,14], bassOct:[2,6,10,14], stab:[0,8], arp16:true
    }
  ];
  const ARPS = [[0,1,2,3,2,1,0,1], [0,2,1,3,2,4,3,1], [3,2,1,0,1,2,3,4], [0,2,4,2,1,3,4,3], [4,3,2,1,0,1,2,3]];

  // Akkordfolgen (Abstand zum Grundton, Dur/Moll je Akkord) für erzeugte Tracks
  const PROGS = [
    [[0,8,3,10],'mMMM'], [[0,5,8,7],'mmMM'], [[0,10,8,7],'mMMM'], [[0,3,10,5],'mMMm'], [[0,8,5,7],'mMmm'],
    [[0,5,3,8],'mmMM'], [[0,7,9,5],'MMmM'], [[0,5,9,7],'MMmM'], [[0,9,5,7],'MmMM'], [[0,4,9,5],'MmmM'],
    [[0,10,5,8],'mMmM'], [[0,8,10,3],'mMMM']
  ];
  const LEADS = ['saw', 'square', 'bell', 'pulse'];
  const LEVEL_NAMES = ['Funkenflug','Tiefenrausch','Stollenfunk','Erzpuls','Kristallwind','Glutlicht','Nebelgang','Schachtbeat','Donnerecho','Grünglanz'];

  function seeded(seed) {
    return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  // Erzeugt für jedes Level ab 11 einen eigenen, immer gleichen Track
  function generateTheme(levelIndex) {
    const r = seeded(levelIndex * 7919 + 17), pick = a => a[Math.floor(r() * a.length)];
    const [offs, modes] = pick(PROGS), key = 29 + Math.floor(r() * 12);
    const roots = offs.map(o => { let n = key + o; while (n > 41) n -= 12; return n; });
    const minor = modes[0] === 'm', scale = minor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
    const style = Math.floor(r() * 6);
    const tone = deg => { const o = Math.floor(deg / 7), d = ((deg % 7) + 7) % 7; return key + 36 + o * 12 + scale[d]; };
    // Melodie: Motiv aus 8 Achteln, Wiederholung mit verändertem Schluss
    const half = []; let deg = pick([0, 2, 4, 7]);
    for (let k = 0; k < 8; k++) {
      if (k > 0 && k % 2 === 1 && r() < 0.28) { half.push(null); continue; }
      if (k > 0) { const step = pick([-2, -1, -1, 1, 1, 2, 3, -3]); deg = Math.max(-2, Math.min(9, deg + step)); }
      if (k % 4 === 0 && r() < 0.6) deg = pick([0, 2, 4, 7]);
      half.push(tone(deg));
    }
    const answer = half.slice(0, 5).concat([tone(pick([4, 2, 5])), r() < 0.5 ? null : tone(pick([1, 3])), tone(pick([0, 7]))]);
    const bpm = style === 4 ? 104 + Math.floor(r() * 12) : style === 5 ? 140 + Math.floor(r() * 10) : 120 + Math.floor(r() * 24);
    return {
      name: LEVEL_NAMES[levelIndex % 10] + ' ' + (Math.floor(levelIndex / 10) + 1),
      bpm, roots, modes, lead: half.concat(answer), style, arp: Math.floor(r() * ARPS.length), leadType: pick(LEADS)
    };
  }

  // Liedaufbau (Takte); nach dem Intro läuft die Schleife ab 'verse'
  const FORM = [['intro',4],['verse',8],['chorus',8],['break',4],['verse',8],['chorus2',8],['bridge',4],['chorus2',8]];
  const INTRO_BARS = 4, LOOP_BARS = FORM.slice(1).reduce((a, f) => a + f[1], 0);

  function sectionAt(bar) {
    let b = bar < INTRO_BARS ? bar : INTRO_BARS + (bar - INTRO_BARS) % LOOP_BARS, acc = 0;
    for (const [name, len] of FORM) { if (b < acc + len) return { name, barIn: b - acc, len }; acc += len; }
    return { name: 'verse', barIn: 0, len: 8 };
  }

  function create(ctx, destination) {
    let bus = null, pump = null, delay = null, noise = null, theme = null, style = null, arp = null;
    let step = 0, next = 0, stepTime = 0.11, transpose = 0, active = false, leadType = 'saw';

    function makeNoise() {
      const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return b;
    }

    function buildBus() {
      bus = ctx.createGain(); bus.gain.value = 0.72;
      pump = ctx.createGain(); pump.gain.value = 1; pump.connect(bus);
      delay = ctx.createDelay(1.2); const fb = ctx.createGain(), wet = ctx.createGain(), tone = ctx.createBiquadFilter();
      delay.delayTime.value = stepTime * 3; fb.gain.value = 0.32; wet.gain.value = 0.22; tone.type = 'lowpass'; tone.frequency.value = 2600;
      delay.connect(tone).connect(fb).connect(delay); tone.connect(wet).connect(bus);
      bus.connect(destination);
      if (!noise) noise = makeNoise();
    }

    // ---------- Klangerzeuger ----------
    function env(g, t, a, peak, d) {
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    }
    function osc(type, freq, t, dur, out, detune = 0) {
      const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t); o.detune.value = detune;
      o.connect(out); o.start(t); o.stop(t + dur + 0.05); return o;
    }
    function noiseSrc(t, dur, filterType, freq, q, out) {
      const s = ctx.createBufferSource(), f = ctx.createBiquadFilter();
      s.buffer = noise; f.type = filterType; f.frequency.value = freq; f.Q.value = q || 0.7;
      s.connect(f).connect(out); s.start(t, Math.random() * 0.5, dur + 0.05); return f;
    }
    function kick(t, v = 1) {
      const g = ctx.createGain(), o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      env(g, t, 0.003, 0.16 * v, 0.24); o.connect(g).connect(bus); o.start(t); o.stop(t + 0.3);
      const c = ctx.createGain(); env(c, t, 0.001, 0.03 * v, 0.02); noiseSrc(t, 0.03, 'highpass', 3500, 0.7, c); c.connect(bus);
      // Pumpen: Flächen und Akkorde kurz absenken
      pump.gain.cancelScheduledValues(t); pump.gain.setValueAtTime(0.35, t); pump.gain.linearRampToValueAtTime(1, t + stepTime * 3);
    }
    function snare(t, v = 1) {
      const g = ctx.createGain(); env(g, t, 0.001, 0.05 * v, 0.16); noiseSrc(t, 0.2, 'bandpass', 1900, 0.8, g); g.connect(bus);
      const b = ctx.createGain(); env(b, t, 0.001, 0.035 * v, 0.08); osc('triangle', 190, t, 0.1, b); b.connect(bus);
    }
    function clap(t, v = 1) {
      for (let i = 0; i < 3; i++) { const g = ctx.createGain(), tt = t + i * 0.011; env(g, tt, 0.001, 0.035 * v, i === 2 ? 0.14 : 0.02); noiseSrc(tt, 0.16, 'bandpass', 1400, 1.2, g); g.connect(bus); g.connect(delay); }
    }
    function hat(t, open, v = 1) {
      const g = ctx.createGain(); env(g, t, 0.001, (open ? 0.018 : 0.012) * v, open ? 0.2 : 0.035); noiseSrc(t, open ? 0.25 : 0.05, 'highpass', open ? 6500 : 8000, 0.7, g); g.connect(bus);
    }
    function crash(t) {
      const g = ctx.createGain(); env(g, t, 0.002, 0.03, 1.4); noiseSrc(t, 1.5, 'highpass', 4200, 0.5, g); g.connect(bus); g.connect(delay);
    }
    function riser(t, dur) {
      const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = noise; s.loop = true; f.type = 'bandpass'; f.Q.value = 2; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(7000, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.03, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + 0.02);
      s.connect(f).connect(g).connect(bus); s.start(t); s.stop(t + dur + 0.05);
    }
    function bass(note, t, dur, v = 1, bright = 1) {
      const g = ctx.createGain(), f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 6;
      f.frequency.setValueAtTime(300 + 1500 * bright, t); f.frequency.exponentialRampToValueAtTime(140, t + dur);
      env(g, t, 0.004, 0.05 * v, dur); osc('sawtooth', hz(note), t, dur, f); osc('square', hz(note), t, dur, f, 7);
      f.connect(g).connect(bus);
      const s = ctx.createGain(); env(s, t, 0.004, 0.06 * v, dur * 1.1); osc('sine', hz(note - 12), t, dur * 1.1, s); s.connect(bus);
    }
    function pluck(note, t, v = 1) {
      const g = ctx.createGain(), f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 4;
      f.frequency.setValueAtTime(5200, t); f.frequency.exponentialRampToValueAtTime(700, t + 0.16);
      env(g, t, 0.002, 0.016 * v, 0.2); osc('square', hz(note), t, 0.22, f); osc('sawtooth', hz(note), t, 0.22, f, -9);
      f.connect(g); g.connect(pump); g.connect(delay);
    }
    function lead(note, t, dur, v = 1) {
      const g = ctx.createGain(), f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 1.5;
      if (leadType === 'bell') {             // Glocke: klar, kurz ausklingend
        f.frequency.value = 6000; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.022 * v, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.35, dur * 1.6));
        osc('sine', hz(note), t, dur * 1.6, f); osc('sine', hz(note) * 3.01, t, dur * 0.6, f); osc('triangle', hz(note + 12), t, dur, f);
      } else if (leadType === 'square') {    // Rechteck: klassischer Videospiel-Klang
        f.frequency.value = 3200; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.014 * v, t + 0.006); g.gain.setValueAtTime(0.011 * v, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc('square', hz(note), t, dur, f); osc('square', hz(note - 12), t, dur, f, 3);
      } else if (leadType === 'pulse') {     // Puls: zwei leicht verstimmte Rechtecke, kurz und knackig
        f.frequency.setValueAtTime(4200, t); f.frequency.exponentialRampToValueAtTime(1200, t + dur);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.016 * v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.9);
        osc('square', hz(note), t, dur, f, -6); osc('square', hz(note), t, dur, f, 6);
      } else {                               // Säge mit Vibrato (bisheriger Klang)
        f.frequency.value = 3600;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.018 * v, t + 0.01); g.gain.setValueAtTime(0.014 * v, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        const vib = ctx.createOscillator(), vd = ctx.createGain(); vib.frequency.value = 5.5; vd.gain.value = 9; vib.connect(vd);
        for (const [type, det] of [['sawtooth', -11], ['sawtooth', 11], ['square', 0]]) { const o = osc(type, hz(note), t, dur, f, det); vd.connect(o.detune); }
        vib.start(t); vib.stop(t + dur + 0.05);
      }
      f.connect(g); g.connect(bus); g.connect(delay);
    }
    function stab(notes, t, v = 1) {
      const g = ctx.createGain(), f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(4200, t); f.frequency.exponentialRampToValueAtTime(900, t + 0.18);
      env(g, t, 0.003, 0.012 * v, 0.2);
      notes.forEach(n => { osc('sawtooth', hz(n), t, 0.22, f, -12); osc('sawtooth', hz(n), t, 0.22, f, 12); });
      f.connect(g); g.connect(pump);
    }
    function pad(notes, t, dur, v = 1) {
      const g = ctx.createGain(), f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1800;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.009 * v, t + dur * 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      notes.forEach(n => { osc('triangle', hz(n), t, dur, f, -6); osc('sawtooth', hz(n), t, dur, f, 6); });
      f.connect(g); g.connect(pump);
    }

    // ---------- Ein Schritt (Sechzehntel) ----------
    function playStep(t) {
      const bar = Math.floor(step / 16), s = step % 16, sec = sectionAt(bar), name = sec.name;
      const ci = bar % 4, root = theme.roots[ci] + transpose, minor = theme.modes[ci] === 'm';
      const shape = minor ? [0, 3, 7, 10, 12] : [0, 4, 7, 11, 12], chordNotes = shape.slice(0, 4).map(i => root + 24 + i);
      const lastBar = sec.barIn === sec.len - 1, isIntro = name === 'intro', isBreak = name === 'break' || name === 'bridge';
      const isChorus = name.startsWith('chorus'), variation = name === 'chorus2';

      // Abschnittsanfang: Crash
      if (s === 0 && sec.barIn === 0 && !isIntro && !isBreak) crash(t);

      // ---- Schlagzeug ----
      const fill = lastBar && !isIntro && s >= 12;
      if (!isBreak) {
        if (style.kick.includes(s)) kick(t, s === 0 ? 1 : 0.9);
        if (!isIntro || sec.barIn >= 2) {
          if (style.snare.includes(s)) snare(t);
          if (style.clap.includes(s) && (!isIntro || sec.barIn >= 3)) clap(t);
          if (style.ghost && style.ghost.includes(s)) snare(t, 0.35);
          if (style.hat === 'offbeat') { if (s % 4 === 2) hat(t, true); else if (isChorus && s % 2 === 1) hat(t, false, 0.6); }
          else if (style.hat === 'eighth') { if (s % 2 === 0) hat(t, s % 4 === 2, s % 4 === 0 ? 1 : 0.7); }
          else if (style.hat === 'sixteenth') hat(t, s % 8 === 6, s % 4 === 2 ? 1 : 0.55);
          else hat(t, s === 14, s % 4 === 0 ? 1.1 : (s % 2 ? 0.45 : 0.75));
        }
      } else {
        // Break: Hi-Hats leise, am Ende Snare-Wirbel und Anstieg
        if (s % 4 === 2) hat(t, false, 0.5);
        if (lastBar && s === 0) riser(t, stepTime * 16);
        if (lastBar && s >= 8) snare(t, 0.3 + (s - 8) * 0.09);
      }
      if (fill) snare(t, 0.5 + (s - 12) * 0.15);

      // ---- Bass ----
      if (!(isIntro && sec.barIn < 2)) {
        const bright = isChorus ? 1 : isBreak ? 0.15 : 0.55;
        if (!isBreak && style.bass.includes(s)) {
          let n = root;
          if (style.bassOct && style.bassOct.includes(s)) n += 12;
          if (style.bassFifth && style.bassFifth.includes(s)) n += 7;
          const dur = style.hat === 'sixteenth' ? stepTime * 0.8 : stepTime * 1.6;
          bass(n, t, dur, s === 0 ? 1.1 : 0.9, bright);
        }
        if (isBreak && s === 0) bass(root, t, stepTime * 14, 0.8, 0.1);
      }

      // ---- Flächen / Akkorde ----
      if (s === 0 && (isBreak || name === 'verse' || (isIntro && sec.barIn >= 2) || (style.padAll && isChorus))) pad(chordNotes, t, stepTime * 16, isBreak ? 1.3 : 0.8);
      if (isChorus && style.stab.includes(s)) stab(chordNotes.map(n => n + 12), t, 0.9);

      // ---- Arpeggio ----
      const arpOn = name === 'verse' || isChorus || name === 'bridge';
      if (arpOn && (isChorus || style.arp16 || s % 2 === 0)) {
        const idx = arp[((isChorus || style.arp16) ? s : s / 2) % arp.length], n = root + 36 + shape[idx % shape.length];
        pluck(n + (variation && bar % 2 ? 12 : 0), t, isChorus ? 0.8 : 1);
      }

      // ---- Melodie ----
      if ((isChorus || isBreak) && s % 2 === 0) {
        const li = ((bar % 2) * 8 + s / 2) % theme.lead.length, note = theme.lead[li];
        if (note != null) {
          let n = note + transpose;
          if (variation && sec.barIn >= sec.len / 2) n += 12;              // zweite Hälfte eine Oktave höher
          if (isBreak) lead(n, t, stepTime * 3, 0.55);
          else {
            lead(n, t, stepTime * 1.7, 1);
            if (variation && s % 4 === 0) lead(n - (minor ? 9 : 8), t, stepTime * 1.7, 0.45); // Zweitstimme
          }
        }
      }
      // Strophe: kurze Antwort-Phrase am Ende jedes zweiten Takts
      if (name === 'verse' && bar % 2 === 1 && s >= 12 && s % 2 === 0) {
        const note = theme.lead[(8 + s / 2) % theme.lead.length];
        if (note != null) lead(note + transpose - 12, t, stepTime * 1.4, 0.6);
      }
    }

    return {
      get active() { return active; },
      THEMES,
      start(levelIndex, when) {
        if (levelIndex < THEMES.length) {
          const i = Math.max(0, levelIndex);
          theme = THEMES[i]; style = STYLES[i % 4]; arp = ARPS[i % 3]; leadType = 'saw';
        } else {
          theme = generateTheme(levelIndex); style = STYLES[theme.style]; arp = ARPS[theme.arp]; leadType = theme.leadType;
        }
        transpose = 0;
        stepTime = 60 / theme.bpm / 4;
        if (bus) this.stop();
        buildBus();
        step = 0; next = (when ?? ctx.currentTime) + 0.05; active = true;
        this.tick();
      },
      tick(until) {
        if (!active) return;
        const end = until ?? ctx.currentTime + 0.25;
        while (next < end) { playStep(next); next += stepTime; step++; }
      },
      stop() {
        active = false;
        if (bus) {
          const b = bus, t = ctx.currentTime;
          try { b.gain.cancelScheduledValues(t); b.gain.setValueAtTime(b.gain.value, t); b.gain.linearRampToValueAtTime(0, t + 0.08); } catch {}
          setTimeout(() => { try { b.disconnect(); } catch {} }, 600);
          bus = null;
        }
      }
    };
  }

  window.EmeraldMusic = { create, THEMES, generateTheme };
})();
