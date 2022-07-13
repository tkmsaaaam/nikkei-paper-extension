#!bin/sh
rm -rf nikkei-paper-extension
rm -rf nikkei-paper-extension.zip
mkdir nikkei-paper-extension
cp -r src/ nikkei-paper-extension/src
cp manifest.json nikkei-paper-extension

zip nikkei-paper-extension -r nikkei-paper-extension
