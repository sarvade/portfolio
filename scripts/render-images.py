"""Regenerates public/og.png, public/favicon-32.png and public/apple-touch-icon.png.

Requires Python Playwright with Chromium (pip install playwright && playwright install chromium).
Run from the repo root:  python3 scripts/render-images.py
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parent.parent
og = (root / 'scripts/og/og.html').as_uri()
icon = (root / 'public/favicon.svg').read_text()

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 1200, 'height': 630})
    page.goto(og)
    page.evaluate('document.fonts.ready')
    page.wait_for_timeout(300)
    page.screenshot(path=str(root / 'public/og.png'))

    for size, name in [(32, 'favicon-32.png'), (180, 'apple-touch-icon.png')]:
        pg = browser.new_page(viewport={'width': size, 'height': size})
        pad = 0 if size <= 32 else 0
        pg.set_content(
            f'<html><body style="margin:0;background:#0b1a2b">'
            f'<div style="width:{size}px;height:{size}px;padding:{pad}px">{icon.replace("<svg ", f"<svg width=\"{size}\" height=\"{size}\" ")}</div>'
            f'</body></html>'
        )
        pg.screenshot(path=str(root / 'public' / name), omit_background=False)
    browser.close()
print('done')
