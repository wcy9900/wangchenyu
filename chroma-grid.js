/* Adapted from the supplied React Bits ChromaGrid. */
(function(){
'use strict';
const root = document.getElementById('certChroma');
if (!root) return;
const settingsRef = { current: { damping: .45, fadeOut: .6, spotlight: true } };
const placeRef = { current: null };
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const state = { x: 0, y: 0, tx: 0, ty: 0, power: 0, target: 0, primed: false };
    let raf = 0;
    let last = 0;

    const place = () => {
      const box = root.getBoundingClientRect();
      root.querySelectorAll('[data-chroma-area]').forEach(node => {
        const rect = node.getBoundingClientRect();
        node.style.setProperty('--chroma-ox', `${rect.left - box.left}px`);
        node.style.setProperty('--chroma-oy', `${rect.top - box.top}px`);
      });
    };
    placeRef.current = place;

    const frame = now => {
      raf = 0;
      const s = settingsRef.current;
      if (!s) return;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const follow = reduce ? 1 : 1 - Math.exp(-dt / Math.max(0.01, s.damping * 0.32));
      state.x += (state.tx - state.x) * follow;
      state.y += (state.ty - state.y) * follow;
      const span = state.target > state.power ? 0.1 : Math.max(0.02, s.fadeOut * 0.35);
      state.power += (state.target - state.power) * (reduce ? 1 : 1 - Math.exp(-dt / span));
      root.style.setProperty('--chroma-x', `${state.x.toFixed(2)}px`);
      root.style.setProperty('--chroma-y', `${state.y.toFixed(2)}px`);
      root.style.setProperty('--chroma-power', state.power.toFixed(4));
      const settled =
        Math.abs(state.tx - state.x) < 0.1 &&
        Math.abs(state.ty - state.y) < 0.1 &&
        Math.abs(state.target - state.power) < 0.002;
      if (settled) {
        state.power = state.target;
        root.style.setProperty('--chroma-power', state.power.toFixed(4));
        last = 0;
      } else {
        raf = requestAnimationFrame(frame);
      }
    };

    const wake = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const onMove = event => {
      if (!settingsRef.current?.spotlight) return;
      // Card positions change during their short entrance; keep the spotlight aligned.
      if (root.querySelector('[data-content-entrance="playing"]')) place();
      const box = root.getBoundingClientRect();
      state.tx = event.clientX - box.left;
      state.ty = event.clientY - box.top;
      if (!state.primed || state.power < 0.02) {
        state.x = state.tx;
        state.y = state.ty;
        state.primed = true;
      }
      state.target = 1;
      wake();
    };

    const onLeave = () => {
      state.target = 0;
      wake();
    };

    const resizeObserver = new ResizeObserver(place);
    resizeObserver.observe(root);
    root.addEventListener('animationend', event => { if (event.animationName === 'contentEntrance') place(); });
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerdown', onMove);
    root.addEventListener('pointerleave', onLeave);
    root.addEventListener('pointercancel', onLeave);
    place();


})();
