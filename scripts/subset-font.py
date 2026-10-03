"""Rebuilds src/fonts/archivo-var-subset.woff2 from the @fontsource-variable/archivo package.

Keeps only what the site uses: Latin glyphs, weight 400-800 and width 100-125%.
That cuts the file roughly in half (about 90 KB down to about 48 KB).

Requires: pip install fonttools brotli
Run from the repo root after `npm install`:  python3 scripts/subset-font.py
"""
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

root = Path(__file__).resolve().parent.parent
src = root / 'node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2'
out = root / 'src/fonts/archivo-var-subset.woff2'

font = TTFont(src)
font = instancer.instantiateVariableFont(font, {'wght': (400, 800), 'wdth': (100, 125)})

options = subset.Options()
options.flavor = 'woff2'
options.layout_features = ['kern', 'liga', 'calt', 'tnum', 'lnum', 'case']
options.name_IDs = ['*']
options.notdef_outline = True

text = ''.join(chr(c) for c in range(0x20, 0x7F))  # Basic Latin
text += ''.join(chr(c) for c in range(0xA0, 0x100))  # Latin-1 (é in résumé, ©, etc.)
text += '–—‘’‚“”„•…′″‹›€→←↑↓↗−×≈≤≥✓·'

subsetter = subset.Subsetter(options)
subsetter.populate(text=text)
subsetter.subset(font)
font.flavor = 'woff2'
font.save(out)
print(f'Wrote {out.relative_to(root)} ({out.stat().st_size / 1024:.1f} KB)')
