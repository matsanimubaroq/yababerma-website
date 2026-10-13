'use client';

import { useEffect, useRef, useState } from 'react';

export default function CountUp({ end = 0, duration = 1800, prefix = '', suffix = '', className = '' }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf;
    const animate = () => {
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(Math.floor(eased * end));
        if (p < 1) raf = requestAnimationFrame(tick);
        else setVal(end);
      };
      raf = requestAnimationFrame(tick);
    };
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          if (!started.current) { started.current = true; animate(); }
          else setVal(end);
        }
      });
    }, { threshold: 0.3 });
    obs.observe(el);
    if (started.current) setVal(end);
    return () => { obs.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, [end, duration]);

  return <span ref={ref} className={className}>{prefix}{val.toLocaleString('id-ID')}{suffix}</span>;
}
