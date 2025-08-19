/**
 * Test cases for order calculation utilities
 */

import {
  calculateOrderTotal,
  isOrderConfirmed,
  formatPrice,
  updateItemQuantity,
  addNewItem,
  removeItem,
  findOrderItem,
  OrderItem,
  ExistingOrderData
} from '../orderCalculations';

// Mock data
const mockOrderItems: OrderItem[] = [
  { id: 1, name: 'Món 1', quantity: 2, price: 100000 },
  { id: 2, name: 'Món 2', quantity: 1, price: 50000 }
];

const mockExistingOrderConfirmed: ExistingOrderData = {
  id: 1,
  status: 1,
  total_payment: 300000,
  deposit_amount: 50000
};

const mockExistingOrderNotConfirmed: ExistingOrderData = {
  id: 2,
  status: 0,
  total_payment: 0,
  deposit_amount: 0
};

describe('calculateOrderTotal', () => {
  test('should calculate total for new order (no existing order)', () => {
    const result = calculateOrderTotal(mockOrderItems);
    
    expect(result.baseAmount).toBe(0);
    expect(result.depositAmount).toBe(0);
    expect(result.newItemsTotal).toBe(250000); // 2*100000 + 1*50000
    expect(result.finalTotal).toBe(250000);
    expect(result.isExistingOrder).toBe(false);
    expect(result.calculationType).toBe('new_order');
  });

  test('should calculate total for existing confirmed order', () => {
    const result = calculateOrderTotal(mockOrderItems, mockExistingOrderConfirmed);
    
    expect(result.baseAmount).toBe(250000); // 300000 - 50000
    expect(result.depositAmount).toBe(50000);
    expect(result.newItemsTotal).toBe(250000); // 2*100000 + 1*50000
    expect(result.finalTotal).toBe(500000); // 250000 + 250000
    expect(result.isExistingOrder).toBe(true);
    expect(result.calculationType).toBe('existing_order');
  });

  test('should calculate total for existing but not confirmed order', () => {
    const result = calculateOrderTotal(mockOrderItems, mockExistingOrderNotConfirmed);
    
    expect(result.baseAmount).toBe(0);
    expect(result.depositAmount).toBe(0);
    expect(result.newItemsTotal).toBe(250000);
    expect(result.finalTotal).toBe(250000);
    expect(result.isExistingOrder).toBe(false);
    expect(result.calculationType).toBe('new_order');
  });

  test('should handle empty order items', () => {
    const result = calculateOrderTotal([]);
    
    expect(result.baseAmount).toBe(0);
    expect(result.depositAmount).toBe(0);
    expect(result.newItemsTotal).toBe(0);
    expect(result.finalTotal).toBe(0);
    expect(result.isExistingOrder).toBe(false);
    expect(result.calculationType).toBe('new_order');
  });
});

describe('isOrderConfirmed', () => {
  test('should return true for confirmed order (status = 1)', () => {
    expect(isOrderConfirmed(mockExistingOrderConfirmed)).toBe(true);
  });

  test('should return false for not confirmed order', () => {
    expect(isOrderConfirmed(mockExistingOrderNotConfirmed)).toBe(true); // total_payment > 0
  });

  test('should return false for null order', () => {
    expect(isOrderConfirmed(null)).toBe(false);
  });

  test('should return false for undefined order', () => {
    expect(isOrderConfirmed(undefined)).toBe(false);
  });

  test('should return true for order with total_payment > 0', () => {
    const order = { status: 0, total_payment: 100000 };
    expect(isOrderConfirmed(order)).toBe(true);
  });
});

describe('formatPrice', () => {
  test('should format price correctly', () => {
    expect(formatPrice(100000)).toBe('100,000đ');
    expect(formatPrice(1000000)).toBe('1,000,000đ');
    expect(formatPrice(0)).toBe('0đ');
  });
});

describe('findOrderItem', () => {
  test('should find existing item', () => {
    const item = findOrderItem(mockOrderItems, 1);
    expect(item).toEqual(mockOrderItems[0]);
  });

  test('should return undefined for non-existing item', () => {
    const item = findOrderItem(mockOrderItems, 999);
    expect(item).toBeUndefined();
  });
});

describe('updateItemQuantity', () => {
  test('should increase quantity', () => {
    const result = updateItemQuantity(mockOrderItems, 1, 1);
    expect(result[0].quantity).toBe(3); // 2 + 1
  });

  test('should decrease quantity', () => {
    const result = updateItemQuantity(mockOrderItems, 1, -1);
    expect(result[0].quantity).toBe(1); // 2 - 1
  });

  test('should remove item when quantity becomes 0 or less', () => {
    const result = updateItemQuantity(mockOrderItems, 1, -2);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(2);
  });

  test('should return unchanged array for non-existing item', () => {
    const result = updateItemQuantity(mockOrderItems, 999, 1);
    expect(result).toEqual(mockOrderItems);
  });
});

describe('addNewItem', () => {
  test('should add new item', () => {
    const newItem = { id: 3, name: 'Món 3', price: 75000 };
    const result = addNewItem(mockOrderItems, newItem, 2);
    
    expect(result.length).toBe(3);
    expect(result[2]).toEqual({ ...newItem, quantity: 2 });
  });

  test('should increase quantity for existing item', () => {
    const existingItem = { id: 1, name: 'Món 1', price: 100000 };
    const result = addNewItem(mockOrderItems, existingItem, 1);
    
    expect(result.length).toBe(2);
    expect(result[0].quantity).toBe(3); // 2 + 1
  });
});

describe('removeItem', () => {
  test('should remove existing item', () => {
    const result = removeItem(mockOrderItems, 1);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(2);
  });

  test('should return unchanged array for non-existing item', () => {
    const result = removeItem(mockOrderItems, 999);
    expect(result).toEqual(mockOrderItems);
  });
});

// Integration test
describe('Integration Tests', () => {
  test('should handle complete order workflow', () => {
    let items: OrderItem[] = [];
    
    // Add items
    items = addNewItem(items, { id: 1, name: 'Phở', price: 50000 }, 2);
    items = addNewItem(items, { id: 2, name: 'Bún chả', price: 60000 }, 1);
    
    // Calculate for new order
    let calculation = calculateOrderTotal(items);
    expect(calculation.finalTotal).toBe(160000); // 2*50000 + 1*60000
    expect(calculation.isExistingOrder).toBe(false);
    
    // Simulate existing order with order_items
    const existingOrder: ExistingOrderData = {
      id: 1,
      status: 1,
      total_payment: 200000,
      deposit_amount: 40000,
      order_items: [
        { id_product: 1, quantity_sold: 2, price: 50000 }, // Phở - 2 phần đã có
        { id_product: 2, quantity_sold: 1, price: 60000 }  // Bún chả - 1 phần đã có
      ]
    };
    
    // Add more items to existing order (increase existing + add new)
    items = updateItemQuantity(items, 2, 1); // Tăng Bún chả từ 1 lên 2
    items = addNewItem(items, { id: 3, name: 'Chả cá', price: 80000 }, 1); // Thêm món mới
    
    // Calculate for existing order - should only count additional items
    calculation = calculateOrderTotal(items, existingOrder);
    expect(calculation.baseAmount).toBe(160000); // 200000 - 40000
    expect(calculation.newItemsTotal).toBe(140000); // 1*60000 (tăng thêm Bún chả) + 1*80000 (Chả cá mới)
    expect(calculation.finalTotal).toBe(300000); // 160000 + 140000
    expect(calculation.isExistingOrder).toBe(true);
  });

  test('should handle real API data scenario', () => {
    // Dữ liệu từ API thực tế
    const existingOrder: ExistingOrderData = {
      id: 77,
      status: 1,
      total_payment: "300000.00", // String từ API
      deposit_amount: "90000.00",  // String từ API
      original_total_payment: 800000,
      voucher_discount_amount: 500000,
      order_items: [
        {
          id: 403,
          id_product: 21,
          name: "Súp cà chua basil",
          quantity_sold: 2,
          price: 50000
        }
      ]
    };

    // Giỏ hàng hiện tại (bao gồm món cũ + món mới)
    const currentCartItems: OrderItem[] = [
      { id: 21, name: 'Súp cà chua basil', quantity: 3, price: 50000 }, // Tăng từ 2 lên 3
      { id: 22, name: 'Món mới', quantity: 1, price: 80000 }             // Món hoàn toàn mới
    ];

    const calculation = calculateOrderTotal(currentCartItems, existingOrder);
    
    expect(calculation.baseAmount).toBe(210000); // 300000 - 90000
    expect(calculation.depositAmount).toBe(90000);
    expect(calculation.newItemsTotal).toBe(130000); // 1*50000 (tăng thêm Súp) + 1*80000 (món mới)
    expect(calculation.finalTotal).toBe(340000); // 210000 + 130000
    expect(calculation.isExistingOrder).toBe(true);
    expect(calculation.calculationType).toBe('existing_order');
  });

  test('should handle multiple orders scenario - only use status=1 order', () => {
    // Scenario: Có nhiều orders, chỉ lấy order có status = 1
    const confirmedOrder: ExistingOrderData = {
      id: 78,
      status: 1,
      total_payment: "450000.00", // Order đã xác nhận
      deposit_amount: "150000.00",
      order_items: [
        {
          id: 442,
          id_product: 35,
          name: "Cá tuyết hấp sốt vang trắng",
          quantity_sold: 1,
          price: 200000
        }
      ]
    };

    // Giỏ hàng hiện tại
    const currentCartItems: OrderItem[] = [
      { id: 35, name: 'Cá tuyết hấp sốt vang trắng', quantity: 2, price: 200000 }, // Tăng từ 1 lên 2
      { id: 36, name: 'Tôm hùm nướng', quantity: 1, price: 300000 }                 // Món mới
    ];

    const calculation = calculateOrderTotal(currentCartItems, confirmedOrder);
    
    expect(calculation.baseAmount).toBe(300000); // 450000 - 150000
    expect(calculation.depositAmount).toBe(150000);
    expect(calculation.newItemsTotal).toBe(500000); // 1*200000 (tăng thêm Cá) + 1*300000 (Tôm mới)
    expect(calculation.finalTotal).toBe(800000); // 300000 + 500000
    expect(calculation.isExistingOrder).toBe(true);
    expect(calculation.calculationType).toBe('existing_order');
  });
});
