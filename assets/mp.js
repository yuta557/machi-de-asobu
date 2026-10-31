/* お問い合わせフォーム：ページを離れずに送信する。
   ENDPOINT に送信先（Formspree か Google Apps Script のURL）を入れる。
   空のままのあいだは送信せず、メールでの連絡をうながす。 */
(function(){
  var ENDPOINT = "";   /* 例: https://formspree.io/f/xxxxxxx */
  var MAIL = "yuta109010@gmail.com";
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
