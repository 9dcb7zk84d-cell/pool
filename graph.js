// Render public readings only. Missing data is left blank.
function drawHistory(data) {
  const host = document.getElementById('history');
  const samples = (Array.isArray(data.history) ? data.history : [])
    .map(p => ({t: Date.parse(p.updated_at), v: p.temperature, b: p.blanket}))
    .filter(p => Number.isFinite(p.t)).sort((a,b) => a.t-b.t);
  const end = Date.now(), start = end - 48*3600000, gap = 25*60000;
  const points = samples.filter(p => p.t >= start && p.t <= end);
  const values = points.filter(p => typeof p.v === 'number' && Number.isFinite(p.v)).map(p => p.v);
  if (!values.length) { host.textContent = 'Waiting for temperature history'; return; }
  const lo = Math.floor((Math.min(...values)-0.5)*2)/2;
  const hi = Math.ceil((Math.max(...values)+0.5)*2)/2;
  const W=760,H=300,L=55,R=15,T=20,B=55, pw=W-L-R, ph=H-T-B;
  const x=t=>L+(t-start)/(end-start)*pw;
  const y=v=>T+(hi-v)/(hi-lo)*ph;
  const ns='http://www.w3.org/2000/svg';
  function el(tag,attrs={},text){const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n;}
  const svg=el('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':'Pool temperature over the last 48 hours. Green indicates covered, orange uncovered; gaps indicate missing data.',style:'width:100%;height:auto;display:block'});
  svg.append(el('rect',{x:L,y:T,width:pw,height:ph,fill:'#ffffff08'}));
  points.forEach((p,i)=>{
    const until=Math.min(points[i+1]?.t ?? end,p.t+gap,end);
    if(p.b==='Covered'||p.b==='Uncovered')svg.append(el('rect',{x:x(p.t),y:T,width:Math.max(0,x(until)-x(p.t)),height:ph,fill:p.b==='Covered'?'#43a047':'#fb8c00',opacity:0.22}));
  });
  for(let i=0;i<=4;i++){
    const v=lo+(hi-lo)*i/4, yy=y(v);
    svg.append(el('line',{x1:L,x2:W-R,y1:yy,y2:yy,stroke:'#ffffff25'}));
    svg.append(el('text',{x:L-8,y:yy+4,'text-anchor':'end',fill:'#b9d6e3','font-size':12},v.toFixed(1)));
  }
  for(let i=0;i<=4;i++){
    const t=start+(end-start)*i/4, xx=x(t);
    svg.append(el('text',{x:xx,y:H-B+23,'text-anchor':i===0?'start':i===4?'end':'middle',fill:'#b9d6e3','font-size':12},new Date(t).toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})));
  }
  points.forEach((p,i)=>{
    if(typeof p.v!=='number'||!Number.isFinite(p.v))return;
    const next=points[i+1], until=Math.min(next?.t ?? end,p.t+gap,end);
    let d=`M ${x(p.t)} ${y(p.v)} H ${x(until)}`;
    if(next && next.t-p.t<=gap && typeof next.v==='number' && Number.isFinite(next.v))d+=` V ${y(next.v)}`;
    const path=el('path',{d,fill:'none',stroke:'#29b6f6','stroke-width':3});
    path.append(el('title',{},`${new Date(p.t).toLocaleString()}: ${p.v.toFixed(1)} ${data.unit}; ${p.b||'Unknown'}`));svg.append(path);
  });
  host.replaceChildren(svg);
  document.getElementById('history-unit').textContent=data.unit==='°F'?'°F':'°C';
}
