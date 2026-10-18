import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { retainGame } from "@/game/runner";

export const Route = createFileRoute("/")({ component: Home });

function queueStart() {
  const ready = (window as Window & { __dipkeReady?: boolean }).__dipkeReady;
  if (ready) return;
  (window as Window & { __dipkeWantStart?: boolean }).__dipkeWantStart = true;
  const label = document.getElementById("btn-start-label");
  const hint = document.getElementById("boot-hint");
  if (label) label.textContent = "STARTING AS SOON AS READY";
  if (hint) hint.textContent = "Got your tap. Don’t keep clicking — the chase starts the second Delhi is loaded.";
}

function Home() {
  useEffect(() => {
    const host = document.getElementById("game-canvas-container");
    if (!host) return;
    return retainGame(host);
  }, []);

  return (
    <main className="game-root relative h-[100dvh] w-full overflow-hidden text-white">
<div id="game-canvas-container" className="absolute inset-0"></div>

  
  <div id="speed-fx" className="hud-layer speed-lines opacity-0 transition-opacity duration-300"></div>
  <div id="flight-fx" className="hud-layer sky-flight-fx opacity-0 transition-opacity duration-500"></div>

  
  <div id="flying-banner" className="hud-layer flex flex-col items-center justify-start pt-20 hidden">
    <div className="glass-card px-6 py-2.5 rounded-2xl text-center border-2 border-cyan-400 bg-sky-950/80 shadow-2xl animate-pulse">
      <div className="text-xs font-bungee tracking-widest text-cyan-300 flex items-center justify-center gap-2">
        <span>🚀</span> SHAKTIMAAN CHAI JETPACK ACTIVATED! <span>✨</span>
      </div>
      <div className="text-xl sm:text-2xl font-hindi-style text-yellow-300 font-extrabold mt-0.5">
        उड़ता Dipke! आसमान में समोसे लूटो!
      </div>
    </div>
  </div>

  
  {/* 3-2-1 Countdown Animation Overlay */}
  <div id="countdown-overlay" className="hud-layer flex flex-col items-center justify-center pointer-events-none hidden z-50">
    <div className="flex flex-col items-center justify-center select-none text-center px-4">
      <div
        id="countdown-number"
        className="text-8xl sm:text-9xl font-bungee font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-orange-400 to-red-500 drop-shadow-[0_14px_35px_rgba(0,0,0,0.95)]"
      >
        3
      </div>
      <div
        id="countdown-subtext"
        className="text-2xl sm:text-3xl font-hindi-style font-extrabold text-amber-200 tracking-wider mt-2 drop-shadow-md"
      >
        तैयार हो जाओ!
      </div>
    </div>
  </div>


  <div id="hud" className="hud-layer flex flex-col justify-between p-3 sm:p-5 hidden">
    <div className="flex items-start justify-between w-full max-w-5xl mx-auto">
      <div className="flex flex-col gap-1.5">
        <div className="glass-card px-3.5 py-1.5 rounded-2xl flex items-center gap-2 shadow-lg border-yellow-500/40">
          <span className="text-2xl drop-shadow">🥟</span>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-amber-300 font-bold">Samosas</div>
            <div id="hud-coins" className="text-xl sm:text-2xl font-bungee text-yellow-300 leading-tight">0</div>
          </div>
        </div>

        <div className="glass-card px-3.5 py-1.5 rounded-2xl flex items-center gap-2 shadow-lg border-orange-500/40">
          <span className="text-2xl drop-shadow">🏃‍♂️</span>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-orange-200 font-bold">Distance</div>
            <div className="flex items-baseline gap-1">
              <span id="hud-distance" className="text-xl sm:text-2xl font-bungee text-white leading-tight">0</span>
              <span className="text-xs text-orange-300 font-bold">m</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <div className="glass-card px-4 py-1.5 rounded-2xl text-right border-amber-500/30">
          <div className="text-[10px] uppercase tracking-wider text-yellow-400 font-bold">Delhi Location</div>
          <div id="hud-landmark" className="text-xs sm:text-sm font-hindi-style text-amber-100 font-bold">Connaught Place Radial</div>
        </div>

        <div className="glass-card px-3 py-1 rounded-xl flex items-center gap-2 border-red-500/40">
          <span className="text-sm">👮‍♂️</span>
          <div className="text-[11px] font-bold text-red-300">
            Police Gap: <span id="police-dist" className="text-yellow-300 font-mono">14m</span>
          </div>
        </div>

        <div id="hud-powerup" className="glass-card px-3 py-1.5 rounded-xl hidden flex items-center gap-2 border-emerald-400/50 bg-emerald-950/80">
          <span id="powerup-icon" className="text-xl animate-bounce">⚡</span>
          <div>
            <div id="powerup-name" className="text-[10px] font-bold text-emerald-300 uppercase">Metro Boost</div>
            <div className="w-24 sm:w-32 bg-black/50 h-2 rounded-full overflow-hidden border border-emerald-400/30">
              <div id="powerup-bar" className="bg-gradient-to-r from-emerald-400 to-yellow-300 h-full w-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  
  {/* =========================================================================
      MAIN MENU: ARCADE FRAMED LAYOUT (UNOBSTRUCTED 3D HERO VIEW)
      ========================================================================= */}
  <div id="menu-modal" className="hud-layer flex flex-col justify-between p-3.5 sm:p-6 select-none">
    {/* Top Header Deck */}
    <div className="w-full max-w-5xl mx-auto flex items-start sm:items-center justify-between interactive gap-2 pt-1">
      {/* Left: Best Samosas Pill */}
      <div className="glass-card gold-glow-border px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl flex items-center gap-2 shadow-xl">
        <span className="text-2xl sm:text-3xl filter drop-shadow">🥟</span>
        <div>
          <div className="text-[9px] sm:text-[10px] uppercase font-bold text-yellow-300/80 tracking-wider">Top Samosas</div>
          <div id="menu-best-coins" className="text-base sm:text-2xl font-bungee text-yellow-300 leading-tight">0 🥟</div>
        </div>
      </div>

      {/* Center: 3D Embossed Title Logo */}
      <div className="text-center px-1">
        <div className="inline-block bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 text-black font-bungee text-[9px] sm:text-[11px] font-black px-3 py-0.5 rounded-full uppercase tracking-widest shadow-md mb-0.5">
          DELHI STREET RUNNER
        </div>
        <h1 className="text-2xl sm:text-5xl font-hindi-style text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 font-black tracking-wide drop-shadow-[0_4px_14px_rgba(0,0,0,0.95)]">
          भाग Dipke भाग!
        </h1>
      </div>

      {/* Right: High Score Trophy Pill */}
      <div className="glass-card gold-glow-border px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl flex items-center gap-2 shadow-xl text-right">
        <div>
          <div className="text-[9px] sm:text-[10px] uppercase font-bold text-amber-300/80 tracking-wider">Top Distance</div>
          <div id="menu-best-dist" className="text-base sm:text-2xl font-bungee text-amber-400 leading-tight">0 m</div>
        </div>
        <span className="text-2xl sm:text-3xl filter drop-shadow">🏆</span>
      </div>
    </div>

    {/* Center area is deliberately clear so 3D Dipke & Delhi Metro are showcased */}
    <div className="flex-1 pointer-events-none"></div>

    {/* Bottom Control Deck */}
    <div className="w-full max-w-md mx-auto flex flex-col items-center gap-2.5 interactive pb-3 sm:pb-6">
      {/* Boot Loading Panel (shows while textures load) */}
      <div id="boot-panel" className="w-full glass-card p-2.5 rounded-2xl border-amber-500/30 text-left">
        <div className="mb-1 flex items-center justify-between text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-200">
          <span id="boot-label" className="flex items-center gap-1.5">
            <span className="boot-runner">🏃</span> Loading Delhi
          </span>
          <span id="boot-pct" className="font-mono text-yellow-300">0%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full border border-amber-400/30 bg-black/60">
          <div id="boot-bar" className="boot-bar h-full w-0 rounded-full"></div>
        </div>
        <p id="boot-hint" className="mt-1 text-center text-[10px] font-semibold text-amber-100/70">
          Dipke is warming up. Tap start — the chase begins as soon as Delhi is loaded.
        </p>
      </div>

      {/* Primary 3D Arcade Start Button */}
      <button
        type="button"
        id="btn-start"
        onClick={queueStart}
        className="arcade-btn w-full py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 hover:brightness-110 text-black font-bungee text-xl sm:text-2xl tracking-wider uppercase font-black flex items-center justify-center gap-3 border-2 border-yellow-200 cursor-pointer shadow-2xl"
      >
        <span id="btn-start-label">BHAAG DIPKE! [START]</span>
        <span id="btn-start-icon" className="text-2xl sm:text-3xl animate-bounce">🔥</span>
      </button>

      {/* Secondary Quick Action Bar: Wear Photo & Audio Toggle */}
      <div className="flex items-center justify-center gap-2.5 w-full">
        <label className="cursor-pointer flex-1 flex items-center justify-center gap-2 rounded-xl border border-amber-400/40 bg-black/60 hover:bg-black/80 px-3 py-2.5 text-xs font-bold text-amber-200 transition shadow-md active:scale-95">
          <span>📸</span> Wear Your Photo as Dipke
          <input id="photo-input" type="file" accept="image/*" className="sr-only" />
        </label>
        <button
          type="button"
          id="btn-audio-toggle"
          className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-amber-400/40 bg-black/60 hover:bg-black/80 text-xs font-bold text-amber-200 transition shadow-md active:scale-95 cursor-pointer"
        >
          <span id="audio-toggle-icon">🔊</span> Sound ON
        </button>
      </div>
    </div>
  </div>

  {/* =========================================================================
      GAME OVER: DELHI POLICE DIGITAL E-CHALLAN FIR SLIP
      ========================================================================= */}
  <div id="gameover-modal" className="hud-layer flex items-center justify-center p-4 hidden">
    <div className="glass-card challan-neon-card interactive max-w-md w-full rounded-3xl p-6 sm:p-7 text-center relative overflow-hidden">
      {/* Flashing Police Siren Bar */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="inline-flex items-center gap-1.5 bg-red-600/90 text-white font-bungee px-3 py-1 rounded-full text-[10px] sm:text-[11px] uppercase tracking-wider shadow">
          <span>🚨</span> DELHI TRAFFIC POLICE
        </div>
        <div className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-blue-600/80 text-blue-100 font-bold border border-blue-400/40">
          E-CHALLAN #DL-CP-420
        </div>
      </div>

      {/* Quip Title */}
      <h2 id="go-hindi-quip" className="text-2xl sm:text-3xl font-hindi-style text-yellow-300 font-extrabold mb-1 drop-shadow">
        अरे Dipke भाई! चालान कट गया!
      </h2>
      <p id="go-reason" className="text-xs text-red-200 mb-4 font-semibold px-2">
        Reason: Delhi Police caught up with you near Connaught Place!
      </p>

      {/* New High Score Toast Badge */}
      <div id="go-new-record" className="hidden mb-3 py-1.5 px-3 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 text-black font-bungee text-xs rounded-full uppercase tracking-wider font-black shadow-lg animate-pulse">
        🏆 NEW RECORD DISTANCE SET! 🏆
      </div>

      {/* Digital LED Arcade Meters */}
      <div className="grid grid-cols-2 gap-2.5 mb-3 text-left">
        <div className="digital-meter rounded-2xl p-3 border border-amber-500/30">
          <div className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Distance Run</div>
          <div id="go-dist" className="font-bungee text-xl sm:text-2xl text-white mt-0.5">0 m</div>
        </div>
        <div className="digital-meter rounded-2xl p-3 border border-yellow-500/30">
          <div className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Samosas Eaten</div>
          <div id="go-coins" className="font-bungee text-xl sm:text-2xl text-yellow-300 mt-0.5">0 🥟</div>
        </div>
      </div>

      <div className="digital-meter rounded-2xl p-3 mb-5 border border-emerald-500/40 flex items-center justify-between">
        <div className="text-left">
          <div className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Fine / Total Score</div>
          <div id="go-score" className="font-bungee text-2xl sm:text-3xl text-emerald-400 leading-tight">0</div>
        </div>
        <div className="text-right">
          <div className="text-[9px] uppercase text-gray-400 font-bold">Challan Status</div>
          <div className="text-xs font-bold text-red-400 uppercase tracking-wide">Pending at Thana</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          id="btn-restart"
          className="arcade-btn-red w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:brightness-110 text-white font-bungee text-lg font-black tracking-wider shadow-xl cursor-pointer"
        >
          BAIL OUT / RETRY CHASE 🔄
        </button>

        <button
          type="button"
          id="btn-share-score"
          className="w-full py-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-xs font-bold text-gray-200 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <span id="share-btn-text">📋 Copy &amp; Share Challan</span>
        </button>
      </div>
    </div>
  </div>
    </main>
  );
}
