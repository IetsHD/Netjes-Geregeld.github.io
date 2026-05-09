const productList = document.getElementById("productList");
const categoryFilters = document.getElementById("categoryFilters");
const searchInput = document.getElementById("searchInput");

const openCartBtn = document.getElementById("openCartBtn");
const closeCartBtn = document.getElementById("closeCartBtn");
const cartScreen = document.getElementById("cartScreen");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const summaryItems = document.getElementById("summaryItems");
const summaryTotal = document.getElementById("summaryTotal");
const clearCartBtn = document.getElementById("clearCartBtn");

const newProductBtn = document.getElementById("newProductBtn");
const productModal = document.getElementById("productModal");
const closeProductModalBtn = document.getElementById("closeProductModalBtn");
const productForm = document.getElementById("productForm");
const newProductName = document.getElementById("newProductName");
const newProductCategory = document.getElementById("newProductCategory");
const newProductPrice = document.getElementById("newProductPrice");

let products = [];
let customProducts = loadCustomProducts();
let cart = loadCart();

let activeCategory = "Alles";
let searchTerm = "";

const quantityOptions = [25, 50, 100, 200];

init();

async function init() {
  await loadProducts();
  renderFilters();
  renderProducts();
  renderCart();

  searchInput.addEventListener("input", handleSearch);

  openCartBtn.addEventListener("click", openCart);
  closeCartBtn.addEventListener("click", closeCart);
  cartScreen.addEventListener("click", handleCartBackdropClick);
  clearCartBtn.addEventListener("click", clearCart);

  newProductBtn.addEventListener("click", openProductModal);
  closeProductModalBtn.addEventListener("click", closeProductModal);
  productModal.addEventListener("click", handleProductModalBackdropClick);
  productForm.addEventListener("submit", handleNewProduct);

  document.addEventListener("click", closeQuantityMenusOnOutsideClick);
}

async function loadProducts() {
  const categoryFiles = [
    "data/npc-fruit.json",
    "data/fruit-pluk.json",
    "data/vlees-vis.json",
    "data/groenten-pluk.json",
    "data/drank.json",
    "data/overig.json",
    "data/zuivel-brood.json",
    "data/vis.json",
    "data/pasta.json"
  ];

  try {
    const responses = await Promise.all(
      categoryFiles.map(file => fetch(file))
    );

    const failedResponse = responses.find(response => !response.ok);

    if (failedResponse) {
      throw new Error("Eén of meerdere JSON-bestanden konden niet geladen worden.");
    }

    const productGroups = await Promise.all(
      responses.map(response => response.json())
    );

    const jsonProducts = productGroups.flat();

    products = [...jsonProducts, ...customProducts];
  } catch (error) {
    console.error(error);

    productList.innerHTML = `
      <div class="empty-state">
        Producten konden niet geladen worden. Controleer of alle JSON-bestanden in de map data staan.
      </div>
    `;
  }
}

function renderFilters() {
  const categories = ["Alles", ...new Set(products.map(product => product.category))];

  categoryFilters.innerHTML = categories
    .map(category => {
      const activeClass = category === activeCategory ? "active" : "";

      return `
        <button class="filter-button ${activeClass}" data-category="${escapeHtml(category)}">
          ${escapeHtml(category)}
        </button>
      `;
    })
    .join("");

  document.querySelectorAll(".filter-button").forEach(button => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      renderFilters();
      renderProducts();
    });
  });
}

function renderProducts() {
  const filteredProducts = products.filter(product => {
    const matchesCategory =
      activeCategory === "Alles" || product.category === activeCategory;

    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  if (filteredProducts.length === 0) {
    productList.innerHTML = `
      <div class="empty-state">
        Geen producten gevonden.
      </div>
    `;
    return;
  }

  const groupedProducts = groupByCategory(filteredProducts);

  productList.innerHTML = Object.entries(groupedProducts)
    .map(([category, items]) => {
      return `
        <section class="category-section">
          <h2 class="category-title">
            ${escapeHtml(category)}
            <span class="category-count">(${items.length})</span>
          </h2>

          <div class="product-grid">
            ${items.map(product => createProductCard(product)).join("")}
          </div>
        </section>
      `;
    })
    .join("");

  document.querySelectorAll(".add-button").forEach(button => {
    button.addEventListener("click", () => {
      const productId = Number(button.dataset.id);
      addToCart(productId, 1);
    });
  });

  document.querySelectorAll(".quantity-toggle").forEach(button => {
    button.addEventListener("click", event => {
      event.stopPropagation();

      const menu = button.nextElementSibling;
      const isOpen = menu.classList.contains("open");

      closeAllQuantityMenus();

      if (!isOpen) {
        menu.classList.add("open");
      }
    });
  });

  document.querySelectorAll(".quantity-option").forEach(button => {
    button.addEventListener("click", event => {
      event.stopPropagation();

      const productId = Number(button.dataset.id);
      const quantity = Number(button.dataset.quantity);

      addToCart(productId, quantity);
      closeAllQuantityMenus();
    });
  });
}

function createProductCard(product) {
  const badgeClass = getBadgeClass(product.category);

  return `
    <article class="product-card">
      <div class="product-info">
        <h3>${escapeHtml(product.name)}</h3>

        <div class="product-meta">
          <span class="badge ${badgeClass}">
            ${escapeHtml(product.category)}
          </span>

          <span class="price">
            ${formatPrice(product.price)}
          </span>
        </div>
      </div>

      <div class="add-control">
        <button class="add-button" data-id="${product.id}">
          <span>＋</span>
          Toevoegen
        </button>

        <button class="quantity-toggle" type="button" aria-label="Kies aantal">
          ⌄
        </button>

        <div class="quantity-menu">
          ${quantityOptions
            .map(quantity => {
              return `
                <button
                  class="quantity-option"
                  type="button"
                  data-id="${product.id}"
                  data-quantity="${quantity}"
                >
                  ${quantity}x toevoegen
                </button>
              `;
            })
            .join("")}
        </div>
      </div>
    </article>
  `;
}

function renderCart() {
  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="empty-state">
        Je winkelwagen is leeg.
      </div>
    `;
  } else {
    cartItems.innerHTML = cart
      .map(item => {
        const product = findProduct(item.id);

        if (!product) {
          return "";
        }

        return `
          <article class="cart-item">
            <div>
              <h3>${escapeHtml(product.name)}</h3>
              <p>
                ${escapeHtml(product.category)} ·
                ${formatPrice(product.price)} per stuk ·
                subtotaal ${formatPrice(product.price * item.quantity)}
              </p>
            </div>

            <div class="cart-item-actions">
              <button class="small-button" data-action="decrease" data-id="${item.id}">
                −
              </button>

              <span class="quantity-number">${item.quantity}</span>

              <button class="small-button" data-action="increase" data-id="${item.id}">
                +
              </button>

              <button class="small-button remove-button" data-action="remove" data-id="${item.id}">
                ✕
              </button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => {
    const product = findProduct(item.id);

    if (!product) {
      return sum;
    }

    return sum + product.price * item.quantity;
  }, 0);

  cartCount.textContent = totalQuantity;
  summaryItems.textContent = totalQuantity;
  summaryTotal.textContent = formatPrice(totalPrice);

  saveCart();

  document.querySelectorAll(".cart-item .small-button").forEach(button => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.id);
      const action = button.dataset.action;

      if (action === "increase") {
        changeCartQuantity(id, 1);
      }

      if (action === "decrease") {
        changeCartQuantity(id, -1);
      }

      if (action === "remove") {
        removeFromCart(id);
      }
    });
  });
}

function addToCart(productId, quantity) {
  const product = findProduct(productId);

  if (!product) {
    return;
  }

  const existingItem = cart.find(item => item.id === productId);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      id: productId,
      quantity: quantity
    });
  }

  renderCart();
}

function changeCartQuantity(productId, change) {
  const item = cart.find(cartItem => cartItem.id === productId);

  if (!item) {
    return;
  }

  item.quantity += change;

  if (item.quantity <= 0) {
    removeFromCart(productId);
    return;
  }

  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  renderCart();
}

function clearCart() {
  if (cart.length === 0) {
    return;
  }

  const confirmed = confirm("Weet je zeker dat je de winkelwagen wilt leegmaken?");

  if (!confirmed) {
    return;
  }

  cart = [];
  renderCart();
}

function handleSearch(event) {
  searchTerm = event.target.value.trim();
  renderProducts();
}

function openCart() {
  cartScreen.classList.add("open");
  cartScreen.setAttribute("aria-hidden", "false");
}

function closeCart() {
  cartScreen.classList.remove("open");
  cartScreen.setAttribute("aria-hidden", "true");
}

function handleCartBackdropClick(event) {
  if (event.target === cartScreen) {
    closeCart();
  }
}

function openProductModal() {
  productModal.classList.add("open");
  productModal.setAttribute("aria-hidden", "false");
  newProductName.focus();
}

function closeProductModal() {
  productModal.classList.remove("open");
  productModal.setAttribute("aria-hidden", "true");
  productForm.reset();
}

function handleProductModalBackdropClick(event) {
  if (event.target === productModal) {
    closeProductModal();
  }
}

function handleNewProduct(event) {
  event.preventDefault();

  const name = newProductName.value.trim();
  const category = newProductCategory.value.trim();
  const price = Number(newProductPrice.value);

  if (!name || !category || Number.isNaN(price)) {
    return;
  }

  const newProduct = {
    id: Date.now(),
    name,
    category,
    price
  };

  customProducts.push(newProduct);
  products.push(newProduct);

  saveCustomProducts();
  renderFilters();
  renderProducts();
  closeProductModal();
}

function groupByCategory(items) {
  return items.reduce((groups, item) => {
    if (!groups[item.category]) {
      groups[item.category] = [];
    }

    groups[item.category].push(item);
    return groups;
  }, {});
}

function findProduct(productId) {
  return products.find(product => product.id === productId);
}

function getBadgeClass(category) {
  const normalized = category
    .toLowerCase()
    .replaceAll("/", "-")
    .replaceAll(" ", "-");

  if (normalized.includes("npc-fruit")) {
    return "npc-fruit";
  }

  if (normalized.includes("fruit-pluk")) {
    return "fruit-pluk";
  }

  if (normalized.includes("vlees-vis")) {
    return "vlees-vis";
  }

  if (normalized.includes("groenten-pluk")) {
    return "groenten-pluk";
  }

  return "default";
}

function formatPrice(price) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(price);
}

function closeQuantityMenusOnOutsideClick() {
  closeAllQuantityMenus();
}

function closeAllQuantityMenus() {
  document.querySelectorAll(".quantity-menu.open").forEach(menu => {
    menu.classList.remove("open");
  });
}

function saveCart() {
  localStorage.setItem("netjesGeregeldCart", JSON.stringify(cart));
}

function loadCart() {
  const savedCart = localStorage.getItem("netjesGeregeldCart");

  if (!savedCart) {
    return [];
  }

  try {
    return JSON.parse(savedCart);
  } catch {
    return [];
  }
}

function saveCustomProducts() {
  localStorage.setItem("netjesGeregeldCustomProducts", JSON.stringify(customProducts));
}

function loadCustomProducts() {
  const savedProducts = localStorage.getItem("netjesGeregeldCustomProducts");

  if (!savedProducts) {
    return [];
  }

  try {
    return JSON.parse(savedProducts);
  } catch {
    return [];
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}