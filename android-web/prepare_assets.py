"""Copy the web app (docs/) into the APK's assets, adjusted for running inside the app."""
import os, shutil, sys
root = os.path.dirname(os.path.abspath(__file__))
src, dst = os.path.join(root, '..', 'docs'), os.path.join(root, 'app', 'src', 'main', 'assets', 'www')
shutil.rmtree(dst, ignore_errors=True)
shutil.copytree(src, dst, ignore=shutil.ignore_patterns('*.md', 'old-test.html', 'sw.js'))
p = os.path.join(dst, 'index.html'); t = open(p, encoding='utf-8').read()
reg = '<script>if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});</script>'
assert reg in t, 'service worker line not found'
t = t.replace(reg, '')                     # everything is already inside the app: no offline cache needed
# pictures the app "downloads" go to the phone's gallery
hook = '''<script>(function () {
  if (!window.TFNative) return;
  const save = (a) => fetch(a.href).then((r) => r.blob()).then((b) => new Promise((ok) => { const f = new FileReader(); f.onload = () => ok(f.result); f.readAsDataURL(b); }))
    .then((d) => window.TFNative.saveImage(a.download || "transparent-fit.jpg", d));
  const click = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () { if (this.hasAttribute("download")) { save(this); return; } return click.call(this); };
})();</script>
'''
i = t.index('<script'); t = t[:i] + hook + t[i:]
open(p, 'w', encoding='utf-8').write(t)
total = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(dst) for f in fs)
print('assets ready:', round(total / 1e6, 1), 'MB')
