import { copyFileSync } from 'node:fs'

// GitHub Pages serves 404.html for unknown deep links. Reuse our built SPA
// entrypoint so /newsletter, /projects, /admin, etc. render on a fresh load.
copyFileSync('dist/index.html', 'dist/404.html')
