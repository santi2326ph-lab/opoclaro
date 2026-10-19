document.addEventListener('DOMContentLoaded',()=>{
  const grid=document.querySelector('#week-grid');if(!grid)return;
  const names=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
  const storeKey='opoclaro-plan-v1';let offset=0, sessions=[];
  try{sessions=JSON.parse(localStorage.getItem(storeKey)||'[]');if(!Array.isArray(sessions))sessions=[];}catch{sessions=[];}
  const mondayOf=d=>{const date=new Date(d);date.setHours(0,0,0,0);const day=(date.getDay()+6)%7;date.setDate(date.getDate()-day);return date;};
  const currentMonday=mondayOf(new Date());
  const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const dateLabel=d=>new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short'}).format(d).replace('.','');
  const safe=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  function render(){const monday=new Date(currentMonday);monday.setDate(monday.getDate()+offset*7);const dates=names.map((_,i)=>{const d=new Date(monday);d.setDate(monday.getDate()+i);return d;});const end=dates[6];
    const monthA=new Intl.DateTimeFormat('es-ES',{month:'long'}).format(dates[0]),monthB=new Intl.DateTimeFormat('es-ES',{month:'long'}).format(end);
    document.querySelector('#week-title').textContent=offset===0?'Esta semana':`${dateLabel(dates[0])} – ${dateLabel(end)} · ${monthA===monthB?monthA:`${monthA} / ${monthB}`}`;
    const select=document.querySelector('#session-day'),previous=select.value;select.innerHTML=dates.map((d,i)=>`<option value="${dateKey(d)}">${names[i]} · ${dateLabel(d)}</option>`).join('');if(dates.some(d=>dateKey(d)===previous))select.value=previous;
    grid.innerHTML=dates.map((d,i)=>{const key=dateKey(d), list=sessions.filter(s=>s.date===key).sort((a,b)=>(a.time||'').localeCompare(b.time||''));return `<section class="day-column" aria-label="${names[i]} ${dateLabel(d)}"><div class="day-name">${names[i]}</div><div class="day-date">${dateLabel(d)}</div>${list.length?list.map(s=>`<div class="session-chip" data-color="${s.color||1}">${s.time?`<b>${safe(s.time)}</b> · `:''}${safe(s.title)}<button type="button" data-remove="${safe(s.id)}" aria-label="Eliminar ${safe(s.title)}">×</button></div>`).join(''):'<div class="empty-day">Sin bloques</div>'}</section>`;}).join('');
    document.querySelector('#week-status').textContent=`Semana del ${dateLabel(dates[0])} al ${dateLabel(end)}. ${sessions.filter(s=>dates.some(d=>dateKey(d)===s.date)).length} bloques.`;
  }
  function save(){try{localStorage.setItem(storeKey,JSON.stringify(sessions));}catch{document.querySelector('.storage-note').textContent='El navegador no ha podido guardar este plan. Puedes seguir usándolo mientras la página esté abierta.';}}
  document.querySelector('#session-form').addEventListener('submit',e=>{e.preventDefault();const title=document.querySelector('#session-title').value.trim();if(!title)return;sessions.push({id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,title,date:document.querySelector('#session-day').value,time:document.querySelector('#session-time').value,color:1+sessions.length%3});save();e.currentTarget.reset();render();document.querySelector('#session-title').focus();});
  grid.addEventListener('click',e=>{const button=e.target.closest('[data-remove]');if(!button)return;sessions=sessions.filter(s=>s.id!==button.dataset.remove);save();render();});
  document.querySelector('#previous-week').addEventListener('click',()=>{offset--;render();});document.querySelector('#next-week').addEventListener('click',()=>{offset++;render();});document.querySelector('#current-week').addEventListener('click',()=>{offset=0;render();});render();
});
