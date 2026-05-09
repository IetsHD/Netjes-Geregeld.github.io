// script.js

// Winkelwagen array
let cart = [];

// Alle "Toevoegen" knoppen ophalen
const addButtons = document.querySelectorAll(".add-btn");

// Winkelwagen knop
const cartButton = document.querySelector(".green-btn");

// Product toevoegen
addButtons.forEach(button => {
  button.addEventListener("click", () => {

    // Kaart ophalen
    const card = button.closest(".card");

    // Product gegevens
    const productName = card.querySelector("h3").innerText;
    const productPrice = card.querySelector(".price").innerText;

    // Product object
    const product = {
      name: productName,
      price: productPrice
    };

    // Toevoegen aan winkelwagen
    cart.push(product);

    // Opslaan in localStorage
    localStorage.setItem("cart", JSON.stringify(cart));

    // Winkelwagen teller updaten
    updateCartButton();

    // Kleine feedback
    button.innerText = "Toegevoegd ✓";

    setTimeout(() => {
      button.innerText = "+ Toevoegen";
    }, 1200);
  });
});

// Winkelwagen teller tonen
function updateCartButton() {

  // localStorage uitlezen
  const storedCart = JSON.parse(localStorage.getItem("cart")) || [];

  cart = storedCart;

  cartButton.innerText = `Winkelwagen (${cart.length})`;
}

// Winkelwagen leegmaken
function clearCart() {
  cart = [];
  localStorage.removeItem("cart");
  updateCartButton();
}

// Producten tonen in console
function showCart() {
  console.log(cart);
}

// Start
updateCartButton();