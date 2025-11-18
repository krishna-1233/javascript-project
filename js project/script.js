const API_ROOT = 'https://www.themealdb.com/api/json/v1/1';

// helper: get query param by name
function getQueryParam(name){
  const url = new URL(location.href);
  return url.searchParams.get(name);
}

/* -------------------------
   UI helpers & DOM targets
   ------------------------- */
const hamburgerButtons = () => document.querySelectorAll('#hamburger');
const offcanvas = () => document.getElementById('offcanvas');
const closeOff = () => document.getElementById('closeOff');
const categoryListOff = () => document.getElementById('categoryListOff');
const searchForm = () => document.getElementById('searchForm');
const searchInput = () => document.getElementById('searchInput');

/* -------------------------
   Common: setup hamburger & categories list in offcanvas
   ------------------------- */
async function setupCommon(){
  // open/close offcanvas
  hamburgerButtons().forEach(btn => {
    btn.addEventListener('click', () => {
      offcanvas().classList.add('open');
    });
  });
  if (closeOff()) closeOff().addEventListener('click', () => offcanvas().classList.remove('open'));

  // fill offcanvas with categories (quick nav)
  if (categoryListOff()){
    const cats = await fetchCategories();
    categoryListOff().innerHTML = cats.map(c => `<li data-cat="${c.strCategory}">${c.strCategory}</li>`).join('');
    // attach click handlers
    categoryListOff().querySelectorAll('li').forEach(li => {
      li.addEventListener('click', (e) => {
        const cat = li.getAttribute('data-cat');
        location.href = `meals.html?category=${encodeURIComponent(cat)}`;
      });
    });
  }

  // search form submit: go to meals.html?search=...
  if (searchForm()){
    searchForm().addEventListener('submit', (ev) => {
      ev.preventDefault();
      const q = (searchInput() && searchInput().value) || '';
      if (!q.trim()) return;
      // go to meals page with search param
      location.href = `meals.html?search=${encodeURIComponent(q.trim())}`;
    });
  }
}
