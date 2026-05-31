# Gunakan Node.js versi 22 dengan Alpine Linux (sangat ringan)
FROM node:22-alpine

# Set direktori kerja di dalam container
WORKDIR /app

# Copy file konfigurasi dependencies
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (menggunakan npm install agar lebih toleran terhadap perbedaan lockfile)
RUN npm install

# Generate Prisma client dengan dummy URL agar tidak crash saat build
RUN DATABASE_URL="postgresql://postgres:dummy@localhost:5432/dummy" npx prisma generate

# Copy seluruh source code
COPY . .

# Build aplikasi NestJS (hasilnya masuk ke folder /dist)
RUN npm run build

# Ekspos port (Railway akan menimpa ini dengan variabel PORT miliknya, 
# tapi mengekspos 3000 adalah standar fallback)
EXPOSE 3000

# Copy dan berikan izin eksekusi pada script start
COPY start.sh ./
RUN chmod +x start.sh

# Command utama saat container berjalan
CMD ["./start.sh"]
