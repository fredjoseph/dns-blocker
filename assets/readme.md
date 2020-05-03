Convert `svg` to `png` (requires `imagemagick`)  
- `mogrify -format png -resize 128.128 -quality 100 -path . *.svg`