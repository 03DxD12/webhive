// Webhive Shared Cart & UI Utilities
const WebhiveCart = {
  escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  },

  getCart() {
    try {
      return JSON.parse(localStorage.getItem("cart")) || [];
    } catch (e) {
      return [];
    }
  },

  saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
    this.updateCartCount();
    window.dispatchEvent(new Event("cartUpdated"));
    window.dispatchEvent(new Event("storage"));
  },

  getCartCount() {
    const cart = this.getCart();
    return cart.reduce((total, item) => total + (parseInt(item.quantity, 10) || 1), 0);
  },

  updateCartCount() {
    const count = this.getCartCount();
    const badges = document.querySelectorAll(".nav-cart-count, #nav-cart-count, .cart-badge");
    badges.forEach((badge) => {
      badge.textContent = count;
      if (count > 0) {
        badge.classList.add("has-items");
        badge.style.display = "inline-flex";
      } else {
        badge.classList.remove("has-items");
        badge.style.display = "inline-flex";
      }
    });
  },

  addToCart(name, price, image, quantity = 1) {
    const cart = this.getCart();
    const existingIndex = cart.findIndex((item) => item.name === name);

    if (existingIndex > -1) {
      const currentQty = parseInt(cart[existingIndex].quantity, 10) || 1;
      cart[existingIndex].quantity = currentQty + quantity;
    } else {
      cart.push({
        name,
        price,
        image,
        quantity: parseInt(quantity, 10) || 1,
      });
    }

    this.saveCart(cart);
    this.showToast(`${name} added to cart!`, "success", image);

    // Trigger brief pulse animation on cart button
    const cartBtn = document.querySelector(".nav-cart-btn");
    if (cartBtn) {
      cartBtn.classList.remove("cart-bump");
      void cartBtn.offsetWidth; // re-flow
      cartBtn.classList.add("cart-bump");
    }
  },

  parsePrice(priceStr) {
    if (typeof priceStr === "number") return priceStr;
    if (!priceStr) return 0;
    const cleaned = priceStr.toString().replace(/[^0-9.]/g, "");
    const val = parseFloat(cleaned);
    return isNaN(val) ? 0 : val;
  },

  formatPrice(amount) {
    return `₱${amount.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  },

  showToast(message, type = "success", image = null) {
    let container = document.getElementById("webhive-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "webhive-toast-container";
      container.className = "toast-container position-fixed bottom-0 end-0 p-3";
      container.setAttribute("aria-live", "polite");
      container.setAttribute("aria-atomic", "true");
      container.style.zIndex = "99999";
      document.body.appendChild(container);
    }

    const safeMessage = this.escapeHtml(message);
    const safeImage = image ? this.escapeHtml(image) : "";
    const toastEl = document.createElement("div");
    toastEl.className = "webhive-toast";
    toastEl.setAttribute("role", "status");
    toastEl.innerHTML = `
      ${safeImage ? `<img src="${safeImage}" alt="Item" class="toast-thumb">` : `<i class="bi ${type === "error" ? "bi-exclamation-circle-fill text-danger" : "bi-check-circle-fill text-success"}" aria-hidden="true"></i>`}
      <div class="toast-body-text">
        <div class="toast-title">${type === "error" ? "Notice" : "Success"}</div>
        <div class="toast-msg">${safeMessage}</div>
      </div>
      <a href="cart.html" class="toast-action-btn">View Cart</a>
      <button type="button" class="toast-close-btn" aria-label="Close notification">&times;</button>
    `;

    container.appendChild(toastEl);

    // Close button
    const closeBtn = toastEl.querySelector(".toast-close-btn");
    closeBtn.addEventListener("click", () => {
      toastEl.classList.add("toast-hiding");
      setTimeout(() => toastEl.remove(), 300);
    });

    // Auto remove after 3.8s
    setTimeout(() => {
      if (toastEl.parentElement) {
        toastEl.classList.add("toast-hiding");
        setTimeout(() => toastEl.remove(), 300);
      }
    }, 3800);
  }
};

// Global shortcuts for inline handlers
window.addToCart = function(name, price, image, quantity = 1) {
  WebhiveCart.addToCart(name, price, image, quantity);
};

window.buyNow = function(name, price, image) {
  WebhiveCart.addToCart(name, price, image, 1);
  window.location.href = "checkout.html";
};

// Auto initialize on DOM ready and storage events
document.addEventListener("DOMContentLoaded", () => {
  WebhiveCart.updateCartCount();
});

window.addEventListener("storage", () => {
  WebhiveCart.updateCartCount();
});
