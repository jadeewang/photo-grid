# How to Add Your Own Photos

## Quick Steps

1. **Copy your photos** to the `public/textures/` folder
   - Location: `final/public/textures/`
   - Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`

2. **Option A: Replace existing files** (Easiest)
   - Replace `img1.webp`, `img2.webp`, etc. with your photos
   - Keep the same filenames (`img1.webp`, `img2.webp`, ... `img10.webp`)
   - No code changes needed!

3. **Option B: Use your own filenames**
   - Place your photos with any names (e.g., `my-photo-1.jpg`, `vacation.png`)
   - Update the paths in `main.js` to match your filenames
   - Example: Change `"textures/img1.webp"` to `"textures/my-photo-1.jpg"`

## Example: Using Custom Filenames

If you have photos named `photo1.jpg`, `photo2.jpg`, etc., update `main.js`:

```javascript
AssetsManager.AddTexture(AssetsId.TEXTURE_1, "textures/photo1.jpg");
AssetsManager.AddTexture(AssetsId.TEXTURE_2, "textures/photo2.jpg");
// ... etc
```

## Tips

- **WebP format** is recommended for best performance (smaller file sizes)
- You can use **fewer than 10 images** - just comment out or remove unused texture entries
- You can use **more than 10 images** - add more `TEXTURE_X` entries in `AssetsId.js` and corresponding `AddTexture` calls in `main.js`
- Image paths are relative to the `public` folder, so `"textures/photo.jpg"` refers to `public/textures/photo.jpg`

## Converting Images to WebP (Optional)

If you want to convert your images to WebP format for better performance:

**Using online tools:**
- [Squoosh](https://squoosh.app/) - Free online image converter
- [CloudConvert](https://cloudconvert.com/webp-converter)

**Using command line (if you have ImageMagick):**
```bash
magick convert input.jpg output.webp
```

**Using command line (if you have cwebp):**
```bash
cwebp input.jpg -q 80 -o output.webp
```
