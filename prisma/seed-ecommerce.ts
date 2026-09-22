import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Use testuser@gmail.com for testing
  const testUser = await prisma.user.findUnique({
    where: { email: "testuser@gmail.com" },
  });

  if (!testUser) {
    console.error("❌ testuser@gmail.com not found");
    process.exit(1);
  }

  const gallery = await prisma.gallery.findUnique({
    where: { userId: testUser.id },
  });

  if (!gallery) {
    console.error("❌ Gallery for testuser not found");
    process.exit(1);
  }

  console.log(`✅ Using gallery: ${gallery.id} (${gallery.title})`);

  // Create test products
  const product1 = await prisma.product.create({
    data: {
      galleryId: gallery.id,
      title: "Test Print A3",
      description: "Beautiful test print in A3 size",
      imageUrl: "https://example.com/print-a3.jpg",
      price: 29.99,
      category: "print",
      stock: 50,
      sku: "TEST-PRINT-A3-001",
      variantes: {
        sizes: ["A3", "A2", "A1"],
        materials: ["Mate", "Brillante"],
      },
      isActive: true,
    },
  });

  const product2 = await prisma.product.create({
    data: {
      galleryId: gallery.id,
      title: "Test Photo Canvas",
      description: "High-quality photo on canvas",
      imageUrl: "https://example.com/photo-canvas.jpg",
      price: 79.99,
      category: "photo",
      stock: 10,
      sku: "TEST-PHOTO-CANVAS-001",
      variantes: {
        sizes: ["30x40", "40x60"],
        finishes: ["Glossy", "Matte"],
      },
      isActive: true,
    },
  });

  const product3 = await prisma.product.create({
    data: {
      galleryId: gallery.id,
      title: "Test Illustration",
      description: "Original digital illustration",
      imageUrl: "https://example.com/illustration.jpg",
      price: 15.99,
      category: "illustration",
      stock: 100,
      sku: "TEST-ILLUSTRATION-001",
      isActive: true,
    },
  });

  console.log(`✅ Created 3 test products:`);
  console.log(`   1. ${product1.title} - €${product1.price}`);
  console.log(`   2. ${product2.title} - €${product2.price}`);
  console.log(`   3. ${product3.title} - €${product3.price}`);

  // Create test order
  const order = await prisma.order.create({
    data: {
      galleryId: gallery.id,
      customerName: "Test Customer",
      customerEmail: "testcustomer@example.com",
      customerPhone: "+34 91 234 5678",
      totalPrice: 109.97, // product1 + product2 + product3
      paymentStatus: "pending",
      orderStatus: "new",
      shippingAddress: {
        street: "Calle Principal 123",
        city: "Madrid",
        postalCode: "28001",
        country: "Spain",
      },
      items: {
        create: [
          {
            productId: product1.id,
            quantity: 2,
            priceAtTime: product1.price,
            variantes: { size: "A3", material: "Mate" },
          },
          {
            productId: product2.id,
            quantity: 1,
            priceAtTime: product2.price,
            variantes: { size: "30x40", finish: "Glossy" },
          },
          {
            productId: product3.id,
            quantity: 4,
            priceAtTime: product3.price,
          },
        ],
      },
    },
    include: { items: true },
  });

  console.log(`✅ Created test order:`);
  console.log(`   Order ID: ${order.id}`);
  console.log(`   Total: €${order.totalPrice}`);
  console.log(`   Status: ${order.orderStatus} (${order.paymentStatus})`);
  console.log(`   Items: ${order.items.length}`);

  console.log(`\n📊 TESTING CREDENTIALS:`);
  console.log(`   Email: testuser@gmail.com`);
  console.log(`   Gallery: ${gallery.id}`);
  console.log(`   Products: 3 (${product1.id}, ${product2.id}, ${product3.id})`);
  console.log(`   Test Order: ${order.id}`);
  console.log(`\n✅ Test data created successfully!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
