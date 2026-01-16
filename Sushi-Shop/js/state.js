// Simple state management system for pure vanilla JS
class StateManager {
  constructor() {
    this.state = {
      cart: JSON.parse(localStorage.getItem("cart")) || []
    };
    this.listeners = [];
  }

  // Subscribe to state changes
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify all listeners of state change
  notify() {
    this.listeners.forEach(callback => callback(this.state));
  }

  // Get current state
  getState() {
    return this.state;
  }

  // Get cart
  getCart() {
    return this.state.cart;
  }

  // Update cart and persist
  setCart(newCart) {
    this.state.cart = newCart;
    localStorage.setItem("cart", JSON.stringify(newCart));
    this.notify();
  }

  // Add item to cart
  addToCart(product) {
    const cart = this.state.cart;
    const existing = cart.find(p => p.id === product.id);

    if (existing) {
      existing.quantity++;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    this.setCart(cart);
  }

  // Remove item from cart
  removeFromCart(productId) {
    const cart = this.state.cart.filter(p => p.id !== productId);
    this.setCart(cart);
  }

  // Update item quantity
  updateQuantity(productId, quantity) {
    const cart = this.state.cart;
    const item = cart.find(p => p.id === productId);
    
    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(productId);
      } else {
        item.quantity = quantity;
        this.setCart(cart);
      }
    }
  }

  // Clear cart
  clearCart() {
    this.setCart([]);
  }

  // Get total items count
  getTotalItems() {
    return this.state.cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }

  // Get total price
  getTotalPrice() {
    return this.state.cart.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 0)), 0);
  }
}

// Create global state instance
const state = new StateManager();
