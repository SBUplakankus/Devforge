import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  LayoutDashboard, Columns3, ListTodo, BarChart2, FileText,
  Link2, Settings, Timer, Plus, Trash2, Archive, RotateCcw,
  ChevronRight, ChevronDown, ExternalLink, Download, Upload,
  Pencil, X, Check, Calendar, Filter,
  FolderOpen, GripVertical, Clock, ArrowUp, ArrowRight,
  ArrowDown, Flame, TrendingUp, Flag
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const MOTD = [
  "Another day, another chance to ship something you're actually proud of.",
  "The backlog doesn't clear itself. But you already knew that.",
  "Today's the day that card finally moves to Done. Probably.",
  "Your future self will thank you for writing that comment.",
  "It's not a bug, it's a feature. Write it down anyway.",
  "Small steps. Tiny commits. Somehow it all adds up.",
  "The best game is the one that ships. Keep moving.",
  "Nobody's looking at your code except you and future-you. Be kind to both.",
  "One card. One hour. One win. That's a good day.",
  "Scope creep knocked. You didn't answer. Nice work.",
  "If the compiler isn't yelling, something is probably working.",
  "You're the only dev, the only designer, and the only QA. Heroic, honestly.",
  "Polish is for later. Working is for now.",
  "That feature you've been avoiding? Today might be the day.",
  "Progress is progress, even when it doesn't feel like it.",
  "Shipped imperfect beats perfect-never every single time.",
  "Your git history is a love letter to your future self. Make it readable.",
  "The game isn't going to make itself. Good thing you showed up.",
  "Three cards done is a great day. Two is fine. One still counts.",
  "Whatever you shipped last week — that exists now. That's something.",
  "Solo dev is a superpower. You can pivot without a meeting.",
  "The backlog is not a graveyard. It's a parking lot. Stuff comes back around.",
  "Deep focus incoming. Put the phone down. Probably.",
  "You picked up where you left off. That's the hardest part done.",
  "Not all progress shows on a kanban board. But it's still progress.",
  "Estimated: 2h. Actual: unknown. Classic.",
  "A working prototype is worth a thousand design docs.",
  "The fun part is just behind the boring part. Push through.",
  "Remember why you started this. Hold onto that.",
  "Console.Log debugging is a perfectly valid strategy.",
  "If it's in Review it basically already done. Almost.",
  "You don't need permission to ship your own game.",
  "Caffeine levels: sufficient. Let's go.",
  "Every feature started as a line on a backlog. Look at you go.",
  "Tiny games ship. Big games stall. Keep it scoped.",
  "You built something real. Not many people do that.",
  "The tutorial level of your game exists because you persisted.",
  "Zero bugs found today because you haven't run it yet.",
  "It works on your machine. That's a good start.",
  "This session counts. Even the quiet ones.",
];

const TAG_COLORS = {
  Feature:      "#6366f1",
  Bug:          "#ef4444",
  UI:           "#8b5cf6",
  Design:       "#f59e0b",
  Performance:  "#10b981",
  Tool:         "#06b6d4",
  Architecture: "#a855f7",
  Research:     "#f97316",
  Chore:        "#6b7280",
  Content:      "#ec4899",
};
const TAG_LIST = Object.keys(TAG_COLORS);

const PRIORITY = {
  High:   { color: "#ef4444", Icon: ArrowUp },
  Medium: { color: "#f59e0b", Icon: ArrowRight },
  Low:    { color: "#6b7280", Icon: ArrowDown },
};

const PALETTES = {
  midnight: { name: "Midnight", bg: "#0d0d10", sur: "#141417", sur2: "#1a1a1f", bd: "#252529", bd2: "#3a3a48", acc: "#7c6af7", dim: "#55556a", txt: "#e4e4f0", txt2: "#9898b0" },
  slate:    { name: "Slate",    bg: "#0d1117", sur: "#161b25", sur2: "#1b2232", bd: "#21303f", bd2: "#2d4255", acc: "#4f8ef0", dim: "#3d5070", txt: "#d8e4f8", txt2: "#8899bb" },
  zinc:     { name: "Zinc",     bg: "#101012", sur: "#18181c", sur2: "#1e1e23", bd: "#28282e", bd2: "#38383f", acc: "#a0a0b8", dim: "#48485a", txt: "#e8e8f0", txt2: "#888898" },
  forest:   { name: "Forest",   bg: "#0b1210", sur: "#111a15", sur2: "#162018", bd: "#1e2e22", bd2: "#253428", acc: "#3ecf8e", dim: "#2d5a3d", txt: "#d0f0e0", txt2: "#70b090" },
  amber:    { name: "Amber",    bg: "#110e08", sur: "#1a1610", sur2: "#201b12", bd: "#2a2215", bd2: "#3a2e1a", acc: "#e8a020", dim: "#5a4820", txt: "#f0e0c0", txt2: "#b09060" },
  rose:     { name: "Rose",     bg: "#120d10", sur: "#1c1018", sur2: "#221420", bd: "#2e1b28", bd2: "#3e2235", acc: "#e8446a", dim: "#5a2840", txt: "#f0d0dc", txt2: "#c08090" },
};

const STATUS_COLORS = { active: "#3ecf8e", paused: "#f59e0b", done: "#6366f1", archived: "#6b7280" };

const COL_PALETTE = ["#3f3f46", "#6366f1", "#f59e0b", "#10b981", "#a855f7", "#06b6d4"];

const CARD_STATES = ["Open", "In Review", "Blocked", "Testing", "Cancelled"];

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const DAY_MS = 86400000;
const ISO_DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const isObj = v => !!v && typeof v === "object" && !Array.isArray(v);
const isIsoDay = d => typeof d === "string" && ISO_DAY_RE.test(d);

const uid = () => (
  (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10)
);
const todayISO = () => new Date().toISOString().slice(0, 10);
const todayDay = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};
const formatDayLabel = day => isIsoDay(day)
  ? new Date(`${day}T12:00:00`).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })
  : "";
const todayLbl = () => formatDayLabel(todayDay());
const fmtDate = d => d ? new Date(d + "T12:00:00").toLocaleDateString("en-IE", { day: "numeric", month: "short" }) : "";
const isOverdue = d => d && new Date(d + "T23:59:59") < new Date();

const dayDiff = (a, b) => {
  if (!isIsoDay(a) || !isIsoDay(b)) return Infinity;
  return Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / DAY_MS);
};

const normalizeSession = s => {
  const startedIsoDay = typeof s?.started === "string" && isIsoDay(s.started.slice(0, 10)) ? s.started.slice(0, 10) : null;
  const day = isIsoDay(s?.day)
    ? s.day
    : (isIsoDay(s?.date) ? s.date : (startedIsoDay || todayDay()));
  return {
    id: typeof s?.id === "string" && s.id ? s.id : uid(),
    projectId: typeof s?.projectId === "string" && s.projectId ? s.projectId : null,
    projectName: typeof s?.projectName === "string" ? s.projectName : (typeof s?.project === "string" ? s.project : ""),
    note: typeof s?.note === "string" ? s.note : "",
    day,
    dateLabel: typeof s?.dateLabel === "string" && s.dateLabel ? s.dateLabel : (isIsoDay(day) ? formatDayLabel(day) : ""),
    started: typeof s?.started === "string" && s.started ? s.started : new Date().toISOString(),
    ended: typeof s?.ended === "string" && s.ended ? s.ended : new Date().toISOString(),
    duration: Number.isFinite(Number(s?.duration)) ? Math.max(0, Math.round(Number(s.duration))) : 0,
  };
};

const sessionBelongsToProject = (s, project) =>
  s.projectId === project.id || (!s.projectId && s.projectName === project.name);

const sessionStreak = sessions => {
  const days = [...new Set(sessions.map(s => s.day).filter(isIsoDay))].sort().reverse();
  if (!days.length) return 0;
  let k = 1;
  for (let i = 0; i < days.length - 1; i++) {
    if (dayDiff(days[i], days[i + 1]) === 1) k++;
    else break;
  }
  return k;
};

const buildLastNDays = (sessions, n = 14) => {
  const byDay = sessions.reduce((acc, s) => {
    if (!isIsoDay(s.day)) return acc;
    acc[s.day] = (acc[s.day] || 0) + s.duration;
    return acc;
  }, {});
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    const day = local.toISOString().slice(0, 10);
    return { day, v: byDay[day] || 0 };
  });
};

const sanitizeUrl = raw => {
  if (typeof raw !== "string" || !raw.trim()) return "";
  const trimmed = raw.trim();
  const withProto = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withProto);
    if (!["http:", "https:"].includes(u.protocol)) return "";
    return u.toString();
  } catch {
    return "";
  }
};

// ─────────────────────────────────────────────────────────────
// STORAGE  (cloud storage for project data, localStorage for sessions/scratch)
// ─────────────────────────────────────────────────────────────

const dbGet = async (key, fallback) => {
  try {
    const r = await window.storage.get(key);
    return r ? JSON.parse(r.value) : fallback;
  } catch { return fallback; }
};

const dbSet = async (key, val) => {
  try { await window.storage.set(key, JSON.stringify(val)); } catch {}
};

// Sessions — localStorage only (will become electron-store in app)
const getSessions = () => {
  try {
    const arr = JSON.parse(localStorage.getItem("dvf_sessions") || "[]");
    return Array.isArray(arr) ? arr.map(normalizeSession) : [];
  } catch { return []; }
};
const saveSessions = arr => {
  try { localStorage.setItem("dvf_sessions", JSON.stringify((Array.isArray(arr) ? arr : []).map(normalizeSession))); } catch {}
};

const getScratch = id => {
  try { return localStorage.getItem(`dvf_scratch_${id}`) || ""; } catch { return ""; }
};
const setScratch = (id, val) => {
  try { localStorage.setItem(`dvf_scratch_${id}`, val); } catch {}
};

// ─────────────────────────────────────────────────────────────
// FACTORIES
// ─────────────────────────────────────────────────────────────

const mkCard = (col, overrides = {}) => ({
  id: uid(), col, archived: false, createdAt: todayISO(),
  text: "", tag: "Feature", priority: "Medium",
  due: "", estimate: "", notes: "", state: "Open",
  ...overrides,
});

const mkProject = (overrides = {}) => ({
  id: uid(), name: "New Project", accent: "#6366f1",
  status: "active", description: "", tags: [],
  kanban: { cols: ["Backlog", "In Progress", "Needs Improvement", "Done"], cards: [] },
  notes: [], links: [],
  ...overrides,
});

// ─────────────────────────────────────────────────────────────
// DEFAULT DATA
// ─────────────────────────────────────────────────────────────

const mkDefaults = () => ({
  palette: "midnight",
  activeProjectId: "p1",
  projects: [
    mkProject({
      id: "p1", name: "Tower Defence", accent: "#10b981",
      status: "active", tags: ["Unity 6", "MonoBehaviour"],
      description: "Classic MonoBehaviour tower defence — waves, placement, upgrades, economy.",
      kanban: {
        cols: ["Backlog", "In Progress", "Needs Improvement", "Done"],
        cards: [
          mkCard("Backlog",            { id:"k1",  text:"Enemy waypoint path following",             tag:"Feature",     priority:"High",   estimate:"3h" }),
          mkCard("Backlog",            { id:"k2",  text:"Enemy health, damage & death",              tag:"Feature",     priority:"High",   estimate:"2h" }),
          mkCard("Backlog",            { id:"k3",  text:"Wave spawner (ScriptableObject per wave)",  tag:"Feature",     priority:"High",   estimate:"4h", notes:"SpawnPoint list, delay between enemies, wave gap timer" }),
          mkCard("Backlog",            { id:"k4",  text:"Enemy variants — fast, tank",               tag:"Design",      priority:"Medium", estimate:"3h" }),
          mkCard("In Progress",        { id:"k5",  text:"Grid placement system",                     tag:"Feature",     priority:"High",   estimate:"5h", notes:"GridManager singleton, world-to-cell snapping, occupied check" }),
          mkCard("In Progress",        { id:"k6",  text:"Tower targeting (nearest enemy)",           tag:"Feature",     priority:"High",   estimate:"3h" }),
          mkCard("Backlog",            { id:"k7",  text:"Tower shoot & basic projectile",            tag:"Feature",     priority:"High",   estimate:"3h" }),
          mkCard("Backlog",            { id:"k8",  text:"Projectile hit & apply damage",             tag:"Feature",     priority:"High",   estimate:"2h" }),
          mkCard("Backlog",            { id:"k9",  text:"Tower upgrade (2 tiers)",                   tag:"Feature",     priority:"Medium", estimate:"4h" }),
          mkCard("Backlog",            { id:"k10", text:"Tower sell for partial refund",             tag:"Feature",     priority:"Low",    estimate:"1h" }),
          mkCard("Backlog",            { id:"k11", text:"Range indicator on select / hover",         tag:"UI",          priority:"Medium", estimate:"2h" }),
          mkCard("Backlog",            { id:"k12", text:"Currency — earn on kill, spend on place",   tag:"Feature",     priority:"High",   estimate:"2h" }),
          mkCard("Backlog",            { id:"k13", text:"Lives & game-over on base reach",           tag:"Feature",     priority:"High",   estimate:"2h" }),
          mkCard("Backlog",            { id:"k14", text:"Wave start button & countdown",             tag:"Feature",     priority:"Medium", estimate:"2h" }),
          mkCard("Backlog",            { id:"k15", text:"HUD — gold, lives, wave number",            tag:"UI",          priority:"High",   estimate:"3h" }),
          mkCard("Backlog",            { id:"k16", text:"Tower shop panel",                          tag:"UI",          priority:"High",   estimate:"3h" }),
          mkCard("Backlog",            { id:"k17", text:"Tower info panel (stats + upgrade btn)",   tag:"UI",          priority:"Medium", estimate:"2h" }),
          mkCard("Backlog",            { id:"k18", text:"Game over & win screen",                   tag:"UI",          priority:"Medium", estimate:"2h" }),
          mkCard("Backlog",            { id:"k19", text:"Object pool for projectiles",              tag:"Performance", priority:"Medium", estimate:"2h" }),
          mkCard("Backlog",            { id:"k20", text:"Hit VFX & enemy death effect",             tag:"Design",      priority:"Low",    estimate:"2h" }),
          mkCard("Done",               { id:"k21", text:"Project setup & scene layout",             tag:"Chore",       priority:"High" }),
          mkCard("Done",               { id:"k22", text:"Tilemap — ground & path tiles",            tag:"Design",      priority:"Medium" }),
          mkCard("Done",               { id:"k23", text:"Camera pan & zoom",                        tag:"Feature",     priority:"Low" }),
        ],
      },
      notes: [
        {
          id: "n1", title: "Architecture",
          content: "# Architecture\n\n## Key MonoBehaviours\n\n- **GridManager** — singleton, tracks occupied cells, handles place/remove\n- **EnemySpawner** — reads WaveSO, spawns enemies on path start\n- **Enemy** — follows waypoint list, takes damage, fires OnDeath event\n- **Tower** — finds nearest target in range, fires at fire rate\n- **Projectile** — moves toward target, calls `TakeDamage` on hit\n- **GameManager** — currency, lives, wave state, game over\n\n## Events\n\nUsing C# `Action` delegates to keep systems decoupled.\n\n```csharp\npublic static event Action<int> OnGoldChanged;\npublic static event Action<Enemy> OnEnemyKilled;\npublic static event Action OnGameOver;\n```",
        },
        {
          id: "n2", title: "Design Notes",
          content: "# Design Notes\n\n## Tower Types (planned)\n\n- **Basic** — balanced, cheap\n- **Sniper** — long range, slow fire rate, high damage\n- **Slow** — reduces enemy speed in radius\n- **Cannon** — splash damage on impact\n\n## Enemy Types\n\n- **Basic** — standard stats\n- **Fast** — double speed, low health\n- **Tank** — slow, high health, high reward\n\n## Economy\n\n- Start gold: 150\n- Kill reward: scales with wave\n- Tower costs: 50 / 80 / 120 / 150\n- Sell refund: 60% of spent",
        },
        {
          id: "n3", title: "Dev Log",
          content: "## Week 1\n\nScene and tilemap done. Camera working. Next up is getting an enemy walking the path and the grid placement prototype.\n\n### Done\n- Project setup\n- Tilemap drawn\n- Camera controller\n\n### This week\n- Enemy path following\n- Grid placement MVP\n- Basic tower + shooting",
        },
      ],
      links: [
        { id: "l1", title: "Unity Docs",     url: "https://docs.unity3d.com",       group: "Dev" },
        { id: "l2", title: "GitHub",         url: "https://github.com",             group: "Dev" },
        { id: "l3", title: "itch.io",        url: "https://itch.io",                group: "Release" },
        { id: "l4", title: "YouTube Studio", url: "https://studio.youtube.com",     group: "Content" },
      ],
    }),
  ],
});

// ─────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────

const buildCSS = (accent, palKey) => {
  const pal = PALETTES[palKey] || PALETTES.midnight;
  const rgb = hexToRgb(accent);
  return `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg:   ${pal.bg};
  --s1:   ${pal.sur};
  --s2:   ${pal.sur2};
  --bd:   ${pal.bd};
  --bd2:  ${pal.bd2};
  --acc:  ${accent};
  --dim:  ${pal.dim};
  --txt:  ${pal.txt};
  --txt2: ${pal.txt2};
  --txt3: ${pal.dim};
  --acc-a: rgba(${rgb}, 0.12);
  --acc-b: rgba(${rgb}, 0.25);
  --r:    6px;
  --rs:   4px;
  --t:    all 0.11s ease;
  --f:    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
html, body, #root { height: 100%; overflow: hidden; background: var(--bg); font-family: var(--f); }
::-webkit-scrollbar { width: 3px; height: 3px; }
::-webkit-scrollbar-thumb { background: var(--bd); border-radius: 2px; }
::-webkit-scrollbar-track { background: transparent; }

/* Layout */
.app            { display: flex; height: 100vh; overflow: hidden; font-size: 13px; color: var(--txt); }
.main           { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; background: var(--bg); }
.scroll-area    { flex: 1; overflow-y: auto; padding: 18px 22px; }
.topbar         { height: 44px; display: flex; align-items: center; justify-content: space-between; padding: 0 22px; border-bottom: 1px solid var(--bd); flex-shrink: 0; }
.topbar-title   { font-size: 13px; font-weight: 600; }
.fullbleed      { height: calc(100vh - 0px); }

/* Sidebar */
.sb              { width: 210px; flex-shrink: 0; display: flex; flex-direction: column; background: var(--s1); border-right: 1px solid var(--bd); overflow: hidden; }
.sb-top          { padding: 14px 14px 10px; border-bottom: 1px solid var(--bd); }
.sb-logo         { font-size: 14px; font-weight: 700; letter-spacing: -0.01em; margin-bottom: 10px; }
.sb-scroll       { flex: 1; overflow-y: auto; padding: 6px 7px; }
.sb-scroll::-webkit-scrollbar { width: 0; }
.sb-sec          { font-size: 9.5px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--txt3); padding: 8px 7px 3px; }
.ni              { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: var(--rs); cursor: pointer; font-size: 12.5px; color: var(--txt3); transition: var(--t); user-select: none; margin-bottom: 1px; }
.ni:hover        { color: var(--txt); background: var(--s2); }
.ni.on           { color: var(--acc); background: var(--acc-a); }
.ni svg          { flex-shrink: 0; }
.proj-chip       { display: flex; align-items: center; gap: 7px; padding: 5px 8px; border-radius: var(--rs); cursor: pointer; font-size: 12px; color: var(--txt3); transition: var(--t); user-select: none; }
.proj-chip:hover { color: var(--txt); background: var(--s2); }
.pdot            { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.sb-foot         { padding: 10px 13px 12px; border-top: 1px solid var(--bd); font-size: 11px; color: var(--txt3); }
.sb-foot-row     { display: flex; justify-content: space-between; margin-bottom: 6px; }
.timer-indicator { display: flex; align-items: center; gap: 6px; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.25} }
.pulse-dot       { width: 6px; height: 6px; border-radius: 50%; background: var(--acc); animation: pulse 1.2s ease-in-out infinite; flex-shrink: 0; }

/* Project switcher dropdown */
.proj-sw         { position: relative; }
.proj-sw-btn     { width: 100%; display: flex; align-items: center; gap: 8px; padding: 6px 9px; background: var(--s2); border: 1px solid var(--bd); border-radius: var(--rs); cursor: pointer; transition: var(--t); }
.proj-sw-btn:hover { border-color: var(--bd2); }
.proj-sw-name    { flex: 1; font-size: 12px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.proj-dd         { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: var(--s1); border: 1px solid var(--bd); border-radius: var(--r); z-index: 50; box-shadow: 0 8px 24px rgba(0,0,0,.4); overflow: hidden; }
.proj-dd-item    { display: flex; align-items: center; gap: 8px; padding: 8px 10px; cursor: pointer; transition: background .1s; font-size: 12px; }
.proj-dd-item:hover { background: var(--s2); }
.proj-dd-item.on { background: var(--acc-a); }
.proj-dd-div     { height: 1px; background: var(--bd); }
.proj-dd-action  { display: flex; align-items: center; gap: 7px; padding: 8px 10px; cursor: pointer; color: var(--txt3); font-size: 12px; transition: color .1s; }
.proj-dd-action:hover { color: var(--txt); }

/* Project switcher screen */
.proj-screen     { position: fixed; inset: 0; background: var(--bg); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 300; padding: 32px; }
.proj-list       { display: flex; flex-direction: column; gap: 6px; width: 100%; max-width: 520px; margin-top: 24px; }
.proj-list-item  { display: flex; align-items: center; gap: 14px; padding: 14px 16px; background: var(--s1); border: 1px solid var(--bd); border-radius: var(--r); cursor: pointer; transition: var(--t); position: relative; overflow: hidden; }
.proj-list-item:hover { border-color: var(--bd2); background: var(--s2); }
.proj-list-item.on    { border-color: var(--acc); }
.proj-list-bar   { position: absolute; top: 0; left: 0; bottom: 0; width: 3px; }
.proj-list-new   { justify-content: center; color: var(--txt3); border-style: dashed; background: transparent; }
.proj-list-new:hover { background: var(--s1); }

/* Shared components */
.card         { background: var(--s1); border: 1px solid var(--bd); border-radius: var(--r); padding: 14px; }
.card-sm      { background: var(--s1); border: 1px solid var(--bd); border-radius: var(--r); padding: 10px 12px; }
.lbl          { font-size: 9.5px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--txt3); margin-bottom: 8px; }
.pbar         { height: 3px; background: var(--bd); border-radius: 2px; overflow: hidden; }
.pbar-md      { height: 5px; }
.pfill        { height: 100%; border-radius: 2px; transition: width .4s ease; }
.tag-pill     { display: inline-flex; align-items: center; font-size: 10px; padding: 1px 6px; border-radius: 3px; font-weight: 500; border: 1px solid transparent; white-space: nowrap; line-height: 1.7; }
.status-dot   { width: 6px; height: 6px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
.divider      { height: 1px; background: var(--bd); margin: 10px 0; }

/* Buttons */
.btn         { display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: var(--rs); font-family: var(--f); font-size: 12px; font-weight: 500; cursor: pointer; border: 1px solid var(--bd); background: none; color: var(--txt3); transition: var(--t); white-space: nowrap; line-height: 1.2; }
.btn:hover   { color: var(--txt); border-color: var(--bd2); background: var(--s2); }
.btn-p       { background: var(--acc); border-color: var(--acc); color: #fff; font-weight: 600; }
.btn-p:hover { opacity: .88; background: var(--acc); border-color: var(--acc); color: #fff; }
.btn-ghost   { border-color: transparent; padding: 4px 5px; }
.btn-ghost:hover { border-color: var(--bd); background: var(--s2); }
.btn-danger:hover { color: #ef4444; border-color: #ef4444; background: rgba(239,68,68,.08); }
.btn-sm      { padding: 3px 8px; font-size: 11px; }
.btn-icon    { padding: 4px; }

/* Inputs */
.inp         { background: var(--s2); border: 1px solid var(--bd); border-radius: var(--rs); color: var(--txt); font-family: var(--f); font-size: 12.5px; padding: 6px 9px; outline: none; width: 100%; transition: border-color .1s; }
.inp:focus   { border-color: var(--acc); }
.inp::placeholder { color: var(--txt3); }
textarea.inp { resize: vertical; line-height: 1.65; min-height: 58px; }
select.inp   { cursor: pointer; }
input[type=checkbox] { accent-color: var(--acc); width: 14px; height: 14px; cursor: pointer; flex-shrink: 0; }
input[type=color]    { border: 1px solid var(--bd); border-radius: var(--rs); background: var(--s2); cursor: pointer; padding: 2px; width: 30px; height: 26px; }
input[type=date].inp { color-scheme: dark; }

/* Modal */
.backdrop   { position: fixed; inset: 0; background: rgba(0,0,0,.72); display: flex; align-items: center; justify-content: center; z-index: 200; backdrop-filter: blur(2px); }
.modal      { background: var(--s1); border: 1px solid var(--bd); border-radius: var(--r); padding: 20px; min-width: 320px; max-width: 500px; width: 92vw; max-height: 88vh; overflow-y: auto; }
.modal-title { font-size: 14px; font-weight: 600; margin-bottom: 14px; }
.m-row      { margin-bottom: 9px; }
.m-lbl      { font-size: 10px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--txt3); margin-bottom: 4px; }
.m-actions  { display: flex; gap: 7px; justify-content: flex-end; margin-top: 14px; }

/* ── Overview ── */
.ov-col    { display: flex; flex-direction: column; gap: 11px; }
.ov-row2   { display: grid; grid-template-columns: 1fr 1fr; gap: 11px; margin-bottom: 0; }
.ov-row4   { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 0; }
.ov-row3   { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 11px; }
.stat-card  { padding: 12px 14px; }
.stat-val   { font-size: 22px; font-weight: 300; line-height: 1; letter-spacing: -.02em; margin-bottom: 3px; }
.stat-lbl   { font-size: 10px; color: var(--txt3); font-weight: 500; }
.card-row   { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--bd); }

/* ── Kanban ── */
.board-wrap  { display: flex; flex-direction: column; height: calc(100vh - 44px); overflow: hidden; }
.board-bar   { display: flex; align-items: center; gap: 6px; padding: 8px 22px; border-bottom: 1px solid var(--bd); flex-shrink: 0; flex-wrap: wrap; }
.board-cols  { flex: 1; display: flex; gap: 10px; padding: 13px 22px; overflow-x: auto; overflow-y: hidden; }
.kcol        { width: 244px; flex-shrink: 0; display: flex; flex-direction: column; background: var(--s1); border: 1px solid var(--bd); border-radius: var(--r); max-height: 100%; transition: border-color .12s; }
.kcol.dov    { border-color: var(--acc); background: var(--acc-a); }
.kcol-head   { padding: 9px 12px; border-bottom: 1px solid var(--bd); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; cursor: grab; user-select: none; }
.kcol-name   { font-size: 10.5px; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; }
.kcol-count  { font-size: 10px; color: var(--txt3); background: var(--bg); border: 1px solid var(--bd); padding: 1px 7px; border-radius: 9px; }
.kcol-cards  { flex: 1; overflow-y: auto; padding: 6px; display: flex; flex-direction: column; gap: 5px; }
.kcard       { background: var(--bg); border: 1px solid var(--bd); border-radius: var(--rs); padding: 9px 10px; cursor: grab; transition: border-color .1s, box-shadow .1s, transform .1s; position: relative; user-select: none; }
.kcard:hover { border-color: var(--bd2); box-shadow: 0 4px 14px rgba(0,0,0,.3); transform: translateY(-1px); }
.kcard.dragging { opacity: .2; transform: rotate(1.5deg); cursor: grabbing; }
.kcard-actions  { display: none; position: absolute; top: 5px; right: 5px; gap: 2px; }
.kcard:hover .kcard-actions { display: flex; }
.kadd        { display: flex; align-items: center; justify-content: center; gap: 5px; margin: 5px 6px 6px; padding: 6px; border: 1px dashed var(--bd); border-radius: var(--rs); font-size: 11.5px; color: var(--txt3); cursor: pointer; transition: var(--t); flex-shrink: 0; }
.kadd:hover  { color: var(--acc); border-color: var(--acc-b); background: var(--acc-a); }
.kadd-form   { margin: 4px 6px 6px; display: flex; flex-direction: column; gap: 5px; flex-shrink: 0; }
.arc-wrap    { border-top: 1px solid var(--bd); padding: 5px 7px; flex-shrink: 0; }
.arc-toggle  { display: flex; align-items: center; gap: 5px; font-size: 10px; color: var(--txt3); cursor: pointer; padding: 3px; border-radius: 3px; transition: color .1s; }
.arc-toggle:hover { color: var(--txt); }
.arc-item    { display: flex; align-items: center; justify-content: space-between; gap: 7px; padding: 5px 7px; margin-top: 3px; background: var(--s2); border: 1px solid var(--bd); border-radius: var(--rs); font-size: 11px; color: var(--txt3); }

/* ── Tasks ── */
.tasks-wrap  { display: flex; flex-direction: column; height: calc(100vh - 44px); overflow: hidden; }
.tasks-bar   { display: flex; align-items: center; gap: 6px; padding: 8px 22px; border-bottom: 1px solid var(--bd); flex-shrink: 0; flex-wrap: wrap; }
.tasks-body  { flex: 1; overflow-y: auto; padding: 14px 22px; }
.task-row    { display: flex; align-items: center; gap: 9px; padding: 7px 10px; border-radius: var(--rs); transition: background .1s; border: 1px solid transparent; margin-bottom: 2px; }
.task-row:hover { background: var(--s1); border-color: var(--bd); }
.task-text   { flex: 1; font-size: 12.5px; line-height: 1.4; }
.task-done   { color: var(--txt3); text-decoration: line-through; }

/* ── Analytics ── */
.an-grid4   { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 12px; }
.an-grid2   { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
.an-grid21  { display: grid; grid-template-columns: 2fr 1fr; gap: 10px; margin-bottom: 12px; }
.an-val     { font-size: 24px; font-weight: 300; line-height: 1; letter-spacing: -.02em; margin-bottom: 3px; }
.an-lbl     { font-size: 10px; color: var(--txt3); font-weight: 500; }
.bar-chart  { display: flex; align-items: flex-end; gap: 4px; }
.bar-col    { display: flex; flex-direction: column; align-items: center; gap: 3px; flex: 1; }
.bar-fill   { width: 100%; border-radius: 2px 2px 0 0; min-height: 2px; transition: height .3s ease; }
.bar-lbl    { font-size: 8.5px; color: var(--txt3); text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }

/* ── Notes ── */
.notes-layout { display: grid; grid-template-columns: 195px 1fr; height: calc(100vh - 44px); }
.notes-sb     { border-right: 1px solid var(--bd); overflow-y: auto; display: flex; flex-direction: column; background: var(--s1); }
.note-item    { padding: 9px 14px; border-bottom: 1px solid var(--bd); cursor: pointer; transition: background .1s; }
.note-item:hover { background: var(--s2); }
.note-item.on   { background: var(--acc-a); border-left: 2px solid var(--acc); padding-left: 12px; }
.note-ed        { display: flex; flex-direction: column; overflow: hidden; }
.note-ti        { background: transparent; border: none; border-bottom: 1px solid var(--bd); padding: 13px 20px; font-family: var(--f); font-size: 16px; font-weight: 600; color: var(--txt); outline: none; width: 100%; flex-shrink: 0; }
.note-bi        { flex: 1; background: transparent; border: none; padding: 14px 20px; font-family: var(--f); font-size: 13px; line-height: 1.75; color: var(--txt); outline: none; resize: none; }
.note-preview   { flex: 1; overflow-y: auto; padding: 14px 20px; font-size: 13px; line-height: 1.75; color: var(--txt2); }
.note-preview h1 { font-size: 20px; font-weight: 700; color: var(--txt); margin: 16px 0 8px; }
.note-preview h2 { font-size: 16px; font-weight: 600; color: var(--txt); margin: 14px 0 7px; }
.note-preview h3 { font-size: 13px; font-weight: 600; color: var(--txt3); text-transform: uppercase; letter-spacing: .05em; margin: 12px 0 5px; }
.note-preview p  { margin: 2px 0; }
.note-preview ul, .note-preview ol { padding-left: 18px; margin: 5px 0; }
.note-preview li { padding: 2px 0; }
.note-preview code { font-family: monospace; font-size: .9em; background: var(--s2); padding: 1px 5px; border-radius: 3px; color: var(--acc); }
.note-preview pre { background: var(--s2); border: 1px solid var(--bd); border-radius: 5px; padding: 11px 13px; margin: 8px 0; overflow-x: auto; }
.note-preview pre code { background: none; padding: 0; }
.note-preview hr { border: none; border-top: 1px solid var(--bd); margin: 12px 0; }
.note-preview blockquote { border-left: 3px solid var(--acc); padding-left: 12px; color: var(--txt3); font-style: italic; margin: 7px 0; }
.note-preview a { color: var(--acc); text-decoration: underline; }
.note-preview strong { font-weight: 600; color: var(--txt); }

/* ── Links ── */
.link-row    { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: var(--rs); border: 1px solid transparent; text-decoration: none; color: var(--txt); transition: var(--t); margin-bottom: 2px; }
.link-row:hover { background: var(--s1); border-color: var(--bd); }

/* ── Settings ── */
.set-grid   { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.pal-grid   { display: grid; grid-template-columns: repeat(3,1fr); gap: 7px; }
.pal-sw     { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border: 1px solid var(--bd); border-radius: var(--rs); cursor: pointer; transition: var(--t); }
.pal-sw:hover { border-color: var(--bd2); }
.pal-sw.on  { border-color: var(--acc); background: var(--acc-a); }
.pal-dot    { width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0; }
.proj-edit-row { display: flex; align-items: center; gap: 7px; padding: 8px 10px; background: var(--s2); border: 1px solid var(--bd); border-radius: var(--rs); margin-bottom: 6px; }
.col-row    { display: flex; align-items: center; gap: 8px; padding: 7px 10px; background: var(--s2); border: 1px solid var(--bd); border-radius: var(--rs); margin-bottom: 5px; }

/* ── Timer ── */
.timer-display { font-size: 68px; font-weight: 200; letter-spacing: -.03em; line-height: 1; font-variant-numeric: tabular-nums; transition: color .2s; }
.timer-grid5   { display: grid; grid-template-columns: repeat(5,1fr); gap: 10px; margin-bottom: 12px; }
.timer-stat    { text-align: center; padding: 12px 8px; }
.timer-stat-val { font-size: 18px; font-weight: 500; letter-spacing: -.02em; margin-bottom: 3px; }
.timer-stat-lbl { font-size: 10px; color: var(--txt3); text-transform: uppercase; letter-spacing: .07em; }
.session-tbl-hdr { display: grid; grid-template-columns: 1fr 80px 1fr 22px; gap: 8px; padding: 0 0 6px; border-bottom: 1px solid var(--bd); font-size: 10px; font-weight: 600; letter-spacing: .07em; text-transform: uppercase; color: var(--txt3); }
.session-row     { display: grid; grid-template-columns: 1fr 80px 1fr 22px; gap: 8px; padding: 7px 0; border-bottom: 1px solid var(--bd); align-items: center; font-size: 12px; }
`;
};

// ─────────────────────────────────────────────────────────────
// MARKDOWN RENDERER
// ─────────────────────────────────────────────────────────────

function renderMd(raw, accent) {
  if (!raw?.trim()) return null;
  const lines = raw.split("\n");
  const out = [];
  let i = 0;

  const inline = (text) => {
    const parts = [];
    let key = 0, last = 0;
    const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) parts.push(<span key={key++}>{text.slice(last, m.index)}</span>);
      if (m[2]) parts.push(<strong key={key++}>{m[2]}</strong>);
      else if (m[3]) parts.push(<em key={key++}>{m[3]}</em>);
      else if (m[4]) parts.push(<code key={key++}>{m[4]}</code>);
      else if (m[5]) parts.push(<a key={key++} href={m[6]} target="_blank" rel="noopener noreferrer">{m[5]}</a>);
      last = m.index + m[0].length;
    }
    if (last < text.length) parts.push(<span key={key++}>{text.slice(last)}</span>);
    return parts.length ? parts : text;
  };

  while (i < lines.length) {
    const line = lines[i];
    const h1 = line.match(/^# (.+)/);
    const h2 = line.match(/^## (.+)/);
    const h3 = line.match(/^### (.+)/);
    if (h1) { out.push(<h1 key={i}>{inline(h1[1])}</h1>); i++; continue; }
    if (h2) { out.push(<h2 key={i}>{inline(h2[1])}</h2>); i++; continue; }
    if (h3) { out.push(<h3 key={i}>{inline(h3[1])}</h3>); i++; continue; }
    if (line.match(/^---+$/)) { out.push(<hr key={i} />); i++; continue; }
    if (line.startsWith("> ")) { out.push(<blockquote key={i}>{inline(line.slice(2))}</blockquote>); i++; continue; }
    if (line.startsWith("```")) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { codeLines.push(lines[i]); i++; }
      out.push(<pre key={i}><code>{codeLines.join("\n")}</code></pre>);
      i++; continue;
    }
    if (line.match(/^[-*] /)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^[-*] /)) {
        items.push(<li key={i}>{inline(lines[i].slice(2))}</li>); i++;
      }
      out.push(<ul key={`ul${i}`}>{items}</ul>); continue;
    }
    if (line.match(/^\d+\. /)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        items.push(<li key={i}>{inline(lines[i].replace(/^\d+\. /, ""))}</li>); i++;
      }
      out.push(<ol key={`ol${i}`}>{items}</ol>); continue;
    }
    if (line.trim() === "") { out.push(<div key={i} style={{ height: 6 }} />); i++; continue; }
    out.push(<p key={i}>{inline(line)}</p>);
    i++;
  }
  return out;
}

// ─────────────────────────────────────────────────────────────
// SMALL SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────

function TagPill({ tag }) {
  const c = TAG_COLORS[tag] || "#6b7280";
  return <span className="tag-pill" style={{ color: c, background: `${c}18`, borderColor: `${c}30` }}>{tag}</span>;
}

function PriIcon({ priority, size = 11 }) {
  const p = PRIORITY[priority];
  if (!p) return null;
  const { color, Icon } = p;
  return <Icon size={size} color={color} style={{ flexShrink: 0 }} />;
}

function BarChart({ data, h = 70, color }) {
  const max = Math.max(...data.map(d => d.v), 1);
  return (
    <div className="bar-chart" style={{ height: h, alignItems: "flex-end" }}>
      {data.map((d, i) => (
        <div key={i} className="bar-col" style={{ height: "100%" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
            <div className="bar-fill" style={{
              height: `${Math.max((d.v / max) * 100, d.v > 0 ? 5 : 0)}%`,
              background: d.c || color || "var(--acc)", opacity: .85,
            }} />
          </div>
          {d.l && <div className="bar-lbl">{d.l}</div>}
        </div>
      ))}
    </div>
  );
}

function DonutChart({ segments, size = 120, thickness = 20, label, sub }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const cx = size / 2, cy = size / 2;
  const startAngle = -Math.PI / 2;
  const toXY = a => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  const arcPath = (s, e) => {
    const a0 = startAngle + s * 2 * Math.PI;
    const a1 = startAngle + e * 2 * Math.PI;
    const p0 = toXY(a0), p1 = toXY(a1);
    return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${(e - s) > .5 ? 1 : 0} 1 ${p1.x} ${p1.y}`;
  };

  let offset = 0;
  const arcs = segments.filter(s => s.value > 0).map(s => {
    const frac = s.value / (total || 1);
    const start = offset; offset += frac;
    return { ...s, frac, start };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#27272a" strokeWidth={thickness} />
      {arcs.map((seg, i) => {
        const gap = 0.007;
        const s = seg.start + gap / 2;
        const e = seg.start + seg.frac - gap / 2;
        if (e <= s) return null;
        return <path key={i} d={arcPath(s, e)} fill="none" stroke={seg.color} strokeWidth={thickness} strokeLinecap="butt" opacity={.88} />;
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#e4e4f0" fontSize="17" fontWeight="300" fontFamily="-apple-system,sans-serif" letterSpacing="-0.5">{label}</text>
      <text x={cx} y={cy + 11} textAnchor="middle" fill="#55556a" fontSize="10" fontFamily="-apple-system,sans-serif">{sub || ""}</text>
    </svg>
  );
}

function DonutLegend({ segments }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 0 }}>
      {segments.filter(s => s.value > 0).map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.color, flexShrink: 0, display: "inline-block" }} />
          <span style={{ fontSize: 11, color: "var(--txt2)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</span>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--txt)", flexShrink: 0 }}>{s.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PROJECT SWITCHER SCREEN
// ─────────────────────────────────────────────────────────────

function ProjectSwitcherScreen({ projects, activeId, onSelect, onNew }) {
  return (
    <div className="proj-screen">
      <div style={{ textAlign: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.02em", color: "var(--txt)", marginBottom: 4 }}>Devforge</div>
        <div style={{ fontSize: 12.5, color: "var(--txt3)" }}>Select a project</div>
      </div>

      <div className="proj-list">
        {projects.map(p => {
          const cards = p.kanban.cards.filter(c => !c.archived);
          const done  = cards.filter(c => c.col === "Done").length;
          const pct   = cards.length > 0 ? Math.round(done / cards.length * 100) : 0;
          const isActive = p.id === activeId;
          return (
            <div
              key={p.id}
              className={`proj-list-item${isActive ? " on" : ""}`}
              onClick={() => onSelect(p.id)}
              style={{ "--acc": p.accent }}
            >
              {/* Left accent bar */}
              <div className="proj-list-bar" style={{ background: p.accent }} />

              {/* Colour dot */}
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: p.accent, flexShrink: 0, display: "inline-block", marginLeft: 4 }} />

              {/* Main content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--txt)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.name}
                </div>
                {p.description && (
                  <div style={{ fontSize: 11, color: "var(--txt3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.description}
                  </div>
                )}
              </div>

              {/* Tags */}
              {p.tags.length > 0 && (
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  {p.tags.slice(0, 3).map(t => (
                    <span key={t} style={{ fontSize: 9.5, color: "var(--txt3)", background: "var(--s2)", border: "1px solid var(--bd)", borderRadius: 3, padding: "1px 6px" }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Progress + status */}
              <div style={{ flexShrink: 0, textAlign: "right", minWidth: 64 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: p.accent, marginBottom: 3 }}>{pct}%</div>
                <div style={{ fontSize: 10, color: STATUS_COLORS[p.status] || "var(--txt3)", textTransform: "capitalize" }}>{p.status}</div>
              </div>
            </div>
          );
        })}

        {/* New project */}
        <div className="proj-list-item proj-list-new" onClick={onNew}>
          <Plus size={14} style={{ color: "var(--txt3)" }} />
          <span style={{ fontSize: 12.5, color: "var(--txt3)" }}>New project</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// OVERVIEW
// ─────────────────────────────────────────────────────────────

function Overview({ project, updateProject }) {
  const [scratchpad,  setScratchpad]  = useState(() => getScratch(project.id));
  const [scratchEdit, setScratchEdit] = useState(false);
  const [quickText,   setQuickText]   = useState("");
  const [quickCol,    setQuickCol]    = useState(project.kanban.cols[0] || "Backlog");
  const [quickTag,    setQuickTag]    = useState("Feature");
  const [quickPri,    setQuickPri]    = useState("Medium");
  const [motd]                        = useState(() => MOTD[Math.floor(Math.random() * MOTD.length)]);

  // Sync scratch when project changes
  useEffect(() => {
    setScratchpad(getScratch(project.id));
    setScratchEdit(false);
    setQuickCol(project.kanban.cols[0] || "Backlog");
  }, [project.id]);

  const saveScratch = v => { setScratchpad(v); setScratch(project.id, v); };

  const addQuickCard = () => {
    if (!quickText.trim()) return;
    updateProject(p => ({
      ...p,
      kanban: { ...p.kanban, cards: [...p.kanban.cards, mkCard(quickCol, { text: quickText.trim(), tag: quickTag, priority: quickPri })] },
    }));
    setQuickText("");
  };

  // Derived data
  const cards      = project.kanban.cards.filter(c => !c.archived);
  const done       = cards.filter(c => c.col === "Done").length;
  const total      = cards.length;
  const pct        = total > 0 ? Math.round(done / total * 100) : 0;
  const inProg     = cards.filter(c => c.col === "In Progress");
  const overdue    = cards.filter(c => isOverdue(c.due) && c.col !== "Done");
  const dueSoon    = cards.filter(c => {
    if (!c.due || c.col === "Done" || isOverdue(c.due)) return false;
    return Math.ceil((new Date(c.due + "T23:59:59") - new Date()) / 86400000) <= 5;
  });
  const recentDone = [...cards.filter(c => c.col === "Done")].slice(-8).reverse();
  const stale      = inProg.filter(c => c.createdAt && Math.ceil((new Date() - new Date(c.createdAt)) / 86400000) > 7);
  const blocked    = cards.filter(c => c.state === "Blocked");
  const highOpen   = cards.filter(c => c.priority === "High" && c.col !== "Done");
  const noEst      = cards.filter(c => !c.estimate && c.col !== "Done" && c.col !== project.kanban.cols[0]);
  const hasIssue   = blocked.length > 0 || stale.length > 0;

  // Session data
  const projSessions = getSessions().filter(s => s.project === project.name);
  const todaySessions = projSessions.filter(s => s.date === todayLbl());
  const todaySecs     = todaySessions.reduce((a, s) => a + s.duration, 0);
  const totalSecs     = projSessions.reduce((a, s) => a + s.duration, 0);
  const lastSession   = projSessions[0] ?? null;
  const noToday       = todaySessions.length === 0;

  const sessionStreak = (() => {
    if (!projSessions.length) return 0;
    const days = [...new Set(projSessions.map(s => s.date))].sort().reverse();
    let k = 1, i = 0;
    while (i < days.length - 1) {
      if ((new Date(days[i]) - new Date(days[i + 1])) / 86400000 <= 1.5) { k++; i++; } else break;
    }
    return k;
  })();

  const today = new Date().toLocaleDateString("en-IE", { weekday: "long", day: "numeric", month: "long" });

  const CardRow = ({ card, dim = false }) => {
    const od = isOverdue(card.due) && card.col !== "Done";
    return (
      <div className="card-row">
        <PriIcon priority={card.priority} />
        <span style={{ flex: 1, fontSize: 12.5, color: dim ? "var(--txt3)" : "var(--txt)", textDecoration: dim ? "line-through" : "none" }}>{card.text}</span>
        {card.due && <span style={{ fontSize: 10, color: od ? "#ef4444" : "var(--txt3)", display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}><Calendar size={9} />{fmtDate(card.due)}</span>}
        <TagPill tag={card.tag} />
      </div>
    );
  };

  return (
    <div className="scroll-area">
      <div className="ov-col">

        {/* ── Intro card ── */}
        <div className="card">
          {/* MOTD */}
          <div style={{ fontSize: 12, color: "var(--acc)", fontStyle: "italic", lineHeight: 1.55, paddingLeft: 10, borderLeft: "2px solid var(--acc)", marginBottom: 12 }}>
            {motd}
          </div>

          {/* Project name + date + description */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-.01em", color: "var(--txt)", marginBottom: 2 }}>{project.name}</div>
              <div style={{ fontSize: 11, color: "var(--txt3)", marginBottom: project.description ? 6 : 0 }}>{today}</div>
              {project.description && <div style={{ fontSize: 12, color: "var(--txt3)", lineHeight: 1.55 }}>{project.description}</div>}
            </div>
            {/* Session stats — vertical slots */}
            <div style={{ display: "flex", flexDirection: "column", gap: 3, flexShrink: 0, minWidth: 160 }}>
              {[
                { Icon: Clock,       label: "Today",        value: todaySecs > 0 ? fmtDuration(todaySecs) : "—",             accent: todaySecs > 0 },
                { Icon: TrendingUp,  label: "Total time",   value: totalSecs > 0 ? fmtDuration(totalSecs) : "—",             accent: false },
                { Icon: Flame,       label: "Streak",       value: sessionStreak > 0 ? `${sessionStreak}d` : "—",           accent: sessionStreak >= 3, warn: false },
                { Icon: Timer,       label: "Last session", value: lastSession ? fmtDuration(lastSession.duration) : "—",   accent: false, warn: noToday && !!lastSession },
              ].map(({ Icon, label, value, accent, warn }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 9px", borderRadius: "var(--rs)", background: "var(--s2)" }}>
                  <Icon size={11} style={{ color: "var(--txt3)", flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: "var(--txt3)", flex: 1 }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: warn ? "#f59e0b" : accent ? "var(--acc)" : "var(--txt)" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          {project.tags.length > 0 && (
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
              {project.tags.map(t => (
                <span key={t} style={{ fontSize: 10, color: "var(--txt3)", background: "var(--s2)", border: "1px solid var(--bd)", borderRadius: 3, padding: "1px 7px" }}>#{t}</span>
              ))}
            </div>
          )}

          {/* Progress */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--txt3)", marginBottom: 5 }}>
            <span>{done} of {total} cards done</span>
            <span style={{ color: "var(--acc)", fontWeight: 600 }}>{pct}%</span>
          </div>
          <div className="pbar pbar-md">
            <div className="pfill" style={{ width: `${pct}%`, background: project.accent }} />
          </div>
        </div>

        {/* ── In Progress ── */}
        <div className="card">
          <div className="lbl">In progress · {inProg.length}</div>
          {inProg.length === 0
            ? <div style={{ fontSize: 12, color: "var(--txt3)", fontStyle: "italic" }}>Nothing in progress.</div>
            : inProg.map(c => <CardRow key={c.id} card={c} />)
          }
        </div>

        {/* ── Overdue / Due soon ── */}
        <div className="card">
          {overdue.length > 0 && <>
            <div className="lbl" style={{ color: "#ef4444" }}>Overdue · {overdue.length}</div>
            {overdue.map(c => <CardRow key={c.id} card={c} />)}
            {dueSoon.length > 0 && <div className="divider" />}
          </>}
          {dueSoon.length > 0 && <>
            <div className="lbl">Due within 5 days · {dueSoon.length}</div>
            {dueSoon.map(c => <CardRow key={c.id} card={c} />)}
          </>}
          {overdue.length === 0 && dueSoon.length === 0 && <>
            <div className="lbl">Upcoming</div>
            <div style={{ fontSize: 12, color: "var(--txt3)", fontStyle: "italic" }}>Nothing due within 5 days.</div>
          </>}
        </div>

        {/* ── Quick add + Scratch side by side ── */}
        <div className="ov-row2">
          <div className="card">
            <div className="lbl">Quick add</div>
            <input className="inp" style={{ marginBottom: 7 }} placeholder="Card title… Enter to add"
              value={quickText} onChange={e => setQuickText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addQuickCard()} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5, marginBottom: 7 }}>
              <select className="inp" value={quickCol} onChange={e => setQuickCol(e.target.value)}>
                {project.kanban.cols.map(c => <option key={c}>{c}</option>)}
              </select>
              <select className="inp" value={quickTag} onChange={e => setQuickTag(e.target.value)}>
                {TAG_LIST.map(t => <option key={t}>{t}</option>)}
              </select>
              <select className="inp" value={quickPri} onChange={e => setQuickPri(e.target.value)}>
                {Object.keys(PRIORITY).map(k => <option key={k}>{k}</option>)}
              </select>
            </div>
            <button className="btn btn-p" style={{ width: "100%", justifyContent: "center" }} onClick={addQuickCard}>
              <Plus size={12} />Add to board
            </button>
          </div>

          <div className="card" style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div className="lbl" style={{ marginBottom: 0 }}>Scratch pad</div>
              <button className="btn btn-sm btn-ghost" onClick={() => setScratchEdit(v => !v)}>
                <Pencil size={10} />{scratchEdit ? "Done" : "Edit"}
              </button>
            </div>
            {scratchEdit
              ? <textarea className="inp" autoFocus style={{ flex: 1, minHeight: 90, fontSize: 12.5, lineHeight: 1.65 }}
                  value={scratchpad} onChange={e => saveScratch(e.target.value)}
                  placeholder="Jot anything — thoughts, links, next steps…" />
              : <div onClick={() => setScratchEdit(true)} style={{ flex: 1, minHeight: 80, fontSize: 12.5, lineHeight: 1.65, color: scratchpad ? "var(--txt2)" : "var(--txt3)", fontStyle: scratchpad ? "normal" : "italic", whiteSpace: "pre-wrap", cursor: "text" }}>
                  {scratchpad || "Click to write…"}
                </div>
            }
          </div>
        </div>

        {/* ── Recently completed ── */}
        <div className="card">
          <div className="lbl">Recently completed · {done}</div>
          {recentDone.length === 0
            ? <div style={{ fontSize: 12, color: "var(--txt3)", fontStyle: "italic" }}>Nothing done yet.</div>
            : recentDone.map(c => <CardRow key={c.id} card={c} dim />)
          }
        </div>

        {/* ── Project health ── */}
        <div className="card">
          <div className="lbl" style={{ marginBottom: 10 }}>Project health</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: hasIssue ? 12 : 0 }}>
            {[
              { v: blocked.length,  l: "Blocked",       c: blocked.length  > 0 ? "#ef4444" : "var(--txt3)" },
              { v: stale.length,    l: "Stale (>7d)",   c: stale.length    > 0 ? "#f59e0b" : "var(--txt3)" },
              { v: highOpen.length, l: "High pri open", c: highOpen.length > 0 ? "#f59e0b" : "var(--txt3)" },
              { v: noEst.length,    l: "No estimate",   c: "var(--txt3)" },
            ].map(s => (
              <div key={s.l} style={{ padding: "8px 10px", background: "var(--s2)", borderRadius: "var(--rs)", border: "1px solid var(--bd)", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 300, color: s.c, letterSpacing: "-.02em", lineHeight: 1, marginBottom: 3 }}>{s.v}</div>
                <div style={{ fontSize: 10, color: "var(--txt3)" }}>{s.l}</div>
              </div>
            ))}
          </div>
          {blocked.length > 0 && <>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".07em", textTransform: "uppercase", color: "#ef4444", marginBottom: 5 }}>Blocked</div>
            {blocked.map(c => <CardRow key={c.id} card={c} />)}
          </>}
          {stale.length > 0 && <>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".07em", textTransform: "uppercase", color: "var(--txt3)", marginTop: blocked.length > 0 ? 10 : 0, marginBottom: 5 }}>Stale in progress</div>
            {stale.map(c => <CardRow key={c.id} card={c} />)}
          </>}
          {!hasIssue && <div style={{ fontSize: 12, color: "var(--txt3)", fontStyle: "italic" }}>No issues detected.</div>}
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// KANBAN
// ─────────────────────────────────────────────────────────────

function Kanban({ project, updateProject }) {
  const { kanban } = project;
  const [dragging,     setDragging]     = useState(null); // { id, col }
  const [dragColOver,  setDragColOver]  = useState(null);
  const [draggingCol,  setDraggingCol]  = useState(null);
  const [dropOver,     setDropOver]     = useState(null);
  const [addingTo,     setAddingTo]     = useState(null);
  const [newText,      setNewText]      = useState("");
  const [newTag,       setNewTag]       = useState("Feature");
  const [newPri,       setNewPri]       = useState("Medium");
  const [newDue,       setNewDue]       = useState("");
  const [newEst,       setNewEst]       = useState("");
  const [showArc,      setShowArc]      = useState({});
  const [editCard,     setEditCard]     = useState(null);
  const [tagFilter,    setTagFilter]    = useState("all");
  const [priFilter,    setPriFilter]    = useState("all");

  const updCards = fn => updateProject(p => ({ ...p, kanban: { ...p.kanban, cards: fn(p.kanban.cards) } }));
  const updCols  = fn => updateProject(p => ({ ...p, kanban: { ...p.kanban, cols: fn(p.kanban.cols) } }));

  const activeCards  = col => kanban.cards.filter(c => c.col === col && !c.archived && (tagFilter === "all" || c.tag === tagFilter) && (priFilter === "all" || c.priority === priFilter));
  const archivedCards = col => kanban.cards.filter(c => c.col === col && c.archived);

  const addCard = col => {
    if (!newText.trim()) return;
    updCards(cs => [...cs, mkCard(col, { text: newText.trim(), tag: newTag, priority: newPri, due: newDue, estimate: newEst })]);
    setNewText(""); setNewTag("Feature"); setNewPri("Medium"); setNewDue(""); setNewEst(""); setAddingTo(null);
  };
  const moveCard    = (id, col) => updCards(cs => cs.map(c => c.id === id ? { ...c, col } : c));
  const archiveCard = id => updCards(cs => cs.map(c => c.id === id ? { ...c, archived: true } : c));
  const unarchive   = id => updCards(cs => cs.map(c => c.id === id ? { ...c, archived: false } : c));
  const deleteCard  = id => updCards(cs => cs.filter(c => c.id !== id));
  const archiveDone = ()  => updCards(cs => cs.map(c => c.col === "Done" && !c.archived ? { ...c, archived: true } : c));
  const saveEdit    = ()  => { updCards(cs => cs.map(c => c.id === editCard.id ? editCard : c)); setEditCard(null); };

  const reorderCols = (from, to) => updCols(cols => {
    const next = [...cols];
    next.splice(next.indexOf(from), 1);
    next.splice(next.indexOf(to), 0, from);
    return next;
  });

  const addCol = () => {
    const name = window.prompt("New column name:");
    if (name?.trim()) updCols(cols => [...cols, name.trim()]);
  };
  const removeCol = col => {
    if (!window.confirm(`Delete column "${col}" and all its cards?`)) return;
    updateProject(p => ({
      ...p,
      kanban: { ...p.kanban, cols: p.kanban.cols.filter(c => c !== col), cards: p.kanban.cards.filter(c => c.col !== col) },
    }));
  };

  const tagsInUse = [...new Set(kanban.cards.map(c => c.tag))];

  return (
    <>
      <div className="board-wrap">
        {/* Filter bar */}
        <div className="board-bar">
          <Filter size={12} style={{ color: "var(--txt3)" }} />
          <select className="inp" style={{ width: 120, fontSize: 11 }} value={tagFilter} onChange={e => setTagFilter(e.target.value)}>
            <option value="all">All tags</option>
            {tagsInUse.map(t => <option key={t}>{t}</option>)}
          </select>
          <select className="inp" style={{ width: 120, fontSize: 11 }} value={priFilter} onChange={e => setPriFilter(e.target.value)}>
            <option value="all">All priority</option>
            {Object.keys(PRIORITY).map(k => <option key={k}>{k}</option>)}
          </select>
          <select className="inp" style={{ width: 120, fontSize: 11 }} value={colFilter} onChange={e => setColF(e.target.value)}>
            <option value="all">All columns</option>
            {project.kanban.cols.map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="inp" style={{ width: 130, fontSize: 11 }} value={sort} onChange={e => setSort(e.target.value)}>
            <option value="col">Sort: Column</option>
            <option value="priority">Sort: Priority</option>
            <option value="due">Sort: Due date</option>
            <option value="tag">Sort: Tag</option>
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--txt3)", cursor: "pointer", userSelect: "none", flexShrink: 0 }}>
            <input type="checkbox" checked={showDone} onChange={e => setShowDone(e.target.checked)} />Show done
          </label>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--txt3)", flexShrink: 0 }}>{cards.length} tasks</span>
        </div>

        {/* Columns */}
        <div className="board-cols">
          {kanban.cols.map(col => {
            const cards = activeCards(col);
            const arcs  = archivedCards(col);
            return (
              <div
                key={col}
                className={`kcol${dropOver === col ? " dov" : ""}`}
                onDragOver={e => { e.preventDefault(); if (draggingCol) setDragColOver(col); else setDropOver(col); }}
                onDragLeave={() => { setDropOver(null); setDragColOver(null); }}
                onDrop={e => {
                  e.preventDefault(); setDropOver(null);
                  if (draggingCol && draggingCol !== col) { reorderCols(draggingCol, col); setDraggingCol(null); return; }
                  if (dragging && dragging.col !== col) { moveCard(dragging.id, col); setDragging(null); }
                }}
              >
                {/* Column header — draggable for reorder */}
                <div
                  className="kcol-head"
                  draggable
                  onDragStart={() => setDraggingCol(col)}
                  onDragEnd={() => { setDraggingCol(null); setDragColOver(null); }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <GripVertical size={12} color="var(--txt3)" />
                    <span className="kcol-name">{col}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span className="kcol-count">{cards.length}</span>
                    {col === "Done" && cards.length > 0 && (
                      <button className="btn btn-ghost btn-icon" onClick={archiveDone} title="Archive all done"><Archive size={11} /></button>
                    )}
                    <button className="btn btn-ghost btn-icon btn-danger" onClick={() => removeCol(col)}><X size={11} /></button>
                  </div>
                </div>

                {/* Cards */}
                <div className="kcol-cards">
                  {cards.map(card => {
                    const od = isOverdue(card.due) && col !== "Done";
                    return (
                      <div
                        key={card.id}
                        className={`kcard${dragging?.id === card.id ? " dragging" : ""}`}
                        draggable
                        onDragStart={() => setDragging({ id: card.id, col })}
                        onDragEnd={() => setDragging(null)}
                      >
                        <div className="kcard-actions">
                          <button className="btn btn-ghost btn-icon" style={{ padding: "2px" }} onClick={() => setEditCard({ ...card })}><Pencil size={9} /></button>
                          <button className="btn btn-ghost btn-icon" style={{ padding: "2px" }} onClick={() => archiveCard(card.id)}><Archive size={9} /></button>
                          <button className="btn btn-ghost btn-icon btn-danger" style={{ padding: "2px" }} onClick={() => deleteCard(card.id)}><Trash2 size={9} /></button>
                        </div>
                        <div style={{ fontSize: 12.5, lineHeight: 1.45, color: "var(--txt)", marginBottom: 7, paddingRight: 40 }}>{card.text}</div>
                        {card.notes && <div style={{ fontSize: 11, color: "var(--txt3)", marginBottom: 7, lineHeight: 1.5 }}>{card.notes}</div>}
                        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                          <PriIcon priority={card.priority} />
                          <TagPill tag={card.tag} />
                          {card.estimate && <span style={{ fontSize: 10, color: "var(--txt3)", display: "flex", alignItems: "center", gap: 2 }}><Clock size={9} />{card.estimate}</span>}
                          {card.due && <span style={{ fontSize: 10, color: od ? "#ef4444" : "var(--txt3)", display: "flex", alignItems: "center", gap: 2, marginLeft: "auto" }}><Calendar size={9} />{fmtDate(card.due)}</span>}
                        </div>
                        {card.state && card.state !== "Open" && (
                          <div style={{ marginTop: 5 }}>
                            <span style={{ fontSize: 9.5, color: "var(--acc)", background: "var(--acc-a)", border: "1px solid var(--acc-b)", borderRadius: 3, padding: "1px 5px" }}>{card.state}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add card */}
                {addingTo === col
                  ? <div className="kadd-form">
                      <textarea className="inp" autoFocus style={{ fontSize: 12, minHeight: 52 }}
                        placeholder="Card description…" value={newText}
                        onChange={e => setNewText(e.target.value)}
                        onKeyDown={e => e.key === "Escape" && setAddingTo(null)} />
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                        <select className="inp" value={newTag} onChange={e => setNewTag(e.target.value)}>{TAG_LIST.map(t => <option key={t}>{t}</option>)}</select>
                        <select className="inp" value={newPri} onChange={e => setNewPri(e.target.value)}>{Object.keys(PRIORITY).map(k => <option key={k}>{k}</option>)}</select>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                        <input className="inp" type="date" value={newDue} onChange={e => setNewDue(e.target.value)} />
                        <input className="inp" placeholder="Estimate (e.g. 4h)" value={newEst} onChange={e => setNewEst(e.target.value)} />
                      </div>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button className="btn btn-p" style={{ flex: 1, justifyContent: "center" }} onClick={() => addCard(col)}>Add card</button>
                        <button className="btn btn-sm" onClick={() => setAddingTo(null)}>Cancel</button>
                      </div>
                    </div>
                  : <div className="kadd" onClick={() => { setAddingTo(col); setNewText(""); }}><Plus size={12} />Add card</div>
                }

                {/* Archived section */}
                {arcs.length > 0 && (
                  <div className="arc-wrap">
                    <div className="arc-toggle" onClick={() => setShowArc(p => ({ ...p, [col]: !p[col] }))}>
                      <Archive size={10} /><span>{arcs.length} archived</span>
                      <ChevronRight size={10} style={{ transform: showArc[col] ? "rotate(90deg)" : "", transition: "transform .12s", marginLeft: "auto" }} />
                    </div>
                    {showArc[col] && arcs.map(c => (
                      <div key={c.id} className="arc-item">
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.text}</span>
                        <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                          <button className="btn btn-ghost btn-icon" style={{ padding: "2px" }} onClick={() => unarchive(c.id)}><RotateCcw size={10} /></button>
                          <button className="btn btn-ghost btn-icon btn-danger" style={{ padding: "2px" }} onClick={() => deleteCard(c.id)}><Trash2 size={10} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit card modal */}
      {editCard && (
        <div className="backdrop" onClick={() => setEditCard(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Edit card</div>
            <div className="m-row"><div className="m-lbl">Description</div><textarea className="inp" rows={3} value={editCard.text} onChange={e => setEditCard(p => ({ ...p, text: e.target.value }))} /></div>
            <div className="m-row"><div className="m-lbl">Notes</div><textarea className="inp" rows={2} placeholder="Optional notes…" value={editCard.notes || ""} onChange={e => setEditCard(p => ({ ...p, notes: e.target.value }))} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div className="m-row"><div className="m-lbl">Tag</div><select className="inp" value={editCard.tag} onChange={e => setEditCard(p => ({ ...p, tag: e.target.value }))}>{TAG_LIST.map(t => <option key={t}>{t}</option>)}</select></div>
              <div className="m-row"><div className="m-lbl">Priority</div><select className="inp" value={editCard.priority} onChange={e => setEditCard(p => ({ ...p, priority: e.target.value }))}>{Object.keys(PRIORITY).map(k => <option key={k}>{k}</option>)}</select></div>
              <div className="m-row"><div className="m-lbl">State</div><select className="inp" value={editCard.state || "Open"} onChange={e => setEditCard(p => ({ ...p, state: e.target.value }))}>{CARD_STATES.map(s => <option key={s}>{s}</option>)}</select></div>
              <div className="m-row"><div className="m-lbl">Column</div><select className="inp" value={editCard.col} onChange={e => setEditCard(p => ({ ...p, col: e.target.value }))}>{kanban.cols.map(c => <option key={c}>{c}</option>)}</select></div>
              <div className="m-row"><div className="m-lbl">Due date</div><input className="inp" type="date" value={editCard.due || ""} onChange={e => setEditCard(p => ({ ...p, due: e.target.value }))} /></div>
              <div className="m-row"><div className="m-lbl">Estimate</div><input className="inp" placeholder="e.g. 4h, 2d" value={editCard.estimate || ""} onChange={e => setEditCard(p => ({ ...p, estimate: e.target.value }))} /></div>
            </div>
            <div className="m-actions">
              <button className="btn" onClick={() => setEditCard(null)}>Cancel</button>
              <button className="btn btn-p" onClick={saveEdit}>Save changes</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// TASKS
// ─────────────────────────────────────────────────────────────

function Tasks({ project, updateProject }) {
  const [tagF,     setTagF]     = useState("all");
  const [priF,     setPriF]     = useState("all");
  const [colF,     setColF]     = useState("all");
  const [sort,     setSort]     = useState("col");
  const [showDone, setShowDone] = useState(true);

  const updCards = fn => updateProject(p => ({ ...p, kanban: { ...p.kanban, cards: fn(p.kanban.cards) } }));
  const toggle   = id => updCards(cs => cs.map(c => c.id === id ? { ...c, col: c.col === "Done" ? project.kanban.cols[0] : "Done" } : c));
  const del      = id => updCards(cs => cs.filter(c => c.id !== id));

  const priOrder = { High: 0, Medium: 1, Low: 2 };

  let cards = project.kanban.cards.filter(c => !c.archived);
  if (tagF !== "all")  cards = cards.filter(c => c.tag === tagF);
  if (priF !== "all")  cards = cards.filter(c => c.priority === priF);
  if (colF !== "all")  cards = cards.filter(c => c.col === colF);
  if (!showDone)       cards = cards.filter(c => c.col !== "Done");

  cards = [...cards].sort((a, b) => {
    if (sort === "col")      return project.kanban.cols.indexOf(a.col) - project.kanban.cols.indexOf(b.col);
    if (sort === "priority") return (priOrder[a.priority] ?? 3) - (priOrder[b.priority] ?? 3);
    if (sort === "due")      return (a.due || "9999") < (b.due || "9999") ? -1 : 1;
    if (sort === "tag")      return a.tag.localeCompare(b.tag);
    return 0;
  });

  const grouped = sort === "col";

  const TaskRow = ({ card }) => {
    const done = card.col === "Done";
    const od   = isOverdue(card.due) && !done;
    return (
      <div className="task-row">
        <input type="checkbox" checked={done} onChange={() => toggle(card.id)} />
        <PriIcon priority={card.priority} />
        <span className="task-text" style={{ color: done ? "var(--txt3)" : "var(--txt)", textDecoration: done ? "line-through" : "none" }}>{card.text}</span>
        {card.estimate && <span style={{ fontSize: 10.5, color: "var(--txt3)", display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}><Clock size={10} />{card.estimate}</span>}
        {card.due && <span style={{ fontSize: 10.5, color: od ? "#ef4444" : "var(--txt3)", display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}><Calendar size={10} />{fmtDate(card.due)}</span>}
        <TagPill tag={card.tag} />
        {card.state && card.state !== "Open" && <span style={{ fontSize: 10, color: "var(--acc)", background: "var(--acc-a)", border: "1px solid var(--acc-b)", borderRadius: 3, padding: "1px 5px", flexShrink: 0 }}>{card.state}</span>}
        <button className="btn btn-ghost btn-icon btn-danger" style={{ padding: "2px", opacity: .4 }} onClick={() => del(card.id)}><Trash2 size={11} /></button>
      </div>
    );
  };

  return (
    <div className="tasks-wrap">
      <div className="tasks-bar">
        <Filter size={12} style={{ color: "var(--txt3)", flexShrink: 0 }} />
        <select className="inp" style={{ width: 120, fontSize: 11 }} value={tagF} onChange={e => setTagF(e.target.value)}>
          <option value="all">All tags</option>{TAG_LIST.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="inp" style={{ width: 115, fontSize: 11 }} value={priF} onChange={e => setPriF(e.target.value)}>
          <option value="all">All priority</option>{Object.keys(PRIORITY).map(k => <option key={k}>{k}</option>)}
        </select>
        <select className="inp" style={{ width: 120, fontSize: 11 }} value={colF} onChange={e => setColF(e.target.value)}>
          <option value="all">All columns</option>{project.kanban.cols.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="inp" style={{ width: 130, fontSize: 11 }} value={sort} onChange={e => setSort(e.target.value)}>
          <option value="col">Sort: Column</option>
          <option value="priority">Sort: Priority</option>
          <option value="due">Sort: Due date</option>
          <option value="tag">Sort: Tag</option>
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--txt3)", cursor: "pointer", userSelect: "none", flexShrink: 0 }}>
          <input type="checkbox" checked={showDone} onChange={e => setShowDone(e.target.checked)} />Show done
        </label>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--txt3)", flexShrink: 0 }}>{cards.length} tasks</span>
      </div>
      <div className="tasks-body">
        {cards.length === 0 && <div style={{ textAlign: "center", padding: "36px 0", color: "var(--txt3)", fontSize: 13 }}>No tasks match filters.</div>}
        {grouped
          ? project.kanban.cols.map(col => {
              const group = cards.filter(c => c.col === col);
              if (!group.length) return null;
              return (
                <div key={col} style={{ marginBottom: 16 }}>
                  <div className="lbl" style={{ marginBottom: 6 }}>{col} · {group.length}</div>
                  {group.map(c => <TaskRow key={c.id} card={c} />)}
                </div>
              );
            })
          : cards.map(c => <TaskRow key={c.id} card={c} />)
        }
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────────────────────

function Analytics({ project }) {
  const cards    = project.kanban.cards.filter(c => !c.archived);
  const done     = cards.filter(c => c.col === "Done").length;
  const total    = cards.length;
  const pct      = total > 0 ? Math.round(done / total * 100) : 0;
  const overdue  = cards.filter(c => isOverdue(c.due) && c.col !== "Done").length;
  const highPri  = cards.filter(c => c.priority === "High" && c.col !== "Done").length;
  const inProg   = cards.filter(c => c.col === "In Progress").length;
  const archived = project.kanban.cards.filter(c => c.archived).length;

  const parseHrs = s => { const m = s?.match(/(\d+(?:\.\d+)?)\s*(h|d)/i); return m ? parseFloat(m[1]) * (m[2].toLowerCase() === "d" ? 8 : 1) : 0; };
  const totalEstHrs = cards.filter(c => c.estimate).reduce((a, c) => a + parseHrs(c.estimate), 0);
  const doneEstHrs  = cards.filter(c => c.col === "Done" && c.estimate).reduce((a, c) => a + parseHrs(c.estimate), 0);

  // Donuts
  const colSegments = project.kanban.cols.map((col, i) => ({
    value: cards.filter(c => c.col === col).length,
    color: col === "Done" ? project.accent : COL_PALETTE[i] || "#3f3f46",
    title: col,
  }));
  const tagSegments = TAG_LIST.map(t => ({ value: cards.filter(c => c.tag === t).length, color: TAG_COLORS[t], title: t })).filter(s => s.value > 0);
  const priSegments = Object.entries(PRIORITY).map(([k, p]) => ({ value: cards.filter(c => c.priority === k).length, color: p.color, title: k }));
  const overdueCards = cards.filter(c => isOverdue(c.due) && c.col !== "Done");

  // Sessions
  const projSessions = getSessions().filter(s => s.project === project.name);
  const sessionCount = projSessions.length;
  const totalSecs    = projSessions.reduce((a, s) => a + s.duration, 0);
  const avgSecs      = sessionCount > 0 ? Math.round(totalSecs / sessionCount) : 0;
  const longestSecs  = sessionCount > 0 ? Math.max(...projSessions.map(s => s.duration)) : 0;
  const totalLoggedHrs = totalSecs / 3600;

  const sessionStreak = (() => {
    if (!projSessions.length) return 0;
    const days = [...new Set(projSessions.map(s => s.date))].sort().reverse();
    let k = 1, i = 0;
    while (i < days.length - 1) { if ((new Date(days[i]) - new Date(days[i+1])) / 86400000 <= 1.5) { k++; i++; } else break; }
    return k;
  })();

  const today = new Date().toLocaleDateString("en-IE", { weekday: "long", day: "numeric", month: "long" });

  const last14 = buildLastNDays(projSessions);

  const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dowData = DOW.map((l, di) => ({ l, v: projSessions.filter(s => new Date(s.started).getDay() === di).reduce((a, s) => a + s.duration, 0) }));

  return (
    <div className="scroll-area">
      {/* Board stats */}
      <div className="an-grid4">
        {[
          { v: `${pct}%`, l: "Completion",       c: "var(--acc)" },
          { v: inProg,    l: "In progress",       c: "var(--txt)" },
          { v: total,     l: "Total cards",       c: "var(--txt)" },
          { v: done,      l: "Done",              c: "var(--acc)" },
          { v: highPri,   l: "High priority open", c: highPri > 0 ? "#ef4444" : "var(--txt3)" },
          { v: overdue,   l: "Overdue",           c: overdue > 0 ? "#ef4444" : "var(--txt3)" },
          { v: archived,  l: "Archived",          c: "var(--txt3)" },
          { v: totalEstHrs > 0 ? `${Math.round(doneEstHrs)}/${Math.round(totalEstHrs)}h` : "—", l: "Hours done/est", c: "var(--txt)" },
        ].map(s => (
          <div key={s.l} className="card">
            <div className="an-val" style={{ color: s.c }}>{s.v}</div>
            <div className="an-lbl">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
          <div className="lbl" style={{ marginBottom: 0 }}>Overall progress</div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--acc)" }}>{pct}%</span>
        </div>
        <div className="pbar pbar-md">
          <div className="pfill" style={{ width: `${pct}%`, background: project.accent }} />
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 7, fontSize: 11, color: "var(--txt3)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--acc)", display: "inline-block" }} />Logged</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--bd)", border: "1px solid var(--bd2)", display: "inline-block" }} />Estimated</span>
          {totalLoggedHrs > totalEstHrs && <span style={{ color: "#ef4444", marginLeft: "auto" }}>{Math.round((totalLoggedHrs - totalEstHrs) * 10) / 10}h over estimate</span>}
          {totalLoggedHrs <= totalEstHrs && totalLoggedHrs > 0 && <span style={{ marginLeft: "auto" }}>{Math.round((totalEstHrs - totalLoggedHrs) * 10) / 10}h remaining</span>}
        </div>
      </div>

      {/* Three donuts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
        {[
          { title: "By column",   segs: colSegments, label: `${total}`, sub: "cards" },
          { title: "By tag",      segs: tagSegments, label: `${tagSegments.length}`, sub: "tags" },
          { title: "By priority", segs: priSegments, label: `${total}`, sub: "cards" },
        ].map(({ title, segs, label, sub }) => (
          <div key={title} className="card">
            <div className="lbl" style={{ marginBottom: 10 }}>{title}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ flexShrink: 0 }}><DonutChart segments={segs} size={120} thickness={20} label={label} sub={sub} /></div>
              <DonutLegend segments={segs} />
            </div>
          </div>
        ))}
      </div>

      {/* Session analytics */}
      {sessionCount === 0
        ? <div className="card" style={{ marginBottom: 12 }}>
            <div className="lbl" style={{ marginBottom: 6 }}>Work sessions</div>
            <div style={{ fontSize: 12, color: "var(--txt3)", fontStyle: "italic" }}>No sessions yet. Head to the Timer tab to start tracking.</div>
          </div>
        : <>
            <div className="an-grid4" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
              {[
                { v: fmtDuration(totalSecs),  l: "Total time",     c: "var(--acc)" },
                { v: sessionCount,             l: "Sessions",       c: "var(--txt)" },
                { v: fmtDuration(avgSecs),     l: "Avg session",    c: "var(--txt)" },
                { v: fmtDuration(longestSecs), l: "Longest",        c: "var(--txt)" },
                { v: `${streak}d`,             l: "Streak",         c: streak >= 3 ? "#f97316" : "var(--txt)" },
              ].map(s => (
                <div key={s.l} className="card">
                  <div className="an-val" style={{ color: s.c }}>{s.v}</div>
                  <div className="an-lbl">{s.l}</div>
                </div>
              ))}
            </div>

            <div className="an-grid21">
              <div className="card">
                <div className="lbl" style={{ marginBottom: 10 }}>Last 14 days</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 62 }}>
                  {last14.map((d, i) => (
                    <div key={i} style={{ flex: 1, height: "100%", display: "flex", alignItems: "flex-end" }}>
                      <div style={{ width: "100%", height: d.v > 0 ? `${Math.max((d.v / max14) * 100, 8)}%` : "2px", background: d.v > 0 ? "var(--acc)" : "var(--bd)", borderRadius: "2px 2px 0 0", opacity: d.v > 0 ? .85 : 1 }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 9, color: "var(--txt3)" }}>
                  <span>14 days ago</span><span>Today</span>
                </div>
              </div>
              <div className="card">
                <div className="lbl" style={{ marginBottom: 10 }}>By day of week</div>
                <BarChart data={dowData.map(d => ({ l: d.l, v: d.v }))} h={62} color="var(--acc)" />
              </div>
            </div>

            {totalEstHrs > 0 && (
              <div className="card" style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                  <div className="lbl" style={{ marginBottom: 0 }}>Time logged vs estimated</div>
                  <span style={{ fontSize: 11, color: "var(--txt3)" }}>
                    {Math.round(totalLoggedHrs * 10) / 10}h logged · {Math.round(totalEstHrs)}h estimated
                  </span>
                </div>
                <div style={{ height: 7, background: "var(--bd)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min((totalLoggedHrs / totalEstHrs) * 100, 100)}%`, background: totalLoggedHrs > totalEstHrs ? "#ef4444" : "var(--acc)", borderRadius: 4, transition: "width .4s ease" }} />
                </div>
                <div style={{ display: "flex", gap: 14, marginTop: 6, fontSize: 10.5, color: "var(--txt3)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--acc)", display: "inline-block" }} />Logged</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--bd)", border: "1px solid var(--bd2)", display: "inline-block" }} />Estimated</span>
                  {totalLoggedHrs > totalEstHrs && <span style={{ color: "#ef4444", marginLeft: "auto" }}>{Math.round((totalLoggedHrs - totalEstHrs) * 10) / 10}h over estimate</span>}
                  {totalLoggedHrs <= totalEstHrs && totalLoggedHrs > 0 && <span style={{ marginLeft: "auto" }}>{Math.round((totalEstHrs - totalLoggedHrs) * 10) / 10}h remaining</span>}
                </div>
              </div>
            )}
          </>
      }

      {/* Overdue table */}
      {overdueCards.length > 0 && (
        <div className="card">
          <div className="lbl" style={{ marginBottom: 10, color: "#ef4444" }}>Overdue ({overdueCards.length})</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--bd)" }}>
                {["Card", "Column", "Due", "Pri"].map(h => <th key={h} style={{ padding: "0 0 6px", fontSize: 10, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--txt3)", textAlign: "left" }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {overdueCards.map((c, i) => (
                <tr key={c.id} style={{ borderTop: i === 0 ? "none" : "1px solid var(--bd)" }}>
                  <td style={{ padding: "7px 0", fontSize: 12, color: "var(--txt)" }}>{c.text}</td>
                  <td style={{ padding: "7px 8px", fontSize: 11, color: "var(--txt3)" }}>{c.col}</td>
                  <td style={{ padding: "7px 8px", fontSize: 11, color: "#ef4444" }}>{fmtDate(c.due)}</td>
                  <td style={{ padding: "7px 0" }}><PriIcon priority={c.priority} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TIMER
// ─────────────────────────────────────────────────────────────

function useTimer() {
  const [running,   setRunning]   = useState(false);
  const [elapsed,   setElapsed]   = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    if (running) { ref.current = setInterval(() => setElapsed(e => e + 1), 1000); }
    else         { clearInterval(ref.current); }
    return () => clearInterval(ref.current);
  }, [running]);

  const start = () => { setStartedAt(new Date().toISOString()); setElapsed(0); setRunning(true); };

  const stop = (projectName, note = "") => {
    setRunning(false);
    if (elapsed < 5) return;
    const session = {
      id: uid(), project: projectName, note,
      date: todayLbl(),
      started: startedAt,
      ended: new Date().toISOString(),
      duration: elapsed,
    };
    saveSessions([session, ...getSessions()].slice(0, 200));
    setElapsed(0);
    return session;
  };

  const reset = () => { setRunning(false); setElapsed(0); };

  return { running, elapsed, start, stop, reset };
}

function TimerView({ project, timer }) {
  const [sessions,  setSessions]  = useState(getSessions);
  const [note,      setNote]      = useState("");

  const projSessions = sessions.filter(s => s.project === project.name);

  // Refresh session list after stop
  const handleStop = () => {
    timer.stop(project.name, note.trim());
    setNote("");
    setTimeout(() => setSessions(getSessions()), 60);
  };

  useEffect(() => { setSessions(getSessions()); }, [project.id]);

  const deleteSession = id => {
    const next = sessions.filter(s => s.id !== id);
    saveSessions(next); setSessions(next);
  };

  const count       = projSessions.length;
  const totalSecs   = projSessions.reduce((a, s) => a + s.duration, 0);
  const avgSecs     = count > 0 ? Math.round(totalSecs / count) : 0;
  const longestSecs  = count > 0 ? Math.max(...projSessions.map(s => s.duration)) : 0;

  const streak = (() => {
    if (!count) return 0;
    const days = [...new Set(projSessions.map(s => s.date))].sort().reverse();
    let k = 1, i = 0;
    while (i < days.length - 1) { if ((new Date(days[i]) - new Date(days[i+1])) / 86400000 <= 1.5) { k++; i++; } else break; }
    return k;
  })();

  const today = new Date().toLocaleDateString("en-IE", { weekday: "long", day: "numeric", month: "long" });

  const last14 = buildLastNDays(projSessions);

  return (
    <div className="scroll-area">
      {/* Big clock */}
      <div className="card" style={{ textAlign: "center", padding: "32px 20px", marginBottom: 14 }}>
        <div className="timer-display" style={{ color: timer.running ? "var(--acc)" : "var(--txt)", marginBottom: 18 }}>
          {fmtSecs(timer.elapsed)}
        </div>
        {!timer.running && (
          <input className="inp" style={{ maxWidth: 320, margin: "0 auto 16px", textAlign: "center", fontSize: 12 }}
            placeholder="Session note (optional)…" value={note} onChange={e => setNote(e.target.value)} />
        )}
        {timer.running && note && <div style={{ fontSize: 12, color: "var(--txt3)", marginBottom: 16, fontStyle: "italic" }}>{note}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          {!timer.running
            ? <button className="btn btn-p" style={{ padding: "9px 28px", fontSize: 13 }} onClick={timer.start}>
                <svg width="11" height="13" viewBox="0 0 11 13" fill="currentColor"><path d="M0 0l11 6.5L0 13V0z"/></svg>
                Start session
              </button>
            : <button className="btn" style={{ padding: "9px 28px", fontSize: 13, borderColor: "#ef4444", color: "#ef4444" }} onClick={handleStop}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor"><rect width="11" height="11" rx="1.5"/></svg>
                Stop &amp; save
              </button>
          }
          {timer.elapsed > 0 && !timer.running && (
            <button className="btn" style={{ padding: "9px 16px", fontSize: 13 }} onClick={timer.reset}><RotateCcw size={13} />Discard</button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="timer-grid5">
        {[
          { v: fmtDuration(totalSecs) || "0m", l: "Total time",     Icon: Clock,      c: "var(--acc)" },
          { v: sessionCount,             l: "Sessions",       Icon: Timer,      c: "var(--txt)" },
          { v: fmtDuration(avgSecs) || "—",     l: "Avg session",    Icon: TrendingUp, c: "var(--txt)" },
          { v: fmtDuration(longestSecs) || "—", l: "Longest",        Icon: Flag,       c: "var(--txt)" },
          { v: `${streak}d`,             l: "Streak",         Icon: Flame,      c: streak >= 3 ? "#f97316" : "var(--txt)" },
        ].map(s => (
          <div key={s.l} className="card timer-stat">
            <s.Icon size={14} style={{ color: s.c, margin: "0 auto 6px", display: "block" }} />
            <div className="timer-stat-val" style={{ color: s.c }}>{s.v}</div>
            <div className="timer-stat-lbl">{s.l}</div>
          </div>
        ))}
      </div>

      {/* 14-day chart */}
      {count > 0 && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="lbl" style={{ marginBottom: 10 }}>Last 14 days</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 64 }}>
            {last14.map((d, i) => (
              <div key={i} style={{ flex: 1, height: "100%", display: "flex", alignItems: "flex-end" }}>
                <div style={{ width: "100%", height: d.v > 0 ? `${Math.max((d.v / max14) * 100, 8)}%` : "2px", background: d.v > 0 ? "var(--acc)" : "var(--bd)", borderRadius: "2px 2px 0 0", opacity: d.v > 0 ? .85 : 1 }} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 9, color: "var(--txt3)" }}>
            <span>14 days ago</span><span>Today</span>
          </div>
        </div>
      )}

      {/* Session log */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div className="lbl" style={{ marginBottom: 0 }}>Session log</div>
          {count > 0 && <span style={{ fontSize: 11, color: "var(--txt3)" }}>{count} session{count !== 1 ? "s" : ""} · {fmtDuration(totalSecs)} total</span>}
        </div>
        {projSessions.length === 0
          ? <div style={{ fontSize: 12.5, color: "var(--txt3)", fontStyle: "italic", padding: "10px 0" }}>No sessions yet. Hit Start to begin tracking.</div>
          : <>
              <div className="session-tbl-hdr"><span>Date</span><span>Duration</span><span>Note</span><span /></div>
              {projSessions.slice(0, 30).map(s => (
                <div key={s.id} className="session-row">
                  <span style={{ color: "var(--txt2)" }}>{s.date}</span>
                  <span style={{ fontWeight: 600, color: "var(--acc)" }}>{fmtDuration(s.duration)}</span>
                  <span style={{ color: "var(--txt3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.note || "—"}</span>
                  <button className="btn btn-ghost btn-icon btn-danger" style={{ padding: "2px", opacity: .4 }} onClick={() => deleteSession(s.id)}><Trash2 size={10} /></button>
                </div>
              ))}
            </>
        }
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// NOTES
// ─────────────────────────────────────────────────────────────

function Notes({ project, updateProject }) {
  const [activeId, setActiveId] = useState(project.notes[0]?.id || null);
  const [editing,  setEditing]  = useState(false);

  const notes  = project.notes;
  const active = notes.find(n => n.id === activeId);

  useEffect(() => {
    setActiveId(project.notes[0]?.id || null);
    setEditing(false);
  }, [project.id]);

  const selectNote = id => { setActiveId(id); setEditing(false); };

  const upd = (field, val) => updateProject(p => ({ ...p, notes: p.notes.map(n => n.id === activeId ? { ...n, [field]: val } : n) }));

  const addNote = () => {
    const n = { id: uid(), title: "Untitled", content: "" };
    updateProject(p => ({ ...p, notes: [...p.notes, n] }));
    setActiveId(n.id); setEditing(true);
  };

  const deleteNote = id => {
    updateProject(p => ({ ...p, notes: p.notes.filter(n => n.id !== id) }));
    if (activeId === id) {
      const remaining = notes.filter(n => n.id !== id);
      setActiveId(remaining[0]?.id || null);
    }
  };

  return (
    <div className="notes-layout">
      <div className="notes-sb">
        <div style={{ padding: "10px 10px 8px", borderBottom: "1px solid var(--bd)", flexShrink: 0 }}>
          <button className="btn btn-p" style={{ width: "100%", justifyContent: "center" }} onClick={addNote}><Plus size={12} />New note</button>
        </div>
        {notes.map(n => (
          <div key={n.id} className={`note-item${n.id === activeId ? " on" : ""}`} onClick={() => selectNote(n.id)}>
            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title || "Untitled"}</div>
            <div style={{ fontSize: 11, color: "var(--txt3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.content.replace(/#+\s*/g, "").slice(0, 50) || "Empty"}</div>
          </div>
        ))}
      </div>

      {active ? (
        <div className="note-ed">
          <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid var(--bd)", height: 44, padding: "0 10px 0 0", flexShrink: 0 }}>
            {editing
              ? <input className="note-ti" style={{ flex: 1 }} value={active.title} onChange={e => upd("title", e.target.value)} placeholder="Note title…" />
              : <span style={{ flex: 1, padding: "0 20px", fontSize: 16, fontWeight: 600, color: "var(--txt)" }}>{active.title || "Untitled"}</span>
            }
            <button className="btn btn-sm" style={{ flexShrink: 0, background: editing ? "var(--acc-a)" : "none", borderColor: editing ? "var(--acc-b)" : "var(--bd)", color: editing ? "var(--acc)" : "var(--txt3)" }}
              onClick={() => setEditing(v => !v)}>
              <Pencil size={11} />{editing ? "Preview" : "Edit"}
            </button>
            <button className="btn btn-ghost btn-icon btn-danger" style={{ marginLeft: 4, flexShrink: 0 }} onClick={() => deleteNote(active.id)}><Trash2 size={13} /></button>
          </div>

          {editing
            ? <textarea className="note-bi" style={{ fontFamily: "monospace", fontSize: 12.5 }} autoFocus
                value={active.content} onChange={e => upd("content", e.target.value)}
                placeholder={"# Heading\n\nStart writing…"} spellCheck={false} />
            : <div className="note-preview">
                {active.content.trim() ? renderMd(active.content, project.accent) : <div style={{ color: "var(--txt3)", fontStyle: "italic" }}>Empty note — click Edit to start writing.</div>}
              </div>
          }
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--txt3)", fontSize: 13 }}>Select or create a note</div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LINKS
// ─────────────────────────────────────────────────────────────

function Links({ project, updateProject }) {
  const links = project.links;
  const [form, setForm] = useState({ show: false, title: "", url: "", group: "Dev" });

  const groups = [...new Set(links.map(l => l.group))];

  const submit = () => {
    if (!form.title || !form.url) return;
    const url = form.url.startsWith("http") ? form.url : `https://${form.url}`;
    updateProject(p => ({ ...p, links: [...p.links, { id: uid(), title: form.title, url, group: form.group }] }));
    setForm({ show: false, title: "", url: "", group: "Dev" });
  };

  const del = id => updateProject(p => ({ ...p, links: p.links.filter(l => l.id !== id) }));

  return (
    <div className="scroll-area">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button className="btn btn-p" onClick={() => setForm(p => ({ ...p, show: !p.show }))}><Plus size={12} />Add link</button>
      </div>

      {form.show && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px", gap: 8, marginBottom: 8 }}>
            <div><div className="m-lbl">Title</div><input className="inp" placeholder="Unity Docs" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
            <div><div className="m-lbl">URL</div><input className="inp" placeholder="https://…" value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} /></div>
            <div><div className="m-lbl">Group</div><input className="inp" placeholder="Dev" value={form.group} onChange={e => setForm(p => ({ ...p, group: e.target.value }))} /></div>
          </div>
          <div style={{ display: "flex", gap: 7, justifyContent: "flex-end" }}>
            <button className="btn" onClick={() => setForm(p => ({ ...p, show: false }))}>Cancel</button>
            <button className="btn btn-p" onClick={submit}>Add</button>
          </div>
        </div>
      )}

      {groups.map(g => (
        <div key={g} style={{ marginBottom: 20 }}>
          <div className="lbl" style={{ borderBottom: "1px solid var(--bd)", paddingBottom: 6, marginBottom: 6 }}>{g}</div>
          {links.filter(l => l.group === g).map(l => (
            <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <a className="link-row" href={l.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>{l.title}</div>
                  <div style={{ fontSize: 11, color: "var(--txt3)" }}>{l.url.replace(/^https?:\/\//, "").split("/")[0]}</div>
                </div>
                <ExternalLink size={12} style={{ color: "var(--txt3)", flexShrink: 0 }} />
              </a>
              <button className="btn btn-ghost btn-icon btn-danger" onClick={() => del(l.id)}><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────────────────────

function SettingsView({ data, setData, project, updateProject, onExport, onImport }) {
  const fileRef   = useRef(null);
  const [newCol,  setNewCol]  = useState("");
  const [newProj, setNewProj] = useState("");

  const updProj = (field, val) => updateProject(p => ({ ...p, [field]: val }));

  const addCol = () => {
    if (!newCol.trim()) return;
    updateProject(p => ({ ...p, kanban: { ...p.kanban, cols: [...p.kanban.cols, newCol.trim()] } }));
    setNewCol("");
  };

  const removeCol = col => {
    if (!window.confirm(`Delete "${col}" and all its cards?`)) return;
    updateProject(p => ({
      ...p,
      kanban: { ...p.kanban, cols: p.kanban.cols.filter(c => c !== col), cards: p.kanban.cards.filter(c => c.col !== col) },
    }));
  };

  const addProject = () => {
    if (!newProj.trim()) return;
    const np = mkProject({ name: newProj.trim() });
    setData(d => ({ ...d, projects: [...d.projects, np], activeProjectId: np.id }));
    setNewProj("");
  };

  const deleteProject = () => {
    if (!window.confirm(`Delete "${project.name}" and all its data? This cannot be undone.`)) return;
    const remaining = data.projects.filter(p => p.id !== project.id);
    setData(d => ({ ...d, projects: remaining, activeProjectId: remaining[0]?.id || null }));
  };

  const handleImport = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => { try { onImport(JSON.parse(ev.target.result)); } catch { alert("Invalid JSON file."); } };
    r.readAsText(f); e.target.value = "";
  };

  return (
    <div className="scroll-area">
      <div className="set-grid">
        {/* Project info */}
        <div className="card" style={{ gridColumn: "span 2" }}>
          <div className="lbl" style={{ marginBottom: 12 }}>Project info</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="m-row"><div className="m-lbl">Name</div><input className="inp" value={project.name} onChange={e => updProj("name", e.target.value)} /></div>
            <div className="m-row">
              <div className="m-lbl">Accent colour</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="color" value={project.accent.startsWith("#") ? project.accent : "#10b981"} onChange={e => updProj("accent", e.target.value)} />
                <div style={{ display: "flex", gap: 6 }}>
                  {["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316","#ec4899"].map(c => (
                    <div key={c} onClick={() => updProj("accent", c)} style={{ width: 16, height: 16, borderRadius: "50%", background: c, cursor: "pointer", border: project.accent === c ? "2px solid white" : "2px solid transparent", transition: "border .1s" }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="m-row">
              <div className="m-lbl">Status</div>
              <select className="inp" value={project.status} onChange={e => updProj("status", e.target.value)}>
                {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div className="m-row">
              <div className="m-lbl">Tags (comma separated)</div>
              <input className="inp" value={project.tags.join(", ")} onChange={e => updProj("tags", e.target.value.split(",").map(t => t.trim()).filter(Boolean))} />
            </div>
            <div className="m-row" style={{ gridColumn: "span 2" }}>
              <div className="m-lbl">Description</div>
              <textarea className="inp" rows={2} value={project.description} onChange={e => updProj("description", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Palette */}
        <div className="card">
          <div className="lbl" style={{ marginBottom: 12 }}>Colour palette</div>
          <div className="pal-grid">
            {Object.entries(PALETTES).map(([k, pal]) => (
              <div key={k} className={`pal-sw${data.palette === k ? " on" : ""}`} onClick={() => setData(d => ({ ...d, palette: k }))}>
                <div className="pal-dot" style={{ background: pal.acc }} />
                <span style={{ fontSize: 12 }}>{pal.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Board columns */}
        <div className="card">
          <div className="lbl" style={{ marginBottom: 10 }}>Board columns</div>
          {project.kanban.cols.map(col => (
            <div key={col} className="col-row">
              <span style={{ flex: 1, fontSize: 12 }}>{col}</span>
              <button className="btn btn-ghost btn-icon btn-danger" onClick={() => removeCol(col)}><Trash2 size={12} /></button>
            </div>
          ))}
          <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
            <input className="inp" style={{ fontSize: 12 }} placeholder="New column…" value={newCol}
              onChange={e => setNewCol(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addCol()} />
            <button className="btn btn-p" style={{ flexShrink: 0 }} onClick={addCol}><Plus size={12} /></button>
          </div>
        </div>

        {/* All projects */}
        <div className="card" style={{ gridColumn: "span 2" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div className="lbl" style={{ marginBottom: 0 }}>All projects</div>
            <div style={{ display: "flex", gap: 7 }}>
              <input className="inp" style={{ width: 200, fontSize: 12 }} placeholder="New project name…" value={newProj}
                onChange={e => setNewProj(e.target.value)} onKeyDown={e => e.key === "Enter" && addProject()} />
              <button className="btn btn-p" onClick={addProject}><Plus size={12} />Add</button>
            </div>
          </div>
          {data.projects.map(p => (
            <div key={p.id} className="proj-edit-row" style={{ borderColor: p.id === project.id ? "var(--acc-b)" : "var(--bd)" }}>
              <input type="color" value={p.accent.startsWith("#") ? p.accent : "#10b981"} onChange={e => {
                setData(d => ({ ...d, projects: d.projects.map(pr => pr.id === p.id ? { ...pr, accent: e.target.value } : pr) }));
              }} />
              <span style={{ flex: 1, fontSize: 12.5, fontWeight: p.id === project.id ? 600 : 400 }}>{p.name}</span>
              <span style={{ fontSize: 10, color: STATUS_COLORS[p.status] || "var(--txt3)", textTransform: "capitalize" }}>{p.status}</span>
              {p.id !== project.id && (
                <button className="btn btn-ghost btn-icon btn-danger" onClick={() => {
                  if (window.confirm(`Delete "${p.name}"?`)) {
                    const remaining = data.projects.filter(pr => pr.id !== p.id);
                    setData(d => ({ ...d, projects: remaining, activeProjectId: remaining[0]?.id || d.activeProjectId }));
                  }
                }}><Trash2 size={12} /></button>
              )}
            </div>
          ))}
        </div>

        {/* Data */}
        <div className="card">
          <div className="lbl" style={{ marginBottom: 12 }}>Data</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <button className="btn" style={{ justifyContent: "flex-start" }} onClick={onExport}><Download size={13} />Export all data as JSON</button>
            <button className="btn" style={{ justifyContent: "flex-start" }} onClick={() => fileRef.current?.click()}><Upload size={13} />Import from JSON</button>
            <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} />
            <div className="divider" />
            <button className="btn btn-danger" style={{ justifyContent: "flex-start" }} onClick={deleteProject}><Trash2 size={13} />Delete this project</button>
            <div style={{ fontSize: 11, color: "var(--txt3)" }}>Import replaces all data. Export first to back up.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// NAVIGATION CONFIG
// ─────────────────────────────────────────────────────────────

const NAV = [
  { id: "overview",  label: "Overview",  Icon: LayoutDashboard },
  { id: "kanban",    label: "Board",     Icon: Columns3 },
  { id: "tasks",     label: "Tasks",     Icon: ListTodo },
  { id: "analytics", label: "Analytics", Icon: BarChart2 },
  { id: "timer",     label: "Timer",     Icon: Timer },
  { id: "notes",     label: "Notes",     Icon: FileText },
  { id: "links",     label: "Links",     Icon: Link2 },
  { id: "settings",  label: "Settings",  Icon: Settings },
];

const FULLBLEED = new Set(["kanban", "tasks", "notes"]);

// ─────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────

export default function App() {
  const [data,         setData]         = useState(null);
  const [ready,        setReady]        = useState(false);
  const [view,         setView]         = useState("overview");
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [newProjModal, setNewProjModal] = useState(false);
  const [newProjName,  setNewProjName]  = useState("");
  const [newProjAccent, setNewProjAccent] = useState("#6366f1");

  const timer = useTimer();

  // ── updateProject — must be above all early returns ──
  // Uses functional setData so activeProjectId is read from current state, no dep on project.id
  const updateProject = useCallback(fn => {
    setData(d => ({
      ...d,
      projects: d.projects.map(p =>
        p.id === d.activeProjectId
          ? (typeof fn === "function" ? fn(p) : fn)
          : p
      ),
    }));
  }, []);

  // ── Load ──
  useEffect(() => {
    (async () => {
      const d = await dbGet("dvf8_data", null);
      if (d) { setData(d); }
      else   { const def = mkDefaults(); setData(def); setShowSwitcher(true); }
      setReady(true);
    })();
  }, []);

  // ── Persist ──
  useEffect(() => { if (ready && data) dbSet("dvf8_data", data); }, [data, ready]);

  if (!data) return null;

  const pal     = data.palette || "midnight";
  const project = data.projects.find(p => p.id === data.activeProjectId) || data.projects[0];

  if (!project) {
    return (
      <>
        <style>{buildCSS("#6366f1", pal)}</style>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg)", color: "var(--txt3)", gap: 10, fontSize: 13 }}>
          No projects.
          <button className="btn btn-p" onClick={() => setNewProjModal(true)}>Create one</button>
        </div>
      </>
    );
  }

  // ── Helpers (not hooks) ──

  const selectProject = id => {
    setData(d => ({ ...d, activeProjectId: id }));
    setShowSwitcher(false); setShowDropdown(false); setView("overview");
  };

  const createProject = () => {
    if (!newProjName.trim()) return;
    const np = mkProject({ name: newProjName.trim(), accent: newProjAccent });
    setData(d => ({ ...d, projects: [...d.projects, np], activeProjectId: np.id }));
    setNewProjModal(false); setNewProjName(""); setNewProjAccent("#6366f1");
    setShowSwitcher(false); setView("overview");
  };

  const onExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `devforge-${todayISO()}.json`;
    a.click();
  };

  const onImport = imported => {
    if (window.confirm("Replace all data with the imported file?")) {
      setData({ ...mkDefaults(), ...imported });
    }
  };

  const openCards = project.kanban.cards.filter(c => !c.archived && c.col !== "Done").length;
  const doneCards = project.kanban.cards.filter(c => !c.archived && c.col === "Done").length;
  const totalCards = project.kanban.cards.filter(c => !c.archived).length;
  const donePct = totalCards > 0 ? Math.round(doneCards / totalCards * 100) : 0;

  const isFullbleed = FULLBLEED.has(view);

  return (
    <>
      <style>{buildCSS(project.accent, pal)}</style>

      {/* Project switcher screen */}
      {showSwitcher && (
        <ProjectSwitcherScreen
          projects={data.projects}
          activeId={data.activeProjectId}
          onSelect={selectProject}
          onNew={() => { setShowSwitcher(false); setNewProjModal(true); }}
        />
      )}

      <div className="app" style={{ display: showSwitcher ? "none" : "flex" }}>
        {/* ── Sidebar ── */}
        <div className="sb">
          <div className="sb-top">
            <div className="sb-logo">Devforge</div>

            {/* Project dropdown */}
            <div className="proj-sw">
              <button className="proj-sw-btn" onClick={() => setShowDropdown(v => !v)}>
                <span className="pdot" style={{ background: project.accent }} />
                <span className="proj-sw-name">{project.name}</span>
                <ChevronDown size={12} style={{ color: "var(--txt3)", flexShrink: 0 }} />
              </button>

              {showDropdown && (
                <div className="proj-dd">
                  {data.projects.map(p => (
                    <div key={p.id} className={`proj-dd-item${p.id === project.id ? " on" : ""}`} onClick={() => selectProject(p.id)}>
                      <span className="pdot" style={{ background: p.accent }} />
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                      {p.id === project.id && <Check size={12} color="var(--acc)" />}
                    </div>
                  ))}
                  <div className="proj-dd-div" />
                  <div className="proj-dd-action" onClick={() => { setShowDropdown(false); setShowSwitcher(true); }}><FolderOpen size={12} />All projects</div>
                  <div className="proj-dd-action" onClick={() => { setShowDropdown(false); setNewProjModal(true); }}><Plus size={12} />New project</div>
                </div>
              )}
            </div>
          </div>

          <div className="sb-scroll">
            {NAV.map(({ id, label, Icon }) => (
              <div key={id} className={`ni${view === id ? " on" : ""}`} onClick={() => { setView(id); setShowDropdown(false); }}>
                <Icon size={14} />{label}
              </div>
            ))}

          </div>

          <div className="sb-foot">
            <div className="sb-foot-row">
              <span>{openCards} open</span>
              <span style={{ color: "var(--acc)" }}>{donePct}% done</span>
            </div>
            {timer.running && (
              <div className="timer-indicator" onClick={() => setView("timer")} style={{ cursor: "pointer" }}>
                <span className="pulse-dot" />
                <span style={{ fontSize: 11, color: "var(--acc)", fontVariantNumeric: "tabular-nums" }}>{fmtSecs(timer.elapsed)}</span>
                <span style={{ fontSize: 10, color: "var(--txt3)", marginLeft: "auto" }}>→ Timer</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Main ── */}
        <div className="main" onClick={() => showDropdown && setShowDropdown(false)}>
          {!isFullbleed && (
            <div className="topbar">
              <span className="topbar-title">{NAV.find(n => n.id === view)?.label}</span>
            </div>
          )}

          {view === "overview"  && <Overview   project={project} updateProject={updateProject} />}
          {view === "kanban"    && <Kanban     project={project} updateProject={updateProject} />}
          {view === "tasks"     && <Tasks      project={project} updateProject={updateProject} />}
          {view === "analytics" && <Analytics  project={project} />}
          {view === "timer"     && <TimerView  project={project} timer={timer} />}
          {view === "notes"     && <Notes      project={project} updateProject={updateProject} />}
          {view === "links"     && <Links      project={project} updateProject={updateProject} />}
          {view === "settings"  && <SettingsView data={data} setData={setData} project={project} updateProject={updateProject} onExport={onExport} onImport={onImport} />}
        </div>
      </div>

      {/* ── New project modal ── */}
      {newProjModal && (
        <div className="backdrop" onClick={() => setNewProjModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">New project</div>
            <div className="m-row">
              <div className="m-lbl">Name</div>
              <input className="inp" autoFocus placeholder="My Project" value={newProjName}
                onChange={e => setNewProjName(e.target.value)} onKeyDown={e => e.key === "Enter" && createProject()} />
            </div>
            <div className="m-row">
              <div className="m-lbl">Accent colour</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="color" value={newProjAccent} onChange={e => setNewProjAccent(e.target.value)} />
                <div style={{ display: "flex", gap: 7 }}>
                  {["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316","#ec4899"].map(c => (
                    <div key={c} onClick={() => setNewProjAccent(c)} style={{ width: 18, height: 18, borderRadius: "50%", background: c, cursor: "pointer", border: newProjAccent === c ? "2px solid white" : "2px solid transparent", transition: "border .1s" }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="m-actions">
              <button className="btn" onClick={() => setNewProjModal(false)}>Cancel</button>
              <button className="btn btn-p" onClick={createProject}>Create project</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
