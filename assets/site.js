/* 운명을 읽다 — 별 캔버스 · 인트로 · 화면 연출 · 내 띠 · 신청서
   인트로 시간표는 INTRO 한 곳(ms, 페이지를 연 때부터). CSS 는 단계 클래스(ph-*)에 맞춰 움직인다. */
'use strict';
var INTRO = { copy: 150, core: 2150, wave: 2750, reveal: 3600, out: 3650, done: 4700 };
var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

document.getElementById('yr').textContent = new Date().getFullYear();

/* ── 별이 떠다니는 밤하늘(배경 캔버스 하나, 인트로와 본문이 같이 씀) ── */
var Sky = (function () {
  var c = document.getElementById('sky');
  var none = { speed: function () {}, flash: function () {} };
  if (!c || !c.getContext) return none;
  var ctx = c.getContext('2d');
  var W = 0, H = 0, dpr = 1, stars = [], spd = 1, spdTo = 1, glow = 0, last = 0, shoot = null, nextShoot = 0;
  var sprite = document.createElement('canvas');            // 큰 별의 번짐(한 번만 그려 둠)
  sprite.width = sprite.height = 64;
  (function () {
    var g = sprite.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.16, 'rgba(255,246,222,.9)');
    gr.addColorStop(.42, 'rgba(232,197,122,.22)'); gr.addColorStop(1, 'rgba(232,197,122,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  })();
  function mk() {
    var z = Math.pow(Math.random(), 1.7);                    // 가까운 별(z 큼)일수록 크고 빠르게 떠오름
    return { x: Math.random() * W, y: Math.random() * H, z: z, r: .35 + z * 1.5, vx: (Math.random() - .5) * .08, vy: -(.035 + z * .2),
      tw: Math.random() * 6.283, ts: .008 + Math.random() * .028, gold: Math.random() < .2, big: z > .86 };
  }
  function size() {
    var w = innerWidth, h = Math.max(innerHeight, H);         // 휴대폰 주소창이 접혀도 줄이지 않음(별이 튀지 않게)
    var wide = w !== W;
    W = w; H = h; dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); c.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (wide || !stars.length) {
      var n = Math.round(Math.min(W < 720 ? 120 : 210, W * H / 4000));
      stars = []; for (var i = 0; i < n; i++) stars.push(mk());
    }
  }
  function frame(t) {
    var dt = last ? Math.min(3, (t - last) / 16.67) : 1; last = t;
    spd += (spdTo - spd) * Math.min(1, .04 * dt); glow *= Math.pow(.95, dt);
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      s.x += s.vx * spd * dt; s.y += s.vy * spd * dt;
      if (s.y < -6) { s.y = H + 6; s.x = Math.random() * W; }
      if (s.x < -6) s.x = W + 6; else if (s.x > W + 6) s.x = -6;
      s.tw += s.ts * dt;
      var a = Math.min(1, (.3 + .7 * Math.abs(Math.sin(s.tw))) * (.4 + s.z * .6) + glow);
      ctx.globalAlpha = a;
      if (s.big) { var d = s.r * 6; ctx.drawImage(sprite, s.x - d, s.y - d, d * 2, d * 2); }
      else { ctx.fillStyle = s.gold ? '#f3d99a' : '#e8e5ff'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.fill(); }
    }
    if (!shoot && t > nextShoot && spdTo <= 1 && nextShoot) {   // 가끔 별똥별
      shoot = { x: W * (.35 + Math.random() * .6), y: H * Math.random() * .45, vx: -(8 + Math.random() * 5), vy: 3.2 + Math.random() * 2, life: 0 };
    }
    if (shoot) {
      shoot.x += shoot.vx * dt; shoot.y += shoot.vy * dt; shoot.life += dt;
      var fade = Math.max(0, 1 - shoot.life / 48), tx = shoot.x - shoot.vx * 13, ty = shoot.y - shoot.vy * 13;
      var gr = ctx.createLinearGradient(shoot.x, shoot.y, tx, ty);
      gr.addColorStop(0, 'rgba(255,248,226,' + fade + ')'); gr.addColorStop(1, 'rgba(255,248,226,0)');
      ctx.globalAlpha = 1; ctx.strokeStyle = gr; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(shoot.x, shoot.y); ctx.lineTo(tx, ty); ctx.stroke();
      if (fade <= 0) { shoot = null; nextShoot = t + 5000 + Math.random() * 7000; }
    }
    ctx.globalAlpha = 1;
    if (!RM) requestAnimationFrame(frame);
  }
  var pend = 0;
  addEventListener('resize', function () { if (!pend) pend = requestAnimationFrame(function () { pend = 0; size(); if (RM) frame(performance.now()); }); });
  size();
  nextShoot = performance.now() + 6000;
  requestAnimationFrame(frame);
  return {
    speed: function (v) { spdTo = v; if (v > spd) spd = v; },
    flash: function (v) { glow = v; }
  };
})();

/* ── 인트로: 별 → 문구 → 달 자리에 빛이 모였다가 화면 가득 번짐 → 본문 ── */
(function () {
  var html = document.documentElement, el = document.getElementById('intro');
  if (!el) return;
  if (!html.classList.contains('is-intro')) { el.remove(); return; }
  try { sessionStorage.setItem('rufIntro', '1'); } catch (e) {}
  var STEPS = [['ph-copy', 'copy'], ['ph-core', 'core'], ['ph-wave', 'wave'], ['intro-reveal', 'reveal'], ['ph-out', 'out'], ['done', 'done']];
  var timers = [];
  function center() {                                        // 빛은 첫 화면 달이 있을 자리에서 시작
    var m = document.querySelector('.hero .moon'); if (!m) return;
    var r = m.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    var far = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    el.style.setProperty('--bx', x + 'px'); el.style.setProperty('--by', y + 'px');
    el.style.setProperty('--ws', (far / 36 + 2).toFixed(1));   // 빛 그림(120px)의 거의 불투명한 반지름 ≈ 39px
    el.style.setProperty('--rs', (far / 55 + 1).toFixed(1));
  }
  function step(name) {
    if (name === 'done') { el.remove(); html.classList.remove('is-intro', 'ph-copy', 'ph-core', 'ph-wave', 'ph-out'); return; }
    if (name === 'ph-core') { center(); Sky.speed(1.5); }
    if (name === 'ph-wave') { center(); Sky.flash(.7); }
    if (name === 'intro-reveal') Sky.speed(1);
    html.classList.add(name);
  }
  function run(from) {
    timers.forEach(clearTimeout);
    timers = STEPS.map(function (p) { return setTimeout(function () { step(p[0]); }, Math.max(0, INTRO[p[1]] - from)); });
  }
  function skip() { if (html.classList.contains('ph-wave')) return; run(INTRO.core); }
  el.addEventListener('click', skip);
  addEventListener('keydown', function k(e) { if (!document.getElementById('intro')) return removeEventListener('keydown', k); if (/^(Escape|Enter| )$/.test(e.key)) skip(); });
  center();
  Sky.speed(3.4);                                            // 처음엔 별이 조금 빠르게 흘러감
  run(0);
})();

/* ── 머리: 내려가면 배경 ── */
(function () {
  var nav = document.getElementById('nav'), on = false, tick = 0;
  function upd() { tick = 0; var v = scrollY > 12; if (v !== on) { on = v; nav.classList.toggle('solid', v); } }
  addEventListener('scroll', function () { if (!tick) tick = requestAnimationFrame(upd); }, { passive: true });
  upd();
})();

/* ── 화면에 들어오면 나타나기(격자는 같은 줄끼리 조금씩 늦게) ── */
(function () {
  var els = [].slice.call(document.querySelectorAll('[data-rv]'));
  [].forEach.call(document.querySelectorAll('.cf-list,.stats-grid,.parts,.steps,.plans'), function (g) {
    var cols = (getComputedStyle(g).gridTemplateColumns || '').split(' ').length || 1;
    [].forEach.call(g.children, function (ch, i) { ch.style.setProperty('--d', (i % cols) * 90 + 'ms'); });
  });
  if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  els.forEach(function (e) { io.observe(e); });
})();

/* ── 숫자 올라가기(화면에 들어올 때 한 번) ── */
(function () {
  if (RM || !('IntersectionObserver' in window)) return;
  function run(el) {
    var target = parseFloat(el.dataset.target || '0'), suf = el.dataset.suffix || '', t0 = performance.now(), dur = 1500;
    (function stepN(now) {
      var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e).toLocaleString('ko-KR') + suf;
      if (p < 1) requestAnimationFrame(stepN);
    })(t0);
  }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
  }, { threshold: .5 });
  [].forEach.call(document.querySelectorAll('.snum[data-target]'), function (el) { io.observe(el); });
})();

/* ── 후기 두 줄: 같은 내용을 한 번 더 붙여 끊김 없이 흐름(속도 = 초당 34px) ── */
(function () {
  var rows = [].slice.call(document.querySelectorAll('.rev-row'));
  rows.forEach(function (r) {
    [].slice.call(r.children).forEach(function (ch) { var cl = ch.cloneNode(true); cl.setAttribute('aria-hidden', 'true'); r.appendChild(cl); });
  });
  function dur() { rows.forEach(function (r) { r.style.setProperty('--dur', (r.scrollWidth / 2 / 34).toFixed(1) + 's'); }); }
  dur();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(dur);
})();

/* ── 내 띠: 태어난 해 → 천간·지지·띠 그림 ── */
var ZODIAC = {
  stem: '甲乙丙丁戊己庚辛壬癸', stemKo: '갑을병정무기경신임계',
  branch: '子丑寅卯辰巳午未申酉戌亥', branchKo: '자축인묘진사오미신유술해',
  color: ['푸른', '푸른', '붉은', '붉은', '황금', '황금', '하얀', '하얀', '검은', '검은'],
  animal: ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'],
  file: ['rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig'],
  trait: ['영리하고 눈치가 빨라, 남보다 먼저 기회를 알아보는 사람', '묵묵하고 성실해서, 끝내 원하는 것을 이루어 내는 사람',
    '당당하고 추진력이 강해, 앞장서서 길을 여는 사람', '섬세하고 다정해서, 곁에 늘 사람이 모이는 사람',
    '꿈이 크고 기세가 좋아, 큰 무대에서 빛나는 사람', '신중하고 직관이 날카로워, 본질을 꿰뚫어 보는 사람',
    '활기차고 자유로워서, 어디서든 분위기를 바꾸는 사람', '온화하고 배려가 깊어, 관계를 부드럽게 잇는 사람',
    '재치 있고 손재주가 좋아, 무엇이든 빨리 익히는 사람', '꼼꼼하고 부지런해서, 맡은 일을 반짝이게 마무리하는 사람',
    '의리 있고 정직해서, 오래도록 믿음을 주는 사람', '너그럽고 복스러워, 주변에 여유를 나누는 사람']
};
(function () {
  var form = document.getElementById('ddiForm'); if (!form) return;
  var inp = document.getElementById('ddiYear'), err = document.getElementById('ddiErr'), card = document.getElementById('ddiCard');
  var img = document.getElementById('ddiImg'), Z = ZODIAC, mine = null;
  function idx(y, n) { return ((y - 4) % n + n) % n; }
  function show(y, own) {
    var s = idx(y, 10), b = idx(y, 12), gz = Z.stem[s] + Z.branch[b], ko = Z.stemKo[s] + Z.branchKo[b];
    var name = Z.color[s] + ' ' + Z.animal[b];
    document.getElementById('ddiGz').textContent = (own ? y + '년생 · ' : '올해 ' + y + ' · ') + gz + '年 · ' + ko + '년';
    document.getElementById('ddiName').textContent = own ? name + '띠' : '올해는 ' + name + '의 해';
    document.getElementById('ddiTrait').textContent = (own ? '' : Z.animal[b] + '띠는 ') + Z.trait[b];
    document.getElementById('ddiSeal').textContent = gz;
    img.alt = '수묵화로 그린 ' + Z.animal[b] + ' — ' + ko + '년 ' + name + '띠';
    var src = '/assets/zodiac/' + Z.file[b] + '.webp';
    function play() { card.classList.remove('flip'); void card.offsetWidth; card.classList.add('flip'); }
    if (img.getAttribute('src') === src) { if (own) play(); return; }
    img.src = src;
    if (own) (img.decode ? img.decode() : Promise.resolve()).then(play, play);
  }
  var now = new Date(), thisYear = now.getFullYear();
  if (now.getMonth() === 0 || (now.getMonth() === 1 && now.getDate() < 4)) thisYear--;   // 입춘 전이면 지난해 기운
  show(thisYear, false);
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var y = parseInt(inp.value, 10);
    if (!(y >= 1900 && y <= 2100)) { err.textContent = '1900~2100 사이의 연도를 넣어 주세요. (예: 1990)'; inp.focus(); return; }
    err.textContent = ''; mine = y; inp.blur();
    show(y, true);
    setTimeout(function () { card.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }); }, 60);
  });
  document.getElementById('ddiGo').addEventListener('click', function () {   // 넣은 해를 신청서 출생연도에 미리 채움
    var f = document.getElementById('sajuForm');
    if (mine && f && f.elements['출생연도'] && !f.elements['출생연도'].value) f.elements['출생연도'].value = mine;
  });
})();

/* ── 휴대폰 아래 신청 바: 첫 화면을 지나면 보이고, 신청서가 화면에 있으면 숨김 ── */
(function () {
  var bar = document.getElementById('mbar'), hero = document.getElementById('hero'), apply = document.getElementById('apply');
  if (!bar || !('IntersectionObserver' in window)) return;
  var heroOn = true, applyOn = false;
  var succ = document.getElementById('successCard');
  function upd() { bar.classList.toggle('show', !heroOn && !applyOn && !(succ && succ.style.display === 'block')); }   // 접수를 마쳤으면 다시 띄우지 않음
  addEventListener('scroll', function () { if (succ && succ.style.display === 'block') bar.classList.remove('show'); }, { passive: true });
  // 빠르게 스크롤하면 알림이 여러 개 한꺼번에 옴 → 마지막(가장 최근) 것을 읽는다
  new IntersectionObserver(function (es) { heroOn = es[es.length - 1].isIntersecting; upd(); }, { threshold: .15 }).observe(hero);
  new IntersectionObserver(function (es) { applyOn = es[es.length - 1].isIntersecting; upd(); }, { threshold: 0, rootMargin: '0px 0px -30% 0px' }).observe(apply);
})();

/* ── 휴대폰: 10개 파트 = 한자 타일, 누르면 아래에 한 줄 설명(설명은 PC 카드의 h3·p 를 그대로 읽음) ── */
var PHONE_MQ = '(max-width: 719.98px)';                      // site.css 「휴대폰 전용」 기준과 같은 값
(function () {
  var say = document.getElementById('partSay'); if (!say) return;
  var parts = [].slice.call(document.querySelectorAll('.parts .part'));
  var T = document.getElementById('partSayT'), P = document.getElementById('partSayP');
  function pick(el) {
    parts.forEach(function (x) { x.classList.toggle('sel', x === el); if (x.hasAttribute('role')) x.setAttribute('aria-pressed', String(x === el)); });
    T.textContent = el.querySelector('h3').textContent; P.textContent = el.querySelector('p').textContent;
  }
  if (window.matchMedia && matchMedia(PHONE_MQ).matches) parts.forEach(function (el) { el.setAttribute('role', 'button'); el.tabIndex = 0; });
  parts.forEach(function (el) {
    el.addEventListener('click', function () { pick(el); });
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(el); } });
  });
  pick(parts[0]);
})();

/* ── 휴대폰: 동의 문구는 제목만, 「내용」을 누르면 전문 펼침(체크칸은 건드리지 않음) ── */
[].forEach.call(document.querySelectorAll('.ag-more'), function (b) {
  b.addEventListener('click', function (e) {
    e.preventDefault(); e.stopPropagation();
    var open = b.closest('.agree').classList.toggle('open');
    b.setAttribute('aria-expanded', String(open)); b.textContent = open ? '접기' : '내용';
  });
});

/* ── 신청서 (기존 사이트 코드 그대로 옮김 — 접수 메일·입금 안내 동작 동일) ── */
/* ▼▼ 운영자 설정 ▼▼ */
const WEB3FORMS_KEY="ef0e3efd-8d61-4ddc-a211-6c9e29435f52"; // web3forms.com Access Key → 신청 내역을 운영자 이메일로 받음
const FALLBACK_EMAIL="rlarudeh7778@gmail.com";              // Access Key 미설정 시 신청을 받을 운영자 이메일
/* ▲▲ 끝 ▲▲ */

/* 클립보드 복사 (https/file 모두 동작) */
function copyToClipboard(str){
  if(navigator.clipboard&&window.isSecureContext){return navigator.clipboard.writeText(str);}
  return new Promise((res,rej)=>{try{const ta=document.createElement('textarea');ta.value=str;ta.style.position='fixed';ta.style.left='-9999px';document.body.appendChild(ta);ta.focus();ta.select();document.execCommand('copy');document.body.removeChild(ta);res();}catch(e){rej(e);}});
}
function copyAccount(){
  const c=document.getElementById('acctCopy');
  copyToClipboard('국민은행 816901-04-308126 김경도').then(()=>{
    c.textContent='✓ 계좌번호가 복사되었습니다';
    setTimeout(()=>{c.textContent='📋 한 번 클릭하면 복사됩니다';},2000);
  }).catch(()=>{c.textContent='복사 실패 — 길게 눌러 복사해 주세요';});
}

const f=document.getElementById('sajuForm');
const noTime=document.getElementById('noTime');
noTime.addEventListener('change',()=>{
  ['bH','bMin'].forEach(id=>{const el=document.getElementById(id);el.disabled=noTime.checked;if(noTime.checked)el.value='';});
});

/* 상품별 가격 */
const PRICES={'기본':19000,'프리미엄':39000,'궁합':49000,'작명':59000};
const PKG_LABEL={'기본':'기본','프리미엄':'프리미엄 10파트','궁합':'궁합','작명':'작명·개명'};
function won(n){return (n||0).toLocaleString('ko-KR')+'원';}

/* 패키지 선택 → 궁합이면 상대방 정보 표시 + 선택 금액 표시 */
function onPkgChange(){
  const v=document.getElementById('pkgSel').value;
  const isG=v==='궁합', isN=v==='작명';
  document.getElementById('partner').style.display=isG?'block':'none';
  document.getElementById('namingbox').style.display=isN?'block':'none';
  // 궁합(상대방)·작명(아이/타인) 등 제3자 정보를 입력하는 상품은 별도 동의 필수
  const pBox=document.getElementById('agreePartnerBox'), pChk=document.getElementById('agreePartner');
  if(pBox){ const need=isG||isN; pBox.style.display=need?'flex':'none'; if(pChk){ pChk.required=need; if(!need)pChk.checked=false; } }
  // 신생아 작명은 성함이 없을 수 있으므로 필수 해제
  const nameEl=f.elements['성함']; if(nameEl)nameEl.required=!isN;
  if(isN)onNameType(); else updateNameHint(false);
  // 선택 상품·금액 실시간 표시
  const box=document.getElementById('priceBox');
  if(box){
    if(v&&PRICES[v]){ document.getElementById('priceName').textContent=PKG_LABEL[v]; document.getElementById('priceAmt').textContent=won(PRICES[v]); box.style.display='block'; }
    else box.style.display='none';
  }
}
function onNameType(){
  const t=(f.elements['작명종류']||{}).value;
  const box=document.getElementById('curNameBox'); if(box)box.style.display=(t==='개명')?'block':'none';
  updateNameHint(t==='작명'); // 신생아 작명일 때만 '비우고 제출' 안내
}
function updateNameHint(show){
  const hint=document.getElementById('nameHint'), label=document.getElementById('nameLabel'), inp=document.getElementById('nameInput');
  if(hint)hint.style.display=show?'block':'none';
  if(label)label.innerHTML=show?'성함 <span style="color:var(--mut);font-weight:400">(신생아는 비워두세요)</span>':'성함 <i>*</i>';
  if(inp){inp.placeholder=show?'미정이면 비워두고 제출':'홍길동';if(show)inp.value='';}
}
function pickPkg(v){const s=document.getElementById('pkgSel');if(s){s.value=v;onPkgChange();}}
const noTime2=document.getElementById('noTime2');
if(noTime2)noTime2.addEventListener('change',()=>{
  ['bH2','bMin2'].forEach(id=>{const el=document.getElementById(id);el.disabled=noTime2.checked;if(noTime2.checked)el.value='';});
});

f.addEventListener('submit',async(e)=>{
  e.preventDefault();
  if(!document.getElementById('agree').checked){alert('개인정보 수집·이용에 동의해 주세요.');return;}
  if(!document.getElementById('agreeWithdraw').checked){alert('청약철회 제한 관련 안내에 동의해 주세요.');return;}
  const pkgNow=document.getElementById('pkgSel').value;
  if((pkgNow==='궁합'||pkgNow==='작명')&&!document.getElementById('agreePartner').checked){alert('제3자(상대방·자녀 등) 정보 입력에 대한 동의를 확인해 주세요.');return;}
  if(pkgNow==='궁합'){
    const need={'상대방_성함':'상대방 성함','상대방_성별':'상대방 성별','상대방_달력':'상대방 달력 기준','상대방_출생연도':'상대방 출생연도','상대방_출생월':'상대방 출생월','상대방_출생일':'상대방 출생일'};
    for(const k in need){const el=f.elements[k];if(!el||!String(el.value).trim()){alert('궁합은 상대방 정보가 필요합니다.\n['+need[k]+']을(를) 입력해 주세요.');return;}}
  }
  if(pkgNow==='작명'){
    if(!String((f.elements['성씨']||{}).value||'').trim()){alert('작명·개명은 [성씨(姓)]를 입력해 주세요.');return;}
    if((f.elements['작명종류']||{}).value==='개명'&&!String((f.elements['현재이름']||{}).value||'').trim()){alert('개명은 [현재 이름]을 입력해 주세요.');return;}
  }
  const btn=f.querySelector('button[type=submit]');
  btn.disabled=true;const orig=btn.textContent;btn.textContent='접수 중…';
  const fd=new FormData(f);
  const g=k=>(fd.get(k)||'').toString().trim();
  const email=g('이메일');
  const isG=document.getElementById('pkgSel').value==='궁합';
  // 관리자 메일에 보기 좋게 정리된 본문 구성
  const time=g('시각모름')==='예'?'모름(시주 제외)':((g('출생시')||'-')+'시 '+(g('출생분')||'0')+'분');
  let lines=[
    '────────────────────',
    '[ 사주 분석 신청 ]',
    '────────────────────',
    '· 패키지   : '+g('패키지'),
    '',
    '〈 신청자 〉',
    '· 성함     : '+g('성함'),
    '· 성별     : '+g('성별'),
    '· 달력     : '+g('달력'),
    '· 생년월일 : '+g('출생연도')+'년 '+g('출생월')+'월 '+g('출생일')+'일',
    '· 태어난시 : '+time
  ];
  if(isG){
    const time2=g('상대방_시각모름')==='예'?'모름(시주 제외)':((g('상대방_출생시')||'-')+'시 '+(g('상대방_출생분')||'0')+'분');
    lines.push('',
      '〈 상대방 (궁합) 〉',
      '· 성함     : '+g('상대방_성함'),
      '· 성별     : '+g('상대방_성별'),
      '· 달력     : '+g('상대방_달력'),
      '· 생년월일 : '+g('상대방_출생연도')+'년 '+g('상대방_출생월')+'월 '+g('상대방_출생일')+'일',
      '· 태어난시 : '+time2);
  }
  if(g('패키지')==='작명'){
    lines.push('',
      '〈 작명·개명 정보 〉',
      '· 종류     : '+g('작명종류'),
      '· 성씨     : '+g('성씨'),
      ...(g('작명종류')==='개명'?['· 현재이름 : '+g('현재이름')]:[]),
      '· 글자수   : '+g('이름글자수')+'자',
      '· 표기선호 : '+g('표기선호'),
      '· 요청사항 : '+(g('작명요청')||'(없음)'));
  }
  lines.push('',
    '〈 연락처 〉',
    '· 이메일   : '+email,
    '· 연락처   : '+g('연락처'),
    '',
    '〈 추가 질문 〉',
    g('궁금한점')||'(없음)',
    '────────────────────');
  const message=lines.join('\n');
  const who=g('성함')||(g('패키지')==='작명'?g('성씨')+'씨 (작명)':'고객');
  const subject='[사주신청·'+g('패키지')+'] '+who+' 님';
  try{
    if(WEB3FORMS_KEY && WEB3FORMS_KEY.indexOf('YOUR_')!==0){
      // JSON 전송(한글 필드명 깨짐 방지) — 정리된 message 한 덩어리로 발송
      const payload={access_key:WEB3FORMS_KEY,subject,from_name:'사주명리 신청',replyto:email,message};
      const res=await fetch('https://api.web3forms.com/submit',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload)});
      const j=await res.json();
      if(!j.success)throw new Error(j.message||'전송에 실패했습니다');
    }else{
      window.location.href='mailto:'+FALLBACK_EMAIL+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(message);
    }
    alert('신청이 정상적으로 접수되었습니다.\n24시간 내에 적어주신 이메일로 발송됩니다.');
    document.getElementById('formCard').style.display='none';
    const s=document.getElementById('successCard');
    document.getElementById('successEmail').textContent=email||'입력하신 이메일';
    // 선택 상품·입금 금액 표시
    const selPkg=g('패키지');
    if(PRICES[selPkg]){ document.getElementById('paySumName').textContent=PKG_LABEL[selPkg]; document.getElementById('paySumAmt').textContent=won(PRICES[selPkg]); }
    s.style.display='block';s.scrollIntoView({behavior:'smooth'});
  }catch(err){
    alert('전송 중 문제가 발생했습니다: '+err.message+'\n잠시 후 다시 시도하시거나 직접 이메일로 신청해 주세요.');
    btn.disabled=false;btn.textContent=orig;
  }
});
