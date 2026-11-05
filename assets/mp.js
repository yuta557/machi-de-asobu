/* お問い合わせフォーム：ページを離れずに送信する。
   ENDPOINT に Formspree のURL（https://formspree.io/f/xxxxxxx）を入れると動きだす。
   空のままのあいだは送信せず、メールでの連絡をうながす。 */
(function(){
  var ENDPOINT = "https://formspree.io/f/mwllwjjr";
  /* アドレスは、集めて回るプログラムに拾われないよう、@ を全角のままにしておく。
     読む人には「＠を半角に」と添えて、手で直してもらう。 */
  var MAIL = "yuta109010 ＠ gmail.com";
  var form = document.getElementById("contactForm");
  if(!form) return;
  var msg = document.getElementById("cf-msg");
  var btn = form.querySelector(".submit");
  var sending = false;

  function show(kind, text){ msg.className = "form-msg " + kind; msg.textContent = text; }
  function byMail(head){
    show("ng", head + "お手数ですが " + MAIL + "（＠を半角の @ に）までお送りください。");
  }

  form.addEventListener("submit", function(e){
    e.preventDefault();
    if(sending) return;
    show("", "");

    var name = form.name.value.trim(), email = form.email.value.trim(), body = form.message.value.trim();
    if(!name || !email || !body){ show("ng","お名前・メールアドレス・内容を入力してください。"); return; }
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ show("ng","メールアドレスの形式をご確認ください。"); return; }
    if(form._gotcha.value){ return; }            /* 人には見えない欄。埋まっていたら機械 */
    if(!ENDPOINT){ byMail("ただいまフォームからの送信を準備中です。"); return; }

    var data = new FormData(form);
    data.append("_subject", "【MACHI PLAY】" + (form.topic.value || "お問い合わせ") + "／" + name + " 様");

    sending = true; btn.disabled = true; btn.textContent = "送信中…";
    fetch(ENDPOINT, { method:"POST", headers:{"Accept":"application/json"}, body:data })
      .then(function(r){
        if(r.ok){ return null; }
        return r.json().then(function(j){                     /* 送信先が理由を返したら、それを出す */
          var m = j && j.errors && j.errors.map(function(x){ return x.message; }).join("　");
          var e = new Error(m || "");
          e.fromServer = !!m;
          throw e;
        }, function(){ throw new Error(""); });
      })
      .then(function(){
        form.reset();
        show("ok","送信しました。お返事までしばらくお待ちください。");
      })
      .catch(function(err){
        /* 送信先が返した理由だけを出す。通信そのものの失敗は、言い回しをそろえる */
        if(err && err.fromServer && err.message){ byMail(err.message + "　"); }
        else { byMail("送信できませんでした。"); }
      })
      .then(function(){ sending = false; btn.disabled = false; btn.textContent = "送信する　→"; });
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

  /* 文字は3枚の絵に分かれている。そろう前に出すと、見出しだけ・しるしだけが
     先に見えてしまうので、その絵の文字がそろってから動かす */
  slides.forEach(function(sl){
    var imgs = [].slice.call(sl.querySelectorAll('.p-tx'));
    var left = imgs.length, done = false;
    function ok(){ if(!done){ done = true; sl.classList.add('txok'); } }
    function one(){ if(--left <= 0) ok(); }
    if(!left){ ok(); return; }
    imgs.forEach(function(im){
      if(im.complete){ one(); return; }
      im.addEventListener('load', one);
      im.addEventListener('error', one);
    });
    setTimeout(ok, 8000);   /* 届かないときでも、待ちきりにしない */
  });

  /* パネルが画面に入ったら、1枚目の文字を出す合図を立てる */
  var lit = new IntersectionObserver(function(list){
    /* ヒーローから渡ってくる画面では、渡し終わってから合図を立てる（下を見よ）。
       1枚目の動きが、絵がまだ薄いうちに終わってしまわないように */
    if(box.__handoff) return;
    for(var i = 0; i < list.length; i++){
      if(list[i].isIntersecting){ box.classList.add('lit'); box.classList.add('set'); lit.disconnect(); return; }
    }
  }, { rootMargin: '-20% 0px -20% 0px', threshold: 0 });
  lit.observe(box);

  function show(i){
    /* 最後の目印まで来たら、絵ごとすっと消す。うしろで待っている内容が、上から出る */
    if(i >= slides.length){ box.classList.add('out'); return; }
    box.classList.remove('out');
    slides.forEach(function(el, k){
      var now = (k === i);
      /* 出ていく絵の見出しは、絵が消えきるまで置いたままにする。
         動きを外したとたんに消えると、切り替わりの途中で字だけ先に消えてしまう */
      if(!now && el.classList.contains('on')){
        el.classList.add('was');
        clearTimeout(el.__was);
        el.__was = setTimeout(function(){ el.classList.remove('was'); }, 900);
      }
      if(now){ clearTimeout(el.__was); el.classList.remove('was'); }
      el.classList.toggle('on', now);
    });
  }
  var io = new IntersectionObserver(function(list){
    list.forEach(function(e){ if(e.isIntersecting) show(trigs.indexOf(e.target)); });
  }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });
  trigs.forEach(function(t){ io.observe(t); });
})();
/* スマホ：ヒーローから1枚目の絵へ、うつり変わるところ。
   そのまま上がってくると固いので、ヒーローを薄くしながら、1枚目を濃くして渡す。
   スクロールした量に合わせて、少しずつ入れ替える。 */
(function(){
  var hero = document.querySelector('.hero-full');
  var panels = document.querySelector('.panels');
  if(!hero || !panels) return;
  var stage = panels.querySelector('.stage');
  if(!stage) return;
  var narrow = window.matchMedia('(max-width:560px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var waiting = false;

  function hands_off(){
    hero.style.opacity = '';
    stage.style.opacity = '';
    stage.classList.remove('fading');
  }

  function paint(){
    waiting = false;
    if(!narrow.matches || reduce.matches){ panels.__handoff = false; hands_off(); return; }
    panels.__handoff = true;
    /* 絵が画面の上に貼りつく位置。そこへ着くまでのあいだで、濃さを入れ替える */
    var pin = panels.getBoundingClientRect().top + window.pageYOffset - 64;
    var span = Math.max(innerHeight * 0.45, 180);
    var p = (window.pageYOffset - (pin - span)) / span;
    p = p < 0 ? 0 : (p > 1 ? 1 : p);

    hero.style.opacity = p > 0 ? String(1 - p) : '';
    /* 絵が見えはじめたら、本文を出す */
    if(p >= .3) panels.classList.add('lit');
    if(p > 0 && p < 1){
      /* ここはスクロールで直に濃さを決めるので、なめらかにする仕掛けは外す */
      stage.classList.add('fading');
      stage.style.opacity = String(p);
    }else{
      /* 出来上がったら手を放す。3枚目のあとの消え方は、スタイル表にまかせる */
      stage.classList.remove('fading');
      stage.style.opacity = p >= 1 ? '' : '0';
      /* 渡し終わったところで、問いかけを動かす */
      if(p >= 1) panels.classList.add('set');
    }
  }
  function later(){ if(!waiting){ waiting = true; requestAnimationFrame(paint); } }

  addEventListener('scroll', later, { passive:true });
  addEventListener('resize', later);
  addEventListener('orientationchange', later);
  paint();
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

/* 題字は、絵がそろってから出す。
   通信が細いと、字が途中までしか描かれていない絵が見えてしまう。
   JavaScript が動かないときは、今までどおりそのまま出る。 */
(function(){
  var ttl = document.querySelector('.hero-ttl');
  if(!ttl) return;
  var imgs = [].slice.call(ttl.querySelectorAll('img')).filter(function(im){ return !im.complete; });
  if(!imgs.length) return;

  ttl.classList.add('wait');
  var left = imgs.length, done = false;
  function show(){
    if(done) return;
    done = true;
    ttl.classList.remove('wait');
  }
  function one(){ if(--left <= 0) show(); }

  imgs.forEach(function(im){
    /* decode() は、絵を描ける形にし終えたところで知らせてくれる */
    if(im.decode){ im.decode().then(one, one); }
    else { im.addEventListener('load', one); im.addEventListener('error', one); }
  });
  /* 合図が来ないときでも、待ちすぎない。出せないときは、代わりの文字を見せる */
  setTimeout(show, 6000);
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


/* 下の階のページ（プロジェクト・プロフィール・お問い合わせ）：
   見出しの動きに続けて、下の内容も画面に入った順にふわっと出す。
   開いた直後に見えているものは、見出しが出きるのを待ってから動かす。
   報告ページは読みものなので、何も付けない。
   JavaScript が動かないときは、そのまま全部見えたままになる。 */
(function(){
  if(!('IntersectionObserver' in window)) return;
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var head = document.querySelector('.page-head');
  if(!head || head.classList.contains('article-head')) return;

  /* [選ぶもの, 並んでいるものを少しずつ遅らせるか] */
  /* 「取り組んでいる分野」と「遊べます」の帯は、動かさない */
  var groups = [
    ['.pjs > *',      true ],
    ['.who-solo',     false],
    ['.prose > *',    false],
    ['.btns > *',     true ],
    ['.contact .form',false]
  ];

  var items = [];
  groups.forEach(function(g){
    [].slice.call(document.querySelectorAll(g[0])).forEach(function(el){
      if(items.indexOf(el) >= 0) return;
      var wait = 0;
      if(g[1]){
        var p = el.parentNode;
        if(!p.__rvN){ p.__rvN = 0; }
        wait = Math.min(p.__rvN++ * 0.09, 0.45);
      }
      el.__rvWait = wait;
      el.classList.add('rv');
      items.push(el);
    });
  });
  if(!items.length) return;

  var opened = Date.now();
  var io = new IntersectionObserver(function(list){
    list.forEach(function(e){
      if(!e.isIntersecting) return;
      var el = e.target;
      var wait = el.__rvWait + (Date.now() - opened < 600 ? 0.34 : 0);
      if(wait > 0) el.style.transitionDelay = wait + 's';
      el.classList.add('in');
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });

  items.forEach(function(el){ io.observe(el); });
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
