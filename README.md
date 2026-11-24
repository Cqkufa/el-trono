# El Trono

PWA instalable del juego El Trono. Sitio estático (GitHub Pages) + Supabase (cuentas, datos y tiempo real).

- `index.html`: la app completa (diseño y lógica de juego).
- `manifest.webmanifest`, `icons/`: instalación en Android e iOS.
- `sw.js`: service worker. Cachea solo archivos estáticos; nunca datos de Supabase.
- `offline.html`: pantalla sin conexión.
- `vendor/supabase.js`: supabase-js 2.119.0 (UMD).

Para publicar una versión nueva: cambiá `VERSION` en `sw.js` y la app mostrará "Hay una versión nueva" a quien la tenga abierta.
