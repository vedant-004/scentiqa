import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Scentiqa — Indian Perfume Finder',
    short_name: 'Scentiqa',
    description: 'Blind-panel dupe lab, verified INR prices and climate-tested reviews for India.',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf7f2',
    theme_color: '#b45309',
    categories: ['shopping', 'lifestyle'],
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
}
