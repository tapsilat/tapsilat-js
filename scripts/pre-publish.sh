#!/bin/bash

# Pre-publish kontrol script'i
set -e

echo "🔍 Yayın öncesi kontroller yapılıyor..."

# 1. Package.json kontrolü
echo "📋 Package.json kontrol ediliyor..."
if ! jq -e '.name' package.json > /dev/null; then
  echo "❌ Package.json geçersiz!"
  exit 1
fi

# 2. README kontrolü
echo "📚 README kontrol ediliyor..."
if [ ! -f "README.md" ]; then
  echo "❌ README.md bulunamadı!"
  exit 1
fi

# 3. License kontrolü
echo "⚖️ License kontrol ediliyor..."
if [ ! -f "LICENSE" ]; then
  echo "❌ LICENSE dosyası bulunamadı!"
  exit 1
fi

# 4. TypeScript build kontrolü
echo "🔧 TypeScript build kontrol ediliyor..."
npm run type-check

# 5. Linting kontrolü
echo "✨ Linting kontrol ediliyor..."
npm run lint

# 6. Test kontrolü
echo "🧪 Testler kontrol ediliyor..."
npm run test

# 7. Build kontrolü
echo "🔨 Build kontrol ediliyor..."
npm run build

# 8. Bundle size kontrolü
echo "📏 Bundle size kontrol ediliyor..."
if [ -f "dist/index.js" ]; then
  SIZE=$(wc -c < dist/index.js)
  echo "Bundle size: $SIZE bytes"
  
  if [ $SIZE -gt 1000000 ]; then  # 1MB limit
    echo "⚠️ Bundle size çok büyük: $SIZE bytes"
  fi
fi

echo "✅ Tüm kontroller başarılı!"
echo "🚀 Yayına hazır!"
