# Gunakan Node.js versi 22 dengan Alpine Linux (sangat ringan)
FROM node:22-alpine

# Set direktori kerja di dalam container
WORKDIR /app

# Copy file konfigurasi dependencies
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (menggunakan npm install agar lebih toleran terhadap perbedaan lockfile)
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy seluruh source code
COPY . .

# Build aplikasi NestJS (hasilnya masuk ke folder /dist)
RUN npm run build

# Ekspos port (Railway akan menimpa ini dengan variabel PORT miliknya, 
# tapi mengekspos 3000 adalah standar fallback)
EXPOSE 3000

# Command utama saat container berjalan
# Kita menjalankan npx prisma migrate deploy terlebih dahulu agar database
# selalu up-to-date setiap kali aplikasi di-deploy ulang, lalu menjalankan server.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
