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
    src: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop',
    alt: 'Artisan cake decoration process',
    category: 'process',
    title: 'The Art of Decoration',
  },
  {
    id: 2,
    type: 'image',
    src: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&h=400&fit=crop',
    alt: 'Fresh baked brownies',
    category: 'products',
    title: 'Fresh From the Oven',
  },
  {
    id: 3,
    type: 'image',
    src: 'https://images.unsplash.com/photo-1587241321921-91a834d6d191?w=600&h=400&fit=crop',
    alt: 'Wedding cake creation',
    category: 'events',
    title: 'Wedding Masterpiece',
  },
  {
    id: 4,
    type: 'image',
    src: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&h=400&fit=crop',
    alt: 'Cake making process',
    category: 'process',
    title: 'Baked with Love',
  },
  {
    id: 5,
    type: 'image',
    src: 'https://images.unsplash.com/photo-1607478900766-efe13248b125?w=600&h=400&fit=crop',
    alt: 'Celebration cake',
    category: 'events',
    title: 'Celebration Moments',
  },
  {
    id: 6,
    type: 'image',
    src: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&h=400&fit=crop',
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
