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
/* -------------------------
   Fetch categories
   ------------------------- */
async function fetchCategories(){
  try{
    const res = await fetch(`${API_ROOT}/categories.php`);
    const data = await res.json();
    return data.categories || [];
  }catch(err){
    console.error('Error fetching categories', err);
    return [];
  }
}

/* -------------------------
   HOME: render categories grid
   ------------------------- */
async function initHome(){
  const cats = await fetchCategories();
  const container = document.getElementById('categoriesGrid');
  if (!container) return;
  container.innerHTML = cats.map(c => `
    <a class="card" href="meals.html?category=${encodeURIComponent(c.strCategory)}" title="View ${c.strCategory}">
      <img class="cat-thumb" src="${c.strCategoryThumb}" alt="${c.strCategory}" />
      <div class="badge">${c.strCategory}</div>
    </a>
  `).join('');
}

/* -------------------------
   Meals listing (category or search)
   ------------------------- */
async function fetchMealsByCategory(category){
  try{
    const res = await fetch(`${API_ROOT}/filter.php?c=${encodeURIComponent(category)}`);
    const data = await res.json();
    return data.meals || [];
  }catch(err){ console.error(err); return []; }
}
async function fetchMealsBySearch(q){
  try{
    const res = await fetch(`${API_ROOT}/search.php?s=${encodeURIComponent(q)}`);
    const data = await res.json();
    return data.meals || [];
  }catch(err){ console.error(err); return []; }
}

function renderMealsGrid(meals){
  const grid = document.getElementById('mealsGrid');
  const noRes = document.getElementById('noResults');
  if (!grid) return;
  if (!meals || meals.length === 0){
    grid.innerHTML = '';
    if (noRes) noRes.hidden = false;
    return;
  }
  if (noRes) noRes.hidden = true;
  grid.innerHTML = meals.map(m => `
    <a class="card" href="meal-details.html?id=${m.idMeal}">
      <img class="cat-thumb" src="${m.strMealThumb}" alt="${m.strMeal}" />
      <div class="meal-title">${m.strMeal}</div>
      <div class="meal-info">${m.strArea || ''} ${m.strCategory ? '• ' + m.strCategory : ''}</div>
    </a>
  `).join('');
}

async function initMealsPage(){
  const category = getQueryParam('category');
  const search = getQueryParam('search');
  const heroTitle = document.getElementById('heroTitle');
  if (category){
    if (heroTitle) heroTitle.textContent = `Category: ${category}`;
    const meals = await fetchMealsByCategory(category);
    renderMealsGrid(meals);
  } else if (search){
    if (heroTitle) heroTitle.textContent = `Search: ${search}`;
    const meals = await fetchMealsBySearch(search);
    renderMealsGrid(meals);
  } else {
    // default: show popular categories' first meals (or empty)
    if (heroTitle) heroTitle.textContent = 'Browse meals';
    const cats = await fetchCategories();
    // pull first 12 meals from first few categories to show something
    const sample = [];
    for (let i=0; i<Math.min(6,cats.length); i++){
      const m = await fetchMealsByCategory(cats[i].strCategory);
      if (m && m.length) sample.push(...m.slice(0,3));
    }
    renderMealsGrid(sample);
  }
}

/* -------------------------
   Meal details
   ------------------------- */
async function fetchMealById(id){
  try{
    const res = await fetch(`${API_ROOT}/lookup.php?i=${encodeURIComponent(id)}`);
    const data = await res.json();
    return (data.meals && data.meals[0]) || null;
  }catch(err){ console.error(err); return null; }
}

function extractIngredients(meal){
  const list = [];
  for (let i=1;i<=20;i++){
    const ing = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ing && ing.trim()) list.push({ingredient:ing.trim(), measure: measure ? measure.trim() : ''});
  }
  return list;
}
function renderMealDetails(meal){
  const container = document.getElementById('mealDetails');
  if (!container || !meal) return container.innerHTML = '<p>Meal not found</p>';
  const ingredients = extractIngredients(meal);
  container.innerHTML = `
    <div class="card">
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}" />
    </div>
    <div class="meal-meta">
      <h2>${meal.strMeal}</h2>
      <div class="badge-list">
        <span class="tag">${meal.strCategory || ''}</span>
        <span class="tag">${meal.strArea || ''}</span>
      </div>
      <p><strong>Source:</strong> ${meal.strSource ? `<a href="${meal.strSource}" target="_blank" rel="noopener">link</a>` : 'N/A'}</p>
      <h3>Ingredients</h3>
      <ul>
        ${ingredients.map(i => `<li>${i.measure} ${i.ingredient}</li>`).join('')}
      </ul>
      <h3>Instructions</h3>
      <div>${(meal.strInstructions || '').replace(/\r\n/g,'<br/>')}</div>
      ${meal.strYoutube ? `<h3>Video</h3><a href="${meal.strYoutube}" target="_blank" rel="noopener">Watch on YouTube</a>` : ''}
    </div>
  `;
}

async function initDetailsPage(){
  const id = getQueryParam('id');
  if (!id){
    document.getElementById('mealDetails').innerHTML = '<p>No meal selected.</p>';
    return;
  }
  const meal = await fetchMealById(id);
  renderMealDetails(meal);
}

/* -------------------------
   init: decide which page to run
   ------------------------- */
(async function init(){
  await setupCommon();

  const pageId = document.body.id || '';
  if (pageId === 'page-home'){
    await initHome();
  } else if (pageId === 'page-meals'){
    // If there's a "search" query param, prefill the search input
    const q = getQueryParam('search');
    if (q && searchInput()) searchInput().value = q;
    await initMealsPage();
  } else if (pageId === 'page-details'){
    const q = getQueryParam('search');
    if (q && searchInput()) searchInput().value = q;
    await initDetailsPage();
  }
})();