const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("./app/generated/prisma/client");
require("dotenv/config");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const products = [
    {
      name: "Green Box",
      description: "Зелёный ящик для Lumber Tycoon 2",
      price: 150,
      stock: 7,
      category: "Boxes",
    },
    {
      name: "Blue Box",
      description: "Синий ящик для Lumber Tycoon 2",
      price: 250,
      stock: 4,
      category: "Boxes",
    },
    {
      name: "Gold Wood",
      description: "Редкий золотой ресурс",
      price: 500,
      stock: 3,
      category: "Wood",
    },
    {
      name: "Fancy Sign",
      description: "Декоративная табличка",
      price: 350,
      stock: 9,
      category: "Decor",
    },
  ];

  for (const product of products) {
    await prisma.product.create({
      data: product,
    });
  }

  console.log("PRODUCTS CREATED");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
