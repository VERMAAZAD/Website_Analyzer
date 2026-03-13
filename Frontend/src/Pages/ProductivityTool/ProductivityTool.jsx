import { useState, useRef, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Upload, Sparkles, AlertCircle, Filter, Globe, Package, TrendingUp, ChevronUp, Minus, Trash2 } from "lucide-react";

const T = {
  bg:          "#f0f4f8",
  bgCard:      "#ffffff",
  bgCard2:     "#f8fafc",
  border:      "#e2e8f0",
  border2:     "#edf2f7",
  primary:     "#2563eb",
  secondary:   "#0891b2",
  accent:      "#7c3aed",
  green:       "#059669",
  orange:      "#d97706",
  red:         "#dc2626",
  yellow:      "#ca8a04",
  purple:      "#7c3aed",
  textPrimary: "#0f172a",
  textSub:     "#94a3b8",
  textMid:     "#475569",
};
const GRAD = [T.primary, T.secondary, T.green, T.accent, T.orange, "#8b5cf6", T.red, T.yellow];

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) throw new Error("Need header + at least one data row.");
  const headers = lines[0].split(",").map(h => h.trim().replace(/['"]/g,""));
  return lines.slice(1).map(line => {
    const vals = []; let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQ = !inQ; }
      else if (line[i] === "," && !inQ) { vals.push(cur.trim()); cur = ""; }
      else cur += line[i];
    }
    vals.push(cur.trim());
    const obj = {};
    headers.forEach((h, i) => {
      const v = (vals[i] || "").replace(/['"]/g,"").trim();
      obj[h] = v !== "" && !isNaN(v) ? parseFloat(v) : v;
      obj[h.toLowerCase()] = obj[h];
      obj[h.toLowerCase().replace(/\s+/g,"_")] = obj[h];
    });
    return obj;
  }).filter(r => Object.values(r).some(v => v !== "" && v !== undefined));
}

const gf = (row, keys) => { for (const k of keys) if (row[k] !== undefined) return row[k]; return "Unknown"; };
const subidOf   = r => gf(r, ["SubID","subid","sub_id","sub","sid"]);
const lpOf      = r => gf(r, ["LP","lp","landing_page","lp_url","page"]);
const countryOf = r => gf(r, ["Country","country","geo","country_code"]);
const offerOf   = r => gf(r, ["Offer","offer","offer_name","campaign","product"]);
const convOf    = r => Number(gf(r, ["Conversion date","conversion","converted","conv","sale","conversions"])) || 0;
const clicksOf  = r => Number(gf(r, ["n","clicks","count","total","visits"])) || 1;
const payoutOf  = r => {
  const raw = parseFloat(gf(r, ["Payout","payout","pay","revenue","earning","commission","amount"]));
  if (!raw || isNaN(raw)) return 0;
  const clicks = Number(r.n != null ? r.n : r.clicks != null ? r.clicks : 1) || 1;
  return raw * clicks;
};

const pctStr = (a, b) => b ? ((a/b)*100).toFixed(1)+"%" : "0%";
const fmtN   = n => n >= 1000000 ? (n/1e6).toFixed(1)+"M" : n >= 1000 ? (n/1000).toFixed(1)+"k" : String(n);
const fmtUSD = n => "€"+parseFloat(n||0).toFixed(2);

function agg(rows, keyFn, keyName) {
  return Object.values(rows.reduce((acc, r) => {
    const k = keyFn(r);
    if (!acc[k]) acc[k] = { [keyName]: k, clicks: 0, conversions: 0 };
    acc[k].clicks      += Number(r.clicks) || clicksOf(r);
    acc[k].conversions += Number(r.conversions) || convOf(r);
    return acc;
  }, {}))
  .map(r => ({ ...r, cvr: pctStr(r.conversions, r.clicks) }))
  .sort((a, b) => b.conversions - a.conversions);
}

function SearchBar({ value, onChange, placeholder, color }) {
  const c = color || T.primary;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, background:T.bg, border:"1px solid "+T.border, borderRadius:8, padding:"6px 12px" }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input placeholder={placeholder || "Search..."} value={value} onChange={e => onChange(e.target.value)}
        style={{ background:"transparent", border:"none", outline:"none", color:T.textPrimary, fontSize:12, width:140 }}/>
      {value && <button onClick={() => onChange("")} style={{ background:"none", border:"none", color:T.textSub, cursor:"pointer", fontSize:13, padding:0 }}>✕</button>}
    </div>
  );
}

function KpiCard({ label, value, sub, color, trend }) {
  return (
    <div style={{ background:T.bgCard, borderRadius:14, padding:"18px 20px", flex:1, minWidth:140,
      border:"1px solid "+T.border, position:"relative", overflow:"hidden",
      boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"linear-gradient(90deg,"+color+","+color+"66)" }}/>
      <div style={{ color:T.textSub, fontSize:9, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>{label}</div>
      <div style={{ color:color, fontSize:24, fontWeight:800, letterSpacing:-0.5 }}>{value}</div>
      <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:6 }}>
        {trend === "up"   && <ChevronUp size={12} color={T.green}/>}
        {trend === "flat" && <Minus size={12} color={T.textSub}/>}
        <span style={{ color:T.textMid, fontSize:11 }}>{sub}</span>
      </div>
    </div>
  );
}

function RankTable({ title, icon: Icon, color, rows, labelKey }) {
  const max = rows[0]?.conversions || 1;
  return (
    <div style={{ background:T.bgCard, borderRadius:14, padding:20, border:"1px solid "+T.border, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
        <div style={{ background:color+"15", borderRadius:8, padding:6 }}><Icon size={13} color={color}/></div>
        <span style={{ fontWeight:700, fontSize:13, color:T.textPrimary }}>{title}</span>
      </div>
      {rows.length === 0 && <div style={{ color:T.textSub, fontSize:13, textAlign:"center", padding:"16px 0" }}>No data</div>}
      {rows.slice(0,7).map((r, i) => (
        <div key={i} style={{ marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ background:GRAD[i%GRAD.length]+"15", color:GRAD[i%GRAD.length], fontSize:9, fontWeight:800, padding:"1px 7px", borderRadius:4, border:"1px solid "+GRAD[i%GRAD.length]+"25", letterSpacing:0.5 }}>{"#"+(i+1)}</span>
              <span style={{ color:T.textPrimary, fontWeight:600 }}>{r[labelKey]}</span>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <span style={{ color:T.textSub, fontFamily:"monospace" }}>{fmtN(r.clicks)}</span>
              <span style={{ color:color, fontWeight:700, fontFamily:"monospace" }}>{r.cvr}</span>
              <span style={{ color:T.textPrimary, fontWeight:700, fontFamily:"monospace" }}>{fmtN(r.conversions)}</span>
            </div>
          </div>
          <div style={{ background:T.border2, borderRadius:2, height:3 }}>
            <div style={{ width:Math.round((r.conversions/max)*100)+"%", background:"linear-gradient(90deg,"+color+","+color+"55)", height:"100%", borderRadius:2 }}/>
          </div>
        </div>
      ))}
    </div>
  );
}

function SubIDPerformance({ bySubid }) {
  const [subView, setSubView] = useState("chart");
  const [sortBy, setSortBy]   = useState("conversions");
  const sorted = [...bySubid].sort((a, b) => sortBy === "cvr" ? parseFloat(b.cvr) - parseFloat(a.cvr) : b[sortBy] - a[sortBy]);
  const maxCvr = Math.max(...sorted.map(x => parseFloat(x.cvr) || 0), 1);

  return (
    <div style={{ background:T.bgCard, borderRadius:14, padding:24, marginBottom:20, border:"1px solid "+T.border, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18, flexWrap:"wrap" }}>
        <div style={{ background:"linear-gradient(135deg,"+T.primary+","+T.secondary+")", borderRadius:8, padding:6 }}><TrendingUp size={14} color="#fff"/></div>
        <span style={{ fontWeight:800, fontSize:15, color:T.textPrimary }}>SubID Performance</span>
        <div style={{ marginLeft:"auto", display:"flex", gap:6, flexWrap:"wrap" }}>
          {[["conversions","CONV"],["clicks","CLICKS"],["cvr","CVR"]].map(([s, lbl]) => (
            <button key={s} onClick={() => setSortBy(s)}
              style={{ padding:"4px 12px", borderRadius:6, fontSize:10, fontWeight:700, cursor:"pointer", letterSpacing:0.8,
                border: sortBy===s ? "1px solid "+T.primary : "1px solid "+T.border,
                background: sortBy===s ? T.primary : T.bg,
                color: sortBy===s ? "#fff" : T.textMid }}>
              {lbl}
            </button>
          ))}
          <div style={{ width:1, background:T.border, margin:"0 4px" }}/>
          {[["chart","▦"],["table","≡"]].map(([v, icon]) => (
            <button key={v} onClick={() => setSubView(v)}
              style={{ padding:"4px 10px", borderRadius:6, fontSize:13, cursor:"pointer", border:"1px solid "+T.border,
                background: subView===v ? T.border : T.bgCard, color: subView===v ? T.textPrimary : T.textSub }}>
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", gap:10, marginBottom:16 }}>
        {[
          { label:"Total SubIDs", value:bySubid.length,        color:T.primary   },
          { label:"Top CVR",      value:sorted[0]?.cvr||"0%",  color:T.green     },
          { label:"Top SubID",    value:sorted[0]?.subid||"—", color:T.accent    },
        ].map(s => (
          <div key={s.label} style={{ flex:1, background:s.color+"0d", borderRadius:8, padding:"10px 14px", border:"1px solid "+s.color+"20" }}>
            <div style={{ color:T.textSub, fontSize:9, fontWeight:700, letterSpacing:1.2, textTransform:"uppercase" }}>{s.label}</div>
            <div style={{ color:s.color, fontSize:18, fontWeight:800, marginTop:4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {subView === "chart" ? (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sorted.slice(0,12)} barGap={4} barCategoryGap="28%">
              <CartesianGrid strokeDasharray="2 4" stroke={T.border} vertical={false}/>
              <XAxis dataKey="subid" tick={{ fill:T.textSub, fontSize:11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:T.textSub, fontSize:11 }} axisLine={false} tickLine={false} width={36}/>
              <Tooltip contentStyle={{ background:T.bgCard, border:"1px solid "+T.border, borderRadius:8, padding:"10px 14px", boxShadow:"0 4px 12px rgba(0,0,0,0.1)" }}
                labelStyle={{ color:T.textPrimary, fontWeight:700 }} cursor={{ fill:T.primary+"08" }}/>
              <Bar dataKey="clicks" radius={[4,4,0,0]} name="Clicks">{sorted.slice(0,12).map((_,i) => <Cell key={i} fill={GRAD[i%GRAD.length]+"30"}/>)}</Bar>
              <Bar dataKey="conversions" radius={[4,4,0,0]} name="Conversions">{sorted.slice(0,12).map((_,i) => <Cell key={i} fill={GRAD[i%GRAD.length]}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop:14, background:T.bg, borderRadius:10, padding:"12px 10px", border:"1px solid "+T.border, display:"flex", gap:6 }}>
            {sorted.slice(0,12).map((r, i) => {
              const cv = parseFloat(r.cvr) || 0;
              const col = GRAD[i%GRAD.length];
              return (
                <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                  <div style={{ width:"100%", background:T.border2, borderRadius:3, height:40, display:"flex", alignItems:"flex-end", overflow:"hidden" }}>
                    <div style={{ width:"100%", height:(cv/maxCvr*100)+"%", background:col, borderRadius:"2px 2px 0 0", minHeight:3 }}/>
                  </div>
                  <span style={{ color:col, fontSize:10, fontWeight:800, fontFamily:"monospace" }}>{r.cvr}</span>
                  <span style={{ color:T.textSub, fontSize:9, textAlign:"center", overflow:"hidden", textOverflow:"ellipsis", width:"100%", whiteSpace:"nowrap" }}>{r.subid}</span>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr style={{ borderBottom:"2px solid "+T.border }}>
                {["#","SubID","Clicks","Conversions","CVR","Performance"].map((h, i) => (
                  <th key={i} style={{ padding:"8px 12px", fontWeight:700, fontSize:9, textAlign:i<2?"left":"right", letterSpacing:1.2, textTransform:"uppercase", color:T.textSub }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => {
                const cv = parseFloat(r.cvr) || 0;
                const col = GRAD[i%GRAD.length];
                return (
                  <tr key={i} style={{ borderBottom:"1px solid "+T.border2, background:i===0?T.primary+"06":"transparent" }}>
                    <td style={{ padding:"10px 12px", color:col, fontWeight:800, fontFamily:"monospace", fontSize:11 }}>{"#"+(i+1)}</td>
                    <td style={{ padding:"10px 12px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        {i===0 && <span style={{ background:T.primary+"15", border:"1px solid "+T.primary+"30", borderRadius:4, padding:"1px 8px", fontSize:9, color:T.primary, fontWeight:800, letterSpacing:0.8 }}>TOP</span>}
                        <span style={{ color:col, fontWeight:700 }}>{r.subid}</span>
                      </div>
                    </td>
                    <td style={{ padding:"10px 12px", color:T.textMid, textAlign:"right", fontFamily:"monospace" }}>{fmtN(r.clicks)}</td>
                    <td style={{ padding:"10px 12px", color:T.textPrimary, fontWeight:700, textAlign:"right", fontFamily:"monospace" }}>{fmtN(r.conversions)}</td>
                    <td style={{ padding:"10px 12px", textAlign:"right" }}>
                      <span style={{ background:col+"15", color:col, padding:"2px 10px", borderRadius:4, fontWeight:800, fontSize:11, border:"1px solid "+col+"25", fontFamily:"monospace" }}>{r.cvr}</span>
                    </td>
                    <td style={{ padding:"10px 12px", minWidth:100 }}>
                      <div style={{ background:T.border2, borderRadius:2, height:4 }}>
                        <div style={{ width:(cv/maxCvr*100)+"%", background:col, height:"100%", borderRadius:2 }}/>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SubIDPayout({ data, offers }) {
  const [sortBy, setSortBy] = useState("revenue");
  const [search, setSearch] = useState("");

  const offerPayoutMap = {};
  offers.forEach(o => { offerPayoutMap[o.offer_name] = parseFloat(o.payout || 0); });

  const rows = Object.values(data.reduce((acc, r) => {
    const sid     = r.subid  || subidOf(r)  || "Unknown";
    const offer   = r.offer  || offerOf(r)  || "Unknown";
    const conv    = Number(r.conversions != null ? r.conversions : convOf(r));
    const clk     = Number(r.clicks != null ? r.clicks : clicksOf(r)) || 1;
    const revenue = r.payout > 0 ? r.payout : (offerPayoutMap[offer] || 0);
    if (!acc[sid]) acc[sid] = { subid:sid, clicks:0, conversions:0, revenue:0, offers:{} };
    acc[sid].clicks      += clk;
    acc[sid].conversions += conv;
    acc[sid].revenue     += revenue;
    if (!acc[sid].offers[offer]) acc[sid].offers[offer] = { conv:0 };
    acc[sid].offers[offer].conv += conv;
    return acc;
  }, {})).map(r => ({
    ...r,
    epc:       r.clicks > 0 ? (r.revenue/r.clicks).toFixed(4) : "0.0000",
    cvr:       pctStr(r.conversions, r.clicks),
    avgPayout: r.conversions > 0 ? (r.revenue/r.conversions).toFixed(2) : "0.00",
    topOffer:  Object.entries(r.offers).sort((a,b) => b[1].conv - a[1].conv)[0]?.[0] || "—",
  })).sort((a, b) => {
    if (sortBy === "epc")    return parseFloat(b.epc) - parseFloat(a.epc);
    if (sortBy === "clicks") return b.clicks - a.clicks;
    if (sortBy === "conv")   return b.conversions - a.conversions;
    return b.revenue - a.revenue;
  });

  const filteredRows = search ? rows.filter(r => r.subid.toLowerCase().includes(search.toLowerCase())) : rows;
  const maxRev    = filteredRows[0]?.revenue || 1;
  const totalRev  = rows.reduce((s, r) => s + r.revenue, 0);
  const totalConv = rows.reduce((s, r) => s + r.conversions, 0);
  const totalClk  = rows.reduce((s, r) => s + r.clicks, 0);
  const totalEPC  = totalClk > 0 ? (totalRev/totalClk).toFixed(4) : "0.0000";

  return (
    <div style={{ background:T.bgCard, borderRadius:14, padding:24, marginBottom:20, border:"1px solid "+T.border, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18, flexWrap:"wrap" }}>
        <div style={{ background:"linear-gradient(135deg,"+T.green+","+T.secondary+")", borderRadius:8, padding:6 }}><TrendingUp size={14} color="#fff"/></div>
        <span style={{ fontWeight:800, fontSize:15, color:T.textPrimary }}>💰 SubID Payout Analysis</span>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search SubID..." color={T.green}/>
          <div style={{ display:"flex", gap:6 }}>
            {[{key:"revenue",label:"REVENUE"},{key:"epc",label:"EPC"},{key:"conv",label:"CONV"},{key:"clicks",label:"CLICKS"}].map(b => (
              <button key={b.key} onClick={() => setSortBy(b.key)}
                style={{ padding:"4px 12px", borderRadius:6, fontSize:9, fontWeight:700, cursor:"pointer", letterSpacing:0.8,
                  border: sortBy===b.key ? "1px solid "+T.green : "1px solid "+T.border,
                  background: sortBy===b.key ? T.green : T.bg,
                  color: sortBy===b.key ? "#fff" : T.textMid }}>{b.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Total Payout Banner */}
      {rows.length > 0 && (
        <div style={{ background:"linear-gradient(135deg,"+T.green+"0d,"+T.secondary+"08)", borderRadius:12, padding:"18px 24px", marginBottom:20, border:"1px solid "+T.green+"25", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
          <div>
            <div style={{ color:T.textSub, fontSize:9, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:4 }}>Total Payout</div>
            <div style={{ color:T.green, fontSize:38, fontWeight:900, letterSpacing:-1, fontFamily:"monospace" }}>{fmtUSD(totalRev)}</div>
            <div style={{ color:T.textSub, fontSize:11, marginTop:4 }}>across {rows.length} SubIDs · {totalConv} conversions</div>
          </div>
          <div style={{ display:"flex", gap:24, flexWrap:"wrap" }}>
            {[
              { label:"Avg Payout/Conv", value:fmtUSD(totalConv>0?totalRev/totalConv:0), color:T.accent    },
              { label:"Overall EPC",     value:"$"+totalEPC,                              color:T.yellow    },
              { label:"Total Clicks",    value:fmtN(totalClk),                            color:T.primary   },
              { label:"Overall CVR",     value:pctStr(totalConv,totalClk),                color:T.secondary },
            ].map(s => (
              <div key={s.label} style={{ textAlign:"center" }}>
                <div style={{ color:T.textSub, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{s.label}</div>
                <div style={{ color:s.color, fontSize:20, fontWeight:800, fontFamily:"monospace" }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Podium */}
      {!search && rows.length >= 1 && (
        <div style={{ display:"flex", gap:12, marginBottom:20 }}>
          {rows.slice(0,3).map((r, i) => {
            const medals = ["🥇","🥈","🥉"];
            const colors = [T.yellow, T.textMid, T.orange];
            const col = colors[i];
            const share = totalRev > 0 ? ((r.revenue/totalRev)*100).toFixed(1) : 0;
            return (
              <div key={r.subid} style={{ flex:1, background:col+"0a", borderRadius:12, padding:"16px 18px", border:"1px solid "+col+"25" }}>
                <div style={{ fontSize:18, marginBottom:6 }}>{medals[i]}</div>
                <div style={{ color:col, fontWeight:800, fontSize:15, marginBottom:2 }}>{r.subid}</div>
                <div style={{ color:T.green, fontSize:22, fontWeight:900, fontFamily:"monospace" }}>{fmtUSD(r.revenue)}</div>
                <div style={{ color:T.textSub, fontSize:11, marginTop:3 }}>{share}% of total</div>
                <div style={{ display:"flex", gap:12, marginTop:10, flexWrap:"wrap" }}>
                  {[["EPC","$"+r.epc,T.yellow],["CVR",r.cvr,T.primary],["Conv",r.conversions,T.textPrimary],["P/C",fmtUSD(r.avgPayout),T.green]].map(([lbl,val,c]) => (
                    <div key={lbl}>
                      <div style={{ color:T.textSub, fontSize:9, textTransform:"uppercase", letterSpacing:0.8 }}>{lbl}</div>
                      <div style={{ color:c, fontWeight:700, fontSize:12, fontFamily:"monospace" }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredRows.length === 0 ? (
        <div style={{ color:T.textSub, fontSize:13, textAlign:"center", padding:"20px 0" }}>No SubIDs match your search.</div>
      ) : (
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr style={{ borderBottom:"2px solid "+T.border, background:T.bg }}>
                {["#","SubID","Clicks","Conversions","CVR","Payout/Conv","Revenue","EPC","% Share"].map((h, i) => (
                  <th key={i} style={{ padding:"10px 12px", fontWeight:700, fontSize:9, textAlign:i<2?"left":"right", letterSpacing:1.2, textTransform:"uppercase", color:T.textSub }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r, i) => {
                const col = GRAD[i%GRAD.length];
                const share = totalRev > 0 ? ((r.revenue/totalRev)*100).toFixed(1) : 0;
                return (
                  <tr key={r.subid} style={{ borderBottom:"1px solid "+T.border2, background:i===0?T.green+"06":"transparent" }}>
                    <td style={{ padding:"10px 12px", color:col, fontWeight:800, fontFamily:"monospace", fontSize:11 }}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":"#"+(i+1)}</td>
                    <td style={{ padding:"10px 12px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ width:6, height:6, borderRadius:"50%", background:col }}/>
                        <span style={{ color:T.textPrimary, fontWeight:600 }}>{r.subid}</span>
                      </div>
                    </td>
                    <td style={{ padding:"10px 12px", color:T.textMid, textAlign:"right", fontFamily:"monospace" }}>{fmtN(r.clicks)}</td>
                    <td style={{ padding:"10px 12px", color:T.textPrimary, fontWeight:700, textAlign:"right", fontFamily:"monospace" }}>{r.conversions}</td>
                    <td style={{ padding:"10px 12px", textAlign:"right" }}>
                      <span style={{ background:col+"15", color:col, padding:"2px 8px", borderRadius:4, fontWeight:700, fontSize:11, border:"1px solid "+col+"25", fontFamily:"monospace" }}>{r.cvr}</span>
                    </td>
                    <td style={{ padding:"10px 12px", textAlign:"right", color:T.accent, fontWeight:800, fontFamily:"monospace" }}>{fmtUSD(r.avgPayout)}</td>
                    <td style={{ padding:"10px 12px", textAlign:"right" }}>
                      <div>
                        <span style={{ color:T.green, fontWeight:800, fontSize:13, fontFamily:"monospace" }}>{fmtUSD(r.revenue)}</span>
                        <div style={{ background:T.border2, borderRadius:2, height:3, marginTop:3, minWidth:60 }}>
                          <div style={{ width:(r.revenue/maxRev*100)+"%", background:"linear-gradient(90deg,"+T.green+","+T.secondary+")", height:"100%", borderRadius:2 }}/>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:"10px 12px", color:T.yellow, fontWeight:700, textAlign:"right", fontFamily:"monospace" }}>{"$"+r.epc}</td>
                    <td style={{ padding:"10px 12px", textAlign:"right", color:T.purple, fontWeight:700, fontFamily:"monospace" }}>{share}%</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop:"2px solid "+T.border, background:T.bg }}>
                <td colSpan={2} style={{ padding:"10px 12px", color:T.textMid, fontWeight:700, fontSize:11, letterSpacing:0.8 }}>TOTAL</td>
                <td style={{ padding:"10px 12px", color:T.textMid, textAlign:"right", fontFamily:"monospace" }}>{fmtN(totalClk)}</td>
                <td style={{ padding:"10px 12px", color:T.textPrimary, fontWeight:800, textAlign:"right", fontFamily:"monospace" }}>{totalConv}</td>
                <td style={{ padding:"10px 12px", textAlign:"right", color:T.yellow, fontWeight:700, fontFamily:"monospace" }}>{pctStr(totalConv,totalClk)}</td>
                <td style={{ padding:"10px 12px", textAlign:"right", color:T.accent, fontWeight:800, fontFamily:"monospace" }}>{fmtUSD(totalConv>0?totalRev/totalConv:0)}</td>
                <td style={{ padding:"10px 12px", textAlign:"right" }}><span style={{ color:T.green, fontWeight:900, fontSize:14, fontFamily:"monospace" }}>{fmtUSD(totalRev)}</span></td>
                <td colSpan={2}/>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

const ProductivityTool = () => {
  const [data,          setData]          = useState([]);
  const [fileMsg,       setFileMsg]       = useState("Drop or click to upload CSV");
  const [parseError,    setParseError]    = useState("");
  const [aiInsights,    setAiInsights]    = useState("");
  const [loading,       setLoading]       = useState(false);
  const [dragging,      setDragging]      = useState(false);
  const [selectedSubid, setSelectedSubid] = useState("ALL");
  const [subidSearch,   setSubidSearch]   = useState("");
  const [offers,        setOffers]        = useState([]);
  const [newOffer,      setNewOffer]      = useState({ name:"", url:"", payout:"" });
  const [showOffers,    setShowOffers]    = useState(false);
  const [editPayout,    setEditPayout]    = useState({});
  const inputRef = useRef(null);

  const processFile = async (file) => {
    if (!file) return;
    setParseError(""); setAiInsights("");
    setFileMsg("⏳ Loading "+file.name+"…");
    try {
      const text   = await file.text();
      const parsed = parseCSV(text);
      const rows   = Object.values(parsed.reduce((acc, r) => {
        const k = subidOf(r)+"|"+lpOf(r)+"|"+countryOf(r)+"|"+offerOf(r);
        if (!acc[k]) acc[k] = { subid:subidOf(r), lp:lpOf(r), country:countryOf(r), offer:offerOf(r), clicks:0, conversions:0, payout:0 };
        acc[k].clicks      += clicksOf(r);
        acc[k].conversions += convOf(r);
        acc[k].payout      += payoutOf(r);
        return acc;
      }, {})).map(r => ({ ...r, cvr: pctStr(r.conversions, r.clicks) }));
      setData(rows);
      setFileMsg("✅ "+file.name+" · "+parsed.length+" rows");
    } catch(e) { setFileMsg("❌ "+e.message); setParseError(e.message); }
  };

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  }, []);

  const addOffer     = () => { if (!newOffer.name) return; setOffers(p => [...p, { offer_name:newOffer.name, offer_url:newOffer.url, payout:parseFloat(newOffer.payout)||0, is_active:true }]); setNewOffer({ name:"", url:"", payout:"" }); };
  const toggleOffer  = name => setOffers(p => p.map(o => o.offer_name===name ? {...o,is_active:!o.is_active} : o));
  const updatePayout = (name, p) => { setOffers(prev => prev.map(o => o.offer_name===name?{...o,payout:parseFloat(p)||0}:o)); setEditPayout(prev=>({...prev,[name]:undefined})); };

  const filtered       = selectedSubid === "ALL" ? data : data.filter(r => (r.subid||subidOf(r)) === selectedSubid);
  const bySubid        = agg(data,    r => r.subid   || subidOf(r),   "subid");
  const byLP           = agg(filtered,r => r.lp      || lpOf(r),      "lp");
  const byCountry      = agg(filtered,r => r.country || countryOf(r), "country");
  const byOffer        = agg(filtered,r => r.offer   || offerOf(r),   "offer");
  const totalClicks    = filtered.reduce((s,r) => s + (Number(r.clicks)||0), 0);
  const totalConv      = filtered.reduce((s,r) => s + (Number(r.conversions)||0), 0);
  const allSubids      = ["ALL", ...new Set(data.map(r => r.subid||subidOf(r)).filter(Boolean))];
  const filteredSubids = allSubids.filter(s => s.toLowerCase().includes(subidSearch.toLowerCase()));

  const getAI = async () => {
    setLoading(true); setAiInsights("");
    const summary = "SubID="+selectedSubid+" | Clicks:"+totalClicks+" | Conv:"+totalConv+" | CVR:"+pctStr(totalConv,totalClicks)+"\nTop LPs:"+JSON.stringify(byLP.slice(0,5))+"\nTop Countries:"+JSON.stringify(byCountry.slice(0,5))+"\nTop Offers:"+JSON.stringify(byOffer.slice(0,5))+"\nTop SubIDs:"+JSON.stringify(bySubid.slice(0,5));
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000,
          messages:[{ role:"user", content:"You are a performance marketing analyst. Analyze:\n1. Top performers & anomalies\n2. Combos to scale or cut\n3. Next steps\nBe specific, cite numbers, use bullet points.\n\n"+summary }]
        })
      });
      const d = await res.json();
      setAiInsights(d.content?.map(c => c.text||"").join("\n") || "No insights.");
    } catch { setAiInsights("Failed. Please try again."); }
    setLoading(false);
  };

  return (
    <div style={{ background:T.bg, minHeight:"100vh", padding:24, fontFamily:"'Inter',system-ui,sans-serif", color:T.textPrimary }}>
      <div style={{ maxWidth:1140, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, background:T.bgCard, borderRadius:14, padding:"16px 24px", border:"1px solid "+T.border, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:40, height:40, background:"linear-gradient(135deg,"+T.primary+","+T.accent+")", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 12px "+T.primary+"30" }}>
              <TrendingUp size={20} color="#fff"/>
            </div>
            <div>
              <div style={{ fontSize:22, fontWeight:900, letterSpacing:-0.5, color:T.textPrimary }}>
                Track<span style={{ color:T.primary }}>&amp;</span>Scale
              </div>
              <div style={{ color:T.textSub, fontSize:10, letterSpacing:1.2, textTransform:"uppercase" }}>SubID · LP · Country · Offer</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {data.length > 0 && (
              <button onClick={() => { setData([]); setAiInsights(""); }}
                style={{ display:"flex", alignItems:"center", gap:6, background:"#fff5f5", border:"1px solid "+T.red+"30", borderRadius:8, padding:"7px 14px", color:T.red, cursor:"pointer", fontSize:12, fontWeight:600 }}>
                <Trash2 size={12}/> Clear
              </button>
            )}
            <button onClick={getAI} disabled={loading || data.length === 0}
              style={{ display:"flex", alignItems:"center", gap:8, border:"none", borderRadius:8, padding:"9px 18px", fontWeight:700, cursor:loading||data.length===0?"not-allowed":"pointer", fontSize:13,
                background: loading||data.length===0 ? T.border : "linear-gradient(135deg,"+T.primary+","+T.accent+")",
                color: loading||data.length===0 ? T.textSub : "#fff",
                boxShadow: loading||data.length===0 ? "none" : "0 4px 14px "+T.primary+"35" }}>
              <Sparkles size={13}/>{loading ? "Analyzing…" : "AI Insights"}
            </button>
          </div>
        </div>

        {/* Upload */}
        <div onDrop={onDrop} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)}
          onClick={() => inputRef.current?.click()}
          style={{ border:"2px dashed "+(dragging?T.primary:T.border), borderRadius:12, padding:"16px 22px", marginBottom:16,
            background:dragging?T.primary+"08":T.bgCard, cursor:"pointer", display:"flex", alignItems:"center", gap:14, transition:"all 0.2s",
            boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ background:T.primary+"12", border:"1px solid "+T.primary+"20", borderRadius:9, padding:10 }}><Upload size={17} color={T.primary}/></div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:600, fontSize:13, color:T.textPrimary }}>Upload CSV</div>
            <div style={{ fontSize:12, marginTop:2, color:fileMsg.startsWith("✅")?T.green:fileMsg.startsWith("❌")?T.red:T.textSub }}>{fileMsg}</div>
          </div>
          {["CSV","XLSX","JSON"].map(t => (
            <span key={t} style={{ background:T.bg, border:"1px solid "+T.border, borderRadius:4, padding:"2px 8px", fontSize:9, fontWeight:700, color:T.textSub, letterSpacing:0.8 }}>{t}</span>
          ))}
        </div>
        <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls,.json,.txt" style={{ display:"none" }}
          onChange={e => { if (e.target.files[0]) { processFile(e.target.files[0]); e.target.value=""; } }}/>

        {parseError && (
          <div style={{ background:"#fff5f5", border:"1px solid "+T.red+"30", borderRadius:8, padding:"10px 16px", marginBottom:14, color:T.red, fontSize:13 }}>⚠️ {parseError}</div>
        )}

        {data.length === 0 && (
          <div style={{ background:T.bgCard, border:"1px solid "+T.border, borderRadius:14, padding:"44px 24px", textAlign:"center", marginBottom:20, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize:36, marginBottom:10 }}>📊</div>
            <div style={{ color:T.textPrimary, fontWeight:700, fontSize:15, marginBottom:6 }}>No data loaded</div>
            <div style={{ color:T.textSub, fontSize:13 }}>Upload a CSV with SubID, LP, Country, Offer, Clicks, Conversions and Payout columns.</div>
          </div>
        )}

        {data.length > 0 && (
          <>
            {/* SubID Filter */}
            <div style={{ background:T.bgCard, borderRadius:12, padding:"12px 18px", marginBottom:20, border:"1px solid "+T.border, boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, flexWrap:"wrap" }}>
                <Filter size={12} color={T.primary}/>
                <span style={{ color:T.textSub, fontSize:9, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase" }}>Filter by SubID</span>
                <div style={{ marginLeft:"auto" }}>
                  <SearchBar value={subidSearch} onChange={setSubidSearch} placeholder="Search SubID..." color={T.primary}/>
                </div>
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {filteredSubids.map(s => (
                  <button key={s} onClick={() => { setSelectedSubid(s); setSubidSearch(""); }}
                    style={{ padding:"4px 14px", borderRadius:6, fontSize:11, fontWeight:700, cursor:"pointer",
                      border: selectedSubid===s ? "1px solid "+T.primary : "1px solid "+T.border,
                      background: selectedSubid===s ? T.primary : T.bg,
                      color: selectedSubid===s ? "#fff" : T.textMid,
                      boxShadow: selectedSubid===s ? "0 2px 8px "+T.primary+"30" : "none" }}>{s}</button>
                ))}
                {filteredSubids.length === 0 && <span style={{ color:T.textSub, fontSize:12 }}>No SubIDs match.</span>}
              </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>
              <KpiCard label="Total Clicks"  value={fmtN(totalClicks)}           sub={selectedSubid==="ALL"?"All SubIDs":"SubID: "+selectedSubid} color={T.primary}   trend="up"/>
              <KpiCard label="Conversions"   value={fmtN(totalConv)}             sub={"CVR: "+pctStr(totalConv,totalClicks)}                      color={T.green}    trend="up"/>
              <KpiCard label="Best LP"       value={byLP[0]?.lp||"—"}           sub={"CVR: "+(byLP[0]?.cvr||"0%")}                               color={T.yellow}   trend="flat"/>
              <KpiCard label="Best Country"  value={byCountry[0]?.country||"—"} sub={"CVR: "+(byCountry[0]?.cvr||"0%")}                           color={T.secondary}trend="flat"/>
              <KpiCard label="Best Offer"    value={byOffer[0]?.offer||"—"}     sub={"CVR: "+(byOffer[0]?.cvr||"0%")}                             color={T.accent}   trend="flat"/>
            </div>

            <SubIDPerformance bySubid={bySubid}/>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:20 }}>
              <RankTable title="Best Converting LPs"       icon={Filter}  color={T.yellow}    rows={byLP}      labelKey="lp"/>
              <RankTable title="Best Converting Countries" icon={Globe}   color={T.secondary} rows={byCountry} labelKey="country"/>
              <RankTable title="Best Converting Offers"    icon={Package} color={T.accent}    rows={byOffer}   labelKey="offer"/>
            </div>
          </>
        )}

        {data.length > 0 && <SubIDPayout data={filtered} offers={offers}/>}

        {/* Offer Manager */}
        <div style={{ background:T.bgCard, borderRadius:14, padding:24, marginBottom:20, border:"1px solid "+T.border, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16, cursor:"pointer" }} onClick={() => setShowOffers(!showOffers)}>
            <div style={{ background:"linear-gradient(135deg,"+T.green+","+T.secondary+")", borderRadius:8, padding:6 }}><Sparkles size={14} color="#fff"/></div>
            <span style={{ fontWeight:700, fontSize:14, color:T.textPrimary }}>Offer Manager &amp; Payout Setup</span>
            <span style={{ marginLeft:"auto", color:T.textSub, fontSize:11, background:T.bg, border:"1px solid "+T.border, borderRadius:4, padding:"2px 10px" }}>{showOffers?"Hide":"Expand"}</span>
          </div>
          {showOffers && (
            <>
              <div style={{ marginBottom:14 }}>
                {offers.length === 0 && <div style={{ color:T.textSub, fontSize:13, textAlign:"center", padding:"16px 0" }}>No offers yet — add one below</div>}
                {offers.map((o, i) => {
                  const col = GRAD[i%GRAD.length];
                  return (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", borderRadius:8, marginBottom:6,
                      background:o.is_active?col+"08":T.bg, border:"1px solid "+(o.is_active?col+"20":T.border), flexWrap:"wrap" }}>
                      <span style={{ background:col+"15", color:col, fontSize:9, fontWeight:800, padding:"2px 8px", borderRadius:4, border:"1px solid "+col+"20", letterSpacing:0.8 }}>{"#"+(i+1)}</span>
                      <div style={{ flex:1, minWidth:120 }}>
                        <div style={{ color:o.is_active?T.textPrimary:T.textSub, fontWeight:700, fontSize:13 }}>{o.offer_name}</div>
                        <div style={{ color:T.textSub, fontSize:11 }}>{o.offer_url}</div>
                      </div>
                      <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                        <div>
                          <div style={{ color:T.textSub, fontSize:9, textTransform:"uppercase", letterSpacing:0.8 }}>Payout/Conv</div>
                          {editPayout[o.offer_name] !== undefined ? (
                            <div style={{ display:"flex", gap:4 }}>
                              <input type="number" value={editPayout[o.offer_name]}
                                onChange={e => setEditPayout(p => ({...p,[o.offer_name]:e.target.value}))}
                                style={{ width:56, background:T.bg, border:"1px solid "+T.green+"50", borderRadius:6, padding:"2px 6px", color:T.green, fontSize:12, outline:"none" }}/>
                              <button onClick={() => updatePayout(o.offer_name, editPayout[o.offer_name])}
                                style={{ background:T.green+"15", border:"1px solid "+T.green+"30", borderRadius:6, padding:"2px 8px", color:T.green, fontSize:11, cursor:"pointer", fontWeight:700 }}>✓</button>
                            </div>
                          ) : (
                            <div style={{ color:T.green, fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"monospace" }}
                              onClick={() => setEditPayout(p => ({...p,[o.offer_name]:o.payout||0}))}>
                              {fmtUSD(o.payout)} <span style={{ fontSize:10 }}>✎</span>
                            </div>
                          )}
                        </div>
                        <button onClick={() => toggleOffer(o.offer_name)}
                          style={{ background:o.is_active?"#fff5f5":"#f0fdf4", border:"1px solid "+(o.is_active?T.red+"30":T.green+"30"), borderRadius:6, padding:"4px 12px",
                            color:o.is_active?T.red:T.green, fontSize:11, fontWeight:700, cursor:"pointer" }}>
                          {o.is_active?"Pause":"Resume"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ background:T.bg, borderRadius:8, padding:14, border:"1px solid "+T.border }}>
                <div style={{ color:T.textSub, fontSize:9, fontWeight:700, marginBottom:10, letterSpacing:1.2, textTransform:"uppercase" }}>+ Add New Offer</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  <input value={newOffer.name} onChange={e => setNewOffer(p => ({...p,name:e.target.value}))} placeholder="Offer name"
                    style={{ flex:1, minWidth:120, background:T.bgCard, border:"1px solid "+T.border, borderRadius:7, padding:"8px 12px", color:T.textPrimary, fontSize:13, outline:"none" }}/>
                  <input value={newOffer.url} onChange={e => setNewOffer(p => ({...p,url:e.target.value}))} placeholder="https://offer-url.com"
                    style={{ flex:2, minWidth:180, background:T.bgCard, border:"1px solid "+T.border, borderRadius:7, padding:"8px 12px", color:T.textPrimary, fontSize:13, outline:"none" }}/>
                  <input value={newOffer.payout} onChange={e => setNewOffer(p => ({...p,payout:e.target.value}))} placeholder="Payout/conv" type="number" min="0" step="0.01"
                    style={{ width:110, background:T.bgCard, border:"1px solid "+T.green+"40", borderRadius:7, padding:"8px 12px", color:T.green, fontSize:13, outline:"none" }}/>
                  <button onClick={addOffer}
                    style={{ background:"linear-gradient(135deg,"+T.primary+","+T.accent+")", border:"none", borderRadius:7, padding:"8px 18px", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", boxShadow:"0 4px 12px "+T.primary+"30" }}>
                    Add Offer
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* AI Insights */}
        {(aiInsights || loading) && (
          <div style={{ background:T.bgCard, border:"1px solid "+T.primary+"25", borderRadius:14, padding:26, marginBottom:20, boxShadow:"0 4px 20px "+T.primary+"10" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
              <div style={{ background:"linear-gradient(135deg,"+T.primary+","+T.accent+")", borderRadius:8, padding:8 }}><Sparkles size={14} color="#fff"/></div>
              <span style={{ fontSize:14, fontWeight:700, color:T.textPrimary }}>AI Insights &amp; Recommendations</span>
            </div>
            {loading
              ? <div style={{ display:"flex", alignItems:"center", gap:10, color:T.textSub, fontSize:14 }}>
                  <div style={{ width:14, height:14, border:"2px solid "+T.primary, borderTopColor:"transparent", borderRadius:"50%", animation:"spin 1s linear infinite" }}/>
                  Analyzing your data…
                </div>
              : <div style={{ color:T.textMid, fontSize:13, lineHeight:1.9, whiteSpace:"pre-wrap" }}>{aiInsights}</div>}
          </div>
        )}

        {!aiInsights && !loading && data.length > 0 && (
          <div style={{ background:T.bgCard, border:"1px solid "+T.border, borderRadius:10, padding:16, display:"flex", alignItems:"center", gap:10 }}>
            <AlertCircle size={13} color={T.textSub}/>
            <span style={{ color:T.textSub, fontSize:12 }}>Click <strong style={{ color:T.primary }}>AI Insights</strong> for a full SubID → LP → Country → Offer performance breakdown.</span>
          </div>
        )}

      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default ProductivityTool;