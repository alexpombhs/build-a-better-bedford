import { copyFileSync, mkdirSync } from 'node:fs'

// GitHub Pages serves 404.html for unknown deep links. Keep the SPA
// fallback so direct /newsletter, /admin, etc. visits continue to work.
copyFileSync('dist/index.html', 'dist/404.html')

// Also generate proper 200-response entrypoints for shareable Projects tabs.
// This avoids relying on the 404 fallback for links shared with other people.
// Vite assets use the configured absolute base path, so nested copies load them.
for (const route of ['projects', 'projects/simulators', 'projects/hands-on']) {
  const folder = 'dist/' + route
  mkdirSync(folder, { recursive: true })
  copyFileSync('dist/index.html', folder + '/index.html')
}
