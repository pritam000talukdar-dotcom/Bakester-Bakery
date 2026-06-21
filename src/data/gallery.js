// ============================================================
// GALLERY / MEDIA DATA
// 
// HOW TO ADD YOUR OWN IMAGES & VIDEOS:
// 1. Place images in: src/assets/images/gallery/
// 2. Place process videos in: src/assets/videos/process/
// 3. Place showcase videos in: src/assets/videos/showcase/
// 4. Add entries below pointing to your files.
//
// Example for local image:
//   import myImg from '../assets/images/gallery/my-cake.jpg'
//   then use { id: X, type: 'image', src: myImg, ... }
//
// For now, placeholder Unsplash images are used.
// ============================================================

export const galleryImages = [
  {
    id: 1,
    type: 'image',
    src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>',
    alt: 'Artisan cake decoration process',
    category: 'process',
    title: 'The Art of Decoration',
  },
  {
    id: 2,
    type: 'image',
    src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>',
    alt: 'Fresh baked brownies',
    category: 'products',
    title: 'Fresh From the Oven',
  },
  {
    id: 3,
    type: 'image',
    src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>',
    alt: 'Wedding cake creation',
    category: 'events',
    title: 'Wedding Masterpiece',
  },
  {
    id: 4,
    type: 'image',
    src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>',
    alt: 'Cake making process',
    category: 'process',
    title: 'Baked with Love',
  },
  {
    id: 5,
    type: 'image',
    src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>',
    alt: 'Celebration cake',
    category: 'events',
    title: 'Celebration Moments',
  },
  {
    id: 6,
    type: 'image',
    src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>',
    alt: 'Pastry selection',
    category: 'products',
    title: 'Pastry Heaven',
  },
];

// ============================================================
// VIDEO DATA
// Add your cake-making process or showcase videos here.
// Place video files in src/assets/videos/process/ or showcase/
// ============================================================
export const processVideos = [
  // Example:
  // {
  //   id: 1,
  //   type: 'video',
  //   src: '/src/assets/videos/process/cake-making.mp4',
  //   poster: '/src/assets/images/hero/hero-bg.jpg',
  //   title: 'How We Make Our Signature Cakes',
  //   description: 'Watch our master bakers craft our famous signature cakes from scratch.',
  // }
];

