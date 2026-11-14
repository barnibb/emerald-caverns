(() => {
  'use strict';
  const canvas=document.querySelector('#game'),staticCtx=canvas.getContext('2d'),actorCanvas=document.querySelector('#gameActors'),actorCtx=actorCanvas.getContext('2d');let ctx=staticCtx;
  const studioIntro=document.querySelector('#studioIntro'),studioGo=document.querySelector('#studioGo'),introSoundBtn=document.querySelector('#introSoundBtn'),prologueMusic=document.querySelector('#prologueMusic');
  const profileGate=document.querySelector('#profileGate'),profileList=document.querySelector('#profileList'),profileForm=document.querySelector('#profileForm'),profileName=document.querySelector('#profileName'),profileStatus=document.querySelector('#profileStatus'),profileBtn=document.querySelector('#profileBtn'),saveBtn=document.querySelector('#saveBtn');
  const levelGate=document.querySelector('#levelGate'),levelSelectTitle=document.querySelector('#levelSelectTitle'),levelSelectStatus=document.querySelector('#levelSelectStatus'),profileLevelGrid=document.querySelector('#profileLevelGrid'),continueProfileBtn=document.querySelector('#continueProfileBtn'),profileBackBtn=document.querySelector('#profileBackBtn');
  const overlay = document.querySelector('#overlay'), startBtn = document.querySelector('#startBtn');
  const gamePanel=document.querySelector('#gamePanel'),editorPanel=document.querySelector('#editorPanel'),editorCanvas=document.querySelector('#editorCanvas'),editorCtx=editorCanvas.getContext('2d'),editorStatus=document.querySelector('#editorStatus'),editorLevelSelect=document.querySelector('#editorLevelSelect');
  const levelEl = document.querySelector('#levelStat'), levelBadge = document.querySelector('#levelBadge'), goalEl = document.querySelector('#goalStat'), dynamiteEl=document.querySelector('#dynamiteStat'), scoreEl = document.querySelector('#scoreStat'), livesEl = document.querySelector('#livesStat');
  const titleEl = document.querySelector('#overlayTitle'), textEl = document.querySelector('#overlayText'), eyebrowEl = document.querySelector('#overlayEyebrow');
  const COLS=18, ROWS=13, W=40, H=40;
  const PHYSICS_STEP=145,ENEMY_STEP=550,RENDER_STEP=1000/30,MAX_FRAME_DELTA=250,MOVE_REPEAT_STEP=95,DYNAMITE_FUSE_MS=900;
  const baseLevelDefs=[
    {name:'Die grüne Tiefe',seed:113,gems:6,rocks:5,enemies:0,walls:7,dynamite:1},
    {name:'Der alte Schacht',seed:227,gems:7,rocks:4,enemies:0,walls:7,dynamite:1},
    {name:'Kristallgänge',seed:349,gems:8,rocks:9,enemies:1,walls:11,dynamite:1},
    {name:'Unter dem Basalt',seed:461,gems:9,rocks:11,enemies:2,walls:13,dynamite:2},
    {name:'Mooslicht',seed:591,gems:10,rocks:13,enemies:2,walls:15,dynamite:2},
    {name:'Der tiefe Bruch',seed:691,gems:11,rocks:15,enemies:3,walls:17,dynamite:2},
    {name:'Smaragdfieber',seed:809,gems:12,rocks:17,enemies:3,walls:19,dynamite:2},
    {name:'Die schwarze Ader',seed:929,gems:13,rocks:19,enemies:4,walls:21,dynamite:3,rows:["##################", "#P..............E#", "#.#CRD...M...G...#", "#.#..####.###.RC.#", "#.G..G.G.....M.G.#", "#U.C..G.C.CCC.R.R#", "#.C######.#.#.##.#", "#G.G.DR.CU..CC..R#", "#.R.R.CG.GM..D.G.#", "#R#.##C.#####.##.#", "#RRRCC..C.R.CC..R#", "#.CR..G.RRRR.C.G.#", "##################"]},
    {name:'Kammer der Echos',seed:1039,gems:14,rocks:21,enemies:4,walls:23,dynamite:3,rows:["##################", "#P..............E#", "#.C.RCCRR.D..CCC.#", "#.#C#.###.###C##.#", "#..G.G..RC.G.M..G#", "#RR....C.CC..DRR.#", "#.#GU#C#######.#R#", "#...G.CC...C.GGCR#", "#.G..C..G.M.GU..R#", "#.####.######.##.#", "#DR.G......C.G.R.#", "#RRC.RCR.C..GM...#", "##################"]},
    {name:'Das Herz der Mine',seed:1182,gems:15,rocks:23,enemies:4,walls:25,dynamite:3}
  ];
  const depthNames=['Smaragdstollen','Kristallkluft','Kupferschacht','Farngewölbe','Glutkammer','Nebelader','Donnergang','Schattenbruch','Ursteintiefe','Königsmine'];
  const levelDefs=Array.from({length:100},(_,index)=>{
    if(index<baseLevelDefs.length){
      const verticalEnemies=index<3?0:index<7?1:2;
      return{...baseLevelDefs[index],verticalEnemies};
    }
    const tier=Math.floor(index/10),stage=index%10;
    return{
      name:`${depthNames[tier]} ${stage+1}`,
      seed:1301+index*137,
      gems:8+Math.min(7,Math.floor(index/14))+stage%3,
      rocks:9+Math.min(12,tier)+stage%4,
      enemies:2+Math.min(3,Math.floor(tier/2))+stage%2,
      verticalEnemies:1+Math.min(3,Math.floor((tier+1)/2))+(stage===9?1:0),
      walls:12+Math.min(13,tier*2)+stage%4,
      dynamite:2+Math.min(3,Math.floor(tier/3)),
      bigDynamite:stage%2===1?1:0
    };
  });
  const themes=[
    {name:'Neonstollen',bpm:120,roots:[38,34,36,33],modes:'mMMm',lead:[74,null,77,79,null,81,79,null,72,null,76,79,null,76,74,null]},
    {name:'Grünes Licht',bpm:122,roots:[40,36,38,35],modes:'mMmM',lead:[76,79,null,83,81,null,79,76,74,null,76,79,81,null,79,null]},
    {name:'Kristallfunk',bpm:118,roots:[33,36,38,40],modes:'mMMm',lead:[69,null,72,76,74,72,null,69,76,null,79,81,null,79,76,null]},
    {name:'Basalt Beat',bpm:124,roots:[35,31,38,33],modes:'mMmM',lead:[71,74,78,null,81,78,74,null,69,71,null,74,78,null,76,null]},
    {name:'Moos im Morgenlicht',bpm:116,roots:[36,33,40,38],modes:'MmMm',lead:[72,null,76,79,76,null,72,69,71,null,74,76,79,null,76,null]},
    {name:'Tiefenpuls',bpm:126,roots:[31,38,35,33],modes:'mMmM',lead:[67,70,74,null,77,74,null,70,69,72,76,null,79,76,72,null]},
    {name:'Emerald Rush',bpm:123,roots:[41,38,36,40],modes:'mMMm',lead:[77,null,81,84,81,79,null,77,72,76,null,79,81,null,84,null]},
    {name:'Schwarze Ader',bpm:119,roots:[34,31,33,29],modes:'mMmM',lead:[70,73,null,77,75,null,73,70,68,null,70,73,77,null,75,null]},
    {name:'Echo Chamber',bpm:121,roots:[39,35,37,32],modes:'mMMm',lead:[75,null,78,82,null,80,78,75,73,75,null,78,82,85,null,82]},
    {name:'Herzschlag',bpm:125,roots:[38,41,34,36],modes:'mMmM',lead:[74,77,81,null,84,81,79,null,77,74,null,72,74,77,81,null]}
  ];
  const musicProfiles=[
    {rate:.96,filter:4600,gain:.20,offset:0},
    {rate:.985,filter:5200,gain:.21,offset:10},
    {rate:1.01,filter:6100,gain:.21,offset:20},
    {rate:.94,filter:3900,gain:.22,offset:30},
    {rate:.98,filter:5000,gain:.21,offset:40},
    {rate:.92,filter:3300,gain:.23,offset:5},
    {rate:1.04,filter:6600,gain:.22,offset:15},
    {rate:.90,filter:2800,gain:.24,offset:25},
    {rate:1.02,filter:5600,gain:.23,offset:35},
    {rate:1.06,filter:7400,gain:.24,offset:45}
  ];
  const ENEMY_CHARS='MNUV';
  const isEnemy=char=>ENEMY_CHARS.includes(char);
  const PROFILE_STORAGE_KEY='emerald-caverns-profiles-v1';
  function rng(seed){let value=seed>>>0;return()=>{value=(value*1664525+1013904223)>>>0;return value/4294967296}}
  function buildLevel(def){
    if(Array.isArray(def.rows))return def.rows.slice();
    const random=rng(def.seed),reserved=new Set(),map=Array.from({length:ROWS},(_,y)=>Array.from({length:COLS},(_,x)=>x===0||y===0||x===COLS-1||y===ROWS-1?'#':'.'));
    map[1][1]='P';map[1][COLS-2]='E';
    for(let y=3;y<ROWS-1;y+=3){const gaps=new Set([2+Math.floor(random()*5),10+Math.floor(random()*6)]);for(let x=2;x<COLS-2;x++)if(!gaps.has(x)&&random()>.18)map[y][x]='#'}
    function connected(){const seen=new Set(['1,1']),todo=[[1,1]];let open=0;for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(!['#','C'].includes(map[y][x]))open++;while(todo.length){const[x,y]=todo.pop();for(const[nx,ny]of[[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){const key=`${nx},${ny}`;if(map[ny]?.[nx]&&!['#','C'].includes(map[ny][nx])&&!seen.has(key)){seen.add(key);todo.push([nx,ny])}}}return seen.size===open}
    let placed=0,guard=0;while(placed<def.walls&&guard++<4000){const x=2+Math.floor(random()*(COLS-4)),y=2+Math.floor(random()*(ROWS-3));if(map[y][x]==='.'){map[y][x]='C';if(connected())placed++;else map[y][x]='.'}}
    function place(char,count,minSpace=0){let done=0,attempts=0;while(done<count&&attempts++<8000){const x=1+Math.floor(random()*(COLS-2)),y=2+Math.floor(random()*(ROWS-3)),neighbors=[[x+1,y],[x-1,y],[x,y+1],[x,y-1]],space=neighbors.filter(([nx,ny])=>!['#','C'].includes(map[ny][nx])).length,nearGem=neighbors.some(([nx,ny])=>map[ny][nx]==='G'),nearGuardian=neighbors.some(([nx,ny])=>isEnemy(map[ny][nx])),horizontalPatrol=char!=='M'||[x-3,x-2,x-1,x,x+1,x+2,x+3].every(nx=>map[y]?.[nx]==='.'),verticalPatrol=char!=='U'||[y-1,y,y+1].every(ny=>map[ny]?.[x]==='.');if(map[y][x]!=='.'||space<minSpace||!horizontalPatrol||!verticalPatrol||!['M','U','G'].includes(char)&&reserved.has(`${x},${y}`)||char!=='G'&&(x<4&&y<4||nearGem)||char==='R'&&nearGuardian)continue;map[y][x]=char;if(char==='M')for(let nx=x-3;nx<=x+3;nx++)reserved.add(`${nx},${y}`);if(char==='U')for(let ny=y-2;ny<=y+2;ny++)reserved.add(`${x},${ny}`);done++}}
    place('M',def.enemies,3);place('U',def.verticalEnemies||0,3);place('G',def.gems,3);place('R',def.rocks,def.rocks<=7?3:2);place('D',def.dynamite,3);place('X',def.bigDynamite||0,3);return map.map(row=>row.join(''));
  }
  const fixedLevels={27:["##################", "#P..............E#", "#..GG.GM...C..RRD#", "#.C###.##R####C#.#", "#.R.R.C.C.C.C..RD#", "#G.CC..R..RXCRRC.#", "#.###.#####R###..#", "#..R....C...G..G.#", "#U.C.U...C.R.C...#", "#.###.####.#C#R#.#", "#...M....C.G.M...#", "#..GM..G....G..C.#", "##################"],28:["##################", "#P..............E#", "#G.C.CR.G.CU.G...#", "#...#.#####.####.#", "#....MG...C.G..R.#", "#...........M....#", "#.###..####R##C.G#", "#.R.G.G.CCR.R.C..#", "#U....CC...D.G.CR#", "#.###.#####.##RR.#", "#G....C.C.D..CR.G#", "#..RC.......M..G.#", "##################"],33:["##################", "#P..............E#", "#G.G...CC..RCC.G.#", "#.#.U#####R#.###.#", "#.....M..G.C..C.G#", "#U.G.C.CC.C....R.#", "#.#C###.##.#####R#", "#.C.RRC.G.UC.D.R.#", "#D.C...M...R.RRC.#", "#.#C.#####.#####.#", "#D...M...R..RR.GG#", "#R.CC.CR...M..G..#", "##################"],34:["##################", "#P.GGGGGGGG.....E#", "#G..M....C...GU.R#", "#.##.RRRRRRRRR.#.#", "#...C..CC....M.G.#", "#.CC.GG...CCU.GU.#", "#R###.######.##G.#", "#R.D.CRRC.....C..#", "#...M....GG...RCR#", "#.#C#########..#R#", "#...CRG....D..C.R#", "#..G.....CRRD.C..#", "##################"]};
    // Ab Level 30 (erzeugte Level): zunehmend mehr frei liegende Steine zum Schieben.
  // Jeder Stein liegt auf Fels (Mauer oder rissige Wand) mit mindestens einem freien Feld daneben.
  // Er wird nur gesetzt, wenn danach alles, was vorher erreichbar war (Smaragde, Dynamit,
  // Ausgang), weiterhin erreichbar bleibt und nichts ins Rutschen kommt. Dafür darf eine
  // rissige Wand weichen – das macht ein Level nur offener, nie unlösbar.
  function reachableTargets(map,withCracked){
    let start=null;for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(map[y][x]==='P')start=[x,y];if(!start)return'';
    const seen=new Set([start.join()]),todo=[start],hits=[];
    while(todo.length){const[x,y]=todo.pop();for(const[nx,ny]of[[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){const c=map[ny]?.[nx],key=nx+','+ny;if(!c||seen.has(key)||c==='#'||c==='R'||isEnemy(c)||(c==='C'&&!withCracked))continue;seen.add(key);if('GEDX'.includes(c))hits.push(key);if(c!=='E')todo.push([nx,ny])}}
    return hits;
  }
  function addFreeRocks(rows,def,index){
    if(index<29)return rows;
    const want=2+Math.floor((index-29)/7),map=rows.map(row=>row.split('')),random=rng((def.seed*31+7)>>>0);
    const before=[reachableTargets(map,false),reachableTargets(map,true)],keeps=()=>before.every((list,i)=>{const now=new Set(reachableTargets(map,!!i));return list.every(key=>now.has(key))});
    let placed=0,tries=0;
    while(placed<want&&tries++<1500){
      const y=2+Math.floor(random()*(ROWS-3)),x=2+Math.floor(random()*(COLS-4)),side=random()<.5?-1:1;
      // freie Felder neben dem Stein: mindestens eins, wenn möglich auf beiden Seiten
      const free=[x+side,x-side].filter((cx,i)=>'.C'.includes(map[y][cx])&&'#C.'.includes(map[y+1][cx])&&(i===0||random()<.7));
      if(!'.C'.includes(map[y][x])||!'#C'.includes(map[y+1][x])||!free.includes(x+side))continue;
      const cells=[x,...free];
      if(cells.some(cx=>'RG'.includes(map[y-1][cx])||isEnemy(map[y-1][cx])))continue;
      if(cells.flatMap(cx=>[[cx-1,y],[cx+1,y],[cx,y-1]]).some(([cx,cy])=>'PE'.includes(map[cy]?.[cx]||'#')||isEnemy(map[cy]?.[cx]||'#')))continue;
      const old=cells.map(cx=>map[y][cx]);map[y][x]='R';for(const cx of free)map[y][cx]=' ';
      if(!keeps()){cells.forEach((cx,i)=>map[y][cx]=old[i]);continue}
      placed++;
    }
    return map.map(row=>row.join(''));
  }
  const levels=levelDefs.map((def,index)=>fixedLevels[index]?fixedLevels[index].slice():addFreeRocks(buildLevel(def),def,index));
  editorLevelSelect.innerHTML=levelDefs.map((def,index)=>`<option value="${index}">${index+1} · ${def.name}</option>`).join('');
  function playableRows(rows){if(!Array.isArray(rows)||rows.length!==ROWS)return false;let players=0,exits=0,gemsFound=0;for(let y=0;y<ROWS;y++){const row=typeof rows[y]==='string'?rows[y].split(''):rows[y];if(!Array.isArray(row)||row.length!==COLS)return false;for(let x=0;x<COLS;x++){const c=row[x];if(!'#. CRGDXMNUVEP'.includes(c))return false;if((x===0||y===0||x===COLS-1||y===ROWS-1)&&c!=='#')return false;if(c==='P')players++;if(c==='E')exits++;if(c==='G')gemsFound++}}return players===1&&exits===1&&gemsFound>0}
  function readLevelOverrides(){const found={};try{const raw=JSON.parse(localStorage.getItem('emerald-caverns-levels'));if(raw&&typeof raw==='object')for(let i=0;i<levels.length;i++)if(playableRows(raw[i]))found[i]=raw[i].map(row=>typeof row==='string'?row:row.join(''))}catch{}return found}
  let levelOverrides=readLevelOverrides();
  function getLevelRows(index){return levelOverrides[index]||levels[index]}
  function cleanProfileName(value){return String(value||'').trim().replace(/\s+/g,' ')}
  function profileKey(value){return cleanProfileName(value).toLocaleLowerCase('de-DE')}
  function validProfileName(value){const name=cleanProfileName(value);return name.length>=1&&name.length<=24&&!/[<>\u0000-\u001f]/.test(name)}
  function validSavedState(state){
    if(!state||!Number.isInteger(state.level)||state.level<0||state.level>=levels.length||!Array.isArray(state.grid)||state.grid.length!==ROWS)return false;
    if(!state.grid.every((row,y)=>typeof row==='string'&&row.length===COLS&&[...row].every((c,x)=>'#. CRGDXMNUVEBY'.includes(c)&&(!(x===0||y===0||x===COLS-1||y===ROWS-1)||c==='#'))))return false;
    if(!state.player||!Number.isInteger(state.player.x)||!Number.isInteger(state.player.y)||state.player.x<1||state.player.x>=COLS-1||state.player.y<1||state.player.y>=ROWS-1)return false;
    return['playing','won','dead','gameover','completed'].includes(state.status)&&[state.score,state.lives,state.gems,state.totalGems,state.dynamite].every(Number.isFinite);
  }
  function normalizedProgress(profile){
    const completed=new Set(Array.isArray(profile?.progress?.completed)?profile.progress.completed.filter(index=>Number.isInteger(index)&&index>=0&&index<levels.length):[]),state=profile.state;
    if(['won','completed'].includes(state.status))completed.add(state.level);
    let unlocked=Number.isInteger(profile?.progress?.unlocked)?profile.progress.unlocked:state.level;if(state.status==='won')unlocked=Math.max(unlocked,state.level+1);unlocked=Math.max(state.level,Math.min(levels.length-1,unlocked));
    for(let index=0;index<unlocked;index++)completed.add(index);if(state.status==='completed')completed.add(unlocked);
    return{unlocked,completed:[...completed].sort((a,b)=>a-b)};
  }
  function readProfiles(){
    try{const raw=JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY));if(!raw||typeof raw!=='object'||Array.isArray(raw))return{};const found={};for(const[key,profile]of Object.entries(raw))if(profile&&validProfileName(profile.name)&&validSavedState(profile.state))found[key]={name:cleanProfileName(profile.name),savedAt:Number(profile.savedAt)||0,state:profile.state,progress:normalizedProgress(profile)};return found}catch{return{}}
  }
  function writeProfiles(){scheduleProfilePush();try{localStorage.setItem(PROFILE_STORAGE_KEY,JSON.stringify(profiles));window.EmeraldHighscore?.sync();return true}catch{return false}}
  // Profile auf dem Pi: gemeinsam für alle Geräte, der Browser behält eine Kopie
  const PROFILE_API='api/profiles',profileServer=location.protocol==='http:'||location.protocol==='https:',pushedProfiles={};
  let profilePushTimer=null;
  function cleanProfileEntry(p){return p&&validProfileName(p.name)&&validSavedState(p.state)?{name:cleanProfileName(p.name),savedAt:Number(p.savedAt)||0,state:p.state,progress:normalizedProgress(p)}:null}
  function mergeProgress(a,b){return{unlocked:Math.max(a?.unlocked||0,b?.unlocked||0),completed:[...new Set([...(a?.completed||[]),...(b?.completed||[])])].sort((x,y)=>x-y)}}
  function scheduleProfilePush(){if(!profileServer)return;clearTimeout(profilePushTimer);profilePushTimer=setTimeout(()=>pushProfiles(),700)}
  async function pushProfiles(deletedKey=null,urgent=false){
    if(!profileServer)return;clearTimeout(profilePushTimer);profilePushTimer=null;
    const changed={},sent={};for(const[key,p]of Object.entries(profiles)){if(!p||!p.state)continue;const json=JSON.stringify(p);if(pushedProfiles[key]!==json){changed[key]=p;sent[key]=json}}
    if(!Object.keys(changed).length&&!deletedKey)return;
    const body=JSON.stringify({profiles:changed,deleted:deletedKey?[deletedKey]:[]});
    try{const res=await fetch(PROFILE_API,{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:urgent&&body.length<60000});if(res.ok)Object.assign(pushedProfiles,sent)}catch{}
  }
  async function pullProfiles(){
    if(!profileServer)return false;
    try{
      const res=await fetch(PROFILE_API,{cache:'no-store'});if(!res.ok)return false;const data=await res.json();let changed=false;
      for(const[key,deletedAt]of Object.entries(data.deleted||{})){const local=profiles[key];if(local&&key!==currentProfile&&(local.savedAt||0)<=deletedAt){delete profiles[key];delete pushedProfiles[key];changed=true}}
      for(const[key,raw]of Object.entries(data.profiles||{})){
        const remote=cleanProfileEntry(raw);if(!remote)continue;const local=profiles[key];
        if(key===currentProfile&&profileSessionActive)continue;
        if(!local||remote.savedAt>local.savedAt){profiles[key]={...remote,progress:mergeProgress(remote.progress,local?.progress)};changed=true}
        else if(local.savedAt===remote.savedAt)pushedProfiles[key]=JSON.stringify(local);
      }
      if(changed){try{localStorage.setItem(PROFILE_STORAGE_KEY,JSON.stringify(profiles))}catch{}}
      scheduleProfilePush();return changed;
    }catch{return false}
  }

  let grid, player, playerFacing=1, playerStride=0, fallingRocks=new Set(), fuses=[], explosions=[], editorGrid=[], editorBrush='.', editorLevel=4, staticDirty=true, customLevel=false, running=false, level=0, score=0, lives=3, gems=0, totalGems=0, dynamite=0, bigDynamite=0, sound=true, tick=0;
  let profiles=readProfiles(),currentProfile=null,autosaveTimer=null,replayMode=false,profileSessionActive=false;
  let musicEngine=null, audio, master, echo, noiseBuffer, musicTimer=false, musicStep=0, musicNext=0, musicBuffer, musicBufferPromise, musicSource, musicFilter, musicGain, dynamiteBuffer, dynamiteBufferPromise, musicRequest=0, introMusicRequest=0, introMusicTimer, introMusicStep=0, introMusicNext=0, enemiesActive=false, physicsActive=false, heldControl, heldMove, resumePrologueAfterVisibility=false;
  let lastFrame=performance.now(),nextPhysicsAt=Infinity,nextEnemyAt=Infinity,renderAccumulator=0;
  prologueMusic.volume=.24;

  function profileSnapshot(status='playing'){
    return{version:1,status,level,score,lives,gems,totalGems,dynamite,bigDynamite,player:{x:player.x,y:player.y},playerFacing,grid:grid.map(row=>row.join('')),fallingRocks:[...fallingRocks],fuses:fuses.map(fuse=>({x:fuse.x,y:fuse.y,remaining:Math.max(0,fuse.remaining)}))};
  }
  function saveActiveProfile(status='playing',announce=false){
    if(!currentProfile||customLevel||replayMode||!grid||!player)return false;
    if(autosaveTimer){clearTimeout(autosaveTimer);autosaveTimer=null}
    const existing=profiles[currentProfile];if(!existing)return false;
    profiles[currentProfile]={...existing,name:existing.name,savedAt:Date.now(),state:profileSnapshot(status)};
    const saved=writeProfiles();
    if(announce){saveBtn.textContent=saved?'GESPEICHERT':'FEHLER';setTimeout(()=>saveBtn.textContent='SPEICHERN',1200)}
    return saved;
  }
  function scheduleAutosave(){if(!currentProfile||customLevel||replayMode||autosaveTimer)return;autosaveTimer=setTimeout(()=>{autosaveTimer=null;saveActiveProfile()},900)}
  function formatSavedAt(timestamp){if(!timestamp)return'noch nicht gespeichert';try{return new Intl.DateTimeFormat('de-DE',{dateStyle:'short',timeStyle:'short'}).format(new Date(timestamp))}catch{return''}}
  function renderProfiles(){
    profileList.replaceChildren();const entries=Object.entries(profiles).sort((a,b)=>b[1].savedAt-a[1].savedAt);
    if(!entries.length){const empty=document.createElement('div');empty.className='profile-empty';empty.textContent='Noch kein Profil vorhanden. Gib unten deinen Namen ein.';profileList.append(empty);return}
    for(const[key,profile]of entries){const row=document.createElement('div');row.className='profile-row';const choice=document.createElement('button');choice.type='button';choice.className='profile-choice';const strong=document.createElement('strong'),small=document.createElement('small');strong.textContent=profile.name;small.textContent=`Level ${profile.state.level+1} · ${profile.state.score} Punkte · ${formatSavedAt(profile.savedAt)}`;choice.append(strong,small);choice.onclick=()=>loadProfile(key);const resume=document.createElement('button');resume.type='button';resume.className='profile-continue';resume.textContent='WEITER';resume.onclick=()=>loadProfile(key);const remove=document.createElement('button');remove.type='button';remove.className='profile-delete';remove.textContent='×';remove.title=`Profil ${profile.name} löschen`;remove.onclick=()=>{if(confirm(`Profil „${profile.name}“ wirklich löschen?`)){delete profiles[key];delete pushedProfiles[key];writeProfiles();renderProfiles();pushProfiles(key)}};row.append(choice,resume,remove);profileList.append(row)}
  }
  function showProfileGate(){
    if(currentProfile&&profileSessionActive)saveActiveProfile();running=false;stopMusic();stopEnemies();stopPhysics();stopMoveRepeat();clearFuses();editorPanel.hidden=true;gamePanel.hidden=false;levelGate.hidden=true;profileGate.hidden=false;currentProfile=null;profileSessionActive=false;replayMode=false;profileBtn.textContent='PROFIL: —';profileStatus.textContent='';profileName.value='';renderProfiles();setTimeout(()=>profileName.focus(),0);pullProfiles().then(changed=>{if(changed&&!profileGate.hidden)renderProfiles()});
  }
  function markLevelCompleted(index){const profile=profiles[currentProfile];if(!profile)return;const completed=new Set(profile.progress.completed);completed.add(index);profile.progress={unlocked:Math.min(levels.length-1,Math.max(profile.progress.unlocked,index+1)),completed:[...completed].sort((a,b)=>a-b)};writeProfiles()}
  function showLevelGate(saveCurrent=false){
    const profile=profiles[currentProfile];if(!profile)return showProfileGate();if(saveCurrent&&profileSessionActive)saveActiveProfile();running=false;stopMusic();stopEnemies();stopPhysics();stopMoveRepeat();if(replayMode)clearFuses();replayMode=false;profileSessionActive=false;profileGate.hidden=true;levelGate.hidden=false;profileBtn.textContent=`PROFIL: ${profile.name}`;levelSelectTitle.textContent=profile.name;levelSelectStatus.textContent=`${profile.progress.completed.length} von ${levels.length} Leveln erledigt · freigeschaltet bis Level ${profile.progress.unlocked+1}`;profileLevelGrid.replaceChildren();
    for(let index=0;index<levels.length;index++){const button=document.createElement('button'),completed=profile.progress.completed.includes(index),unlocked=index<=profile.progress.unlocked;button.type='button';button.className=`level-tile${unlocked?' unlocked':''}${completed?' completed':''}${index===profile.state.level?' current':''}`;button.textContent=String(index+1);button.title=unlocked?`${levelDefs[index].name}${completed?' – erledigt':''}`:'Noch gesperrt';button.disabled=!unlocked;button.onclick=()=>startSelectedLevel(index);profileLevelGrid.append(button)}
  }
  function restoreProfileState(state){
    clearFuses();stopMusic();stopEnemies();stopPhysics();stopMoveRepeat();customLevel=false;replayMode=false;profileSessionActive=true;level=state.level;score=state.score;lives=state.lives;gems=state.gems;totalGems=state.totalGems;dynamite=state.dynamite;bigDynamite=Number.isFinite(state.bigDynamite)?state.bigDynamite:0;player={x:state.player.x,y:state.player.y};playerFacing=state.playerFacing===-1?-1:1;playerStride=0;grid=state.grid.map(row=>row.split(''));fallingRocks=new Set((state.fallingRocks||[]).filter(value=>typeof value==='string'));fuses=(state.fuses||[]).filter(fuse=>fuse&&Number.isFinite(fuse.x)&&Number.isFinite(fuse.y)&&Number.isFinite(fuse.remaining)).map(fuse=>({x:fuse.x,y:fuse.y,remaining:fuse.remaining,recordedSound:false,stopSound:null}));explosions=[];staticDirty=true;running=false;updateHud();draw();eyebrowEl.textContent=`PROFIL ${profiles[currentProfile].name.toUpperCase()}`;titleEl.textContent='Weiterspielen';textEl.textContent=`Weiter bei Level ${level+1}: „${levelDefs[level].name}“.`;startBtn.innerHTML='WEITERSPIELEN <span>→</span>';startBtn.onclick=begin;overlay.classList.remove('hidden');
  }
  function loadProfile(key){
    const profile=profiles[key];if(!profile||!validSavedState(profile.state)){profileStatus.textContent='Dieser Spielstand ist beschädigt.';return}currentProfile=key;profileGate.hidden=true;profileBtn.textContent=`PROFIL: ${profile.name}`;showLevelGate();
  }
  function continueProfile(){
    const profile=profiles[currentProfile];if(!profile)return showProfileGate();levelGate.hidden=true;profileSessionActive=true;const state=profile.state;
    if(state.status==='won'&&state.level<levels.length-1){level=state.level+1;score=state.score;lives=state.lives;resetLevel();return}
    if(state.status==='dead'){level=state.level;score=state.score;lives=state.lives;resetLevel();return}
    if(state.status==='gameover'||state.status==='completed'){resetLevel(true);return}
    restoreProfileState(state);
  }
  function startSelectedLevel(index){
    const profile=profiles[currentProfile];if(!profile||index<0||index>profile.progress.unlocked)return;levelGate.hidden=true;replayMode=profile.progress.completed.includes(index);profileSessionActive=true;level=index;score=replayMode?0:profile.state.score;lives=replayMode?3:Math.max(1,profile.state.lives);resetLevel();
  }
  function createOrLoadProfile(value){
    const name=cleanProfileName(value),key=profileKey(name);if(!validProfileName(name)){profileStatus.textContent='Bitte einen Namen mit höchstens 24 Zeichen eingeben.';return}if(profiles[key]){loadProfile(key);return}profiles[key]={name,savedAt:0,state:null,progress:{unlocked:0,completed:[]}};currentProfile=key;profileGate.hidden=true;profileBtn.textContent=`PROFIL: ${name}`;profileSessionActive=true;resetLevel(true);saveActiveProfile('playing');
  }

  function resetLevel(full=false){
    if(full){level=0;score=0;lives=3}customLevel=false;
    clearFuses();stopPhysics();stopMoveRepeat();grid=getLevelRows(level).map(r=>typeof r==='string'?r.split(''):r.slice());gems=0;dynamite=0;bigDynamite=0;playerFacing=1;playerStride=0;fallingRocks=new Set();staticDirty=true;
    totalGems=grid.flat().filter(c=>c==='G').length;
    grid.forEach((row,y)=>row.forEach((c,x)=>{if(c==='P'){player={x,y};grid[y][x]=' '}}));
    running=false;stopMusic();stopEnemies();updateHud();draw();showIntro();saveActiveProfile('playing');
  }
  function updateHud(){levelEl.textContent=customLevel?'EDITOR':`${level+1} / ${levels.length}`;levelBadge.textContent=customLevel?'EDITOR-LEVEL':`LEVEL ${String(level+1).padStart(2,'0')} · ${levelDefs[level].name.toUpperCase()}`;goalEl.textContent=`${gems} / ${totalGems}`;dynamiteEl.textContent=`× ${dynamite}`+(bigDynamite?` + ${bigDynamite} GROSS`:'');scoreEl.textContent=String(score).padStart(4,'0');livesEl.textContent='♥ '.repeat(lives).trim()||'—'}
  function showIntro(){eyebrowEl.textContent=`LEVEL ${String(level+1).padStart(3,'0')} / ${levels.length} · ${themes[level%themes.length].name}`;titleEl.textContent=levelDefs[level].name;textEl.textContent='Sammle alle Smaragde. Dynamit sprengt rissige braune Wände, Felsen und rote Wächter.';startBtn.innerHTML='SPIEL STARTEN <span>→</span>';startBtn.onclick=begin;overlay.classList.remove('hidden')}
  function begin(){ensureAudio();running=true;overlay.classList.add('hidden');canvas.focus();tone(260,.05);startMusic();startEnemies();startPhysics()}
  function end(kind){running=false;stopMusic();stopEnemies();stopPhysics();stopMoveRepeat();clearFuses();overlay.classList.remove('hidden');
    if(customLevel){if(kind==='win'){tone(620,.12);eyebrowEl.textContent='EDITOR-TEST';titleEl.textContent='Level geschafft';textEl.textContent=`Deine Höhle ist lösbar – ${score} Punkte.`;startBtn.innerHTML='ZUM EDITOR <span>→</span>';startBtn.onclick=openEditor}else{tone(90,.25);lives--;updateHud();eyebrowEl.textContent='EDITOR-TEST';titleEl.textContent='Noch ein Versuch';textEl.textContent='Passe das Level an oder teste es erneut.';startBtn.innerHTML='ERNEUT TESTEN <span>↻</span>';startBtn.onclick=playEditorLevel}return}
    if(replayMode){
      if(kind==='win'){markLevelCompleted(level);tone(620,.12);eyebrowEl.textContent='LEVEL WIEDERHOLT';titleEl.textContent='Erneut geschafft';textEl.textContent=`Level ${level+1} bleibt erledigt. Dein Kampagnen-Spielstand wurde nicht verändert.`;startBtn.innerHTML='ZUR LEVELAUSWAHL <span>→</span>';startBtn.onclick=()=>showLevelGate()}
      else{tone(90,.25);lives--;updateHud();eyebrowEl.textContent='WIEDERHOLUNG';titleEl.textContent=lives?'Noch ein Versuch':'Zurück zur Auswahl';textEl.textContent='Dein Kampagnenfortschritt bleibt sicher.';startBtn.innerHTML=lives?'ERNEUT <span>↻</span>':'LEVELAUSWAHL <span>→</span>';startBtn.onclick=()=>{if(lives)resetLevel();else showLevelGate()};if(!lives&&window.EmeraldHighscore)setTimeout(()=>{if(!running&&lives===0)window.EmeraldHighscore.open({label:'KLICK ODER ENTER: ZUR LEVELAUSWAHL',onContinue:()=>{if(!running&&lives===0)showLevelGate()}})},900)}
      return;
    }
    if(kind==='win'){
      markLevelCompleted(level);tone(620,.12); setTimeout(()=>tone(820,.16),130);
      if(level<levels.length-1){saveActiveProfile('won');eyebrowEl.textContent='HÖHLE GESCHAFFT';titleEl.textContent='Weiter hinab';textEl.textContent=`Sehr gut. Als Nächstes wartet „${levelDefs[level+1].name}“ mit einer neuen Musikvariation.`;startBtn.innerHTML='NÄCHSTES LEVEL <span>→</span>';startBtn.onclick=()=>{level++;resetLevel();begin()}}
      else{saveActiveProfile('completed');if(profiles[currentProfile])window.EmeraldHighscore?.recordGame({name:profiles[currentProfile].name,score,level:level+1,result:'completed'});eyebrowEl.textContent='EXPEDITION BEENDET';titleEl.textContent='Schatzmeister';textEl.textContent=`Alle Höhlen geschafft – mit ${score} Punkten.`;startBtn.innerHTML='NOCH EINMAL <span>↻</span>';startBtn.onclick=()=>{resetLevel(true);begin()};window.EmeraldCredits?.show({name:profiles[currentProfile]?.name||'',score})}
    }else{
      tone(90,.25);lives--;updateHud();saveActiveProfile(lives?'dead':'gameover');if(!lives&&profiles[currentProfile])window.EmeraldHighscore?.recordGame({name:profiles[currentProfile].name,score,level:level+1,result:'gameover'});eyebrowEl.textContent='VERSCHÜTTET';titleEl.textContent=lives?'Noch ein Versuch':'Expedition vorbei';textEl.textContent=lives?'Der Fels war schneller. Achte darauf, was über dir liegt.':'Die Höhle behält ihre Schätze – vorerst.';startBtn.innerHTML=lives?'WEITER <span>→</span>':'NEU STARTEN <span>↻</span>';startBtn.onclick=()=>{if(!lives)resetLevel(true);else resetLevel();begin()}
      if(!lives&&window.EmeraldHighscore)setTimeout(()=>{if(!running&&lives===0)window.EmeraldHighscore.open({onContinue:()=>{if(!running&&lives===0){resetLevel(true);begin()}}})},900)
    }
  }
  function ensureAudio(){
    if(!audio){
      audio=new (window.AudioContext||window.webkitAudioContext)();master=audio.createGain();const compressor=audio.createDynamicsCompressor(),feedback=audio.createGain(),wet=audio.createGain();
      master.gain.value=.82;compressor.threshold.value=-20;compressor.knee.value=18;compressor.ratio.value=4;compressor.attack.value=.004;compressor.release.value=.24;
      echo=audio.createDelay(.6);echo.delayTime.value=.25;feedback.gain.value=.2;wet.gain.value=.16;
      master.connect(compressor).connect(audio.destination);echo.connect(feedback).connect(echo);echo.connect(wet).connect(master);
      noiseBuffer=audio.createBuffer(1,audio.sampleRate,audio.sampleRate);const noiseData=noiseBuffer.getChannelData(0);for(let i=0;i<noiseData.length;i++)noiseData[i]=Math.random()*2-1;
    }
    if(audio.state==='suspended')audio.resume();
    loadDynamiteSound();
  }
  function loadRecordedMusic(){
    if(musicBuffer)return Promise.resolve(musicBuffer);
    if(musicBufferPromise)return musicBufferPromise;
    musicBufferPromise=fetch('audio/crystal-cave-reduced.mp3?v=20261101-7')
      .then(response=>{if(!response.ok)throw new Error(`Musik konnte nicht geladen werden (${response.status})`);return response.arrayBuffer()})
      .then(data=>new Promise((resolve,reject)=>audio.decodeAudioData(data,resolve,reject)))
      .then(buffer=>(musicBuffer=buffer))
      .catch(()=>null);
    return musicBufferPromise;
  }
  function loadDynamiteSound(){
    if(dynamiteBuffer)return Promise.resolve(dynamiteBuffer);
    if(dynamiteBufferPromise)return dynamiteBufferPromise;
    dynamiteBufferPromise=fetch(window.EMERALD_DYNAMITE_WAV||'audio/dynamite-explosion.wav?v=20261114-2')
      .then(response=>{if(!response.ok)throw new Error(`Explosionsklang konnte nicht geladen werden (${response.status})`);return response.arrayBuffer()})
      .then(data=>new Promise((resolve,reject)=>audio.decodeAudioData(data,resolve,reject)))
      .then(buffer=>(dynamiteBuffer=buffer))
      .catch(()=>null);
    return dynamiteBufferPromise;
  }
  function stopFuseSound(fuse){if(fuse?.stopSound){fuse.stopSound();fuse.stopSound=null}}
  function startSyntheticFuse(){
    if(!sound||!audio)return null;const now=audio.currentTime,hiss=audio.createBufferSource(),filter=audio.createBiquadFilter(),hissGain=audio.createGain(),osc=audio.createOscillator(),oscGain=audio.createGain();
    hiss.buffer=noiseBuffer;filter.type='highpass';filter.frequency.value=3300;hissGain.gain.setValueAtTime(.006,now);hissGain.gain.linearRampToValueAtTime(.025,now+.86);hiss.connect(filter).connect(hissGain).connect(master);hiss.start(now,0,.88);
    osc.type='square';osc.frequency.setValueAtTime(420,now);osc.frequency.exponentialRampToValueAtTime(980,now+.86);oscGain.gain.setValueAtTime(.004,now);oscGain.gain.linearRampToValueAtTime(.015,now+.86);osc.connect(oscGain).connect(master);osc.start(now);osc.stop(now+.88);
    return()=>{for(const node of[hiss,osc])try{node.stop()}catch{};for(const node of[hiss,filter,hissGain,osc,oscGain])try{node.disconnect()}catch{}};
  }
  function startDynamiteSound(fuse){
    if(!sound||!audio)return false;
    const stopSynthetic=startSyntheticFuse();if(!dynamiteBuffer){fuse.stopSound=stopSynthetic;return false}
    const source=audio.createBufferSource(),gain=audio.createGain();source.buffer=dynamiteBuffer;gain.gain.value=.72;source.connect(gain).connect(master);
    fuse.stopSound=()=>{if(stopSynthetic)stopSynthetic();source.onended=null;try{source.stop()}catch{};source.disconnect();gain.disconnect()};source.onended=()=>{source.disconnect();gain.disconnect();fuse.stopSound=null};source.start(audio.currentTime+Math.max(0,(fuse.remaining-DYNAMITE_FUSE_MS)/1000));return true;
  }
  function preparePrologue(){
    const fontsReady=document.fonts?.ready||Promise.resolve();
    Promise.resolve(fontsReady).finally(()=>{studioGo.disabled=false;studioGo.textContent='GO!'});
  }
  function tone(freq,d=.07){if(!sound||!audio)return;const o=audio.createOscillator(),g=audio.createGain();o.type='square';o.frequency.value=freq;g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(g).connect(master);o.start();o.stop(audio.currentTime+d)}
  function hz(note){return 440*Math.pow(2,(note-69)/12)}
  function voice(note,when,duration,type,volume){
    if(!sound||!audio||note==null)return;const o=audio.createOscillator(),g=audio.createGain(),f=audio.createBiquadFilter(),wide=type==='square'||type==='sawtooth',o2=wide?audio.createOscillator():null;
    o.type=type;o.frequency.setValueAtTime(hz(note),when);f.type='lowpass';f.frequency.value=type==='square'?2400:900;
    g.gain.setValueAtTime(.0001,when);g.gain.exponentialRampToValueAtTime(volume,when+.012);g.gain.exponentialRampToValueAtTime(.0001,when+duration);
    o.connect(f);if(o2){o2.type=type;o2.frequency.setValueAtTime(hz(note),when);o2.detune.value=-8;o2.connect(f);o2.start(when);o2.stop(when+duration+.02)}
    f.connect(g);g.connect(master);g.connect(echo);o.start(when);o.stop(when+duration+.02);
  }
  function kick(when){
    const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(145,when);o.frequency.exponentialRampToValueAtTime(46,when+.13);
    g.gain.setValueAtTime(.085,when);g.gain.exponentialRampToValueAtTime(.0001,when+.18);o.connect(g).connect(master);o.start(when);o.stop(when+.19);
  }
  function noiseHit(when,duration,frequency,volume){
    const src=audio.createBufferSource(),filter=audio.createBiquadFilter(),g=audio.createGain();src.buffer=noiseBuffer;filter.type='highpass';filter.frequency.value=frequency;
    g.gain.setValueAtTime(volume,when);g.gain.exponentialRampToValueAtTime(.0001,when+duration);src.connect(filter).connect(g).connect(master);src.start(when,Math.random()*(1-duration),duration);
  }
  function chord(notes,when){notes.forEach((note,i)=>{voice(note,when+i*.002,.19,'square',.0042);voice(note-12,when+i*.002,.26,'triangle',.0032)})}
  function gemSound(){const now=audio.currentTime;[76,80,83,88].forEach((note,i)=>{voice(note,now+i*.045,.24,'sine',.025-i*.003);voice(note+12,now+i*.045,.12,'square',.004)});noiseHit(now+.12,.06,7200,.007)}
  function scheduleMusic(){
    if(!running||!sound||!audio)return;
    if(musicEngine&&musicEngine.active){musicEngine.tick();return}const theme=themes[level%themes.length],stepTime=60/theme.bpm/4;
    while(musicNext<audio.currentTime+.22){
      const s=musicStep%32,chordIndex=Math.floor(s/8),root=theme.roots[chordIndex],shape=theme.modes[chordIndex]==='m'?[0,3,7,10]:[0,4,7,11],chordNotes=shape.map(interval=>root+24+interval);
      if(s%4===0)kick(musicNext);
      if(s%2===1)noiseHit(musicNext,.035,6200,.008);
      if(s%4===2)noiseHit(musicNext,.085,5000,.012);
      if(s%8===4)noiseHit(musicNext,.11,1100,.018);
      if(s%8===0)chordNotes.forEach((note,i)=>voice(note-12,musicNext+i*.004,.92,'sine',.0035));
      if(s%4===0||s%8===6){voice(root+(s%8===6?7:0),musicNext,stepTime*.88,'sawtooth',.016);voice(root-12,musicNext,stepTime*1.7,'sine',.017)}
      if(s%8===2||s%8===6)chord(chordNotes,musicNext);
      if(s%2===0)voice(theme.lead[s%theme.lead.length],musicNext,stepTime*1.45,'square',.01);
      musicNext+=stepTime;musicStep++;
    }
  }
  function startSynthMusic(){if(!sound||!audio||musicTimer)return;musicStep=0;musicNext=audio.currentTime+.05;musicTimer=true;scheduleMusic()}
  function startMusic(){
    if(!sound||!audio||musicSource||musicTimer)return;
    if(window.EmeraldMusic){try{if(!musicEngine)musicEngine=window.EmeraldMusic.create(audio,master);musicEngine.start(level,audio.currentTime+.05);musicTimer=true;return}catch(error){console.error('Emerald Caverns: neue Musik nicht verfügbar, nutze Aufnahme.',error);musicEngine=null}}
    const request=++musicRequest;
    loadRecordedMusic().then(buffer=>{
      if(request!==musicRequest||!running||!sound)return;
      if(!buffer){startSynthMusic();return}
      const profile=musicProfiles[level%musicProfiles.length];
      musicSource=audio.createBufferSource();musicFilter=audio.createBiquadFilter();musicGain=audio.createGain();
      musicSource.buffer=buffer;musicSource.loop=true;musicSource.playbackRate.value=profile.rate;
      musicFilter.type='lowpass';musicFilter.frequency.value=profile.filter;musicFilter.Q.value=.7;musicGain.gain.value=profile.gain;
      musicSource.connect(musicFilter).connect(musicGain).connect(master);musicSource.start(0,Math.min(profile.offset,Math.max(0,buffer.duration-1)));
    });
  }
  function stopMusic(){
    musicRequest++;
    if(musicEngine)musicEngine.stop();
    if(musicSource){try{musicSource.stop()}catch{}musicSource.disconnect();musicSource=null}
    if(musicFilter){musicFilter.disconnect();musicFilter=null}
    if(musicGain){musicGain.disconnect();musicGain=null}
    musicTimer=false;
  }
  function scheduleIntroMusic(){
    if(!introActive||!sound||!audio||audio.state!=='running')return;const stepTime=60/126/4,roots=[38,41,34,36],arp=[0,7,12,15,19,24,19,15];
    while(introMusicNext<audio.currentTime+.38){const s=introMusicStep%64,root=roots[Math.floor(s/16)],shape=[0,3,7,10];if(s%4===0)kick(introMusicNext);if(s%2===1)noiseHit(introMusicNext,.035,7000,.006);if(s%8===4)noiseHit(introMusicNext,.09,1300,.012);if(s%16===0)shape.forEach((n,i)=>voice(root+24+n,introMusicNext+i*.01,1.8,'sine',.005));if(s%4===2){voice(root,introMusicNext,stepTime*1.8,'sawtooth',.013);voice(root-12,introMusicNext,stepTime*1.9,'sine',.014)}voice(root+24+arp[s%8],introMusicNext,stepTime*1.45,'square',.008);introMusicNext+=stepTime;introMusicStep++}
  }
  function startSynthIntroMusic(){if(introMusicTimer||audio.state!=='running')return;introMusicStep=0;introMusicNext=audio.currentTime+.05;scheduleIntroMusic();introMusicTimer=setInterval(scheduleIntroMusic,160)}
  function startIntroMusic(){
    if(!introActive||!prologueMusic.paused||introMusicTimer||!sound)return;const request=++introMusicRequest;
    const started=()=>{if(request!==introMusicRequest||!introActive||!introPlaying){prologueMusic.pause();return}introSoundBtn.textContent='TON LÄUFT';introSoundBtn.disabled=true};
    try{prologueMusic.currentTime=0}catch{}
    const failed=()=>{if(request!==introMusicRequest||!introActive||!introPlaying)return;introSoundBtn.textContent='TON LÄUFT';introSoundBtn.disabled=true;startSynthIntroMusic()};
    const playAttempt=prologueMusic.play();ensureAudio();if(playAttempt&&typeof playAttempt.then==='function')playAttempt.then(started).catch(failed);else started();
  }
  function stopIntroMusic(){introMusicRequest++;prologueMusic.pause();try{prologueMusic.currentTime=0}catch{}if(introMusicTimer){clearInterval(introMusicTimer);introMusicTimer=null}}
  function move(dx,dy){
    if(!running)return;const nx=player.x+dx,ny=player.y+dy,c=grid[ny]?.[nx];if(!c||['#','C','B','Y'].includes(c)||isEnemy(c))return tone(90,.035);staticDirty=true;
    if(c==='R'){
      if(dy!==0||fallingRocks.has(`${nx},${ny}`))return tone(90,.035);const bx=nx+dx;if(grid[ny][bx]!==' '||playerAt(bx,ny))return tone(90,.035);grid[ny][bx]='R';grid[ny][nx]=' ';fallingRocks.delete(`${nx},${ny}`);
    }
    if(c==='G'){gems++;score+=100;grid[ny][nx]=' ';gemSound();if(gems===totalGems)exitOpened();burst(nx,ny,18,['#7dffbd','#30ed90','#eafff3'],{speed:160,life:560,gravity:110,glow:true,size:3.2});floatText(nx,ny,'+100','#7dffbd')}
    if(c==='X'){bigDynamite++;score+=100;grid[ny][nx]=' ';tone(380,.08);setTimeout(()=>tone(570,.09),70);burst(nx,ny,16,['#ffd27a','#7ad8ff','#fff1c4','#ff7a3d'],{speed:150,life:520,gravity:140,glow:true,size:3});floatText(nx,ny,'+100','#8fdcff')}
    if(c==='D'){dynamite++;score+=50;grid[ny][nx]=' ';tone(460,.08);burst(nx,ny,10,['#ffd27a','#ff7a3d','#fff1c4'],{speed:120,life:420,gravity:160,glow:true,size:2.6});floatText(nx,ny,'+50','#ffd27a')}
    if(c==='E'){if(gems<totalGems)return tone(110,.05);player={x:nx,y:ny};draw();return end('win')}
    if(c==='.'){grid[ny][nx]=' ';burst(nx,ny,5,['#2f5a44','#1b3126','#3d6b52'],{speed:70,life:320,gravity:220,size:3,square:true,dir:-Math.PI/2-dx*.9,spread:1.6})}
    player={x:nx,y:ny};if(dx)playerFacing=dx;playerStride++;score+=1;tone(180,.025);updateHud();draw();scheduleAutosave();
  }
  function playerAt(x,y){return player.x===x&&player.y===y}
  function openForRock(x,y){return grid[y]?.[x]===' '&&!playerAt(x,y)}
  // Kristallklang für fallende/aufschlagende Smaragde
  function crystalSound(strong){
    if(!sound||!audio)return;const now=audio.currentTime,base=[1568,1760,1976,2093,2349][Math.floor(Math.random()*5)]*(strong?1:1.5),vol=strong?.022:.007;
    for(const[ratio,gain,len]of[[1,1,.55],[2.76,.45,.32],[5.4,.22,.18],[1.5,.25,.4]]){const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(base*ratio,now);
      g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(vol*gain,now+.004);g.gain.exponentialRampToValueAtTime(.0001,now+len*(strong?1:.5));o.connect(g);g.connect(master);if(strong)g.connect(echo);o.start(now);o.stop(now+len+.05)}
    if(strong)noiseHit(now,.03,8500,.006);
  }
  function updatePhysics(){
    if(!running)return;const moves=[],nextFalling=new Set();
    for(let y=ROWS-2;y>0;y--)for(let x=1;x<COLS-1;x++){const c=grid[y][x];if(c!=='R'&&c!=='G')continue;
      const key=`${x},${y}`,falling=fallingRocks.has(key);
      if(playerAt(x,y+1)){if(falling)moves.push([x,y,x,y+1,c==='G'?'collect':'player',c]);continue}
      if(openForRock(x,y+1))moves.push([x,y,x,y+1,'fall',c]);
      else if(c==='R'&&isEnemy(grid[y+1][x])&&falling)moves.push([x,y,x,y+1,'crush',c]);
      else if(['R','G'].includes(grid[y+1][x])){if(openForRock(x-1,y)&&openForRock(x-1,y+1))moves.push([x,y,x-1,y+1,'fall',c]);else if(openForRock(x+1,y)&&openForRock(x+1,y+1))moves.push([x,y,x+1,y+1,'fall',c])}
    }
    let changed=false,playerCrushed=false,gemStarted=false;
    for(const [x,y,nx,ny,kind,c] of moves){const crush=kind==='crush',hitsPlayer=kind==='player'||kind==='collect';
      if(grid[y][x]!==c||(crush?!isEnemy(grid[ny][nx]):hitsPlayer?!playerAt(nx,ny):!openForRock(nx,ny)))continue;
      if(kind==='collect'){grid[y][x]=' ';gems++;score+=100;gemSound();if(gems===totalGems)exitOpened();burst(nx,ny,18,['#7dffbd','#30ed90','#eafff3'],{speed:160,life:560,gravity:110,glow:true,size:3.2});floatText(nx,ny,'+100','#7dffbd');changed=true;continue}
      if(c==='G'&&!fallingRocks.has(`${x},${y}`))gemStarted=true;
      grid[y][x]=' ';grid[ny][nx]=c;nextFalling.add(`${nx},${ny}`);changed=true;
      if(crush){score+=250;tone(58,.14);if(sound&&audio)noiseHit(audio.currentTime,.1,900,.035);shake(170,3);burst(nx,ny,14,['#ff6a6a','#c27bff','#ffe0e0'],{speed:190,life:560,gravity:240,glow:true,size:3});floatText(nx,ny,'+250','#ffb0b0')}
      if(kind==='player'){playerCrushed=true;shake(320,6);burst(nx,ny,18,['#ff5a4a','#ffd0c0','#37ff9f'],{speed:200,life:650,gravity:260,glow:true,size:3.2})}}
    if(gemStarted)crystalSound(false);
    let gemLanded=false;
    for(const key of fallingRocks)if(!nextFalling.has(key)){const[rx,ry]=key.split(',').map(Number),c=grid[ry]?.[rx];
      if(c==='R'){burst(rx,ry,8,['rgba(150,160,150,.65)','rgba(110,120,110,.55)'],{speed:75,life:450,gravity:30,size:5,grow:8,oy:16,dir:-Math.PI/2,spread:Math.PI*.95});shake(80,1.2)}
      else if(c==='G'){gemLanded=true;burst(rx,ry,10,['#eafff3','#7dffbd','#ffffff'],{speed:110,life:420,gravity:160,glow:true,size:2.4,oy:12,dir:-Math.PI/2,spread:Math.PI*.9})}}
    if(gemLanded)crystalSound(true);
    fallingRocks=nextFalling;if(changed){staticDirty=true;updateHud();draw();scheduleAutosave()}if(playerCrushed){running=false;stopMoveRepeat();setTimeout(()=>end('dead'),40)}
    if(changed&&gems>=totalGems)updateHud();
  }
  function startPhysics(){physicsActive=true;nextPhysicsAt=performance.now()+PHYSICS_STEP}
  function stopPhysics(){physicsActive=false;nextPhysicsAt=Infinity}
  function updateEnemies(){
    const enemies=[];let changed=false;grid.forEach((r,y)=>r.forEach((c,x)=>{if(isEnemy(c))enemies.push({x,y,c})}));
    for(const e of enemies){
      if(!isEnemy(grid[e.y]?.[e.x]))continue;
      const vertical=['U','V'].includes(e.c),first=['M','U'].includes(e.c)?1:-1,attempts=[first,-first];
      for(const dir of attempts){const nx=e.x+(vertical?0:dir),ny=e.y+(vertical?dir:0),next=vertical?(dir===1?'U':'V'):(dir===1?'M':'N');if(nx===player.x&&ny===player.y){setTimeout(()=>end('dead'),40);return}if([' ','.'].includes(grid[ny]?.[nx])){if(grid[ny][nx]==='.')staticDirty=true;grid[e.y][e.x]=' ';grid[ny][nx]=next;changed=true;break}if(dir===first){grid[e.y][e.x]=next;changed=true}}
    }
    if(changed)scheduleAutosave();
  }
  function startEnemies(){enemiesActive=true;nextEnemyAt=performance.now()+ENEMY_STEP}
  function stopEnemies(){enemiesActive=false;nextEnemyAt=Infinity}
  function clearFuses(){for(const fuse of fuses)stopFuseSound(fuse);fuses=[];explosions=[];clearEffects()}
  function updateFuses(delta){
    const due=[];for(const fuse of fuses){fuse.remaining-=delta;if(fuse.remaining<=0)due.push(fuse)}
    if(due.length)fuses=fuses.filter(fuse=>fuse.remaining>0);
    for(const fuse of due){if(!running)break;explode(fuse.x,fuse.y,fuse.recordedSound)}
  }
  function plantBigDynamite(){
    if(!running)return;if(bigDynamite<1||grid[player.y][player.x]!==' ')return tone(90,.05);const x=player.x,y=player.y,fuse={x,y,remaining:DYNAMITE_FUSE_MS*1.3,recordedSound:false,stopSound:null};bigDynamite--;grid[y][x]='Y';tone(520,.08);setTimeout(()=>tone(720,.08),80);fuse.recordedSound=startDynamiteSound(fuse);fuses.push(fuse);updateHud();draw();scheduleAutosave();
  }
  function plantDynamite(){
    if(!running)return;if(dynamite<1||grid[player.y][player.x]!==' ')return tone(90,.05);const x=player.x,y=player.y,fuse={x,y,remaining:DYNAMITE_FUSE_MS,recordedSound:false,stopSound:null};dynamite--;grid[y][x]='B';tone(720,.08);fuse.recordedSound=startDynamiteSound(fuse);fuses.push(fuse);updateHud();draw();scheduleAutosave();
  }
  function explode(x,y,recordedExplosion=false){
    const big=grid[y]?.[x]==='Y',r=big?2:1;if(!running||(grid[y]?.[x]!=='B'&&!big))return;staticDirty=true;let playerHit=Math.abs(player.x-x)<=r&&Math.abs(player.y-y)<=r;
    const remainingFuses=[];for(const fuse of fuses){if(Math.abs(fuse.x-x)<=r&&Math.abs(fuse.y-y)<=r){stopFuseSound(fuse)}else remainingFuses.push(fuse)}fuses=remainingFuses;
    const destroyed=[];for(let yy=y-r;yy<=y+r;yy++)for(let xx=x-r;xx<=x+r;xx++){const c=grid[yy]?.[xx];if(isEnemy(c))score+=250;if(['C','R','M','N','U','V','D','B','X','Y','.'].includes(c)){destroyed.push([xx,yy,c]);grid[yy][xx]=' '}}
    shake(big?600:420,big?11:7);burst(x,y,big?55:30,['#fff3b0','#ffb347','#ff6a2b','#ff3b1f'],{speed:big?380:280,life:big?800:650,gravity:220,glow:true,size:3.6,jitter:big?60:26});burst(x,y,12,['rgba(70,72,66,.45)','rgba(105,105,95,.35)'],{speed:55,life:1150,gravity:-45,size:10,grow:14,jitter:40});for(const[xx,yy,c]of destroyed){if(c==='C')burst(xx,yy,8,['#a77b60','#795849','#3a2c25'],{speed:230,life:700,gravity:520,size:4.5,square:true});else if(c==='R')burst(xx,yy,7,['#a9b1a9','#707b73','#343e38'],{speed:210,life:700,gravity:520,size:4.5,square:true});else if(isEnemy(c)){burst(xx,yy,14,['#ff6a6a','#c27bff','#ffe0e0'],{speed:200,life:600,gravity:200,glow:true,size:3});floatText(xx,yy,'+250','#ffb0b0')}else if(c==='.')burst(xx,yy,4,['#2f5a44','#1b3126'],{speed:150,life:500,gravity:420,size:3.5,square:true})}
    explosions.push({x,y,r,until:performance.now()+(big?560:420)});tone(big?40:52,big?.4:.25);if(big&&sound&&audio)noiseHit(audio.currentTime,.4,90,.12);if(sound&&audio&&!recordedExplosion){noiseHit(audio.currentTime,.22,180,.09);noiseHit(audio.currentTime,.12,2400,.045)}updateHud();draw();scheduleAutosave();if(playerHit)setTimeout(()=>end('dead'),40);
  }
  // ---------- Effekte: Partikel, Punkte-Einblendung, Wackeln, Glitzern, Warnung ----------
  const reduceMotion=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,canvasWrap=canvas.parentElement;
  let particles=[],floaters=[],shakeUntil=0,shakePower=0,shakeTimer=null,lastFxTime=0;
  function burst(x,y,count,colors,opt={}){
    if(reduceMotion)count=Math.ceil(count/3);const cx=x*W+20+(opt.ox||0),cy=y*H+20+(opt.oy||0),speed=opt.speed||140,spread=opt.spread??Math.PI*2,dir=opt.dir??-Math.PI/2,jit=opt.jitter??14;
    for(let i=0;i<count;i++){const a=dir+(Math.random()-.5)*spread,v=speed*(.35+Math.random()*.75),life=(opt.life||550)*(.6+Math.random()*.6);
      particles.push({x:cx+(Math.random()-.5)*jit,y:cy+(Math.random()-.5)*jit,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:opt.gravity??380,life,max:life,size:(opt.size||3)*(.6+Math.random()*.8),color:colors[i%colors.length],glow:!!opt.glow,square:!!opt.square,grow:opt.grow||0})}
    if(particles.length>500)particles.splice(0,particles.length-500);
  }
  function floatText(x,y,text,color){floaters.push({x:x*W+20,y:y*H+10,text,color,life:850,max:850})}
  function shake(ms,power){
    if(reduceMotion)return;const now=performance.now();shakePower=now<shakeUntil?Math.max(shakePower,power):power;shakeUntil=Math.max(shakeUntil,now+ms);
    clearTimeout(shakeTimer);shakeTimer=setTimeout(()=>{canvasWrap.style.transform=''},shakeUntil-now+30);
  }
  function clearEffects(){particles=[];floaters=[];shakeUntil=0;clearTimeout(shakeTimer);canvasWrap.style.transform=''}
  function drawEffects(now){
    const dt=Math.min(.1,Math.max(0,(now-(lastFxTime||now))/1000));lastFxTime=now;
    // Smaragde funkeln
    for(let y=1;y<ROWS-1;y++)for(let x=1;x<COLS-1;x++)if(grid[y][x]==='G'){
      const ph=((now/1000)*(.45+((x*7+y*13)%5)*.1)+((x*31+y*17)%100)/100)%1;
      if(ph<.2){const a=Math.sin(ph/.2*Math.PI),cx=x*W+20+((x*5+y*3)%9)-4,cy=y*H+18+((x*3+y*7)%9)-4,r=2+a*6;
        ctx.save();ctx.globalAlpha=a;ctx.strokeStyle='#eafff3';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(cx-r,cy);ctx.lineTo(cx+r,cy);ctx.moveTo(cx,cy-r);ctx.lineTo(cx,cy+r);ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(cx,cy,1.5,0,Math.PI*2);ctx.fill();ctx.restore()}
    }
    // Bewegungsstreifen über fallenden Felsen
    ctx.save();ctx.strokeStyle='rgba(205,215,205,.28)';ctx.lineWidth=2;
    for(const key of fallingRocks){const[x,y]=key.split(',').map(Number);if(grid[y]?.[x]!=='R'&&grid[y]?.[x]!=='G')continue;ctx.beginPath();ctx.moveTo(x*W+13,y*H+2);ctx.lineTo(x*W+13,y*H-12);ctx.moveTo(x*W+27,y*H+2);ctx.lineTo(x*W+27,y*H-8);ctx.stroke()}
    ctx.restore();
    // Warnung: Fels fällt von oben auf den Spieler zu
    if(running&&player){let yy=player.y-1;while(yy>0&&grid[yy][player.x]===' ')yy--;
      if(grid[yy]?.[player.x]==='R'&&fallingRocks.has(`${player.x},${yy}`)){const pulse=.5+.5*Math.sin(now/55),px=player.x*W,top=(yy+1)*H,bot=player.y*H;
        ctx.save();const g=ctx.createLinearGradient(0,top,0,bot+H);g.addColorStop(0,'rgba(255,70,50,0)');g.addColorStop(1,`rgba(255,70,50,${.16+.22*pulse})`);ctx.fillStyle=g;ctx.fillRect(px+4,top,W-8,bot+H-top);
        ctx.strokeStyle=`rgba(255,90,60,${.5+.5*pulse})`;ctx.lineWidth=2;ctx.strokeRect(px+2,bot+2,W-4,H-4);
        ctx.fillStyle=`rgba(255,225,95,${.75+.25*pulse})`;ctx.font='bold 20px "Courier New",monospace';ctx.textAlign='center';ctx.fillText('!',px+20,bot>16?bot-3:bot+18);ctx.restore()}}
    // Partikel
    for(const p of particles){p.life-=dt*1000;p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=1-1.6*dt;p.size+=p.grow*dt}
    particles=particles.filter(p=>p.life>0);
    if(particles.length){ctx.save();for(const p of particles){ctx.globalAlpha=Math.max(0,Math.min(1,p.life/p.max*1.4));ctx.fillStyle=p.color;ctx.shadowBlur=p.glow?8:0;ctx.shadowColor=p.color;
      if(p.square)ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);else{ctx.beginPath();ctx.arc(p.x,p.y,Math.max(.5,p.size/2),0,Math.PI*2);ctx.fill()}}ctx.restore()}
    // Punkte-Einblendung
    for(const f of floaters){f.life-=dt*1000;f.y-=30*dt}floaters=floaters.filter(f=>f.life>0);
    if(floaters.length){ctx.save();ctx.font='bold 14px "Courier New",monospace';ctx.textAlign='center';for(const f of floaters){ctx.globalAlpha=Math.min(1,f.life/f.max*1.8);ctx.fillStyle='rgba(2,10,6,.9)';ctx.fillText(f.text,f.x+1,f.y+1);ctx.fillStyle=f.color;ctx.fillText(f.text,f.x,f.y)}ctx.restore()}
    // Wackeln
    if(now<shakeUntil){const p=shakePower*Math.min(1,(shakeUntil-now)/250);canvasWrap.style.transform=`translate(${((Math.random()*2-1)*p).toFixed(1)}px,${((Math.random()*2-1)*p).toFixed(1)}px)`}
  }
  function drawExplosions(){
    const now=performance.now();explosions=explosions.filter(e=>e.until>now);for(const e of explosions){const rr=e.r||1,life=Math.min(1,(e.until-now)/420),g=ctx.createRadialGradient(e.x*W+20,e.y*H+20,4,e.x*W+20,e.y*H+20,58*rr);g.addColorStop(0,`rgba(255,255,210,${life})`);g.addColorStop(.25,`rgba(255,173,58,${life*.9})`);g.addColorStop(1,'rgba(255,45,20,0)');ctx.fillStyle=g;ctx.fillRect((e.x-rr)*W,(e.y-rr)*H,W*(2*rr+1),H*(2*rr+1))}
  }
  const tileCache=new Map();
  function makeTile(paint){
    const surface=typeof OffscreenCanvas==='function'?new OffscreenCanvas(W*2,H*2):document.createElement('canvas');surface.width=W*2;surface.height=H*2;const c=surface.getContext('2d');c.scale(2,2);paint(c);return surface;
  }
  function paintEmpty(c){c.fillStyle='#06100c';c.fillRect(0,0,W,H);c.strokeStyle='rgba(47,105,77,.09)';c.strokeRect(.5,.5,W-1,H-1)}
  function buildTileCache(){
    const add=(key,paint)=>tileCache.set(key,makeTile(paint));add('empty',paintEmpty);
    for(let v=0;v<2;v++)add(`wall${v}`,c=>{c.fillStyle='#020705';c.fillRect(0,0,W,H);const stone=c.createLinearGradient(0,0,W,H);stone.addColorStop(0,v?'#315443':'#294a3a');stone.addColorStop(.48,'#1b3429');stone.addColorStop(1,'#0b1813');c.fillStyle=stone;c.fillRect(2,2,W-4,H-4);c.fillStyle='#4e7963';c.fillRect(3,3,W-6,3);c.fillRect(3,3,3,H-6);c.fillStyle='#07100c';c.fillRect(3,H-7,W-6,4);c.fillRect(W-7,3,4,H-6);c.strokeStyle='#10251b';c.lineWidth=2;c.beginPath();if(v){c.moveTo(2,20);c.lineTo(16,20);c.lineTo(19,17);c.moveTo(25,2);c.lineTo(25,12)}else{c.moveTo(2,15);c.lineTo(12,15);c.lineTo(16,19);c.lineTo(27,19);c.moveTo(30,19);c.lineTo(30,31)}c.stroke();c.strokeStyle='rgba(112,170,139,.28)';c.lineWidth=1;c.strokeRect(2.5,2.5,W-5,H-5)});
    for(let v=0;v<8;v++)add(`dirt${v}`,c=>{paintEmpty(c);c.fillStyle='#1b3126';c.fillRect(5,5,30,30);c.fillStyle='#274536';for(let i=0;i<5;i++){const n=(v*5+i*13)%27;c.fillRect(6+n,7+(n*3)%25,3,3)}});
    add('cracked',c=>{paintEmpty(c);const wall=c.createLinearGradient(0,0,W,H);wall.addColorStop(0,'#795849');wall.addColorStop(1,'#2f2722');c.fillStyle=wall;c.fillRect(3,3,34,34);c.strokeStyle='#a77b60';c.strokeRect(3.5,3.5,33,33);c.strokeStyle='#211915';c.lineWidth=2;c.beginPath();c.moveTo(7,8);c.lineTo(19,18);c.lineTo(14,28);c.moveTo(19,18);c.lineTo(32,12);c.moveTo(19,18);c.lineTo(30,33);c.stroke()});
    add('gem',c=>{paintEmpty(c);c.save();c.translate(20,20);c.rotate(Math.PI/4);c.shadowColor='#31f496';c.shadowBlur=15;c.fillStyle='#30ed90';c.fillRect(-10,-10,20,20);c.fillStyle='#baffd4';c.fillRect(-7,-7,7,7);c.restore()});
    add('dynamite',c=>{paintEmpty(c);c.save();c.translate(20,21);c.rotate(-.18);c.fillStyle='#b51f32';c.fillRect(-9,-12,7,24);c.fillStyle='#e43a48';c.fillRect(1,-12,7,24);c.fillStyle='#d6b46b';c.fillRect(-11,-14,21,5);c.strokeStyle='#e7c56c';c.lineWidth=2;c.beginPath();c.moveTo(6,-14);c.quadraticCurveTo(13,-20,15,-13);c.stroke();c.restore()});
    const bundle=(c,burn,v)=>{paintEmpty(c);c.save();c.translate(20,21);c.rotate(-.12);
      for(const[dx,col]of[[-10,'#a8172b'],[-3,'#d22d3d'],[4,'#a8172b']]){c.fillStyle=col;c.fillRect(dx,-12,6,25)}
      c.fillStyle='#3a8fd9';c.fillRect(-12,-3,23,5);c.fillStyle='#e7c56c';c.fillRect(-12,-15,23,4);
      const p=burn?.65+.35*Math.sin(v*Math.PI/2):1;c.strokeStyle=burn?`rgba(255,224,112,${p})`:'#e7c56c';c.lineWidth=2;c.beginPath();c.moveTo(1,-15);c.quadraticCurveTo(9,-22,13,-15);c.stroke();
      if(burn){c.fillStyle=`rgba(255,85,40,${p})`;c.shadowColor='#ff4b22';c.shadowBlur=14;c.beginPath();c.arc(13,-15,3.5,0,Math.PI*2);c.fill()}
      c.shadowBlur=0;c.fillStyle='#bfe6ff';c.font='bold 9px monospace';c.textAlign='center';c.fillText('2×',0,14+6);c.restore()};
    add('bigdyn',c=>bundle(c,false,0));for(let v=0;v<4;v++)add(`bigburn${v}`,c=>bundle(c,true,v));
    for(let v=0;v<4;v++)add(`burn${v}`,c=>{paintEmpty(c);const pulse=.65+.35*Math.sin(v*Math.PI/2);c.save();c.translate(20,21);c.fillStyle='#c21d2f';c.fillRect(-8,-12,16,24);c.fillStyle='#e4bd68';c.fillRect(-10,-14,20,5);c.strokeStyle=`rgba(255,224,112,${pulse})`;c.lineWidth=2;c.beginPath();c.moveTo(5,-14);c.quadraticCurveTo(13,-21,15,-13);c.stroke();c.fillStyle=`rgba(255,85,40,${pulse})`;c.shadowColor='#ff4b22';c.shadowBlur=12;c.beginPath();c.arc(15,-13,3,0,Math.PI*2);c.fill();c.restore()});
    for(let v=0;v<2;v++)add(`rock${v}`,c=>{paintEmpty(c);const flip=v?-1:1;c.save();c.translate(20,21);c.scale(flip,1);c.fillStyle='rgba(0,0,0,.5)';c.beginPath();c.ellipse(0,14,15,4,0,0,Math.PI*2);c.fill();const rock=c.createLinearGradient(-12,-14,13,15);rock.addColorStop(0,'#a9b1a9');rock.addColorStop(.42,'#707b73');rock.addColorStop(1,'#343e38');c.fillStyle=rock;c.strokeStyle='#202a25';c.lineWidth=2;c.beginPath();c.moveTo(-15,8);c.lineTo(-13,-5);c.lineTo(-6,-14);c.lineTo(5,-16);c.lineTo(14,-8);c.lineTo(16,4);c.lineTo(10,14);c.lineTo(-5,16);c.closePath();c.fill();c.stroke();c.fillStyle='#c4cbc3';c.beginPath();c.moveTo(-6,-13);c.lineTo(5,-15);c.lineTo(9,-8);c.lineTo(0,-4);c.lineTo(-10,-6);c.closePath();c.fill();c.fillStyle='#59645d';c.beginPath();c.moveTo(-14,-4);c.lineTo(-10,-6);c.lineTo(0,-4);c.lineTo(-3,8);c.lineTo(-13,7);c.closePath();c.fill();c.fillStyle='#424c46';c.beginPath();c.moveTo(0,-4);c.lineTo(9,-8);c.lineTo(15,3);c.lineTo(9,13);c.lineTo(-3,8);c.closePath();c.fill();c.strokeStyle='#28322d';c.lineWidth=1.5;c.beginPath();c.moveTo(1,-4);c.lineTo(-2,2);c.lineTo(3,6);c.lineTo(1,11);c.moveTo(9,-7);c.lineTo(6,-1);c.lineTo(11,3);c.stroke();c.restore()});
    // Smaragd-Ausgang: v=0 gesperrt (matt), v=1 offen (leuchtend)
    const emeraldPath=(c,s=1)=>{const w=11*s,h=14*s,k=5.5*s;c.beginPath();c.moveTo(-w+k,-h);c.lineTo(w-k,-h);c.lineTo(w,-h+k);c.lineTo(w,h-k);c.lineTo(w-k,h);c.lineTo(-w+k,h);c.lineTo(-w,h-k);c.lineTo(-w,-h+k);c.closePath()};
    const paintEmerald=(c,open)=>{c.save();c.translate(20,20);
      const body=c.createLinearGradient(-11,-14,11,14);if(open){body.addColorStop(0,'#b8ffd6');body.addColorStop(.35,'#35f29a');body.addColorStop(.7,'#0fae5e');body.addColorStop(1,'#056637')}else{body.addColorStop(0,'#3d6b55');body.addColorStop(.5,'#1f4535');body.addColorStop(1,'#0e2219')}
      if(open){c.shadowColor='#3dff9a';c.shadowBlur=10}c.fillStyle=body;emeraldPath(c);c.fill();c.shadowBlur=0;
      // Facetten
      const o=[[-5.5,-14],[5.5,-14],[11,-8.5],[11,8.5],[5.5,14],[-5.5,14],[-11,8.5],[-11,-8.5]],i=o.map(([x,y])=>[x*.52,y*.58]);
      c.strokeStyle=open?'rgba(225,255,236,.75)':'rgba(120,170,145,.35)';c.lineWidth=.8;c.beginPath();for(let n=0;n<8;n++){c.moveTo(o[n][0],o[n][1]);c.lineTo(i[n][0],i[n][1])}c.stroke();
      const table=c.createLinearGradient(-6,-8,6,8);table.addColorStop(0,open?'#effff5':'#4f7d66');table.addColorStop(1,open?'#5cf7ae':'#24503c');c.fillStyle=table;emeraldPath(c,.53);c.fill();
      c.strokeStyle=open?'#eafff2':'#6a9580';c.lineWidth=1;emeraldPath(c);c.stroke();
      c.fillStyle=open?'rgba(255,255,255,.9)':'rgba(190,230,210,.25)';c.beginPath();c.moveTo(-4.5,-6.5);c.lineTo(-1,-6.5);c.lineTo(-4.5,-2);c.closePath();c.fill();
      c.restore()};
    for(let v=0;v<2;v++)add(`exit${v}`,c=>{paintEmpty(c);
      // steinerne Fassung
      const st=c.createLinearGradient(0,0,W,H);st.addColorStop(0,'#3a5a4a');st.addColorStop(1,'#13241c');c.fillStyle=st;c.beginPath();c.moveTo(5,37);c.lineTo(5,10);c.quadraticCurveTo(20,0,35,10);c.lineTo(35,37);c.closePath();c.fill();
      c.fillStyle=v?'#062015':'#050c09';c.beginPath();c.moveTo(8,36);c.lineTo(8,11);c.quadraticCurveTo(20,3,32,11);c.lineTo(32,36);c.closePath();c.fill();
      c.fillStyle='#5f8a74';c.fillRect(5,36,30,2);
      paintEmerald(c,!!v)});
    add('exitgem',c=>paintEmerald(c,true));
  }
  function drawStaticLayer(){
    ctx=staticCtx;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#030806';ctx.fillRect(0,0,canvas.width,canvas.height);for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const c=grid[y][x],px=x*W,py=y*H;if(isEnemy(c)||c==='B'||c==='Y')ctx.drawImage(tileCache.get('empty'),px,py,W,H);else drawTile(c,px,py,x,y)}staticDirty=false;
  }
  function drawActorLayer(){
    ctx=actorCtx;ctx.clearRect(0,0,actorCanvas.width,actorCanvas.height);for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const c=grid[y][x];if(isEnemy(c)||c==='B'||c==='Y')drawTile(c,x*W,y*H,x,y);else if(c==='E'&&gems>=totalGems)drawExitGlow(x*W,y*H)}drawPlayer(player.x*W,player.y*H);drawExplosions();drawEffects(performance.now());const g=ctx.createRadialGradient(player.x*W+20,player.y*H+20,10,player.x*W+20,player.y*H+20,150);g.addColorStop(0,'rgba(55,255,160,.08)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,actorCanvas.width,actorCanvas.height);
  }
  // Leuchten des offenen Smaragd-Ausgangs (jedes Bild neu)
  function drawExitGlow(x,y){
    const t=performance.now()/1000,cx=x+20,cy=y+20,p=.78+.22*Math.sin(t*4.2);
    ctx.save();ctx.globalCompositeOperation='lighter';
    const rg=ctx.createRadialGradient(cx,cy,3,cx,cy,52*p+8);rg.addColorStop(0,`rgba(140,255,190,${.6*p})`);rg.addColorStop(.35,`rgba(40,240,140,${.25*p})`);rg.addColorStop(1,'rgba(0,40,20,0)');ctx.fillStyle=rg;ctx.fillRect(cx-64,cy-64,128,128);
    ctx.translate(cx,cy);ctx.rotate(t*.55);
    for(let i=0;i<10;i++){ctx.rotate(Math.PI/5);const len=34+12*Math.sin(t*3.1+i*1.7),gr=ctx.createLinearGradient(0,0,len,0);gr.addColorStop(0,`rgba(180,255,210,${.42*p})`);gr.addColorStop(1,'rgba(40,255,140,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.moveTo(8,-2.6);ctx.lineTo(len,0);ctx.lineTo(8,2.6);ctx.closePath();ctx.fill()}
    ctx.setTransform(1,0,0,1,0,0);
    for(let i=0;i<6;i++){const a=t*1.4+i*1.047,r=13+((t*18+i*7)%16),sx=cx+Math.cos(a)*r,sy=cy+Math.sin(a)*r*.9,s=((i+Math.floor(t*7))%3===0)?2:1;ctx.fillStyle='rgba(225,255,238,.9)';ctx.fillRect(sx-s,sy,2*s+1,1);ctx.fillRect(sx,sy-s,1,2*s+1)}
    ctx.globalCompositeOperation='source-over';ctx.shadowColor='#3dff9a';ctx.shadowBlur=12+10*p;ctx.globalAlpha=.55+.45*p;ctx.drawImage(tileCache.get('exitgem'),x,y,W,H);
    ctx.restore();
  }
  function exitOpened(){
    if(totalGems<=0)return;staticDirty=true;
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(grid[y][x]==='E'){burst(x,y,46,['#7dffbd','#30ed90','#eafff3','#b8ffd6'],{speed:210,life:900,gravity:40,glow:true,size:3.4});floatText(x,y,'AUSGANG OFFEN','#7dffbd')}
    if(sound&&audio){const now=audio.currentTime;[76,79,83,88,91].forEach((n,i)=>voice(n,now+.18+i*.07,.5,'sine',.03-i*.004));setTimeout(()=>crystalSound(true),260)}
  }
  function draw(now=performance.now()){tick=Math.floor(now/70);if(staticDirty)drawStaticLayer();drawActorLayer()}
  function drawTile(c,x,y,gx,gy){
    let cached=null;if(c==='#')cached=`wall${(gx+gy)%2}`;else if(c==='.')cached=`dirt${(gx*7+gy*11)%8}`;else if(c==='C')cached='cracked';else if(c==='G')cached='gem';else if(c==='D')cached='dynamite';else if(c==='B')cached=`burn${tick&3}`;else if(c==='X')cached='bigdyn';else if(c==='Y')cached=`bigburn${tick&3}`;else if(c==='R')cached=`rock${(gx*13+gy*7)%2}`;else if(c==='E')cached=`exit${gems>=totalGems?1:0}`;else if(!isEnemy(c))cached='empty';if(cached){ctx.drawImage(tileCache.get(cached),x,y,W,H);return}
    if(c==='#'){
      ctx.fillStyle='#020705';ctx.fillRect(x,y,W,H);
      const stone=ctx.createLinearGradient(x,y,x+W,y+H);stone.addColorStop(0,(gx+gy)%2?'#315443':'#294a3a');stone.addColorStop(.48,'#1b3429');stone.addColorStop(1,'#0b1813');ctx.fillStyle=stone;ctx.fillRect(x+2,y+2,W-4,H-4);
      ctx.fillStyle='#4e7963';ctx.fillRect(x+3,y+3,W-6,3);ctx.fillRect(x+3,y+3,3,H-6);
      ctx.fillStyle='#07100c';ctx.fillRect(x+3,y+H-7,W-6,4);ctx.fillRect(x+W-7,y+3,4,H-6);
      ctx.strokeStyle='#10251b';ctx.lineWidth=2;ctx.beginPath();
      if((gx+gy)%2){ctx.moveTo(x+2,y+20);ctx.lineTo(x+16,y+20);ctx.lineTo(x+19,y+17);ctx.moveTo(x+25,y+2);ctx.lineTo(x+25,y+12)}
      else{ctx.moveTo(x+2,y+15);ctx.lineTo(x+12,y+15);ctx.lineTo(x+16,y+19);ctx.lineTo(x+27,y+19);ctx.moveTo(x+30,y+19);ctx.lineTo(x+30,y+31)}ctx.stroke();
      ctx.strokeStyle='rgba(112,170,139,.28)';ctx.lineWidth=1;ctx.strokeRect(x+2.5,y+2.5,W-5,H-5);
    }
    else{ctx.fillStyle='#06100c';ctx.fillRect(x,y,W,H);ctx.strokeStyle='rgba(47,105,77,.09)';ctx.strokeRect(x+.5,y+.5,W-1,H-1)}
    if(c==='C'){const wall=ctx.createLinearGradient(x,y,x+W,y+H);wall.addColorStop(0,'#795849');wall.addColorStop(1,'#2f2722');ctx.fillStyle=wall;ctx.fillRect(x+3,y+3,34,34);ctx.strokeStyle='#a77b60';ctx.strokeRect(x+3.5,y+3.5,33,33);ctx.strokeStyle='#211915';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+7,y+8);ctx.lineTo(x+19,y+18);ctx.lineTo(x+14,y+28);ctx.moveTo(x+19,y+18);ctx.lineTo(x+32,y+12);ctx.moveTo(x+19,y+18);ctx.lineTo(x+30,y+33);ctx.stroke()}
    if(c==='.'){ctx.fillStyle='#1b3126';ctx.fillRect(x+5,y+5,30,30);ctx.fillStyle='#274536';for(let i=0;i<5;i++){const n=(gx*7+gy*11+i*13)%27;ctx.fillRect(x+6+n,y+7+(n*3)%25,3,3)}}
    if(c==='G'){ctx.save();ctx.translate(x+20,y+20);ctx.rotate(Math.PI/4);ctx.shadowColor='#31f496';ctx.shadowBlur=15;ctx.fillStyle='#30ed90';ctx.fillRect(-10,-10,20,20);ctx.fillStyle='#baffd4';ctx.fillRect(-7,-7,7,7);ctx.restore()}
    if(c==='D'){ctx.save();ctx.translate(x+20,y+21);ctx.rotate(-.18);ctx.fillStyle='#b51f32';ctx.fillRect(-9,-12,7,24);ctx.fillStyle='#e43a48';ctx.fillRect(1,-12,7,24);ctx.fillStyle='#d6b46b';ctx.fillRect(-11,-14,21,5);ctx.strokeStyle='#e7c56c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(6,-14);ctx.quadraticCurveTo(13,-20,15,-13);ctx.stroke();ctx.restore()}
    if(c==='B'){const pulse=.65+.35*Math.sin(tick*.9);ctx.save();ctx.translate(x+20,y+21);ctx.fillStyle='#c21d2f';ctx.fillRect(-8,-12,16,24);ctx.fillStyle='#e4bd68';ctx.fillRect(-10,-14,20,5);ctx.strokeStyle=`rgba(255,224,112,${pulse})`;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(5,-14);ctx.quadraticCurveTo(13,-21,15,-13);ctx.stroke();ctx.fillStyle=`rgba(255,85,40,${pulse})`;ctx.shadowColor='#ff4b22';ctx.shadowBlur=12;ctx.beginPath();ctx.arc(15,-13,3,0,Math.PI*2);ctx.fill();ctx.restore()}
    if(c==='R'){
      const flip=(gx*13+gy*7)%2?-1:1;ctx.save();ctx.translate(x+20,y+21);ctx.scale(flip,1);
      ctx.fillStyle='rgba(0,0,0,.5)';ctx.beginPath();ctx.ellipse(0,14,15,4,0,0,Math.PI*2);ctx.fill();
      const rock=ctx.createLinearGradient(-12,-14,13,15);rock.addColorStop(0,'#a9b1a9');rock.addColorStop(.42,'#707b73');rock.addColorStop(1,'#343e38');ctx.fillStyle=rock;ctx.strokeStyle='#202a25';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(-15,8);ctx.lineTo(-13,-5);ctx.lineTo(-6,-14);ctx.lineTo(5,-16);ctx.lineTo(14,-8);ctx.lineTo(16,4);ctx.lineTo(10,14);ctx.lineTo(-5,16);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.fillStyle='#c4cbc3';ctx.beginPath();ctx.moveTo(-6,-13);ctx.lineTo(5,-15);ctx.lineTo(9,-8);ctx.lineTo(0,-4);ctx.lineTo(-10,-6);ctx.closePath();ctx.fill();
      ctx.fillStyle='#59645d';ctx.beginPath();ctx.moveTo(-14,-4);ctx.lineTo(-10,-6);ctx.lineTo(0,-4);ctx.lineTo(-3,8);ctx.lineTo(-13,7);ctx.closePath();ctx.fill();
      ctx.fillStyle='#424c46';ctx.beginPath();ctx.moveTo(0,-4);ctx.lineTo(9,-8);ctx.lineTo(15,3);ctx.lineTo(9,13);ctx.lineTo(-3,8);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#28322d';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(1,-4);ctx.lineTo(-2,2);ctx.lineTo(3,6);ctx.lineTo(1,11);ctx.moveTo(9,-7);ctx.lineTo(6,-1);ctx.lineTo(11,3);ctx.stroke();ctx.restore();
    }
    if(c==='E'){const open=gems>=totalGems;ctx.fillStyle=open?'#e8d77e':'#39463f';ctx.fillRect(x+8,y+5,24,31);ctx.fillStyle=open?'#152b20':'#17201c';ctx.fillRect(x+12,y+10,16,26);if(open){ctx.shadowColor='#ffe98e';ctx.shadowBlur=14;ctx.strokeStyle='#ffe98e';ctx.strokeRect(x+7.5,y+4.5,25,32)}}
    if(isEnemy(c)){
      const vertical=['U','V'].includes(c),phase=tick*.34+gx*.71+gy*.43,bob=Math.sin(phase)*1.4,pulse=11+Math.sin(phase*.7)*2,blink=(tick+gx*9+gy*5)%57<4,look=vertical?0:(c==='M'?1:-1),lookY=vertical?(c==='U'?1:-1):0;ctx.save();ctx.translate(x,y+bob);
      ctx.fillStyle='rgba(0,0,0,.42)';ctx.beginPath();ctx.ellipse(20,35,13,3,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#9d3039';ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(12,24);ctx.quadraticCurveTo(5+Math.sin(phase)*2,21,5,29+Math.cos(phase)*2);ctx.moveTo(28,24);ctx.quadraticCurveTo(35-Math.sin(phase)*2,20,35,28-Math.cos(phase)*2);ctx.stroke();
      ctx.shadowColor=vertical?'#b36cff':'#ff4055';ctx.shadowBlur=pulse;const body=ctx.createLinearGradient(10,10,30,35);body.addColorStop(0,vertical?'#cc82ff':'#ff6a68');body.addColorStop(.48,vertical?'#8648d9':'#df3d4c');body.addColorStop(1,vertical?'#3c217b':'#7b1d2e');ctx.fillStyle=body;ctx.beginPath();ctx.moveTo(10,31);ctx.quadraticCurveTo(8,18,13,12);ctx.lineTo(16,7+Math.sin(phase)*1.2);ctx.lineTo(20,12);ctx.lineTo(25,7-Math.sin(phase)*1.2);ctx.lineTo(28,13);ctx.quadraticCurveTo(33,20,30,31);ctx.lineTo(27+Math.sin(phase)*1.2,36);ctx.lineTo(22,32);ctx.lineTo(17,36);ctx.lineTo(13-Math.sin(phase)*1.2,32);ctx.closePath();ctx.fill();
      ctx.shadowBlur=0;ctx.fillStyle='#ffe6ad';if(blink){ctx.fillRect(13,20,6,1);ctx.fillRect(22,20,6,1)}else{ctx.fillRect(13,17,6,7);ctx.fillRect(22,17,6,7);ctx.fillStyle='#38121a';ctx.fillRect(15+look,19+lookY,2,3);ctx.fillRect(24+look,19+lookY,2,3)}
      ctx.strokeStyle='#641925';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(20,27,4.5,.2,Math.PI-.2);ctx.stroke();ctx.restore();
    }
  }
  function drawPlayer(x,y){
    const phase=tick*.3+playerStride*1.5,bob=Math.sin(phase)*.9,swing=Math.sin(phase)*2.5;ctx.save();ctx.translate(x,y+bob);
    ctx.fillStyle='rgba(0,0,0,.38)';ctx.beginPath();ctx.ellipse(20,37,12,2.5,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#1a8f59';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(13,23);ctx.lineTo(9-swing,31);ctx.moveTo(27,23);ctx.lineTo(31+swing,31);ctx.stroke();
    ctx.strokeStyle='#164c35';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(16,31);ctx.lineTo(14+swing,37);ctx.moveTo(24,31);ctx.lineTo(26-swing,37);ctx.stroke();
    const suit=ctx.createLinearGradient(12,19,29,34);suit.addColorStop(0,'#49ef9c');suit.addColorStop(1,'#087448');ctx.fillStyle=suit;ctx.beginPath();ctx.roundRect(11,19,18,15,4);ctx.fill();ctx.fillStyle='#d9ebe1';ctx.beginPath();ctx.arc(20,13,8,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#2ba96c';ctx.beginPath();ctx.arc(20,11,9,Math.PI,0);ctx.lineTo(29,13);ctx.lineTo(11,13);ctx.closePath();ctx.fill();ctx.fillStyle='#79ffc0';ctx.fillRect(17,4,6,4);ctx.shadowColor='#6dffc0';ctx.shadowBlur=8;ctx.fillRect(18,5,4,2);ctx.shadowBlur=0;
    ctx.fillStyle='#07100c';const eye=playerFacing>0?1:-1;ctx.fillRect(17+eye,12,2,2);ctx.fillRect(22+eye,12,2,2);ctx.fillStyle='#e7c978';ctx.fillRect(15,23,10,3);ctx.restore();
  }

  function editorKey(c,x,y){if(c==='#')return`wall${(x+y)%2}`;if(c==='.')return`dirt${(x*7+y*11)%8}`;if(c==='C')return'cracked';if(c==='R')return`rock${(x*13+y*7)%2}`;if(c==='G')return'gem';if(c==='D')return'dynamite';if(c==='X')return'bigdyn';if(c==='E')return'exit0';return'empty'}
  function renderEditor(){
    editorCtx.fillStyle='#030806';editorCtx.fillRect(0,0,editorCanvas.width,editorCanvas.height);for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const c=editorGrid[y]?.[x]||' ';editorCtx.drawImage(tileCache.get(editorKey(c,x,y)),x*W,y*H,W,H);if(c==='P'){editorCtx.fillStyle='#39e991';editorCtx.beginPath();editorCtx.arc(x*W+20,y*H+20,11,0,Math.PI*2);editorCtx.fill();editorCtx.fillStyle='#06120c';editorCtx.fillRect(x*W+15,y*H+17,3,3);editorCtx.fillRect(x*W+23,y*H+17,3,3)}else if(isEnemy(c)){editorCtx.fillStyle=['U','V'].includes(c)?'#9258df':'#e34250';editorCtx.beginPath();editorCtx.arc(x*W+20,y*H+20,12,0,Math.PI*2);editorCtx.fill();editorCtx.fillStyle='#ffe5b2';editorCtx.fillRect(x*W+14,y*H+16,5,6);editorCtx.fillRect(x*W+22,y*H+16,5,6)}editorCtx.strokeStyle='rgba(100,160,130,.13)';editorCtx.strokeRect(x*W+.5,y*H+.5,W-1,H-1)}
  }
  function loadSelectedEditor(){const saved=levelOverrides[editorLevel];editorGrid=(saved||levels[editorLevel]).map(r=>typeof r==='string'?r.split(''):r.slice());editorStatus.textContent=saved?`Gespeicherte Fassung von Level ${editorLevel+1} geladen.`:`Original von Level ${editorLevel+1} geladen.`;renderEditor()}
  function loadCurrentEditor(){editorGrid=levels[editorLevel].map(r=>r.split(''));editorStatus.textContent=`Original von Level ${editorLevel+1} geladen. Zum Übernehmen speichern.`;renderEditor()}
  function clearEditor(){editorGrid=Array.from({length:ROWS},(_,y)=>Array.from({length:COLS},(_,x)=>x===0||y===0||x===COLS-1||y===ROWS-1?'#':' '));editorGrid[1][1]='P';editorGrid[1][COLS-2]='E';editorGrid[2][3]='G';editorStatus.textContent='Leeres Level vorbereitet.';renderEditor()}
  function saveEditor(){if(!playableRows(editorGrid)){editorStatus.textContent='Speichern nicht möglich: 1 Spieler, 1 Ausgang und mindestens 1 Smaragd nötig.';return}levelOverrides[editorLevel]=editorGrid.map(row=>row.join(''));try{localStorage.setItem('emerald-caverns-levels',JSON.stringify(levelOverrides));editorStatus.textContent=`Level ${editorLevel+1} gespeichert und im normalen Spiel aktiviert.`}catch{delete levelOverrides[editorLevel];editorStatus.textContent='Speichern wurde vom Browser blockiert.'}}
  function exportEditor(){const data={format:'emerald-caverns-level',version:1,level:editorLevel+1,name:levelDefs[editorLevel].name,rows:editorGrid.map(row=>row.join(''))},blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`emerald-caverns-level-${String(editorLevel+1).padStart(2,'0')}.json`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),0);editorStatus.textContent=`Level ${editorLevel+1} wurde als JSON exportiert.`}
  function openEditor(){
    const returning=customLevel;running=false;stopMusic();stopEnemies();stopPhysics();stopMoveRepeat();clearFuses();gamePanel.hidden=true;editorPanel.hidden=false;if(!returning){editorLevel=level;editorLevelSelect.value=String(editorLevel);loadSelectedEditor()}else{customLevel=false;editorLevelSelect.value=String(editorLevel);renderEditor()}editorPanel.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function closeEditor(){editorPanel.hidden=true;gamePanel.hidden=false;resetLevel()}
  function paintEditor(e){
    const rect=editorCanvas.getBoundingClientRect(),x=Math.floor((e.clientX-rect.left)*COLS/rect.width),y=Math.floor((e.clientY-rect.top)*ROWS/rect.height);if(x<=0||y<=0||x>=COLS-1||y>=ROWS-1)return;if(['P','E'].includes(editorBrush))for(const row of editorGrid)for(let i=0;i<row.length;i++)if(row[i]===editorBrush)row[i]=' ';editorGrid[y][x]=editorBrush;editorStatus.textContent=`Feld ${x}, ${y} gesetzt.`;renderEditor();
  }
  function playEditorLevel(){
    let start=null,players=0,exits=0,gemCount=0;for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const c=editorGrid[y]?.[x];if(c==='P'){start={x,y};players++}if(c==='E')exits++;if(c==='G')gemCount++}if(players!==1||exits!==1||gemCount<1){editorPanel.hidden=false;gamePanel.hidden=true;editorStatus.textContent='Benötigt: genau 1 Spieler, 1 Ausgang und mindestens 1 Smaragd.';return}
    clearFuses();level=editorLevel;grid=editorGrid.map(row=>row.slice());player=start;grid[player.y][player.x]=' ';customLevel=true;gems=0;totalGems=gemCount;dynamite=0;bigDynamite=0;score=0;lives=3;fallingRocks=new Set();staticDirty=true;editorPanel.hidden=true;gamePanel.hidden=false;overlay.classList.add('hidden');running=true;ensureAudio();startMusic();startEnemies();startPhysics();updateHud();draw();canvas.focus();
  }

  let introActive=true,introPlaying=false;
  function beginStudioIntro(){if(!introActive||introPlaying||studioGo.disabled)return;introPlaying=true;studioIntro.classList.add('playing');startIntroMusic()}
  function finishIntro(){if(!introActive)return;introActive=false;stopIntroMusic();studioIntro.classList.add('finished');studioIntro.setAttribute('aria-hidden','true');showProfileGate();setTimeout(()=>studioIntro.hidden=true,480)}
  function restartToGo(){resetLevel();introActive=true;introPlaying=false;studioIntro.hidden=false;studioIntro.classList.remove('playing','finished');studioIntro.removeAttribute('aria-hidden');introSoundBtn.disabled=false;introSoundBtn.textContent='▶ TON STARTEN'}
  studioIntro.addEventListener('pointerdown',()=>{if(introPlaying)finishIntro()});
  studioGo.addEventListener('pointerdown',e=>e.stopPropagation());studioGo.addEventListener('click',beginStudioIntro);
  introSoundBtn.addEventListener('pointerdown',e=>e.stopPropagation());introSoundBtn.addEventListener('click',e=>{e.stopPropagation();startIntroMusic()});
  function stopMoveRepeat(control){if(control&&control!==heldControl)return;heldControl=null;heldMove=null}
  function startMoveRepeat(control,dx,dy){stopMoveRepeat();heldControl=control;heldMove={dx,dy,nextAt:performance.now()+180};move(dx,dy)}
  function updateMoveRepeat(now){
    if(!heldMove||now<heldMove.nextAt)return;
    let repeats=0;while(heldMove&&now>=heldMove.nextAt&&repeats<2){move(heldMove.dx,heldMove.dy);heldMove.nextAt+=MOVE_REPEAT_STEP;repeats++}
    if(heldMove&&now-heldMove.nextAt>MOVE_REPEAT_STEP)heldMove.nextAt=now+MOVE_REPEAT_STEP;
  }
  const keys={ArrowUp:[0,-1],KeyW:[0,-1],ArrowDown:[0,1],KeyS:[0,1],ArrowLeft:[-1,0],KeyA:[-1,0],ArrowRight:[1,0],KeyD:[1,0]};
  addEventListener('keydown',e=>{if((infoDialog&&infoDialog.open)||window.EmeraldHighscore?.isOpen())return;if(introActive){if(e.key==='Enter'){e.preventDefault();if(!e.repeat)(introPlaying?finishIntro():beginStudioIntro())}return}if(!profileGate.hidden||!levelGate.hidden)return;if(!editorPanel.hidden){if(e.key==='Escape')closeEditor();return}if(e.code==='Space'){e.preventDefault();if(!e.repeat)plantDynamite();return}if(e.code==='KeyX'){e.preventDefault();if(!e.repeat)plantBigDynamite();return}if(e.key==='Enter'&&!overlay.classList.contains('hidden')){e.preventDefault();if(!e.repeat)startBtn.click();return}if(keys[e.code]){e.preventDefault();if(!e.repeat)startMoveRepeat(e.code,...keys[e.code])}});
  addEventListener('keyup',e=>stopMoveRepeat(e.code));addEventListener('blur',()=>stopMoveRepeat());
  document.addEventListener('visibilitychange',()=>{
    stopMoveRepeat();lastFrame=performance.now();renderAccumulator=0;
    if(document.hidden){saveActiveProfile();pushProfiles(null,true);resumePrologueAfterVisibility=introActive&&introPlaying&&!prologueMusic.paused;prologueMusic.pause();if(audio?.state==='running')audio.suspend().catch(()=>{});return}
    if(physicsActive)nextPhysicsAt=performance.now()+PHYSICS_STEP;if(enemiesActive)nextEnemyAt=performance.now()+ENEMY_STEP;
    if(sound&&audio&&(running||introPlaying))audio.resume().catch(()=>{});
    if(resumePrologueAfterVisibility&&introActive&&introPlaying&&sound)prologueMusic.play().catch(()=>{});
    resumePrologueAfterVisibility=false;
  });
  document.querySelectorAll('[data-dir]').forEach(b=>{const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[b.dataset.dir],control=`touch-${b.dataset.dir}`;b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);startMoveRepeat(control,...d)});for(const event of['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>stopMoveRepeat(control))});
  startBtn.onclick=begin;document.querySelector('#restartBtn').onclick=restartToGo;document.querySelector('#dynamiteBtn').onclick=plantDynamite;{const bb=document.querySelector('#bigDynamiteBtn');if(bb)bb.onclick=plantBigDynamite}
  profileForm.addEventListener('submit',event=>{event.preventDefault();createOrLoadProfile(profileName.value)});continueProfileBtn.onclick=continueProfile;profileBackBtn.onclick=showProfileGate;profileBtn.onclick=()=>currentProfile?showLevelGate(true):showProfileGate();saveBtn.onclick=()=>{if(replayMode){saveBtn.textContent='FORTSCHRITT SICHER';setTimeout(()=>saveBtn.textContent='SPEICHERN',1200)}else saveActiveProfile('playing',true)};addEventListener('pagehide',()=>saveActiveProfile());
  document.querySelector('#soundBtn').onclick=e=>{sound=!sound;e.currentTarget.textContent=`TON: ${sound?'AN':'AUS'}`;if(sound){ensureAudio();tone(440,.06);if(running)startMusic()}else{stopMusic();for(const fuse of fuses){stopFuseSound(fuse);fuse.recordedSound=false}}};
  document.querySelector('#editorBtn').onclick=openEditor;document.querySelector('#editorLoadBtn').onclick=loadCurrentEditor;document.querySelector('#editorClearBtn').onclick=clearEditor;document.querySelector('#editorSaveBtn').onclick=saveEditor;document.querySelector('#editorExportBtn').onclick=exportEditor;document.querySelector('#editorTestBtn').onclick=playEditorLevel;document.querySelector('#editorCloseBtn').onclick=closeEditor;
  editorLevelSelect.onchange=()=>{editorLevel=Number(editorLevelSelect.value);loadSelectedEditor()};
  document.querySelectorAll('#editorTools [data-tile]').forEach(button=>button.onclick=()=>{editorBrush=button.dataset.tile;document.querySelectorAll('#editorTools [data-tile]').forEach(b=>b.classList.toggle('selected',b===button));editorStatus.textContent=`Werkzeug „${button.textContent}“ gewählt.`});
  let editorPainting=false;editorCanvas.addEventListener('pointerdown',e=>{e.preventDefault();editorPainting=true;editorCanvas.setPointerCapture(e.pointerId);paintEditor(e)});editorCanvas.addEventListener('pointermove',e=>{if(editorPainting)paintEditor(e)});editorCanvas.addEventListener('pointerup',()=>editorPainting=false);editorCanvas.addEventListener('pointercancel',()=>editorPainting=false);
  preparePrologue();
  buildTileCache();
  resetLevel(true);
  const reportedLoopErrors=new Set();
  function gameStep(name,action){try{action()}catch(error){if(!reportedLoopErrors.has(name)){reportedLoopErrors.add(name);console.error(`Emerald Caverns: ${name} wurde nach einem Fehler fortgesetzt.`,error)}if(name==='Musik')musicTimer=false}}
  function animate(now){
    requestAnimationFrame(animate);
    const elapsed=Math.max(0,now-lastFrame),delta=Math.min(elapsed,MAX_FRAME_DELTA);lastFrame=now;
    if(running&&!document.hidden&&!(infoDialog&&infoDialog.open)&&!window.EmeraldHighscore?.isOpen()){
      gameStep('Dauerlauf',()=>updateMoveRepeat(now));
      gameStep('Dynamitzünder',()=>updateFuses(elapsed));
      if(physicsActive&&now>=nextPhysicsAt){nextPhysicsAt=now+PHYSICS_STEP;gameStep('Fallsteine',updatePhysics)}
      if(running&&enemiesActive&&now>=nextEnemyAt){nextEnemyAt=now+ENEMY_STEP;gameStep('Gegner',updateEnemies)}
      if(musicTimer)gameStep('Musik',scheduleMusic);
      renderAccumulator+=delta;if(renderAccumulator>=RENDER_STEP){gameStep('Grafik',()=>draw(now));renderAccumulator%=RENDER_STEP}
    }
  }
  // Info-Fenster: Versionsstand und letzte Änderungen
  const infoDialog=document.querySelector('#infoDialog'),infoBtn=document.querySelector('#infoBtn');
  if(infoDialog&&infoBtn){
    infoBtn.addEventListener('click',()=>{if(typeof infoDialog.showModal==='function')infoDialog.showModal();else infoDialog.setAttribute('open','')});
    document.querySelector('#infoClose').addEventListener('click',()=>infoDialog.close());
    infoDialog.addEventListener('click',e=>{if(e.target===infoDialog)infoDialog.close()});
    infoDialog.addEventListener('close',()=>{try{canvas.focus()}catch{}});
  }
  requestAnimationFrame(animate);
})();
