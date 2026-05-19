import re

ROOT_FILES = [
    'index.html',
    'cadena-valor.html',
    'match-creativo.html',
    'lluvia-ideas.html'
]
DEEP_FILES = [
    'instrumentos/cdps/dashboard.html',
    'instrumentos/cdps/infografia.html'
]

NAV_PATTERN = re.compile(
    r'<div class="nav-item">\s*<button class="nav-link(?:\s+active)?">CDPS.*?</div>\s*</div>',
    re.DOTALL
)

NEW_NAV_ROOT = '''<div class="nav-item">
      <button class="nav-link">Instrumentos <svg viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 1l4 4 4-4"/></svg></button>
      <div class="nav-dropdown">
        <a href="cdps.html">CDPS</a>
      </div>
    </div>'''

NEW_NAV_DEEP = '''<div class="nav-item">
      <button class="nav-link active">Instrumentos <svg viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 1l4 4 4-4"/></svg></button>
      <div class="nav-dropdown">
        <a href="../../cdps.html" class="current">CDPS</a>
      </div>
    </div>'''

for f in ROOT_FILES:
    try:
        with open(f, 'r', encoding='utf-8') as fh:
            c = fh.read()
        if NAV_PATTERN.search(c):
            c = NAV_PATTERN.sub(NEW_NAV_ROOT, c)
            with open(f, 'w', encoding='utf-8') as fh:
                fh.write(c)
            print("Updated", f)
        else:
            print("No match in", f)
    except Exception as e:
        print("Error in", f, e)

for f in DEEP_FILES:
    try:
        with open(f, 'r', encoding='utf-8') as fh:
            c = fh.read()
        if NAV_PATTERN.search(c):
            c = NAV_PATTERN.sub(NEW_NAV_DEEP, c)
            with open(f, 'w', encoding='utf-8') as fh:
                fh.write(c)
            print("Updated", f)
        else:
            print("No match in", f)
    except Exception as e:
        print("Error in", f, e)

print("Done")
