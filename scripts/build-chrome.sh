#!/bin/bash

# Build script to minify JavaScript and CSS files, and create a zip file for the extension
# Requires terser, postcss-cli, autoprefixer, and cssnano to be installed
# npm install -g terser postcss postcss-cli autoprefixer cssnano

set -e

CURRENT_DIR=$(pwd)
TEMP_DIR=$(mktemp -d)
SCRIPT_DIR=$(dirname "$0")

# Copy necessary files to temp directory
cp -r images src manifest.json templates $TEMP_DIR

cd $TEMP_DIR

# Minify JavaScript files
terser src/core/constants.js -c -m -o src/core/constants.min.js && rm src/core/constants.js
terser src/core/utils.js -c -m -o src/core/utils.min.js && rm src/core/utils.js
terser src/core/storage.js -c -m -o src/core/storage.min.js && rm src/core/storage.js
terser src/modules/lyrics/translation.js -c -m -o src/modules/lyrics/translation.min.js && rm src/modules/lyrics/translation.js
terser src/modules/lyrics/lyrics.js -c -m -o src/modules/lyrics/lyrics.min.js && rm src/modules/lyrics/lyrics.js
terser src/modules/ui/dom.js -c -m -o src/modules/ui/dom.min.js && rm src/modules/ui/dom.js
terser src/modules/ui/observer.js -c -m -o src/modules/ui/observer.min.js && rm src/modules/ui/observer.js
terser src/modules/settings/settings.js -c -m -o src/modules/settings/settings.min.js && rm src/modules/settings/settings.js
terser src/index.js -c -m -o src/index.min.js && rm src/index.js
terser src/options/editor.js -c -m -o src/options/editor.min.js && rm src/options/editor.js
terser src/options/options.js -c -m -o src/options/options.min.js && rm src/options/options.js
terser src/background.js -c -m -o src/background.min.js && rm src/background.js

# Update HTML files to use minified JavaScript
sed -i.bak 's/src="editor\.js"/src="editor.min.js"/' src/options/options.html && rm src/options/options.html.bak
sed -i.bak 's/src="options\.js"/src="options.min.js"/' src/options/options.html && rm src/options/options.html.bak

# Minify CSS files
postcss src/index.css --use autoprefixer cssnano -o src/index.min.css && rm src/index.css
postcss src/options/options.css --use autoprefixer cssnano -o src/options/options.min.css && rm src/options/options.css

# Update HTML file to use minified CSS
sed -i.bak 's/href="options\.css"/href="options.min.css"/' src/options/options.html && rm src/options/options.html.bak

# Update manifest to use minified files
mv templates/manifest.chrome.json manifest.json

# Use Node.js to update the manifest
node <<EOF
const fs = require('fs');
const manifestPath = './manifest.json';

let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

manifest.content_scripts[0].js = [
  "src/core/constants.min.js",
  "src/core/utils.min.js",
  "src/core/storage.min.js",
  "src/modules/lyrics/translation.min.js",
  "src/modules/lyrics/lyrics.min.js",
  "src/modules/ui/dom.min.js",
  "src/modules/ui/observer.min.js",
  "src/modules/settings/settings.min.js",
  "src/libs/kuroshiro/kuroshiro.min.js",
  "src/libs/kuroshiro/kuroshiro-analyzer-kuromoji.min.js",
  "src/index.min.js"
];

manifest.content_scripts[0].css = ["src/index.min.css"];
manifest.background.service_worker = "src/background.min.js";

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('Manifest updated successfully.');
EOF

# Create zip file
zip -r better-lyrics.zip ./* -x "./dist/*" "LICENSE" "README.md" "./templates/*" "*.DS_Store" "${SCRIPT_DIR}/*"

# Move zip file to dist directory
mkdir -p $CURRENT_DIR/dist
mv better-lyrics.zip $CURRENT_DIR/dist/better-lyrics-chrome.zip

# Clean up
cd ..
rm -rf $TEMP_DIR

echo "Build completed successfully. Zip file created at dist/better-lyrics-chrome.zip"
