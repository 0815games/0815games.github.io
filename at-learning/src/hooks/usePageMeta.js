import { useEffect } from 'react';

export function usePageMeta(title, description) {
  useEffect(() => {
    const fullTitle = title
      ? `${title} | @Learning Plochingen & Reutlingen`
      : '@Learning Plochingen & Reutlingen – IHK-Weiterbildung';
    document.title = fullTitle;

    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', description);
    }
  }, [title, description]);
}
