/* eslint-disable */


import 'dotenv/config'; // Load .env file
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';


const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting seed...\n');


  // SEED ADMIN ACCOUNT

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@nusabite.com' },
    update: {},
    create: {
      email: 'admin@nusabite.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'ADMIN',
    },
  });

  console.log(`Admin: ${admin.email} (role: ${admin.role})`);

  // SEED CATEGORIES
  const categoryData = [
    { name: 'Makanan Utama' },
    { name: 'Minuman' },
    { name: 'Dessert' },
    { name: 'Snack' },
  ];

  for (const cat of categoryData) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  console.log(` ${categoryData.length} categories seeded`);

  // SEED SAMPLE MENUS
  const makananUtama = await prisma.category.findUnique({
    where: { name: 'Makanan Utama' },
  });

  const minuman = await prisma.category.findUnique({
    where: { name: 'Minuman' },
  });

  const dessert = await prisma.category.findUnique({
    where: { name: 'Dessert' },
  });

  const menuData = [
    {
      name: 'Nasi Goreng Spesial',
      description: 'Nasi goreng dengan telur, ayam, dan sayuran segar',
      price: 25000,
      categoryId: makananUtama!.id,
    },
    {
      name: 'Mie Ayam Bakso',
      description: 'Mie dengan potongan ayam dan bakso kenyal',
      price: 20000,
      categoryId: makananUtama!.id,
    },
    {
      name: 'Soto Ayam',
      description: 'Soto ayam kuah kuning dengan nasi putih',
      price: 22000,
      categoryId: makananUtama!.id,
    },
    {
      name: 'Es Teh Manis',
      description: 'Teh manis segar dengan es batu',
      price: 8000,
      categoryId: minuman!.id,
    },
    {
      name: 'Jus Alpukat',
      description: 'Jus alpukat segar dengan susu kental manis',
      price: 18000,
      categoryId: minuman!.id,
    },
    {
      name: 'Es Jeruk',
      description: 'Jeruk peras segar dengan es batu',
      price: 10000,
      categoryId: minuman!.id,
    },
    {
      name: 'Pudding Coklat',
      description: 'Pudding coklat lembut dengan saus karamel',
      price: 12000,
      categoryId: dessert!.id,
    },
  ];

  // Cek apakah menu sudah ada
  const existingMenuCount = await prisma.menu.count();

  if (existingMenuCount === 0) {
    await prisma.menu.createMany({ data: menuData });
    console.log(`${menuData.length} menus seeded`);
  } else {
    console.log(`⏭Menus already exist, skipping...`);
  }

 
  console.log('\n Seed completed!');
  console.log('================================');
  console.log(' Admin email    : admin@nusabite.com');
  console.log('Admin password : admin123');
  console.log('================================');
  console.log('GANTI PASSWORD INI DI PRODUCTION!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
