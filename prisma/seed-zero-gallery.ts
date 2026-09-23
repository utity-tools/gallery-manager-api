import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find zero@gmail.com user
  const testUser = await prisma.user.findUnique({
    where: { email: "zero@gmail.com" },
  });

  if (!testUser) {
    console.error("❌ zero@gmail.com not found");
    process.exit(1);
  }

  const gallery = await prisma.gallery.findUnique({
    where: { userId: testUser.id },
  });

  if (!gallery) {
    console.error("❌ Gallery for zero@gmail.com not found");
    process.exit(1);
  }

  console.log(`✅ Using gallery: ${gallery.id} (${gallery.title})`);

  // Check existing products
  const existingProducts = await prisma.product.findMany({
    where: { galleryId: gallery.id },
  });

  if (existingProducts.length > 0) {
    console.log(`⚠️  Gallery already has ${existingProducts.length} products. Skipping creation.`);
  } else {
    // Create test products
    const products = [
      {
        title: "Exhibition Catalogue 2024",
        description: "Professional exhibition catalogue with artist biographies and artwork details",
        imageUrl: "https://via.placeholder.com/400x300?text=Catalogue",
        price: 39.99,
        category: "catalog",
        stock: 50,
        sku: "ZERO-CAT-2024-001",
        isActive: true,
      },
      {
        title: "Limited Edition Print",
        description: "High-quality art print featuring works from our current exhibition",
        imageUrl: "https://via.placeholder.com/400x300?text=Print",
        price: 49.99,
        category: "print",
        stock: 25,
        sku: "ZERO-PRINT-LTD-001",
        isActive: true,
      },
      {
        title: "Gallery Merchandise T-Shirt",
        description: "Premium cotton t-shirt with gallery logo",
        imageUrl: "https://via.placeholder.com/400x300?text=Merchandise",
        price: 24.99,
        category: "merchandise",
        stock: 75,
        sku: "ZERO-TSHIRT-001",
        isActive: true,
      },
      {
        title: "Artist Biography Book",
        description: "Comprehensive collection of artist biographies and interviews",
        imageUrl: "https://via.placeholder.com/400x300?text=Book",
        price: 29.99,
        category: "book",
        stock: 30,
        sku: "ZERO-BOOK-ARTIST-001",
        isActive: true,
      },
      {
        title: "Gallery Poster Collection",
        description: "Set of 5 exhibition posters (A2 size)",
        imageUrl: "https://via.placeholder.com/400x300?text=Posters",
        price: 59.99,
        category: "poster",
        stock: 20,
        sku: "ZERO-POSTER-SET-001",
        isActive: true,
      },
      {
        title: "Premium Photo Book",
        description: "High-resolution photo documentation of gallery exhibitions",
        imageUrl: "https://via.placeholder.com/400x300?text=PhotoBook",
        price: 89.99,
        category: "book",
        stock: 15,
        sku: "ZERO-PHOTOBOOK-001",
        isActive: true,
      },
    ];

    const createdProducts = await Promise.all(
      products.map((p) => prisma.product.create({ data: { galleryId: gallery.id, ...p } }))
    );

    console.log(`✅ Created ${createdProducts.length} products:`);
    createdProducts.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.title} - €${p.price}`);
    });
  }

  console.log(`\n📊 TESTING CREDENTIALS:`);
  console.log(`   Email: zero@gmail.com`);
  console.log(`   Gallery: ${gallery.id}`);
  console.log(`   Gallery Name: ${gallery.title}`);
  console.log(`\n✅ Data setup complete!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
