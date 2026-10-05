# -*- coding: utf-8 -*-
"""把 index.html + css + js 打包成单文件 standalone.html，便于传到手机离线打开。

用法： python build_standalone.py
每次改完术语库（assets/js/terms.js）重新执行一次即可。
"""
import os
import re

BASE = os.path.dirname(os.path.abspath(__file__))


def read(path):
    with open(os.path.join(BASE, path), encoding='utf-8') as f:
        return f.read()


html = read('index.html')
css = read('assets/css/style.css')

html = html.replace(
    '<link rel="stylesheet" href="assets/css/style.css">',
    '<style>\n' + css + '\n</style>'
)


def inline_script(m):
    return '<script>\n' + read(m.group(1)) + '\n</script>'


html = re.sub(r'<script src="([^"]+)"></script>', inline_script, html)

if 'assets/js/' in html or 'assets/css/' in html:
    raise SystemExit('仍有未内联的外部资源引用，请检查 index.html')

banner = '<!-- 架构术语学习通 单文件版：由 build_standalone.py 自动生成，请勿手动编辑 -->\n'
out = os.path.join(BASE, 'standalone.html')
with open(out, 'w', encoding='utf-8') as f:
    f.write(banner + html)

print('已生成 standalone.html  %.1f KB' % (os.path.getsize(out) / 1024))
