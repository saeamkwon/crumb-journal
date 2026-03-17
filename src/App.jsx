import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

const THEME = {
  cream: "#FAF7F2", parchment: "#F2EDE3", warmWhite: "#FFFDF9", tan: "#E8DDD0",
  brown: "#8B6F5E", darkBrown: "#3D2B1F", accent: "#C4845A", accentLight: "#F0D4C0",
  green: "#7A9E7E", greenLight: "#D4E8D6", text: "#2C1F15", textMid: "#6B4F3A",
  textLight: "#A08070", border: "#E0D5C8",
};

const SKILL_LEVELS = [
  { id: "beginner", label: "Beginner Baker", icon: "🌱", desc: "New to baking — following recipes closely, learning basic techniques.", examples: ["Box mixes", "Simple cookies", "Banana bread"] },
  { id: "intermediate", label: "Home Baker", icon: "🥐", desc: "Comfortable with most recipes — can brown butter, temper chocolate, troubleshoot.", examples: ["Layer cakes", "Homemade pasta", "Sourdough basics"] },
  { id: "advanced", label: "Skilled Baker", icon: "🎂", desc: "Confident baker — adapt recipes, work with laminated doughs, complex techniques.", examples: ["Croissants", "Choux pastry", "Mirror glazes"] },
  { id: "expert", label: "Pastry Chef Level", icon: "👨‍🍳", desc: "Professional or near-professional skill — requires minimal guidance.", examples: ["Croquembouche", "Pulled sugar", "Multi-tier wedding cakes"] },
];

const RESOURCE_BANK = [
  { id: 1, category: "Techniques", title: "How to Brown Butter", emoji: "🧈", skill: "intermediate", content: "Brown butter (beurre noisette) adds a nutty, caramel depth. Melt butter over medium heat stirring constantly. It will foam, then subside. Watch for golden-brown milk solids and nutty aroma. Remove from heat immediately. Takes 5–8 minutes." },
  { id: 2, category: "Techniques", title: "Tempering Chocolate", emoji: "🍫", skill: "advanced", content: "Tempering gives chocolate a glossy finish and snap. Melt 2/3 to 115°F, add remaining chopped chocolate while stirring until 88°F for dark. Use immediately." },
  { id: 3, category: "Tools", title: "Essential Baking Tools", emoji: "🥄", skill: "beginner", content: "Every baker needs: a kitchen scale, bench scraper, offset spatula, stand/hand mixer, parchment paper, and a reliable oven thermometer (most ovens run 25° off)." },
  { id: 4, category: "Substitutions", title: "Egg Substitutions", emoji: "🥚", skill: "beginner", content: "Per egg: 1 tbsp ground flaxseed + 3 tbsp water (binding), ¼ cup applesauce, 3 tbsp aquafaba (lift), or ¼ cup mashed banana." },
  { id: 5, category: "Techniques", title: "Laminating Dough", emoji: "🥐", skill: "advanced", content: "Creates flaky layers by folding cold butter into dough repeatedly. Keep everything under 65°F, work quickly, rest in fridge between folds. Croissants get 27 layers from 3 tri-folds." },
  { id: 6, category: "Science", title: "Why Does Bread Rise?", emoji: "🍞", skill: "beginner", content: "Yeast eats sugars and releases CO2, trapped by gluten. Baking powder releases CO2 when wet AND hot (double-acting). Baking soda needs acid to activate." },
  { id: 7, category: "Substitutions", title: "Buttermilk Substitute", emoji: "🥛", skill: "beginner", content: "Add 1 tbsp white vinegar or lemon juice to 1 cup milk. Stir and let sit 5 minutes." },
  { id: 8, category: "Techniques", title: "Blind Baking a Crust", emoji: "🥧", skill: "intermediate", content: "Line pie crust with parchment, fill with pie weights. Bake at 375°F for 15 min, remove weights, bake 5–10 more until golden. Prevents soggy bottoms." },
];

// ─── CLAUDE API ────────────────────────────────────────────────────────────────
// NOTE: Move this to a backend API route before going fully public
// to keep your Anthropic API key private.
async function callClaude(prompt, system = "You are a helpful baking assistant. Respond only with valid JSON, no markdown, no backticks.") {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await res.json();
  return data.content?.map(i => i.text || "").join("") || "";
}

// ─── PRIMITIVES ────────────────────────────────────────────────────────────────
function Notification({ data }) {
  if (!data) return null;
  return (
    <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999, background: data.type === "error" ? "#FEE2E2" : THEME.greenLight, color: data.type === "error" ? "#991B1B" : "#1A4D20", border: `1px solid ${data.type === "error" ? "#FCA5A5" : "#86C98E"}`, borderRadius: 12, padding: "12px 20px", fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", animation: "slideIn 0.3s ease" }}>
      {data.msg}
    </div>
  );
}

function Logo({ size = 24, light = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: size * 1.6, height: size * 1.6, borderRadius: "50%", background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.brown})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.8, flexShrink: 0 }}>🥖</div>
      <div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: size, fontWeight: 700, color: light ? "#fff" : THEME.darkBrown, lineHeight: 1 }}>Crumb</div>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: size * 0.45, color: light ? "rgba(255,255,255,0.5)" : THEME.textLight, letterSpacing: 3, textTransform: "uppercase" }}>Journal</div>
      </div>
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", size = "md", disabled = false, full = false, style = {} }) {
  const s = { sm: { padding: "8px 14px", fontSize: 13 }, md: { padding: "11px 22px", fontSize: 14 }, lg: { padding: "15px 30px", fontSize: 16 } }[size];
  const v = {
    primary: { background: THEME.accent, color: "#fff", border: "none", boxShadow: `0 2px 10px ${THEME.accentLight}` },
    secondary: { background: THEME.parchment, color: THEME.darkBrown, border: `1px solid ${THEME.border}` },
    ghost: { background: "transparent", color: THEME.textMid, border: `1px solid ${THEME.border}` },
    danger: { background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5" },
    green: { background: THEME.green, color: "#fff", border: "none", boxShadow: `0 2px 10px ${THEME.greenLight}` },
    outline: { background: "transparent", color: THEME.accent, border: `1.5px solid ${THEME.accent}` },
  }[variant];
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...s, ...v, borderRadius: 10, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, transition: "all 0.18s", opacity: disabled ? 0.5 : 1, display: "inline-flex", alignItems: "center", gap: 7, width: full ? "100%" : undefined, justifyContent: full ? "center" : undefined, ...style }}>
      {children}
    </button>
  );
}

function Card({ children, style = {}, onClick, hover = true }) {
  return (
    <div onClick={onClick} style={{ background: THEME.warmWhite, border: `1px solid ${THEME.border}`, borderRadius: 16, padding: 22, cursor: onClick ? "pointer" : "default", transition: "box-shadow 0.18s", ...style }}
      onMouseEnter={e => hover && onClick && (e.currentTarget.style.boxShadow = "0 4px 20px rgba(139,111,94,0.13)")}
      onMouseLeave={e => hover && onClick && (e.currentTarget.style.boxShadow = "none")}>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", multiline = false, rows = 4 }) {
  const sh = { width: "100%", padding: "11px 14px", borderRadius: 10, border: `1px solid ${THEME.border}`, background: THEME.warmWhite, fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: THEME.text, outline: "none", boxSizing: "border-box", resize: multiline ? "vertical" : "none" };
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", marginBottom: 5, fontSize: 13, fontWeight: 600, color: THEME.textMid, fontFamily: "'DM Sans',sans-serif" }}>{label}</label>}
      {multiline ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={sh} /> : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={sh} />}
    </div>
  );
}

// ─── SIDEBAR ───────────────────────────────────────────────────────────────────
function Sidebar({ screen, set, user, profile, collapsed, onToggle }) {
  const nav = [
    { id: "dashboard", icon: "⌂", label: "Dashboard" },
    { id: "new-session", icon: "＋", label: "New Session" },
    { id: "my-recipes", icon: "📖", label: "My Recipes" },
    { id: "resources", icon: "📚", label: "Resources" },
    { id: "community", icon: "🌍", label: "Community" },
    { id: "settings", icon: "⚙", label: "Settings" },
  ];
  const w = collapsed ? 64 : 220;
  return (
    <div style={{ width: w, minHeight: "100vh", background: THEME.darkBrown, display: "flex", flexDirection: "column", padding: collapsed ? "24px 10px" : "24px 14px", position: "fixed", left: 0, top: 0, zIndex: 100, transition: "width 0.25s ease, padding 0.25s ease", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", marginBottom: 36, paddingLeft: collapsed ? 0 : 4 }}>
        {!collapsed && <Logo size={17} light />}
        {collapsed && <div style={{ fontSize: 22 }}>🥖</div>}
        <button onClick={onToggle} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: 14, flexShrink: 0, marginLeft: collapsed ? 0 : 8 }}>
          {collapsed ? "›" : "‹"}
        </button>
      </div>
      <div style={{ flex: 1 }}>
        {nav.map(item => (
          <div key={item.id} onClick={() => set({ screen: item.id })} title={collapsed ? item.label : undefined} style={{ display: "flex", alignItems: "center", gap: collapsed ? 0 : 11, padding: collapsed ? "11px 0" : "11px 10px", justifyContent: collapsed ? "center" : "flex-start", borderRadius: 10, marginBottom: 4, cursor: "pointer", background: screen === item.id ? "rgba(196,132,90,0.25)" : "transparent", color: screen === item.id ? THEME.accentLight : "rgba(255,255,255,0.6)", fontFamily: "'DM Sans',sans-serif", fontWeight: screen === item.id ? 600 : 400, fontSize: 14, transition: "all 0.15s", borderLeft: !collapsed && screen === item.id ? `3px solid ${THEME.accent}` : "3px solid transparent" }}>
            <span style={{ fontSize: 17 }}>{item.icon}</span>
            {!collapsed && <span style={{ whiteSpace: "nowrap", overflow: "hidden" }}>{item.label}</span>}
          </div>
        ))}
      </div>
      {!collapsed && (
        <div style={{ padding: "14px 10px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ fontFamily: "'DM Sans',sans-serif", color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile?.username || user?.email}</div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>
            {SKILL_LEVELS.find(s => s.id === profile?.skill_level)?.icon} {SKILL_LEVELS.find(s => s.id === profile?.skill_level)?.label}
          </div>
        </div>
      )}
      {collapsed && <div style={{ display: "flex", justifyContent: "center", paddingBottom: 8 }}><span style={{ fontSize: 20 }}>{SKILL_LEVELS.find(s => s.id === profile?.skill_level)?.icon || "👤"}</span></div>}
    </div>
  );
}

function PageWrapper({ children, sidebarWidth }) {
  return <div style={{ marginLeft: sidebarWidth, minHeight: "100vh", background: THEME.cream, padding: "38px 40px", transition: "margin-left 0.25s ease" }}>{children}</div>;
}

function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
      <div>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, color: THEME.darkBrown, margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ fontFamily: "'DM Sans',sans-serif", color: THEME.textLight, margin: "5px 0 0", fontSize: 14 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── LOGIN SCREEN ──────────────────────────────────────────────────────────────
function LoginScreen({ onAuth, notify }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!email || !password) return notify("Please fill in all fields", "error");
    if (mode === "signup" && !username) return notify("Please enter a username", "error");
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) return notify(error.message, "error");
        // Create profile row
        await supabase.from("profiles").insert({ id: data.user.id, username, email, skill_level: null, join_date: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }) });
        notify("Account created! Let's set your skill level 🎉");
        onAuth(data.user, null); // null skill = go to onboarding
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return notify(error.message, "error");
        // Fetch profile
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
        notify(`Welcome back, ${profile?.username || "baker"}! 🥖`);
        onAuth(data.user, profile);
      }
    } catch (e) {
      notify("Something went wrong — please try again", "error");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg,${THEME.cream},${THEME.parchment})`, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}><Logo size={32} /><p style={{ fontFamily: "'DM Sans',sans-serif", color: THEME.textLight, marginTop: 10, fontSize: 15 }}>Your personal baking journal</p></div>
        <Card>
          <div style={{ display: "flex", gap: 6, marginBottom: 22, background: THEME.parchment, borderRadius: 10, padding: 4 }}>
            {["login", "signup"].map(m => <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "9px", border: "none", borderRadius: 8, cursor: "pointer", background: mode === m ? THEME.warmWhite : "transparent", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14, color: mode === m ? THEME.darkBrown : THEME.textLight, transition: "all 0.2s", boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>{m === "login" ? "Sign In" : "Create Account"}</button>)}
          </div>
          {mode === "signup" && <Input label="Username" value={username} onChange={setUsername} placeholder="e.g. julia_bakes" />}
          <Input label="Email" value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
          <Input label="Password" value={password} onChange={setPassword} placeholder="••••••••" type="password" />
          <Btn onClick={handle} disabled={loading} full size="lg" style={{ marginTop: 6 }}>{loading ? "One moment..." : mode === "login" ? "Sign In →" : "Create Account →"}</Btn>
        </Card>
        <div style={{ marginTop: 44, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, textAlign: "center" }}>
          {[["📖", "Track Every Bake"], ["🌱", "Grow Your Skills"], ["🌍", "Join Community"]].map(([e, t]) => <div key={t}><div style={{ fontSize: 24, marginBottom: 4 }}>{e}</div><div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: THEME.textLight }}>{t}</div></div>)}
        </div>
      </div>
    </div>
  );
}

// ─── ONBOARDING ────────────────────────────────────────────────────────────────
function OnboardingScreen({ user, onComplete, notify }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!selected) return notify("Please select your skill level", "error");
    setLoading(true);
    await supabase.from("profiles").update({ skill_level: selected }).eq("id", user.id);
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    notify("Welcome to Crumb Journal! 🎉");
    onComplete(profile);
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: THEME.cream, padding: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ maxWidth: 620, width: "100%" }}>
        <Logo size={22} />
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 34, color: THEME.darkBrown, marginTop: 28, marginBottom: 6 }}>What level are you at?</h1>
        <p style={{ fontFamily: "'DM Sans',sans-serif", color: THEME.textLight, fontSize: 15, marginBottom: 28 }}>This helps us know when to show technique tips during your baking sessions.</p>
        <div style={{ display: "grid", gap: 10, marginBottom: 28 }}>
          {SKILL_LEVELS.map(s => (
            <div key={s.id} onClick={() => setSelected(s.id)} style={{ padding: 18, borderRadius: 14, border: `2px solid ${selected === s.id ? THEME.accent : THEME.border}`, background: selected === s.id ? THEME.accentLight : THEME.warmWhite, cursor: "pointer", transition: "all 0.2s", display: "flex", gap: 14, alignItems: "flex-start" }}>
              <span style={{ fontSize: 30 }}>{s.icon}</span>
              <div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15, color: THEME.darkBrown }}>{s.label}</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: THEME.textMid, marginTop: 3 }}>{s.desc}</div>
                <div style={{ marginTop: 6, display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {s.examples.map(e => <span key={e} style={{ background: THEME.tan, color: THEME.brown, fontSize: 11, padding: "2px 9px", borderRadius: 20, fontFamily: "'DM Sans',sans-serif" }}>{e}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
        <Btn full size="lg" disabled={loading} onClick={save}>{loading ? "Saving..." : "Start Baking →"}</Btn>
      </div>
    </div>
  );
}

// ─── DASHBOARD ─────────────────────────────────────────────────────────────────
function DashboardScreen({ user, profile, sessions, set, sw }) {
  return (
    <PageWrapper sidebarWidth={sw}>
      <PageHeader title={`Good morning, ${profile?.username?.split(" ")[0] || "baker"} 👋`} subtitle={`Member since ${profile?.join_date}`} action={<Btn onClick={() => set({ screen: "new-session" })}>＋ New Session</Btn>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18, marginBottom: 32 }}>
        {[{ label: "Bakes Logged", value: sessions.length, icon: "🍰", color: THEME.accentLight }, { label: "Recipes Tried", value: new Set(sessions.map(s => s.recipe_name)).size, icon: "📖", color: THEME.greenLight }, { label: "Skill Level", value: SKILL_LEVELS.find(s => s.id === profile?.skill_level)?.label || "Not Set", icon: "⭐", color: THEME.tan }].map(stat => (
          <Card key={stat.label} style={{ background: stat.color, border: "none" }} hover={false}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>{stat.icon}</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: THEME.darkBrown }}>{stat.value}</div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: THEME.textMid, marginTop: 2 }}>{stat.label}</div>
          </Card>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: THEME.darkBrown, marginBottom: 14 }}>Recent Bakes</h2>
          {sessions.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 40 }} hover={false}><div style={{ fontSize: 44, marginBottom: 10 }}>🥣</div><div style={{ fontFamily: "'DM Sans',sans-serif", color: THEME.textLight, fontSize: 14 }}>No bakes yet — start your first session!</div><Btn onClick={() => set({ screen: "new-session" })} style={{ marginTop: 14 }}>Start Baking →</Btn></Card>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {[...sessions].reverse().slice(0, 4).map(s => (
                <Card key={s.id} style={{ padding: 14 }} onClick={() => set({ screen: "my-recipes" })}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: THEME.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{s.photo || "🍞"}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 14, color: THEME.darkBrown, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.recipe_name}</div>
                      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: THEME.textLight, marginTop: 2 }}>{s.bake_date}{s.rating ? ` · ${s.rating}/5 ⭐` : ""}</div>
                    </div>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: THEME.accent, fontWeight: 600, flexShrink: 0 }}>View →</div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: THEME.darkBrown, marginBottom: 14 }}>Quick Resources</h2>
          <div style={{ display: "grid", gap: 9 }}>
            {RESOURCE_BANK.slice(0, 4).map(r => (
              <Card key={r.id} style={{ padding: 13 }} onClick={() => set({ screen: "resources" })}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 20 }}>{r.emoji}</span>
                  <div><div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13, color: THEME.darkBrown }}>{r.title}</div><div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: THEME.textLight }}>{r.category}</div></div>
                </div>
              </Card>
            ))}
            <Btn variant="ghost" onClick={() => set({ screen: "resources" })} size="sm" full>View All Resources →</Btn>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

// ─── BAKING SESSION ────────────────────────────────────────────────────────────
function BakingSessionScreen({ user, profile, set, notify, sw, prefillSession = null, onSessionSaved }) {
  const [phase, setPhase] = useState(prefillSession ? "walking" : "input");
  const [recipeInput, setRecipeInput] = useState("");
  const [recipe, setRecipe] = useState(prefillSession?.recipe_data || null);
  const [parsedStepNotes, setParsedStepNotes] = useState(prefillSession?.parsed_step_notes || {});
  const [currentStep, setCurrentStep] = useState(0);
  const [stepNotes, setStepNotes] = useState({});
  const [photo, setPhoto] = useState(null);
  const [rating, setRating] = useState(0);
  const [reviewNotes, setReviewNotes] = useState({ general: "", changes: "", makeAgain: null });
  const [loading, setLoading] = useState(false);
  const [expandedIngredients, setExpandedIngredients] = useState(false);
  const photoEmojis = ["🍰", "🎂", "🍪", "🥐", "🍞", "🥧", "🧁", "🥮", "🍩", "🥖"];
  const userSkillIdx = SKILL_LEVELS.findIndex(s => s.id === profile?.skill_level);

  const extractRecipe = async () => {
    if (!recipeInput.trim()) return notify("Please enter a recipe or URL", "error");
    setLoading(true); setPhase("loading");
    try {
      const raw = await callClaude(`Extract recipe from: "${recipeInput}". Return JSON:
{"name":"string","description":"string","servings":"string","prepTime":"string","cookTime":"string","skillLevel":"beginner|intermediate|advanced|expert","ingredients":[{"name":"string","amount":"string","note":"string or null"}],"steps":[{"instruction":"string","skill":"technique name or null","skillLevel":"beginner|intermediate|advanced|expert|null","tip":"helpful tip or null","timer":"string or null"}],"tags":["string"]}`);
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      setRecipe(parsed); setPhase("walking"); setCurrentStep(0);
      notify(`Recipe loaded: ${parsed.name}`);
    } catch {
      notify("Couldn't parse — try a recipe name or paste the full recipe", "error"); setPhase("input");
    }
    setLoading(false);
  };

  const shouldShowTip = (step) => {
    if (!step?.skillLevel || !step?.tip) return false;
    return SKILL_LEVELS.findIndex(s => s.id === step.skillLevel) > userSkillIdx;
  };

  const completeSession = async () => {
    let newParsedStepNotes = { ...parsedStepNotes };
    if (reviewNotes.changes.trim() && recipe?.steps) {
      try {
        notify("Saving and parsing your notes... 🪄");
        const stepsJson = JSON.stringify(recipe.steps.map((s, i) => ({ index: i, instruction: s.instruction })));
        const raw = await callClaude(`User's note about changes: "${reviewNotes.changes}"\nSteps: ${stepsJson}\nMap each note to the most relevant step index. Return JSON: {"stepNotes":{"0":"note","3":"note"}}`);
        const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
        if (parsed.stepNotes) newParsedStepNotes = { ...newParsedStepNotes, ...parsed.stepNotes };
      } catch { /* silent */ }
    }

    // Save to Supabase
    const { data, error } = await supabase.from("sessions").insert({
      user_id: user.id,
      recipe_name: recipe?.name,
      recipe_data: recipe,
      parsed_step_notes: newParsedStepNotes,
      photo,
      rating,
      bake_date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      step_notes: stepNotes,
      general_notes: reviewNotes.general,
      changes_notes: reviewNotes.changes,
      make_again: reviewNotes.makeAgain,
      is_bake_again: !!prefillSession,
    }).select().single();

    if (error) return notify("Error saving session — please try again", "error");
    notify(`"${recipe?.name}" logged to your journal! 🎉`);
    onSessionSaved(data);
    set({ screen: "my-recipes" });
  };

  if (phase === "input") return (
    <PageWrapper sidebarWidth={sw}>
      <PageHeader title="New Baking Session" subtitle="Paste a recipe URL, describe what you want to bake, or type out a recipe" action={<Btn variant="ghost" onClick={() => set({ screen: "dashboard" })}>← Back</Btn>} />
      <div style={{ maxWidth: 640 }}>
        <Card>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", marginBottom: 7, fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13, color: THEME.textMid }}>Recipe Source</label>
            <textarea value={recipeInput} onChange={e => setRecipeInput(e.target.value)} placeholder={"Paste a URL...\nOr describe: 'classic banana bread'\nOr paste an entire recipe"} rows={6} style={{ width: "100%", padding: "13px 14px", borderRadius: 10, border: `1px solid ${THEME.border}`, background: THEME.warmWhite, fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: THEME.text, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 22 }}>
            {["Chocolate Chip Cookies", "Sourdough Bread", "Lemon Tart", "Banana Bread", "Croissants"].map(ex => <button key={ex} onClick={() => setRecipeInput(ex)} style={{ background: THEME.parchment, border: `1px solid ${THEME.border}`, borderRadius: 20, padding: "5px 13px", fontSize: 12, fontFamily: "'DM Sans',sans-serif", color: THEME.textMid, cursor: "pointer" }}>{ex}</button>)}
          </div>
          <Btn onClick={extractRecipe} size="lg" full>🪄 Extract Recipe with AI</Btn>
        </Card>
      </div>
    </PageWrapper>
  );

  if (phase === "loading") return (
    <PageWrapper sidebarWidth={sw}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 20 }}>
        <div style={{ fontSize: 60, animation: "spin 2s linear infinite" }}>🥄</div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, color: THEME.darkBrown }}>Extracting your recipe...</h2>
        <p style={{ fontFamily: "'DM Sans',sans-serif", color: THEME.textLight, fontSize: 14 }}>Claude is reading the recipe and preparing your session</p>
      </div>
    </PageWrapper>
  );

  if (phase === "walking" && recipe) {
    const step = recipe.steps[currentStep];
    const showTip = shouldShowTip(step);
    const isLast = currentStep === recipe.steps.length - 1;
    const prevNote = parsedStepNotes?.[String(currentStep)];
    return (
      <PageWrapper sidebarWidth={sw}>
        <div style={{ maxWidth: 760 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
            <Btn variant="ghost" size="sm" onClick={() => prefillSession ? set({ screen: "my-recipes" }) : setPhase("input")}>← Back</Btn>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: THEME.darkBrown, margin: 0 }}>{recipe.name}</h1>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: THEME.textLight, margin: "3px 0 0" }}>{recipe.servings} · {recipe.prepTime} prep · {recipe.cookTime} cook</p>
            </div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: THEME.accent, fontWeight: 700, background: THEME.accentLight, padding: "5px 13px", borderRadius: 20, flexShrink: 0 }}>Step {currentStep + 1}/{recipe.steps.length}</div>
          </div>
          <div style={{ height: 5, background: THEME.tan, borderRadius: 4, marginBottom: 28, overflow: "hidden" }}>
            <div style={{ height: "100%", background: THEME.accent, borderRadius: 4, width: `${((currentStep + 1) / recipe.steps.length) * 100}%`, transition: "width 0.4s ease" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 22 }}>
            <div>
              {prevNote && (
                <div style={{ background: "#FFF8F0", border: `1px solid ${THEME.accentLight}`, borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 18 }}>📝</span>
                  <div>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 700, color: THEME.accent, marginBottom: 4 }}>YOUR NOTE FROM LAST TIME</div>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: THEME.textMid, lineHeight: 1.5 }}>{prevNote}</div>
                  </div>
                </div>
              )}
              <Card style={{ marginBottom: 18 }} hover={false}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: THEME.textLight, marginBottom: 7, textTransform: "uppercase", letterSpacing: 2, fontWeight: 600 }}>Step {currentStep + 1}</div>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 16, color: THEME.text, lineHeight: 1.75, margin: 0 }}>{step.instruction}</p>
                {step.timer && <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 7, background: THEME.accentLight, padding: "7px 14px", borderRadius: 20 }}><span>⏱</span><span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, color: THEME.darkBrown }}>{step.timer}</span></div>}
              </Card>
              {showTip && (
                <Card style={{ background: "#FFF8F0", border: `1px solid ${THEME.accentLight}`, marginBottom: 18 }} hover={false}>
                  <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 22 }}>💡</span>
                    <div>
                      <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 13, color: THEME.accent, marginBottom: 5 }}>Technique: {step.skill}</div>
                      <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: THEME.textMid, margin: 0, lineHeight: 1.65 }}>{step.tip}</p>
                    </div>
                  </div>
                </Card>
              )}
              <Input label="Notes for this step (optional)" value={stepNotes[currentStep] || ""} onChange={v => setStepNotes(p => ({ ...p, [currentStep]: v }))} placeholder="e.g. butter browned in 6 min..." multiline rows={3} />
              <div style={{ display: "flex", gap: 10 }}>
                {currentStep > 0 && <Btn variant="ghost" onClick={() => setCurrentStep(p => p - 1)}>← Prev</Btn>}
                <Btn onClick={() => isLast ? setPhase("complete") : setCurrentStep(p => p + 1)} style={{ flex: 1, justifyContent: "center" }}>{isLast ? "🎉 Finish Recipe" : "Next Step →"}</Btn>
              </div>
            </div>
            <div>
              <Card style={{ position: "sticky", top: 24 }} hover={false}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 13, color: THEME.darkBrown, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  Ingredients
                  <button onClick={() => setExpandedIngredients(!expandedIngredients)} style={{ background: "none", border: "none", cursor: "pointer", color: THEME.accent, fontSize: 11, fontFamily: "'DM Sans',sans-serif" }}>{expandedIngredients ? "Less" : "All"}</button>
                </div>
                {(expandedIngredients ? recipe.ingredients : recipe.ingredients.slice(0, 7)).map((ing, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${THEME.border}`, fontFamily: "'DM Sans',sans-serif" }}>
                    <span style={{ fontSize: 12, color: THEME.text }}>{ing.name}</span>
                    <span style={{ fontSize: 12, color: THEME.textLight, fontWeight: 600 }}>{ing.amount}</span>
                  </div>
                ))}
                {!expandedIngredients && recipe.ingredients.length > 7 && <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: THEME.textLight, marginTop: 6 }}>+{recipe.ingredients.length - 7} more...</div>}
              </Card>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (phase === "complete") return (
    <PageWrapper sidebarWidth={sw}>
      <div style={{ maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 72, marginBottom: 14 }}>🎉</div>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 34, color: THEME.darkBrown }}>You did it!</h1>
        <p style={{ fontFamily: "'DM Sans',sans-serif", color: THEME.textLight, fontSize: 15, marginBottom: 32 }}>{recipe?.name} is complete. Add a photo?</p>
        <Card style={{ marginBottom: 22 }} hover={false}>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 14, color: THEME.darkBrown, marginBottom: 14 }}>Add a Photo</div>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap", justifyContent: "center", marginBottom: 14 }}>
            {photoEmojis.map(e => <div key={e} onClick={() => setPhoto(e)} style={{ width: 50, height: 50, borderRadius: 10, background: photo === e ? THEME.accentLight : THEME.parchment, border: `2px solid ${photo === e ? THEME.accent : THEME.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, cursor: "pointer", transition: "all 0.18s" }}>{e}</div>)}
          </div>
        </Card>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Btn variant="ghost" onClick={() => setPhase("review")}>Skip</Btn>
          <Btn onClick={() => setPhase("review")}>Continue to Review →</Btn>
        </div>
      </div>
    </PageWrapper>
  );

  if (phase === "review") return (
    <PageWrapper sidebarWidth={sw}>
      <div style={{ maxWidth: 580 }}>
        <PageHeader title="How did it turn out?" subtitle={`Log your thoughts on ${recipe?.name}`} />
        <Card style={{ marginBottom: 18 }} hover={false}>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 13, color: THEME.darkBrown, marginBottom: 10 }}>Overall Rating</div>
          <div style={{ display: "flex", gap: 9, marginBottom: 18 }}>
            {[1,2,3,4,5].map(n => <div key={n} onClick={() => setRating(n)} style={{ width: 42, height: 42, borderRadius: 10, cursor: "pointer", background: rating >= n ? THEME.accentLight : THEME.parchment, border: `2px solid ${rating >= n ? THEME.accent : THEME.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, transition: "all 0.15s" }}>⭐</div>)}
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, color: THEME.textMid, marginBottom: 6 }}>Would you make it again?</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Definitely!", "Maybe", "Probably not"].map(opt => <button key={opt} onClick={() => setReviewNotes(p => ({ ...p, makeAgain: opt }))} style={{ padding: "7px 14px", borderRadius: 8, border: `2px solid ${reviewNotes.makeAgain === opt ? THEME.accent : THEME.border}`, background: reviewNotes.makeAgain === opt ? THEME.accentLight : THEME.warmWhite, fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, color: reviewNotes.makeAgain === opt ? THEME.darkBrown : THEME.textMid, cursor: "pointer" }}>{opt}</button>)}
            </div>
          </div>
        </Card>
        <Card style={{ marginBottom: 18 }} hover={false}>
          <Input label="General Notes" value={reviewNotes.general} onChange={v => setReviewNotes(p => ({ ...p, general: v }))} placeholder="How did it taste? Texture? Appearance?" multiline />
          <Input label="What would you change next time?" value={reviewNotes.changes} onChange={v => setReviewNotes(p => ({ ...p, changes: v }))} placeholder="e.g. less sugar, reduce bake time by 3 min..." multiline />
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: THEME.textLight, margin: "4px 0 0" }}>💡 These notes will be automatically attached to the relevant steps for your next bake.</p>
        </Card>
        <Btn onClick={completeSession} size="lg" variant="green" full>📖 Save to Journal</Btn>
      </div>
    </PageWrapper>
  );

  return null;
}

// ─── MY RECIPES ────────────────────────────────────────────────────────────────
function MyRecipesScreen({ user, sessions, set, notify, sw, onBakeAgain }) {
  const [viewingSession, setViewingSession] = useState(null);

  const recipeGroups = {};
  sessions.forEach(s => {
    if (!recipeGroups[s.recipe_name]) recipeGroups[s.recipe_name] = [];
    recipeGroups[s.recipe_name].push(s);
  });
  const uniqueRecipes = Object.values(recipeGroups).map(g => ({ latest: g[g.length - 1], history: g }));

  if (viewingSession) {
    const history = recipeGroups[viewingSession.recipe_name] || [];
    return (
      <PageWrapper sidebarWidth={sw}>
        <div style={{ maxWidth: 680 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
            <Btn variant="ghost" size="sm" onClick={() => setViewingSession(null)}>← Back</Btn>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, color: THEME.darkBrown, margin: 0, flex: 1 }}>{viewingSession.recipe_name}</h1>
            <Btn size="sm" onClick={() => onBakeAgain(viewingSession)}>🔄 Bake Again</Btn>
          </div>
          {history.length > 1 && (
            <Card style={{ marginBottom: 24, background: THEME.greenLight, border: "none" }} hover={false}>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 13, color: THEME.darkBrown, marginBottom: 12 }}>📈 Bake History ({history.length} bakes)</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {history.map((h, i) => (
                  <div key={h.id} onClick={() => setViewingSession(h)} style={{ background: viewingSession.id === h.id ? THEME.green : THEME.warmWhite, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: viewingSession.id === h.id ? "#fff" : THEME.textMid, fontWeight: viewingSession.id === h.id ? 700 : 400 }}>
                    #{i + 1} · {h.bake_date}{h.rating ? ` · ${h.rating}⭐` : ""}
                  </div>
                ))}
              </div>
            </Card>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
            {viewingSession.rating > 0 && <Card style={{ padding: 16 }} hover={false}><div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: THEME.textLight, fontWeight: 600, marginBottom: 6 }}>RATING</div><div style={{ fontSize: 22 }}>{"⭐".repeat(viewingSession.rating)}</div></Card>}
            {viewingSession.make_again && <Card style={{ padding: 16 }} hover={false}><div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: THEME.textLight, fontWeight: 600, marginBottom: 6 }}>MAKE AGAIN?</div><div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, color: THEME.green }}>{viewingSession.make_again}</div></Card>}
          </div>
          {viewingSession.general_notes && <Card style={{ marginBottom: 14 }} hover={false}><div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 700, color: THEME.textLight, marginBottom: 6 }}>GENERAL NOTES</div><p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: THEME.text, margin: 0, lineHeight: 1.65 }}>{viewingSession.general_notes}</p></Card>}
          {viewingSession.changes_notes && <Card style={{ background: "#FFF8F0", border: `1px solid ${THEME.accentLight}`, marginBottom: 20 }} hover={false}><div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 700, color: THEME.accent, marginBottom: 6 }}>CHANGES FOR NEXT TIME</div><p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: THEME.textMid, margin: 0, lineHeight: 1.65 }}>{viewingSession.changes_notes}</p></Card>}
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: THEME.darkBrown, marginBottom: 14 }}>Recipe</h2>
          <Card style={{ marginBottom: 20 }} hover={false}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 13, color: THEME.darkBrown, marginBottom: 12 }}>Ingredients</div>
            {viewingSession.recipe_data?.ingredients?.map((ing, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${THEME.border}`, fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>
                <span style={{ color: THEME.text }}>{ing.name}</span><span style={{ color: THEME.textLight, fontWeight: 600 }}>{ing.amount}</span>
              </div>
            ))}
          </Card>
          <div style={{ display: "grid", gap: 10 }}>
            {viewingSession.recipe_data?.steps?.map((step, i) => {
              const note = viewingSession.parsed_step_notes?.[String(i)];
              const stepNote = viewingSession.step_notes?.[i];
              return (
                <Card key={i} hover={false}>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: THEME.textLight, marginBottom: 5, fontWeight: 600 }}>STEP {i + 1}</div>
                  <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: THEME.text, margin: 0, lineHeight: 1.7 }}>{step.instruction}</p>
                  {note && <div style={{ marginTop: 10, padding: "8px 12px", background: "#FFF8F0", borderRadius: 8, fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: THEME.accent, borderLeft: `3px solid ${THEME.accent}` }}>📝 Next time: {note}</div>}
                  {stepNote && <div style={{ marginTop: 8, padding: "8px 12px", background: THEME.greenLight, borderRadius: 8, fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: THEME.darkBrown }}>✏️ Session note: {stepNote}</div>}
                </Card>
              );
            })}
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper sidebarWidth={sw}>
      <PageHeader title="My Recipes" subtitle={`${sessions.length} bake${sessions.length !== 1 ? "s" : ""} logged · ${uniqueRecipes.length} unique recipe${uniqueRecipes.length !== 1 ? "s" : ""}`} action={<Btn onClick={() => set({ screen: "new-session" })}>＋ New Session</Btn>} />
      {sessions.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 56 }} hover={false}><div style={{ fontSize: 56, marginBottom: 14 }}>📖</div><h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: THEME.darkBrown, marginBottom: 8 }}>No recipes yet</h3><p style={{ fontFamily: "'DM Sans',sans-serif", color: THEME.textLight }}>Start your first baking session to see it here</p><Btn onClick={() => set({ screen: "new-session" })} style={{ marginTop: 14 }}>Start Baking →</Btn></Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 18 }}>
          {uniqueRecipes.reverse().map(({ latest: s, history }) => (
            <Card key={s.id} style={{ display: "flex", flexDirection: "column" }} hover>
              <div style={{ width: "100%", height: 110, borderRadius: 10, background: `linear-gradient(135deg,${THEME.parchment},${THEME.accentLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56, marginBottom: 14, position: "relative" }}>
                {s.photo || "🍞"}
                {history.length > 1 && <div style={{ position: "absolute", top: 8, right: 8, background: THEME.darkBrown, color: "#fff", borderRadius: 20, padding: "2px 8px", fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700 }}>×{history.length}</div>}
              </div>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, color: THEME.darkBrown, margin: "0 0 4px" }}>{s.recipe_name}</h3>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: THEME.textLight, marginBottom: 6 }}>Last baked {s.bake_date}{s.rating ? ` · ${"⭐".repeat(s.rating)}` : ""}</div>
              {s.make_again && <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: s.make_again === "Definitely!" ? THEME.green : THEME.textLight, marginBottom: 10, fontWeight: 600 }}>{s.make_again === "Definitely!" ? "✓ Would make again" : s.make_again === "Maybe" ? "~ Maybe again" : "✗ Probably not"}</div>}
              {s.changes_notes && <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: THEME.textLight, marginBottom: 12, lineHeight: 1.5, flex: 1 }}>Notes: {s.changes_notes.substring(0, 70)}{s.changes_notes.length > 70 ? "..." : ""}</div>}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: "auto" }}>
                <Btn variant="ghost" size="sm" full onClick={() => setViewingSession(s)} style={{ justifyContent: "center" }}>📋 View History</Btn>
                <Btn variant="primary" size="sm" full onClick={() => onBakeAgain(s)} style={{ justifyContent: "center" }}>🔄 Bake Again</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}

// ─── COMMUNITY ─────────────────────────────────────────────────────────────────
function CommunityScreen({ user, profile, notify, sw, set }) {
  const [posts, setPosts] = useState([]);
  const [likedIds, setLikedIds] = useState(new Set());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ recipe_name: "", photo: "🍞", comment: "", tags: "" });
  const [loading, setLoading] = useState(false);
  const photoEmojis = ["🍰", "🎂", "🍪", "🥐", "🍞", "🥧", "🧁", "🥮", "🍩", "🥖", "🌹", "🍵"];

  const fetchPosts = async () => {
    const { data } = await supabase.from("community_posts").select("*").order("created_at", { ascending: false });
    if (data) setPosts(data);
  };

  const fetchLikes = async () => {
    const { data } = await supabase.from("likes").select("post_id").eq("user_id", user.id);
    if (data) setLikedIds(new Set(data.map(l => l.post_id)));
  };

  useEffect(() => { fetchPosts(); fetchLikes(); }, []);

  const toggleLike = async (postId, currentLikes, isLiked) => {
    if (isLiked) {
      await supabase.from("likes").delete().eq("user_id", user.id).eq("post_id", postId);
      await supabase.from("community_posts").update({ likes: currentLikes - 1 }).eq("id", postId);
      setLikedIds(p => { const n = new Set(p); n.delete(postId); return n; });
      setPosts(p => p.map(post => post.id === postId ? { ...post, likes: currentLikes - 1 } : post));
    } else {
      await supabase.from("likes").insert({ user_id: user.id, post_id: postId });
      await supabase.from("community_posts").update({ likes: currentLikes + 1 }).eq("id", postId);
      setLikedIds(p => new Set([...p, postId]));
      setPosts(p => p.map(post => post.id === postId ? { ...post, likes: currentLikes + 1 } : post));
      notify("Post liked! ❤️");
    }
  };

  const submitPost = async () => {
    if (!form.recipe_name || !form.comment) return notify("Please fill in the recipe and your comment", "error");
    setLoading(true);
    const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
    const { error } = await supabase.from("community_posts").insert({
      user_id: user.id,
      username: profile?.username || "Anonymous",
      location: profile?.location || "",
      recipe_name: form.recipe_name,
      photo: form.photo,
      comment: form.comment,
      tags,
      likes: 0,
    });
    if (error) return notify("Error posting — please try again", "error");
    notify("Posted to the community! 🎉");
    setShowForm(false);
    setForm({ recipe_name: "", photo: "🍞", comment: "", tags: "" });
    fetchPosts();
    setLoading(false);
  };

  return (
    <PageWrapper sidebarWidth={sw}>
      <PageHeader title="Community" subtitle="Bakers from around the world sharing their creations" action={<Btn onClick={() => setShowForm(!showForm)}>＋ Share a Bake</Btn>} />

      {showForm && (
        <Card style={{ marginBottom: 28, background: THEME.accentLight, border: `1px solid ${THEME.accent}` }} hover={false}>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: THEME.darkBrown, marginBottom: 18, marginTop: 0 }}>Share your creation</h3>
          <Input label="Recipe Name" value={form.recipe_name} onChange={v => setForm(p => ({ ...p, recipe_name: v }))} placeholder="e.g. Lemon Olive Oil Cake" />
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", marginBottom: 7, fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13, color: THEME.textMid }}>Photo</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {photoEmojis.map(e => <div key={e} onClick={() => setForm(p => ({ ...p, photo: e }))} style={{ width: 44, height: 44, borderRadius: 10, background: form.photo === e ? THEME.accent : THEME.parchment, border: `2px solid ${form.photo === e ? THEME.accent : THEME.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, cursor: "pointer" }}>{e}</div>)}
            </div>
          </div>
          <Input label="Your comment" value={form.comment} onChange={v => setForm(p => ({ ...p, comment: v }))} placeholder="How did it go? Any tips for other bakers?" multiline rows={3} />
          <Input label="Tags (comma separated)" value={form.tags} onChange={v => setForm(p => ({ ...p, tags: v }))} placeholder="e.g. beginner, cookies, chocolate" />
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn>
            <Btn onClick={submitPost} disabled={loading}>{loading ? "Posting..." : "Post to Community 🌍"}</Btn>
          </div>
        </Card>
      )}

      {posts.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 56 }} hover={false}>
          <div style={{ fontSize: 56, marginBottom: 14 }}>🌍</div>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: THEME.darkBrown }}>Be the first to post!</h3>
          <p style={{ fontFamily: "'DM Sans',sans-serif", color: THEME.textLight }}>Share your latest bake with the community</p>
          <Btn onClick={() => setShowForm(true)} style={{ marginTop: 14 }}>Share a Bake →</Btn>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          {posts.map(post => {
            const isLiked = likedIds.has(post.id);
            return (
              <Card key={post.id}>
                <div style={{ width: "100%", height: 130, borderRadius: 10, background: `linear-gradient(135deg,${THEME.parchment},${THEME.accentLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 66, marginBottom: 14 }}>{post.photo}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 7 }}>
                  <div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, color: THEME.darkBrown, fontWeight: 700 }}>{post.recipe_name}</div>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: THEME.textLight, marginTop: 2 }}>👤 {post.username}{post.location ? ` · ${post.location}` : ""}</div>
                  </div>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: THEME.textLight }}>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: THEME.textMid, lineHeight: 1.6, margin: "10px 0" }}>"{post.comment}"</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{(post.tags || []).map(t => <span key={t} style={{ background: THEME.greenLight, color: THEME.green, fontSize: 10, padding: "2px 9px", borderRadius: 20, fontFamily: "'DM Sans',sans-serif" }}>#{t}</span>)}</div>
                  <button onClick={() => toggleLike(post.id, post.likes, isLiked)} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: isLiked ? "#E53E3E" : THEME.textLight, fontWeight: isLiked ? 700 : 400 }}>{isLiked ? "❤️" : "🤍"} {post.likes}</button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageWrapper>
  );
}

// ─── RESOURCES ─────────────────────────────────────────────────────────────────
function ResourcesScreen({ sw }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [expandedId, setExpandedId] = useState(null);
  const categories = ["All", ...new Set(RESOURCE_BANK.map(r => r.category))];
  const filtered = activeCategory === "All" ? RESOURCE_BANK : RESOURCE_BANK.filter(r => r.category === activeCategory);
  return (
    <PageWrapper sidebarWidth={sw}>
      <PageHeader title="Resource Bank" subtitle="Techniques, tools, and baking science — all in one place" />
      <div style={{ display: "flex", gap: 7, marginBottom: 24, flexWrap: "wrap" }}>
        {categories.map(c => <button key={c} onClick={() => setActiveCategory(c)} style={{ padding: "7px 16px", borderRadius: 20, border: `1px solid ${activeCategory === c ? THEME.accent : THEME.border}`, background: activeCategory === c ? THEME.accentLight : THEME.warmWhite, fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: activeCategory === c ? 700 : 400, color: activeCategory === c ? THEME.darkBrown : THEME.textMid, cursor: "pointer" }}>{c}</button>)}
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {filtered.map(r => (
          <Card key={r.id} onClick={() => setExpandedId(expandedId === r.id ? null : r.id)} style={{ cursor: "pointer" }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <span style={{ fontSize: 30 }}>{r.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15, color: THEME.darkBrown }}>{r.title}</div>
                <div style={{ display: "flex", gap: 7, marginTop: 4 }}>
                  <span style={{ background: THEME.tan, color: THEME.brown, fontSize: 11, padding: "2px 9px", borderRadius: 20, fontFamily: "'DM Sans',sans-serif" }}>{r.category}</span>
                  <span style={{ background: THEME.greenLight, color: THEME.green, fontSize: 11, padding: "2px 9px", borderRadius: 20, fontFamily: "'DM Sans',sans-serif" }}>{r.skill}</span>
                </div>
              </div>
              <span style={{ color: THEME.textLight, fontSize: 16 }}>{expandedId === r.id ? "▲" : "▼"}</span>
            </div>
            {expandedId === r.id && <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${THEME.border}`, fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: THEME.textMid, lineHeight: 1.7 }}>{r.content}</div>}
          </Card>
        ))}
      </div>
    </PageWrapper>
  );
}

// ─── SETTINGS ──────────────────────────────────────────────────────────────────
function SettingsScreen({ user, profile, setProfile, notify, set, sw }) {
  const [sel, setSel] = useState(profile?.skill_level);
  const [loading, setLoading] = useState(false);

  const saveSkill = async () => {
    setLoading(true);
    await supabase.from("profiles").update({ skill_level: sel }).eq("id", user.id);
    setProfile(p => ({ ...p, skill_level: sel }));
    notify("Skill level updated!");
    setLoading(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    set({ screen: "login" });
  };

  return (
    <PageWrapper sidebarWidth={sw}>
      <PageHeader title="Settings" subtitle="Manage your profile and preferences" />
      <div style={{ maxWidth: 540 }}>
        <Card style={{ marginBottom: 22 }} hover={false}>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, color: THEME.darkBrown, marginTop: 0 }}>Profile</h3>
          <div style={{ fontFamily: "'DM Sans',sans-serif", marginBottom: 10 }}><span style={{ fontSize: 13, color: THEME.textLight }}>Username: </span><span style={{ fontWeight: 600, color: THEME.text }}>{profile?.username}</span></div>
          <div style={{ fontFamily: "'DM Sans',sans-serif" }}><span style={{ fontSize: 13, color: THEME.textLight }}>Email: </span><span style={{ fontWeight: 600, color: THEME.text }}>{user?.email}</span></div>
        </Card>
        <Card style={{ marginBottom: 22 }} hover={false}>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, color: THEME.darkBrown, marginTop: 0 }}>Baking Skill Level</h3>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: THEME.textLight, marginBottom: 14 }}>Determines when we show technique tips during your sessions.</p>
          <div style={{ display: "grid", gap: 9, marginBottom: 14 }}>
            {SKILL_LEVELS.map(s => <div key={s.id} onClick={() => setSel(s.id)} style={{ padding: 13, borderRadius: 10, border: `2px solid ${sel === s.id ? THEME.accent : THEME.border}`, background: sel === s.id ? THEME.accentLight : THEME.warmWhite, cursor: "pointer", transition: "all 0.18s", display: "flex", gap: 11, alignItems: "center" }}><span style={{ fontSize: 22 }}>{s.icon}</span><div><div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 14, color: THEME.darkBrown }}>{s.label}</div><div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: THEME.textLight }}>{s.desc}</div></div></div>)}
          </div>
          <Btn onClick={saveSkill} disabled={loading}>{loading ? "Saving..." : "Save Changes"}</Btn>
        </Card>
        <Card hover={false}>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, color: THEME.darkBrown, marginTop: 0 }}>Account</h3>
          <Btn variant="danger" onClick={signOut}>Sign Out</Btn>
        </Card>
      </div>
    </PageWrapper>
  );
}

// ─── ROOT APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreenRaw] = useState("login");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [notification, setNotification] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [bakeAgainSession, setBakeAgainSession] = useState(null);

  const set = useCallback((updates) => {
    if (updates.screen) setScreenRaw(updates.screen);
  }, []);

  const notify = useCallback((msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3200);
  }, []);

  // Check if user is already logged in on page load
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        const { data: prof } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        setProfile(prof);
        if (!prof?.skill_level) {
          setScreenRaw("onboarding");
        } else {
          fetchSessions(session.user.id);
          setScreenRaw("dashboard");
        }
      }
    });
  }, []);

  const fetchSessions = async (uid) => {
    const { data } = await supabase.from("sessions").select("*").eq("user_id", uid).order("created_at", { ascending: true });
    if (data) setSessions(data);
  };

  const handleAuth = (authUser, authProfile) => {
    setUser(authUser);
    setProfile(authProfile);
    if (!authProfile?.skill_level) {
      setScreenRaw("onboarding");
    } else {
      fetchSessions(authUser.id);
      setScreenRaw("dashboard");
    }
  };

  const handleOnboardingComplete = (updatedProfile) => {
    setProfile(updatedProfile);
    setScreenRaw("dashboard");
  };

  const handleSessionSaved = (newSession) => {
    setSessions(p => [...p, newSession]);
  };

  const handleBakeAgain = (session) => {
    setBakeAgainSession(session);
    setScreenRaw("bake-again");
  };

  // Auto-collapse sidebar during baking
  useEffect(() => {
    if (screen === "new-session" || screen === "bake-again") setSidebarCollapsed(true);
  }, [screen]);

  const isAuthScreen = ["login", "onboarding"].includes(screen);
  const showSidebar = user && !isAuthScreen;
  const sw = showSidebar ? (sidebarCollapsed ? 64 : 220) : 0;

  return (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${THEME.cream}; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: ${THEME.parchment}; }
        ::-webkit-scrollbar-thumb { background: ${THEME.tan}; border-radius: 3px; }
      `}</style>

      <Notification data={notification} />

      {showSidebar && <Sidebar screen={screen} set={set} user={user} profile={profile} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(p => !p)} />}

      {screen === "login" && <LoginScreen onAuth={handleAuth} notify={notify} />}
      {screen === "onboarding" && <OnboardingScreen user={user} onComplete={handleOnboardingComplete} notify={notify} />}
      {screen === "dashboard" && <DashboardScreen user={user} profile={profile} sessions={sessions} set={set} sw={sw} />}
      {screen === "new-session" && <BakingSessionScreen user={user} profile={profile} set={set} notify={notify} sw={sw} onSessionSaved={handleSessionSaved} />}
      {screen === "bake-again" && bakeAgainSession && <BakingSessionScreen user={user} profile={profile} set={set} notify={notify} sw={sw} prefillSession={bakeAgainSession} onSessionSaved={handleSessionSaved} />}
      {screen === "my-recipes" && <MyRecipesScreen user={user} sessions={sessions} set={set} notify={notify} sw={sw} onBakeAgain={handleBakeAgain} />}
      {screen === "resources" && <ResourcesScreen sw={sw} />}
      {screen === "community" && <CommunityScreen user={user} profile={profile} notify={notify} sw={sw} set={set} />}
      {screen === "settings" && <SettingsScreen user={user} profile={profile} setProfile={setProfile} notify={notify} set={set} sw={sw} />}
    </div>
  );
}
