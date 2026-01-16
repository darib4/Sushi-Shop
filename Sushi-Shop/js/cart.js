function getCart() {
  return state.getCart();
}

function saveCart(cart) {
  state.setCart(cart);
}

function addToCart(product) {
  console.log("Adding product to cart:", product);
  state.addToCart(product);
  
  // Show toast notification
  setTimeout(() => {
    if (typeof showToast === 'function') {
      showToast("Added to cart!", "success");
    } else {
      alert("Added to cart!");
    }
  }, 100);
}

function clearCart() {
  state.clearCart();
  updateCartBadge();
}

/**
 * Stripe Checkout Integration
 * Sends cart to backend to create a Stripe Checkout session
 * 
 * SECURITY NOTES:
 * - Prices are verified on the server (never trust client-side prices in production)
 * - Backend creates the Stripe session with verified amounts
 * - Redirects to Stripe's hosted checkout page
 */
async function handleStripeCheckout() {
  const cart = getCart();
  
  // Validate cart is not empty
  if (!cart || cart.length === 0) {
    showToast("Your cart is empty", "warning");
    return;
  }

  // Disable button to prevent double-click
  const btn = document.getElementById("pay-card-btn");
  if (btn) btn.disabled = true;

  try {
    showToast("Processing payment...", "info");

    // Prepare cart data for backend
    const cartData = cart.map(item => ({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      quantity: item.quantity
    }));

    // Call backend endpoint to create checkout session
    const response = await fetch("http://localhost:4242/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ cart: cartData })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const { url } = await response.json();

    if (!url) {
      throw new Error("No checkout URL returned from server");
    }

    // Redirect to Stripe Checkout
    window.location.href = url;
  } catch (error) {
    console.error("Stripe checkout error:", error);
    showToast(`Payment error: ${error.message}`, "error");
    
    // Re-enable button on error
    const btn = document.getElementById("pay-card-btn");
    if (btn) btn.disabled = false;
  }
}