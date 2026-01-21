import sys
from pathlib import Path
p = Path('..\\blog\\2025-12-15-1765780806619-region-ebaaa9ed-keyword-ec84b1ec.html.bak').resolve()
bytes_data = p.read_bytes()
encodings = ['utf-8','cp949','euc-kr','latin1']
results = []
for e in encodings:
    try:
        text = bytes_data.decode(e)
    except Exception as ex:
        text = ''
    hangul = sum(1 for ch in text if '\uac00' <= ch <= '\ud7af')
    replaced = text.count('\ufffd')
    results.append((e, hangul, replaced, text[:400]))
out = Path('encoding_detect.txt')
with out.open('w', encoding='utf-8') as f:
    for e,hangul,repl,sample in results:
        f.write(f"Encoding: {e}\nHangul count: {hangul}\nReplacement chars: {repl}\nSample:\n{sample}\n\n---\n\n")
print('WROTE', out.resolve())
