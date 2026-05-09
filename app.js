const categoryFiles = [
  { name: "NPC Fruit", file: "data/npc-fruit.json" },
  { name: "Fruit Pluk", file: "data/fruit-pluk.json" },
  { name: "Vlees/Vis", file: "data/vlees-vis.json" },
  { name: "Groenten Pluk", file: "data/groenten-pluk.json" }
];

let allProducts = [];
let activeCategory = "Alles";

const categoriesEl = document.getElementById("categories");
const productsEl = document.getElementById("products");
const searchEl = document.getElementById("search");

async function loadProducts() {
  for (const category of categoryFiles) {
    const response = await fetch(category.file);
    const products = await response.json();

    products.forEach(product => {
      allProducts.push({
        ...product,
        category: category.name
      });
    });
  }

  renderCategories();
  renderProducts();
}

function renderCategories() {
  const categories = ["Alles", ...categoryFiles.map(c => c.name)];

  categoriesEl.innerHTML = "";

  categories.forEach(category => {
    const button = document.createElement("button");
    button.className = "category-btn";
    button.textContent = category;

    if (category === activeCategory) {
      button.classList.add("active");
    }

    button.onclick = () => {
      activeCategory = category;
      renderCategories();
      renderProducts();
    };

    categoriesEl.appendChild(button);
  });
}

function renderProducts() {
  const search = searchEl.value.toLowerCase();

  let filtered = allProducts.filter(product => {
    const matchCategory =
      activeCategory === "Alles" || product.category === activeCategory;

    const matchSearch = product.name.toLowerCase().includes(search);

    return matchCategory && matchSearch;
  });

  const grouped = {};

  filtered.forEach(product => {
    if (!grouped[product.category]) {
      grouped[product.category] = [];
    }

    grouped[product.category].push(product);
  });

  productsEl.innerHTML = "";

  Object.keys(grouped).forEach(category => {
    const title = document.createElement("h2");
    title.className = "group-title";
    title.textContent = `${category} (${grouped[category].length})`;

    const grid = document.createElement("div");
    grid.className = "product-grid";

    grouped[category].forEach(product => {
      const card = document.createElement("div");
      card.className = "product-card";

      card.innerHTML = `
        <div>
          <div class="product-name">${product.name}</div>
          <span class="tag">${product.category}</span>
          <span class="price">€${product.price}</span>
        </div>
        <button class="add-btn">+ Toevoegen</button>
      `;

      grid.appendChild(card);
    });

    productsEl.appendChild(title);
    productsEl.appendChild(grid);
  });
}

searchEl.addEventListener("input", renderProducts);

loadProducts();
