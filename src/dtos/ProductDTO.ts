export class ProductDTO {
  id: string;
  galleryId: string;
  title: string;
  description?: string | null;
  imageUrl: string;
  price: number;
  category: string;
  stock: number;
  sku: string;
  variantes?: Record<string, string[]> | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: {
    id: string;
    galleryId: string;
    title: string;
    description?: string | null;
    imageUrl: string;
    price: any; // Decimal from Prisma
    category: string;
    stock: number;
    sku: string;
    variantes?: any;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = data.id;
    this.galleryId = data.galleryId;
    this.title = data.title;
    this.description = data.description;
    this.imageUrl = data.imageUrl;
    this.price = Number(data.price); // Convert Decimal to number
    this.category = data.category;
    this.stock = data.stock;
    this.sku = data.sku;
    this.variantes = data.variantes;
    this.isActive = data.isActive;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
