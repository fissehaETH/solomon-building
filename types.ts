
export interface Product {
  product_id: string;
  product_name: string;
  category: string;
  brand: string;
  unit: string; // Purchase Unit (e.g., Roll)
  unit_price: number; // Price per Purchase Unit (as entered in Restock)
  stock_qty: number; // Stored in base sell_units for precision
  min_stock: number; // Alert threshold in base sell_units
  created_at: string;
}

export interface Category {
  catagory_id: string;
  catagoryName: string;
  purchasingUnit: string;
  brand: string;
  sellingUnit: string;
  ConvertionRate: string; // e.g., "1:100" (purchasingUnit:sellingUnit)
}

export interface Sale {
  sale_id: string;
  date: string;
  product_id: string;
  product_name: string;
  quantity: number; // Quantity in the selected unit
  base_quantity: number; // Calculated quantity in base units for stock deduction
  sellingUnit: string; // The specific unit name used for this sale (matches sheet column)
  unitPrice: number; // Price per the selected unit
  customer_name: string;
  payment_method: 'Cash' | 'Bank Transfer' | 'Credit';
  recorded_by: string;
  paymentMethod: string;
}

export interface Purchase {
  purchase_id: string;
  date: string;
  product_id: string;
  product_name: string;
  quantity: number; // Quantity in purchase units
  base_quantity: number; // Converted quantity for stock addition
  purchaseUnit: string;
  unitPrice: number; // Price per purchase unit (renamed from unitCost)
  supplier_name: string;
  recorded_by: string;
}

export interface Customer {
  customer_id: string;
  customer_name: string;
  phone: string;
  address: string;
  created_at: string;
}

export interface User {
  user_id: string;
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  role: 'Admin' | 'Salesperson';
  created_at: string;
}
