# Admin Panel Guide

## Admin Access

### Default Admin Credentials
- **Email:** `admin@sushi.bg`
- **Password:** `admin123`

The admin user is automatically created on first app load via `init.js`.

## Admin Functionalities

### 1. Add Products
Navigate to the Admin Panel and fill in the "Add new product" form:
- **Product Name:** Name of the product
- **Department:** Select from Sushi, Drinks, or Desserts
- **Category:** Select appropriate category
- **Price (BGN):** Product price in Bulgarian Lev
- **Stock (pcs):** Number of units available (default: 20)
- **Weight:** Product weight specification
- **Ingredients:** List of ingredients

Click **"Add product"** to save the product.

### 2. Edit Products
1. Find the product in the "Existing products" list
2. Click the **"Edit"** button on the product row
3. A modal dialog will appear with the product details
4. Modify any fields as needed
5. Click **"Save Changes"** to update the product

### 3. Delete Products
1. Find the product in the "Existing products" list
2. Click the **"Delete"** button on the product row
3. Confirm the deletion when prompted
4. The product will be removed from inventory

## Product Management

All products are stored in `localStorage` under the key `"products"`. The admin panel provides a user-friendly interface to manage this data without manual database access.

### Data Structure
Each product object contains:
```javascript
{
  id: number,           // Unique timestamp-based ID
  name: string,         // Product name
  department: string,   // Sushi, Drinks, or Desserts
  category: string,     // Product category
  price: number,        // Price in BGN
  stock: number,        // Available units
  weight: string,       // Weight specification
  ingredients: string   // Ingredients list
}
```

## Security Notes
- Admin access is role-based and checked on page load
- Only users with `role: "admin"` can access the admin panel
- Unauthorized users will be redirected to login
- All changes are persisted to localStorage immediately

## Features
✅ Add new products with full details
✅ Edit existing products
✅ Delete products with confirmation
✅ Real-time product list updates
✅ Toast notifications for user feedback
✅ Modal-based editing interface
✅ Admin-only access control
