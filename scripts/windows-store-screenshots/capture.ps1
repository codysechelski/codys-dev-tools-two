param([string]$Only = '')
# Captures Microsoft Store screenshots of the sideloaded app inside this VM. Drives the app over
# the local DevTools port (127.0.0.1 only) and grabs the real window, native title bar included.
$ErrorActionPreference = 'Stop'
$exe = "C:\cdt\cdt-store\app\Cody's Dev Tools.exe"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$outDir = Join-Path $here 'out'
New-Item -ItemType Directory $outDir -Force | Out-Null
$shots = Get-Content (Join-Path $here 'shots.json') -Raw -Encoding UTF8 | ConvertFrom-Json

Add-Type -AssemblyName System.Drawing
Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class W {
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h, IntPtr a, int x, int y, int cx, int cy, uint f);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c);
  [DllImport("user32.dll")] public static extern void keybd_event(byte k, byte s, uint f, UIntPtr e);
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
  [DllImport("dwmapi.dll")] public static extern int DwmGetWindowAttribute(IntPtr h, int a, out RECT r, int s);
  [DllImport("dwmapi.dll")] public static extern int DwmSetWindowAttribute(IntPtr h, int a, ref int v, int s);
}
'@
[W]::SetProcessDPIAware() | Out-Null

$script:ws = $null
$script:nextId = 0
function Cdp([string]$method, $params = @{}) {
  $script:nextId++
  $id = $script:nextId
  $msg = @{ id = $id; method = $method; params = $params } | ConvertTo-Json -Depth 10 -Compress
  $bytes = [Text.Encoding]::UTF8.GetBytes($msg)
  $script:ws.SendAsync([ArraySegment[byte]]$bytes, 'Text', $true, [Threading.CancellationToken]::None).Wait()
  while ($true) {
    $sb = New-Object Text.StringBuilder
    do {
      $buf = New-Object byte[] 65536
      $r = $script:ws.ReceiveAsync([ArraySegment[byte]]$buf, [Threading.CancellationToken]::None).Result
      [void]$sb.Append([Text.Encoding]::UTF8.GetString($buf, 0, $r.Count))
    } while (-not $r.EndOfMessage)
    $reply = $sb.ToString() | ConvertFrom-Json
    if ($reply.id -eq $id) {
      if ($reply.error) { throw "$method failed: $($reply.error.message)" }
      return $reply.result
    }
  }
}
function Js([string]$expr) {
  $r = Cdp 'Runtime.evaluate' @{ expression = $expr; returnByValue = $true; awaitPromise = $true }
  return $r.result.value
}
function Key([string]$key, [string]$code, [int]$vk, [int]$mods) {
  Cdp 'Input.dispatchKeyEvent' @{ type = 'rawKeyDown'; key = $key; code = $code; windowsVirtualKeyCode = $vk; modifiers = $mods } | Out-Null
  Cdp 'Input.dispatchKeyEvent' @{ type = 'keyUp'; key = $key; code = $code; windowsVirtualKeyCode = $vk; modifiers = $mods } | Out-Null
}

function Resize-To($hwnd) {
  # Sizes the visible frame (without the invisible resize borders) to exactly 2560 x 1440.
  $cx = 2560; $cy = 1440
  for ($i = 0; $i -lt 4; $i++) {
    [W]::SetWindowPos($hwnd, [IntPtr]::Zero, 40, 40, $cx, $cy, 0x0040) | Out-Null
    Start-Sleep -Milliseconds 400
    $r = New-Object W+RECT
    [W]::DwmGetWindowAttribute($hwnd, 9, [ref]$r, 16) | Out-Null
    $dw = 2560 - ($r.R - $r.L); $dh = 1440 - ($r.B - $r.T)
    if ($dw -eq 0 -and $dh -eq 0) { return }
    $cx += $dw; $cy += $dh
  }
}

foreach ($shot in $shots) {
  if ($Only -and -not ($Only.Split(',') | Where-Object { $shot.file.Contains($_) })) { continue }
  $userData = "C:\cdt\shots-profile\$($shot.file)"
  Remove-Item $userData -Recurse -Force -ErrorAction SilentlyContinue
  New-Item -ItemType Directory $userData -Force | Out-Null
  [IO.File]::WriteAllText("$userData\settings.json", (@{ themeMode = $shot.theme } | ConvertTo-Json -Compress))

  $proc = Start-Process -FilePath $exe -ArgumentList "--user-data-dir=`"$userData`"", '--remote-debugging-port=9222', '--force-device-scale-factor=1.75' -PassThru
  $target = $null
  for ($i = 0; $i -lt 60 -and -not $target; $i++) {
    Start-Sleep -Milliseconds 500
    try { $target = (Invoke-RestMethod 'http://127.0.0.1:9222/json') | Where-Object { $_.type -eq 'page' } | Select-Object -First 1 } catch {}
  }
  if (-not $target) { throw 'App did not open a DevTools target' }
  $script:ws = New-Object Net.WebSockets.ClientWebSocket
  $script:ws.ConnectAsync([Uri]$target.webSocketDebuggerUrl, [Threading.CancellationToken]::None).Wait()
  for ($i = 0; $i -lt 60 -and -not (Js "!!document.querySelector('.sidebar')"); $i++) { Start-Sleep -Milliseconds 250 }

  # The main window: the newest process with that name and a window handle.
  $hwnd = [IntPtr]::Zero
  for ($i = 0; $i -lt 40 -and $hwnd -eq [IntPtr]::Zero; $i++) {
    $p = Get-Process -Name "Cody's Dev Tools" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero } | Select-Object -First 1
    if ($p) { $hwnd = $p.MainWindowHandle } else { Start-Sleep -Milliseconds 250 }
  }
  [W]::ShowWindow($hwnd, 9) | Out-Null
  # Square corners, so the desktop behind doesn't show through the rounded ones.
  $square = 1
  [W]::DwmSetWindowAttribute($hwnd, 33, [ref]$square, 4) | Out-Null
  Resize-To $hwnd

  $tool = $shot.tool -replace "'", "\'"
  Js "(() => { const el = [...document.querySelectorAll('.sidebar *')].find(e => e.children.length === 0 && e.textContent.trim() === '$tool'); el.click(); return true; })()" | Out-Null
  Start-Sleep -Milliseconds 700
  $index = 0
  foreach ($text in $shot.inputs) {
    Js "document.querySelectorAll('.cm-content')[$index].focus()" | Out-Null
    Key 'a' 'KeyA' 65 2
    Cdp 'Input.insertText' @{ text = $text } | Out-Null
    Key 'Home' 'Home' 36 2
    $index++
  }
  if ($shot.fill) {
    $sel = $shot.fill.selector -replace "'", "\'"
    $val = $shot.fill.value -replace "'", "\'"
    Js "(() => { const el = document.querySelector('$sel'); const proto = Object.getPrototypeOf(el); Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, '$val'); el.dispatchEvent(new Event('input', { bubbles: true })); return true; })()" | Out-Null
  }
  Js "(() => { const s = document.createElement('style'); s.textContent = '* { pointer-events: none !important; }'; document.head.append(s); document.activeElement && document.activeElement.blur(); return true; })()" | Out-Null
  Start-Sleep -Milliseconds 1500

  # Alt tap lets this process bring the window to the front, so the title bar renders as focused.
  [W]::keybd_event(0x12, 0, 0, [UIntPtr]::Zero); [W]::keybd_event(0x12, 0, 2, [UIntPtr]::Zero)
  [W]::SetForegroundWindow($hwnd) | Out-Null
  Resize-To $hwnd
  Start-Sleep -Milliseconds 800

  $rect = New-Object W+RECT
  [W]::DwmGetWindowAttribute($hwnd, 9, [ref]$rect, 16) | Out-Null
  $w = $rect.R - $rect.L; $h = $rect.B - $rect.T
  $bmp = New-Object Drawing.Bitmap $w, $h
  $g = [Drawing.Graphics]::FromImage($bmp)
  $g.CopyFromScreen($rect.L, $rect.T, 0, 0, $bmp.Size)
  $bmp.Save((Join-Path $outDir $shot.file), [Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
  "Wrote $($shot.file) ($w x $h)"

  $script:ws.Dispose()
  Get-Process -Name "Cody's Dev Tools" -ErrorAction SilentlyContinue | Stop-Process -Force
  Start-Sleep -Milliseconds 800
}
