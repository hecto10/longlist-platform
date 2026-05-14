// ─── MINI CHART ──────────────────────────────────────────
// 재무실적 탭의 막대차트 컴포넌트
function MiniChart({ data, scales, color, color2, xLabels }) {
  const W = 320; const H = 120; const pad = {l:52,r:10,t:20,b:24};
  const innerW = W-pad.l-pad.r; const innerH = H-pad.t-pad.b;
  const n = data[0].length;
  const colW2 = Math.floor(innerW/n);
  const bW = Math.min(16, Math.floor(colW2/2.8));
  const gap = 3;

  const getScale = (idx) => {
    const vals = data[idx];
    const posMax = Math.max(...vals.filter(v=>v>0), 0);
    const negMax = Math.abs(Math.min(...vals.filter(v=>v<0), 0));
    return { posMax: posMax||1, negMax };
  };

  const s0 = scales ? scales[0] : getScale(0);
  const total0 = s0.posMax + s0.negMax;
  const zeroY = pad.t + innerH * (s0.posMax / (total0||1));

  const absMax0 = s0.posMax;
  const mag = Math.pow(10, Math.floor(Math.log10(absMax0||1)));
  const ti = absMax0 <= mag*2 ? mag : absMax0 <= mag*5 ? mag*2 : mag*5;
  const posTicks = []; for(let v=ti; v<=s0.posMax*1.05; v+=ti) { if(posTicks.length<3) posTicks.push(v); }
  const negTicks2 = []; for(let v=ti; v<=s0.negMax*1.05; v+=ti) { if(negTicks2.length<3) negTicks2.push(v); }

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:'block'}}>
      {posTicks.map(v => {
        const y = zeroY - (v/s0.posMax)*(zeroY-pad.t);
        return <g key={v}>
          <line x1={pad.l} y1={y} x2={W-pad.r} y2={y} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3,3"/>
          <text x={pad.l-3} y={y+3} textAnchor="end" fontSize="8" fill="var(--text3)" fontFamily="MaruBuri,sans-serif">{fmt(v)}</text>
        </g>;
      })}
      {negTicks2.map(v => {
        const y = zeroY + (v/(s0.negMax||1))*(H-pad.b-zeroY);
        return <g key={-v}>
          <line x1={pad.l} y1={y} x2={W-pad.r} y2={y} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3,3"/>
          <text x={pad.l-3} y={y+3} textAnchor="end" fontSize="8" fill="var(--text3)" fontFamily="MaruBuri,sans-serif">-{fmt(v)}</text>
        </g>;
      })}
      <line x1={pad.l} y1={zeroY} x2={W-pad.r} y2={zeroY} stroke="var(--border2)" strokeWidth="1.2"/>
      <text x={pad.l-3} y={zeroY+3} textAnchor="end" fontSize="8" fill="var(--text3)" fontFamily="MaruBuri,sans-serif">0</text>
      {data[0].map((_, i) => {
        const colX = pad.l + i*colW2 + (colW2-(bW*data.length+gap*(data.length-1)))/2;
        return data.map((series, si) => {
          const v = Number(series[i])||0;
          const sc = scales ? scales[si] : getScale(si);
          const posH = zeroY - pad.t;
          const negH = H - pad.b - zeroY;
          const bH = v >= 0
            ? Math.max(Math.round((v/(sc.posMax||1))*posH), 2)
            : Math.max(Math.round((Math.abs(v)/(sc.negMax||1))*negH), 2);
          const bX = colX + si*(bW+gap);
          const bY = v >= 0 ? zeroY-bH : zeroY;
          const cl = si===0 ? color : color2||'rgba(255,106,0,0.38)';
          return <rect key={si} x={bX} y={bY} width={bW} height={bH} fill={cl} rx="2"/>;
        });
      })}
      {(xLabels||[]).map((lbl,i) => (
        <text key={i} x={pad.l+i*colW2+colW2/2} y={H-pad.b+12} textAnchor="middle" fontSize="8" fill="var(--text3)" fontFamily="MaruBuri,sans-serif">{lbl}</text>
      ))}
    </svg>
  );
}
