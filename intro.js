/* Emerald Caverns – Studio-Intro „Barni Productions · © 2026“
   Schrift wird per Canvas gezeichnet (zuverlässiger als CSS-3D-Text),
   dazu Lichtstrahlen, die von den Buchstaben in die Umgebung ausgehen. */
(()=>{
  'use strict';
  const host=document.querySelector('#studioIntro');if(!host)return;
  const TEXT='Barni Productions · © 2026'.toUpperCase();
  const PERIOD=7000;
  const canvas=document.createElement('canvas');canvas.className='studio-canvas';canvas.setAttribute('aria-hidden','true');
  const ctx=canvas.getContext('2d');if(!ctx)return; // ohne Canvas bleibt das alte CSS-Intro
  host.insertBefore(canvas,host.querySelector('.studio-actions'));
  host.classList.add('canvas-intro');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mk=()=>document.createElement('canvas');
  const sprite=mk(),glow=mk(),rayA=mk(),rayB=mk();
  const RAY_SCALE=.33;
  let W=0,H=0,dpr=1,fontPx=60,textW=0,textH=0,pad=0,raf=0,t0=0,running=false;

  function fontSpec(px){return `700 ${px}px "Barlow Condensed", "Arial Narrow", sans-serif`}
  function layoutChars(c,px){
    c.font=fontSpec(px);const sp=px*.08;let x=0;const pos=[];
    for(const ch of TEXT){pos.push(x);x+=c.measureText(ch).width+sp}
    return{pos,width:x};
  }
  function drawChars(c,pos,x0,y0,mode){for(let i=0;i<TEXT.length;i++){const ch=TEXT[i];if(mode==='stroke')c.strokeText(ch,x0+pos[i],y0);else c.fillText(ch,x0+pos[i],y0)}}

  function buildSprites(){
    fontPx=Math.max(43,Math.min(104,W*.08));
    const m=sprite.getContext('2d');const lay=layoutChars(m,fontPx);
    pad=Math.ceil(fontPx*.35);textW=Math.ceil(lay.width);textH=Math.ceil(fontPx*.95);
    const sw=textW+pad*2,sh=textH+pad*2+Math.ceil(fontPx*.15);
    for(const c of [sprite,glow]){c.width=Math.ceil(sw*dpr);c.height=Math.ceil(sh*dpr)}
    const base=pad+textH*.82; // Grundlinie
    // Schrift mit Tiefe (wie früher die gestaffelten Schatten)
    m.setTransform(dpr,0,0,dpr,0,0);m.clearRect(0,0,sw,sh);m.font=fontSpec(fontPx);m.textBaseline='alphabetic';
    m.save();m.shadowColor='rgba(0,0,0,.78)';m.shadowBlur=10*dpr;m.shadowOffsetY=11*dpr;m.fillStyle='#052d1c';drawChars(m,lay.pos,pad,base,'fill');m.restore();
    [['#052d1c',8],['#074329',6],['#095a36',4],['#0d7546',2]].forEach(([col,dy])=>{m.fillStyle=col;drawChars(m,lay.pos,pad,base+dy,'fill')});
    const top=base-fontPx*.78,g=m.createLinearGradient(0,top,0,base+fontPx*.05);
    g.addColorStop(0,'#f6fff8');g.addColorStop(.34,'#79ffb1');g.addColorStop(.62,'#12b96a');g.addColorStop(1,'#075c37');
    m.save();m.shadowColor='rgba(55,255,153,.35)';m.shadowBlur=10*dpr;m.fillStyle=g;drawChars(m,lay.pos,pad,base,'fill');m.restore();
    m.lineWidth=.8;m.strokeStyle='rgba(228,255,237,.85)';drawChars(m,lay.pos,pad,base,'stroke');
    // Leuchtvorlage für die Strahlen: nur die hellen Buchstaben
    const q=glow.getContext('2d');q.setTransform(dpr,0,0,dpr,0,0);q.clearRect(0,0,sw,sh);q.font=fontSpec(fontPx);
    const gg=q.createLinearGradient(0,top,0,base);gg.addColorStop(0,'#eafff2');gg.addColorStop(.6,'#5dffa8');gg.addColorStop(1,'#1fd47f');
    q.fillStyle=gg;drawChars(q,lay.pos,pad,base,'fill');
  }

  function resize(){
    dpr=Math.min(window.devicePixelRatio||1,2);W=Math.max(1,host.clientWidth||innerWidth);H=Math.max(1,host.clientHeight||innerHeight);
    canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
    for(const c of [rayA,rayB]){c.width=Math.max(1,Math.round(W*RAY_SCALE));c.height=Math.max(1,Math.round(H*RAY_SCALE))}
    buildSprites();
  }

  // Bahn der Schrift – entspricht den bisherigen Animationen studioTravel/studioWave
  function pose(ms){
    const p=reduced?.5:(ms%PERIOD)/PERIOD;
    const sw=sprite.width/dpr;
    const x0=W+80,x1=-sw-100;const left=reduced?(W-sw)/2:x0+(x1-x0)*p;
    const ang=reduced?0:p*Math.PI*4,wave=Math.min(82,H*.12);
    const alpha=reduced?1:Math.min(1,p/.125,(1-p)/.125);
    return{left,cy:H/2+wave*Math.sin(ang),sy:Math.cos(ang),alpha,sw,sh:sprite.height/dpr};
  }

  function frame(now){
    if(!running)return;raf=requestAnimationFrame(frame);
    const ms=now-t0,P=pose(ms);
    ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
    if(P.alpha<=0)return;
    const flat=Math.abs(P.sy);
    // Pulsieren im Takt (126 BPM wie die Intro-Musik)
    const beat=(ms/(60000/126))%1,pulse=.82+.32*Math.exp(-beat*5);
    // 1) Leuchtschrift klein in den Strahlenpuffer
    const a=rayA.getContext('2d'),b=rayB.getContext('2d'),rw=rayA.width,rh=rayA.height;
    a.setTransform(1,0,0,1,0,0);a.globalCompositeOperation='source-over';a.globalAlpha=1;a.clearRect(0,0,rw,rh);
    const cx=(P.left+P.sw/2)*RAY_SCALE,cy=P.cy*RAY_SCALE;
    a.setTransform(RAY_SCALE,0,0,RAY_SCALE*Math.max(.18,flat),cx,cy);a.globalAlpha=P.alpha*(.35+.3*flat);
    a.drawImage(glow,-P.sw/2,-P.sh/2,P.sw,P.sh);
    // 2) Radiale Verwischung: Strahlen laufen vom Schriftzug nach außen
    let src=rayA,dst=rayB,dc=b,s=1.06;
    for(let i=0;i<6;i++){
      dc.setTransform(1,0,0,1,0,0);dc.globalCompositeOperation='source-over';dc.globalAlpha=1;dc.clearRect(0,0,rw,rh);dc.drawImage(src,0,0);
      dc.globalAlpha=.6;dc.setTransform(s,0,0,s,cx*(1-s),cy*(1-s));dc.drawImage(src,0,0);
      [src,dst]=[dst,src];dc=dst.getContext('2d');s=1+(s-1)*1.8;
    }
    // 3) Strahlen ins Bild, darüber feine rotierende Lichtfächer
    ctx.globalCompositeOperation='lighter';ctx.imageSmoothingEnabled=true;ctx.globalAlpha=Math.min(1,.75*pulse);
    ctx.drawImage(src,0,0,canvas.width,canvas.height);
    const fx=(P.left+P.sw/2)*dpr,fy=P.cy*dpr,R=Math.max(W,H)*dpr*.9;
    ctx.save();ctx.translate(fx,fy);ctx.rotate(ms/9000);ctx.globalAlpha=P.alpha*.07*pulse*(.4+.6*flat);
    const rg=ctx.createRadialGradient(0,0,0,0,0,R);rg.addColorStop(0,'rgba(140,255,195,.9)');rg.addColorStop(.3,'rgba(70,240,150,.25)');rg.addColorStop(1,'rgba(40,200,120,0)');
    ctx.fillStyle=rg;const n=14;
    for(let i=0;i<n;i++){const w=.025+.02*Math.sin(i*2.3+ms/1300);ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,R,i/n*Math.PI*2-w,i/n*Math.PI*2+w);ctx.closePath();ctx.fill()}
    ctx.restore();
    // 4) Schriftzug selbst
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=P.alpha;
    ctx.setTransform(dpr,0,0,dpr*P.sy,P.left*dpr+P.sw*dpr/2,P.cy*dpr);
    ctx.drawImage(sprite,-P.sw/2,-P.sh/2,P.sw,P.sh);
    ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;
  }

  function start(){if(running)return;running=true;resize();t0=performance.now();raf=requestAnimationFrame(frame)}
  function stop(){running=false;cancelAnimationFrame(raf);ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height)}
  function sync(){const on=host.classList.contains('playing')&&!host.classList.contains('finished')&&!host.hidden;on?start():stop()}
  new MutationObserver(sync).observe(host,{attributes:true,attributeFilter:['class','hidden']});
  addEventListener('resize',()=>{if(running)resize()});
  if(document.fonts&&document.fonts.load)document.fonts.load(fontSpec(80),TEXT).then(()=>{if(running)buildSprites()}).catch(()=>{});
  sync();
})();
