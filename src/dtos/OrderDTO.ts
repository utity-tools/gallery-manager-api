export interface OrderItemData {
  id: string;
  productId: string;
  quantity: number;
  priceAtTime: number;
  variantes?: Record<string, string> | null;
}

export class OrderDTO {
  id: string;
  galleryId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  totalPrice: number;
  paymentStatus: string;
  orderStatus: string;
  shippingAddress?: Record<string, string> | null;
  stripePaymentId?: string | null;
  items?: OrderItemData[];
  createdAt: Date;
  updatedAt: Date;

  constructor(data: {
    id: string;
    galleryId: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string | null;
    totalPrice: any; // Decimal from Prisma
    paymentStatus: string;
    orderStatus: string;
    shippingAddress?: any;
    stripePaymentId?: string | null;
    items?: any[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = data.id;
    this.galleryId = data.galleryId;
    this.customerName = data.customerName;
    this.customerEmail = data.customerEmail;
    this.customerPhone = data.customerPhone;
    this.totalPrice = Number(data.totalPrice);
    this.paymentStatus = data.paymentStatus;
    this.orderStatus = data.orderStatus;
    this.shippingAddress = data.shippingAddress;
    this.stripePaymentId = data.stripePaymentId;
    this.items = data.items?.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      priceAtTime: Number(item.priceAtTime),
      variantes: item.variantes,
    }));
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
