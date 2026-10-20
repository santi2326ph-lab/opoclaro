from __future__ import annotations
import argparse, hashlib, json, re
from pathlib import Path
from pypdf import PdfReader

parser = argparse.ArgumentParser(description='Clasifica PDFs privados por tema y registra solo metadatos y encabezados breves.')
parser.add_argument('--root', default=str(Path(__file__).resolve().parents[1]))
parser.add_argument('--source', default=None, help='Carpeta local privada que contiene los PDF')
args = parser.parse_args()
root = Path(args.root).resolve()
catalog = json.loads((root / 'data/tests/catalog.json').read_text(encoding='utf-8'))
topics = {item['numero']: item for item in catalog['oposiciones'][0]['temas']}
if args.source:
    source = Path(args.source).resolve()
else:
    candidates = [root / 'material-privado', root / 'materia-privado']
    existing = [directory for directory in candidates if directory.is_dir()]
    if len(existing) != 1:
        raise SystemExit(f'Indica --source: se encontraron {len(existing)} carpetas posibles.')
    source = existing[0]
pdfs = sorted(source.rglob('*.pdf'))
records, ambiguous, unreadable = [], [], []
for pdf in pdfs:
    match = re.search(r'(?i)\btema\s*[-_. ]*(\d{1,2})\b', pdf.stem)
    number = int(match.group(1)) if match else None
    if number not in topics:
        ambiguous.append({'file': pdf.name, 'reason': 'no contiene un número Tema 1–45 reconocible'})
        continue
    try:
        reader = PdfReader(str(pdf), strict=False)
        if reader.is_encrypted:
            raise ValueError('PDF cifrado')
        headings = []
        for page in reader.pages[:3]:
            text = page.extract_text() or ''
            for raw in text.splitlines():
                line = re.sub(r'\s+', ' ', raw).strip()
                if not line or len(line) > 105 or len(line) < 4:
                    continue
                is_section = re.match(r'(?i)^(?:tema|cap[ií]tulo|secci[oó]n|bloque|parte|anexo)\b', line)
                is_numbered = re.match(r'^\d+(?:\.\d+)*[.)]?\s+\S', line)
                is_heading = line.isupper() and len(line.split()) <= 12 and len(line) >= 8
                if (is_section or is_numbered or is_heading) and line not in headings:
                    headings.append(line)
                if len(headings) >= 12:
                    break
            if len(headings) >= 12:
                break
        records.append({
            'temaNumero': number,
            'temaOficial': topics[number]['nombre'],
            'archivoPrivado': pdf.name,
            'paginas': len(reader.pages),
            'sha256': hashlib.sha256(pdf.read_bytes()).hexdigest(),
            'encabezadosParaIdentificarApartados': headings,
            'metodoClasificacion': 'Número explícito Tema 1–45 en el nombre, contrastado con catálogo BOE 2026'
        })
    except Exception as error:
        unreadable.append({'file': pdf.name, 'temaNumero': number, 'reason': str(error)})
by_number = {}
for item in records:
    by_number.setdefault(item['temaNumero'], []).append(item['archivoPrivado'])
missing = [number for number in range(1, 46) if number not in by_number]
duplicates = [{'temaNumero': number, 'files': files} for number, files in by_number.items() if len(files) > 1]
report = {
    'convocatoria': catalog['convocatoria'],
    'fuenteTemario': catalog['fuenteTemario'],
    'carpetaPrivada': str(source),
    'totalPdf': len(pdfs),
    'temasEsperados': 45,
    'temasConArchivoLegible': sorted(by_number),
    'faltantes': missing,
    'duplicadosDeAsignacion': duplicates,
    'sinClasificar': ambiguous,
    'ilegibles': unreadable,
    'archivos': records,
    'aviso': 'Informe local para reconocer apartados; no publicar ni usar el contenido de terceros como banco de preguntas.'
}
out = source / '.opoclaro-work' / 'pdf-audit.json'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'pdfEncontrados': len(pdfs), 'temasConPdfLegible': len(by_number), 'faltantes': missing, 'asignacionesDuplicadas': duplicates, 'sinClasificar': ambiguous, 'ilegibles': unreadable, 'informePrivado': str(out)}, ensure_ascii=False, indent=2))
