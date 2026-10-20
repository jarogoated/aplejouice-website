const counts = { web: 0, totem: 0, pearl: 0, crystal: 0 };
let round = 1;
document.querySelectorAll('[data-item]').forEach(button => button.addEventListener('click', () => {
  const item = button.dataset.item;
  const counter = document.getElementById(`count-${item}`);
  counter.textContent = ++counts[item];
  counter.classList.remove('bump');
  void counter.offsetWidth;
  counter.classList.add('bump');
}));
document.getElementById('reset').addEventListener('click', () => {
  Object.keys(counts).forEach(item => { counts[item] = 0; document.getElementById(`count-${item}`).textContent = '0'; });
  document.getElementById('round').textContent = String(++round).padStart(2, '0');
});
const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectTab(tab) {
  tabs.forEach(item => { const selected = item === tab; item.setAttribute('aria-selected', selected); item.tabIndex = selected ? 0 : -1; });
  const image = document.getElementById('menu-shot');
  image.src = `assets/${tab.dataset.shot}`;
  image.alt = tab.dataset.shot === 'menu.png' ? 'Aplejouice-Menü mit Item-Suche und einer Watchlist für Spinnennetze und Enderperlen' : 'Aplejouice-Anzeige-Einstellungen mit Tracking, Nullwerten, Reichweite und Gegner-Modus';
  document.getElementById('screenshot-panel').setAttribute('aria-labelledby', tab.id);
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = tabs[(index + 1) % tabs.length];
    if (event.key === 'ArrowLeft') next = tabs[(index + tabs.length - 1) % tabs.length];
    if (event.key === 'Home') next = tabs[0];
    if (event.key === 'End') next = tabs[tabs.length - 1];
    if (next) { event.preventDefault(); selectTab(next); next.focus(); }
  });
});
