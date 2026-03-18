import { useState, useCallback } from "react";

const GOLF_TOURNAMENTS = [
  { name: "The Valspar Championship", course: "Copperhead", surface: "Bent Grass" },
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
  "Best Bet":   { color: "#00e676", bg: "rgba(0,230,118,0.12)", bar: 95, icon: "🔥" },
  "Value Play": { color: "#69f0ae", bg: "rgba(105,240,174,0.10)", bar: 70, icon: "✅" },
  "Lean":       { color: "#ffd740", bg: "rgba(255,215,64,0.10)", bar: 50, icon: "👀" },
  "Fade":       { color: "#ff5252", bg: "rgba(255,82,82,0.12)", bar: 15, icon: "❌" },
};

async function analyzeMatchup(sport, player1, player2, event) {
  const isGolf = sport === "golf";

  const systemPrompt = `You are a sharp, professional sports betting analyst covering ${isGolf ? "PGA Tour golf" : "ATP/WTA tennis"} matchups. 
You speak the language of serious bettors — spreads, units, value, line movement, H2H records, form streaks. 
You always search for current real data before making a judgment. Your output must be strict JSON only, no markdown, no backticks.`;

  const userPrompt = isGolf
    ? `Analyze this PGA Tour head-to-head matchup for betting purposes:
Player 1: ${player1}
Player 2: ${player2}
Tournament: ${event.name}
Course: ${event.course} (${event.surface} grass)

Search for: recent form (last 4 weeks), strokes gained stats (SG:Total, SG:T2G, SG:APP, SG:Putt), course history at ${event.course}, world ranking, H2H record between these two players, current betting odds, any line movement, injuries or WD risk.

Return ONLY valid JSON:
{
  "player1": {
    "name": "${player1}",
    "verdict": "Best Bet" | "Value Play" | "Lean" | "Fade",
    "summary": "2-3 sentence sharp analysis using bettor language",
    "keyStats": ["SG stat or course history fact", "recent form streak", "relevant trend"],
    "h2hRecord": "e.g. 4-2 vs ${player2} all-time, 2-1 last 3",
    "spread": "e.g. -1.5 strokes looks playable or avoid the number",
    "bestMarket": "e.g. H2H matchup bet, 3-ball, stroke play spread",
    "recommendedStake": "1 unit" | "2 units" | "3 units" | "Pass",
    "oddsValue": "e.g. +105 offers value, market underrating his course form",
    "edge": "one sharp line on why this is or isn't a bet"
  },
  "player2": {
    "name": "${player2}",
    "verdict": "Best Bet" | "Value Play" | "Lean" | "Fade",
    "summary": "2-3 sentence sharp analysis using bettor language",
    "keyStats": ["SG stat or course history fact", "recent form streak", "relevant trend"],
    "h2hRecord": "e.g. 2-4 vs ${player1} all-time, 1-2 last 3",
    "spread": "e.g. +1.5 strokes is the play or no value here",
    "bestMarket": "e.g. H2H matchup bet, 3-ball, stroke play spread",
    "recommendedStake": "1 unit" | "2 units" | "3 units" | "Pass",
    "oddsValue": "e.g. -120 is too short given inconsistent iron play",
    "edge": "one sharp line on why this is or isn't a bet"
  },
  "matchupContext": "1-2 sharp sentences on the key angle",
  "bestBetSummary": "One clear actionable sentence — the single best bet in this matchup",
  "confidence": "High" | "Medium" | "Low"
}`
    : `Analyze this ${event.surface} tennis matchup for betting:
Player 1: ${player1}
Player 2: ${player2}
Tournament: ${event.name} — ${event.surface} | ${event.location}

Search for: recent match results (last 6 weeks), ATP/WTA ranking, H2H record between these players, performance on ${event.surface}, serve stats, return stats, injuries, line movement, current odds.

Return ONLY valid JSON:
{
  "player1": {
    "name": "${player1}",
    "verdict": "Best Bet" | "Value Play" | "Lean" | "Fade",
    "summary": "2-3 sentence sharp analysis using bettor language",
    "keyStats": ["surface win % or stat", "recent form streak", "serve or return edge"],
    "h2hRecord": "e.g. 5-3 all-time vs ${player2}, 2-1 on ${event.surface}",
    "spread": "e.g. -3.5 games is the play or -4.5 is too many",
    "bestMarket": "e.g. ML, games spread, set betting, total games over/under",
    "recommendedStake": "1 unit" | "2 units" | "3 units" | "Pass",
    "oddsValue": "e.g. +130 offers value given H2H and surface record",
    "edge": "one sharp line on why this is or isn't a bet"
  },
  "player2": {
    "name": "${player2}",
    "verdict": "Best Bet" | "Value Play" | "Lean" | "Fade",
    "summary": "2-3 sentence sharp analysis using bettor language",
    "keyStats": ["surface win % or stat", "recent form streak", "serve or return edge"],
    "h2hRecord": "e.g. 3-5 all-time vs ${player1}, 1-2 on ${event.surface}",
    "spread": "e.g. +3.5 games has value or back to cover",
    "bestMarket": "e.g. ML, games spread, set betting, total games over/under",
    "recommendedStake": "1 unit" | "2 units" | "3 units" | "Pass",
    "oddsValue": "e.g. -150 is fair given dominant surface form",
    "edge": "one sharp line on why this is or isn't a bet"
  },
  "matchupContext": "1-2 sharp sentences — surface advantage, scheduling fatigue, H2H patterns, market angle",
  "bestBetSummary": "One clear actionable sentence — the single best bet in this matchup",
  "confidence": "High" | "Medium" | "Low"
}`;

  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  const data = await response.json();
  const textBlocks = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
  const clean = textBlocks.replace(/```json|```/g, "").trim();
  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");
  return JSON.parse(jsonMatch[0]);
}

function VerdictBadge({ verdict }) {
  const v = VERDICTS[verdict] || VERDICTS["Lean"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 12px", borderRadius: "20px",
      fontSize: "11px", fontWeight: "800", letterSpacing: "0.08em", textTransform: "uppercase",
      color: v.color, background: v.bg, border: `1px solid ${v.color}33`,
    }}>
      {v.icon} {verdict}
    </span>
  );
}

function StatRow({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <span style={{ fontSize: 11, color: "#616161", textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
      <span style={{ fontSize: 12, color: color || "#e0e0e0", fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{value}</span>
    </div>
  );
}

function PlayerCard({ player, sport }) {
  if (!player) return null;
  const v = VERDICTS[player.verdict] || VERDICTS["Lean"];
  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 14, padding: "20px",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: v.color, opacity: 0.8 }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", fontFamily: "'DM Serif Display', Georgia, serif", marginBottom: 6 }}>
            {player.name}
          </div>
          <VerdictBadge verdict={player.verdict} />
        </div>
        <div style={{ fontSize: 28, opacity: 0.12 }}>{sport === "golf" ? "⛳" : "🎾"}</div>
      </div>

      <div style={{ margin: "12px 0", background: "rgba(255,255,255,0.06)", borderRadius: 4, height: 5, overflow: "hidden" }}>
        <div style={{ width: `${v.bar}%`, height: "100%", background: v.color, borderRadius: 4, transition: "width 1.2s ease" }} />
      </div>

      <p style={{ fontSize: 13, color: "#bdbdbd", lineHeight: 1.65, marginBottom: 14 }}>{player.summary}</p>

      <div style={{ marginBottom: 12 }}>
        <StatRow label="H2H Record" value={player.h2hRecord} color="#ffd740" />
        <StatRow label="Best Market" value={player.bestMarket} />
        <StatRow label="Spread" value={player.spread} />
        <StatRow label="Odds Value" value={player.oddsValue} color={v.color} />
        <StatRow label="Stake" value={player.recommendedStake}
          color={player.recommendedStake === "Pass" ? "#ff5252" : player.recommendedStake === "3 units" ? "#00e676" : "#ffd740"} />
      </div>

      <div style={{ marginBottom: 12 }}>
        {player.keyStats?.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 5 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: v.color, flexShrink: 0, marginTop: 5 }} />
            <span style={{ fontSize: 12, color: "#9e9e9e", lineHeight: 1.5 }}>{s}</span>
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 10, fontSize: 12, color: v.color, fontStyle: "italic", lineHeight: 1.5 }}>
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
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8, padding: "12px 16px", color: "#fff", fontSize: 14,
    width: "100%", outline: "none", fontFamily: "inherit", boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block", marginBottom: 6, fontSize: 11, color: "#616161",
    textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600,
  };

  const canAnalyze = state.p1.trim() && state.p2.trim() && state.tournament && !state.loading;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", fontFamily: "'DM Sans', -apple-system, sans-serif", color: "#fff", padding: "24px 16px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap');
        input::placeholder { color: #444 !important; }
        select option { background: #1a1a2e; color: #fff; }
        input:focus, select:focus { border-color: rgba(255,255,255,0.25) !important; }
        * { box-sizing: border-box; }
        @keyframes pulse { to { opacity: 1; transform: scale(1.4); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ maxWidth: 820, margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "#424242", marginBottom: 8 }}>AI-Powered Sports Betting Analysis</div>
          <h1 style={{ fontSize: 34, fontWeight: 800, margin: 0, fontFamily: "'DM Serif Display', Georgia, serif", letterSpacing: "-0.5px" }}>
            Matchup<span style={{ color: "#ffd740" }}>IQ</span>
          </h1>
          <p style={{ color: "#424242", fontSize: 12, marginTop: 6, marginBottom: 0, letterSpacing: "0.05em" }}>
            LIVE WEB RESEARCH · H2H RECORDS · SPREADS · STAKE RECOMMENDATIONS
          </p>
        </div>

        <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4, marginBottom: 24 }}>
          {["golf", "tennis"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              flex: 1, padding: "11px 0", border: "none", borderRadius: 7, cursor: "pointer",
              fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em",
              transition: "all 0.2s",
              background: activeTab === tab ? "#fff" : "transparent",
              color: activeTab === tab ? "#0a0a0f" : "#555",
            }}>
              {tab === "golf" ? "⛳ Golf" : "🎾 Tennis"}
            </button>
          ))}
        </div>

        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "22px", marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Player 1</label>
              <input style={inputStyle}
                placeholder={activeTab === "golf" ? "e.g. Scottie Scheffler" : "e.g. Jannik Sinner"}
                value={state.p1} onChange={e => setState(s => ({ ...s, p1: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Player 2</label>
              <input style={inputStyle}
                placeholder={activeTab === "golf" ? "e.g. Rory McIlroy" : "e.g. Carlos Alcaraz"}
                value={state.p2} onChange={e => setState(s => ({ ...s, p2: e.target.value }))} />
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>{activeTab === "golf" ? "Tournament / Course" : "Tournament"}</label>
            <select style={{ ...inputStyle, cursor: "pointer" }}
              value={state.tournament} onChange={e => setState(s => ({ ...s, tournament: e.target.value }))}>
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
              {activeTab === "golf" ? (
                <>
                  <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(255,215,64,0.08)", color: "#ffd740", border: "1px solid rgba(255,215,64,0.15)" }}>⛳ {selectedEvent.course}</span>
                  <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(255,255,255,0.04)", color: "#616161", border: "1px solid rgba(255,255,255,0.07)" }}>🌿 {selectedEvent.surface}</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(255,215,64,0.08)", color: "#ffd740", border: "1px solid rgba(255,215,64,0.15)" }}>🎾 {selectedEvent.surface}</span>
                  <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(255,255,255,0.04)", color: "#616161", border: "1px solid rgba(255,255,255,0.07)" }}>📍 {selectedEvent.location}</span>
                </>
              )}
            </div>
          )}

          <button onClick={handleAnalyze} disabled={!canAnalyze} style={{
            width: "100%", padding: "14px", borderRadius: 9, border: "none", cursor: canAnalyze ? "pointer" : "not-allowed",
            fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase",
            background: canAnalyze ? "linear-gradient(135deg, #ffd740, #ffab00)" : "rgba(255,255,255,0.06)",
            color: canAnalyze ? "#0a0a0f" : "#444", transition: "all 0.2s",
          }}>
            {state.loading ? "🔍 Searching & Analyzing..." : "Get Betting Analysis →"}
          </button>
        </div>

        {state.error && (
          <div style={{ padding: 14, borderRadius: 10, background: "rgba(255,82,82,0.07)", border: "1px solid rgba(255,82,82,0.18)", color: "#ff5252", fontSize: 13, marginBottom: 20 }}>
            {state.error}
          </div>
        )}

        {state.loading && (
          <div style={{ textAlign: "center", padding: "44px 0", color: "#555" }}>
            <div style={{ fontSize: 12, marginBottom: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}>Pulling live stats, H2H records & odds...</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 7 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#ffd740", animation: `pulse 1.2s ${i * 0.2}s infinite alternate`, opacity: 0.2 }} />
              ))}
            </div>
          </div>
        )}

        {state.result && !state.loading && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            {state.result.bestBetSummary && (
              <div style={{
                background: "linear-gradient(135deg, rgba(255,215,64,0.1), rgba(255,171,0,0.06))",
                border: "1px solid rgba(255,215,64,0.2)", borderRadius: 10,
                padding: "14px 18px", marginBottom: 14,
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <span style={{ fontSize: 18 }}>🎯</span>
                <div>
                  <div style={{ fontSize: 10, color: "#ffd740", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, marginBottom: 3 }}>Best Bet</div>
                  <div style={{ fontSize: 13, color: "#fff", lineHeight: 1.5 }}>{state.result.bestBetSummary}</div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
              <PlayerCard player={state.result.player1} sport={activeTab} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 2px", color: "#333", fontWeight: 800, fontSize: 14, minWidth: 20 }}>vs</div>
              <PlayerCard player={state.result.player2} sport={activeTab} />
            </div>

            <div style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10, padding: "14px 18px",
              display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap",
            }}>
              <p style={{ margin: 0, fontSize: 13, color: "#9e9e9e", flex: 1, lineHeight: 1.6 }}>
                💡 {state.result.matchupContext}
              </p>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: "#616161", flexShrink: 0 }}>
                <span style={{
                  width: 7, height: 7, borderRadius: "50%", display: "inline-block",
                  background: state.result.confidence === "High" ? "#00e676" : state.result.confidence === "Medium" ? "#ffd740" : "#ff5252"
                }} />
                {state.result.confidence} Confidence
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
