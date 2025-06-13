#!/bin/bash

# NPM Yayın Script'i
set -e

echo "🚀 Tapsilat JS SDK yayınlanıyor..."

# 1. Sürüm kontrolü
if [ -z "$1" ]; then
  echo "❌ Sürüm belirtmelisiniz: patch, minor, major"
  echo "Kullanım: ./scripts/publish.sh [patch|minor|major]"
  exit 1
fi

VERSION_TYPE=$1

# 2. Temizlik
echo "🧹 Dist klasörü temizleniyor..."
npm run clean

# 3. Dependency kontrolü
echo "📦 Dependencies kontrol ediliyor..."
npm audit --audit-level high

# 4. Test çalıştır
echo "🧪 Testler çalıştırılıyor..."
npm run test

# 5. Build
echo "🔨 Proje build ediliyor..."
npm run build

# 6. Build dosyalarını kontrol et
echo "📁 Build dosyaları kontrol ediliyor..."
if [ ! -f "dist/index.js" ] || [ ! -f "dist/index.d.ts" ]; then
  echo "❌ Build dosyaları bulunamadı!"
  exit 1
fi

# 7. Sürüm güncelle
echo "📈 Sürüm güncelleniyor: $VERSION_TYPE"
npm version $VERSION_TYPE

# 8. Git push
echo "📤 Git'e push ediliyor..."
git push && git push --tags

# 9. NPM'e yayınla
echo "🌐 NPM'e yayınlanıyor..."
npm publish

echo "✅ Yayın tamamlandı!"
echo "📦 Paket: https://www.npmjs.com/package/tapsilat-js"
