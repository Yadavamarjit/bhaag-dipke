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

  <div id="cutscene-banner" className="hud-layer flex flex-col items-center justify-start pt-12 sm:pt-16 hidden">
    <div className="glass-card police-siren-border px-6 py-3 rounded-2xl text-center max-w-md mx-4 animate-bounce">
      <div className="flex items-center justify-center gap-2 text-red-400 font-bungee text-sm tracking-widest">
        <span>🚨</span> DELHI POLICE IN CHASE! <span>🚨</span>
      </div>
      <div className="text-2xl sm:text-3xl font-hindi-style text-yellow-300 font-extrabold mt-1">
        रुको Dipke! आज नहीं बचेगा!
      </div>
      <div className="text-xs text-amber-200 mt-1 font-semibold tracking-wide">
        Delhi skyline. Get ready to run!
      </div>
    </div>
    <button
      type="button"
      id="btn-skip-intro"
      className="interactive mt-3 px-4 py-1.5 rounded-full bg-black/60 border border-amber-400/50 text-amber-300 font-bungee text-xs tracking-wider hover:bg-amber-500 hover:text-black transition shadow-lg active:scale-95"
    >
      SKIP INTRO ⏩
    </button>
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

  
  <div id="menu-modal" className="hud-layer flex items-center justify-center p-4">
    <div className="glass-card interactive max-w-md w-full rounded-3xl p-6 sm:p-8 text-center border-2 border-amber-500/60 shadow-2xl relative overflow-hidden">
      <div className="inline-block bg-yellow-400 text-black font-bungee px-3 py-1 rounded-full text-xs mb-2 tracking-wider shadow">
        DELHI STREET SURFERS • TEMPLE RUN STYLE
      </div>
      <h1 className="text-4xl sm:text-5xl font-hindi-style text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 font-extrabold tracking-wide mb-1 drop-shadow-md">
        भाग Dipke भाग!
      </h1>
      <p className="text-sm font-medium text-amber-200/90 mb-4">
        The march left Jantar Mantar and sat on the road. Dodge barricades, a full detention bus, and a very closed Central Park!
      </p>

      <div className="bg-black/40 rounded-2xl p-3 mb-5 border border-amber-500/30 flex justify-around items-center">
        <div>
          <div className="text-[11px] text-gray-400 uppercase font-bold tracking-wider">Top Distance</div>
          <div id="menu-best-dist" className="text-2xl font-bungee text-amber-400">0 m</div>
        </div>
        <div className="w-px h-8 bg-amber-500/30"></div>
        <div>
          <div className="text-[11px] text-gray-400 uppercase font-bold tracking-wider">Best Samosas</div>
          <div id="menu-best-coins" className="text-2xl font-bungee text-yellow-300">0 🥟</div>
        </div>
      </div>

      <label className="mb-3 flex w-full cursor-pointer items-center justify-center rounded-2xl border border-amber-300/40 bg-black/40 px-3 py-3 text-sm font-semibold text-amber-100">
        Wear your photo as Dipke
        <input id="photo-input" type="file" accept="image/*" className="sr-only" />
      </label>
      <div id="boot-panel" className="mb-3 text-left">
        <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-amber-200">
          <span id="boot-label" className="flex items-center gap-2">
            <span className="boot-runner">🏃</span> Loading Delhi
          </span>
          <span id="boot-pct">0%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full border border-amber-400/30 bg-black/50">
          <div id="boot-bar" className="boot-bar h-full w-0 rounded-full"></div>
        </div>
        <p id="boot-hint" className="mt-2 text-center text-[11px] font-semibold text-amber-100/80">
          Dipke is warming up. Tap start — the chase begins the second it’s ready.
        </p>
      </div>
      <button type="button" id="btn-start" onClick={queueStart} className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-black font-bungee text-xl tracking-wider uppercase font-black shadow-xl pulse-glow transform active:scale-95 transition flex items-center justify-center gap-3">
        <span id="btn-start-label">TAP TO QUEUE START</span>
        <span id="btn-start-icon" className="text-2xl">🔥</span>
      </button>
    </div>
  </div>

  
  <div id="gameover-modal" className="hud-layer flex items-center justify-center p-4 hidden">
    <div className="glass-card interactive max-w-md w-full rounded-3xl p-6 sm:p-7 text-center border-2 border-red-500/70 shadow-2xl relative">
      <div className="inline-flex items-center gap-1.5 bg-red-600/90 text-white font-bungee px-3 py-1 rounded-full text-xs uppercase mb-2 tracking-wider">
        <span>🚨</span> Delhi Traffic Police Challan
      </div>

      <h2 id="go-hindi-quip" className="text-2xl sm:text-3xl font-hindi-style text-yellow-300 font-extrabold mb-1">
        अरे Dipke भाई! चालान कट गया!
      </h2>
      <p id="go-reason" className="text-xs text-red-200 mb-4 font-semibold">
        Reason: Delhi Police caught up with you near Connaught Place!
      </p>

      <div className="bg-black/60 rounded-2xl p-4 border border-red-500/40 text-left space-y-2 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-xs uppercase text-gray-400 font-bold">Total Run Distance</span>
          <span id="go-dist" className="font-bungee text-xl text-white">0 m</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs uppercase text-gray-400 font-bold">Samosas & Chai Collected</span>
          <span id="go-coins" className="font-bungee text-xl text-yellow-400">0 🥟</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-white/10">
          <span className="text-xs uppercase text-amber-400 font-bold">Final Score</span>
          <span id="go-score" className="font-bungee text-2xl text-amber-300">0</span>
        </div>
      </div>

      <button type="button" id="btn-restart" className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-black font-bungee text-lg font-black tracking-wider shadow-lg active:scale-95 transition">
        RETRY CHASE 🔄
      </button>
    </div>
  </div>
    </main>
  );
}
