// Catalog rendering, filters, and the verify-payment form.
// Set each product's price (whole naira). Products with price null cannot be verified until priced.
import { submitOrder, watchMyOrders } from "./orders.js";

const PRODUCTS = [
  { id: "iphone-pyramid", name: "iPhone (boxed stack)", cat: "Phones", img: "assets/iphone-box-pyramid.jpg", price: null },
  { id: "iphones-purple", name: "iPhones in boxes (orange and purple)", cat: "Phones", img: "assets/iphones-purple.jpg", price: null },
  { id: "iphone-17-pro-boxes", name: "iPhone 17 Pro boxes (unlocked)", cat: "Phones", img: "assets/iphone-17-pro-boxes.jpg", price: null },
  { id: "iphones-orange-hand", name: "iPhone Pro (orange, hand display)", cat: "Phones", img: "assets/iphones-orange-hand.jpg", price: null },
  { id: "phones-display-case", name: "Smartphones in display case (iPhone, Samsung, Infinix)", cat: "Phones", img: "assets/phones-display-case.jpg", price: null },
  { id: "galaxy-s21", name: "Samsung Galaxy S21 5G", cat: "Phones", img: "assets/galaxy-s21-5g.jpg", price: null },
  { id: "dell-laptop", name: "Dell laptop", cat: "Laptops & Computers", img: "assets/dell-laptop.jpg", price: null },
  { id: "hp-laptops", name: "HP laptops", cat: "Laptops & Computers", img: "assets/hp-laptops.jpg", price: null },
  { id: "hp-zbook", name: "HP ZBook laptop (silver)", cat: "Laptops & Computers", img: "assets/hp-zbook-laptop.jpg", price: null },
  { id: "ipads-blue", name: "iPads in boxes (blue)", cat: "Tablets", img: "assets/ipads-blue.jpg", price: null },
  { id: "ipad-boxes-stack", name: "iPad boxes (stacked)", cat: "Tablets", img: "assets/ipad-boxes-stack.jpg", price: null },
  { id: "jamax-earbuds", name: "JAMAX MaxPura 13 earbuds", cat: "Audio", img: "assets/jamax-maxpura13-earbuds.jpg", price: null },
  { id: "jamax-maxfree5", name: "JAMAX MaxFree 5 wireless earbuds", cat: "Audio", img: "assets/jamax-maxfree5-earbuds.jpg", price: null },
  { id: "logitech-h390", name: "Logitech H390 USB headset", cat: "Audio", img: "assets/logitech-h390-headset.jpg", price: null },
  { id: "ps3", name: "PlayStation 3 console with controller", cat: "Gaming", img: "assets/ps3-console.jpg", price: null },
  { id: "shplus-chargers", name: "SHPLUS fast charger adapters", cat: "Accessories", img: "assets/shplus-fast-chargers.jpg", price: null },
  { id: "65w-chargers", name: "65W USB fast chargers (jars)", cat: "Accessories", img: "assets/65w-fast-chargers.jpg", price: null },
  { id: "dell-chargers", name: "Dell laptop charger adapters", cat: "Accessories", img: "assets/dell-charger-adapters.jpg", price: null },
  { id: "folding-stand", name: "Folding phone and tablet stand", cat: "Accessories", img: "assets/folding-phone-stand.jpg", price: null },
  { id: "smartwatch", name: "Black smartwatch with silicone strap", cat: "Accessories", img: "assets/smartwatch-black.jpg", price: null },
  { id: "mtn-odu", name: "MTN Broadband 5G ODU router", cat: "Networking & Power", img: "assets/mtn-5g-odu-router.jpg", price: null },
  { id: "mtn-power-go-pro", name: "MTN POWER GO PRO 100,000mAh power bank", cat: "Networking & Power", img: "assets/mtn-power-go-pro.jpg", price: null },
  { id: "powerbank-66000", name: "66000mAh 22.5W polymer power bank (4 ports)", cat: "Networking & Power", img: "assets/powerbank-66000mah.jpg", price: null },
  { id: "baseus-20000", name: "Baseus Lipow 20000mAh 15W power bank", cat: "Networking & Power", img: "assets/baseus-lipow-20000mah.jpg", price: null }
];

const CATS = ["All", "Phones", "Laptops & Computers", "Tablets", "Audio", "Gaming", "Accessories", "Networking & Power"];
let active = "All";

function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

function renderFilters() {
  document.getElementById("filters").innerHTML = CATS.map(c =>
    `<button class="chip ${c === active ? "active" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("");
}

function renderGrid() {
  const list = PRODUCTS.filter(p => active === "All" || p.cat === active);
  document.getElementById("product-grid").innerHTML = list.map(p => `
    <article class="product">
      <img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy">
      <div class="product-body">
        <span class="cat">${esc(p.cat)}</span>
        <h3>${esc(p.name)}</h3>
        <span class="price">${p.price == null ? "Price on request" : "₦" + p.price.toLocaleString("en-NG")}</span>
        <a class="btn" href="#verify" data-pick="${esc(p.id)}">Buy by transfer</a>
      </div>
    </article>`).join("");
}

function renderProductSelect() {
  document.getElementById("product-select").innerHTML =
    `<option value="">Choose a product</option>` +
    PRODUCTS.map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("");
}

document.getElementById("filters").addEventListener("click", e => {
  const b = e.target.closest("[data-cat]");
  if (!b) return;
  active = b.dataset.cat;
  renderFilters();
  renderGrid();
});

document.getElementById("product-grid").addEventListener("click", e => {
  const a = e.target.closest("[data-pick]");
  if (!a) return;
  document.getElementById("product-select").value = a.dataset.pick;
  updateAmountHint();
});

const form = document.getElementById("order-form");
const amountInput = document.getElementById("amount-input");
const tipToggle = document.getElementById("tip-toggle");
const priceById = new Map(PRODUCTS.map(p => [p.id, p.price]));
function updateAmountHint() {
  const base = priceById.get(document.getElementById("product-select").value);
  if (base == null) { amountInput.placeholder = "Confirm price with shop"; return; }
  amountInput.value = base + (tipToggle.checked ? 10 : 0);
  amountInput.placeholder = "Amount sent";
}
document.getElementById("product-select").addEventListener("change", updateAmountHint);
tipToggle.addEventListener("change", updateAmountHint);
const statusEl = document.getElementById("order-status");

form.addEventListener("submit", async e => {
  e.preventDefault();
  statusEl.className = "status";
  statusEl.textContent = "Checking details...";
  try {
    await submitOrder(form, PRODUCTS);
    statusEl.className = "status ok";
    statusEl.textContent = "Submitted. Status is pending until the shop confirms your transfer.";
    form.reset();
  } catch (err) {
    statusEl.className = "status error";
    statusEl.textContent = err.message || "Something went wrong. Please try again.";
  }
});

const myOrders = document.getElementById("my-orders");
watchMyOrders(rows => {
  if (!rows.length) {
    myOrders.textContent = "No orders yet. Sign in to see your orders here.";
    return;
  }
  myOrders.innerHTML = `<div class="orders">` + rows.map(o => `
    <div class="order">
      <div><strong>${esc(o.productName)}</strong><br><span class="muted">Ref ${esc(o.reference)} · ₦${Number(o.amount).toLocaleString("en-NG")}</span></div>
      <span class="badge ${o.status === "verified" ? "verified" : "pending"}">${o.status === "verified" ? "Verified" : "Pending"}</span>
    </div>`).join("") + `</div>`;
});

renderFilters();
renderGrid();
renderProductSelect();
