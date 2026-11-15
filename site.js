/* Loopdesk site script: language, hero films, the scrolled story, call-back form, WhatsApp chat */
(function(){
  var root=document.documentElement, btn=document.getElementById('langbtn');
  function $(s,r){return (r||document).querySelector(s)}
  function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
  function isAr(){return root.classList.contains('lang-ar')}
  function setLang(l){
    root.classList.toggle('lang-ar', l==='ar');
    root.lang = l==='ar' ? 'ar' : 'en';
    root.dir = l==='ar' ? 'rtl' : 'ltr';
    if(btn) btn.textContent = l==='ar' ? 'English' : 'العربية';
    try{localStorage.setItem('ld-lang', l)}catch(e){}
    renderAll();
  }

  /* old links such as /#privacy still work */
  var h=(location.hash||'').slice(1);
  if(h==='privacy'||h==='terms'){location.replace('/'+h);return}

  /* hero films: calm loops, paused for people who prefer less motion */
  var reduce=false; try{reduce=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
  $$('.hero video').forEach(function(v){
    if(reduce){v.removeAttribute('autoplay');v.pause();return}
    var p=v.play&&v.play(); if(p&&p.catch)p.catch(function(){});
  });

  /* nav turns solid after the hero */
  var nav=$('.nav'), hero=$('.hero');
  function onScroll(){
    if(nav) nav.classList.toggle('solid',!hero||window.scrollY>hero.offsetHeight-90);
    drift();
  }
  window.addEventListener('scroll',onScroll,{passive:true});

  /* trade switch on the home page: dental or beauty personalises the story */
  var trade=document.body.getAttribute('data-trade')||'dental';
  $$('.seg button').forEach(function(b){b.addEventListener('click',function(){
    trade=b.getAttribute('data-t');
    $$('.seg button').forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});
    renderAll();
  })});

  /* the phone that follows the story */
  var S=window.STORY||{};
  function list(){var l=S[isAr()?'ar':'en']||{};return l[trade]||l.all||[]}
  function screen(d){
    if(!d)return '';
    return '<div class="screen"><div class="bar"><i></i><div>'+d.who+'<small>'+(d.sub||'WhatsApp')+'</small></div></div><div class="chat">'+d.html+'</div></div>';
  }
  var cur=0;
  function setPhone(i){
    cur=i; var p=document.getElementById('phone');
    if(p) p.innerHTML=screen(list()[i]);
    $$('.step').forEach(function(s,k){s.classList.toggle('on',k===i)});
  }
  function renderAll(){
    document.body.classList.toggle('t-beauty',trade==='beauty');
    setPhone(cur);
    $$('.step').forEach(function(s,k){var m=$('.mobile',s);if(m)m.innerHTML='<div class="phone">'+screen(list()[k])+'</div>'});
  }
  if('IntersectionObserver' in window && $('.step')){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)setPhone(+e.target.getAttribute('data-i'))})},{rootMargin:'-45% 0px -45% 0px'});
    $$('.step').forEach(function(s,i){s.setAttribute('data-i',i);io.observe(s)});
  }

  /* the drift timeline fills as it scrolls into view */
  function drift(){
    var t=$('.track'); if(!t)return;
    var r=t.getBoundingClientRect(), k=Math.max(0,Math.min(1,(innerHeight*.85-r.top)/(innerHeight*.6)));
    var f=$('.fill',t); if(f) f.style.width=(k*100)+'%';
    $$('.stop',t).forEach(function(s){s.classList.toggle('on',k*100>=parseFloat(s.getAttribute('data-x'))-2)});
  }

  /* sample messages strip */
  $$('.arrows button').forEach(function(b){b.addEventListener('click',function(){
    var s=$('.strip'); if(!s)return;
    var d=+b.getAttribute('data-d')*(isAr()?-1:1);
    s.scrollBy({left:d*350,behavior:reduce?'auto':'smooth'});
  })});

  /* message tabs on the product pages (arrow keys move between them) */
  $$('.tablist').forEach(function(tl){
    var bs=$$('button',tl);
    function pick(b,focus){
      bs.forEach(function(x){var on=x===b;x.setAttribute('aria-selected',String(on));x.tabIndex=on?0:-1});
      $$('.panel').forEach(function(p){p.hidden=p.id!==b.getAttribute('data-p')});
      if(focus)b.focus();
    }
    bs.forEach(function(b,i){
      b.addEventListener('click',function(){pick(b)});
      b.addEventListener('keydown',function(e){
        var n=null, fwd=isAr()?'ArrowLeft':'ArrowRight', back=isAr()?'ArrowRight':'ArrowLeft';
        if(e.key===fwd)n=bs[(i+1)%bs.length]; else if(e.key===back)n=bs[(i-1+bs.length)%bs.length];
        if(n){e.preventDefault();pick(n,true)}
      });
    });
  });

  /* rhythm engine: pick a treatment to see its cycle */
  $$('.rpick').forEach(function(g){
    var bs=$$('button',g);
    bs.forEach(function(b){b.addEventListener('click',function(){
      bs.forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});
      $$('.rpanel').forEach(function(p){p.hidden=p.id!==b.getAttribute('data-r')});
    })});
  });

  /* copy buttons */
  $$('[data-copy]').forEach(function(b){
    b.addEventListener('click',function(){
      var t=b.getAttribute('data-copy'), label=b.innerHTML;
      function done(){b.textContent = isAr()?'تم النسخ':'Copied'; setTimeout(function(){b.innerHTML=label},1500)}
      function sel(){var s=document.getElementById('mailaddr'),r=document.createRange();r.selectNodeContents(s);var w=getSelection();w.removeAllRanges();w.addRange(r)}
      try{navigator.clipboard.writeText(t).then(done,sel)}catch(e){sel()}
    });
  });

  var saved='en'; try{saved=localStorage.getItem('ld-lang')||'en'}catch(e){}
  setLang(saved);
  if(btn) btn.addEventListener('click',function(){setLang(isAr()?'en':'ar')});
  onScroll();
})();

/* call-back form: posts to /api/callback, which emails sales@ */
(function(){
  var root=document.documentElement, form=document.getElementById('cbform');
  if(!form) return;
  var t0=Date.now(), sendBtn=document.getElementById('cbsend'), fail=document.getElementById('cbfail'), done=document.getElementById('cbdone');
  var rid=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2);
  function ar(){return root.classList.contains('lang-ar')}
  function localise(){
    var l=ar()?'ar':'en';
    form.querySelectorAll('[data-ph-en]').forEach(function(i){i.placeholder=i.getAttribute('data-ph-'+l)});
    form.querySelectorAll('option[data-en]').forEach(function(o){o.textContent=o.getAttribute('data-'+l)});
  }
  localise();
  new MutationObserver(localise).observe(root,{attributes:true,attributeFilter:['class']});

  var TIME={morning:['in the morning, between 10am and 12pm','صباحًا بين 10 و12'],afternoon:['in the afternoon, between 12pm and 4pm','ظهرًا بين 12 و4'],evening:['in the evening, between 4pm and 8pm','مساءً بين 4 و8'],any:['between 10am and 8pm','بين 10 صباحًا و8 مساءً']};
  function phoneOk(v){
    var d=String(v||'').replace(/[\s\-().]/g,'');
    if(d.indexOf('00')===0)d='+'+d.slice(2);
    if(/^0?5\d{8}$/.test(d)||/^\+9715\d{8}$/.test(d))return true;
    if(/^\+971/.test(d))return false;
    return /^\+[1-9]\d{7,14}$/.test(d);
  }
  function val(n){var e=form.elements[n];return e?String(e.value||'').trim():''}
  function checks(){
    return {
      name:val('name').length>=2,
      business:val('business').length>=2,
      phone:phoneOk(val('phone')),
      email:/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val('email')),
      vertical:!!val('vertical'),
      emirate:!!val('emirate'),
      time:!!val('time')
    };
  }
  function fieldOf(n){var e=form.elements[n];if(!e)return null;if(e.length&&!e.tagName)e=e[0];return e.closest('.fld')}
  function mark(n,ok){var f=fieldOf(n);if(f)f.classList.toggle('bad',!ok)}
  /* Errors appear only after she leaves a field or presses send, and clear as soon as it is right. */
  Object.keys(checks()).forEach(function(n){
    var e=form.elements[n], list=(e&&e.length&&!e.tagName)?Array.prototype.slice.call(e):[e];
    list.forEach(function(x){if(!x)return;
      x.addEventListener('blur',function(){if(x.type!=='radio'&&val(n))mark(n,checks()[n])});
      x.addEventListener('input',function(){var f=fieldOf(n);if(f&&f.classList.contains('bad'))mark(n,checks()[n])});
      x.addEventListener('change',function(){var f=fieldOf(n);if(f&&f.classList.contains('bad'))mark(n,checks()[n])});
    });
  });

  function mailtoBody(){
    var lines=['Please call me back.','','Name: '+val('name'),'Business: '+val('business'),'Mobile: '+val('phone'),'Email: '+val('email'),
      'Type: '+(form.elements.vertical.selectedOptions[0]||{}).textContent,'Emirate: '+(form.elements.emirate.selectedOptions[0]||{}).textContent,
      'Branches: '+(val('branches')||'-'),'Best time: '+(val('time')||'-')];
    return 'mailto:sales@getloopdesk.com?subject='+encodeURIComponent('Call back: '+val('business'))+'&body='+encodeURIComponent(lines.join('\n'));
  }
  function showFail(){document.getElementById('cbmail').href=mailtoBody();fail.hidden=false}

  form.addEventListener('submit',function(ev){
    ev.preventDefault(); fail.hidden=true;
    var c=checks(), first=null;
    Object.keys(c).forEach(function(n){mark(n,c[n]);if(!c[n]&&!first)first=n});
    if(first){var e=form.elements[first];if(e&&e.length&&!e.tagName)e=e[0];e.focus();return}
    var body={name:val('name'),business:val('business'),phone:val('phone'),email:val('email'),vertical:val('vertical'),emirate:val('emirate'),
      branches:val('branches'),time:val('time'),lang:ar()?'ar':'en',consentEmail:form.elements.consentEmail.checked,consentWhatsapp:form.elements.consentWhatsapp.checked,
      website:val('website'),elapsedMs:Date.now()-t0,requestId:rid};
    sendBtn.disabled=true; var label=sendBtn.innerHTML;
    sendBtn.innerHTML='<span class="en">Sending…</span><span class="ar">جارٍ الإرسال…</span>';
    fetch('/api/callback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
      .then(function(r){return r.json().catch(function(){return {ok:false}}).then(function(j){return {status:r.status,j:j}})})
      .then(function(x){
        if(x.j&&x.j.ok){
          done.querySelectorAll('[data-out="name"]').forEach(function(e){e.textContent=body.name.split(' ')[0]});
          done.querySelectorAll('[data-out="phone"]').forEach(function(e){e.textContent=body.phone});
          done.querySelector('[data-out="time-en"]').textContent=TIME[body.time][0];
          done.querySelector('[data-out="time-ar"]').textContent=TIME[body.time][1];
          form.hidden=true; done.hidden=false; done.focus();
          return;
        }
        if(x.status===422&&x.j.fields){x.j.fields.forEach(function(n){mark(n,false)});return}
        showFail();
      })
      .catch(showFail)
      .then(function(){sendBtn.disabled=false;sendBtn.innerHTML=label});
  });
})();

/* Chat with Loopdesk on WhatsApp (the sales line, +971 50 147 2513).
   The buttons stay hidden until CHAT_LIVE is true: flip it only once the number is
   registered on the WhatsApp Business Platform and the sales line is answering. */
(function(){
  /* The sales number lives only here (digits, with 971): a new SIM is a one-line change. */
  var CHAT_NUMBER='971501472513'; /* the chat buttons' number (the footer's phone line is in each page's footer: change both for a new SIM) */
  var CHAT_LIVE=true;
  if(!CHAT_LIVE||!/^971\d{8,9}$/.test(CHAT_NUMBER))return;
  var root=document.documentElement, v=document.body.getAttribute('data-vertical');
  var HELLO={
    salon:{en:"Hi Loopdesk 👋 I'd like to know more about Romy for my beauty centre.",ar:'مرحبًا Loopdesk 👋 أودّ أن أعرف المزيد عن رومي لمركز التجميل.'},
    dental:{en:"Hi Loopdesk 👋 I'd like to know more about Sinan for my dental clinic.",ar:'مرحبًا Loopdesk 👋 أودّ أن أعرف المزيد عن سنان لعيادة الأسنان.'},
    any:{en:"Hi Loopdesk 👋 I'd like to know more.",ar:'مرحبًا Loopdesk 👋 أودّ أن أعرف المزيد.'}
  };
  function links(){
    var ar=root.classList.contains('lang-ar'), h=HELLO[v]||HELLO.any;
    var href='https://wa.me/'+CHAT_NUMBER+'?text='+encodeURIComponent(ar?h.ar:h.en);
    document.querySelectorAll('[data-chat]').forEach(function(el){
      el.hidden=false;
      if(el.tagName==='A')el.href=href;
    });
  }
  links();
  /* The floating WhatsApp button stays with the visitor and gives a small bounce whenever they scroll, up or down. */
  var fl=document.querySelector('.ld-float'), last=window.scrollY, quiet=0;
  var still=false; try{still=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
  if(fl&&!still)window.addEventListener('scroll',function(){
    if(Math.abs(window.scrollY-last)<120)return; last=window.scrollY;
    if(Date.now()-quiet<1500)return; quiet=Date.now();
    fl.classList.remove('bob'); void fl.offsetWidth; fl.classList.add('bob');
  },{passive:true});
  new MutationObserver(links).observe(root,{attributes:true,attributeFilter:['class']});
})();
