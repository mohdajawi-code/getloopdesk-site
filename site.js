/* Loopdesk site script: language, rhythm card, routing, copy buttons */
(function(){
  var root=document.documentElement, btn=document.getElementById('langbtn');
  function isAr(){return root.classList.contains('lang-ar')}
  function setLang(l){
    root.classList.toggle('lang-ar', l==='ar');
    root.lang = l==='ar' ? 'ar' : 'en';
    root.dir = l==='ar' ? 'rtl' : 'ltr';
    btn.textContent = l==='ar' ? 'English' : 'العربية';
    try{localStorage.setItem('ld-lang', l)}catch(e){}
    draw();
  }

  /* ---------- rhythm comparison ---------- */
  var DATA={
    salon:{off:8,on:5,price:350,n:100,
      en:{who:'Sophie · colour and blow-dry · AED 350 a visit',off:'Every 8 weeks, when she remembers',on:'Every 5 weeks, invited on her rhythm',scale:'If just 100 of your regulars come back like Sophie, that\'s AED {T} more a year.'},
      ar:{who:'صوفي · صبغة وتصفيف الشعر · 350 درهمًا للزيارة',off:'كلّ 8 أسابيع، حين تتذكّر',on:'كلّ 5 أسابيع، تصلها الدعوة في وقتها',scale:'يكفي أن تعود 100 من عميلاتكم الدائمات مثل صوفي، لتزيد إيراداتكم {T} درهم في السنة.'}},
    cosmetic:{off:8,on:4,price:450,n:50,
      en:{who:'Priya · skin treatment · AED 450 a visit',off:'Every 8 weeks, when she finds time',on:'Every 4 weeks, as her course needs',scale:'If just 50 of your clients come back like Priya, that\'s AED {T} more a year.'},
      ar:{who:'بريا · جلسة عناية بالبشرة · 450 درهمًا للزيارة',off:'كلّ 8 أسابيع، حين تجد وقتًا',on:'كلّ 4 أسابيع، كما يحتاج برنامجها',scale:'يكفي أن تعود 50 من عميلاتكم مثل بريا، لتزيد إيراداتكم {T} درهم في السنة.'}},
    dental:{off:52,on:26,price:400,n:300,
      en:{who:'Daniel · check-up and clean · AED 400 a visit',off:'Once a year, when something hurts',on:'Every 6 months, invited on time',scale:'If just 300 of your patients come back like Daniel, that\'s AED {T} more a year.'},
      ar:{who:'دانيال · فحص وتنظيف · 400 درهم للزيارة',off:'مرّة في السنة، حين يوجعه ضرسه',on:'كلّ 6 أشهر، تصله الدعوة في وقتها',scale:'يكفي أن يعود 300 من مرضاكم مثل دانيال، لتزيد إيراداتكم {T} درهم في السنة.'}},
    barber:{off:5,on:3,price:120,n:150,
      en:{who:'Omar · cut and beard · AED 120 a visit',off:'Every 5 weeks, when he walks past',on:'Every 3 weeks, his chair kept for him',scale:'If just 150 of your regulars come back like Omar, that\'s AED {T} more a year.'},
      ar:{who:'عمر · قصّة شعر ولحية · 120 درهمًا للزيارة',off:'كلّ 5 أسابيع، حين يمرّ بالمحل',on:'كلّ 3 أسابيع، وكرسيّه محجوز له',scale:'يكفي أن يعود 150 من زبائنكم مثل عمر، لتزيد إيراداتكم {T} درهم في السنة.'}}
  };
  var current=document.body.getAttribute('data-vertical')||'salon';
  var COPY={"salon": {"en": {"h2": "Same client. More visits.", "sub": "Every service has a natural cycle. Loopdesk starts from it and, after two or three visits, knows each client's own rhythm the way her favourite stylist would.", "s1": "Each client's real return cycle, for every service.", "s2": "A warm note in her usual stylist's name, always with \"another time\".", "s3": "One extra that suits her, at the moment she books. Never a sales list.", "s4": "Consent first. At most two notes a month, 10am to 9pm. STOP works instantly."}, "ar": {"h2": "العميلة نفسها، وزيارات أكثر.", "sub": "لكلّ خدمة دورة طبيعية تبدأ منها Loopdesk، ثمّ بعد زيارتين أو ثلاث تحفظ إيقاع كلّ عميلة كما تحفظه أقرب موظفة إليها.", "s1": "متى تعود كلّ عميلة فعلًا، خدمةً خدمة.", "s2": "برسالة لطيفة باسم خبيرتها المعتادة، وفيها دائمًا زرّ «وقت آخر».", "s3": "خدمة إضافية واحدة تناسبها، وهي تحجز. لا قوائم ولا إلحاح.", "s4": "بإذنها أولًا. رسالتان في الشهر على الأكثر، بين 10 صباحًا و9 مساءً. وكلمة «توقّف» توقف كلّ شيء فورًا."}}, "cosmetic": {"en": {"h2": "Same client. Every session on time.", "sub": "Every treatment has its course. Loopdesk follows it, and learns each client's own pace after two or three sessions.", "s1": "When each client is really due, for every treatment.", "s2": "A warm note in her usual specialist's name, always with \"another time\".", "s3": "One add-on that completes her treatment, at the moment she books. Never a sales list.", "s4": "Consent first. At most two notes a month, 10am to 9pm. STOP works instantly."}, "ar": {"h2": "كلّ جلسة في موعدها.", "sub": "لكلّ برنامج جلسات مساره، وLoopdesk تمشي معه. وبعد جلستين أو ثلاث، تعرف وتيرة كلّ عميلة كما تعرفها أخصائيّتها.", "s1": "متى يحين موعد جلستها التالية، خدمةً خدمة.", "s2": "برسالة لطيفة باسم أخصائيّتها، وفيها دائمًا زرّ «وقت آخر».", "s3": "خدمة واحدة تكمّل نتيجتها، وهي تحجز. لا قوائم ولا إلحاح.", "s4": "بإذنها أولًا. رسالتان في الشهر على الأكثر، بين 10 صباحًا و9 مساءً. وكلمة «توقّف» توقف كلّ شيء فورًا."}}, "dental": {"en": {"h2": "Same patient. Never overdue.", "sub": "Every check-up has its interval. Loopdesk follows it, and learns each patient's pattern after a couple of visits.", "s1": "When each patient is really due: check-ups, cleanings, follow-ups.", "s2": "A friendly note in their dentist's name, always with \"another time\".", "s3": "The cleaning or whitening that fits, at the moment they book. Never a sales list.", "s4": "Consent first. At most two notes a month, 10am to 9pm. STOP works instantly."}, "ar": {"h2": "كلّ فحص في موعده.", "sub": "لكلّ فحص دوري موعده، وLoopdesk لا تنساه. وبعد زيارتين، تعرف كلّ مريض كما يعرفه طبيبه.", "s1": "موعد كلّ مريض القادم: فحصًا كان أو تنظيفًا أو متابعة.", "s2": "برسالة لطيفة باسم طبيبه، وفيها دائمًا زرّ «وقت آخر».", "s3": "تنظيف أو تبييض يناسبه، وهو يحجز. لا قوائم ولا إلحاح.", "s4": "بإذنه أولًا. رسالتان في الشهر على الأكثر، بين 10 صباحًا و9 مساءً. وكلمة «توقّف» توقف كلّ شيء فورًا."}}, "barber": {"en": {"h2": "Same client. Sharp, more often.", "sub": "Every cut has its cycle. Loopdesk learns each client's rhythm after two or three visits.", "s1": "When each client really needs a cut or a trim.", "s2": "A friendly note from his usual barber, always with \"another time\".", "s3": "The beard trim or hot towel that suits him, at the moment he books. Never a sales list.", "s4": "Consent first. At most two notes a month, 10am to 9pm. STOP works instantly."}, "ar": {"h2": "الزبون نفسه، وكرسيّه بانتظاره.", "sub": "لكلّ قصّة شعر دورتها. وبعد زيارتين أو ثلاث، تعرف Loopdesk إيقاع كلّ زبون كما يعرفه حلّاقه.", "s1": "متى يحتاج كلّ زبون قصّته أو تهذيب لحيته فعلًا.", "s2": "برسالة لطيفة باسم حلّاقه المعتاد، وفيها دائمًا زرّ «وقت آخر».", "s3": "تهذيب لحية أو منشفة ساخنة تناسبه، وهو يحجز. لا قوائم ولا إلحاح.", "s4": "بإذنه أولًا. رسالتان في الشهر على الأكثر، بين 10 صباحًا و9 مساءً. وكلمة «توقّف» توقف كلّ شيء فورًا."}}};
  function copyFor(){var c=COPY[current];['en','ar'].forEach(function(l){document.querySelectorAll('#rhythm .'+l+'[data-c], #rhythm .'+l+' [data-c]').forEach(function(el){var t=c[l][el.dataset.c];if(t)el.textContent=t})})}

  var AR_DIG='0123456789';
  function fmt(n){var t=n.toLocaleString('en-US');return t}
  function visitsWord(v){if(!isAr())return fmt(v)+(v===1?' visit':' visits');return v===1?'زيارة واحدة':v===2?'زيارتان':fmt(v)+(v<=10?' زيارات':' زيارة')}
  function aed(n){return isAr()?fmt(n)+' درهم':'AED '+fmt(n)}
  function fill(id,c){var t=document.getElementById(id);if(!t)return;t.innerHTML='';
    for(var w=1,i=0;w<=52;w+=c,i++){var d=document.createElement('i');d.style.insetInlineStart=((w-1)/51*100)+'%';d.style.animationDelay=(i*40)+'ms';t.appendChild(d)}}
  function fitTabs(){var nw=document.querySelector('.nav .wrap'),bd=nw&&nw.querySelector('.btn-dark');if(bd){bd.style.display='';if(nw.scrollWidth>nw.clientWidth+1)bd.style.display='none';}var sg=document.querySelector('.seg.tabs');if(!sg)return;sg.classList.remove('compact');if(sg.scrollWidth>sg.clientWidth+1)sg.classList.add('compact');}
  window.addEventListener('resize',fitTabs);
  function draw(){setTimeout(fitTabs,0);
    if(!document.getElementById('rhythm'))return;
    copyFor();
    var G={salon:['more from one client','دخل إضافي من عميلة واحدة'],cosmetic:['more from one client','دخل إضافي من عميلة واحدة'],dental:['more from one patient','دخل إضافي من مريض واحد'],barber:['more from one client','دخل إضافي من زبون واحد']}[current];
    document.getElementById('gainlbl-en').textContent=G[0];document.getElementById('gainlbl-ar').textContent=G[1];
    var d=DATA[current], L=isAr()?d.ar:d.en;
    var vo=Math.floor(51/d.off)+1, vn=Math.floor(51/d.on)+1, ro=vo*d.price, rn=vn*d.price;
    document.getElementById('who').textContent=L.who;
    document.getElementById('offnote').textContent=L.off;
    document.getElementById('onnote').textContent=L.on;
    fill('trackOff',d.off); fill('trackOn',d.on);
    document.getElementById('offv').textContent=visitsWord(vo);
    document.getElementById('onv').textContent=visitsWord(vn);
    document.getElementById('offr').textContent=aed(ro);
    document.getElementById('onr').textContent=aed(rn);
    document.getElementById('gainv').textContent='+'+fmt(vn-vo);
    document.getElementById('gainr').textContent='+'+aed(rn-ro);
    document.getElementById('scale').textContent=L.scale.replace('{T}',fmt((rn-ro)*d.n));
    var m=document.getElementById('months'); m.innerHTML='';
    (isAr()?['يناير','أبريل','يوليو','أكتوبر','ديسمبر']:['Jan','Apr','Jul','Oct','Dec']).forEach(function(x){var s=document.createElement('span');s.textContent=x;m.appendChild(s)});
  }
  document.querySelectorAll('.tabs button').forEach(function(b){
    b.addEventListener('click',function(){current=b.dataset.k;
      document.querySelectorAll('.tabs button').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});draw();});
  });

  var saved='en'; try{saved=localStorage.getItem('ld-lang')||'en'}catch(e){}
  setLang(saved);
  btn.addEventListener('click',function(){setLang(isAr()?'en':'ar')});

  function route(){
    var h=(location.hash||'#home').slice(1);
    if(h==='privacy'||h==='terms'){location.replace('/'+h);return}
    var view='home';
    document.querySelectorAll('[data-view]').forEach(function(v){v.hidden = v.dataset.view!==view});
    if(view!=='home'||h==='home'){window.scrollTo(0,0)}
    else {var e=document.getElementById(h); if(e) e.scrollIntoView()}
  }
  window.addEventListener('hashchange',route); route();
  try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',draw)}catch(e){}
  new MutationObserver(draw).observe(root,{attributes:true,attributeFilter:['data-theme']});

  document.querySelectorAll('[data-copy]').forEach(function(b){
    b.addEventListener('click',function(){
      var t=b.dataset.copy, label=b.innerHTML;
      function done(){b.textContent = isAr()?'تم النسخ':'Copied'; setTimeout(function(){b.innerHTML=label},1500)}
      function sel(){var s=document.getElementById('mailaddr'),r=document.createRange();r.selectNodeContents(s);var w=getSelection();w.removeAllRanges();w.addRange(r)}
      try{navigator.clipboard.writeText(t).then(done,sel)}catch(e){sel()}
    });
  });
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
  var CHAT_LIVE=false;
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
  /* The floating button steps aside while the Book a demo card is on screen (it has its own chat button). */
  var fl=document.querySelector('.ld-float'), card=document.querySelector('.pilot-card');
  if(fl&&card&&'IntersectionObserver' in window)new IntersectionObserver(function(e){fl.classList.toggle('away',e[0].isIntersecting)}).observe(card);
  new MutationObserver(links).observe(root,{attributes:true,attributeFilter:['class']});
})();
