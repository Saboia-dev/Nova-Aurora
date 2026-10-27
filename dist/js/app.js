import { icon, crest, escapeHTML as esc } from './icons.js';
import { levels, calculate, validate, fmt, number, occupied } from './math.js';
import { GameStore } from './store.js';
import { readRoute, routeHash as hashFor, safePhase } from './navigation.js';
import { cityProjections } from './scene-projections.js';

const $=s=>document.querySelector(s),store=new GameStore();
store.logout();
let screen='home',selected=store.completed<5?store.completed:0,phase=0,values=null,tutorialStep=0,tutorialSolved=false,tutorialAnswer='',paintMode='building',painting=false,paintValue=true,missionStart=0,modalReturn=null,world=null,failed3D=false,worldPending=null,sceneLayoutPending=null,savePending=null,teacherName='',teacherGrade='all',teacherClass='all';
let markerNodes=[],sceneBounds={width:0,height:0,left:0,top:0};
let fallbackAngle=0,fallbackZoom=1,fallbackDrag=null;
const stars=(n=3)=>`<span class="stars" aria-label="${n} de 3 estrelas">${[1,2,3].map(i=>icon('star',i<=n?'filled':'empty')).join('')}</span>`;
const button=(label,action,cls='primary',extra='')=>`<button ${/\btype=/.test(extra)?'':'type="button"'} class="button ${cls}" data-action="${action}" ${extra}>${label}</button>`;
const factList=level=>`<dl class="facts">${level.facts.map(([a,b])=>`<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>`;
const range=(field,label,min,max,step,value,unit)=>`<div class="range-control"><div class="range-label"><label for="range-${field}">${label}</label><output id="output-${field}" for="range-${field}">${fmt(value,step<1?1:0)} ${unit}</output></div><div class="range-track"><button type="button" class="step-button" data-action="step" data-field="${field}" data-delta="-${step}" aria-label="Diminuir ${label.toLowerCase()}">${icon('minus')}</button><input id="range-${field}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-range="${field}" aria-label="${label}"><button type="button" class="step-button" data-action="step" data-field="${field}" data-delta="${step}" aria-label="Aumentar ${label.toLowerCase()}">${icon('plus')}</button></div><div class="range-limits"><span>${min} ${unit}</span><span>${max} ${unit}</span></div></div>`;
const answer=(field,label,unit,placeholder='Sua resposta')=>`<div class="answer-field"><label for="answer-${field}">${label}</label><div class="answer-wrap"><input id="answer-${field}" name="${field}" data-answer="${field}" value="${esc(values?.[field]||'')}" placeholder="${placeholder}" inputmode="decimal" autocomplete="off" required aria-describedby="number-help"><span>${unit}</span></div></div>`;
function toast(message){const e=document.createElement('div');e.className='toast';e.innerHTML=icon('info')+`<span>${esc(message)}</span>`;$('#toasts').append(e);setTimeout(()=>e.remove(),5000);}
function flushTime(){if(missionStart&&screen==='mission'){store.seconds(phase,Math.floor((Date.now()-missionStart)/1000));missionStart=0;}}
function header(){
 const p=store.player;
 $('#header').innerHTML=`<button class="brand" data-action="home" aria-label="Math City, início">${crest()}<span><strong>Math City</strong><span>Operação Cidade Inteligente</span></span></button><nav class="header-nav" aria-label="Navegação principal">${screen==='teacher'?`<button class="nav-link active" data-action="teacher-home">${icon('map')}<span>Painel do professor</span></button>`:screen==='home'||screen==='intro'?`<button class="nav-link" data-action="intro">A missão</button><button class="nav-link" data-action="tutorial">Como jogar</button>`:`<button class="nav-link ${screen==='map'?'active':''}" data-action="map" aria-label="A cidade">${icon('map')}<span>A cidade</span></button><button class="nav-link" data-action="journal" aria-label="Caderno">${icon('book')}<span>Caderno</span></button>`}<span class="header-divider"></span><button class="icon-button" data-action="sound" aria-label="${store.data.settings.sound?'Desativar':'Ativar'} som" title="${store.data.settings.sound?'Desativar':'Ativar'} som">${icon(store.data.settings.sound?'sound':'mute')}</button><button class="icon-button" data-action="settings" aria-label="Preferências" title="Preferências">${icon('gear')}</button>${p&&screen!=='teacher'?`<button class="player-button" data-action="profile"><span class="avatar">${esc(p.name.charAt(0).toUpperCase())}</span><span class="player-name">${esc(p.name)}</span><span class="xp">${store.xp} XP</span></button>`:screen==='teacher'?button(`Prof. ${esc(teacherName)}`,'teacher-home','player-button'):button('Entrar', 'profile', 'header-cta')}${screen==='teacher'?button('Sair','teacher-logout','text-button'):''}</nav>`;
}
function cameraControls(){return`<div class="camera-controls" aria-label="Controles da câmera"><button class="icon-button" data-action="rotate-left" aria-label="Girar câmera para a esquerda" title="Girar para a esquerda">${icon('back')}</button><button class="icon-button" data-action="rotate-right" aria-label="Girar câmera para a direita" title="Girar para a direita">${icon('arrow')}</button><span></span><button class="icon-button" data-action="zoom-in" aria-label="Aproximar câmera" title="Aproximar">${icon('plus')}</button><button class="icon-button" data-action="zoom-out" aria-label="Afastar câmera" title="Afastar">${icon('minus')}</button><button class="icon-button" data-action="reset-camera" aria-label="Centralizar câmera" title="Centralizar">${icon('compass')}</button></div>`;}
function home(){
 const p=store.player,continuing=p&&p.tutorial;
 return`<section class="hero"><div class="hero-copy"><div class="hero-emblem">${icon('compass')}<span>Uma aventura de geometria</span></div><h1>Nova<br>Aurora</h1><p class="hero-subtitle">Cinco desafios.<br>Uma cidade para transformar.</p><p class="hero-description">Explore, construa e use a matemática para devolver vida a uma cidade que precisa de você.</p><div class="hero-actions">${button(`${icon('play')}${continuing?'Continuar aventura':'Iniciar aventura'}`,continuing?'continue':'start')}${button(`${icon('book')}Como jogar`,'tutorial','text-button')}</div>${continuing?`<p class="continue-note">${esc(p.name)}, ${store.completed} de 5 distritos recuperados.</p>`:''}</div><div class="world-caption"><span class="caption-line"></span><span>O amanhã começa com uma boa ideia.</span></div><div class="hero-footer"><div class="hero-topics"><span>${icon('ruler')}Geometria plana</span><span>${icon('cube')}Geometria espacial</span><span>${icon('leaf')}Cidade inteligente</span></div><button class="world-discovery" data-action="intro">Conheça sua missão ${icon('chevron')}</button></div><div class="compass-ornament" aria-hidden="true"><span>N</span>${icon('compass')}</div></section>`;
}
function intro(){return`<section class="story-screen"><div class="story-copy"><span class="chapter-tag">Uma nova história</span><h1>A cidade está<br>esperando por você.</h1><div class="story-rule"></div><p>Math City cresceu. Mas seus reservatórios, sua coleta de resíduos e seus espaços públicos ficaram para trás.</p><p>Você faz parte de uma equipe de jovens urbanistas. Sua missão é transformar cinco bairros com soluções inteligentes, usando a geometria como ferramenta.</p><p class="story-promise">Uma escolha. Um cálculo. Uma cidade melhor.</p><div class="hero-actions">${button(`Aceitar a missão ${icon('arrow')}`,'enlist')}${button('Voltar','home','text-button')}</div></div><aside class="dispatch"><div class="dispatch-crest">${crest()}</div><span class="dispatch-title">Convocação oficial</span><h2>Precisamos de<br>novas ideias.</h2><p>A prefeitura de Math City convida você para a Operação Cidade Inteligente.</p><div class="dispatch-stamp">${icon('leaf')}<span>Planeje hoje.<br>Transforme o amanhã.</span></div><span class="dispatch-signature">Conselho de Math City</span></aside></section>`;}
function tutorial(){
 const parts=[
  {title:'Você é o urbanista.',body:'Cinco bairros precisam de soluções. No mapa, escolha o distrito disponível. Cada missão recupera uma parte da cidade e libera a próxima.',detail:`<div class="tutorial-route">${levels.map((l,i)=>`<span class="tutorial-node ${i===0?'lit':''}">${icon(i===0?l.icon:'lock')}</span>${i<4?'<i></i>':''}`).join('')}</div><div class="lesson-row">${icon('map')}<p>Explore o mapa e leia a missão de cada bairro.</p></div><div class="lesson-row">${icon('cube')}<p>Construa uma solução com os controles do jogo.</p></div><div class="lesson-row">${icon('bolt')}<p>Calcule, simule e veja a cidade se transformar.</p></div>`},
  {title:'Aprenda fazendo.',body:'Uma pequena praça mede 6 m por 4 m. Qual é a área disponível para plantar?',detail:`<div class="practice-diagram"><svg viewBox="0 0 300 155" role="img" aria-label="Retângulo de 6 metros por 4 metros"><defs><pattern id="practice-grid" width="32" height="28" patternUnits="userSpaceOnUse"><path d="M32 0H0v28" fill="none" stroke="#adc88f" stroke-width=".6"/></pattern></defs><rect x="46" y="17" width="192" height="112" rx="3" fill="#50734e"/><rect x="46" y="17" width="192" height="112" fill="url(#practice-grid)"/><path d="M46 139h192M46 135v8m192-8v8M253 17v112m-4-112h8m-8 112h8" stroke="#dec68e"/><text x="142" y="154" text-anchor="middle">6 m</text><text x="273" y="77" text-anchor="middle">4 m</text></svg></div><form data-form="practice" class="practice-form"><label for="practice-answer">Área da praça</label><div class="practice-input"><input id="practice-answer" value="${esc(tutorialAnswer)}" inputmode="decimal" placeholder="Sua resposta" autocomplete="off" required aria-describedby="practice-feedback"><span>m²</span>${button('Conferir','practice-submit','secondary','type="submit"')}</div><p id="practice-feedback" role="status" class="${tutorialSolved?'correct':''}">${tutorialSolved?'Muito bem! 6 × 4 = 24 m². Pode continuar.':'Dica: multiplique o comprimento pela largura.'}</p></form>`},
  {title:'Construir é experimentar.',body:'Ajuste seu projeto, escreva os resultados e toque em “Simular solução”. O jogo verifica a construção e explica seus cálculos.',detail:`<div class="lesson-row">${icon('help')}<p><strong>Peça uma dica quando precisar.</strong> Há três pistas por missão, da fórmula ao raciocínio.</p></div><div class="lesson-row">${icon('star')}<p><strong>Ganhe estrelas e experiência.</strong> Você pode tentar de novo sem perder vidas.</p></div><div class="lesson-row">${icon('book')}<p><strong>Seu caderno registra a jornada.</strong> Tentativas, cálculos e progresso ficam salvos neste navegador.</p></div><div class="tutorial-notice">Use vírgula para decimais, como <strong>7,5</strong>. Na missão da água, considere <strong>π = 3,14</strong>.</div>`}
 ];const p=parts[tutorialStep];
 return`<section class="tutorial-layout"><div class="tutorial-stage">${cameraControls()}<div class="stage-caption">${icon('move')}Arraste a cena para explorar</div></div><div class="tutorial-panel"><div class="panel-heading"><span class="chapter-tag">Treinamento do urbanista</span>${button(icon('close'),'home','icon-button','aria-label="Sair do tutorial"')}</div><div class="tutorial-steps" aria-label="Etapas do tutorial">${parts.map((_,i)=>`<span class="${i<=tutorialStep?'active':''}"></span>`).join('')}</div><h1>${p.title}</h1><p class="tutorial-body">${p.body}</p>${p.detail}<div class="tutorial-navigation">${tutorialStep?button(`${icon('back')}Voltar`,'tutorial-prev','text-button'):button('Pular tutorial','tutorial-skip','text-button')}${button(tutorialStep===2?`Explorar a cidade ${icon('arrow')}`:`Continuar ${icon('arrow')}`,tutorialStep===2?'tutorial-finish':'tutorial-next','primary')}</div></div></section>`;
}
function phaseRow(l,i){const m=store.player?.missions[i],available=store.unlocked(i);return`<button class="district-row ${selected===i?'selected':''} ${m?.complete?'completed':''} ${!available?'locked':''}" data-action="select-phase" data-id="${i}" aria-pressed="${selected===i}" aria-disabled="${!available}"><span class="district-symbol">${icon(m?.complete?'check':!available?'lock':l.icon)}</span><span class="district-text"><strong>${l.name}</strong><span>${m?.complete?'Recuperado':available?'Pronto para sua missão':'Conclua o distrito anterior'}</span></span>${m?.complete?stars(m.stars):`<span class="district-number">${i+1}</span>`}</button>`;}
function map(){
 const l=levels[selected],m=store.player.missions[selected],n=store.completed;
 return`<section class="map-layout"><aside class="map-panel"><div class="map-greeting"><span class="chapter-tag">Bem-vindo, ${esc(store.player.name.split(' ')[0])}</span><h1>O futuro está no mapa.</h1><p>Recupere cada bairro. Transforme Math City.</p></div><div class="city-progress"><div><span>Cidade recuperada</span><strong>${n*20}%</strong></div><div class="progress-track"><i style="width:${n*20}%"></i></div><span>${n} de 5 distritos concluídos</span></div><div class="district-list" aria-label="Cinco fases do jogo">${levels.map(phaseRow).join('')}</div><div class="selected-mission" style="--district:${l.color}"><span class="selected-topic">${icon(l.icon)}${l.topic}</span><h2>${l.subtitle}</h2><p>${l.objective}</p>${button(`${m.complete?'Revisitar distrito':'Entrar no distrito'} ${icon('arrow')}`,'open-phase','primary',`data-id="${selected}" ${!store.unlocked(selected)?'disabled':''}`)}</div>${n===5?button(`${icon('trophy')}Ver minha conquista`,'final','secondary'):''}</aside><div class="map-space"><div class="map-world-title"><span class="live-dot"></span>Math City<span>Mapa de expedição</span></div><div class="map-bottom">${cameraControls()}<div class="map-legend"><span><i class="legend-dot recovered"></i>Recuperado</span><span><i class="legend-dot"></i>Nova missão</span><span>${icon('lock')}Em breve</span></div></div></div></section>`;
}
function markers(){
 $('#markers').innerHTML=screen==='map'?levels.map((l,i)=>`<button class="map-marker ${store.player.missions[i].complete?'complete':''} ${!store.unlocked(i)?'locked':''} ${i===selected?'selected':''}" data-action="select-phase" data-id="${i}" aria-label="${l.name}${store.player.missions[i].complete?', recuperado':!store.unlocked(i)?', bloqueado':', disponível'}"><span class="marker-icon">${icon(store.player.missions[i].complete?'check':!store.unlocked(i)?'lock':l.icon)}</span><span class="marker-name">${l.name}</span><i class="marker-stem"></i></button>`).join(''):'';
 if(screen==='map'&&failed3D)fallbackMarkers();
}
function projectMarkers(points){
 if(screen!=='map')return;
 markerNodes.forEach((e,i)=>{
  const p=points[i];if(!p)return;
  const visible=p.visible&&p.x>24&&p.x<sceneBounds.width-24&&p.y>68&&p.y<sceneBounds.height-88;
  e.style.visibility=visible?'visible':'hidden';
  const x=Math.round(p.x*2)/2,y=Math.round(p.y*2)/2;
  if(e.dataset.position!==`${x},${y}`){e.style.transform=`translate3d(${x}px,${y}px,0) translate(-50%,-100%)`;e.dataset.position=`${x},${y}`;}
 });
}
function fallbackMarkers(){
 const pts=cityProjections[fallbackAngle<0?'left':fallbackAngle>0?'right':'center'];
 const width=sceneBounds.width,height=sceneBounds.height,scale=Math.min(width/1440,height/1080)*fallbackZoom;
 projectMarkers(pts.map(([x,y])=>({x:width/2+(x-.5)*1440*scale,y:height/2+(y-.5)*1080*scale,visible:true})));
}
function layoutScene(){
 const stage=$('.map-space,.mission-stage,.tutorial-stage');
 const rect=stage?.getBoundingClientRect();
 sceneBounds=rect?{width:rect.width,height:rect.height,left:rect.left+scrollX,top:rect.top+scrollY}:{width:innerWidth,height:innerHeight,left:0,top:0};
 for(const id of ['world','markers']){const el=$('#'+id);Object.assign(el.style,{left:`${sceneBounds.left}px`,top:`${sceneBounds.top}px`,width:`${sceneBounds.width}px`,height:`${sceneBounds.height}px`,right:'auto',bottom:'auto'});}
 world?.resize();if(failed3D&&screen==='map')fallbackMarkers();
}
function scheduleLayout(){cancelAnimationFrame(sceneLayoutPending);sceneLayoutPending=requestAnimationFrame(layoutScene);}
function selectDistrict(id,focus=false){
 id=safePhase(id,selected);if(!store.unlocked(id)){toast(`Conclua ${levels[id-1].name} para desbloquear este distrito.`);return;}
 selected=id;
 if(screen!=='map'){go('map');return;}
 const l=levels[id],m=store.player.missions[id];
 document.querySelectorAll('.district-row,.map-marker').forEach(el=>{const active=Number(el.dataset.id)===id;el.classList.toggle('selected',active);if(el.classList.contains('district-row'))el.setAttribute('aria-pressed',active);});
 $('.selected-mission').style.setProperty('--district',l.color);
 $('.selected-mission').innerHTML=selectedMission(l,m);
 world?.selectDistrict(id);history.replaceState({screen,selected,phase},'',location.hash);
 if(focus)$(`.district-row[data-id="${id}"]`)?.focus({preventScroll:true});
}
function selectedMission(l,m){return`<span class="selected-topic">${icon(l.icon)}${l.topic}</span><h2>${l.subtitle}</h2><p>${l.objective}</p>${button(`${m.complete?'Revisitar distrito':'Entrar no distrito'} ${icon('arrow')}`,'open-phase','primary',`data-id="${selected}"`)}`;}

function buildControls(id){
 if(id===0)return`${range('r','Raio do reservatório',2,6,.5,values.r,'m')}${range('h','Altura do reservatório',2,10,.5,values.h,'m')}<div class="construction-status" id="live-metrics"></div>`;
 if(id===1)return`<p class="control-help">Toque nos espaços para adicionar ou retirar um contêiner.</p><div class="container-yard" id="yard">${yard()}</div><div class="yard-aisle">${icon('move')}Passagem central preservada</div><div class="construction-status" id="live-metrics"></div>`;
 if(id===2)return`<div class="segmented-control" aria-label="Modo de construção">${button(`${icon('building')}Edifício`,'paint-building','segment active','aria-pressed="true"')}${button(`${icon('plant')}Jardim`,'paint-green','segment','aria-pressed="false"')}</div><p class="control-help" id="paint-help">Escolha o canto superior esquerdo do edifício no terreno.</p><div class="plot-wrap"><div id="plot" class="plot-grid" aria-label="Terreno dividido em 60 quadrados de 5 metros"></div></div><div class="plot-legend"><span><i class="plot-key building"></i>Centro</span><span><i class="plot-key green"></i>Jardim</span><span><i class="plot-key road"></i>Acesso</span></div><div class="construction-status" id="live-metrics"></div><div class="plot-shortcuts">${button('Limpar jardim','clear-green','text-button')}${button('Plantar área livre','fill-green','text-button')}</div>`;
 if(id===3)return`<div class="roof-diagram"><svg viewBox="0 0 320 145" role="img" aria-label="Telhado com meia base 6 m e altura 4,5 m"><path d="M28 115 158 19 288 115Z" fill="#376552" stroke="#d9c28c" stroke-width="2"/><path d="M158 19v96M158 101h14v14" fill="none" stroke="#e8dcba" stroke-dasharray="4 4"/><text x="88" y="133">6 m</text><text x="169" y="74">4,5 m</text><text x="66" y="61">g = ?</text><text x="200" y="40">20 m de comprimento</text></svg></div>${range('panels','Quantidade de painéis',0,120,1,values.panels,'')}<div class="construction-status" id="live-metrics"></div>`;
 return`<div class="bridge-diagram" id="bridge-diagram"></div><p class="control-help">Escolha o comprimento de cada diagonal da treliça.</p>${['left','right'].map((side,i)=>`<fieldset class="beam-options"><legend>Diagonal ${i===0?'esquerda':'direita'}</legend><div class="beam-chips">${[8,10,12,14].map(n=>button(`${n} m`,'beam','beam-chip',`data-side="${side}" data-length="${n}" aria-pressed="${values[side]===n}"`)).join('')}</div></fieldset>`).join('')}<div class="construction-status" id="live-metrics"></div>`;
}
function yard(){return[...Array(8).keys()].map(n=>`<button class="yard-slot ${values.slots.includes(n)?'filled':''}" type="button" data-action="container" data-slot="${n}" aria-pressed="${values.slots.includes(n)}" aria-label="${values.slots.includes(n)?'Retirar':'Adicionar'} contêiner ${n+1}">${icon(values.slots.includes(n)?'recycle':'plus')}<span>${values.slots.includes(n)?'Contêiner':`Espaço ${n+1}`}</span></button>`).join('');}
function drawPlot(){
 const focused=document.activeElement?.dataset?.cell,block=occupied(values.bx,values.by),green=new Set(values.green);
 $('#plot').innerHTML=[...Array(60).keys()].map(n=>{const b=block.has(n),g=green.has(n)&&!b&&n<50,road=n>=50;return`<button type="button" class="plot-cell ${b?'is-building':''} ${g?'is-green':''} ${road?'is-road':''}" data-cell="${n}" aria-label="Linha ${Math.floor(n/10)+1}, coluna ${n%10+1}: ${road?'via de acesso':b?'edifício':g?'jardim':'área livre'}" aria-pressed="${g}" ${road?'disabled':''}>${b&&n===values.by*10+values.bx+11?icon('building'):g?icon('leaf'):road?'':`<i></i>`}</button>`;}).join('');
 if(focused!==undefined)$(`[data-cell="${focused}"]`)?.focus({preventScroll:true});
}
function drawBridge(){
 const color=n=>n===10?'#b6d3a3':n?'#d99d7f':'#608a7a';
 $('#bridge-diagram').innerHTML=`<svg viewBox="0 0 320 165" role="img" aria-label="Treliça com base de 12 metros, altura de 8 metros e duas diagonais"><path d="M32 130H288M160 24v106" stroke="#bdbb9c" stroke-width="2" stroke-dasharray="4 4" fill="none"/><path d="M32 130 160 24" stroke="${color(values.left)}" stroke-width="5" fill="none"/><path d="M160 24 288 130" stroke="${color(values.right)}" stroke-width="5" fill="none"/>${[[32,130],[160,24],[288,130]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="6" fill="#e6d5a3"/>`).join('')}<text x="80" y="80">${values.left?values.left+' m':'?'}</text><text x="228" y="80">${values.right?values.right+' m':'?'}</text><text x="85" y="150">6 m</text><text x="217" y="150">6 m</text><text x="167" y="102">8 m</text><text x="160" y="163" text-anchor="middle">Largura do prisma: 5 m</text></svg>`;
}
function mission(){
 const l=levels[phase],m=store.player.missions[phase];
 const fields=phase===0?answer('volume','Volume calculado','L','Ex.: 502400'):phase===1?answer('volume','Capacidade total','m³'):phase===2?answer('area','Área da base do edifício','m²')+answer('volume','Volume do edifício','m³'):phase===3?answer('slope','Geratriz do telhado','m')+answer('area','Área total das duas águas','m²'):answer('area','Área da seção triangular','m²')+answer('volume','Volume do prisma','m³');
 return`<section class="mission-layout" style="--district:${l.color}"><div class="mission-stage"><div class="stage-toolbar">${button(`${icon('back')}A cidade`,'map','back-button')}<span class="stage-topic">${icon(l.icon)}${l.topic}</span></div><div class="lab-badge"><span>Oficina do urbanista</span><strong>${l.district}</strong></div>${cameraControls()}<div class="stage-caption">${icon('move')}Arraste para girar o seu projeto</div></div><aside class="mission-panel"><div class="mission-introduction"><div class="mission-heading"><span class="chapter-tag">Distrito ${phase+1} de 5</span><span class="mission-attempts">${m.attempts.length?`${m.attempts.length} tentativa${m.attempts.length===1?'':'s'}`:'Nova missão'}</span></div><h1>${l.name}</h1><p class="mission-objective">${l.objective}</p></div><div class="mission-scroll"><details class="mission-data" open><summary>${icon('flag')}Dados da missão ${icon('chevron')}</summary>${factList(l)}${phase===0?'<p class="pi-note">Considere π = 3,14. Use o raio, não o diâmetro, na fórmula.</p>':''}</details><form id="challenge-form" data-form="challenge"><div class="construction-heading"><span class="section-icon">${icon('cube')}</span><h2>Construa sua solução</h2></div>${buildControls(phase)}<div class="construction-heading answer-heading"><span class="section-icon">${icon('ruler')}</span><h2>Faça os cálculos</h2><button type="button" class="icon-button" data-action="formulas" aria-label="Consultar fórmulas" title="Consultar fórmulas">${icon('book')}</button></div>${fields}<p class="number-help" id="number-help">Aceita vírgula decimal e ponto de milhar.</p><div id="feedback" aria-live="polite"></div></form></div><div class="mission-actions">${button(`${icon('help')}Dica <span id="hint-count">${m.hints}/3</span>`,'hint','secondary','type="button"')}${button(`${icon('bolt')}Simular solução`,'simulate','primary','type="submit" form="challenge-form"')}</div><p class="learning-note">Experimente. Cada tentativa ensina algo novo.</p></aside></section>`;
}
function updateMetrics(){
 if(!values||!$('#live-metrics'))return;const m=calculate(phase,values);let html='';
 const meter=(label,percent,detail,ok)=>`<div class="live-meter ${ok?'meets':''}"><div><span>${label}</span><strong>${detail}</strong></div><div class="progress-track"><i style="width:${Math.min(100,Math.max(0,percent))}%"></i></div></div>`;
 if(phase===0)html=meter('Cobertura da demanda',m.liters/500000*100,`${fmt(m.liters/500000*100)}%`,m.liters>=500000&&m.liters<=600000)+`<span class="live-note">${icon(m.liters>=500000&&m.liters<=600000?'check':'water')}${m.liters<500000?'Aumente a capacidade para atender ao bairro.':m.liters>600000?'Reduza o excesso: limite de 600.000 L.':'Capacidade adequada. Agora calcule o volume.'}</span>`;
 if(phase===1)html=meter('Terreno ocupado',m.occupation,`${fmt(m.occupation,1)}%`,m.occupation<=50)+`<span class="live-note">${icon(m.count>=4&&m.count<=6?'check':'recycle')}${m.count} contêineres • ${fmt(m.area)} m² ocupados</span>`;
 if(phase===2)html=meter('Meta de área verde',m.green/800*100,`${fmt(m.green)} / 800 m²`,m.green>=800)+`<span class="live-note ${!m.validPosition?'warning':''}">${icon(m.validPosition?'check':'info')}${m.validPosition?'Recuos de pelo menos 5 m preservados.':'Mova o edifício para preservar os recuos de 5 m.'}</span>`;
 if(phase===3)html=meter('Energia nominal',m.power/32*100,`${fmt(m.power,1)} / 32 kW`,m.power>=32&&values.panels<=105)+`<span class="live-note ${values.panels>105?'warning':''}">${icon(values.panels>105?'info':'sun')}${values.panels>105?'Os painéis ultrapassam 70% da cobertura.':`${values.panels*2} m² de painéis instalados.`}</span>`;
 if(phase===4)html=`<span class="live-note">${icon('bridge')}${values.left&&values.right?'Estrutura montada. Confira as medidas com Pitágoras.':'Selecione as duas diagonais para montar a estrutura.'}</span>`;
 $('#live-metrics').innerHTML=html;
}
function commit(structure=true){
 clearTimeout(savePending);const playerId=store.data.active,id=phase,draft=structuredClone(values);
 savePending=setTimeout(()=>{if(store.data.active===playerId)store.draft(id,draft);if(!store.available)warnStorage();},160);
 updateMetrics();if(structure){cancelAnimationFrame(worldPending);worldPending=requestAnimationFrame(()=>{if(screen==='mission')world?.setLab(phase,values);});}
 if(!store.available)warnStorage();
}
let storageWarned=false;
function warnStorage(){if(!storageWarned){storageWarned=true;toast('O navegador bloqueou o salvamento. Você pode jogar e baixar seu relatório ao terminar.');}}
function render(screenName){
 document.body.dataset.screen=screenName;document.body.classList.toggle('reduced-motion',!store.data.settings.motion);header();
 $('#screen').innerHTML=({home,intro,tutorial,map,mission,final:finalScreen,teacher:teacherDashboard}[screenName]||home)();markers();
 if(screenName==='mission'){if(phase===2)drawPlot();if(phase===4)drawBridge();updateMetrics();}
 world?.setMode(screenName,screenName==='mission'?phase:-1,screenName==='mission'?values:null);world?.setProgress(store.completed);
 markerNodes=[...document.querySelectorAll('.map-marker')];
 for(const el of document.querySelectorAll('.map-space,.mission-stage,.tutorial-stage')){el.setAttribute('tabindex','0');el.setAttribute('aria-label','Cena interativa. Use as setas para girar, mais e menos para zoom e R para centralizar.');}
 layoutScene();if(failed3D)updateFallback();else if(!world)updatePoster();scheduleLayout();
}
function go(next,options={}){
 if(!['home','intro','tutorial','map','mission','final','teacher'].includes(next))next='home';
 if(next==='teacher'&&!teacherName){modalReturn={next,options:{...options}};openProfile();return;}
 const nextPhase=safePhase(options.phase??selected,selected);
 if((next==='map'||next==='mission'||next==='final')&&!store.player){modalReturn={next,options:{...options,phase:nextPhase}};openProfile();return;}
 if(next==='mission'&&!store.unlocked(nextPhase)){toast('Conclua o distrito anterior para desbloquear esta missão.');next='map';options.replace=true;}
 if(next==='final'&&store.completed<5){next='map';}
 if($('#modal').open){modalReturn=null;$('#modal').close();}
 if(screen==='mission'&&values){clearTimeout(savePending);store.draft(phase,values);}
 cancelAnimationFrame(worldPending);painting=false;flushTime();if(next!==screen){fallbackAngle=0;fallbackZoom=1;}screen=next;
 if(next==='mission'){
  phase=nextPhase;selected=phase;paintMode='building';const draft=store.player.missions[phase].draft;values=cleanDraft(phase,options.fresh?null:draft);missionStart=document.hidden?0:Date.now();
 }
 render(next);window.scrollTo({top:0,behavior:'instant'});$('#screen').focus({preventScroll:true});
 const hash=hashFor(next,phase),state={screen,selected,phase};
 if(options.replace||options.history===false){history.replaceState(state,'',hash);}else if(location.hash!==hash){history.pushState(state,'',hash);}
}
function cleanDraft(id,draft){
 const v=structuredClone(levels[id].default);if(!draft)return v;
 for(const k of Object.keys(v)){
  if(['volume','area','slope'].includes(k))v[k]=String(draft[k]??'').slice(0,25);
  else if(k==='slots')v[k]=[...new Set((Array.isArray(draft[k])?draft[k]:[]).filter(n=>Number.isInteger(n)&&n>=0&&n<8))];
  else if(k==='green')v[k]=[...new Set((Array.isArray(draft[k])?draft[k]:[]).filter(n=>Number.isInteger(n)&&n>=0&&n<50))];
  else if(k==='bx')v[k]=Math.max(0,Math.min(6,Math.floor(Number(draft[k])||0)));
  else if(k==='by')v[k]=Math.max(0,Math.min(2,Math.floor(Number(draft[k])||0)));
  else if(k==='r')v[k]=Math.max(2,Math.min(6,Number(draft[k])||3));
  else if(k==='h')v[k]=Math.max(2,Math.min(10,Number(draft[k])||6));
  else if(k==='panels')v[k]=Math.max(0,Math.min(120,Math.round(Number(draft[k])||0)));
  else if(['left','right'].includes(k))v[k]=[0,8,10,12,14].includes(draft[k])?draft[k]:0;
 }return v;
}

function openModal(html,cls=''){
 const d=$('#modal');d.className=cls;d.innerHTML=html;if(!d.open)d.showModal();
}
const closeButton=()=>`<button class="icon-button modal-close" data-action="close-modal" aria-label="Fechar">${icon('close')}</button>`;
function openProfile(){
 const p=store.player;
 openModal(`${closeButton()}<span class="modal-symbol">${icon('user')}</span><h2 id="modal-title">${p?'Seu perfil de aluno':'Entrar em Math City'}</h2><p>${p?`${esc(p.name)} • ${p.grade}º ano ${esc(p.classroom)}`:'Escolha seu tipo de acesso para continuar.'}</p>${p?`<div class="profile-summary"><span class="avatar large">${esc(p.name.charAt(0).toUpperCase())}</span><div><strong>${esc(p.name)}</strong><span>${store.completed} distritos • ${store.xp} XP</span></div></div>`:''}${store.data.players.length?`<div class="profile-list">${store.data.players.map(a=>`<button class="profile-choice ${a.id===store.data.active?'active':''}" data-action="choose-player" data-player="${esc(a.id)}"><span class="avatar">${esc(a.name.charAt(0).toUpperCase())}</span><span>${esc(a.name)}<small>${a.grade}º ano ${esc(a.classroom)}</small></span>${a.id===store.data.active?icon('check'):icon('chevron')}</button>`).join('')}</div>`:''}<h3 class="login-section-title">Acesso do aluno</h3><form data-form="profile"><label for="player-name">Nome completo</label><input id="player-name" name="name" placeholder="Seu nome" maxlength="28" required autocomplete="name"><div class="login-fields"><label for="student-grade">Série<select id="student-grade" name="grade"><option value="1">1º ano do Ensino Médio</option><option value="2">2º ano do Ensino Médio</option><option value="3">3º ano do Ensino Médio</option></select></label><label for="student-class">Turma<select id="student-class" name="classroom"><option>A</option><option>B</option></select></label></div><p id="profile-error" role="alert"></p>${button(`Entrar como aluno ${icon('arrow')}`,'profile-submit','primary','type="submit"')}</form>${p?button('Sair da conta','student-logout','text-button danger'):''}<div class="teacher-entry"><h3 class="login-section-title">Acesso do professor</h3><p>${store.data.teacher?'Entre com o e-mail e a senha do cadastro.':'Faça o cadastro do professor antes do primeiro login.'}</p>${button(store.data.teacher?'Login do professor':'Cadastrar professor',store.data.teacher?'teacher-login':'teacher-register','secondary')}</div><p class="privacy-note">${icon('info')}Protótipo local: perfis e resultados ficam salvos neste navegador.</p>`,'profile-modal');
}
function teacherRegister(){
 if(store.data.teacher){teacherLogin();return;}
 openModal(`${closeButton()}<span class="modal-symbol">${icon('user')}</span><h2 id="modal-title">Cadastro do professor</h2><p>Crie a conta do professor neste navegador. Depois, entre com e-mail e senha.</p><form data-form="teacher-register"><label for="teacher-register-name">Nome completo</label><input id="teacher-register-name" name="name" maxlength="48" required autocomplete="name" placeholder="Seu nome"><label for="teacher-register-email">E-mail</label><input id="teacher-register-email" name="email" type="email" maxlength="120" required autocomplete="email" placeholder="professor@escola.com"><label for="teacher-register-password">Senha (mínimo 8 caracteres)</label><input id="teacher-register-password" name="password" type="password" minlength="8" required autocomplete="new-password"><label for="teacher-register-confirm">Confirme a senha</label><input id="teacher-register-confirm" name="confirm" type="password" minlength="8" required autocomplete="new-password"><p id="teacher-register-error" role="alert"></p>${button('Cadastrar e continuar para o login','teacher-register-submit','primary','type="submit"')}</form><p class="privacy-note">Cadastro local de demonstração; a conta não é compartilhada entre dispositivos.</p>`,'profile-modal');
}
function teacherLogin(){
 if(!store.data.teacher){teacherRegister();return;}
 openModal(`${closeButton()}<span class="modal-symbol">${icon('book')}</span><h2 id="modal-title">Login do professor</h2><p>Entre com os dados usados no cadastro.</p><form data-form="teacher"><label for="teacher-email">E-mail</label><input id="teacher-email" name="email" type="email" required autocomplete="username" placeholder="professor@escola.com"><label for="teacher-password">Senha</label><input id="teacher-password" name="password" type="password" required autocomplete="current-password"><p id="teacher-error" role="alert"></p>${button('Entrar no painel','teacher-submit','primary','type="submit"')}</form><p class="privacy-note">Este protótipo guarda a conta somente neste navegador. Para uso escolar, use autenticação em servidor.</p>`,'profile-modal');
}
const encodeBase64=bytes=>btoa(String.fromCharCode(...bytes));
async function passwordDigest(password,salt){const data=new TextEncoder().encode(`${salt}:${password}`);return encodeBase64(new Uint8Array(await crypto.subtle.digest('SHA-256',data)));}
function teacherDashboard(){
 const students=store.data.players.filter(p=>(teacherGrade==='all'||p.grade===teacherGrade)&&(teacherClass==='all'||p.classroom===teacherClass));
 const completed=students.reduce((n,p)=>n+p.missions.filter(m=>m.complete).length,0),possible=students.length*5,attempts=students.reduce((n,p)=>n+p.missions.reduce((s,m)=>s+m.attempts.length,0),0);
 return `<section class="teacher-dashboard"><div class="teacher-heading"><span class="chapter-tag">Área do professor</span><h1>Desempenho das turmas</h1><p>Olá, ${esc(teacherName)}. Consulte o andamento dos alunos por série e turma.</p></div><div class="teacher-filters"><label for="teacher-grade-filter">Série<select id="teacher-grade-filter"><option value="all" ${teacherGrade==='all'?'selected':''}>Todas as séries</option><option value="1" ${teacherGrade==='1'?'selected':''}>1º ano</option><option value="2" ${teacherGrade==='2'?'selected':''}>2º ano</option><option value="3" ${teacherGrade==='3'?'selected':''}>3º ano</option></select></label><label for="teacher-class-filter">Turma<select id="teacher-class-filter"><option value="all" ${teacherClass==='all'?'selected':''}>Todas as turmas</option>${['A','B'].map(c=>`<option value="${c}" ${teacherClass===c?'selected':''}>Turma ${c}</option>`).join('')}</select></label></div><div class="teacher-summary"><article><strong>${students.length}</strong><span>Alunos</span></article><article><strong>${possible?Math.round(completed/possible*100):0}%</strong><span>Missões concluídas</span></article><article><strong>${attempts}</strong><span>Tentativas registradas</span></article></div><div class="teacher-table-wrap"><table class="teacher-table"><thead><tr><th>Aluno</th><th>Turma</th><th>Progresso</th><th>Estrelas</th><th>Tentativas</th><th>Última atividade</th></tr></thead><tbody>${students.length?students.map(p=>{const done=p.missions.filter(m=>m.complete).length,starsCount=p.missions.reduce((n,m)=>n+m.stars,0),tries=p.missions.reduce((n,m)=>n+m.attempts.length,0),last=p.missions.flatMap(m=>m.attempts.map(a=>a.at)).sort().at(-1);return `<tr><td><strong>${esc(p.name)}</strong></td><td>${p.grade}º ${esc(p.classroom)}</td><td><span class="teacher-progress"><i style="width:${done*20}%"></i></span>${done}/5</td><td>${starsCount}/15</td><td>${tries}</td><td>${last?new Date(last).toLocaleDateString('pt-BR'):'Ainda sem atividade'}</td></tr><tr class="student-detail-row"><td colspan="6"><div class="student-mission-grid">${levels.map((l,i)=>{const m=p.missions[i],total=m.attempts.length,success=m.attempts.filter(a=>a.ok).length;return `<span><strong>${l.district}</strong><small>${m.complete?'Concluída':total?'Em andamento':'Não iniciada'} • ${success}/${total} acertos${m.stars?` • ${m.stars}★`:''}</small></span>`}).join('')}</div></td></tr>`}).join(''):`<tr><td colspan="6" class="teacher-empty">Nenhum aluno cadastrado nesta seleção. Os alunos precisam entrar neste navegador e criar o perfil com sua série e turma.</td></tr>`}</tbody></table></div><p class="privacy-note">Os dados exibidos vêm dos perfis e tentativas salvos neste navegador. Para acesso compartilhado e seguro entre dispositivos, o projeto precisa de um servidor e autenticação.</p></section>`;
}
function settings(){
 const s=store.data.settings;
 openModal(`${closeButton()}<span class="modal-symbol">${icon('gear')}</span><h2 id="modal-title">Do seu jeito.</h2><p>Ajuste a experiência para o seu dispositivo.</p><label class="setting-label" for="quality">Qualidade dos gráficos</label><select id="quality" data-setting="quality"><option value="auto" ${s.quality==='auto'?'selected':''}>Automática</option><option value="high" ${s.quality==='high'?'selected':''}>Alta • sombras e mais detalhes</option><option value="low" ${s.quality==='low'?'selected':''}>Leve • menor consumo</option></select><label class="toggle-row"><span><strong>Movimento ambiente</strong><small>Água, veículos e partículas</small></span><input type="checkbox" data-setting="motion" ${s.motion?'checked':''}><span class="toggle-visual"></span></label><label class="toggle-row"><span><strong>Sons do jogo</strong><small>Notas suaves ao interagir</small></span><input type="checkbox" data-setting="sound" ${s.sound?'checked':''}><span class="toggle-visual"></span></label>${failed3D?'<div class="tutorial-notice">A cena 3D não está disponível neste dispositivo. Os jogos e os cálculos continuam funcionando com a visualização de apoio.</div>':''}<div class="setting-actions">${button(`${icon('book')}Rever tutorial`,'tutorial-from-settings','secondary')}${store.player?button(`${icon('reset')}Reiniciar este explorador`,'ask-reset','text-button danger'):''}</div><p class="privacy-note">Progresso salvo neste navegador. Exporte o caderno para guardar seus resultados.</p>`,'settings-modal');
}
function formulas(){
 const l=levels[phase];openModal(`${closeButton()}<span class="modal-symbol">${icon('book')}</span><h2 id="modal-title">Ferramentas do urbanista</h2><p>${l.topic}</p><div class="formula-list">${l.formulas.map(([a,b])=>`<div><span>${a}</span><strong>${b}</strong></div>`).join('')}</div><p class="tutorial-notice">${phase===0?'Use π = 3,14. Atenção: raio = diâmetro ÷ 2.':phase===3?'O telhado tem duas faces inclinadas. A altura do prédio não entra neste cálculo.':phase===4?'O volume é do prisma triangular de referência. A treliça é uma representação geométrica.':'Verifique as unidades: área em m², volume em m³.'}</p>${button('Voltar ao projeto','close-modal','primary')}`,'formula-modal');
}
function hint(){
 const l=levels[phase],m=store.player.missions[phase];const n=m.hints>=3?3:store.hint(phase);$('#hint-count').textContent=`${n}/3`;
 openModal(`${closeButton()}<span class="modal-symbol">${icon('help')}</span><span class="chapter-tag">Pista ${n} de 3</span><h2 id="modal-title">Uma ideia para avançar.</h2><p class="hint-text">${l.hints[n-1]}</p><div class="hint-footer">${button('Voltar ao projeto','close-modal','primary')}${n<3?button('Próxima pista','hint','text-button'):''}</div><p class="privacy-note">As dicas ajudam você a aprender. Usar duas ou mais pistas limita esta missão a duas estrelas.</p>`,'hint-modal');
}
function simulate(){
 if(!store.player||screen!=='mission')return;
 $('#challenge-form').querySelectorAll('[data-answer]').forEach(e=>values[e.dataset.answer]=e.value);
 const result=validate(phase,values),m=store.attempt(phase,values,result);header();sound(result.ok?'success':'error');
 $('.mission-attempts').textContent=`${m.attempts.length} tentativa${m.attempts.length===1?'':'s'}`;
 if(result.ok){world?.setProgress(store.completed);victory(result,m);}
 else{
  $('#feedback').innerHTML=`<section class="validation-feedback"><h3>${icon('info')}Seu projeto precisa de ajustes.</h3><p>Revise os pontos abaixo e tente novamente.</p>${result.checks.map(c=>`<details class="validation-row ${c.ok?'ok':'needs-work'}" ${!c.ok?'open':''}><summary>${icon(c.ok?'check':'info')}${c.title}${icon('chevron')}</summary><p>${esc(c.message)}</p></details>`).join('')}</section>`;
  $('#feedback').scrollIntoView({behavior:store.data.settings.motion?'smooth':'instant',block:'nearest'});
 }
}
function victory(result,m){
 const titles=['A água voltou a correr.','Um novo ciclo começou.','A cidade ganhou um respiro.','O futuro está mais claro.','Math City está conectada.'];
 const metrics=result.metrics,summary=phase===0?[['Capacidade',`${fmt(metrics.liters)} L`],['Ocupação',`${fmt(metrics.occupation,1)}%`]]:phase===1?[['Contêineres',metrics.count],['Capacidade',`${metrics.volume} m³`]]:phase===2?[['Jardim',`${fmt(metrics.green)} m²`],['Volume',`${fmt(metrics.volume)} m³`]]:phase===3?[['Painéis',values.panels],['Energia',`${fmt(metrics.power,1)} kW`]]:[['Diagonais','10 m'],['Prisma','240 m³']];
 openModal(`${closeButton()}<div class="victory-symbol">${icon(levels[phase].icon)}</div>${stars(m.stars)}<span class="chapter-tag">Distrito recuperado</span><h2 id="modal-title">${titles[phase]}</h2><p>${levels[phase].impact}</p><div class="victory-stats">${summary.map(([a,b])=>`<div><span>${a}</span><strong>${b}</strong></div>`).join('')}<div><span>Experiência</span><strong>${100+m.stars*25} XP</strong></div></div><details class="victory-calculation"><summary>${icon('book')}Veja o raciocínio ${icon('chevron')}</summary>${result.checks.map(c=>`<p><strong>${c.title}</strong><br>${esc(c.message)}</p>`).join('')}</details>${button(`${phase===4?'Ver cidade restaurada':'Voltar à cidade'} ${icon('arrow')}`,phase===4?'victory-final':'victory-map','primary')}<p class="victory-next">${phase<4?`${levels[phase+1].name} foi desbloqueado.`:'Você concluiu os cinco desafios da operação.'}</p>`,'victory-modal');
 confetti();
}
function confetti(){
 if(!store.data.settings.motion||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const colors=['#dfc48c','#a7cf9c','#ddad86','#99c5c5'];$('#celebration').innerHTML=[...Array(34)].map((_,i)=>`<i style="--x:${Math.random()*100}%;--delay:${Math.random()*.7}s;--turn:${Math.random()*700-350}deg;background:${colors[i%4]}"></i>`).join('');setTimeout(()=>$('#celebration').innerHTML='',4000);
}
function journal(){
 if(!store.player){openProfile();return;}flushTime();if(screen==='mission')missionStart=Date.now();const p=store.player;
 openModal(`${closeButton()}<div class="journal-title"><span class="modal-symbol">${icon('book')}</span><div><span class="chapter-tag">O caderno de ${esc(p.name)}</span><h2 id="modal-title">Cada ideia conta.</h2></div></div><div class="journal-overview"><div><strong>${store.completed}/5</strong><span>Distritos</span></div><div><strong>${p.missions.reduce((s,m)=>s+m.stars,0)}/15</strong><span>Estrelas</span></div><div><strong>${store.xp}</strong><span>Experiência</span></div></div><div class="journal-missions">${levels.map((l,i)=>{const m=p.missions[i],latest=m.attempts.at(-1);return`<details class="journal-mission"><summary><span class="journal-icon">${icon(l.icon)}</span><span><strong>${l.name}</strong><small>${m.complete?'Recuperado':store.unlocked(i)?'Em andamento':'Ainda não explorado'} • ${m.attempts.length} tentativa${m.attempts.length===1?'':'s'}</small></span>${m.complete?stars(m.stars):icon('chevron')}</summary><div class="journal-detail"><p>${l.topic}</p><p>${m.hints} pistas consultadas • ${formatTime(m.seconds)} de exploração ativa</p>${latest?`<dl class="report-metrics">${metricReport(i,latest.metrics).map(([a,b])=>`<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl><div class="attempt-history"><strong>Histórico de tentativas</strong>${m.attempts.slice(-10).map((a,j)=>`<div>${icon(a.ok?'check':'info')}<span>${new Date(a.at).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</span><span>${a.ok?'Solução validada':'Projeto revisado'}</span></div>`).join('')}</div>`:'<p>Entre no distrito para registrar sua primeira solução.</p>'}</div></details>`;}).join('')}</div><div class="journal-actions">${button(`${icon('download')}Baixar relatório CSV`,'export-csv','primary')}${button('Salvar caderno JSON','export-json','secondary')}</div><p class="privacy-note">Os dados pertencem ao explorador selecionado e ficam neste navegador. Os arquivos podem ser compartilhados com seu professor.</p>`,'journal-modal');
}
function formatTime(s){const min=Math.floor(s/60);return min<1?'menos de 1 min':`${min} min${s%60?` ${Math.floor(s%60)} s`:''}`;}
function metricReport(id,m){return id===0?[['Volume',`${fmt(m.liters)} L`],['Base',`${fmt(m.area,2)} m²`]]:id===1?[['Contêineres',m.count],['Capacidade',`${m.volume} m³`],['Ocupação',`${fmt(m.occupation,1)}%`]]:id===2?[['Jardim',`${fmt(m.green)} m²`],['Volume do edifício',`${fmt(m.volume)} m³`]]:id===3?[['Geratriz','7,5 m'],['Cobertura','300 m²'],['Energia',`${fmt(m.power,1)} kW`]]:[['Diagonal','10 m'],['Seção','48 m²'],['Prisma','240 m³']];}
function finalScreen(){
 const p=store.player,totalStars=p.missions.reduce((n,m)=>n+m.stars,0),attempts=p.missions.reduce((n,m)=>n+m.attempts.length,0);
 return`<section class="final-layout"><div class="final-copy"><span class="chapter-tag">Operação concluída</span><h1>Uma nova cidade.<br>Um novo olhar.</h1><p>${esc(p.name)}, você transformou Math City com cinco soluções geométricas. A matemática saiu do papel e ganhou vida.</p><div class="final-stats"><div>${icon('star')}<strong>${totalStars}<small>/15</small></strong><span>Estrelas</span></div><div>${icon('bolt')}<strong>${store.xp}</strong><span>Experiência</span></div><div>${icon('flag')}<strong>${attempts}</strong><span>Tentativas</span></div></div><div class="final-actions">${button(`${icon('book')}Abrir meu caderno`,'journal')}${button(`${icon('map')}Explorar cidade`,'map','secondary')}${button(`${icon('download')}Imprimir conquista`,'print-certificate','text-button')}</div></div><div class="certificate" id="certificate">${crest()}<span>Conselho de Math City</span><div class="certificate-rule"></div><h2>Urbanista<br>do amanhã</h2><p>Certificamos que</p><strong class="certificate-name">${esc(p.name)}</strong><p>concluiu a Operação Cidade Inteligente,<br>aplicando geometria plana e espacial<br>para transformar cinco distritos.</p><div class="certificate-seal">${icon('trophy')}<span>5 distritos<br>recuperados</span></div><span class="certificate-date">${new Date().toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'})}</span></div></section>`;
}
function download(name,content,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
function csv(){
 const p=store.player;const rows=[['Explorador','Distrito','Concluído','Estrelas','Tentativas','Dicas','Tempo ativo (s)','Tentativa em','Validada','Respostas','Métricas']];
 levels.forEach((l,i)=>{const m=p.missions[i];if(!m.attempts.length)rows.push([p.name,l.name,m.complete?'Sim':'Não',m.stars,0,m.hints,m.seconds,'','','','']);for(const a of m.attempts)rows.push([p.name,l.name,m.complete?'Sim':'Não',m.stars,m.attempts.length,m.hints,m.seconds,a.at,a.ok?'Sim':'Não',JSON.stringify(a.answers),JSON.stringify(a.metrics)]);});
 // Spreadsheet applications must not interpret player-provided strings as formulas.
 return '\ufeff'+rows.map(row=>row.map(c=>{let s=String(c??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}).join(';')).join('\r\n');
}

let audioCtx=null;
function sound(kind='tap'){
 if(!store.data.settings.sound)return;try{
  audioCtx??=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();
  const now=audioCtx.currentTime,notes=kind==='success'?[392,493.88,587.33,783.99]:kind==='error'?[294,261]:[440];
  notes.forEach((freq,i)=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.value=freq;o.connect(g);g.connect(audioCtx.destination);g.gain.setValueAtTime(0,now+i*.095);g.gain.linearRampToValueAtTime(.045,now+i*.095+.02);g.gain.exponentialRampToValueAtTime(.0001,now+i*.095+.35);o.start(now+i*.095);o.stop(now+i*.095+.37);});
 }catch{}
}
function finishTutorial(){
 if(!store.player){modalReturn={next:'map',options:{}};openProfile();return;}store.player.tutorial=true;store.save();selected=store.completed<5?store.completed:0;go('map');
}
function paint(cell,drag=false){
 const n=Number(cell.dataset.cell);if(n>=50)return;
 if(paintMode==='building'){
  if(drag)return;const bx=n%10,by=Math.floor(n/10);if(bx>6||by>2){toast('O edifício ocupa 4 × 3 quadrados. Escolha um ponto mais à esquerda ou acima.');return;}values.bx=bx;values.by=by;const block=occupied(bx,by);values.green=values.green.filter(a=>!block.has(a));
 }else{
  if(occupied(values.bx,values.by).has(n)){if(!drag)toast('O jardim precisa ficar fora da base do edifício.');return;}
  const set=new Set(values.green);if(!drag)paintValue=!set.has(n);else if(set.has(n)===paintValue)return;if(paintValue)set.add(n);else set.delete(n);values.green=[...set];
 }
 drawPlot();commit();
}

document.addEventListener('click',e=>{
 if(e.target.closest('.skip-link')){e.preventDefault();$('#screen').focus({preventScroll:true});return;}
 const cell=e.target.closest('[data-cell]');if(cell&&e.detail===0&&!cell.disabled){paint(cell);$(`[data-cell="${cell.dataset.cell}"]`)?.focus({preventScroll:true});return;}
 const b=e.target.closest('[data-action]');if(!b||b.disabled)return;const a=b.dataset.action;
 if(['practice-submit','profile-submit','teacher-submit','teacher-register-submit','simulate'].includes(a))return;
 if(!['sound','close-modal','container','beam','step'].includes(a))sound();
 switch(a){
  case'home':go('home');break;
  case'intro':go('intro');break;
  case'start':go('intro');break;
  case'continue':go(store.completed===5?'final':'map');break;
  case'enlist':if(store.player){tutorialStep=0;go('tutorial');}else{modalReturn={next:'tutorial',options:{}};openProfile();}break;
  case'tutorial':tutorialStep=0;tutorialSolved=false;tutorialAnswer='';go('tutorial');break;
  case'tutorial-next':if(tutorialStep===1&&!tutorialSolved){toast('Confira a área da praça para continuar o treinamento.');$('#practice-answer')?.focus();}else{tutorialStep=Math.min(2,tutorialStep+1);render('tutorial');}break;
  case'tutorial-prev':tutorialStep=Math.max(0,tutorialStep-1);render('tutorial');break;
  case'tutorial-skip':case'tutorial-finish':finishTutorial();break;
  case'map':go('map');break;
  case'final':go('final');break;
  case'select-phase':{
   selectDistrict(Number(b.dataset.id),e.detail===0);break;
  }
  case'open-phase':go('mission',{phase:Number(b.dataset.id),fresh:store.player.missions[Number(b.dataset.id)].complete});break;
  case'container':{
   const slot=Number(b.dataset.slot);values.slots=values.slots.includes(slot)?values.slots.filter(n=>n!==slot):[...values.slots,slot];$('#yard').innerHTML=yard();if(e.detail===0)$(`[data-action="container"][data-slot="${slot}"]`)?.focus({preventScroll:true});commit();sound();break;
  }
  case'paint-building':case'paint-green':paintMode=a==='paint-green'?'green':'building';document.querySelectorAll('.segment').forEach(el=>{const active=el.dataset.action===a;el.classList.toggle('active',active);el.setAttribute('aria-pressed',active);});$('#paint-help').textContent=paintMode==='building'?'Escolha o canto superior esquerdo do edifício no terreno.':'Toque ou arraste pelos quadrados para plantar ou retirar jardim.';break;
  case'clear-green':values.green=[];drawPlot();commit();break;
  case'fill-green':values.green=[...Array(50).keys()].filter(n=>!occupied(values.bx,values.by).has(n));drawPlot();commit();break;
  case'beam':values[b.dataset.side]=Number(b.dataset.length);document.querySelectorAll(`[data-action="beam"][data-side="${b.dataset.side}"]`).forEach(el=>el.setAttribute('aria-pressed',Number(el.dataset.length)===values[b.dataset.side]));drawBridge();commit();sound();break;
  case'step':{
   const field=b.dataset.field,input=$(`#range-${field}`);input.value=Math.max(Number(input.min),Math.min(Number(input.max),Number(input.value)+Number(b.dataset.delta)));input.dispatchEvent(new Event('input',{bubbles:true}));break;
  }
  case'hint':hint();break;
  case'formulas':formulas();break;
  case'journal':journal();break;
  case'profile':modalReturn=null;openProfile();break;
  case'choose-player':clearTimeout(savePending);flushTime();store.select(b.dataset.player);$('#modal').close();selected=store.completed<5?store.completed:0;values=null;screen='home';tutorialStep=0;tutorialSolved=false;go(store.player.tutorial?'map':'tutorial');break;
  case'teacher-login':teacherLogin();break;
  case'teacher-register':teacherRegister();break;
  case'teacher-logout':teacherName='';teacherGrade='all';teacherClass='all';store.logout();go('home');openProfile();break;
  case'student-logout':store.logout();values=null;modalReturn=null;go('home');openProfile();break;
  case'teacher-home':go('teacher');break;
  case'settings':settings();break;
  case'sound':store.data.settings.sound=!store.data.settings.sound;store.save();header();sound();toast(store.data.settings.sound?'Sons ativados.':'Sons desativados.');break;
  case'close-modal':$('#modal').close();break;
  case'victory-map':$('#modal').close();selected=Math.min(4,phase+1);go('map');break;
  case'victory-final':$('#modal').close();go('final');break;
  case'export-csv':download('Math-City-Relatorio.csv',csv(),'text/csv;charset=utf-8');toast('Relatório CSV preparado.');break;
  case'export-json':download('Math-City-Caderno.json',store.export(),'application/json');toast('Caderno preparado.');break;
  case'tutorial-from-settings':$('#modal').close();tutorialStep=0;go('tutorial');break;
  case'ask-reset':openModal(`${closeButton()}<h2 id="modal-title">Recomeçar a expedição?</h2><p>Isso apaga as tentativas e o progresso de ${esc(store.player.name)} neste navegador. Os outros exploradores continuam com seus dados.</p><div class="hint-footer">${button('Manter minha jornada','close-modal','secondary')}${button('Recomeçar','confirm-reset','primary')}</div>`);break;
  case'confirm-reset':flushTime();store.resetPlayer();$('#modal').close();selected=0;go('map');break;
  case'print-certificate':window.print();break;
  case'rotate-left':failed3D?fallbackCamera('left'):world?.rotate(-.18);break;
  case'rotate-right':failed3D?fallbackCamera('right'):world?.rotate(.18);break;
  case'zoom-in':failed3D?fallbackCamera('in'):world?.zoomBy(.1);break;
  case'zoom-out':failed3D?fallbackCamera('out'):world?.zoomBy(-.1);break;
  case'reset-camera':failed3D?fallbackCamera('reset'):world?.reset();break;
 }
});
document.addEventListener('input',e=>{
 const t=e.target;
 if(t.dataset.range){const f=t.dataset.range;values[f]=Number(t.value);$(`#output-${f}`).textContent=`${fmt(values[f],Number(t.step)<1?1:0)} ${f==='panels'?'':'m'}`;commit();}
 if(t.dataset.answer){values[t.dataset.answer]=t.value;commit(false);}
 if(t.dataset.setting){const f=t.dataset.setting;store.data.settings[f]=t.type==='checkbox'?t.checked:t.value;store.save();world?.configure(store.data.settings);document.body.classList.toggle('reduced-motion',!store.data.settings.motion);if(f==='sound'){header();sound();}}
});
document.addEventListener('submit',async e=>{
 const form=e.target;if(!form.dataset.form)return;e.preventDefault();
 if(form.dataset.form==='challenge')simulate();
 if(form.dataset.form==='profile'){
  try{clearTimeout(savePending);flushTime();const data=new FormData(form),name=String(data.get('name')).trim(),grade=String(data.get('grade')),classroom=String(data.get('classroom'));const existing=store.data.players.find(p=>p.name.toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR')&&p.grade===grade&&p.classroom===classroom);if(existing)store.select(existing.id);else store.create(name,grade,classroom);$('#modal').close();selected=0;tutorialStep=0;tutorialSolved=false;values=null;screen='home';const pending=modalReturn;modalReturn=null;go(pending?.next||(store.player?.tutorial?'map':'tutorial'),pending?.options||{});if(!store.available)warnStorage();}catch(err){$('#profile-error').textContent=err.message;}
 }
 if(form.dataset.form==='teacher'){
  try{const data=new FormData(form),email=String(data.get('email')||'').trim().toLowerCase(),password=String(data.get('password')||''),account=store.data.teacher,digest=await passwordDigest(password,account.salt);if(email!==account.email||digest!==account.passwordHash){$('#teacher-error').textContent='E-mail ou senha incorretos.';return;}teacherName=account.name;store.logout();$('#modal').close();modalReturn=null;teacherGrade='all';teacherClass='all';go('teacher');}catch{$('#teacher-error').textContent='Não foi possível validar o login neste navegador.';}
 }
 if(form.dataset.form==='teacher-register'){
  try{const data=new FormData(form),name=String(data.get('name')||'').trim().slice(0,48),email=String(data.get('email')||'').trim().toLowerCase(),password=String(data.get('password')||''),confirm=String(data.get('confirm')||'');if(password.length<8){$('#teacher-register-error').textContent='A senha precisa ter pelo menos 8 caracteres.';return;}if(password!==confirm){$('#teacher-register-error').textContent='As senhas não coincidem.';return;}const salt=encodeBase64(crypto.getRandomValues(new Uint8Array(16))),passwordHash=await passwordDigest(password,salt);store.data.teacher={name,email,salt,passwordHash};store.save();teacherLogin();}catch{$('#teacher-register-error').textContent='Não foi possível concluir o cadastro neste navegador.';}
 }
 if(form.dataset.form==='practice'){
  tutorialAnswer=$('#practice-answer').value;const ok=number(tutorialAnswer)===24;tutorialSolved=ok;$('#practice-feedback').classList.toggle('correct',ok);$('#practice-feedback').textContent=ok?'Muito bem! 6 × 4 = 24 m². Pode continuar.':'Ainda não. Multiplique 6 por 4 e tente novamente.';sound(ok?'success':'error');
 }
});
document.addEventListener('change',e=>{if(e.target.id==='teacher-grade-filter'){teacherGrade=e.target.value;render('teacher');}if(e.target.id==='teacher-class-filter'){teacherClass=e.target.value;render('teacher');}});
document.addEventListener('pointerdown',e=>{const cell=e.target.closest('[data-cell]');if(cell&&!cell.disabled&&screen==='mission'){painting=true;paint(cell);e.preventDefault();}});
document.addEventListener('pointermove',e=>{if(!painting||paintMode!=='green')return;const cell=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-cell]');if(cell&&!cell.disabled)paint(cell,true);});
document.addEventListener('pointerup',()=>painting=false);
document.addEventListener('pointercancel',()=>painting=false);
document.addEventListener('keydown',e=>{const cell=e.target.closest('[data-cell]');if(cell&&['Enter',' '].includes(e.key)){e.preventDefault();paint(cell);}if(e.key==='Escape')painting=false;});
$('#modal').addEventListener('click',e=>{if(e.target===$('#modal')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)flushTime();else if(screen==='mission')missionStart=Date.now();});
window.addEventListener('beforeunload',flushTime);
window.addEventListener('pagehide',()=>{if(screen==='mission'&&values){clearTimeout(savePending);store.draft(phase,values);}flushTime();});
window.addEventListener('resize',scheduleLayout);
window.visualViewport?.addEventListener('resize',scheduleLayout);
let routePending;
const scheduleRoute=()=>{cancelAnimationFrame(routePending);routePending=requestAnimationFrame(routeHash);};
window.addEventListener('popstate',scheduleRoute);
window.addEventListener('hashchange',scheduleRoute);
$('#modal').addEventListener('close',()=>{if(modalReturn&&!store.player){modalReturn=null;history.replaceState({screen,selected,phase},'',hashFor(screen,phase));}scheduleLayout();});
function routeHash(){
 const route=readRoute(location.hash);if(history.state?.selected!==undefined)selected=safePhase(history.state.selected,selected);
 go(route.screen,{phase:route.phase,history:false});
}

function updatePoster(){
 let el=$('#scene-poster');if(!el){el=document.createElement('div');el.id='scene-poster';$('#world').append(el);}
 const source=screen==='mission'?`lab-${phase}`:screen==='tutorial'?'tutorial':'city';
 el.innerHTML=`<img class="scene-render" src="./scenes/${source}.webp" alt="" draggable="false">`;
}

// The supporting view remains interactive when WebGL is unavailable.
function updateFallback(){
 $('#scene-poster')?.remove();$('#world').classList.add('unavailable');
 let e=$('#fallback-city');if(!e){e=document.createElement('div');e.id='fallback-city';$('#world').append(e);}
 if(screen==='mission'||screen==='tutorial'){
  e.innerHTML=`<img class="scene-render" src="./scenes/${screen==='tutorial'?'tutorial':`lab-${phase}`}.webp" alt="" draggable="false"><span class="compatibility-note">${screen==='tutorial'?'Praça de treino':'Construção de referência'}</span>`;
 }else{
  const suffix=fallbackAngle<0?'-left':fallbackAngle>0?'-right':'';
  e.innerHTML=`<img class="scene-render" src="./scenes/city${store.completed===5?'-restored':''}${suffix}.webp" alt="" draggable="false">`;
 }
 const image=e.querySelector('.scene-render');if(image)image.style.transform=`scale(${fallbackZoom})`;
 for(const b of document.querySelectorAll('[data-action=rotate-left],[data-action=rotate-right]')){b.disabled=screen==='mission'||screen==='tutorial';if(b.disabled)b.title='Giro disponível na visualização 3D';}
 if(screen==='mission'||screen==='tutorial')$('.stage-caption').textContent='Use os controles para planejar sua solução.';
 if(screen==='map')fallbackMarkers();
}
function fallbackCamera(action){
 if(action==='left')fallbackAngle=Math.max(-1,fallbackAngle-1);
 if(action==='right')fallbackAngle=Math.min(1,fallbackAngle+1);
 if(action==='in')fallbackZoom=Math.min(1.65,fallbackZoom+.1);
 if(action==='out')fallbackZoom=Math.max(.7,fallbackZoom-.1);
 if(action==='reset'){fallbackAngle=0;fallbackZoom=1;}
 updateFallback();
}
document.addEventListener('keydown',e=>{if(!failed3D||!e.target.matches('.map-space,.mission-stage,.tutorial-stage'))return;const action={ArrowLeft:'left',ArrowRight:'right','+':'in','=':'in','-':'out',r:'reset',R:'reset'}[e.key];if(action){e.preventDefault();fallbackCamera(action);}});
document.addEventListener('pointerdown',e=>{if(!failed3D||e.target.closest('button')||!e.target.closest('.map-space'))return;fallbackDrag=e.clientX;});
document.addEventListener('pointerup',e=>{if(fallbackDrag!==null){const delta=e.clientX-fallbackDrag;if(Math.abs(delta)>35)fallbackCamera(delta<0?'right':'left');fallbackDrag=null;}});
document.addEventListener('pointercancel',()=>fallbackDrag=null);

render('home');
import('./world.js').then(({World})=>{
 world=new World($('#world'),projectMarkers,()=>{failed3D=true;updateFallback();if(screen==='map')fallbackMarkers();},()=>{failed3D=false;$('#fallback-city')?.remove();render(screen);});world.configure(store.data.settings);world.setProgress(store.completed);world.setMode(screen,screen==='mission'?phase:-1,values);$('#scene-poster')?.remove();
}).catch(()=>{failed3D=true;updateFallback();if(screen==='map')fallbackMarkers();});
if(location.hash)routeHash();
if(!document.querySelector('#modal').open)openProfile();
if(!store.available)warnStorage();
