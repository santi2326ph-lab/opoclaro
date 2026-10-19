document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if (toggle && nav) toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    const label = toggle.querySelector('.sr-only');
    if (label) label.textContent = expanded ? 'Abrir menú' : 'Cerrar menú';
    nav.classList.toggle('is-open', !expanded);
  });
});
