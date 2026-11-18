const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../node_modules/@vladmandic/face-api/model');
const destDir = path.resolve(__dirname, '../public/models');

if (!fs.existsSync(srcDir)) {
  console.log('[copy-models] @vladmandic/face-api model directory not found. Skipping.');
  process.exit(0);
}

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const targetModels = [
  'tiny_face_detector_model',
  'face_landmark_68_model',
  'face_recognition_model',
];

const files = fs.readdirSync(srcDir);
let copied = 0;

for (const file of files) {
  if (targetModels.some((prefix) => file.startsWith(prefix))) {
    const srcFile = path.join(srcDir, file);
    const destFile = path.join(destDir, file);
    if (!fs.existsSync(destFile) || fs.statSync(destFile).size !== fs.statSync(srcFile).size) {
      fs.copyFileSync(srcFile, destFile);
      copied++;
    }
  }
}

console.log(`[copy-models] Model files verified (${copied} copied/updated).`);
