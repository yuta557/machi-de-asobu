/* お問い合わせフォーム：ページを離れずに送信する。
   ENDPOINT に送信先（Formspree か Google Apps Script のURL）を入れる。
   空のままのあいだは送信せず、メールでの連絡をうながす。 */
(function(){
  var ENDPOINT = "";   /* 例: https://formspree.io/f/xxxxxxx */
  var MAIL = atob("eXV0YTEwOTAxMEBnbWFpbC5jb20=");
  var form = document.getElementById("contactForm");
  if(!form) return;
  var msg = document.getElementById("cf-msg");
  var btn = form.querySelector(".submit");
  function show(kind, text){ msg.className = "form-msg " + kind; msg.textContent = text; }
  form.addEventListener("submit", function(e){
    e.preventDefault();
    show("", "");
    var name = form.name.value.trim(), email = form.email.value.trim(), body = form.message.value.trim();
    if(!name || !email || !body){ show("ng","お名前・メールアドレス・内容を入力してください。"); return; }
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ show("ng","メールアドレスの形式をご確認ください。"); return; }
    if(form._gotcha.value){ return; }
    if(!ENDPOINT){ show("ng","ただいまフォームからの送信を準備中です。お手数ですが " + MAIL + " までお送りください。"); return; }
    btn.disabled = true; btn.textContent = "送信中…";
    fetch(ENDPOINT, { method:"POST", headers:{"Accept":"application/json"}, body:new FormData(form) })
      .then(function(r){ if(!r.ok) throw new Error(r.status);
        form.reset(); show("ok","送信しました。お返事までしばらくお待ちください。"); })
      .catch(function(){ show("ng","送信できませんでした。お手数ですが " + MAIL + " までお送りください。"); })
      .then(function(){ btn.disabled = false; btn.textContent = "送信する　→"; });
  });
})();

/* スマホの全画面パネル：画面の中央を横切った目印に合わせて、その場で入れ替える */
(function(){
  var box = document.querySelector('.panels');
  if(!box || !('IntersectionObserver' in window)) return;
  var slides = [].slice.call(box.querySelectorAll('.slide'));
  var trigs  = [].slice.call(box.querySelectorAll('.trig'));
  if(slides.length < 2 || trigs.length < slides.length) return;
  box.classList.add('js');
  function show(i){ slides.forEach(function(el, k){ el.classList.toggle('on', k === i); }); }
  var io = new IntersectionObserver(function(list){
    list.forEach(function(e){ if(e.isIntersecting) show(trigs.indexOf(e.target)); });
  }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });
  trigs.forEach(function(t){ io.observe(t); });
})();
/* 狭い画面のメニュー開閉 */
(function(){
  var b = document.querySelector('.burger'), n = document.getElementById('navlinks');
  if(!b || !n) return;
  function close(){ b.setAttribute('aria-expanded','false'); n.classList.remove('open'); }
  b.addEventListener('click', function(){
    var open = b.getAttribute('aria-expanded') === 'true';
    b.setAttribute('aria-expanded', String(!open));
    n.classList.toggle('open', !open);
  });
  n.addEventListener('click', function(e){ if(e.target.tagName === 'A') close(); });
  addEventListener('resize', function(){ if(innerWidth > 860) close(); });
})();

/* スクロールして画面に入った所から、順番にふわっと出す。
   JavaScript が動かないときは何も付かないので、そのまま全部見えたままになる。 */
(function(){
  if(!('IntersectionObserver' in window)) return;
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* 動きを付けるのは、問いかけから「これからも活動を続けていきます。」まで。
     その下（プロジェクト・活動・記録・プロフィール・お問い合わせ）は動かさない。 */
  var groups = [
    '.intro .q-row > *',
    '.intro .band-in > *',
    '.intro .closing > *'
  ];

  var items = [];
  groups.forEach(function(sel){
    [].slice.call(document.querySelectorAll(sel)).forEach(function(el){
      if(items.indexOf(el) < 0) items.push(el);
    });
  });
  if(!items.length) return;

  /* 同じ並びのものは、少しずつ遅らせて出す */
  items.forEach(function(el){
    var p = el.parentNode;
    if(!p.__rvIndex){ p.__rvIndex = 0; }
    var i = p.__rvIndex++;
    if(i > 0) el.style.transitionDelay = Math.min(i * 0.09, 0.45) + 's';
    el.classList.add('rv');
  });

  var io = new IntersectionObserver(function(list){
    list.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });

  items.forEach(function(el){ io.observe(el); });
})();


/* メールアドレスは、集めて回るプログラムに拾われないよう、
   読み込んだあとに組み立てて置く。JavaScript が動かないときは
   「アットマーク」と書いた形のまま残る。 */
(function(){
  var list = document.querySelectorAll('.mail[data-m]');
  if(!list.length) return;
  [].slice.call(list).forEach(function(el){
    var addr;
    try { addr = atob(el.getAttribute('data-m')); } catch(e){ return; }
    var a = document.createElement('a');
    a.href = 'mail' + 'to:' + addr;
    a.textContent = addr;
    el.textContent = '';
    el.appendChild(a);
    el.removeAttribute('data-m');
  });
})();

/* 写真のスライド：1枚ずつ、5秒ごとに切り替える。
   前後に1枚ずつ複製を置いて、端でも同じ向きに流れて一周するようにしている。
   複製まで動いたら、見た目を変えないまま本物の位置へ瞬間移動させる。
   矢印・点・ドラッグのどれかを使った時点で、自動送りは止める。
   JavaScript が動かないときは、ただ横にスワイプできる並びとして残る。 */
(function(){
  var box = document.querySelector('[data-shot]');
  if(!box) return;
  var track = box.querySelector('.shot-track');
  var imgs  = [].slice.call(track.querySelectorAll('img'));
  var n = imgs.length;
  if(n < 2) return;
  var cap  = box.querySelector('.shot-cap');
  var dots = box.querySelector('.shot-dots');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  box.classList.add('js');

  /* 前後の複製 */
  var tail = imgs[n - 1].cloneNode(true), head = imgs[0].cloneNode(true);
  [tail, head].forEach(function(c){
    c.setAttribute('aria-hidden', 'true');
    c.setAttribute('alt', '');
    c.removeAttribute('data-cap');
  });
  track.insertBefore(tail, imgs[0]);
  track.appendChild(head);

  var all = [].slice.call(track.querySelectorAll('img'));
  function step(){ return all.length > 1 ? (all[1].offsetLeft - all[0].offsetLeft) : 0; }
  function setX(x, smooth){
    track.scrollTo({ left: x, behavior: (smooth && !reduce) ? 'smooth' : 'auto' });
  }

  var buttons = imgs.map(function(im, i){
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', (i + 1) + '枚目を見る');
    b.addEventListener('click', function(){ stop(); go(i); });
    dots.appendChild(b);
    return b;
  });

  var at = 0;
  function paint(){
    buttons.forEach(function(b, k){ b.setAttribute('aria-current', String(k === at)); });
    var c = imgs[at].getAttribute('data-cap');
    if(cap && c) cap.textContent = c;
  }
  var guard = null;
  function go(i, smooth){
    var w = step();
    if(!w) return;
    smooth = (smooth !== false) && !reduce;
    if(i < 0){ setX(0, smooth); at = n - 1; }
    else if(i >= n){ setX((n + 1) * w, smooth); at = 0; }
    else { setX((i + 1) * w, smooth); at = i; }
    paint();
    /* 端をまたいだときは、動きが終わるのを待って本物の位置へ移す。
       scroll の通知が来ない場面もあるので、時間でも必ず拾う。 */
    clearTimeout(guard);
    guard = setTimeout(settle, smooth ? 700 : 30);
  }
  /* 動きが止まったところで、複製の上にいたら、見た目を変えずに本物へ移す */
  function settle(){
    clearTimeout(guard);
    var w = step();
    if(!w || dragging) return;
    var raw = Math.round(track.scrollLeft / w);
    if(raw <= 0){ setX(n * w, false); at = n - 1; paint(); return; }
    if(raw >= n + 1){ setX(w, false); at = 0; paint(); return; }
    var r = raw - 1;
    if(r !== at){ at = r; paint(); }
  }

  var tid = null;
  function stop(){ if(tid){ clearInterval(tid); tid = null; } }
  function start(){ if(!reduce && !tid) tid = setInterval(function(){ go(at + 1); }, 5000); }

  box.querySelector('.shot-nav.shot-prev').addEventListener('click', function(){ stop(); go(at - 1); });
  box.querySelector('.shot-nav.shot-next').addEventListener('click', function(){ stop(); go(at + 1); });

  var t = null;
  track.addEventListener('scroll', function(){
    if(dragging) return;
    clearTimeout(t);
    t = setTimeout(settle, 140);
  });
  track.addEventListener('scrollend', function(){ if(!dragging) settle(); });
  box.addEventListener('mouseenter', stop);
  box.addEventListener('mouseleave', start);
  box.addEventListener('focusin', stop);

  /* マウスでつかんで左右に動かしても切り替わる。
     指でのスワイプは、ブラウザの横スクロールがそのまま効く。 */
  var dragging = false, startX = 0, atStart = 0;
  track.addEventListener('pointerdown', function(e){
    if(e.pointerType !== 'mouse' || e.button !== 0) return;
    dragging = true; startX = e.clientX; atStart = at;
    track.classList.add('drag');
    if(track.setPointerCapture) track.setPointerCapture(e.pointerId);
    stop();
  });
  track.addEventListener('pointermove', function(e){
    if(!dragging) return;
    track.scrollLeft = (atStart + 1) * step() - (e.clientX - startX);
    e.preventDefault();
  });
  function drop(e){
    if(!dragging) return;
    dragging = false;
    track.classList.remove('drag');
    var w = step();
    if(!w) return;
    var dx = (e && typeof e.clientX === 'number') ? e.clientX - startX : 0;
    if(Math.abs(dx) > w * 0.12) go(atStart + (dx < 0 ? 1 : -1));
    else go(atStart);
  }
  track.addEventListener('pointerup', drop);
  track.addEventListener('pointercancel', drop);
  track.addEventListener('dragstart', function(e){ e.preventDefault(); });

  function place(){ var w = step(); if(w) setX((at + 1) * w, false); }
  requestAnimationFrame(function(){ place(); paint(); start(); });
  window.addEventListener('resize', place);
  window.addEventListener('load', place);
})();
