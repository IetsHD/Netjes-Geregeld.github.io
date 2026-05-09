const categoryFiles = [
  { name: "NPC Fruit", file: "data/npc-fruit.json" },
  { name: "Fruit Pluk", file: "data/fruit-pluk.json" },
  { name: "Vlees/Vis", file: "data/vlees-vis.json" },
  { name: "Groenten Pluk", file: "data/groenten-pluk.json" }
];

let allProducts = [];
let activeCategory = "Alles";
let cart = [];

const categoriesEl = document.getElementById("categories");
const productsEl = document.getElementById("products");
const searchEl = document.getElementById("search");
const cartBtn = document.querySelector(".cart-btn");

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

    if (category === activeCategory) button.classList.add("active");

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

  const filtered = allProducts.filter(product => {
    const matchCategory =
      activeCategory === "Alles" || product.category === activeCategory;

    const matchSearch = product.name.toLowerCase().includes(search);

    return matchCategory && matchSearch;
  });

  const grouped = {};

  filtered.forEach(product => {
    if (!grouped[product.category]) grouped[product.category] = [];
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

        <div class="add-area">
          <select class="amount-select">
            <option value="1">1x</option>
            <option value="5">5x</option>
            <option value="10">10x</option>
            <option value="25">25x</option>
            <option value="50">50x</option>
            <option value="100">100x</option>
          </select>

          <button class="add-btn">+ Toevoegen</button>
        </div>
      `;

      const select = card.querySelector(".amount-select");
      const addBtn = card.querySelector(".add-btn");

      addBtn.onclick = () => {
        addToCart(product, Number(select.value));
      };

      grid.appendChild(card);
    });

    productsEl.appendChild(title);
    productsEl.appendChild(grid);
  });
}

function addToCart(product, amount) {
  const existingItem = cart.find(item => item.name === product.name);

  if (existingItem) {
    existingItem.amount += amount;
  } else {
    cart.push({
      name: product.name,
      category: product.category,
      price: product.price,
      amount
    });
  }

  updateCartButton();
}

function updateCartButton() {
  const totalAmount = cart.reduce((sum, item) => sum + item.amount, 0);
  cartBtn.textContent = `Winkelwagen (${totalAmount})`;
}

function showCart() {
  if (cart.length === 0) {
    alert("Je winkelwagen is leeg.");
    return;
  }

  let message = "Winkelwagen:\n\n";
  let totalPrice = 0;

  cart.forEach(item => {
    const itemTotal = item.price * item.amount;
    totalPrice += itemTotal;

    message += `${item.amount}x ${item.name} - €${itemTotal}\n`;
  });

  message += `\nTotaal: €${totalPrice}`;

  alert(message);
}

searchEl.addEventListener("input", renderProducts);
cartBtn.addEventListener("click", showCart);

loadProducts();