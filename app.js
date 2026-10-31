const E={happy:{v:2,pos:1},surprised:{v:1,pos:1},neutral:{v:0},tired:{v:-1},stressed:{v:-1.5},fearful:{v:-1.5},sad:{v:-2},angry:{v:-2}};
const EM=Object.keys(E),$=id=>document.getElementById(id);
const TIPS={stressed:['Try a 1-minute breathing exercise','Step away from the screen for 5 minutes','Stretch your neck and shoulders','Drink some water'],
low:['Talk to a friend or family member','Spend a few minutes outside','Listen to a song you love','Do a favourite hobby'],
tired:['Take a short rest','Drink water and stretch','Take a screen break','Walk around for a few minutes'],
break:['Take a proper 10-minute break','Go for a short walk','Close your eyes and breathe slowly'],
pos:['Nice! Keep doing what you are enjoying','Share the good mood with someone'],neu:['Keep going. A quick stretch never hurts']};
const COL={Positive:'#8fd3b4',Neutral:'#d9d4ee','Stressed / Tense':'#f2b14c','Low Mood':'#a9a3e8','Needs a Break':'#f08b7e'};
let S={hist:[],notes:[],fb:{},save:true},cur=null,timer=null,tipKey=null,tipText='';
try{Object.assign(S,JSON.parse(localStorage.getItem('moodlens')||'{}'))}catch(e){}
S.cfg=Object.assign({pref:'any',fav:'',rem:'20',dur:'7',ghost:true,theme:'auto'},S.cfg);S.hist=S.hist.filter(x=>x.t>Date.now()-(+S.cfg.dur)*864e5);
const persist=()=>{try{localStorage.setItem('moodlens',JSON.stringify(S.save?S:{save:false,cfg:S.cfg}))}catch(e){}};
const toast=m=>{const t=$('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)};
const cap=s=>s[0].toUpperCase()+s.slice(1);

/* tabs */
const TABS=[['today','🏠 Today'],['coach','✨ AI Coach'],['journal','📓 Journal'],['summary','📊 Summary'],['metrics','📈 Metrics'],['ghost','👻 Ghosts']];
TABS.forEach(([k,l],i)=>{const b=document.createElement('button');b.textContent=l;b.id='tab-'+k;if(!i)b.className='on';b.onclick=()=>{TABS.forEach(([x])=>$('p-'+x).classList.toggle('hide',x!==k));[...$('nav').children].forEach(c=>c.classList.toggle('on',c===b));if(k==='summary'){renderSum();renderStreaks()}if(k==='journal')renderJ();if(k==='metrics')renderMetrics();if(k!=='ghost')stopGhost()};$('nav').append(b)});

/* demo + check-in chips */
EM.forEach(m=>{const b=document.createElement('button');b.className='chip';b.textContent=cap(m);b.onclick=()=>reading(m);$('demo').append(b)});
['Great','Good','Okay','Stressed','Low','Tired'].forEach(m=>{const b=document.createElement('button');b.className='chip';b.textContent=m;b.onclick=()=>{
 const map={Great:'happy',Good:'happy',Okay:'neutral',Stressed:'stressed',Low:'sad',Tired:'tired'};
 $('cmp').textContent=cur?(map[m]===cur.e||(E[map[m]].pos&&E[cur.e].pos)?`You said ${m}, and MoodLens saw ${cur.e}. They match.`:`You said ${m}, but MoodLens saw ${cur.e}. Your answer counts more than the camera's guess.`):`Thanks for checking in: ${m}.`;
 S.hist.push({t:Date.now(),e:map[m],src:'check-in'});if(cur&&cur.ai&&Date.now()-cur.t<8000)addEv(map[m],cur.e,'check-in');persist()};$('checkin').append(b)});

/* readings */
function reading(e){cur={e,i:Math.round(30+Math.random()*70),t:Date.now()};S.hist.push({t:cur.t,e,i:cur.i});if(S.hist.length>300)S.hist.shift();persist();render();remind()}
function step(){const p=cur?cur.e:'neutral';reading(Math.random()<.55?p:EM[Math.floor(Math.random()*EM.length)])}

let scanning=false,useAI=false,AI=false,vid=null,acc=[],lastCommit=0,noFace=0,earHist=[],lastBreak=Date.now();
const B64=s=>{const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u.buffer};
const TOPT=()=>new faceapi.TinyFaceDetectorOptions({inputSize:224,scoreThreshold:.45});
async function loadAI(){try{const f=faceapi;try{await f.tf.setBackend('webgl')}catch(e){}await f.tf.ready();
 [[f.nets.tinyFaceDetector,MW.td],[f.nets.faceLandmark68TinyNet,MW.lm],[f.nets.faceExpressionNet,MW.ex]].forEach(([n,w])=>n.loadFromWeightMap(f.tf.io.decodeWeights(B64(w.b),w.m)));
 AI=true;$('aiStat').textContent='Face model ready. It runs on your device and no video is uploaded.'}catch(e){$('aiStat').textContent='Face model could not load. Demo mode only.'}}
$('scanBtn').onclick=async()=>{if(scanning){stopScan();return}scanning=true;$('scanBtn').textContent='Stop scanning';
 const v=await camTo($('lens'));useAI=!!(v&&AI);vid=v||null;lastBreak=Date.now();
 if(useAI){$('lensMsg').classList.add('hide');acc=[];lastCommit=performance.now();loop()}
 else{toast(v?'Face model is still loading. Using demo mode.':'No camera access. Using demo mode.');step();timer=setInterval(step,3000)}};
function stopScan(){scanning=false;clearInterval(timer);timer=null;$('scanBtn').textContent='Start scanning';const o=$('ov');o.getContext('2d').clearRect(0,0,o.width,o.height)}
async function loop(){if(!scanning||!useAI)return;if(!OP.t0)OP.t0=performance.now();try{const t0=performance.now(),r=await faceapi.detectSingleFace(vid,TOPT()).withFaceLandmarks(true).withFaceExpressions(),dt=performance.now()-t0;OP.frames++;if(r)OP.faces++;OP.lat=OP.lat?OP.lat*.9+dt*.1:dt;frame1(r)}catch(e){}setTimeout(loop,120)}
function frame1(r){const o=$('ov'),c=o.getContext('2d'),w=o.clientWidth,hh=o.clientHeight;if(o.width!==w){o.width=w;o.height=hh}c.clearRect(0,0,w,hh);
 if(r){const b=r.detection.box,k=w/vid.videoWidth;c.strokeStyle='#f2b14c';c.lineWidth=2;c.strokeRect(w-(b.x+b.width)*k,b.y*k,b.width*k,b.height*k);
  bars(r.expressions);const p=r.landmarks.positions,d=(i,j)=>Math.hypot(p[i].x-p[j].x,p[i].y-p[j].y),eye=a=>(d(a+1,a+5)+d(a+2,a+4))/(2*d(a,a+3));
  earHist.push((eye(36)+eye(42))/2);if(earHist.length>150)earHist.shift();
  const base=[...earHist].sort((x,y)=>x-y)[Math.floor(earHist.length*.9)],rec=earHist.slice(-8),ra=rec.reduce((x,y)=>x+y,0)/rec.length;
  const tired=earHist.length>40&&ra<base*.78;{const cl=classify(r.expressions,tired,Math.min(100,(1-ra/base)*250));acc.push(cl);notePred(cl,r)}}
 else acc.push(null);
 const now=performance.now();if(now-lastCommit>2500){commit();lastCommit=now}}
function classify(e,tired,tint){const tense=e.angry+e.fearful+e.disgusted;let m,i;
 if(tense>.5){m=e.angry>.7?'angry':e.fearful>.7?'fearful':'stressed';i=tense*100}
 else{m=['happy','surprised','neutral','sad'].sort((a,b)=>e[b]-e[a])[0];i=e[m]*100;if(tired&&(m==='neutral'||m==='sad')){m='tired';i=Math.max(tint,40)}}
 return{m,i}}
function commit(){const f=acc.filter(Boolean);acc=[];if(!f.length){if(++noFace>=2)$('cur').textContent='No face found';return}noFace=0;
 const c={};f.forEach(x=>c[x.m]=(c[x.m]||0)+1);const m=Object.keys(c).sort((a,b)=>c[b]-c[a])[0],iv=f.filter(x=>x.m===m).reduce((s,x)=>s+x.i,0)/c[m];
 cur={e:m,i:Math.round(Math.min(100,Math.max(10,iv))),t:Date.now(),ai:true};S.hist.push({t:cur.t,e:m,i:cur.i});if(S.hist.length>600)S.hist.shift();persist();render();remind()}
function remind(){const n=+S.cfg.rem;if(!n||Date.now()-lastBreak<n*6e4)return;const st=wellbeing()[1];if(['stressed','low','break','tired'].includes(st)){lastBreak=Date.now();toast('Break reminder: '+TIPS[st][0])}}

let stream=null;
async function camTo(box){try{stream=stream||await navigator.mediaDevices.getUserMedia({video:{width:640,height:480,facingMode:'user'}});let v=box.querySelector('video');if(!v){v=document.createElement('video');v.muted=true;v.playsInline=true;box.prepend(v)}v.srcObject=stream;await v.play();box.style.aspectRatio=v.videoWidth+'/'+v.videoHeight;return v}catch(e){return false}}
$('camBtn').onclick=async()=>{if(await camTo($('lens')))$('lensMsg').classList.add('hide');else toast('Camera not available. Demo mode still works.')};

const recent=()=>S.hist.slice(-8).map(h=>h.e);
function wellbeing(){const r=recent();if(r.length<3)return['Neutral','neu'];const f=g=>r.filter(x=>g.includes(x)).length/r.length;
 const neg=f(['stressed','fearful','sad','angry','tired']);
 if(r.length>=6&&neg>=.75)return['Needs a Break','break'];
 if(f(['happy','surprised'])>=.5)return['Positive','pos'];
 if(f(['stressed','angry','fearful'])>=.4)return['Stressed / Tense','stressed'];
 if(f(['sad'])>=.4)return['Low Mood','low'];
 if(f(['tired'])>=.4)return['Neutral','tired'];
 return['Neutral','neu']}
function trend(){const r=recent().slice(-6);if(r.length<3)return'Not enough data yet';const v=r.map(x=>E[x].v),h=Math.floor(v.length/2),a=v.slice(0,h).reduce((x,y)=>x+y,0)/h,b=v.slice(h).reduce((x,y)=>x+y,0)/(v.length-h);
 const sw=v.slice(1).filter((x,i)=>Math.abs(x-v[i])>=2).length;
 if(sw>=3)return'Fluctuating';if(b-a>=.6)return'Improving';if(a-b>=.6)return'Becoming more negative';return'Stable'}
function render(){if(!cur)return;theme();$('cur').textContent=cap(cur.e);$('int').textContent='Intensity: '+(cur.i>70?'High':cur.i>45?'Medium':'Low');$('bar').style.width=cur.i+'%';
 $('trail').innerHTML=S.hist.slice(-6).map(h=>`<span>${cap(h.e)}</span>`).join('');$('trend').textContent=trend();
 const[st,key]=wellbeing(),el=$('state');el.textContent=st;el.style.background=COL[st];
 const lowish=['Low Mood','Needs a Break'].includes(st);$('guide').classList.toggle('hide',!lowish);
 $('guide').textContent='You\'ve been experiencing difficult emotions repeatedly. Consider talking to someone you trust or reaching out to a qualified professional.';
 if(key!==tipKey){tipKey=key;const L=TIPS[key].slice().sort((a,b)=>score(b)-score(a));tipText=L[0];$('tip').textContent=tipText+(S.cfg.fav&&['stressed','low','break'].includes(key)?'. Or try your favourite: '+S.cfg.fav+'.':'');$('fb').classList.toggle('hide',key==='neu'||key==='pos')}}
$('fb').onclick=e=>{const v=e.target.dataset.v;if(v===undefined)return;S.fb[tipText]=(S.fb[tipText]||0)+(v==='1'?1:-1);if(v==='1'){S.cnt=(S.cnt||0)+1;if(/break|rest/i.test(tipText))S.brk=(S.brk||0)+1}persist();toast(v==='1'?'Glad it helped. We\'ll suggest more like it.':'Thanks. We\'ll try something different.');tipKey=null;render()};

/* journal */
$('jsave').onclick=()=>{const t=$('jt').value.trim();if(!t)return;S.notes.unshift({t:Date.now(),text:t,e:cur?cur.e:'not scanned'});persist();$('jt').value='';renderJ()};
function renderJ(){$('jlist').innerHTML=S.notes.length?S.notes.map(n=>`<div class="tip"><b>${cap(n.e)}</b> <span class="mute">${new Date(n.t).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span><br>${n.text.replace(/</g,'&lt;')}</div>`).join(''):'No notes yet.'}

/* summary */
function renderSum(){drawTrend();renderHM();const day=new Date().toDateString(),h=S.hist.filter(x=>new Date(x.t).toDateString()===day);if(!h.length){$('sum').textContent='Scan for a bit to see your summary.';return}
 const c={};h.forEach(x=>c[x.e]=(c[x.e]||0)+1);const top=Object.entries(c).sort((a,b)=>b[1]-a[1])[0][0];
 const runs=[];h.forEach(x=>{if(runs[runs.length-1]!==x.e)runs.push(x.e)});
 const kind=e=>E[e].pos?'p':E[e].v<=-1?'n':'z';let pp=0,tp=0,last='';h.forEach(x=>{const k=kind(x.e);if(k!==last){if(k==='p')pp++;if(k==='n')tp++;last=k}});
 const ai=Math.round(h.filter(x=>x.i).reduce((s,x)=>s+x.i,0)/Math.max(1,h.filter(x=>x.i).length));const posShare=h.filter(x=>E[x.e].pos).length/h.length,negShare=h.filter(x=>E[x.e].v<=-1).length/h.length;
 const label=posShare>=.5?'Mostly positive':negShare>=.5?'A tougher day':'Mixed';
 const best=Object.entries(S.fb).sort((a,b)=>b[1]-a[1])[0];
 $('sum').innerHTML=`<div class="big">${label}</div><p>Most common mood: <b>${cap(top)}</b><br>Average intensity: ${ai}/100<br>Mood changes: ${runs.slice(-6).map(cap).join(' → ')}<br>Positive periods: ${pp}<br>Tense periods: ${tp}</p><div class="note">${best&&best[1]>0?`"${best[0]}" seems to help you. We'll suggest it more often.`:'Try a suggestion and tell us if it helped. We\'ll learn what works for you.'}</div>`}
$('saveHist').checked=S.save!==false;$('saveHist').onchange=e=>{S.save=e.target.checked;persist()};
$('clear').onclick=()=>{S.hist=[];S.notes=[];S.fb={};persist();cur=null;tipKey=null;toast('History cleared')};

/* v2: mood theme, live probabilities, breathing, heatmap */
const MC={happy:['#ffcf5c','#ff8a5c','😊'],surprised:['#7de2ff','#b28cff','😲'],neutral:['#8ea2c9','#6c7aa8','😐'],sad:['#6f8cff','#3b4a9c','😢'],angry:['#ff6b5c','#a8233b','😠'],fearful:['#a58cff','#4d3b8c','😨'],tired:['#7aa7a0','#3d5a6e','😴'],stressed:['#ff9f5c','#b0455c','😣']};
const EXL=['happy','neutral','surprised','sad','angry','fearful','disgusted'];
$('probs').innerHTML=EXL.map(k=>`<div class="pr"><span>${cap(k)}</span><div class="meter"><i id="pb-${k}" style="width:0"></i></div><b id="pv-${k}">0%</b></div>`).join('');
function bars(o){EXL.forEach(k=>{const p=Math.round((o[k]||0)*100);$('pb-'+k).style.width=p+'%';$('pv-'+k).textContent=p+'%'})}
function synth(c){const m={stressed:{angry:.4,fearful:.3},tired:{sad:.4,neutral:.4}}[c.e]||{[c.e]:c.i/100};return m}
function theme(){const[a,b,e]=MC[cur.e],r=document.documentElement.style;r.setProperty('--m1',a);r.setProperty('--m2',b);$('orb').textContent=e;$('orb').style.transform=`scale(${(.85+cur.i/400).toFixed(2)})`;
 const v=recent().map(x=>E[x].v),av=v.reduce((s,x)=>s+x,0)/Math.max(1,v.length),sc=Math.round(Math.max(0,Math.min(100,50+av*25)));$('score').textContent=sc;$('ring').style.setProperty('--p',sc);
 $('tl').innerHTML=S.hist.filter(x=>x.src!=='check-in').slice(-30).map(x=>`<i style="--c:${MC[x.e][0]}" title="${x.e}"></i>`).join('');
 if(!(scanning&&useAI))bars(synth(cur));renderStreaks()}
const hr=new Date().getHours();$('greet').textContent=(hr<12?'Good morning':hr<18?'Good afternoon':'Good evening')+'. How are you feeling?';
let brOn=false;const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function breathe(){brOn=true;$('br').classList.add('on');const c=$('bc'),t=$('bt');
 for(let i=0;i<3&&brOn;i++){t.textContent='Breathe in...';c.style.transitionDuration='4s';c.style.transform='scale(1.6)';await sleep(4000);if(!brOn)break;t.textContent='Hold';await sleep(3000);if(!brOn)break;t.textContent='Breathe out...';c.style.transitionDuration='6s';c.style.transform='scale(1)';await sleep(6000)}
 if(brOn){S.cnt=(S.cnt||0)+1;S.brk=(S.brk||0)+1;persist();renderStreaks();toast('Nice work. That counts as self-care.')}closeBr()}
function closeBr(){brOn=false;$('br').classList.remove('on');$('bc').style.transform='scale(1)'}
$('brBtn').onclick=breathe;$('brX').onclick=closeBr;
function renderHM(){const hrs=Array.from({length:24},()=>[]),all=S.hist.filter(x=>x.src!=='check-in');all.forEach(x=>hrs[new Date(x.t).getHours()].push(E[x.e].v));
 $('hm').innerHTML=hrs.map((a,i)=>{const v=a.reduce((s,x)=>s+x,0)/(a.length||1),c=!a.length?'var(--line)':v>.4?'#ffcf5c':v<-.4?'#6f8cff':'#8ea2c9';return `<i style="background:${c};opacity:${a.length?Math.min(1,.45+a.length/10):1}" title="${i}:00, ${a.length} readings"><s>${i}</s></i>`}).join('');
 const c={};all.forEach(x=>c[x.e]=(c[x.e]||0)+1);const t=all.length||1;
 $('dist').innerHTML=Object.entries(c).sort((a,b)=>b[1]-a[1]).map(([k,n])=>`<div class="pr"><span>${cap(k)}</span><div class="meter"><i style="width:${n/t*100}%;background:${MC[k][0]}"></i></div><b>${Math.round(n/t*100)}%</b></div>`).join('')||'<span class="mute">No readings yet.</span>'}
/* settings, streaks, trend */
const TT={breathing:/breath/i,social:/talk|share/i,movement:/stretch|walk|outside|move/i,rest:/rest|break|eyes|screen/i};
const score=t=>(S.fb[t]||0)*2+(S.cfg.pref!=='any'&&TT[S.cfg.pref].test(t)?3:0);
[['cPref','pref'],['cFav','fav'],['cRem','rem'],['cDur','dur'],['cTheme','theme']].forEach(([id,k])=>{const el=$(id);el.value=S.cfg[k];el.onchange=()=>{S.cfg[k]=el.value;applyCfg();persist();tipKey=null;render()}});
$('cGhost').checked=S.cfg.ghost;$('cGhost').onchange=e=>{S.cfg.ghost=e.target.checked;applyCfg();persist()};
function applyCfg(){const r=document.documentElement;S.cfg.theme==='auto'?r.removeAttribute('data-theme'):r.setAttribute('data-theme',S.cfg.theme);$('tab-ghost').classList.toggle('hide',!S.cfg.ghost);if(!S.cfg.ghost)stopGhost()}
const dk=t=>{const d=new Date(t);return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()};
function runLen(s){let n=0,d=new Date();if(!s.has(dk(d)))d.setDate(d.getDate()-1);while(s.has(dk(d))){n++;d.setDate(d.getDate()-1)}return n}
function renderStreaks(){$('flame').textContent='🔥 '+runLen(new Set(S.hist.map(x=>dk(x.t))))+'-day streak';const ci=runLen(new Set(S.hist.filter(x=>x.src==='check-in').map(x=>dk(x.t)))),wk=S.hist.filter(x=>x.t>Date.now()-7*864e5&&x.src!=='check-in'),days=new Set(wk.map(x=>dk(x.t))),calm=wk.filter(x=>E[x.e].v>=0).length;
 const B=[['3-Day Check-In',ci>=3,ci+'/3 days in a row'],['Self-Care Streak',(S.cnt||0)>=3,(S.cnt||0)+'/3 activities done'],['Positive Week',days.size>=3&&calm/wk.length>=.7,days.size+'/3 days tracked, mostly positive or neutral'],['Break Champion',(S.brk||0)>=3,(S.brk||0)+'/3 breaks taken']];
 $('streaks').innerHTML=B.map(([n,ok,t])=>`<div class="badge ${ok?'on':''}"><b>${ok?'★ ':''}${n}</b><span class="mute">${ok?'Unlocked':t}</span></div>`).join('')}
function drawTrend(){const c=$('tc'),x=c.getContext('2d');c.width=c.clientWidth*2;c.height=240;const a=S.hist.filter(q=>q.src!=='check-in').slice(-40);if(a.length<2)return;const W=c.width,H=c.height;
 x.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--line');x.lineWidth=2;x.beginPath();x.moveTo(0,H/2);x.lineTo(W,H/2);x.stroke();
 x.strokeStyle='#7d70e8';x.lineWidth=4;x.beginPath();a.forEach((q,i)=>{const px=i/(a.length-1)*(W-20)+10,py=H/2-E[q.e].v/2.4*(H/2-14);i?x.lineTo(px,py):x.moveTo(px,py)});x.stroke()}
/* AI coach (Claude via the sample capability) */
let SM=null;try{(window.claude?claude.use('sample'):Promise.resolve(null)).then(s=>{SM=s;if(!s)$('aiNote').textContent='Offline mode: the built-in coach answers (rule-based). Claude answers when it is available.'}).catch(()=>{})}catch(e){}
const SYS='You are MoodLens, a warm, brief well-being companion inside a mood-tracking app. You are not a doctor and never diagnose or name mental-health conditions. Use plain, kind language, no lists unless asked, and keep replies under 110 words. Offer at most one small, concrete suggestion. If the person seems to be struggling repeatedly or mentions feeling hopeless, gently encourage talking to someone they trust or a qualified professional. If they mention harming themselves, kindly tell them to contact local emergency services or a crisis line right now.';
function ctx(){const day=dk(Date.now()),h=S.hist.filter(x=>dk(x.t)===day&&x.src!=='check-in'),c={};h.forEach(x=>c[x.e]=(c[x.e]||0)+1);const liked=Object.entries(S.fb).filter(a=>a[1]>0).map(a=>a[0]).slice(0,3);
 return `Today's readings: ${h.length?JSON.stringify(c):'none yet'}. Current state: ${wellbeing()[0]}. Trend: ${trend()}. Recent moods: ${recent().join(', ')||'none'}. Journal notes: ${S.notes.slice(0,3).map(n=>n.text).join(' | ')||'none'}. Activities that helped: ${liked.join('; ')||'unknown'}. Favourite activity: ${S.cfg.fav||'unknown'}.`}
/* offline rule-based coach: used when Claude is unavailable */
const pick=a=>a[Math.floor(Math.random()*a.length)];
function dayInfo(){const day=dk(Date.now()),h=S.hist.filter(x=>dk(x.t)===day&&x.src!=='check-in'),c={};h.forEach(x=>c[x.e]=(c[x.e]||0)+1);const top=Object.keys(c).sort((a,b)=>c[b]-c[a])[0];
 return{n:h.length,top,st:wellbeing(),tr:trend(),note:S.notes[0],liked:Object.entries(S.fb).sort((a,b)=>b[1]-a[1]).filter(a=>a[1]>0).map(a=>a[0])[0]}}
function tipFor(d){const hr=new Date().getHours();if(hr>=23||hr<5)return 'wind down and get some sleep, since it is late';
 const t=d.liked||TIPS[d.st[1]].slice().sort((a,b)=>score(b)-score(a))[0];return t.charAt(0).toLowerCase()+t.slice(1)}
function localTip(){const d=dayInfo(),k=d.st[1];if(!d.n)return 'I have no readings yet. Start scanning or tap a mood and I will tailor a tip. For now, a glass of water and a slow stretch never hurt.';
 if(k==='pos')return 'You are in a good place, so use it: '+pick(['do the thing you have been putting off','tell someone what is going well','write down in your journal what is helping'])+'. Good moods stick better when you notice them.';
 if(k==='neu')return 'Things look steady. '+pick(['A two-minute stretch keeps it that way.','Check in with yourself in an hour and see how it shifts.','A glass of water is a small win right now.']);
 return 'Right now you seem '+d.st[0].toLowerCase()+'. A good next step: '+tipFor(d)+'.'+(S.cfg.fav?' If you can, add a little '+S.cfg.fav+'.':'')+' Try it for five minutes, then tell me whether it helped.'}
function localReflect(){const d=dayInfo(),k=d.st[1];if(!d.n)return 'I do not have any readings from today yet. Start scanning or do a quick check-in and I will write a reflection based on how your day actually goes.';
 const open={pos:'Today has been mostly bright. ',neu:'Today has been fairly steady. ',stressed:'Today has had a lot of tension in it. ',low:'Today has felt heavy at times. ',break:'Today has been a long stretch of strain. '}[k]||'';
 const tr={Improving:', and it has been lifting lately','Stable':', and it has stayed fairly steady','Becoming more negative':', and it has been sliding recently',Fluctuating:', and it has been moving up and down a lot'}[d.tr]||'';
 const note=d.note?' You wrote "'+d.note.text.slice(0,80)+'", which may be part of the picture.':'';
 const help=d.liked?' What has helped you before: '+d.liked.toLowerCase()+'.':'';
 const next=k==='pos'||k==='neu'?' Keep doing what works, and maybe note it in your journal.':' One gentle step: '+tipFor(d)+'.';
 const care=k==='low'||k==='break'?' If this heaviness keeps coming back, consider talking to someone you trust or a qualified professional.':'';
 return open+'Your most common mood was '+d.top+tr+'.'+note+help+next+care}
function localChat(t){const d=dayInfo(),s=t.toLowerCase(),has=r=>r.test(s),k=d.st[1],heavy=k==='low'||k==='break';
 if(has(/\b(thank|thanks)\b/))return pick(['You are welcome. I am here whenever you want to check in.','Glad it helped. Small steps add up.']);
 if(has(/\b(hi|hello|hey)\b/)&&s.length<20)return d.n?'Hi! From what I can see you seem '+d.st[0].toLowerCase()+' today. How are you feeling about it?':'Hi! How are you feeling right now? One sentence is enough.';
 if(has(/stress|anxious|anxiety|overwhelm|pressure|deadline|exam|panic|worried|nervous/))return pick(['That sounds like a lot to carry. Let us shrink it: pick the one smallest thing you can do next and park the rest for ten minutes. If your body feels tight, Guided breathing on the Today tab takes about a minute.','Feeling under pressure is exhausting. Try breathing out slowly, longer than you breathe in, a few times. Then write down the one task that matters most.'])+(heavy?' You have seemed strained for a while, so it may help to tell someone you trust how it has been.':'');
 if(has(/sad|down|lonely|empty|cry|depress|hopeless|worthless|bad|terrible|awful|not (good|okay|ok|great|well)/))return 'I am sorry it feels this way. You do not have to fix it right now. A small step can help: message someone you trust, or step outside for a few minutes.'+(heavy||has(/hopeless|worthless|depress|empty/)?' If these feelings keep coming back, talking to a qualified professional can really help, and you deserve that support.':'');
 if(has(/tired|sleep|exhaust|sleepy|drained|no energy/))return pick(['Your body is asking for a pause. Even ten minutes of rest, some water and a stretch can help. If it is late, sleep is the best tip I have.','Feeling drained is a signal, not a failure. Step away from the screen for a few minutes and drink some water.']);
 if(has(/angry|mad|furious|frustrat|annoy|irritat/))return 'That frustration makes sense. Give it a minute before reacting: breathe slowly, walk around a bit, then decide what you want to do about it.';
 if(has(/happy|great|good|excited|proud|amazing|better/))return pick(['That is lovely to hear. What do you think helped today? Writing it in your journal makes good days easier to repeat.','Nice! Hold on to that feeling for a moment, and think about who you could share it with.']);
 if(has(/how am i|my mood|summary|how.*(day|doing)/))return localReflect();
 if(has(/tip|suggest|advice|what should i|help me|what can i do/))return localTip();
 return pick(['I hear you. What has taken most of your energy today?','Thanks for telling me. How does it feel in your body right now: tense, heavy, or okay?','That makes sense. What is one small thing that would make the rest of today a little easier?'])}
async function ask(p,el,loc){const note=$('aiNote'),use=()=>{const t=loc();el.textContent=t;note.textContent='Answered by the built-in offline coach (rule-based, no network). Claude answers when it is available.';return t};
 if(!SM)return use();
 try{const r=await SM(p,{onText:({text})=>{el.textContent=text},cache:false,modelTier:'quick'});el.textContent=r.text;note.textContent='Answered by Claude. MoodLens is a well-being companion, not a medical service.';return r.text}catch(e){return use()}}
$('refBtn').onclick=async()=>{const el=$('ref');el.classList.remove('hide');el.textContent='Thinking...';$('refBtn').disabled=true;await ask(SYS+'\nContext: '+ctx()+'\nWrite a short reflection on how the day has gone emotionally, name one pattern, and give one gentle suggestion.',el,localReflect);$('refBtn').disabled=false};
$('aiTip').onclick=async()=>{$('aiTip').disabled=true;$('aiTipOut').textContent='Thinking...';await ask(SYS+'\nContext: '+ctx()+'\nGive one specific two-sentence tip for right now.',$('aiTipOut'),localTip);$('aiTip').disabled=false};
const chat=[],CRISIS=/suicid|kill myself|end my life|self.?harm|hurt myself|want to die/i;
function bub(w,t){const d=document.createElement('div');d.className='bub '+w;d.textContent=t;$('chat').append(d);$('chat').scrollTop=1e9;return d}
async function send(){const t=$('cin').value.trim();if(!t)return;$('cin').value='';bub('me',t);chat.push('You: '+t);
 if(CRISIS.test(t)){const m='I am really glad you told me. You deserve support from a real person right now. Please contact your local emergency number or a crisis line, or reach out to someone you trust and stay with them. I am here too.';bub('ai',m);chat.push('MoodLens: '+m);return}
 const el=bub('ai','...');$('send').disabled=true;const o=await ask(SYS+'\nContext: '+ctx()+'\nConversation so far:\n'+chat.slice(-10).join('\n')+'\nMoodLens:',el,()=>localChat(t));if(o)chat.push('MoodLens: '+o);$('send').disabled=false}
$('send').onclick=send;$('cin').onkeydown=e=>{if(e.key==='Enter')send()};
/* ghost mode: real face box hides ghosts behind the person */
const gc=$('gc'),g=gc.getContext('2d');let ghosts=[],gOn=false,gT0=0,gRaf=0,gSpawn=0,gCam=null,body=null,ac=null;
const PERS=['Playful','Grumpy','Shy','Dramatic'],GE=['Angry','Sad','Happy','Confused','Sleepy','Mischievous'],WARN=['Cold spot detected!','Something is behind you...','Did you hear that?','Boo! (just kidding)','A ghost is judging your posture'];
let drone=null,rv=null;
function A(){ac=ac||new(window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();return ac}
function echo(){const c=A(),dl=c.createDelay(1),fb=c.createGain(),lp=c.createBiquadFilter(),o=c.createGain();dl.delayTime.value=.3;fb.gain.value=.5;lp.type='lowpass';lp.frequency.value=1600;o.gain.value=.7;dl.connect(lp);lp.connect(fb);fb.connect(dl);dl.connect(o);o.connect(c.destination);return dl}
function moan(f0,f1,dur,vol){if(!$('gSnd').checked)return;try{const c=A();rv=rv||echo();const t=c.currentTime,g=c.createGain(),lfo=c.createOscillator(),lg=c.createGain();
 g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+dur*.3);g.gain.exponentialRampToValueAtTime(.0001,t+dur);lfo.frequency.value=5.5;lg.gain.value=f0*.035;lfo.connect(lg);
 [0,9].forEach(det=>{const o=c.createOscillator(),f=c.createBiquadFilter();o.type='sawtooth';o.detune.value=det;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);lg.connect(o.frequency);f.type='bandpass';f.frequency.value=650;f.Q.value=4;o.connect(f);f.connect(g);o.start(t);o.stop(t+dur)});
 lfo.start(t);lfo.stop(t+dur);g.connect(c.destination);g.connect(rv)}catch(e){}}
function whoosh(dur,vol){if(!$('gSnd').checked)return;try{const c=A(),t=c.currentTime,n=c.createBufferSource(),b=c.createBuffer(1,Math.floor(c.sampleRate*dur),c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;n.buffer=b;
 const f=c.createBiquadFilter(),g=c.createGain();f.type='bandpass';f.Q.value=1.6;f.frequency.setValueAtTime(300,t);f.frequency.exponentialRampToValueAtTime(2400,t+dur*.5);f.frequency.exponentialRampToValueAtTime(350,t+dur);
 g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+dur*.4);g.gain.exponentialRampToValueAtTime(.0001,t+dur);n.connect(f);f.connect(g);g.connect(c.destination);n.start(t)}catch(e){}}
function bell(){if(!$('gSnd').checked)return;try{const c=A(),t=c.currentTime;[880,932,1397].forEach(fr=>{const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=fr;g.gain.setValueAtTime(.04,t);g.gain.exponentialRampToValueAtTime(.0001,t+1.4);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+1.4)})}catch(e){}}
function ghostIn(){whoosh(1.3,.1);moan(pick([180,230,300]),pick([110,140]),1.8,.07);if(Math.random()<.35)setTimeout(bell,500)}
function ghostOut(){moan(320,80,1.3,.06);whoosh(.9,.06)}
function droneOn(){if(drone||!$('gSnd').checked)return;try{const c=A(),g=c.createGain(),f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=240;g.gain.setValueAtTime(.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(.05,c.currentTime+2);
 const os=[55,58.3,110.7].map(fr=>{const o=c.createOscillator();o.type='sawtooth';o.frequency.value=fr;o.connect(f);o.start();return o});f.connect(g);g.connect(c.destination);drone={os,g}}catch(e){}}
function droneOff(){if(!drone)return;try{const c=ac,{os,g}=drone;g.gain.cancelScheduledValues(c.currentTime);g.gain.setValueAtTime(Math.max(g.gain.value,.0001),c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.6);os.forEach(o=>o.stop(c.currentTime+.7))}catch(e){}drone=null}
$('gSnd').onchange=()=>{if(!$('gSnd').checked)droneOff();else if(gOn)droneOn()};
function fit(){const r=gc.getBoundingClientRect();gc.width=r.width*devicePixelRatio;gc.height=r.height*devicePixelRatio}
const bm=()=>body||(gCam?{x:gc.width*.3,w:gc.width*.4,y:0,h:gc.height}:null);
const ovA=(o,B)=>{const ix=Math.max(0,Math.min(o.x+o.w,B.x+B.w)-Math.max(o.x,B.x)),iy=Math.max(0,Math.min(o.y+o.h,B.y+B.h)-Math.max(o.y,B.y));return ix*iy/(o.w*o.h)};
function spawn(){if(ghosts.length>=4)return;const W=gc.width,H=gc.height,d=devicePixelRatio,w=W*.12+Math.random()*W*.07,h=w*1.3,B=bm(),R=[];
 if(!B)R.push([0,W-w,46*d,H-h]);else{if(B.x-w*.7>=0)R.push([0,B.x-w*.7,46*d,H-h]);if(B.x+B.w-w*.3<=W-w)R.push([B.x+B.w-w*.3,W-w,46*d,H-h]);if(B.y-h*.7>=46*d)R.push([0,W-w,46*d,B.y-h*.7])}
 if(!R.length)return;const r=R[Math.floor(Math.random()*R.length)],x=r[0]+Math.random()*(r[1]-r[0]),y=r[2]+Math.random()*(r[3]-r[2]);
 ghosts.push({x,y,w,h,age:Math.floor(5+Math.random()*195),emo:GE[Math.floor(Math.random()*GE.length)],pers:PERS[Math.floor(Math.random()*4)],die:performance.now()+3500+Math.random()*3500});
 ghostIn();if(Math.random()<.4)toast(WARN[Math.floor(Math.random()*WARN.length)])}
let miss=0;
async function trackBody(){if(!gOn||!AI||!gCam)return;try{const d=await faceapi.detectSingleFace(gCam,TOPT());if(d){miss=0;const b=d.box,k=gc.width/gCam.videoWidth,fw=b.width*k,fh=b.height*k,fx=gc.width-(b.x+b.width)*k,fy=b.y*k,nb={x:Math.max(0,fx-fw*1.1),w:fw*3.2,y:Math.max(0,fy-fh*.45)};
 body=body?{x:body.x+(nb.x-body.x)*.6,w:body.w+(nb.w-body.w)*.6,y:body.y+(nb.y-body.y)*.6}:nb;body.h=gc.height-body.y}else if(++miss>8)body=null}catch(e){}setTimeout(trackBody,200)}
function frame(now){if(!gOn)return;const W=gc.width,H=gc.height,d=devicePixelRatio;if(gCam)g.clearRect(0,0,W,H);else{g.fillStyle='#1d1b2e';g.fillRect(0,0,W,H)}g.shadowColor='#000';g.shadowBlur=4*d;
 const searching=now-gT0<2500;
 if(searching){g.fillStyle='#cfc9ee';g.font=`${16*d}px DM Sans`;g.textAlign='center';g.fillText('Searching for ghosts'+'.'.repeat(1+Math.floor(now/400)%3),W/2,H/2);g.fillStyle='rgba(242,177,76,.6)';g.fillRect(0,((now-gT0)/2500)*H,W,2*d)}
 else if(now>gSpawn){spawn();gSpawn=now+1200+Math.random()*1500}
 ghosts=ghosts.filter(o=>{if(now>o.die){toast('Ghost disappeared');ghostOut();return false}return true});
 const B=bm();if(B)ghosts.forEach(o=>{if(ovA(o,B)>.35)o.x+=(o.x+o.w/2<B.x+B.w/2?-1:1)*8*d});ghosts=ghosts.filter(o=>o.x>-o.w&&o.x<W);g.save();if(B){g.beginPath();g.rect(0,0,W,H);g.rect(B.x,B.y,B.w,B.h);g.clip('evenodd')}
 ghosts.forEach(o=>{g.shadowBlur=0;g.lineJoin='round';g.strokeStyle='#fff';g.lineWidth=9*d;g.strokeRect(o.x,o.y,o.w,o.h);g.strokeStyle='#000';g.lineWidth=5*d;g.strokeRect(o.x,o.y,o.w,o.h);
 const t1='GHOST DETECTED',t2=`Age: ${o.age} | ${o.emo} | ${o.pers}`;g.font=`800 ${14*d}px DM Sans`;g.textAlign='left';const w=Math.max(g.measureText(t1).width,g.measureText(t2).width)+16*d,y=Math.max(0,o.y-46*d);
 g.fillStyle='#fff';g.fillRect(o.x,y,w,42*d);g.strokeStyle='#000';g.lineWidth=3*d;g.strokeRect(o.x,y,w,42*d);g.fillStyle='#000';g.fillText(t1,o.x+8*d,y+17*d);g.font=`700 ${13*d}px DM Sans`;g.fillText(t2,o.x+8*d,y+35*d)});
 g.restore();$('gCount').textContent='Ghosts: '+ghosts.length;gRaf=requestAnimationFrame(frame)}
function stopGhost(){droneOff();gOn=false;cancelAnimationFrame(gRaf);$('gBtn').textContent='Start ghost mode'}
$('gBtn').onclick=async()=>{if(gOn){stopGhost();ghosts=[];body=null;$('gCount').textContent='Ghosts: 0';return}gCam=await camTo($('glens'));if(!gCam)toast('Camera not available. Using a dark room instead.');await new Promise(r=>setTimeout(r,150));fit();ghosts=[];body=null;gOn=true;droneOn();gT0=performance.now();gSpawn=gT0+2500;$('gBtn').textContent='Stop ghost mode';gRaf=requestAnimationFrame(frame);trackBody()};
addEventListener('resize',()=>{if(gOn)fit()});
/* ===== KPI / Metrics dashboard ===== */
if(!Array.isArray(S.ev))S.ev=[];
const OP={frames:0,faces:0,lat:0,conf:0,t0:0,commits:0},PB=[];
const GM={happy:'Positive',surprised:'Positive',neutral:'Neutral',angry:'Tense',fearful:'Tense',stressed:'Tense',sad:'Low',tired:'Tired'};
const pct=x=>(x*100).toFixed(1)+'%';
function notePred(cl,r){const v=Object.values(r.expressions);OP.conf+=Math.max(...v);PB.push({m:cl.m,t:performance.now()});if(PB.length>12)PB.shift()}
function addEv(truth,pred,src){S.ev.push({t:Date.now(),y:truth,p:pred,src});if(S.ev.length>800)S.ev.shift();persist()}
function metrics(){
 const lvl=$('mLevel').value,sf=$('mSrc').value,f=lvl==='group'?(x=>GM[x]):(x=>x);
 const d=S.ev.filter(x=>sf==='all'||x.src===sf).map(x=>({y:f(x.y),p:f(x.p)})),n=d.length;
 const cls=[...new Set(d.flatMap(x=>[x.y,x.p]))].sort(),M={};cls.forEach(a=>{M[a]={};cls.forEach(b=>M[a][b]=0)});d.forEach(x=>M[x.y][x.p]++);
 const rows=cls.map(c=>{const tp=M[c][c],sup=cls.reduce((s,b)=>s+M[c][b],0),pp=cls.reduce((s,a)=>s+M[a][c],0),pr=pp?tp/pp:0,rc=sup?tp/sup:0,f1=pr+rc?2*pr*rc/(pr+rc):0;return{c,tp,sup,pp,pr,rc,f1}});
 const tr=rows.filter(r=>r.sup>0),avg=k=>tr.length?tr.reduce((s,r)=>s+r[k],0)/tr.length:0;
 const acc=n?rows.reduce((s,r)=>s+r.tp,0)/n:0,wf=n?tr.reduce((s,r)=>s+r.f1*r.sup,0)/n:0;
 const pe=n?rows.reduce((s,r)=>s+r.sup*r.pp,0)/(n*n):0,kap=n&&pe<1?(acc-pe)/(1-pe):0;
 return{d,n,cls,M,rows,acc,mp:avg('pr'),mr:avg('rc'),mf:avg('f1'),wf,kap}}
const tone=v=>v>=.8?'g':v>=.6?'a':'r';
const kpi=(l,v,s,t,bar)=>`<div class="kpi ${t}"><div class="kl">${l}</div><div class="kv">${v}</div>${bar==null?'':`<div class="kb"><i style="width:${Math.max(0,Math.min(1,bar))*100}%"></i></div>`}<div class="ks">${s}</div></div>`;
function renderMetrics(){
 const m=metrics(),has=m.n>0,T=v=>has?tone(v):'n';
 $('kpis').innerHTML=
  kpi('Accuracy',has?pct(m.acc):'-','Correct predictions / all samples',T(m.acc),has?m.acc:0)+
  kpi('Macro F1 score',has?pct(m.mf):'-','Average F1 across moods',T(m.mf),has?m.mf:0)+
  kpi('Precision',has?pct(m.mp):'-','When it says X, how often right',T(m.mp),has?m.mp:0)+
  kpi('Recall',has?pct(m.mr):'-','Of real X, how many it caught',T(m.mr),has?m.mr:0)+
  kpi('Weighted F1',has?pct(m.wf):'-','F1 weighted by class size',T(m.wf),has?m.wf:0)+
  kpi("Cohen's kappa",has?m.kap.toFixed(2):'-','Agreement beyond chance',has?(m.kap>=.6?'g':m.kap>=.4?'a':'r'):'n',has?Math.max(0,m.kap):0)+
  kpi('Test samples',m.n,m.n<30&&m.n?'Low sample size, treat with caution':'Labelled predictions','n',null);
 $('mSub').textContent=has?`Evaluated on ${m.n} labelled sample${m.n>1?'s':''} · ${S.ev.some(x=>x.src==='sample')?'includes simulated sample data':'real data'}`:'No labelled samples yet. Use the Evaluation Lab below or load sample data.';
 // per-class table
 $('mTable').innerHTML='<tr><th>Mood</th><th>Precision</th><th>Recall</th><th>F1</th><th>Support</th></tr>'+(m.rows.map(r=>`<tr><td><b>${cap(r.c)}</b></td><td>${pct(r.pr)}</td><td>${pct(r.rc)}</td><td><b style="color:${r.sup?(r.f1>=.8?'#4cc38a':r.f1>=.6?'var(--amb)':'#f0705f'):'var(--mute)'}">${pct(r.f1)}</b></td><td>${r.sup}</td></tr>`).join('')||'<tr><td colspan="5" class="mute">No data yet</td></tr>');
 // confusion matrix
 const cm=$('cm'),k=m.cls.length;cm.style.gridTemplateColumns=`70px repeat(${k},1fr)`;
 cm.innerHTML=k?'<div class="h"></div>'+m.cls.map(c=>`<div class="h">${cap(c)}</div>`).join('')+m.cls.map(a=>{const mx=Math.max(1,...m.cls.map(b=>m.M[a][b]));return `<div class="h" style="text-align:right;padding-right:6px">${cap(a)}</div>`+m.cls.map(b=>{const v=m.M[a][b],al=v?(.25+.75*v/mx):0;return `<div class="${v?'c':''}" style="${v?`background:${a===b?`rgba(76,195,138,${al})`:`rgba(240,112,95,${al})`}`:''}">${v||''}</div>`}).join('')}).join(''):'<span class="mute">No data yet</span>';
 // accuracy over time
 drawAcc(m);
 // operational KPIs
 const sec=OP.t0?(performance.now()-OP.t0)/1000:0,fps=sec>0&&scanning&&useAI?OP.frames/sec:0,ci=metricsFor('check-in');
 $('opKpis').innerHTML=
  kpi('Face detection',OP.frames?pct(OP.faces/OP.frames):'-','Frames with a face found','n',OP.frames?OP.faces/OP.frames:null)+
  kpi('Avg confidence',OP.faces?pct(OP.conf/OP.faces):'-','Top expression probability','n',OP.faces?OP.conf/OP.faces:null)+
  kpi('Inference',OP.lat?Math.round(OP.lat)+' ms':'-','Time per frame (on device)','n',null)+
  kpi('Throughput',fps?fps.toFixed(1)+' fps':'-',scanning&&useAI?'Live scanning':'Start scanning on Today','n',null)+
  kpi('Self-report match',ci.n?pct(ci.acc):'-',ci.n?`${ci.n} check-ins vs camera`:'Do check-ins while scanning',ci.n?tone(ci.acc):'n',ci.n?ci.acc:null)+
  kpi('Readings stored',S.hist.filter(x=>x.src!=='check-in').length,'In your kept history','n',null);
}
function metricsFor(src){const d=S.ev.filter(x=>x.src===src);return{n:d.length,acc:d.length?d.filter(x=>GM[x.y]===GM[x.p]).length/d.length:0}}
function drawAcc(m){const c=$('mAccC'),x=c.getContext('2d');c.width=c.clientWidth*2||600;c.height=260;const W=c.width,H=c.height;x.clearRect(0,0,W,H);
 const st=getComputedStyle(document.documentElement),line=st.getPropertyValue('--line'),mute=st.getPropertyValue('--mute');x.strokeStyle=line;x.lineWidth=2;x.fillStyle=mute;x.font='20px DM Sans';
 [0,.5,1].forEach(g=>{const y=H-24-g*(H-40);x.beginPath();x.moveTo(44,y);x.lineTo(W-8,y);x.stroke();x.fillText(g*100+'%',2,y+6)});
 const n=m.d.length;$('mAccNote').textContent=n<2?'Add samples to see the running accuracy.':'Running accuracy after each sample.';if(n<2)return;
 let ok=0;const pts=m.d.map((q,i)=>{ok+=q.y===q.p?1:0;return ok/(i+1)});
 x.strokeStyle='#9d92ff';x.lineWidth=4;x.beginPath();pts.forEach((v,i)=>{const px=44+i/(n-1)*(W-56),py=H-24-v*(H-40);i?x.lineTo(px,py):x.moveTo(px,py)});x.stroke()}
// evaluation lab
EM.filter(e=>e!=='stressed').forEach(e=>{const o=document.createElement('option');o.value=e;o.textContent=cap(e);$('labPose').append(o)});
$('labGo').onclick=async()=>{const msg=$('labMsg'),cd=$('labCd');if(!(scanning&&useAI)){msg.textContent='Start scanning with the camera on the Today tab first, then come back here.';return}
 $('labGo').disabled=true;msg.textContent='Hold the pose...';for(let i=3;i>0;i--){cd.textContent=i;await sleep(1000)}cd.textContent='';
 const now=performance.now(),w=PB.filter(x=>now-x.t<1200);
 if(!w.length){msg.textContent='No face found. Face the camera and try again.'}
 else{const c={};w.forEach(x=>c[x.m]=(c[x.m]||0)+1);const p=Object.keys(c).sort((a,b)=>c[b]-c[a])[0],t=$('labPose').value;addEv(t,p,'lab');msg.textContent=`Asked for ${t}, MoodLens saw ${p}. ${p===t?'Correct ✓':'Miss ✗'}`;renderMetrics()}
 $('labGo').disabled=false};
// simulated sample data (clearly labelled), so the dashboard can be previewed without a camera
$('mSample').onclick=()=>{S.ev=S.ev.filter(x=>x.src!=='sample');const conf={happy:{happy:.88,surprised:.06,neutral:.06},neutral:{neutral:.78,sad:.08,tired:.1,happy:.04},surprised:{surprised:.72,happy:.14,fearful:.1,neutral:.04},sad:{sad:.62,neutral:.2,tired:.12,fearful:.06},angry:{angry:.6,stressed:.2,sad:.1,neutral:.1},fearful:{fearful:.55,surprised:.2,stressed:.15,sad:.1},tired:{tired:.66,neutral:.22,sad:.12},stressed:{stressed:.64,angry:.16,fearful:.12,neutral:.08}};
 const sup={happy:36,neutral:36,surprised:20,sad:24,angry:20,fearful:16,tired:24,stressed:24};let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647,out=[];
 Object.entries(sup).forEach(([y,k])=>{for(let i=0;i<k;i++){let r=rnd(),p=y;for(const[q,pr]of Object.entries(conf[y])){if((r-=pr)<=0){p=q;break}}out.push({t:Date.now(),y,p,src:'sample'})}});
 for(let i=out.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[out[i],out[j]]=[out[j],out[i]]}
 S.ev.push(...out);S.ev=S.ev.slice(-800);persist();renderMetrics();toast('Loaded 200 simulated samples')};
$('mClearSample').onclick=()=>{S.ev=S.ev.filter(x=>x.src!=='sample');persist();renderMetrics();toast('Sample data removed')};
$('mClearEv').onclick=()=>{S.ev=[];persist();renderMetrics();toast('Evaluation data cleared')};
['mLevel','mSrc'].forEach(i=>$(i).onchange=renderMetrics);
$('mExport').onclick=()=>{const m=metrics(),rep={generated:new Date().toISOString(),level:$('mLevel').value,source:$('mSrc').value,samples:m.n,accuracy:m.acc,macro_precision:m.mp,macro_recall:m.mr,macro_f1:m.mf,weighted_f1:m.wf,cohen_kappa:m.kap,per_class:m.rows,confusion_matrix:m.M},a=document.createElement('a');
 a.href=URL.createObjectURL(new Blob([JSON.stringify(rep,null,2)],{type:'application/json'}));a.download='moodlens-metrics.json';a.click();URL.revokeObjectURL(a.href)};
setInterval(()=>{if(!$('p-metrics').classList.contains('hide'))renderMetrics()},1500);
renderMetrics();

loadAI();applyCfg();renderStreaks();
