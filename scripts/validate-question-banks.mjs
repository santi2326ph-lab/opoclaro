import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const catalog=JSON.parse(await readFile(path.join(root,'data/tests/catalog.json'),'utf8'));
const opposition=catalog.oposiciones.find(item=>item.id==='policia-nacional');
assert.ok(opposition,'catálogo Policía Nacional');
const banks=new Map();
for(const topic of opposition.temas){
  if(!topic.archivo) continue;
  assert.ok(!topic.archivo.startsWith('/') && !topic.archivo.includes('..'),'ruta de banco segura');
  if(!banks.has(topic.archivo)) banks.set(topic.archivo,JSON.parse(await readFile(path.join(root,'data/tests',topic.archivo),'utf8')));
  const questions=banks.get(topic.archivo).preguntas.filter(q=>Number(q.temaNumero)===topic.numero);
  if(topic.preguntas!==undefined) assert.equal(questions.length,topic.preguntas,'conteo del Tema '+topic.numero);
}
const ids=new Set(), exact=new Map(), all=[];
const officialHost=host=>host==='boe.es'||host.endsWith('.boe.es')||host==='eur-lex.europa.eu'||host.endsWith('.europa.eu')||host==='rae.es'||host.endsWith('.rae.es')||host==='rfc-editor.org'||host.endsWith('.rfc-editor.org')||host==='who.int'||host.endsWith('.who.int')||host==='un.org'||host.endsWith('.un.org')||host==='ohchr.org'||host.endsWith('.ohchr.org')||host==='unesco.org'||host.endsWith('.unesco.org')||host==='coe.int'||host.endsWith('.coe.int')||host==='policia.es'||host.endsWith('.policia.es')||host==='dgt.es'||host.endsWith('.dgt.es')||host==='imf.org'||host.endsWith('.imf.org')||host==='iom.int'||host.endsWith('.iom.int')||host==='unodc.org'||host.endsWith('.unodc.org')||host==='microsoft.com'||host.endsWith('.microsoft.com')||host==='kernel.org'||host.endsWith('.kernel.org')||host==='wto.org'||host.endsWith('.wto.org')||host==='ine.es'||host.endsWith('.ine.es')||host==='nij.ojp.gov'||host.endsWith('.nij.ojp.gov')||host.endsWith('.gob.es')||host==='europa.eu'||host.endsWith('.incibe.es');
function normalized(value){return value.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
function shingles(value){const words=normalized(value).split(/\s+/);const set=new Set();for(let i=0;i<words.length-1;i++)set.add(words[i]+' '+words[i+1]);return set;}
for(const [file,bank] of banks){
  assert.equal(bank.oposicion,opposition.id,'oposición de '+file);
  assert.ok(Array.isArray(bank.preguntas),'preguntas en '+file);
  for(const q of bank.preguntas){
    assert.ok(!ids.has(q.id),'id repetido: '+q.id);ids.add(q.id);
    assert.ok(q.id && q.enunciado?.trim() && q.explicacion?.trim(),'texto incompleto en '+q.id);
    assert.equal(q.opciones?.length,4,'cuatro opciones en '+q.id);
    assert.equal(new Set(q.opciones.map(normalized)).size,4,'opciones distintas en '+q.id);
    assert.ok(Number.isInteger(q.respuestaCorrecta)&&q.respuestaCorrecta>=0&&q.respuestaCorrecta<4,'respuesta en rango en '+q.id);
    assert.ok(['facil','media','dificil'].includes(q.dificultad),'dificultad en '+q.id);
    assert.match(q.fechaRevision,/^\d{4}-\d{2}-\d{2}$/);
    assert.ok(q.temaNumero>=1&&q.temaNumero<=45,'tema válido en '+q.id);
    assert.ok(q.fuente?.referencia?.trim(),'referencia en '+q.id);
    const url=new URL(q.fuente.url);assert.equal(url.protocol,'https:');assert.ok(officialHost(url.hostname),'dominio oficial en '+q.id+': '+url.hostname);
    const key=normalized(q.enunciado);assert.ok(!exact.has(key),'enunciado duplicado: '+q.id+' y '+exact.get(key));exact.set(key,q.id);
    all.push(q);
  }
}
const near=[];
for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++){
  if(all[i].temaNumero!==all[j].temaNumero)continue;
  const a=shingles(all[i].enunciado),b=shingles(all[j].enunciado);if(Math.min(a.size,b.size)<8)continue;
  let common=0;for(const token of a)if(b.has(token))common++;
  const similarity=common/(a.size+b.size-common);
  if(similarity>=0.82)near.push({first:all[i].id,second:all[j].id,similarity:Number(similarity.toFixed(2))});
}
console.log('OK: '+all.length+' preguntas públicas; IDs, estructura, fuentes oficiales y duplicados exactos verificados.');
if(near.length)console.log('Revisar similitudes: '+JSON.stringify(near));
