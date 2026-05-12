import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('openalex-theme');
    return saved || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('openalex-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return { theme, setTheme };
}
