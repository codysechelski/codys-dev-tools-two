# Microsoft Store listing images

Partner Center → Cody's Dev Tools → submission → **Store listings → English**. Regenerate with `npm run store-art`.

| File | Partner Center slot | Size | Needed? |
|---|---|---|---|
| `01-app-tile-icon-300x300.png` | Store logos → **1:1 App tile icon** | 300 × 300 | Required |
| `02-box-art-2160x2160.png` | Store logos → **1:1 Box art** | 2160 × 2160 | Recommended: used in Store search results and on Windows 11 |
| `03-poster-art-1440x2160.png` | Store logos → **9:16 Poster art** | 1440 × 2160 | Recommended: the main logo on Xbox and in some Store layouts |
| `04-super-hero-art-3840x2160.png` | Store display images → **16:9 Super hero art** | 3840 × 2160 | Optional: needed only to be featured at the top of the Store. No text on purpose; the Store overlays the title. |
| `../screenshots/windows/01-…` to `07-…` | **Screenshots → Desktop**, in order | 2560 × 1440 | At least 1 required |

Leave the Xbox image slots (branded key art, titled hero art, featured promotional square art) empty; they're only for Xbox games.

The app's own icons (Start menu, taskbar, tiles) aren't uploaded here. They're built into the `.appx` from `build/appx/` (`npm run store-assets`).
