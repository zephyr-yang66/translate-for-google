const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [16, 48, 128];
const svgPath = path.join(__dirname, '../public/icons/icon.svg');
const outputDir = path.join(__dirname, '../dist/icons');

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function convertSvgToPng() {
  console.log('开始转换 SVG 到 PNG...\n');
  
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon${size}.png`);
    
    try {
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✓ 成功生成: icon${size}.png (${size}x${size})`);
    } catch (error) {
      console.error(`✗ 生成 icon${size}.png 失败:`, error.message);
    }
  }
  
  console.log('\n图标转换完成！');
}

convertSvgToPng();

