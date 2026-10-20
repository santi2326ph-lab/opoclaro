import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
function arg(name, fallback=null){const index=args.indexOf(name);return index>=0?args[index+1]:fallback;}
const input=arg('--input');
const sourceDir=path.resolve(arg('--source-dir',path.join(root,'materia-privado')));
const model=arg('--model','qwen3:4b');
const batchSize=Number(arg('--batch-size','5'));
const force=args.includes('--force');
if(!input){console.error('Uso: node scripts/generate-question-candidates.mjs --input <fuentes-oficiales.json> [--source-dir <carpeta-privada>] [--model qwen3:4b] [--batch-size 5]');process.exit(2);}
const allowedDirs=[path.join(root,'materia-privado'),path.join(root,'material-privado')];
if(!allowedDirs.includes(sourceDir))throw new Error('La carpeta de trabajo debe ser materia-privado o material-privado dentro del proyecto.');
if(!Number.isInteger(batchSize)||batchSize<1||batchSize>10)throw new Error('--batch-size debe estar entre 1 y 10.');
const packet=JSON.parse(await readFile(path.resolve(input),'utf8'));
if(packet.convocatoria!=='BOE-A-2026-15055'||!Array.isArray(packet.temas))throw new Error('El archivo debe incluir la convocatoria vigente y una lista temas.');
const auditPath=path.join(sourceDir,'.opoclaro-work','pdf-audit.json');
let audit={archivos:[]};try{audit=JSON.parse(await readFile(auditPath,'utf8'));}catch{}
const topicMap=new Map(JSON.parse(await readFile(path.join(root,'data/tests/catalog.json'),'utf8')).oposiciones[0].temas.map(topic=>[topic.numero,topic]));
const workDir=path.join(sourceDir,'.opoclaro-work','candidates');
await mkdir(workDir,{recursive:true});
const manifestPath=path.join(workDir,'manifest.json');
let manifest={convocatoria:packet.convocatoria,modelo:model,lotes:[],procesados:[]};try{manifest=JSON.parse(await readFile(manifestPath,'utf8'));}catch{}
let processed=0,skipped=0;
for(let offset=0;offset<packet.temas.length;offset+=batchSize){
  const group=packet.temas.slice(offset,offset+batchSize);
  const batchNo=Math.floor(offset/batchSize)+1;
  for(const item of group){
    const topic=topicMap.get(Number(item.numero));
    if(!topic)throw new Error('Tema fuera del programa oficial: '+item.numero);
    if(!Array.isArray(item.conceptos)||!Array.isArray(item.fuentes)||!item.fuentes.length)throw new Error('El tema '+item.numero+' necesita conceptos y fuentes oficiales verificadas.');
    for(const source of item.fuentes){const url=new URL(source.url);const host=url.hostname.toLowerCase();const official=host==='boe.es'||host.endsWith('.boe.es')||host==='eur-lex.europa.eu'||host.endsWith('.europa.eu')||host==='rae.es'||host.endsWith('.rae.es')||host==='rfc-editor.org'||host.endsWith('.rfc-editor.org')||host==='who.int'||host.endsWith('.who.int')||host==='un.org'||host.endsWith('.un.org')||host==='coe.int'||host.endsWith('.coe.int')||host==='policia.es'||host.endsWith('.policia.es')||host==='dgt.es'||host.endsWith('.dgt.es')||host==='ine.es'||host.endsWith('.ine.es')||host.endsWith('.gob.es')||host==='europa.eu'||host.endsWith('.incibe.es');if(url.protocol!=='https:'||!official||!source.referencia||!source.extracto)throw new Error('Fuente incompleta, no HTTPS o fuera de la lista oficial permitida en el Tema '+item.numero);}
    const output=path.join(workDir,'tema-'+String(item.numero).padStart(2,'0')+'.json');
    try{await access(output);if(!force){skipped++;continue;}}catch{}
    const pdfScope=audit.archivos?.find(record=>record.temaNumero===Number(item.numero))?.encabezadosParaIdentificarApartados||[];
    const prompt=[
      'Redacta preguntas de práctica originales para una oposición española.',
      'Usa los encabezados de estudio solo para delimitar conceptos; no los copies ni imites el texto de apuntes privados.',
      'Usa exclusivamente los extractos de fuentes oficiales que se proporcionan como base factual. No añadas datos recordados ni inventes artículos.',
      'Devuelve JSON válido con un array bajo la clave preguntas. Para cada pregunta incluye enunciado, opciones (exactamente cuatro), respuestaCorrecta (índice 0 a 3), explicación propia breve, dificultad (facil/media/dificil) y referencia exacta a una de las fuentes indicadas.',
      'Genera tantas preguntas distintas como los extractos permitan justificar sin repetir el mismo hecho; si no bastan, devuelve menos. No afirmes que son oficiales.',
      'Tema oficial '+item.numero+': '+topic.nombre,
      'Conceptos del programa: '+JSON.stringify(item.conceptos),
      'Encabezados internos de alcance (no son fuente de respuestas): '+JSON.stringify(pdfScope),
      'Fuentes oficiales verificadas: '+JSON.stringify(item.fuentes)
    ].join('\n\n');
    const result=spawnSync('ollama',['run',model,prompt],{encoding:'utf8',timeout:180000,maxBuffer:8*1024*1024,env:{...process.env,TERM:'dumb',NO_COLOR:'1'}});
    const record={temaNumero:Number(item.numero),temaOficial:topic.nombre,estado:'pendiente_validacion',fechaGeneracion:new Date().toISOString(),modeloLocal:model,lote:batchNo,fuentes:item.fuentes.map(({referencia,url})=>({referencia,url})),conceptos:item.conceptos,respuestaCruda:(result.stdout||'')+(result.stderr?'\n'+result.stderr:''),error:result.error?.message||null,codigoSalida:result.status};
    if(result.error||result.status!==0)record.estado='pendiente_generacion';
    await writeFile(output,JSON.stringify(record,null,2)+'\n','utf8');
    processed++;
    if(!manifest.procesados.includes(Number(item.numero)))manifest.procesados.push(Number(item.numero));
    manifest.lotes.push({numero:batchNo,tema:Number(item.numero),archivo:path.basename(output),estado:record.estado});
    manifest.modelo=model;manifest.actualizado=new Date().toISOString();
    await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n','utf8');
    console.log('Tema '+item.numero+': guardado como '+record.estado+' en '+path.basename(output));
  }
}
console.log('Temas generados: '+processed+'; ya existentes omitidos: '+skipped+'. Ningún candidato se incorpora al banco público automáticamente.');