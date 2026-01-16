function getRecommendations(product) {
  const products = JSON.parse(localStorage.getItem("products")) || [];

  return products.filter(p =>
    p.category === product.category && p.id !== product.id
  ).slice(0, 3);
}
