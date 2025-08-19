import React, { useEffect, useMemo, useState } from "react";

const COLORS = {
  bg: "#0B0B12",
  surface: "#11121A",
  line: "#2A2B37",
  text: "#C9C9D1",
  primary: "#9B5CFF",
  success: "#52E3C2",
  warning: "#FFD166",
};

const YT = {
  legs: "841gJUczmzg",
  shoulders: "r_sxBBLoLkQ",
  back: "imRJUblCTjw",
  biceps: "wwKb-wZCEjs",
  chest: "0Av02v-gMw8",
  triceps: "tdafXbhcSuo",
  posture: "Z0G2fLP9Hl0",
};

const YT_THUMB = (id) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
const YT_LINK = (id) => `https://youtu.be/${id}`;

const WEEK_DAYS = [
  { title: "Legs + Shoulders", key: "legs-shoulders", videos: [{ id: YT.legs, label: "Legs" }, { id: YT.shoulders, label: "Shoulders" }] },
  { title: "Pull (Back + Biceps)", key: "pull", videos: [{ id: YT.back, label: "Back" }, { id: YT.biceps, label: "Biceps" }] },
  { title: "Push (Chest + Triceps)", key: "push", videos: [{ id: YT.chest, label: "Chest" }, { id: YT.triceps, label: "Triceps" }] },
  { title: "Legs + Shoulders (Progression)", key: "legs-shoulders-2", videos: [{ id: YT.legs, label: "Legs" }, { id: YT.shoulders, label: "Shoulders" }] },
  { title: "Pull (Progression)", key: "pull-2", videos: [{ id: YT.back, label: "Back" }, { id: YT.biceps, label: "Biceps" }] },
  { title: "Push (Progression)", key: "push-2", videos: [{ id: YT.chest, label: "Chest" }, { id: YT.triceps, label: "Triceps" }] },
  { title: "Mobility / Posture Fix", key: "posture", videos: [{ id: YT.posture, label: "Posture" }] },
];

const LS_USER = "ppl.user";
const LS_WEEK = "ppl.week";
const LS_HISTORY = "ppl.history";

const getWeekStart = (start = "monday", date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  d.setHours(0, 0, 0, 0);
  if (start === "sunday") {
    const diff = day;
    d.setDate(d.getDate() - diff);
  } else {
    const diff = (day + 6) % 7;
    d.setDate(d.getDate() - diff);
  }
  return d.toISOString().slice(0, 10);
};

const initialUser = {
  displayName: "Athlete",
  startOfWeek: "monday",
  reminders: [],
  reducedMotion: false,
  highContrast: false,
};

const freshWeek = (weekId) => ({
  weekId,
  days: Array.from({ length: 7 }).map((_, i) => ({ day: i + 1, status: i === 0 ? "available" : "locked", notes: "", checklist: {} })),
  streak: 0,
});

const readLS = (k, fallback) => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeLS = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const GlowButton = ({ children, className = "", onClick, disabled, ariaLabel, type = "button" }) => (
  <button
    type={type}
    aria-label={ariaLabel}
    disabled={disabled}
    onClick={onClick}
    className={`relative inline-flex items-center justify-center rounded-2xl px-4 py-2 font-medium transition disabled:opacity-50 ${className}`}
    style={{
      background: `linear-gradient(180deg, rgba(155,92,255,0.12), rgba(155,92,255,0.05))`,
      boxShadow: `0 0 0 1px ${COLORS.line}, 0 8px 24px rgba(0,0,0,0.35), 0 0 20px rgba(155,92,255,0.15)`,
      color: COLORS.text,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = `0 0 0 1px ${COLORS.primary}, 0 8px 24px rgba(0,0,0,0.35), 0 0 30px rgba(155,92,255,0.45)`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = `0 0 0 1px ${COLORS.line}, 0 8px 24px rgba(0,0,0,0.35), 0 0 20px rgba(155,92,255,0.15)`;
    }}
  >
    {children}
  </button>
);

const Pill = ({ children, color = COLORS.primary }) => (
  <span
    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs"
    style={{ background: `${color}1A`, color, boxShadow: `inset 0 0 0 1px ${color}66` }}
  >
    {children}
  </span>
);

const Section = ({ id, title, children, subtitle }) => (
  <section id={id} className="mx-auto w-full max-w-6xl px-4 py-10">
    <div className="mb-6 flex items-end justify-between">
      <div>
        <h2 className="font-serif text-2xl md:text-3xl" style={{ color: COLORS.text }}>{title}</h2>
        {subtitle && <p className="mt-1 text-sm opacity-80" style={{ color: COLORS.text }}>{subtitle}</p>}
      </div>
    </div>
    {children}
  </section>
);

function ProgressRing({ value }) {
  const size = 140;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circ - (clamped / 100) * circ;
  return (
    <svg width={size} height={size} className="block">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="#1B1C27" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={COLORS.primary}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${circ} ${circ}`}
        strokeDashoffset={offset}
        fill="none"
        style={{ filter: "drop-shadow(0 0 10px rgba(155,92,255,0.6))" }}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill={COLORS.text} className="font-semibold">
        {Math.round(clamped)}%
      </text>
    </svg>
  );
}

function computeStreak(days) {
  let streak = 0;
  for (let i = 0; i < days.length; i++) {
    if (days[i].status === "completed") streak++;
    else break;
  }
  return streak;
}

function currentUnlockedDay(days) {
  for (let d of days) {
    if (d.status === "available") return d.day;
  }
  const lastCompleted = [...days].reverse().find((d) => d.status === "completed");
  if (lastCompleted && lastCompleted.day < 7) return lastCompleted.day + 1;
  return 1;
}

export default function App() {
  useEffect(() => {
    document.documentElement.style.setProperty("--bg", COLORS.bg);
    document.documentElement.style.setProperty("--surface", COLORS.surface);
    document.documentElement.style.setProperty("--text", COLORS.text);
  }, []);

  const [user, setUser] = useState(() => readLS(LS_USER, initialUser));

  const [week, setWeek] = useState(() => {
    const storedUser = readLS(LS_USER, initialUser);
    const nowWeek = getWeekStart(storedUser.startOfWeek);
    const stored = readLS(LS_WEEK, null);
    if (!stored) return freshWeek(nowWeek);
    if (stored.weekId !== nowWeek) {
      const hist = readLS(LS_HISTORY, []);
      const oldCompleted = stored.days.filter((d) => d.status === "completed").length;
      const updatedHist = [...hist, { weekId: stored.weekId, completed: oldCompleted }];
      writeLS(LS_HISTORY, updatedHist);
      return freshWeek(nowWeek);
    }
    return stored;
  });

  const [history, setHistory] = useState(() => readLS(LS_HISTORY, []));
  const [activeDay, setActiveDay] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => writeLS(LS_USER, user), [user]);
  useEffect(() => writeLS(LS_WEEK, week), [week]);
  useEffect(() => writeLS(LS_HISTORY, history), [history]);

  const completedCount = week.days.filter((d) => d.status === "completed").length;
  const progressPct = (completedCount / 7) * 100;
  const streak = useMemo(() => computeStreak(week.days), [week.days]);
  const resumeDay = useMemo(() => currentUnlockedDay(week.days), [week.days]);

  const markComplete = (dayIndex) => {
    setWeek((w) => {
      const days = [...w.days];
      if (days[dayIndex].status !== "completed") {
        days[dayIndex] = { ...days[dayIndex], status: "completed" };
        if (dayIndex + 1 < 7 && days[dayIndex + 1].status === "locked") {
          days[dayIndex + 1] = { ...days[dayIndex + 1], status: "available" };
        }
      }
      const newWeek = { ...w, days, streak: computeStreak(days) };
      setToast({ type: "success", msg: `Day ${dayIndex + 1} complete! Day ${Math.min(dayIndex + 2, 7)} unlocked.` });
      return newWeek;
    });
  };

  const resetWeek = () => {
    const nowWeek = getWeekStart(user.startOfWeek);
    const completed = week.days.filter((d) => d.status === "completed").length;
    setHistory((h) => [...h, { weekId: week.weekId, completed }]);
    setWeek(freshWeek(nowWeek));
    setToast({ type: "info", msg: "Week reset. Fresh start!" });
  };

  const clearAll = () => {
    localStorage.removeItem(LS_USER);
    localStorage.removeItem(LS_WEEK);
    localStorage.removeItem(LS_HISTORY);
    setUser(initialUser);
    setHistory([]);
    setWeek(freshWeek(getWeekStart(initialUser.startOfWeek)));
    setToast({ type: "info", msg: "All local data cleared." });
  };

  const exportAll = () => {
    const data = { user, week, history };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ppl-progress-${week.weekId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importAll = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (parsed.user && parsed.week && parsed.history) {
          setUser(parsed.user);
          setWeek(parsed.week);
          setHistory(parsed.history);
          setToast({ type: "success", msg: "Progress imported." });
        } else throw new Error("Invalid schema");
      } catch (e) {
        setToast({ type: "error", msg: "Import failed. Invalid file." });
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", !!user.reducedMotion);
    document.documentElement.classList.toggle("high-contrast", !!user.highContrast);
  }, [user.reducedMotion, user.highContrast]);

  return (
    <div className="min-h-screen" style={{ background: COLORS.bg, color: COLORS.text }}>
      <Navbar resumeDay={resumeDay} onResume={() => setActiveDay(resumeDay)} />
      <Hero onStart={() => setActiveDay(resumeDay)} />

      <Section id="plan" title="Weekly Plan" subtitle="Unlock one day at a time. Your next step glows.">
        <WeekGrid week={week} onOpenDay={(d) => setActiveDay(d)} />
      </Section>

      <Section id="progress" title="Progress" subtitle="Consistent steps compound into strength.">
        <ProgressPanel progressPct={progressPct} streak={streak} history={history} />
      </Section>

      <Section id="profile" title="Profile & Preferences">
        <ProfilePanel
          user={user}
          setUser={setUser}
          onResetWeek={resetWeek}
          onClearAll={clearAll}
          onExport={exportAll}
          onImport={importAll}
        />
      </Section>

      {activeDay && (
        <DaySheet
          dayNumber={activeDay}
          dayData={WEEK_DAYS[activeDay - 1]}
          state={week.days[activeDay - 1]}
          onClose={() => setActiveDay(null)}
          onMarkComplete={() => {
            markComplete(activeDay - 1);
            setActiveDay(null);
          }}
          onChangeNote={(val) => {
            setWeek((w) => {
              const days = [...w.days];
              days[activeDay - 1] = { ...days[activeDay - 1], notes: val };
              return { ...w, days };
            });
          }}
          onToggleChecklist={(key) => {
            setWeek((w) => {
              const days = [...w.days];
              const ch = { ...(days[activeDay - 1].checklist || {}) };
              ch[key] = !ch[key];
              days[activeDay - 1] = { ...days[activeDay - 1], checklist: ch };
              return { ...w, days };
            });
          }}
        />
      )}

      <Footer />

      {toast && <Toast type={toast.type} onClose={() => setToast(null)}>{toast.msg}</Toast>}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@600;700&display=swap');
        :root { --primary: ${COLORS.primary}; }
        .font-serif { font-family: 'Playfair Display', ui-serif, Georgia, serif; }
        .font-sans { font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji'; }
        .reduce-motion * { transition: none !important; animation: none !important; }
        .high-contrast { filter: contrast(1.08); }
      `}</style>
    </div>
  );
}

function Navbar({ resumeDay, onResume }) {
  return (
    <header
      className="sticky top-0 z-30 backdrop-blur"
      style={{ background: "linear-gradient(180deg, rgba(17,18,26,0.9), rgba(17,18,26,0.6))", boxShadow: `0 1px 0 ${COLORS.line}` }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className="h-8 w-8 rounded-xl"
            style={{ background: `radial-gradient(60% 60% at 50% 40%, ${COLORS.primary}55 0%, transparent 60%), ${COLORS.surface}`, boxShadow: `0 0 0 1px ${COLORS.line}` }}
          />
          <span className="font-serif text-lg" style={{ color: COLORS.text }}>FitMe Minimal</span>
        </div>
        <nav className="hidden gap-6 md:flex">
          <a className="opacity-80 hover:opacity-100" href="#plan">Plan</a>
          <a className="opacity-80 hover:opacity-100" href="#progress">Progress</a>
          <a className="opacity-80 hover:opacity-100" href="#profile">Profile</a>
        </nav>
        <GlowButton ariaLabel="Resume Day" onClick={onResume} className="text-sm">Resume Day {resumeDay}</GlowButton>
      </div>
    </header>
  );
}

function Hero({ onStart }) {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute left-1/2 top-[-20%] h-[60vh] w-[60vh] -translate-x-1/2 rounded-full blur-3xl" style={{ background: `${COLORS.primary}22` }} />
      </div>
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-6 px-4 py-12 md:grid-cols-2 md:py-16">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl" style={{ color: COLORS.text }}>Your Minimalist FitMe Journey</h1>
          <p className="mt-3 max-w-prose opacity-80">Unlock one day at a time. Stay sharp. Stay consistent.</p>
          <div className="mt-6 flex gap-3">
            <GlowButton ariaLabel="Start Today's Workout" onClick={onStart} className="px-5 py-3">Start Today’s Workout</GlowButton>
            <a href="#plan" className="inline-flex items-center rounded-2xl px-4 py-2" style={{ boxShadow: `inset 0 0 0 1px ${COLORS.line}` }}>View Weekly Plan</a>
          </div>
        </div>
        <div className="rounded-3xl p-6" style={{ background: `linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))`, boxShadow: `0 0 0 1px ${COLORS.line}, inset 0 0 120px rgba(155,92,255,0.06)` }}>
          <EnergyCurve />
        </div>
      </div>
    </section>
  );
}

function EnergyCurve() {
  return (
    <div className="relative h-40 w-full overflow-hidden rounded-2xl" style={{ background: COLORS.surface }}>
      <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2" style={{ background: COLORS.line }} />
      <div className="absolute inset-6 rounded-xl" style={{ boxShadow: `inset 0 0 0 1px ${COLORS.line}` }} />
      <div
        className="absolute left-0 top-1/2 h-2 w-1/3 -translate-y-1/2 rounded-full"
        style={{ background: `linear-gradient(90deg, transparent, ${COLORS.primary}, transparent)`, filter: `drop-shadow(0 0 12px ${COLORS.primary})`, animation: "sweep 2.4s linear infinite" }}
      />
      <style>{`
        @keyframes sweep { from { left: -30%; } to { left: 110%; } }
      `}</style>
    </div>
  );
}

function WeekGrid({ week, onOpenDay }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {week.days.map((d, idx) => (
        <DayCard key={d.day} day={d} content={WEEK_DAYS[idx]} onOpen={() => { if (d.status !== "locked") onOpenDay(d.day); }} />
      ))}
    </div>
  );
}

function DayCard({ day, content, onOpen }) {
  const locked = day.status === "locked";
  const completed = day.status === "completed";
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { onOpen(); } }}
      className={`group relative rounded-3xl p-4 transition ${locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
      style={{ background: COLORS.surface, boxShadow: `0 0 0 1px ${COLORS.line}, 0 12px 30px rgba(0,0,0,0.35)` }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pill>{`Day ${day.day}`}</Pill>
          {locked && <Pill color={COLORS.warning}>Locked</Pill>}
          {completed && <Pill color={COLORS.success}>Completed</Pill>}
        </div>
        {!locked && !completed && (
          <div className="animate-pulse rounded-full px-2 py-1 text-xs" style={{ background: `${COLORS.primary}22`, color: COLORS.primary }}>Available</div>
        )}
      </div>
      <h3 className="font-serif text-xl" style={{ color: COLORS.text }}>{content.title}</h3>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {content.videos.map((v) => (
          <div key={v.id} className="overflow-hidden rounded-2xl" style={{ boxShadow: `inset 0 0 0 1px ${COLORS.line}` }}>
            <img src={YT_THUMB(v.id)} alt={`${v.label} thumbnail`} className="h-28 w-full object-cover transition group-hover:scale-105" />
            <div className="px-2 py-1 text-xs opacity-80">{v.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm opacity-70">Tap to open</span>
        <span className="text-sm" style={{ color: COLORS.primary }}>Start →</span>
      </div>
    </div>
  );
}

function DaySheet({ dayNumber, dayData, state, onClose, onMarkComplete, onChangeNote, onToggleChecklist }) {
  const locked = state.status === "locked";
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center md:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-t-3xl md:rounded-3xl" style={{ background: COLORS.surface, boxShadow: `0 0 0 1px ${COLORS.line}, 0 30px 80px rgba(0,0,0,0.6)` }}>
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: COLORS.line }}>
          <h3 className="font-serif text-xl" style={{ color: COLORS.text }}>{`Day ${dayNumber} — ${dayData.title}`}</h3>
          <button aria-label="Close" onClick={onClose} className="rounded-xl px-3 py-1" style={{ boxShadow: `inset 0 0 0 1px ${COLORS.line}` }}>✕</button>
        </div>

        <div className="grid gap-5 px-5 py-5 md:grid-cols-2">
          <div>
            <h4 className="mb-2 font-medium">Videos</h4>
            <div className="grid grid-cols-1 gap-3">
              {dayData.videos.map((v, idx) => (
                <article key={v.id} className="overflow-hidden rounded-2xl" style={{ boxShadow: `inset 0 0 0 1px ${COLORS.line}` }}>
                  <img src={YT_THUMB(v.id)} alt={`${v.label} thumbnail`} className="h-32 w-full object-cover" />
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2">
                      <input id={`chk-${dayNumber}-${idx}`} type="checkbox" checked={!!(state.checklist && state.checklist[v.id])} onChange={() => onToggleChecklist(v.id)} />
                      <label htmlFor={`chk-${dayNumber}-${idx}`} className="text-sm opacity-90">{v.label}</label>
                    </div>
                    <a href={YT_LINK(v.id)} target="_blank" rel="noreferrer" className="text-sm" style={{ color: COLORS.primary }}>Open ↗</a>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-4">
              <h4 className="mb-2 font-medium">Notes</h4>
              <textarea
                value={state.notes || ""}
                onChange={(e) => onChangeNote(e.target.value)}
                placeholder="Log weights, reps, or how you felt…"
                className="h-28 w-full resize-none rounded-2xl bg-transparent p-3 outline-none"
                style={{ boxShadow: `inset 0 0 0 1px ${COLORS.line}` }}
              />
            </div>
          </div>

          <div>
            <h4 className="mb-2 font-medium">Timer</h4>
            <SimpleTimer />

            <div className="mt-6 rounded-2xl p-4" style={{ background: `${COLORS.primary}10`, boxShadow: `inset 0 0 0 1px ${COLORS.primary}66` }}>
              <p className="text-sm opacity-90">Complete today to unlock tomorrow.</p>
              <GlowButton ariaLabel="Mark Day Complete" onClick={onMarkComplete} disabled={locked} className="mt-3 w-full justify-center py-3 text-base">
                {locked ? "Locked" : "Mark Day Complete"}
              </GlowButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SimpleTimer() {
  const [seconds, setSeconds] = useState(60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [running]);

  const reset = () => setSeconds(60);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="flex items-center justify-between rounded-2xl p-4" style={{ boxShadow: `inset 0 0 0 1px ${COLORS.line}` }}>
      <div className="text-2xl font-semibold tabular-nums" aria-live="polite">{mm}:{ss}</div>
      <div className="flex gap-2">
        <GlowButton ariaLabel="Start/Pause" onClick={() => setRunning((r) => !r)}>{running ? "Pause" : "Start"}</GlowButton>
        <GlowButton ariaLabel="Reset" onClick={reset}>Reset</GlowButton>
      </div>
    </div>
  );
}

function ProgressPanel({ progressPct, streak, history }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <div className="rounded-3xl p-6" style={{ background: COLORS.surface, boxShadow: `0 0 0 1px ${COLORS.line}` }}>
        <h4 className="mb-3 font-medium">Week Completion</h4>
        <div className="flex items-center justify-center">
          <ProgressRing value={progressPct} />
        </div>
      </div>
      <div className="rounded-3xl p-6" style={{ background: COLORS.surface, boxShadow: `0 0 0 1px ${COLORS.line}` }}>
        <h4 className="mb-2 font-medium">Streak</h4>
        <p className="text-4xl font-semibold">{streak} <span className="text-base opacity-70">days</span></p>
        <p className="mt-2 text-sm opacity-80">Consecutive days completed starting Day 1.</p>
      </div>
      <div className="rounded-3xl p-6" style={{ background: COLORS.surface, boxShadow: `0 0 0 1px ${COLORS.line}` }}>
        <h4 className="mb-2 font-medium">History (last 4)</h4>
        <div className="mt-3 flex items-end gap-2">
          {history.slice(-4).map((h) => (
            <div key={h.weekId} className="flex flex-col items-center gap-1">
              <div className="w-8 rounded-t" style={{ height: `${(h.completed / 7) * 80}px`, background: COLORS.primary, boxShadow: `0 0 12px ${COLORS.primary}AA` }} title={`${h.weekId}: ${h.completed}/7`} />
              <span className="text-[10px] opacity-70">{h.weekId.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfilePanel({ user, setUser, onResetWeek, onClearAll, onExport, onImport }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <div className="rounded-3xl p-6 md:col-span-2" style={{ background: COLORS.surface, boxShadow: `0 0 0 1px ${COLORS.line}` }}>
        <h4 className="mb-4 font-medium">Preferences</h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm opacity-80">Display Name</label>
            <input
              value={user.displayName}
              onChange={(e) => setUser({ ...user, displayName: e.target.value })}
              className="w-full rounded-2xl bg-transparent px-3 py-2 outline-none"
              style={{ boxShadow: `inset 0 0 0 1px ${COLORS.line}` }}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm opacity-80">Start of Week</label>
            <select
              value={user.startOfWeek}
              onChange={(e) => setUser({ ...user, startOfWeek: e.target.value })}
              className="w-full rounded-2xl bg-transparent px-3 py-2 outline-none"
              style={{ boxShadow: `inset 0 0 0 1px ${COLORS.line}` }}
            >
              <option value="monday">Monday</option>
              <option value="sunday">Sunday</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <input id="rm" type="checkbox" checked={user.reducedMotion} onChange={(e) => setUser({ ...user, reducedMotion: e.target.checked })} />
            <label htmlFor="rm">Reduced Motion</label>
          </div>
          <div className="flex items-center gap-3">
            <input id="hc" type="checkbox" checked={user.highContrast} onChange={(e) => setUser({ ...user, highContrast: e.target.checked })} />
            <label htmlFor="hc">Higher Contrast</label>
          </div>
        </div>
      </div>

      <div className="rounded-3xl p-6" style={{ background: COLORS.surface, boxShadow: `0 0 0 1px ${COLORS.line}` }}>
        <h4 className="mb-3 font-medium">Data</h4>
        <p className="text-sm opacity-80">Stored on this device only.</p>
        <div className="mt-4 flex flex-col gap-2">
          <GlowButton onClick={onExport}>Export Progress</GlowButton>
          <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl px-4 py-2" style={{ boxShadow: `inset 0 0 0 1px ${COLORS.line}` }}>
            Import Progress
            <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files && onImport(e.target.files[0])} />
          </label>
          <GlowButton onClick={onResetWeek}>Reset Week</GlowButton>
          <GlowButton onClick={onClearAll}>Clear All Local Data</GlowButton>
        </div>
      </div>
    </div>
  );
}

function Toast({ type = "info", children, onClose }) {
  const color = type === "success" ? COLORS.success : type === "error" ? "#ff6b6b" : COLORS.primary;
  useEffect(() => {
    const id = setTimeout(onClose, 2400);
    return () => clearTimeout(id);
  }, [onClose]);
  return (
    <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
      <div className="rounded-2xl px-4 py-2 text-sm" style={{ background: `${color}20`, color, boxShadow: `0 0 0 1px ${color}66, 0 12px 30px rgba(0,0,0,0.35)` }}>
        {children}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-10 border-t py-10 text-center text-xs opacity-70" style={{ borderColor: COLORS.line }}>
      <p>© {new Date().getFullYear()}FitMe@AlyeenWani</p>
    </footer>
  );
}
