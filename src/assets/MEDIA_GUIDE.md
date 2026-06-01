# 📁 Bakester Bakery — Media Assets Guide

## Folder Structure

```
src/assets/
├── images/
│   ├── hero/          ← Hero section backgrounds & slides
│   ├── products/      ← Product/cake photos
│   ├── gallery/       ← Gallery & lifestyle images
│   └── team/          ← Team member photos
└── videos/
    ├── process/       ← Cake making process videos
    └── showcase/      ← Product showcase videos
```

---

## How to Add Your Images

### 1. Drop your image into the correct folder
For example, place `my-chocolate-cake.jpg` into:
```
src/assets/images/products/my-chocolate-cake.jpg
```

### 2. Import it in the relevant data file

Open `src/data/products.js` and update the image path:
```js
import myCake from '../assets/images/products/my-chocolate-cake.jpg';

export const bestSellers = [
  {
    id: 1,
    name: 'My Chocolate Cake',
    image: myCake,   // ← Use the imported variable
    ...
  },
];
```

### 3. For gallery images, open `src/data/gallery.js`:
```js
import myGalleryImg from '../assets/images/gallery/baking-process.jpg';

export const galleryImages = [
  {
    id: 7,
    type: 'image',
    src: myGalleryImg,
    alt: 'Our baking process',
    category: 'process',
    title: 'Baking Fresh Daily',
  },
  // ... existing entries
];
```

---

## How to Add Videos

### 1. Place your video in:
```
src/assets/videos/process/my-video.mp4
src/assets/videos/showcase/my-showcase.mp4
```

### 2. Import and register in `src/data/gallery.js`:
```js
import bakingVideo from '../assets/videos/process/my-video.mp4';
import posterImg from '../assets/images/hero/poster.jpg';

export const processVideos = [
  {
    id: 1,
    type: 'video',
    src: bakingVideo,
    poster: posterImg,
    title: 'How We Bake Our Cakes',
    description: 'Watch our master bakers at work.',
  },
];
```

---

## How to Remove Images

1. Delete the file from the `src/assets/images/` folder
2. Remove the corresponding entry from `src/data/products.js` or `src/data/gallery.js`
3. The image will no longer appear anywhere on the site

---

## Supported Formats

| Type | Formats |
|------|---------|
| Images | `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.svg` |
| Videos | `.mp4`, `.webm`, `.ogg` |

---

## Tips

- Use **WebP** format for best performance
- Recommended image sizes:
  - Hero: 1400×800px
  - Products: 600×400px
  - Gallery: 800×600px
  - Team: 400×400px
- For videos, use H.264 encoded `.mp4` for maximum browser compatibility
