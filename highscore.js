/* Emerald Caverns – gemeinsame Highscore-Liste auf dem Pi.
   Meldet die Spielstände aller Profile dieses Browsers an /api/highscores
   und zeigt die Liste aller Spieler in einem Fenster an. */
(()=>{
  'use strict';
  const API='api/highscores',STORAGE='emerald-caverns-profiles-v1',SENT='emerald-caverns-highscore-sent-v1',GAMES='emerald-caverns-highscore-games-v1';
  const online=location.protocol==='http:'||location.protocol==='https:';
  let timer=null,lastName='',onContinue=null;

  function readLocal(){
    try{const raw=JSON.parse(localStorage.getItem(STORAGE));if(!raw||typeof raw!=='object')return[];
      return Object.values(raw).filter(p=>p&&typeof p.name==='string'&&p.state&&Number.isFinite(p.state.score)).map(p=>{
        const unlocked=Number.isInteger(p.progress?.unlocked)?p.progress.unlocked:0;
        return{name:p.name,score:Math.max(0,Math.floor(p.state.score)),level:Math.max(unlocked,p.state.level|0)+1,completed:Array.isArray(p.progress?.completed)?p.progress.completed.length:0,savedAt:p.savedAt||0};
      })}catch{return[]}
  }
  function readSent(){try{return JSON.parse(localStorage.getItem(SENT))||{}}catch{return{}}}
  function readGames(){try{const g=JSON.parse(localStorage.getItem(GAMES));return Array.isArray(g)?g:[]}catch{return[]}}
  function writeGames(g){try{localStorage.setItem(GAMES,JSON.stringify(g.slice(-50)))}catch{}}
  function recordGame(game){if(!game||!game.name)return;const id=Date.now().toString(36)+Math.random().toString(36).slice(2,8);writeGames([...readGames(),{id,name:String(game.name),score:Math.max(0,Math.floor(game.score||0)),level:Math.max(1,game.level|0),result:game.result==='completed'?'completed':'gameover'}]);lastName=String(game.name);sync()}
  async function push(){
    timer=null;if(!online)return;
    const players=readLocal(),sent=readSent(),changed=players.filter(p=>{const s=sent[p.name.toLowerCase()];return!s||s.score!==p.score||s.level!==p.level||s.completed!==p.completed});
    const newest=players.slice().sort((a,b)=>b.savedAt-a.savedAt)[0];if(newest)lastName=newest.name;
    const games=readGames();if(!changed.length&&!games.length)return;
    try{
      const res=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({players:changed.map(({name,score,level,completed})=>({name,score,level,completed})),games})});
      if(!res.ok)return;
      for(const p of changed)sent[p.name.toLowerCase()]={score:p.score,level:p.level,completed:p.completed};
      try{localStorage.setItem(SENT,JSON.stringify(sent))}catch{}
      if(games.length){const sentIds=new Set(games.map(g=>g.id));writeGames(readGames().filter(g=>!sentIds.has(g.id)))}
    }catch{}
  }
  function sync(){if(timer)clearTimeout(timer);timer=setTimeout(push,1200)}

  // Fenster
  const dialog=document.querySelector('#highscoreDialog'),body=document.querySelector('#highscoreBody'),status=document.querySelector('#highscoreStatus'),recent=document.querySelector('#recentGames'),recentBody=document.querySelector('#recentBody');
  const fmt=ts=>{try{return new Intl.DateTimeFormat('de-DE',{dateStyle:'short',timeStyle:'short'}).format(new Date(ts))}catch{return''}};
  function row(cells,cls){const tr=document.createElement('tr');if(cls)tr.className=cls;for(const c of cells){const td=document.createElement('td');td.textContent=c;tr.append(td)}return tr}
  async function open(opts={}){
    if(!dialog)return;
    onContinue=typeof opts.onContinue==='function'?opts.onContinue:null;dialog.classList.toggle('continue-mode',!!onContinue);const hint=document.querySelector('.highscore-continue');if(hint)hint.textContent=opts.label||'KLICK ODER ENTER: NEU STARTEN';
    if(onContinue)document.querySelector('#highscoreTitle').textContent='Expedition vorbei';else document.querySelector('#highscoreTitle').textContent='Highscore';
    if(typeof dialog.showModal==='function'){if(!dialog.open)dialog.showModal()}else dialog.setAttribute('open','');
    body.replaceChildren();recentBody.replaceChildren();recent.hidden=true;status.textContent='Lade Liste …';
    if(!online){status.textContent='Die gemeinsame Liste gibt es nur, wenn das Spiel vom Pi geladen wird.';return}
    await push();
    try{
      const res=await fetch(API,{cache:'no-store'});if(!res.ok)throw new Error(res.status);
      const {players,games=[]}=await res.json();
      if(games.length){recent.hidden=false;for(const g of games)recentBody.append(row([fmt(g.at),g.name,g.score.toLocaleString('de-DE'),`Level ${g.level}`,g.result==='completed'?'🏆 alle geschafft':'verschüttet'],g.name.toLowerCase()===lastName.toLowerCase()?'me':''))}
      if(!players.length){status.textContent='Noch keine Einträge – spiel los!';return}
      status.textContent=`${players.length} Spieler · sortiert nach Punkten`;
      const medal=['🥇','🥈','🥉'];
      for(const p of players)body.append(row([medal[p.rank-1]||`${p.rank}.`,p.name,p.score.toLocaleString('de-DE'),`Level ${p.level}`,`${p.completed}`,fmt(p.updatedAt)],p.name.toLowerCase()===lastName.toLowerCase()?'me':''));
    }catch{status.textContent='Die Highscore-Liste ist gerade nicht erreichbar.'}
  }
  document.querySelectorAll('[data-highscore]').forEach(b=>b.addEventListener('click',()=>open()));
  if(dialog){
    document.querySelector('#highscoreClose').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',e=>{if(onContinue||e.target===dialog)dialog.close()});
    dialog.addEventListener('keydown',e=>{if(onContinue&&e.key==='Enter'){e.preventDefault();dialog.close()}});
    dialog.addEventListener('close',()=>{const next=onContinue;onContinue=null;dialog.classList.remove('continue-mode');if(next)setTimeout(next,0)});
  }

  window.EmeraldHighscore={sync,open,recordGame,isOpen:()=>!!(dialog&&dialog.open)};
  sync(); // vorhandene Profile gleich beim Start melden
})();
