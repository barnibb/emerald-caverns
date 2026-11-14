/* Emerald Caverns – Abspann nach dem letzten Level */
(()=>{
  'use strict';
  const el=document.querySelector('#credits'),roll=document.querySelector('#creditsRoll'),hint=document.querySelector('#creditsHint');
  if(!el||!roll)return;
  let onDone=null,openedAt=0;
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  function block(title,lines,cls=''){return`<section class="${cls}"><h3>${esc(title)}</h3>${lines.map(l=>`<p>${esc(l)}</p>`).join('')}</section>`}
  function show({name='',score=0,done}={}){
    onDone=typeof done==='function'?done:null;
    roll.innerHTML=
      `<section class="credits-top"><p class="credits-eyebrow">ALLE 100 HÖHLEN GESCHAFFT</p><h2>Emerald Caverns</h2>`+
      (name?`<p class="credits-player">Glückwunsch, ${esc(name)}!</p>`:'')+
      `<p class="credits-score">${Number(score).toLocaleString('de-DE')} Punkte</p></section>`+
      block('Ein Spiel von',['Björn Buchweitz'],'credits-big')+
      block('Spielidee & Leveldesign',['Björn Buchweitz'])+
      block('Eigene Höhlen',['Die schwarze Ader','Kammer der Echos','Kupferschacht 8','Kupferschacht 9','Farngewölbe 4','Farngewölbe 5'])+
      block('Programmierung',['Barni Productions','mit Unterstützung von Claude'])+
      block('Musik',['Levelmusik: im Spiel erzeugt','Prolog: FutureAmbient_3 · Pudgyplatypus · CC0','Reserve: Crystal Cave · CynicMusic · CC0'])+
      block('Danke fürs Spielen',[name?`… und besonders an dich, ${name}`:'… und an alle Mitspieler'])+
      `<section class="credits-end"><p>Barni Productions · © 2026</p></section>`;
    el.hidden=false;el.classList.remove('rolling');void el.offsetWidth;el.classList.add('rolling');openedAt=performance.now();
    if(hint)hint.textContent='KLICK ODER ENTER: WEITER';
  }
  function close(){if(el.hidden||performance.now()-openedAt<1200)return;el.hidden=true;el.classList.remove('rolling');const next=onDone;onDone=null;if(next)next()}
  el.addEventListener('click',close);
  addEventListener('keydown',e=>{if(!el.hidden&&(e.key==='Enter'||e.key===' '||e.key==='Escape')){e.preventDefault();e.stopImmediatePropagation();close()}},true);
  window.EmeraldCredits={show,isOpen:()=>!el.hidden};
})();
