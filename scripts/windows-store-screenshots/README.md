# Windows Store screenshots

`capture.ps1` takes the Microsoft Store screenshots (2560 × 1440) inside a Windows VM, from the sideloaded Store build (`C:\cdt\cdt-store`, see docs/store-releases.md). It launches the app with a throwaway profile and a local-only DevTools port, fills each tool with the sample input from `shots.json`, and captures the real window, native title bar included.

`shots.json` is generated from the shot list in `scripts/capture-store-screenshots.mjs`, so both stores show the same content. Copy both files to `C:\cdt\win-shots` and run:

    powershell -ExecutionPolicy Bypass -File C:\cdt\win-shots\capture.ps1 [-Only json,regex]

Output lands in `C:\cdt\win-shots\out`. Commit the results to `store/screenshots/windows/`. It closes every running copy of the app, so don't use the app while it runs.
