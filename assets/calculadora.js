document.addEventListener('DOMContentLoaded',()=>{
  const form=document.querySelector('#score-form'); if(!form)return;
  const fields=['correct','wrong','blank','questions','options','max-score','penalty','cutoff'];
  const get=id=>document.getElementById(id);
  const fmt=n=>new Intl.NumberFormat('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
  function calculate(event){if(event)event.preventDefault();
    const correct=Number(get('correct').value)||0, wrong=Number(get('wrong').value)||0, blank=Number(get('blank').value)||0;
    const questions=Number(get('questions').value)||0, max=Number(get('max-score').value)||10, penalty=Number(get('penalty').value)||0, cutoff=get('cutoff').value===''?null:Number(get('cutoff').value);
    const total=correct+wrong+blank;
    if(questions<1||correct<0||wrong<0||blank<0||total>questions){get('result').setAttribute('aria-invalid','true');get('score-detail').textContent='Revisa los datos: la suma de respuestas debe ser igual o menor que el total.';get('cutoff-state').hidden=true;return;}
    get('result').removeAttribute('aria-invalid');
    const net=Math.max(0,correct-wrong*penalty), score=Math.min(max,net/questions*max);
    get('score').textContent=fmt(score);get('result-max').textContent=fmt(max).replace(/,00$/,'');get('score-detail').textContent=`Nota neta: ${fmt(net)} aciertos de ${questions}. ${questions-total} pregunta${questions-total===1?'':'s'} sin respuesta registrada.`;
    const state=get('cutoff-state'); if(cutoff!==null&&Number.isFinite(cutoff)){state.hidden=false;state.textContent=score>=cutoff?'Sobre el corte':'Por debajo del corte';state.classList.toggle('fail',score<cutoff);}else state.hidden=true;
  }
  form.addEventListener('submit',calculate);fields.forEach(id=>get(id).addEventListener('input',calculate));
  get('options').addEventListener('change',()=>{const count=Number(get('options').value);if(count>1)get('penalty').value=(1/(count-1)).toFixed(6);calculate();});
  calculate();
});
