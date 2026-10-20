import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { retainGame } from "@/game/runner";
import { submitFeedbackServerFn, recordVisitorServerFn } from "@/lib/server/feedback";

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
  const [showHelp, setShowHelp] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [shareToast, setShareToast] = useState("");
  const [totalCashDisplay, setTotalCashDisplay] = useState("₹0");

  useEffect(() => {
    try {
      const savedCoins = parseInt(
        localStorage.getItem("bhaag_total_cash") || localStorage.getItem("bhaag_best_coins") || "0",
        10
      );
      setTotalCashDisplay("₹" + (savedCoins * 100).toLocaleString("en-IN"));
    } catch {}
  }, []);

  const getOrCreateUserId = () => {
    if (typeof window === "undefined") return "anon";
    try {
      let uid = localStorage.getItem("bhaag_user_id");
      if (!uid) {
        uid = "usr_" + Math.random().toString(36).substring(2, 8) + Date.now().toString(36).substring(4);
        localStorage.setItem("bhaag_user_id", uid);
      }
      return uid;
    } catch {
      return "player";
    }
  };

  const handleShareGame = async () => {
    const uid = getOrCreateUserId();
    const origin = typeof window !== "undefined" ? window.location.origin : "https://bhaag-dipke.vercel.app";
    const shareUrl = `${origin}/?ref=${encodeURIComponent(uid)}&utm_source=menu_share&utm_medium=referral&utm_campaign=game_share`;
    const shareData = {
      title: "भाग Dipke भाग! 🏃💨 - Delhi Street Runner",
      text: `🚨 Can you help Dipke dodge Delhi Police, DTC Buses, and Metro barricades across Delhi? Play now: ${shareUrl}`,
      url: shareUrl,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: any) {
        if (err && err.name === "AbortError") return;
      }
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(
          `🚨 भाग Dipke भाग! - Delhi Street Runner\nCan you escape the Delhi Police? Play now: ${shareUrl}`
        );
        setShareToast("Game link copied! 📋 Share with friends!");
        setTimeout(() => setShareToast(""), 3000);
      }
    } catch {
      setShareToast("Share link: " + shareUrl);
      setTimeout(() => setShareToast(""), 3500);
    }
  };

  useEffect(() => {
    const host = document.getElementById("game-canvas-container");
    const cleanup = host ? retainGame(host) : undefined;

    // Track first-time visitor analytics with referrer user ID and UTM tags
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const incomingRef = urlParams.get("ref") || urlParams.get("referrer");
      const incomingUtmSource = urlParams.get("utm_source");
      const incomingUtmMedium = urlParams.get("utm_medium");
      const incomingUtmCampaign = urlParams.get("utm_campaign");

      if (incomingRef) {
        try {
          localStorage.setItem("bhaag_referred_by", incomingRef);
        } catch {}
      }

      const uid = getOrCreateUserId();

      if (!localStorage.getItem("bhaag_visited")) {
        const trackFirstVisit = async () => {
          try {
            let geo: {
              ip?: string;
              city?: string;
              region?: string;
              country_name?: string;
              country_code?: string;
              latitude?: number;
              longitude?: number;
            } = {};

            try {
              const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3500) });
              if (res.ok) {
                geo = await res.json();
              }
            } catch {
              // Ignore if rate-limited or offline
            }

            const device = /Mobi|Android|iPhone/i.test(navigator.userAgent) ? "Mobile" : "Desktop";
            const screenResolution = `${window.screen.width}x${window.screen.height}`;
            const referrer = document.referrer || "";
            const referredBy = incomingRef || localStorage.getItem("bhaag_referred_by") || undefined;

            await recordVisitorServerFn({
              data: {
                ...geo,
                userId: uid,
                referredBy,
                utmSource: incomingUtmSource || undefined,
                utmMedium: incomingUtmMedium || undefined,
                utmCampaign: incomingUtmCampaign || undefined,
                device,
                screenResolution,
                referrer,
              },
            });

            localStorage.setItem("bhaag_visited", "true");
          } catch (e) {
            console.warn("Visitor analytics fallback:", e);
          }
        };

        trackFirstVisit();
      }
    }

    return cleanup;
  }, []);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim() || feedbackSubmitting) return;

    setFeedbackSubmitting(true);
    setFeedbackError("");

    try {
      const device = /Mobi|Android|iPhone/i.test(navigator.userAgent) ? "Mobile" : "Desktop";
      const dist = document.getElementById("go-dist")?.textContent || document.getElementById("hud-distance")?.textContent || "0";
      const coins = document.getElementById("go-coins")?.textContent || document.getElementById("hud-coins")?.textContent || "0";

      const res = await submitFeedbackServerFn({
        data: {
          feedback: feedbackText.trim(),
          name: feedbackName.trim() || undefined,
          email: feedbackEmail.trim() || undefined,
          distance: parseInt(dist.replace(/[^\d]/g, ""), 10) || 0,
          coins: parseInt(coins.replace(/[^\d]/g, ""), 10) || 0,
          device,
        },
      });

      if (!res?.success) throw new Error(res?.error || "Server error");

      setFeedbackSuccess(true);
      setTimeout(() => {
        setFeedbackText("");
        setFeedbackSuccess(false);
        setShowFeedback(false);
      }, 2400);
    } catch {
      setFeedbackError("Couldn't submit feedback right now. Please check your connection!");
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  return (
    <main className="game-root relative h-[100dvh] w-full overflow-hidden text-white">
<div id="game-canvas-container" className="absolute inset-0"></div>

  {/* Floating Share Toast Notification */}
  {shareToast && (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-emerald-950/95 border-2 border-emerald-400 text-emerald-200 px-4 py-2 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.6)] flex items-center gap-2 text-xs sm:text-sm font-bold animate-bounce pointer-events-none">
      <span>✨</span>
      <span>{shareToast}</span>
    </div>
  )}

  <div id="speed-fx" className="hud-layer speed-lines opacity-0 transition-opacity duration-300"></div>
  <div id="flight-fx" className="hud-layer sky-flight-fx opacity-0 transition-opacity duration-500"></div>


  
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


  <div id="hud" className="hud-layer flex flex-col justify-between p-2.5 sm:p-5 hidden">
    <div className="flex items-start justify-between w-full max-w-5xl mx-auto gap-2">
      {/* Top Left: Minimalist Cash & Distance (No card background, no label text, just emoji + value) */}
      <div className="flex flex-col gap-1 sm:gap-1.5 drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
        {/* Cash: Just 💵 and ₹<value> */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-2xl sm:text-3xl filter drop-shadow">💵</span>
          <span id="hud-coins" className="text-xl sm:text-2xl font-bungee text-emerald-300 leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
            ₹0
          </span>
        </div>

        {/* Distance: Just 🏃‍♂️ and <value>m */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-2xl sm:text-3xl filter drop-shadow">🏃‍♂️</span>
          <div className="flex items-baseline gap-0.5 leading-none">
            <span id="hud-distance" className="text-xl sm:text-2xl font-bungee text-white leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
              0
            </span>
            <span className="text-xs sm:text-sm font-bungee text-orange-300">m</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5 sm:gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Pause Button */}
          <button
            type="button"
            id="btn-pause-game"
            className="glass-card gold-glow-border w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-sm sm:text-base font-bold text-yellow-300 hover:text-white hover:scale-105 active:scale-95 transition shadow-xl cursor-pointer"
            title="Pause Game (P / Esc)"
            aria-label="Pause Game"
          >
            ⏸️
          </button>

          <div className="glass-card px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-xl sm:rounded-2xl text-right border-amber-500/30">
            <div className="text-[8px] sm:text-[10px] uppercase tracking-wider text-yellow-400 font-bold">Delhi Location</div>
            <div id="hud-landmark" className="text-[11px] sm:text-sm font-hindi-style text-amber-100 font-bold max-w-[140px] sm:max-w-none truncate">Connaught Place Radial</div>
          </div>
        </div>

        <div className="glass-card px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg sm:rounded-xl flex items-center gap-1.5 sm:gap-2 border-red-500/40">
          <span className="text-xs sm:text-sm">👮‍♂️</span>
          <div className="text-[10px] sm:text-[11px] font-bold text-red-300">
            Police: <span id="police-dist" className="text-yellow-300 font-mono">14m</span>
          </div>
        </div>

        <div id="hud-powerup" className="glass-card px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl hidden flex items-center gap-1.5 sm:gap-2 border-emerald-400/50 bg-emerald-950/80">
          <span id="powerup-icon" className="text-lg sm:text-xl animate-bounce">⚡</span>
          <div>
            <div id="powerup-name" className="text-[9px] sm:text-[10px] font-bold text-emerald-300 uppercase">Metro Boost</div>
            <div className="w-20 sm:w-32 bg-black/50 h-1.5 sm:h-2 rounded-full overflow-hidden border border-emerald-400/30">
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
    <div className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between interactive gap-1.5 sm:gap-2 pt-1">
      {/* Mobile Title (visible on mobile < sm, placed cleanly on top without line wrapping) */}
      <div className="text-center px-1 sm:hidden">
        <div className="inline-block bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 text-black font-bungee text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-md mb-0.5">
          DELHI STREET RUNNER
        </div>
        <h1 className="text-2xl font-hindi-style text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 font-black tracking-wide drop-shadow-[0_4px_14px_rgba(0,0,0,0.95)] whitespace-nowrap">
          भाग Dipke भाग!
        </h1>
      </div>

      {/* Top Pills Row (Mobile: flex row side-by-side across 375px; Desktop: Left & Right ends) */}
      <div className="w-full flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Left: Total Cash Pill */}
        <div className="glass-card gold-glow-border px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl flex items-center gap-1.5 sm:gap-2 shadow-xl flex-1 sm:flex-initial">
          <span className="text-xl sm:text-3xl filter drop-shadow">💵</span>
          <div>
            <div className="text-[8px] sm:text-[10px] uppercase font-bold text-emerald-300/90 tracking-wider">Total Cash</div>
            <div id="menu-best-coins" className="text-xs sm:text-2xl font-bungee text-emerald-300 leading-tight">{totalCashDisplay}</div>
          </div>
        </div>

        {/* Desktop Center: Title (hidden on mobile, visible on desktop) */}
        <div className="hidden sm:block text-center px-1">
          <div className="inline-block bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 text-black font-bungee text-[11px] font-black px-3 py-0.5 rounded-full uppercase tracking-widest shadow-md mb-0.5">
            DELHI STREET RUNNER
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-hindi-style text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 font-black tracking-wide drop-shadow-[0_4px_14px_rgba(0,0,0,0.95)] whitespace-nowrap">
            भाग Dipke भाग!
          </h1>
        </div>

        {/* Right: High Score, Share Game & Help Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial justify-end">
          <div className="glass-card gold-glow-border px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl flex items-center gap-1.5 sm:gap-2 shadow-xl text-right">
            <div>
              <div className="text-[8px] sm:text-[10px] uppercase font-bold text-amber-300/80 tracking-wider">Top Distance</div>
              <div id="menu-best-dist" className="text-xs sm:text-2xl font-bungee text-amber-400 leading-tight">0 m</div>
            </div>
            <span className="text-xl sm:text-3xl filter drop-shadow">🏆</span>
          </div>

          {/* Quick Top Share Button */}
          <button
            type="button"
            onClick={handleShareGame}
            className="glass-card gold-glow-border w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-sm sm:text-xl font-black text-amber-300 hover:text-white hover:scale-105 active:scale-95 transition shadow-xl cursor-pointer shrink-0"
            title="Share Game / गेम शेयर करें"
            aria-label="Share Game"
          >
            📤
          </button>

          {/* Quick Top Help Button */}
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className="glass-card gold-glow-border w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-sm sm:text-xl font-black text-yellow-300 hover:text-white hover:scale-105 active:scale-95 transition shadow-xl cursor-pointer shrink-0"
            title="How to Play / कैसे खेलें"
            aria-label="How to play"
          >
            ❓
          </button>
        </div>
      </div>
    </div>

    {/* Center area is deliberately clear so 3D Dipke & Delhi Metro are showcased */}
    <div className="flex-1 pointer-events-none"></div>

    {/* Bottom Control Deck */}
    <div className="w-full max-w-md mx-auto flex flex-col items-center gap-1.5 sm:gap-2.5 interactive pb-2 sm:pb-6">
      {/* Boot Loading Panel (shows while textures load) */}
      <div id="boot-panel" className="w-full glass-card p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border-amber-500/30 text-left">
        <div className="mb-0.5 flex items-center justify-between text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-200">
          <span id="boot-label" className="flex items-center gap-1.5">
            <span className="boot-runner">🏃</span> Loading Delhi
          </span>
          <span id="boot-pct" className="font-mono text-yellow-300">0%</span>
        </div>
        <div className="h-1.5 sm:h-2 w-full overflow-hidden rounded-full border border-amber-400/30 bg-black/60">
          <div id="boot-bar" className="boot-bar h-full w-0 rounded-full"></div>
        </div>
        <p id="boot-hint" className="mt-0.5 text-center text-[9px] sm:text-[10px] font-semibold text-amber-100/70">
          Dipke is warming up. Tap start — the chase begins as soon as Delhi is loaded.
        </p>
      </div>

      {/* Primary 3D Arcade Start Button */}
      <button
        type="button"
        id="btn-start"
        onClick={queueStart}
        className="arcade-btn w-full py-3 sm:py-5 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 hover:brightness-110 text-black font-bungee text-lg sm:text-2xl tracking-wider uppercase font-black flex items-center justify-center gap-2 sm:gap-3 border-2 border-yellow-200 cursor-pointer shadow-2xl active:scale-98"
      >
        <span id="btn-start-label">BHAAG DIPKE! [START]</span>
        <span id="btn-start-icon" className="text-xl sm:text-3xl animate-bounce">🔥</span>
      </button>

      {/* Quick Action Bar: Audio Toggle, How to Play, Credits & Feedback */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 w-full">
        <button
          type="button"
          id="btn-audio-toggle"
          className="flex items-center justify-center gap-1 py-2 px-1.5 sm:px-2 rounded-xl border border-amber-400/40 bg-black/70 hover:bg-black/90 text-[10px] sm:text-xs font-bold text-amber-200 transition shadow-md active:scale-95 cursor-pointer truncate"
        >
          <span id="audio-toggle-icon">🔊</span> <span className="truncate">Sound ON</span>
        </button>
        <button
          type="button"
          onClick={() => setShowHelp(true)}
          className="flex items-center justify-center gap-1 py-2 px-1.5 sm:px-2 rounded-xl border border-yellow-400/40 bg-black/70 hover:bg-black/90 text-[10px] sm:text-xs font-bold text-yellow-300 transition shadow-md active:scale-95 cursor-pointer truncate"
        >
          <span className="text-xs sm:text-sm shrink-0">❓</span> <span className="truncate">How to Play</span>
        </button>
        <button
          type="button"
          onClick={() => setShowCredits(true)}
          className="flex items-center justify-center gap-1 py-2 px-1.5 sm:px-2 rounded-xl border border-amber-400/40 bg-black/70 hover:bg-black/90 text-[10px] sm:text-xs font-bold text-amber-200 transition shadow-md active:scale-95 cursor-pointer truncate"
        >
          <span className="text-xs sm:text-sm shrink-0">❤️</span> <span className="truncate">Credits</span>
        </button>
        <button
          type="button"
          onClick={() => setShowFeedback(true)}
          className="flex items-center justify-center gap-1 py-2 px-1.5 sm:px-2 rounded-xl border border-emerald-400/40 bg-black/70 hover:bg-black/90 text-[10px] sm:text-xs font-bold text-emerald-300 transition shadow-md active:scale-95 cursor-pointer truncate"
        >
          <span className="text-xs sm:text-sm shrink-0">💡</span> <span className="truncate">Feedback</span>
        </button>
      </div>

      {/* Subtle Entertainment Disclaimer Footer */}
      <div className="text-center text-[9px] sm:text-[10px] text-amber-100/60 font-semibold tracking-wide pt-0.5 px-1">
        Pure Chill &amp; Entertainment • Dev:{" "}
        <a
          href="https://ydvamar.online"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-300 underline font-bold hover:text-white transition"
          onClick={(e) => e.stopPropagation()}
        >
          Yadav Amarjit (ydvamar.online) ↗
        </a>
      </div>
    </div>
  </div>

  {/* =========================================================================
      HELP & HOW TO PLAY MODAL (?)
      ========================================================================= */}
  {showHelp && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 select-none">
      <div className="glass-card gold-glow-border relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-6 text-left shadow-2xl text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-yellow-500/30 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl">❓</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-bungee text-yellow-300 leading-tight">HOW TO PLAY</h2>
              <p className="text-xs text-amber-200 font-hindi-style">खेलने के नियम एवं देसी ताकत</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowHelp(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center font-bold text-lg cursor-pointer transition active:scale-90"
          >
            ✕
          </button>
        </div>

        {/* Controls Section */}
        <div className="mb-4">
          <div className="text-xs font-bungee uppercase text-yellow-400 mb-2 flex items-center gap-1.5">
            <span>🕹️</span> CONTROLS (नियंत्रण)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="bg-black/50 p-2.5 rounded-xl border border-white/10">
              <div className="font-bold text-amber-300 mb-0.5">⬅️ ➡️ Lane Switch</div>
              <div className="text-gray-300 text-[11px]">Swipe Left / Right or press <kbd className="px-1 py-0.5 bg-white/20 rounded font-mono">A</kbd> / <kbd className="px-1 py-0.5 bg-white/20 rounded font-mono">D</kbd></div>
            </div>
            <div className="bg-black/50 p-2.5 rounded-xl border border-white/10">
              <div className="font-bold text-emerald-300 mb-0.5">⬆️ Jump (कूदें)</div>
              <div className="text-gray-300 text-[11px]">Swipe Up or press <kbd className="px-1 py-0.5 bg-white/20 rounded font-mono">W</kbd> / <kbd className="px-1 py-0.5 bg-white/20 rounded font-mono">Space</kbd> to clear barricades</div>
            </div>
            <div className="bg-black/50 p-2.5 rounded-xl border border-white/10">
              <div className="font-bold text-sky-300 mb-0.5">⬇️ Slide (फिसलें)</div>
              <div className="text-gray-300 text-[11px]">Swipe Down or press <kbd className="px-1 py-0.5 bg-white/20 rounded font-mono">S</kbd> to duck under overhead barriers</div>
            </div>
          </div>
        </div>

        {/* Collectibles Section */}
        <div className="mb-4">
          <div className="text-xs font-bungee uppercase text-emerald-400 mb-2 flex items-center gap-1.5">
            <span>💵</span> WHAT TO COLLECT (क्या उठाएं)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="bg-black/50 p-2.5 rounded-xl border border-emerald-500/30 flex items-start gap-2.5">
              <span className="text-2xl">💵</span>
              <div>
                <div className="font-bold text-emerald-300">₹100 Currency Bundle (गड्डी)</div>
                <div className="text-gray-300 text-[11px]">Crisp currency stack! Adds ₹100 cash to your total stash and boosts score.</div>
              </div>
            </div>
            <div className="bg-black/50 p-2.5 rounded-xl border border-rose-500/30 flex items-start gap-2.5">
              <span className="text-2xl">💰</span>
              <div>
                <div className="font-bold text-rose-300">₹500 Pink Note Stack</div>
                <div className="text-gray-300 text-[11px]">High-denomination rare bundle! Awards 5 bundles (+₹500 cash) instantly.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Powerups Section */}
        <div className="mb-4">
          <div className="text-xs font-bungee uppercase text-yellow-400 mb-2 flex items-center gap-1.5">
            <span>⚡</span> POWERUPS (देसी ताक़त)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="bg-black/50 p-2.5 rounded-xl border border-sky-500/30 flex items-start gap-2.5">
              <span className="text-2xl">🚀</span>
              <div>
                <div className="font-bold text-sky-300">Desi Jetpack</div>
                <div className="text-gray-300 text-[11px]">Soar high into the Delhi sky with dual flames and collect currency bundles safely!</div>
              </div>
            </div>
            <div className="bg-black/50 p-2.5 rounded-xl border border-amber-500/30 flex items-start gap-2.5">
              <span className="text-2xl">☕</span>
              <div>
                <div className="font-bold text-amber-300">Garam Chai (2X Multiplier)</div>
                <div className="text-gray-300 text-[11px]">Hot cutting tea that doubles all your score and cash pickups for 10 seconds!</div>
              </div>
            </div>
            <div className="bg-black/50 p-2.5 rounded-xl border border-red-500/30 flex items-start gap-2.5">
              <span className="text-2xl">🧲</span>
              <div>
                <div className="font-bold text-red-300">Cash Magnet</div>
                <div className="text-gray-300 text-[11px]">Pulls all currency bundles from all 3 lanes directly towards Dipke!</div>
              </div>
            </div>
            <div className="bg-black/50 p-2.5 rounded-xl border border-emerald-500/30 flex items-start gap-2.5">
              <span className="text-2xl">🪖</span>
              <div>
                <div className="font-bold text-emerald-300">Protest Helmet Shield</div>
                <div className="text-gray-300 text-[11px]">Protects Dipke from one obstacle crash or police catch without game over!</div>
              </div>
            </div>
          </div>
        </div>

        {/* Obstacles Section */}
        <div className="mb-5">
          <div className="text-xs font-bungee uppercase text-red-400 mb-2 flex items-center gap-1.5">
            <span>🚧</span> DANGER OBSTACLES (खतरे)
          </div>
          <div className="bg-black/50 p-2.5 rounded-xl border border-red-500/30 text-xs text-gray-300 space-y-1">
            <div>• <span className="font-bold text-white">Delhi Police Barricades</span>: Jump over or switch lanes to dodge.</div>
            <div>• <span className="font-bold text-white">DTC Low-Floor Buses &amp; CNG Autos</span>: Huge vehicles blocking entire road lanes.</div>
            <div>• <span className="font-bold text-white">Delhi Police &amp; RAF Officers</span>: Tripping or colliding lets them catch you!</div>
          </div>
        </div>

        {/* Got It Button */}
        <button
          type="button"
          onClick={() => setShowHelp(false)}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-black font-bungee text-base font-black uppercase tracking-wider hover:brightness-110 active:scale-95 transition cursor-pointer shadow-lg"
        >
          SAMJH GAYA / GOT IT! 👍
        </button>
      </div>
    </div>
  )}

  {/* =========================================================================
      CREDITS & DEVELOPER DISCLAIMER MODAL
      ========================================================================= */}
  {showCredits && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 select-none">
      <div className="glass-card gold-glow-border relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-6 text-center shadow-2xl text-white">
        {/* Modal Close Button */}
        <button
          type="button"
          onClick={() => setShowCredits(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center font-bold text-lg cursor-pointer transition active:scale-90"
        >
          ✕
        </button>

        {/* Title Header */}
        <div className="inline-block bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 text-black font-bungee text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider mb-2">
          GAME CREDITS &amp; DISCLAIMER
        </div>
        <h2 className="text-2xl sm:text-3xl font-hindi-style text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 font-black mb-3">
          आभार एवं मनोरंजन संदेश
        </h2>

        {/* Chilling & Entertainment Purpose Statement */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/40 text-left mb-4 shadow-inner">
          <div className="flex items-center gap-2 text-yellow-300 font-bungee text-xs uppercase mb-1">
            <span>🕊️</span> Pure Entertainment &amp; Chilling
          </div>
          <p className="text-xs text-amber-100/90 leading-relaxed">
            This game was created <strong>purely for chilling, fun, and entertainment purposes</strong>! 
            Keeping politics, news, and controversies aside, it is designed as a humorous, light-hearted tribute to Delhi&apos;s vibrant street culture, Connaught Place architecture, and classic desi arcade chases.
          </p>
        </div>

        {/* Developer Card */}
        <div className="p-4 rounded-2xl bg-black/60 border border-white/15 text-center mb-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-yellow-400 via-orange-500 to-red-600 p-0.5 shadow-lg mb-2">
            <div className="w-full h-full rounded-full bg-neutral-900 flex items-center justify-center text-3xl">
              👨‍💻
            </div>
          </div>
          <div className="text-lg font-bungee text-white">YADAV AMARJIT</div>
          <p className="text-xs text-amber-300 font-semibold mb-3">Full-Stack &amp; Systems Architect • Game Developer</p>

          {/* Direct Portfolio Link Button */}
          <a
            href="https://ydvamar.online"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-black font-bungee text-xs font-black tracking-wider uppercase hover:brightness-110 active:scale-95 transition shadow-md"
          >
            <span>🌐</span> Visit Portfolio: ydvamar.online ↗
          </a>
        </div>

        {/* Tech & Inspirations */}
        <div className="text-[11px] text-gray-400 leading-normal mb-4">
          Built with React 19, Three.js 3D WebGL, and Tailwind CSS. Inspired by Subway Surfers &amp; Central Delhi CP.
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => setShowCredits(false)}
          className="w-full py-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-xs font-bold text-white uppercase tracking-wider cursor-pointer active:scale-95 transition"
        >
          CLOSE / बंद करें
        </button>
      </div>
    </div>
  )}

  {/* =========================================================================
      FEEDBACK & SUGGESTIONS MODAL
      ========================================================================= */}
  {showFeedback && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 select-none">
      <div className="glass-card gold-glow-border relative w-full max-w-md rounded-3xl p-5 sm:p-6 text-left shadow-2xl text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-yellow-500/30 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl">💡</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-bungee text-yellow-300 leading-tight">SUGGESTION / FEEDBACK</h2>
              <p className="text-xs text-amber-200 font-hindi-style">सुझाव या समस्या भेजें</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowFeedback(false);
              setFeedbackSuccess(false);
              setFeedbackError("");
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center font-bold text-lg cursor-pointer transition active:scale-90"
          >
            ✕
          </button>
        </div>

        {feedbackSuccess ? (
          <div className="py-8 text-center flex flex-col items-center gap-3">
            <div className="text-5xl animate-bounce">🎉</div>
            <h3 className="text-xl font-bungee text-emerald-300">THANK YOU, BRO!</h3>
            <p className="text-xs sm:text-sm text-gray-200 max-w-xs">
              Your suggestion has been sent directly to Amarjit&apos;s database. We&apos;ll check it out right away!
            </p>
          </div>
        ) : (
          <form onSubmit={handleFeedbackSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                Your Suggestion / Feedback *
              </label>
              <textarea
                required
                rows={3}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="e.g. Add Delhi Metro station tunnels, fix jump responsiveness, add auto-rickshaw turn sound..."
                className="w-full rounded-xl bg-black/60 border border-white/20 focus:border-yellow-400 focus:outline-none p-3 text-xs sm:text-sm text-white placeholder-gray-500 resize-none transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                  Name (Optional)
                </label>
                <input
                  type="text"
                  value={feedbackName}
                  onChange={(e) => setFeedbackName(e.target.value)}
                  placeholder="e.g. Rahul"
                  className="w-full rounded-xl bg-black/60 border border-white/20 focus:border-yellow-400 focus:outline-none px-3 py-2 text-xs text-white placeholder-gray-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={feedbackEmail}
                  onChange={(e) => setFeedbackEmail(e.target.value)}
                  placeholder="e.g. rahul@gmail.com"
                  className="w-full rounded-xl bg-black/60 border border-white/20 focus:border-yellow-400 focus:outline-none px-3 py-2 text-xs text-white placeholder-gray-500 transition"
                />
              </div>
            </div>

            <p className="text-[10px] sm:text-[11px] text-amber-200/90 font-medium bg-amber-950/40 border border-amber-500/30 p-2 rounded-xl">
              ✉️ If your email is provided, then we will let you know once your suggestion is addressed or fixed!
            </p>

            {feedbackError && (
              <div className="text-xs text-red-400 bg-red-950/60 p-2 rounded-lg border border-red-500/40">
                {feedbackError}
              </div>
            )}

            <button
              type="submit"
              disabled={feedbackSubmitting || !feedbackText.trim()}
              className="mt-1 w-full py-3 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-black font-bungee text-sm font-black tracking-wider uppercase hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg cursor-pointer"
            >
              {feedbackSubmitting ? "SENDING TO DEV..." : "SUBMIT FEEDBACK 🚀"}
            </button>
          </form>
        )}
      </div>
    </div>
  )}

  {/* =========================================================================
      PAUSE MODAL OVERLAY
      ========================================================================= */}
  <div id="pause-modal" className="hud-layer flex items-center justify-center p-4 bg-black/75 backdrop-blur-md hidden z-50 select-none">
    <div className="glass-card gold-glow-border max-w-sm w-full rounded-3xl p-6 sm:p-7 text-center relative shadow-2xl">
      <div className="inline-block bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bungee text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-widest shadow mb-2">
        GAME PAUSED
      </div>
      <h2 className="text-2xl sm:text-3xl font-hindi-style text-yellow-300 font-extrabold mb-1">
        खेल रुका है!
      </h2>
      <p className="text-xs text-amber-100/70 mb-5 font-semibold">
        Dipke and Delhi Police are catching their breath.
      </p>

      {/* Mini Stats During Pause */}
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        <div className="digital-meter rounded-2xl p-2.5 border border-emerald-500/30 text-center">
          <span className="text-xl">💵</span>
          <div id="pause-cash" className="text-lg font-bungee text-emerald-300 mt-0.5">₹0</div>
        </div>
        <div className="digital-meter rounded-2xl p-2.5 border border-orange-500/30 text-center">
          <span className="text-xl">🏃‍♂️</span>
          <div id="pause-dist" className="text-lg font-bungee text-white mt-0.5">0 m</div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {/* Resume Button */}
        <button
          type="button"
          id="btn-resume-game"
          className="arcade-btn w-full py-3.5 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 hover:brightness-110 text-black font-bungee text-base font-black tracking-wider shadow-xl cursor-pointer active:scale-95 flex items-center justify-center gap-2"
        >
          <span>▶️</span> RESUME CHASE
        </button>

        {/* Restart Button */}
        <button
          type="button"
          id="btn-pause-restart"
          className="w-full py-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-xs font-bold text-gray-200 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <span>🔄</span> Restart Run
        </button>

        {/* Sound Toggle Button */}
        <button
          type="button"
          id="btn-pause-audio"
          className="w-full py-2 rounded-xl border border-amber-400/30 bg-black/50 hover:bg-black/70 text-xs font-bold text-amber-200 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <span id="pause-audio-icon">🔊</span> Toggle Sound
        </button>
      </div>
    </div>
  </div>

  {/* =========================================================================
      GAME OVER: DETAINED MODAL
      ========================================================================= */}
  <div id="gameover-modal" className="hud-layer flex items-center justify-center p-4 hidden z-50 select-none">
    <div className="glass-card challan-neon-card interactive max-w-sm w-full rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-center relative overflow-hidden shadow-2xl">
      {/* Detained Title Badge */}
      <div className="inline-block bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-bungee text-xs sm:text-sm font-black px-5 py-1 rounded-full uppercase tracking-widest shadow-lg border border-red-400/40 mb-3">
        DETAINED
      </div>

      {/* Main Quip */}
      <h2 className="text-2xl sm:text-3xl font-hindi-style text-yellow-300 font-extrabold mb-4 drop-shadow">
        Dipke, it&apos;s done bro!
      </h2>

      {/* New High Score Toast Badge */}
      <div id="go-new-record" className="hidden mb-3 py-1.5 px-3 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 text-black font-bungee text-xs rounded-full uppercase tracking-wider font-black shadow-lg animate-pulse">
        🏆 NEW RECORD DISTANCE SET! 🏆
      </div>

      {/* Digital LED Arcade Meters with Emojis */}
      <div className="grid grid-cols-2 gap-2.5 mb-5 text-center">
        <div className="digital-meter rounded-2xl p-3 border border-orange-500/30 flex flex-col items-center">
          <span className="text-2xl mb-1 filter drop-shadow">🏃‍♂️</span>
          <div id="go-dist" className="font-bungee text-xl sm:text-2xl text-white leading-tight">0 m</div>
        </div>
        <div className="digital-meter rounded-2xl p-3 border border-emerald-500/30 flex flex-col items-center">
          <span className="text-2xl mb-1 filter drop-shadow">💵</span>
          <div id="go-coins" className="font-bungee text-xl sm:text-2xl text-emerald-300 leading-tight">₹0</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          id="btn-restart"
          className="arcade-btn-red w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:brightness-110 text-white font-bungee text-base sm:text-lg font-black tracking-wider shadow-xl cursor-pointer active:scale-95"
        >
          BAIL OUT / RETRY CHASE
        </button>

        <button
          type="button"
          id="btn-share-score"
          className="w-full py-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-xs font-bold text-gray-200 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <span id="share-btn-text">📤 Share</span>
        </button>

        <button
          type="button"
          onClick={() => setShowFeedback(true)}
          className="w-full py-2 rounded-xl border border-yellow-400/30 bg-black/60 hover:bg-black/80 text-[11px] font-bold text-yellow-300 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
        >
          <span>💡</span> <span>Got a Suggestion / Found a Bug?</span>
        </button>
      </div>
    </div>
  </div>
    </main>
  );
}
