const $=id=>document.getElementById(id);
// ---------- Парсер (рекурсивный спуск) ----------
function norm(s){return s.replace(/\s+/g,'').replace(/(\d|\))\(/g,'$1*(').replace(/\)(\d)/g,')*$1').replace(/[×xXхХ*·]/g,'*').replace(/[÷:]/g,'/').replace(/[−–—]/g,'-').replace(/\*\*/g,'^').replace(/,/g,'.').replace(/=.*$/,'').replace(/[\[{]/g,'(').replace(/[\]}]/g,')').replace(/\s+/g,'')}
function parse(s){
  let i=0;const err=m=>{throw new Error(m)};
  const add=()=>{let l=mul();while(s[i]=='+'||s[i]=='-'){const o=s[i++];l={t:'bin',op:o,l,r:mul()}}return l};
  const mul=()=>{let l=un();while(s[i]=='*'||s[i]=='/'){const o=s[i++];l={t:'bin',op:o,l,r:un()}}return l};
  const un=()=>{if(s[i]=='-'){i++;return{t:'neg',e:un()}}if(s[i]=='+'){i++;return un()}return pw()};
  const pw=()=>{const b=at();if(s[i]=='^'){i++;return{t:'bin',op:'^',l:b,r:un()}}return b};
  const at=()=>{if(s[i]=='('){i++;const e=add();if(s[i]!=')')err('Не закрыта скобка');i++;return{t:'par',e}}
    const m=/^\d+(\.\d+)?/.exec(s.slice(i));if(!m)err('Ожидалось число на позиции '+(i+1)+(s[i]?' («'+s[i]+'»)':''));i+=m[0].length;return{t:'num',v:parseFloat(m[0])}};
  if(!s)err('Введите выражение');const r=add();if(i<s.length)err('Лишний символ «'+s[i]+'»');return r}
// ---------- Пошаговое решение ----------
const fmt=v=>String(+v.toFixed(10));
const OPN={'+':'Складываем','-':'Вычитаем','*':'Умножаем','/':'Делим','^':'Возводим в степень'};
const PR={'^':3,'*':2,'/':2,'+':1,'-':1};
function simp(n){switch(n.t){
  case'par':{const e=simp(n.e);return e.t=='num'?e:{t:'par',e}}
  case'neg':{const e=simp(n.e);return e.t=='num'?{t:'num',v:-e.v}:{t:'neg',e}}
  case'bin':return{t:'bin',op:n.op,l:simp(n.l),r:simp(n.r)};default:return n}}
function str(n,tg,top=true){switch(n.t){
  case'num':{const t=fmt(n.v);return n.v<0&&!top?'('+t+')':t}
  case'neg':return'−'+str(n.e,tg,false);
  case'par':return'('+str(n.e,tg,true)+')';
  case'bin':{const o=n.op=='*'?'×':n.op=='/'?'÷':n.op=='-'?'−':n.op;
    const t=str(n.l,tg,false)+' '+o+' '+str(n.r,tg,false);return n==tg?'<mark>'+t+'</mark>':t}}}
function tex(n,tg,top=true){let r;switch(n.t){
  case'num':{const t=fmt(n.v);r=n.v<0&&!top?'\\left('+t+'\\right)':t;break}
  case'neg':r='-'+tex(n.e,tg,false);break;
  case'par':r='\\left('+tex(n.e,tg,true)+'\\right)';break;
  case'bin':{const dv=n.op=='/',un=y=>dv&&y.t=='par'?y.e:y,l=tex(un(n.l),tg,dv),q=tex(un(n.r),tg,dv||n.op=='^');
    r=dv?`\\frac{${l}}{${q}}`:n.op=='^'?`${l}^{${q}}`:`${l} ${n.op=='*'?'\\cdot':n.op} ${q}`;break}}
  return n==tg?`\\htmlClass{hl}{${r}}`:r}
function calc1(op,a,b){switch(op){case'+':return a+b;case'-':return a-b;case'*':return a*b;
  case'/':if(b==0)throw new Error('Деление на ноль');return a/b;
  case'^':{const r=Math.pow(a,b);if(!isFinite(r)||isNaN(r))throw new Error('Невозможно вычислить степень');return r}}}
function solve(src){
  let tree=simp(parse(src));const steps=[];let g=0;
  while(tree.t!='num'){
    const c=[];let k=0;
    (function w(n,d){if(n.t=='par')w(n.e,d+1);else if(n.t=='neg')w(n.e,d);
      else if(n.t=='bin'){w(n.l,d);w(n.r,d);if(n.l.t=='num'&&n.r.t=='num')c.push({n,d,p:PR[n.op],k:k++})}})(tree,0);
    if(!c.length||++g>200)throw new Error('Не удалось разобрать выражение');
    c.sort((a,b)=>b.d-a.d||b.p-a.p||a.k-b.k);
    const {n}=c[0],a=n.l.v,b=n.r.v,r=calc1(n.op,a,b);
    const before=str(tree,n),bt=tex(tree,n),note=`${OPN[n.op]}: ${fmt(a)} ${n.op=='*'?'×':n.op=='/'?'÷':n.op=='-'?'−':n.op} ${fmt(b)} = ${fmt(r)}`+(c[0].d?' (внутри скобок)':'');
    Object.keys(n).forEach(x=>delete n[x]);Object.assign(n,{t:'num',v:r});
    tree=simp(tree);steps.push({before,bt,note,after:str(tree,null),at:tex(tree,null)});}
  return{steps,res:tree.v,start:str(simp(parse(src)),null),st:tex(simp(parse(src)),null)}}
// ---------- История ----------
let H=[];try{H=JSON.parse(localStorage.getItem('mogg67')||'[]')}catch(e){}
const save=()=>{try{localStorage.setItem('mogg67',JSON.stringify(H))}catch(e){}};
function drawH(){$('hist').innerHTML=H.length?H.map((h,i)=>`<div class="h" data-i="${i}"><span>${h.e}</span><b>= ${h.r}</b></div>`).join(''):'<span style="color:var(--mut)">Пока пусто</span>'}
$('hist').onclick=e=>{const d=e.target.closest('.h');if(d){stat('hre');$('expr').value=H[d.dataset.i].e;run()}};
$('hclr').onclick=()=>{stat('hclr');H=[];save();drawH()};
// ---------- Запуск ----------
function run(){
  const o=$('out');try{
    const s=norm($('expr').value);if(/[A-Za-zА-Яа-я_]/.test(s))throw new Error('В выражении есть переменные ('+(s.match(/[A-Za-zА-Яа-я_]/g).join(', '))+'). Решатель считает только числа — подставь значения, например n=4, m=3.');const {steps,res,start,st}=solve(s);
    o.innerHTML=`<div class="st"><small>Исходное выражение</small><div class="ex">${start}</div></div>`+
      (steps.length?steps.map((x,i)=>`<div class="st"><small>Шаг ${i+1}. ${x.note}</small><div class="ex">${x.before}</div><div class="ex">→ ${x.after}</div></div>`).join(''):'<div class="st"><small>Вычислять нечего — это уже число</small></div>')+
      `<div class="ans">Ответ: ${fmt(res)}</div>`;
    if(window.katex)kview(o,{steps,res,st});H=[{e:s,r:fmt(res)},...H.filter(h=>h.e!=s)].slice(0,30);save();drawH();stat('solved');track(s,steps,res);
  }catch(e){stat('err');if(e.message=='Деление на ноль')stat('dz');o.innerHTML=`<p class="err">⚠ ${e.message}</p>`}}
$('calc').onclick=run;$('expr').onkeydown=e=>{if(e.key=='Enter')run()};
$('clr').onclick=()=>{$('expr').value='';$('out').innerHTML=''};
// ---------- Фото и OCR ----------
let img=null;
function setFile(f){if(!f||!f.type.startsWith('image/'))return;img=f;stat('photo');const p=$('prev');p.src=URL.createObjectURL(f);p.style.display='block';$('ocr').disabled=false;$('msg').textContent=''}
$('drop').onclick=()=>$('file').click();$('file').onchange=e=>setFile(e.target.files[0]);
$('drop').ondragover=e=>{e.preventDefault();$('drop').classList.add('on')};
$('drop').ondragleave=()=>$('drop').classList.remove('on');
$('drop').ondrop=e=>{e.preventDefault();$('drop').classList.remove('on');setFile(e.dataTransfer.files[0])};
function prep(f){return new Promise(res=>{const im=new Image();im.onload=()=>{
  const sc=Math.max(1,Math.min(3,1200/Math.max(im.width,im.height))),pad=30,W=Math.round(im.width*sc),Hh=Math.round(im.height*sc);
  const c=document.createElement('canvas');c.width=W+2*pad;c.height=Hh+2*pad;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(im,pad,pad,W,Hh);
  const d=x.getImageData(0,0,c.width,c.height),p=d.data,h=new Array(256).fill(0),n=p.length/4;
  for(let i=0;i<p.length;i+=4){const g=Math.round(.299*p[i]+.587*p[i+1]+.114*p[i+2]);p[i]=g;h[g]++}
  let sum=0;for(let i=0;i<256;i++)sum+=i*h[i];let sB=0,wB=0,mx=0,th=128;
  for(let i=0;i<256;i++){wB+=h[i];if(!wB)continue;const wF=n-wB;if(!wF)break;sB+=i*h[i];const v=wB*wF*(sB/wB-(sum-sB)/wF)**2;if(v>mx){mx=v;th=i}}
  for(let i=0;i<p.length;i+=4){p[i]=p[i+1]=p[i+2]=p[i]>th?255:0}
  x.putImageData(d,0,0);c.toBlob(res)};im.src=URL.createObjectURL(f)})}
let wk=null;
$('ocr').onclick=async()=>{
  const m=$('msg'),b=$('ocr');b.disabled=true;stat('ocr');m.textContent='Готовлю изображение…';
  try{
    if(!window.Tesseract)throw new Error('Tesseract.js не загрузился — проверь интернет');
    const blob=await prep(img);
    if(!wk){wk=await Tesseract.createWorker('eng',1,{logger:x=>{if(x.status)m.textContent=(/load|init/.test(x.status)?'Загрузка данных OCR ':'Распознаю ')+Math.round((x.progress||0)*100)+'%'}});
      await wk.setParameters({tessedit_pageseg_mode:'6',preserve_interword_spaces:'1'})}
    const r=await Promise.race([wk.recognize(blob),new Promise((_,j)=>setTimeout(()=>j(new Error('таймаут 2 минуты: данные языка не скачались (на опубликованной странице они заблокированы — запусти проект локально)')),120000))]);
    let t=r.data.text.trim().split('\n').map(x=>x.trim()).filter(Boolean).join('');
    t=t.replace(/(?<=\d)[OО]|[OО](?=\d)/g,'0').replace(/(?<=\d)[lI|]|[lI|](?=\d)/g,'1');
    if(!t)throw new Error('текст не найден');
    $('expr').value=t;
    m.textContent=/[A-Za-zА-Яа-я]/.test(t)?'Распознано, но в выражении есть буквы/переменные. Дроби «в два этажа» OCR не читает — перепиши в строку, например 3/m.':'Готово. Проверь выражение и поправь, если OCR ошибся.';
    run();
  }catch(e){m.textContent='Не удалось распознать: '+e.message+'. Введи выражение вручную — решение работает без OCR.';$('expr').focus()}
  b.disabled=false};

const ld=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
let S=ld('m67s',{});
const AL=[
['solved',1,'Первая кровь: решён 1 пример'],['solved',5,'Разогрев: 5 примеров'],['solved',10,'Десяточка'],['solved',25,'Четверть сотни'],['solved',50,'Полтинник'],['solved',100,'Сотка: 100 примеров'],['solved',250,'Легенда зачёта: 250 примеров'],
['steps',5,'Длинное решение: 5 шагов'],['steps',10,'Марафон: 10 шагов в одном примере'],
['add',10,'Мастер плюса ×10'],['sub',10,'Мастер минуса ×10'],['mul',10,'Мастер умножения ×10'],['div',10,'Мастер деления ×10'],['pow',5,'Степенной качок ×5'],
['par',1,'Первые скобки'],['par',10,'Скобочный маньяк ×10'],['neg',1,'Ушёл в минус'],['dec',1,'Дробная душа: десятичные числа'],['negr',1,'Отрицательный ответ'],['zero',1,'Ровно ноль'],['big',1,'Ответ от 1000'],['sixseven',1,'67 😎 тот самый ответ'],
['err',1,'Первая ошибка — это нормально'],['err',5,'Упорный: 5 ошибок ввода'],['dz',1,'Поделил на ноль, математики плачут'],
['photo',1,'Первое фото примера'],['photo',5,'Фотограф: 5 снимков'],['ocr',1,'Запустил OCR'],
['hre',1,'Вернулся к старому примеру'],['hclr',1,'Чистая история'],
['note',1,'Первая заметка'],['note',5,'Блокнотный человек: 5 заметок'],['notes',10,'10 заметок одновременно'],
['cmp',1,'Компас включён'],['geo',1,'Нашёл себя на карте'],['wx',1,'Узнал погоду у себя'],['ai',1,'Спросил ИИ-ассистента'],['ai',10,'Ученик ИИ: 10 вопросов'],['aisolve',1,'ИИ решил задачу по фото'],['donate',1,'Щедрая душа: заглянул на донаты'],['radio',1,'Включил радио'],['radio',5,'Меломан: 5 станций'],['map',1,'Нашёл место на карте'],['route2',1,'Построил маршрут на карте'],['chess',1,'Сыграл партию в шахматы'],['chesswin',1,'Обыграл компьютер'],['sync',1,'Облако: данные в аккаунте'],['theme',1,'Сменил тему'],['pwa',1,'Установил приложение'],['auth',1,'Завёл аккаунт'],['msg',1,'Первое сообщение в чате'],['msg',25,'Болтун: 25 сообщений'],['route',1,'Проложил маршрут'],
['rec',1,'Первая запись диктофона'],['rec',5,'Подкастер: 5 записей'],
['sw',1,'Запустил секундомер'],['alarm',1,'Поставил будильник'],
['rnd',1,'Первый рандом'],['rnd',5,'5 бросков судьбы'],['rnd',25,'Игрок в кости: 25 бросков'],['rq',1,'Случайный пример'],['rq',10,'Генератор пыток: 10 примеров'],
['cnt',10,'Счётчик дошёл до 10'],['cnt',50,'Счётчик дошёл до 50'],['cneg',1,'Счётчик ушёл ниже нуля'],
['tabs',3,'Исследователь: 3 вкладки'],['tabs',6,'Видел всё: все вкладки'],
['nick',1,'Придумал никнейм'],['days',2,'Вернулся на второй день'],['days',7,'Неделя с MOGGулятором'],
['night',1,'Сова: решал ночью'],['early',1,'Жаворонок: решал рано утром']];
function stat(k,v){const o=S[k]||0;S[k]=v===undefined?o+1:Math.max(o,v);sv('m67s',S);AL.forEach(([a,n,t])=>{if(a==k&&o<n&&S[k]>=n)toast('🏆 '+t)});drawA();cloudPush()}
function drawA(){const n=AL.filter(([k,m])=>(S[k]||0)>=m).length;
 $('al').innerHTML=`<b>Открыто ${n} из ${AL.length}</b><div class="ag">`+AL.map(([k,m,t])=>{const v=Math.min(S[k]||0,m),ok=v>=m;
 return`<div class="ac${ok?' ok':''}"><div>${ok?'🏆':'🔒'} ${t}</div>${ok?'':`<div class="pb2"><i style="width:${v/m*100}%"></i></div><small>${v}/${m}</small>`}</div>`}).join('')+'</div>'}
$('nick').value=ld('m67n','');$('nick').oninput=e=>{sv('m67n',e.target.value);if(e.target.value.trim())stat('nick')};
// вкладки
const secs=[...document.querySelectorAll('section')];
$('tabs').innerHTML=secs.map(x=>`<button data-t="${x.dataset.t}">${x.dataset.n}</button>`).join('');
const V=new Set();$('tabs').onclick=e=>{const t=e.target.dataset.t;if(!t)return;V.add(t);stat('tabs',V.size);secs.forEach(x=>x.classList.toggle('on',x.dataset.t==t));[...$('tabs').children].forEach(b=>b.classList.toggle('on',b.dataset.t==t))};
$('tabs').firstChild.click();
// часы и будильник
let alarm=null;const p2=n=>String(n).padStart(2,'0');
function beep(){try{const c=new AudioContext(),o=c.createOscillator();o.connect(c.destination);o.frequency.value=880;o.start();setTimeout(()=>o.stop(),1500)}catch(e){}}
setInterval(()=>{const d=new Date();$('clk').textContent=`${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;
 if(alarm&&`${p2(d.getHours())}:${p2(d.getMinutes())}`==alarm&&d.getSeconds()<2){beep();$('alst').textContent='⏰ Звонок!';alarm=null}},500);
$('alset').onclick=()=>{alarm=$('alt').value||null;if(alarm)stat('alarm');$('alst').textContent=alarm?'Будильник на '+alarm:''};
let t0=0,acc=0,tm=null;const swf=ms=>`${Math.floor(ms/60000)}:${p2(Math.floor(ms/1000)%60)}.${Math.floor(ms/100)%10}`;
$('sws').onclick=()=>{if(tm){clearInterval(tm);tm=null;acc+=Date.now()-t0;$('sws').textContent='Старт'}else{t0=Date.now();stat('sw');tm=setInterval(()=>$('sw').textContent=swf(acc+Date.now()-t0),100);$('sws').textContent='Стоп'}};
$('swr').onclick=()=>{clearInterval(tm);tm=null;acc=0;$('sw').textContent='0:00.0';$('sws').textContent='Старт'};
// компас
$('cmp').onclick=async()=>{try{
 if(window.DeviceOrientationEvent&&DeviceOrientationEvent.requestPermission&&await DeviceOrientationEvent.requestPermission()!='granted')throw 0;
 const h=e=>{const a=e.webkitCompassHeading??(e.alpha==null?null:(360-e.alpha)%360);if(a==null)return;$('arrow').style.transform=`rotate(${-a}deg)`;
  const D=['С','СВ','В','ЮВ','Ю','ЮЗ','З','СЗ'];$('hd').textContent=Math.round(a)+'° '+D[Math.round(a/45)%8];stat('cmp')};
 addEventListener('deviceorientationabsolute',h,true);addEventListener('deviceorientation',h,true);$('cmsg').textContent='Работает на телефонах с датчиком. На компьютере стрелка не двигается.'}catch(e){$('cmsg').textContent='Нет доступа к датчику ориентации.'}};
// погода через серверную функцию /api/weather
const WC=[[[0],'☀️ Ясно'],[[1,2],'🌤 Малооблачно'],[[3],'☁️ Пасмурно'],[[45,48],'🌫 Туман'],[[51,53,55,56,57],'🌦 Морось'],[[61,63,65,66,67],'🌧 Дождь'],[[71,73,75,77],'🌨 Снег'],[[80,81,82],'🌧 Ливень'],[[85,86],'🌨 Снегопад'],[[95,96,99],'⛈ Гроза']];
async function wx(la,lo){const o=$('mlinks');const box=$('wxout')||(o.insertAdjacentHTML('beforebegin','<div id="wxout" style="margin:10px 0"></div>'),$('wxout'));
 box.textContent='Загружаю погоду…';
 try{const r=await fetch(`/api/weather?lat=${la}&lon=${lo}`),d=await r.json();if(!r.ok)throw new Error(d.error||r.status);
  const w=(WC.find(([c])=>c.includes(d.code))||[0,'Погода'])[1];
  box.innerHTML=`<b>${w}</b>, ${Math.round(d.temp)}°C (ощущается ${Math.round(d.feels)}°)<br><small style="color:var(--mut)">сегодня ${Math.round(d.min)}…${Math.round(d.max)}°C · ветер ${Math.round(d.wind)} км/ч · влажность ${d.humidity}%</small>`;stat('wx')}
 catch(e){box.textContent='Погода недоступна: '+e.message+' (локально через Live Server /api не работает — используй npx vercel dev)'}}
// навигатор
let pos=null;
$('geo').onclick=()=>{if(!navigator.geolocation){$('gout').textContent='Геолокация недоступна';return}
 navigator.geolocation.getCurrentPosition(r=>{pos=r.coords;const la=pos.latitude.toFixed(5),lo=pos.longitude.toFixed(5);stat('geo');wx(la,lo);
  $('gout').innerHTML=`📍 ${la}, ${lo} (±${Math.round(pos.accuracy)} м)`;
  $('mlinks').innerHTML=`<a target="_blank" rel="noopener" href="https://www.openstreetmap.org/?mlat=${la}&mlon=${lo}&zoom=16">Открыть на карте</a> · <a target="_blank" rel="noopener" href="https://yandex.ru/pogoda/?lat=${la}&lon=${lo}">Погода здесь</a>`},
 ()=>$('gout').textContent='Не удалось получить местоположение (проверь разрешение).')};
$('route').onclick=()=>{const q=$('dest').value.trim();if(!q)return;stat('route');const f=pos?`${pos.latitude},${pos.longitude}`:'';
 $('mlinks').innerHTML=`<a target="_blank" rel="noopener" href="https://yandex.ru/maps/?rtext=${encodeURIComponent(f+'~'+q)}&rtt=auto">Открыть маршрут до «${q.replace(/[<>&]/g,'')}»</a>`};
// счётчик, рандом
let c=0;const cs=d=>{c=d?c+d:0;$('cnt').textContent=c;stat('cnt',c);if(c<0)stat('cneg')};$('cm').onclick=()=>cs(-1);$('cp').onclick=()=>cs(1);$('cz').onclick=()=>cs(0);
$('rn').onclick=()=>{const a=+$('rmin').value,b=+$('rmax').value,lo=Math.min(a,b),hi=Math.max(a,b);$('rout').textContent=lo+Math.floor(Math.random()*(hi-lo+1));stat('rnd')};
$('rq').onclick=()=>{const r=n=>1+Math.floor(Math.random()*n),o=['+','-','*','/'][r(4)-1];let a=r(20),b=r(12);if(o=='/'){a=a*b}
 const e=`(${a}${o}${b})*${r(9)}+${r(30)}`;$('rout').innerHTML=`<span style="font-size:20px">${e.replace('*','×')}</span>`;
 $('expr').value=e;stat('rnd');stat('rq')};
// диктофон
let mr=null,ch=[];$('rec').onclick=async()=>{if(mr){mr.stop();return}try{
 const st=await navigator.mediaDevices.getUserMedia({audio:true});mr=new MediaRecorder(st);ch=[];mr.ondataavailable=e=>ch.push(e.data);
 mr.onstop=()=>{st.getTracks().forEach(t=>t.stop());const u=URL.createObjectURL(new Blob(ch,{type:mr.mimeType}));
  $('recs').insertAdjacentHTML('afterbegin',`<p><audio controls src="${u}"></audio></p>`);mr=null;$('rec').textContent='● Запись';stat('rec')};
 mr.start();$('rec').textContent='■ Стоп'}catch(e){$('recs').textContent='Нет доступа к микрофону.'}};
// заметки
let N=ld('m67nt',[]);function drawN(){$('nl').innerHTML=N.map((t,i)=>`<div class="h" data-i="${i}"><span style="white-space:pre-wrap;font-family:inherit">${t.replace(/[<>&]/g,'')}</span><span>✕</span></div>`).join('')}
$('nadd').onclick=()=>{const t=$('nt').value.trim();if(!t)return;N.unshift(t);sv('m67nt',N);$('nt').value='';drawN();stat('note');stat('notes',N.length)};
$('nl').onclick=e=>{const d=e.target.closest('.h');if(d){N.splice(d.dataset.i,1);sv('m67nt',N);drawN();cloudPush()}};
// чат и аккаунты (серверные функции /api/auth и /api/messages)
let me=null,lastId=0;
async function api(p,o){const r=await fetch(p,o),d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Ошибка '+r.status);return d}
const post=(p,b)=>api(p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});
function chatUI(){$('cauth').style.display=me?'none':'block';$('cbox').style.display=me?'block':'none';CLOUD=!!me;if(me){$('cwho').textContent=me.nick;pull();cloudPull()}}
async function loadMe(){try{me=(await api('/api/auth?action=me')).user}catch(e){me=null}chatUI()}
function authDo(a){$('cerr').textContent='';post('/api/auth?action='+a,{nick:$('cn').value.trim(),password:$('cpw').value})
 .then(d=>{me=d.user;lastId=0;$('cl').innerHTML='';$('cpw').value='';stat('auth');chatUI()}).catch(e=>$('cerr').textContent=e.message)}
$('clog').onclick=()=>authDo('login');$('creg').onclick=()=>authDo('register');
$('cpw').onkeydown=e=>{if(e.key=='Enter')authDo('login')};
$('cout').onclick=async()=>{try{if(CLOUD)await post('/api/sync',{data:{h:H,n:N,s:S}})}catch(e){}try{await post('/api/auth?action=logout',{})}catch(e){}
 H=[];N=[];S={};sv('m67s',S);sv('m67nt',N);save();me=null;lastId=0;$('cl').innerHTML='';chatUI();drawH();drawN();drawA()};
async function pull(){if(!me)return;try{const d=await api('/api/messages?after='+lastId),box=$('cl'),down=box.scrollTop+box.clientHeight>=box.scrollHeight-30||!lastId;
 d.messages.forEach(m=>{const el=document.createElement('div');el.className='m'+(m.nick==me.nick?' me':'');
  const b=document.createElement('b');b.textContent=m.nick+': ';const t=document.createElement('span');t.textContent=m.text;
  const s=document.createElement('small');s.textContent=new Date(m.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  el.append(b,t,s);box.append(el);lastId=m.id});if(d.messages.length&&down)box.scrollTop=box.scrollHeight}
 catch(e){if(e.message=='Нужно войти'){me=null;chatUI()}}}
async function sendMsg(){const t=$('ci').value.trim();if(!t)return;try{await post('/api/messages',{text:t});$('ci').value='';stat('msg');pull()}catch(e){$('cerr').textContent=e.message;alert(e.message)}}
$('cs').onclick=sendMsg;$('ci').onkeydown=e=>{if(e.key=='Enter')sendMsg()};
setInterval(()=>{if(document.querySelector('section[data-t=chat]').classList.contains('on'))pull()},3000);
loadMe();
// Photomath-стиль: KaTeX + решение с ИИ + ассистент
function renderMath(o,trust){o.querySelectorAll('.mth').forEach(e=>{const t=decodeURIComponent(e.dataset.t);try{katex.render(t,e,{displayMode:true,throwOnError:false,trust})}catch(_){e.textContent=t}})}
const mth=t=>`<div class="mth" data-t="${encodeURIComponent(t)}"></div>`;
const esc=t=>String(t).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const card=(i,note,body)=>`<div class="stc"><div class="num">${i}</div><div class="stb"><div class="note">${note}</div>${body}</div></div>`;
function kview(o,{steps,res,st}){o.innerHTML=`<div class="st"><small>Задача</small>${mth(st)}</div>`+
 steps.map((x,i)=>card(i+1,x.note,mth(x.bt)+'<div class="arr">⬇</div>'+mth(x.at))).join('')+`<div class="ans2">Ответ</div>${mth('\\boxed{'+fmt(res)+'}')}`;renderMath(o,true)}
function kai(o,d){o.innerHTML=`<div class="st"><small>Задача (распознано ИИ)</small>${mth(d.problem)}</div>`+
 d.steps.map((x,i)=>card(i+1,esc(x.explain),mth(x.math))).join('')+`<div class="ans2">Ответ</div>${mth('\\boxed{'+d.answer+'}')}`;renderMath(o,false)}
const imgB64=f=>new Promise(res=>{const im=new Image();im.onload=()=>{const sc=Math.min(1,1280/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*sc);c.height=Math.round(im.height*sc);
 const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.85))};im.src=URL.createObjectURL(f)});
$('aisolve').onclick=async()=>{const o=$('out'),b=$('aisolve');
 if(!me){o.innerHTML='<p class="err">Войди в аккаунт во вкладке «Чат», чтобы пользоваться ИИ.</p>';return}
 b.disabled=true;o.innerHTML='<p style="color:var(--mut)">ИИ решает… (до 30 секунд)</p>';
 try{const body={text:$('expr').value.trim()};if(img)body.image=await imgB64(img);kai(o,await post('/api/solve',body));stat('aisolve')}
 catch(e){o.innerHTML=`<p class="err">⚠ ${esc(e.message)}</p>`}b.disabled=false};
function rich(t){return t.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g).map(p=>{const d=p.startsWith('$$'),m=d||(p.length>1&&p[0]=='$'&&p.endsWith('$'));
 if(m&&window.katex){try{return katex.renderToString(p.slice(d?2:1,d?-2:-1),{displayMode:d,throwOnError:false})}catch(e){}}return esc(p).replace(/\n/g,'<br>')}).join('')}
const AIH=[];
function aiAdd(role,text){const d=document.createElement('div');d.className='m'+(role=='user'?' me':'');d.innerHTML=`<b>${role=='user'?'Ты':'🤖'}:</b> `+rich(text);$('aiL').append(d);$('aiL').scrollTop=$('aiL').scrollHeight}
async function aiSend(){const t=$('aiI').value.trim();if(!t)return;
 if(!me){aiAdd('assistant','Войди в аккаунт во вкладке «Чат», чтобы пользоваться ИИ.');return}
 $('aiI').value='';aiAdd('user',t);AIH.push({role:'user',content:t});$('aiS').disabled=true;
 try{const d=await post('/api/assistant',{messages:AIH.slice(-12)});AIH.push({role:'assistant',content:d.reply});aiAdd('assistant',d.reply);stat('ai')}
 catch(e){AIH.pop();aiAdd('assistant','⚠ '+e.message)}$('aiS').disabled=false}
$('aiS').onclick=aiSend;$('aiI').onkeydown=e=>{if(e.key=='Enter')aiSend()};
// ---- облако, тема, PWA, тосты ----
var CLOUD=false,cpT=null;
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.append(d);setTimeout(()=>d.remove(),3200)}
function cloudPush(){if(!CLOUD)return;clearTimeout(cpT);cpT=setTimeout(()=>post('/api/sync',{data:{h:H,n:N,s:S}}).catch(()=>{}),2000)}
async function cloudPull(){try{const d=(await api('/api/sync')).data||{},seen=new Set();
 H=[...H,...(d.h||[])].filter(x=>x&&!seen.has(x.e)&&seen.add(x.e)).slice(0,30);
 N=[...new Set([...N,...(d.n||[])])];
 for(const k of Object.keys(d.s||{})){const v=d.s[k];if(k=='dl'&&Array.isArray(v))S.dl=[...new Set([...(S.dl||[]),...v])];else if(typeof v=='number')S[k]=Math.max(S[k]||0,v)}
 S.days=Math.max(S.days||0,(S.dl||[]).length);
 sv('m67s',S);sv('m67nt',N);save();drawH();drawN();drawA();stat('sync',1)}catch(e){}}
const curTheme=()=>document.documentElement.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
{const t=ld('m67t',null);if(t)document.documentElement.dataset.theme=t}
$('thm').onclick=()=>{const n=curTheme()=='dark'?'light':'dark';document.documentElement.dataset.theme=n;sv('m67t',n);stat('theme')};
$('don').onclick=()=>stat('donate');
addEventListener('appinstalled',()=>stat('pwa'));
if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
// ---- карта ----
let map,mDest=null,mFrom=null,mMk={},rl=null,PL=[];
function initMap(){if(map||!window.L)return;map=L.map('map').setView([30,10],2);
 L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
 map.on('click',e=>setPt('to',e.latlng.lat,e.latlng.lng,'Точка назначения'))}
function setPt(w,la,lo,name){if(w=='to')mDest={la,lo};else mFrom={la,lo};if(mMk[w])map.removeLayer(mMk[w]);mMk[w]=L.marker([la,lo]).addTo(map).bindPopup(esc(name)).openPopup()}
function pick(i){const p=PL[i];setPt('to',p.lat,p.lon,p.name.split(',')[0]);map.setView([p.lat,p.lon],14);stat('map')}
$('mapGo').onclick=async()=>{const q=$('mapQ').value.trim();if(!q)return;initMap();if(!map){$('mapRes').textContent='Карта не загрузилась (проверь интернет)';return}
 $('mapRes').textContent='Ищу…';try{PL=(await api('/api/maps?action=geocode&q='+encodeURIComponent(q))).places;
  $('mapRes').innerHTML=PL.length?PL.map((p,i)=>`<div class="h" data-i="${i}"><span>${esc(p.name)}</span></div>`).join(''):'Ничего не найдено';if(PL.length)pick(0)}
 catch(e){$('mapRes').textContent='⚠ '+e.message}};
$('mapQ').onkeydown=e=>{if(e.key=='Enter')$('mapGo').click()};
$('mapRes').onclick=e=>{const d=e.target.closest('.h');if(d)pick(+d.dataset.i)};
$('mapMe').onclick=()=>{initMap();if(!map||!navigator.geolocation){$('mapInfo').textContent='Недоступно';return}
 navigator.geolocation.getCurrentPosition(r=>{setPt('from',r.coords.latitude,r.coords.longitude,'Я здесь');map.setView([r.coords.latitude,r.coords.longitude],14)},()=>$('mapInfo').textContent='Нет доступа к геопозиции')};
$('mapRt').onclick=async()=>{if(!mFrom||!mDest){$('mapInfo').textContent='Нужны обе точки: нажми «Я здесь» и выбери место назначения.';return}
 $('mapInfo').textContent='Строю маршрут…';
 try{const d=await api(`/api/maps?action=route&from=${mFrom.la},${mFrom.lo}&to=${mDest.la},${mDest.lo}&profile=${$('mapProf').value}`);
  if(rl)map.removeLayer(rl);rl=L.polyline(d.coords,{weight:5}).addTo(map);map.fitBounds(rl.getBounds(),{padding:[20,20]});
  $('mapInfo').innerHTML=`<b>${(d.distance/1000).toFixed(1)} км</b>, около ${Math.round(d.duration/60)} мин`;stat('route2')}
 catch(e){$('mapInfo').textContent='⚠ '+e.message}};
// ---- радио ----
let ST=[];
async function rdSearch(){const q=$('rdQ').value.trim()||'шансон';$('rdL').textContent='Ищу…';
 try{ST=(await api('/api/radio?q='+encodeURIComponent(q))).stations;
  $('rdL').innerHTML=ST.length?ST.map((s,i)=>`<div class="h" data-i="${i}"><span>${esc(s.name)}</span><small>${esc(s.country)}</small></div>`).join(''):'Ничего не найдено'}
 catch(e){$('rdL').textContent='⚠ '+e.message+' (локально через Live Server /api не работает)'}}
$('rdGo').onclick=rdSearch;$('rdQ').onkeydown=e=>{if(e.key=='Enter')rdSearch()};
$('rdL').onclick=e=>{const d=e.target.closest('.h');if(!d)return;const s=ST[d.dataset.i],au=$('rau');au.src=s.url;au.play().catch(()=>{});$('rdNow').textContent='▶ '+s.name;stat('radio')};
// ---- шахматы (правила — chess.js, ИИ — минимакс на 2 хода) ----
let G=null,sel=null,vsAI=true;
const GL={p:'♟\uFE0E',n:'♞\uFE0E',b:'♝\uFE0E',r:'♜\uFE0E',q:'♛\uFE0E',k:'♚\uFE0E'},VAL={p:1,n:3,b:3,r:5,q:9,k:0};
function ev(){let s=0;for(const r of G.board())for(const p of r)if(p)s+=(p.color=='w'?1:-1)*VAL[p.type];return s}
function mm(d,al,be,w){if(G.in_checkmate())return w?-1000-d:1000+d;if(G.in_draw()||G.in_stalemate())return 0;if(!d)return ev();
 let best=w?-1e9:1e9;for(const m of G.moves()){G.move(m);const v=mm(d-1,al,be,!w);G.undo();
  if(w){best=Math.max(best,v);al=Math.max(al,v)}else{best=Math.min(best,v);be=Math.min(be,v)}if(be<=al)break}return best}
function aiMove(){if(!G||G.game_over())return;const w=G.turn()=='w';let bs=w?-1e9:1e9,bm=[];
 for(const m of G.moves()){G.move(m);const v=mm(1,-1e9,1e9,!w);G.undo();if(w?v>bs:v<bs){bs=v;bm=[m]}else if(v==bs)bm.push(m)}
 G.move(bm[Math.floor(Math.random()*bm.length)]);chDraw()}
function chDraw(){const b=G.board(),lg=sel?G.moves({square:sel,verbose:true}).map(m=>m.to):[];let h='';
 for(let r=0;r<8;r++)for(let f=0;f<8;f++){const sq='abcdefgh'[f]+(8-r),p=b[r][f];
  h+=`<div class="sq ${(r+f)%2?'d':'l'}${sq==sel?' sel':''}${lg.includes(sq)?' lg':''}" data-s="${sq}">${p?`<span class="${p.color=='w'?'cw':'cb'}">${GL[p.type]}</span>`:''}</div>`}
 $('chB').innerHTML=h;let t;
 if(G.in_checkmate()){const win=G.turn()=='b'?'Белые':'Чёрные';t=`Мат! Победили ${win.toLowerCase()} 🎉`;stat('chess');if(vsAI&&G.turn()=='b')stat('chesswin')}
 else if(G.game_over()){t='Ничья';stat('chess')}else t=(G.turn()=='w'?'Ход белых':'Ход чёрных')+(G.in_check()?' · шах!':'');
 $('chSt').textContent=t}
function chNew(){if(!window.Chess){$('chSt').textContent='Шахматный движок не загрузился (проверь интернет)';return}G=new Chess();sel=null;vsAI=$('chMode').value=='ai';chDraw()}
$('chNew').onclick=chNew;$('chMode').onchange=chNew;
$('chB').onclick=e=>{const s=e.target.closest('.sq')&&e.target.closest('.sq').dataset.s;if(!s||!G||G.game_over())return;
 if(vsAI&&G.turn()!='w')return;
 if(sel&&G.moves({square:sel,verbose:true}).some(m=>m.to==s)){G.move({from:sel,to:s,promotion:'q'});sel=null;chDraw();if(vsAI&&!G.game_over())setTimeout(aiMove,250);return}
 const p=G.get(s);sel=p&&p.color==G.turn()?s:null;chDraw()};
$('tabs').addEventListener('click',e=>{const t=e.target.dataset.t;
 if(t=='map'){initMap();setTimeout(()=>map&&map.invalidateSize(),80)}
 if(t=='radio'&&!ST.length)rdSearch();if(t=='chess'&&!G)chNew()});
function track(s,st,res){stat('steps',st.length);const m={add:/\+/,sub:/-/,mul:/\*/,div:/\//,pow:/\^/,par:/\(/};
 for(const k in m)if(m[k].test(s))stat(k);if(/^-|[(*\/^+-]-/.test(s))stat('neg');if(/\d\.\d/.test(s))stat('dec');
 if(res<0)stat('negr');if(res===0)stat('zero');if(Math.abs(res)>=1000)stat('big');if(res===67)stat('sixseven')}
{if(Array.isArray(S.days)){S.dl=S.days;S.days=0}const d=new Date(),h=d.getHours();S.dl=S.dl||[];if(!S.dl.includes(d.toDateString()))S.dl.push(d.toDateString());stat('days',S.dl.length);if(h<5)stat('night');else if(h<7)stat('early')}
drawN();drawA();
drawH();
