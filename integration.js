(function () {
  'use strict';
  // A drag must not become a click on the full-page story continuation hotspot.
  var down=null,moved=false,suppressUntil=0;
  document.addEventListener('pointerdown',function(e){down={x:e.clientX,y:e.clientY};moved=false;},true);
  document.addEventListener('pointermove',function(e){if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>12)moved=true;},true);
  document.addEventListener('pointerup',function(){if(moved)suppressUntil=Date.now()+500;down=null;},true);
  document.addEventListener('pointercancel',function(){suppressUntil=Date.now()+500;down=null;},true);
  document.addEventListener('click',function(e){if(window.H5App&&H5App.active==='knowledge')return;if(Date.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
  document.addEventListener('wheel',function(e){if(document.querySelector('#story-overlay')||window.H5App&&H5App.active!=='intro'){e.stopImmediatePropagation();return;}e.preventDefault();e.stopImmediatePropagation();},{capture:true,passive:false});
  document.addEventListener('keydown',function(e){if(window.H5App&&H5App.active!=='intro')return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','PageUp','PageDown','Home','End'].indexOf(e.key)>=0){e.preventDefault();e.stopImmediatePropagation();}},true);
  function start() {
    var api = window.Mugeda && Mugeda.getMugedaObject && Mugeda.getMugedaObject();
    var scene = api && api.scene;
    if (!scene || !scene.dom || scene.currentPageIndex == null) return setTimeout(start, 100);
    var button = document.createElement('button');
    button.id = 'continue-to-quiz';
    button.type = 'button';
    button.textContent = '开始答题';
    button.style.cssText = 'position:absolute;left:90px;top:563px;width:140px;height:43px;z-index:9999;border:2px solid #513629;background:#f0dfba;color:#3d5957;font:bold 16px "Microsoft YaHei",sans-serif;box-shadow:0 3px 0 #513629;cursor:pointer;display:none';
    function pageClip(index) { return scene.dom.querySelectorAll('[data-type="scene"] > .mugine_scene_clip')[index]; }
    if (!pageClip(3)) return setTimeout(start, 100);
    pageClip(3).appendChild(button);
    var label=document.createElement('div');label.id='invite-speaker';label.style.cssText='position:absolute;left:81px;top:473px;z-index:9997;font:900 12px "Microsoft YaHei",sans-serif;color:#315b55;background:#f4e6c8;padding:2px 6px;border-left:3px solid #315b55;display:none;pointer-events:none';pageClip(2).appendChild(label);
    var speakerLabels=['茉莉 · 惊喜','隆都 · 热情','茉莉 · 好奇','隆都 · 笑着','茉莉 · 期待'];
    var launching = false;
    button.addEventListener('click', function (e) {
      e.stopPropagation();
      if (launching) return;
      if (scene.currentPageIndex === 2) { scene.pause(); H5Story.walk(function(){scene.gotoPage(3);}); return; }
      if (scene.currentPageIndex !== 3) return;
      launching = true;
      scene.pause();
      H5App.show("quiz"); launching = false;
    });
    // Activate the cover's already drawn buttons without changing its artwork.
    var cover = document.createElement('button');
    cover.id = 'cover-start';cover.type = 'button';cover.setAttribute('aria-label','开饭，进入故事');
    cover.style.cssText='position:absolute;left:22px;top:468px;width:125px;height:112px;z-index:9998;border:0;background:transparent;cursor:pointer;display:none';
    cover.onclick=function(){scene.gotoPage(1);};pageClip(0).appendChild(cover);
    var knowledge=document.createElement('button');knowledge.id='cover-knowledge';knowledge.type='button';knowledge.setAttribute('aria-label','食知，饮食文化知识卡');
    knowledge.style.cssText='position:absolute;left:173px;top:468px;width:125px;height:112px;z-index:9998;border:0;background:transparent;cursor:pointer;display:none';
    knowledge.onclick=function(){H5App.show("knowledge");};pageClip(0).appendChild(knowledge);
    // Page 2 is a still scene; tapping it continues to the original dialogue animation.
    var street=document.createElement('button');street.id='street-continue';street.type='button';street.setAttribute('aria-label','进入人物对话');
    street.style.cssText='position:absolute;inset:0;width:320px;height:626px;z-index:9998;border:0;background:transparent;cursor:pointer;display:none';
    street.onclick=function(){scene.gotoPage(2);};pageClip(1).appendChild(street);
    function update(){
      var p=scene.currentPageIndex;
      var endDialogue=p===2 && scene.currentId>=15;var line=scene.currentId-10;label.style.display=p===2&&line>=0&&line<5?'block':'none';label.textContent=speakerLabels[line]||'';
      var host=pageClip(p===2?2:3);
      if(button.parentNode!==host)host.appendChild(button);
      button.style.display=p===3||endDialogue?'block':'none';
      button.textContent=p===3?'开始答题':'出发吧';
      cover.style.display=p===0?'block':'none';
      knowledge.style.display=p===0?'block':'none';
      street.style.display=p===1?'block':'none';
    }
    update();setInterval(update,100);
  }
  start();
})();
