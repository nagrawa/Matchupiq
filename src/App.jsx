import { useState, useCallback } from "react";

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

const GOLF_TOURNAMENTS = [
  { name: "The Players Championship", course: "TPC Sawgrass", surface: "Bermuda" },
  { name: "Masters Tournament", course: "Augusta National", surface: "Bent Grass" },
  { name: "PGA Championship", course: "Aronimink GC", surface: "Bentgrass" },
  { name: "US Open", course: "Oakmont CC", surface: "Bentgrass" },
  { name: "The Open Championship", course: "Royal Birkdale", surface: "Links" },
  { name: "AT&T Pebble Beach Pro-Am", course: "Pebble Beach GL", surface: "Poa Annua" },
  { name: "Genesis Invitational", course: "Riviera CC", surface: "Kikuyu" },
  { name: "Arnold Palmer Invitational", course: "Bay Hill Club", surface: "Bermuda" },
  { name: "RBC Heritage", course: "Harbour Town GL", surface: "Bermuda" },
  { name: "Cadillac Championship", course: "Trump National Doral", surface: "Bermuda" },
  { name: "Truist Championship", course: "Quail Hollow Club", surface: "Bermuda" },
  { name: "Memorial Tournament", course: "Muirfield Village GC", surface: "Bentgrass" },
  { name: "Charles Schwab Challenge", course: "Colonial CC", surface: "Bermuda" },
  { name: "Travelers Championship", course: "TPC River Highlands", surface: "Bentgrass" },
  { name: "Scottish Open", course: "Renaissance Club", surface: "Links" },
  { name: "Wyndham Championship", course: "Sedgefield CC", surface: "Bermuda" },
  { name: "FedEx St. Jude Championship", course: "TPC Southwind", surface: "Bermuda" },
  { name: "BMW Championship", course: "Bellerive CC", surface: "Bentgrass" },
  { name: "Tour Championship", course: "East Lake GC", surface: "Bermuda" },
];

const TENNIS_TOURNAMENTS = [
  { name: "Australian Open", surface: "Hard (Plexicushion)", location: "Melbourne, Australia" },
  { name: "Indian Wells Masters (BNP Paribas Open)", surface: "Hard", location: "Indian Wells, CA" },
  { name: "Miami Open", surface: "Hard", location: "Miami, FL" },
  { name: "Monte-Carlo Masters", surface: "Clay", location: "Monte-Carlo, Monaco" },
  { name: "Mutua Madrid Open", surface: "Clay", location: "Madrid, Spain" },
  { name: "Internazionali BNL d'Italia (Rome)", surface: "Clay", location: "Rome, Italy" },
  { name: "French Open (Roland Garros)", surface: "Clay", location: "Paris, France" },
  { name: "Wimbledon", surface: "Grass", location: "London, UK" },
  { name: "National Bank Open (Toronto/Montreal)", surface: "Hard", location: "Canada" },
  { name: "Cincinnati Open", surface: "Hard", location: "Cincinnati, OH" },
  { name: "US Open", surface: "Hard (DecoTurf)", location: "New York, NY" },
  { name: "Rolex Paris Masters", surface: "Indoor Hard", location: "Paris, France" },
  { name: "Nitto ATP Finals", surface: "Indoor Hard", location: "Turin, Italy" },
  { name: "WTA Finals", surface: "Indoor Hard", location: "Riyadh, Saudi Arabia" },
  { name: "Laver Cup", surface: "Indoor Hard", location: "London, UK" },
];

const VERDICTS = {
  "Strong Lean": { color: "#00e676", bg: "rgba(0,230,118,0.12)", bar: 90 },
  "Lean":        { color: "#69f0ae", bg: "rgba(105,240,174,0.10)", bar: 68 },
  "Neutral":     { color: "#ffd740", bg: "rgba(255,215,64,0.10)", bar: 50 },
  "Pass":        { color: "#ff5252", bg: "rgba(255,82,82,0.12)", bar: 20 },
};

async function analyzeMatchup(sport, player1, player2, event) {
  const isGolf = sport === "golf";
  const systemPrompt = `You are a sharp, data-driven sports betting analyst specializing in ${isGolf ? "PGA Tour golf matchup bets" : "ATP/WTA tennis matchup bets"}. 
You always search for current, real data before making a judgment. Be concise and direct. Your output must be strict JSON only.`;

  const userPrompt = isGolf
    ? `Analyze this PGA Tour head-to-head matchup for betting purposes:
Player 1: ${player1}
Player 2: ${player2}
Tournament: ${event.name}
Course: ${event.course} (${event.surface} grass)

Search for: recent form (last 4 weeks), strokes gained stats, course history at ${event.course}, current world ranking, any injuries or withdrawals, betting market movement.

Return ONLY valid JSON (no markdown, no backticks):
{
  "player1": {
    "name": "${player1}",
    "verdict": "Strong Lean" | "Lean" | "Neutral" | "Pass",
    "summary": "2-3 sentence analysis",
    "keyStats": ["stat1", "stat2", "stat3"],
    "edge": "one-line betting edge or concern"
  },
  "player2": {
    "name": "${player2}",
    "verdict": "Strong Lean" | "Lean" | "Neutral" | "Pass",
    "summary": "2-3 sentence analysis",
    "keyStats": ["stat1", "stat2", "stat3"],
    "edge": "one-line betting edge or concern"
  },
  "matchupContext": "1-2 sentences on what to watch for in this specific matchup",
  "confidence": "High" | "Medium" | "Low"
}`
    : `Analyze this ${event.surface} court tennis matchup for betting purposes:
Player 1: ${player1}
Player 2: ${player2}
Tournament: ${event.name} — ${event.surface} | ${event.location}

Search for: recent match results (last 6 weeks), current ATP/WTA ranking, head-to-head record, performance on ${event.surface}, any injuries or withdrawals, serve/return stats on this surface.

Return ONLY valid JSON (no markdown, no backticks):
{
  "player1": {
    "name": "${player1}",
    "verdict": "Strong Lean" | "Lean" | "Neutral" | "Pass",
    "summary": "2-3 sentence analysis",
    "keyStats": ["stat1", "stat2", "stat3"],
    "edge": "one-line betting edge or concern"
  },
  "player2": {
    "name": "${player2}",
    "verdict": "Strong Lean" | "Lean" | "Neutral" | "Pass",
    "summary": "2-3 sentence analysis",
    "keyStats": ["stat1", "stat2", "stat3"],
    "edge": "one-line betting edge or concern"
  },
  "matchupContext": "1-2 sentences on what to watch for in this specific matchup",
  "confidence": "High" | "Medium" | "Low"
}`;

  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  const data = await response.json();
  const textBlocks = data.content.filter(b => b.type === "text").map(b => b.text).join("");
  const clean = textBlocks.replace(/```json|```/g, "").trim();
  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");
  return JSON.parse(jsonMatch[0]);
}

function VerdictBadge({ verdict }) {
  const v = VERDICTS[verdict] || VERDICTS["Neutral"];
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 12px",
      borderRadius: "20px",
      fontSize: "11px",
      fontWeight: "800",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: v.color,
      background: v.bg,
      border: `1px solid ${v.color}33`,
    }}>{verdict}</span>
  );
}

function ConfidenceDot({ level }) {
  const colors = { High: "#00e676", Medium: "#ffd740", Low: "#ff5252" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#9e9e9e" }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors[level] || "#9e9e9e", display: "inline-block" }} />
      {level} Confidence
    </span>
  );
}

function PlayerCard({ player, sport }) {
  if (!player) return null;
  const v = VERDICTS[player.verdict] || VERDICTS["Neutral"];
  return (
    <div style={{
      flex: 1,
      background: "rgba(255,255,255,0.03)",
      border: `1px solid rgba(255,255,255,0.08)`,
      borderRadius: 12,
      padding: "20px",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: v.color, opacity: 0.7 }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", fontFamily: "'DM Serif Display', Georgia, serif", marginBottom: 4 }}>
            {player.name}
          </div>
          <VerdictBadge verdict={player.verdict} />
        </div>
        <div style={{ fontSize: 32, opacity: 0.15 }}>{sport === "golf" ? "⛳" : "🎾"}</div>
      </div>

      <div style={{ margin: "14px 0 10px", background: "rgba(255,255,255,0.06)", borderRadius: 4, height: 6, overflow: "hidden" }}>
        <div style={{ width: `${v.bar}%`, height: "100%", background: v.color, borderRadius: 4, transition: "width 1s ease" }} />
      </div>

      <p style={{ fontSize: 13, color: "#bdbdbd", lineHeight: 1.6, marginBottom: 12 }}>{player.summary}</p>

      <div style={{ marginBottom: 12 }}>
        {player.keyStats?.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: v.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#e0e0e0" }}>{s}</span>
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 10, fontSize: 12, color: v.color, fontStyle: "italic" }}>
        {player.edge}
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("golf");
  const [golfState, setGolfState] = useState({ p1: "", p2: "", tournament: "", result: null, loading: false, error: null });
  const [tennisState, setTennisState] = useState({ p1: "", p2: "", tournament: "", result: null, loading: false, error: null });

  const state = activeTab === "golf" ? golfState : tennisState;
  const setState = activeTab === "golf" ? setGolfState : setTennisState;
  const tournaments = activeTab === "golf" ? GOLF_TOURNAMENTS : TENNIS_TOURNAMENTS;
  const selectedEvent = tournaments.find(t => t.name === state.tournament);

  const handleAnalyze = useCallback(async () => {
    if (!state.p1.trim() || !state.p2.trim() || !state.tournament) return;
    setState(s => ({ ...s, loading: true, error: null, result: null }));
    try {
      const result = await analyzeMatchup(activeTab, state.p1.trim(), state.p2.trim(), selectedEvent);
      setState(s => ({ ...s, result, loading: false }));
    } catch (e) {
      setState(s => ({ ...s, error: "Analysis failed — check your API key in Vercel environment variables.", loading: false }));
    }
  }, [state.p1, state.p2, state.tournament, activeTab, selectedEvent]);

  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: "12px 16px",
    color: "#fff",
    fontSize: 14,
    width: "100%",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  const labelStyle = {
    display: "block",
    marginBottom: 6,
    fontSize: 11,
    color: "#757575",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    fontWeight: 600,
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      fontFamily: "'DM Sans', -apple-system, sans-serif",
      color: "#fff",
      padding: "24px 16px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap');
        input::placeholder { color: #555 !important; }
        select option { background: #1a1a2e; color: #fff; }
        input:focus, select:focus { border-color: rgba(255,255,255,0.3) !important; }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#616161", marginBottom: 8 }}>AI-Powered Betting Analysis</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, fontFamily: "'DM Serif Display', Georgia, serif", letterSpacing: "-0.5px" }}>
            Matchup<span style={{ color: "#ffd740" }}>IQ</span>
          </h1>
          <p style={{ color: "#616161", fontSize: 13, marginTop: 6, marginBottom: 0 }}>
            Live web research → Strong Lean · Lean · Neutral · Pass
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4, marginBottom: 28 }}>
          {["golf", "tennis"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: "10px 0", border: "none", borderRadius: 7, cursor: "pointer",
                fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
                transition: "all 0.2s",
                background: activeTab === tab ? "#fff" : "transparent",
                color: activeTab === tab ? "#0a0a0f" : "#616161",
              }}
            >
              {tab === "golf" ? "⛳ Golf" : "🎾 Tennis"}
            </button>
          ))}
        </div>

        {/* Input Panel */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "24px", marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Player 1</label>
              <input
                style={inputStyle}
                placeholder={activeTab === "golf" ? "e.g. Scottie Scheffler" : "e.g. Jannik Sinner"}
                value={state.p1}
                onChange={e => setState(s => ({ ...s, p1: e.target.value }))}
              />
            </div>
            <div>
              <label style={labelStyle}>Player 2</label>
              <input
                style={inputStyle}
                placeholder={activeTab === "golf" ? "e.g. Rory McIlroy" : "e.g. Carlos Alcaraz"}
                value={state.p2}
                onChange={e => setState(s => ({ ...s, p2: e.target.value }))}
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>{activeTab === "golf" ? "Tournament / Course" : "Tournament"}</label>
            <select
              style={{ ...inputStyle, cursor: "pointer" }}
              value={state.tournament}
              onChange={e => setState(s => ({ ...s, tournament: e.target.value }))}
            >
              <option value="">— Select Tournament —</option>
              {tournaments.map(t => (
                <option key={t.name} value={t.name}>
                  {t.name}{activeTab === "golf" ? ` — ${t.course}` : ` (${t.surface})`}
                </option>
              ))}
            </select>
          </div>

          {selectedEvent && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {activeTab === "golf" && (
                <>
                  <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(255,215,64,0.1)", color: "#ffd740", border: "1px solid rgba(255,215,64,0.2)" }}>⛳ {selectedEvent.course}</span>
                  <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(255,255,255,0.05)", color: "#9e9e9e", border: "1px solid rgba(255,255,255,0.08)" }}>🌿 {selectedEvent.surface}</span>
                </>
              )}
              {activeTab === "tennis" && (
                <>
                  <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(255,215,64,0.1)", color: "#ffd740", border: "1px solid rgba(255,215,64,0.2)" }}>🎾 {selectedEvent.surface}</span>
                  <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(255,255,255,0.05)", color: "#9e9e9e", border: "1px solid rgba(255,255,255,0.08)" }}>📍 {selectedEvent.location}</span>
                </>
              )}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={state.loading || !state.p1.trim() || !state.p2.trim() || !state.tournament}
            style={{
              width: "100%", padding: "13px", borderRadius: 9, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase",
              background: state.loading || !state.p1.trim() || !state.p2.trim() || !state.tournament
                ? "rgba(255,255,255,0.08)"
                : "linear-gradient(135deg, #ffd740, #ffab00)",
              color: state.loading || !state.p1.trim() || !state.p2.trim() || !state.tournament ? "#555" : "#0a0a0f",
              transition: "all 0.2s",
            }}
          >
            {state.loading ? "🔍 Searching & Analyzing..." : "Analyze Matchup →"}
          </button>
        </div>

        {/* Error */}
        {state.error && (
          <div style={{ padding: 16, borderRadius: 10, background: "rgba(255,82,82,0.08)", border: "1px solid rgba(255,82,82,0.2)", color: "#ff5252", fontSize: 13, marginBottom: 20 }}>
            {state.error}
          </div>
        )}

        {/* Loading */}
        {state.loading && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#616161" }}>
            <div style={{ fontSize: 13, marginBottom: 8 }}>Searching the web for current stats, form & trends...</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#ffd740", animation: `pulse 1.2s ${i * 0.2}s infinite alternate`, opacity: 0.3 }} />
              ))}
            </div>
            <style>{`@keyframes pulse { to { opacity: 1; transform: scale(1.3); } }`}</style>
          </div>
        )}

        {/* Results */}
        {state.result && !state.loading && (
          <div>
            <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
              <PlayerCard player={state.result.player1} sport={activeTab} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", color: "#424242", fontWeight: 800, fontSize: 16 }}>vs</div>
              <PlayerCard player={state.result.player2} sport={activeTab} />
            </div>

            <div style={{
              background: "rgba(255,215,64,0.06)", border: "1px solid rgba(255,215,64,0.12)",
              borderRadius: 10, padding: "14px 18px",
              display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap"
            }}>
              <p style={{ margin: 0, fontSize: 13, color: "#e0e0e0", flex: 1, lineHeight: 1.5 }}>
                💡 {state.result.matchupContext}
              </p>
              <ConfidenceDot level={state.result.confidence} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
