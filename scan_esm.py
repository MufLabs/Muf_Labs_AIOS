import os, re

pat = re.compile(r"""(?:from|import|require)\s*\(?\s*["'](\.[^"']*)["']""")
results = []
for pkg in ('kernel', 'agents'):
    root = os.path.join('packages', pkg, 'dist')
    for dp, _, fns in os.walk(root):
        for fn in fns:
            if not fn.endswith('.js') or '.d.ts' in fn or fn.endswith('.map'):
                continue
            path = os.path.join(dp, fn)
            try:
                with open(path, encoding='utf-8', errors='replace') as fh:
                    for i, line in enumerate(fh, 1):
                        for m in pat.finditer(line):
                            spec = m.group(1)
                            if spec.endswith('.js'):
                                continue
                            base = os.path.normpath(os.path.join(dp, spec))
                            if os.path.isfile(base + '.js'):
                                repl = spec + '.js'; kind = 'FILE'
                            elif os.path.isfile(os.path.join(base, 'index.js')):
                                repl = spec.rstrip('/') + '/index.js'; kind = 'DIR(index)'
                            else:
                                repl = '?'; kind = 'UNRESOLVED'
                            results.append((pkg, os.path.relpath(path).replace('\\', '/'), i, spec, kind, repl))
            except Exception as e:
                results.append((pkg, os.path.relpath(path).replace('\\', '/'), 0, f'<read err {e}>', '?', '?'))
for pkg in ('kernel', 'agents'):
    print(f'===== {pkg} =====')
    for p, f, ln, spec, kind, repl in sorted([r for r in results if r[0] == pkg], key=lambda r: (r[2], r[3])):
        print(f'  {f}:{ln}  {spec}  ->  [{kind}] {repl}')