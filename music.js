(function () {
  'use strict';
  const audio = document.createElement('audio');
  audio.id = 'background-music';
  audio.src = 'music-assets/background.mp3';
  audio.preload = 'auto';
  audio.loop = false;
  const button = document.createElement('button');
  button.id = 'music-toggle';
  button.type = 'button';
  button.innerHTML = '<span class="music-art" aria-hidden="true"></span><span class="music-off" aria-hidden="true"></span>';
  const style = document.createElement('style');
  style.textContent = `
    #music-toggle{position:fixed;z-index:200000;width:40px;height:42px;padding:2px;border:0;background:transparent;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
    #music-toggle .music-art{display:block;width:36px;height:38px;background:url('music-assets/music.png') -26.84px -20.96px/83.84px 74.24px no-repeat;filter:drop-shadow(0 2px 1px #30241c)}
    #music-toggle .music-off{display:none;position:absolute;left:8px;top:20px;width:26px;height:3px;background:#f6dfb1;box-shadow:0 0 0 1px #61432c;transform:rotate(-45deg);pointer-events:none}
    #music-toggle[data-playing="false"] .music-off{display:block}
    #music-toggle:focus-visible{outline:2px solid #eec782;outline-offset:2px}
  `;
  document.head.append(style);document.body.append(audio,button);
  let wanted = true, pending = false;
  function sync() {
    const playing = !audio.paused && !audio.ended;
    button.dataset.playing = String(playing);
    button.setAttribute('aria-pressed',String(playing));
    const label = playing ? '暂停背景音乐' : audio.ended ? '重新播放背景音乐' : '播放背景音乐';
    button.setAttribute('aria-label',label);button.title=label;
  }
  async function play() {
    if (pending) return;
    pending=true;
    if(audio.ended)audio.currentTime=0;
    try { await audio.play(); if(!wanted)audio.pause(); } catch (_) { /* Retry on the first user gesture. */ }
    finally {pending=false;sync();}
  }
  button.onclick=function(e){e.stopPropagation();if(!audio.paused||pending){wanted=false;audio.pause();sync();}else{wanted=true;play();}};
  document.addEventListener('click',function(e){if(e.composedPath().includes(button))return;if(wanted&&audio.paused&&!audio.ended)play();},true);
  audio.addEventListener('ended',function(){wanted=false;sync();});
  ['play','pause','error'].forEach(type=>audio.addEventListener(type,sync));
  document.addEventListener('WeixinJSBridgeReady',function(){if(wanted)play();});
  function position(){
    const v=window.visualViewport, w=v?v.width:innerWidth,h=v?v.height:innerHeight;
    const x=v?v.offsetLeft:0,y=v?v.offsetTop:0;
    const quiz=window.H5App&&H5App.active==='quiz'&&!document.getElementById('story-overlay');
    // Reserve a slim music strip above the scaled quiz, including its tallest answer panels.
    if(quiz){const host=document.getElementById('quiz-scene');if(host){host.style.setProperty('--fit',Math.min(w/390,(h-48)/844));host.shadowRoot.querySelector('#stage').style.top='calc(50% + 24px)';}}
    button.style.left=(x+w-48)+'px';button.style.top=(y+6)+'px';
  }
  position();setInterval(position,150);addEventListener('resize',position);
  if(window.visualViewport){visualViewport.addEventListener('resize',position);visualViewport.addEventListener('scroll',position);}
  sync();play();
})();
