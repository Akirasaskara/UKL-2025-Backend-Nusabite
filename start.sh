#!/bin/sh

echo "=== Memulai Aplikasi Amara API... ==="

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR FATAL: Anda belum menambahkan variabel 'DATABASE_URL' di tab Variables Railway!"
  echo "Aplikasi tidak bisa berjalan tanpa database."
  exit 1
fi

if [ -z "$DIRECT_URL" ]; then
  echo "ERROR FATAL: Anda belum menambahkan variabel 'DIRECT_URL' di tab Variables Railway!"
  echo "Prisma Migrate (untuk membuat tabel) tidak bisa berjalan."
  exit 1
fi

echo "Environment variables terdeteksi!"
echo "Mencoba menjalankan migrasi database dengan DIRECT_URL..."

# Mengganti sementara DATABASE_URL dengan DIRECT_URL untuk keperluan migrasi
export DATABASE_URL=$DIRECT_URL
npx prisma migrate deploy

# Jika migrasi gagal, stop script di sini
if [ $? -ne 0 ]; then
  echo "ERROR: Migrasi database gagal! Pastikan DIRECT_URL sudah benar (port 5432)."
  exit 1
fi

echo "Migrasi sukses! Menyalakan server NestJS..."

if [ -f "dist/main.js" ]; then
  node dist/main
elif [ -f "dist/src/main.js" ]; then
  node dist/src/main
else
  echo "ERROR: File main.js tidak ditemukan di dalam folder dist!"
  exit 1
fi
