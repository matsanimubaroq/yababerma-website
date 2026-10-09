'use client';

import { useEffect, useState } from 'react';

export function useApi(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(path, { credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) {
          const text = await r.text();
          throw new Error(text || `HTTP error! status: ${r.status}`);
        }
        const contentType = r.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new TypeError("Response was not JSON");
        }
        return r.json();
      })
      .then((d) => {
        if (active) {
          setData(d);
          setError(null);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (active) {
          console.error(`API Error (${path}):`, e);
          setError(e);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [path]);

  return { data, loading, error };
}
