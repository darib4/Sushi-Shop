const products = [
  ...sushiProducts,
  ...drinkProducts,
  ...dessertProducts
];

if (!localStorage.getItem("products")) {
  localStorage.setItem("products", JSON.stringify(products));
}
