(function () {
  'use strict';
  // Keep the card controls inside the actual visible mobile viewport.
  const template = document.getElementById('knowledge-template');
  const style = document.createElement('style');
  style.textContent = `
    :host{overflow:hidden;-webkit-text-size-adjust:100%;text-size-adjust:100%}
    .scene-body{height:100%!important;min-height:0;overflow:hidden}
    main{box-sizing:border-box;width:100%;max-width:480px;height:100%!important;min-height:0;overflow:hidden;display:grid;grid-template-rows:auto minmax(0,1fr) auto auto}
    .shell{min-height:0;overflow:hidden}
    .reading{min-height:0;overflow-y:auto!important;touch-action:pan-y;-webkit-overflow-scrolling:touch;overscroll-behavior-y:contain}
    .controls,.home{position:relative;z-index:2;touch-action:manipulation}
  `;
  template.content.append(style);
  function fit() {
    const host = document.getElementById('knowledge-scene');
    if (!host) return;
    const v = window.visualViewport;
    Object.assign(host.style, {
      top: (v ? v.offsetTop : 0) + 'px',
      left: (v ? v.offsetLeft : 0) + 'px',
      right: 'auto', bottom: 'auto',
      width: (v ? v.width : window.innerWidth) + 'px',
      height: (v ? v.height : window.innerHeight) + 'px'
    });
  }
  const show = H5App.show;
  H5App.show = function (kind) { show.call(this, kind); if (kind === 'knowledge') fit(); };
  addEventListener('resize', fit);
  if (window.visualViewport) {
    visualViewport.addEventListener('resize', fit);
    visualViewport.addEventListener('scroll', fit);
  }
  // Let the browser scroll the card; the original story gesture handler must not consume it.
  let tap = null;
  ['touchstart', 'touchmove', 'touchend', 'touchcancel', 'pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'mousedown', 'mousemove', 'mouseup'].forEach(type => {
    window.addEventListener(type, function (event) {
      if (H5App.active !== 'knowledge') return;
      if (type === 'touchstart') {
        const button = event.composedPath().find(e => e.matches && e.matches('button,a.home'));
        const t = event.touches[0];
        tap = button && t ? {button, x:t.clientX, y:t.clientY} : null;
      }
      if (type === 'touchend' && tap) {
        const t = event.changedTouches[0], saved = tap; tap = null;
        if (t && Math.hypot(t.clientX-saved.x,t.clientY-saved.y)<10) {
          event.preventDefault();
          saved.button.click();
        }
      }
      if (type === 'touchcancel') tap = null;
      event.stopImmediatePropagation();
    }, {capture: true, passive: type !== 'touchend'});
  });
})();
