// ============================================================
// PRODUCT DATA — all products have rating, category, price
// ============================================================

export const bestSellers = [
  {
    id: 1,
    name: 'Exotic Pineapple Cake',
    category: 'Cakes',
    price: 49.00,
    rating: 4.8,
    reviews: 124,
    tag: 'Best Seller',
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>',
    description: 'A tropical delight with layers of fresh pineapple cream and light sponge.',
  },
  {
    id: 2,
    name: 'Triple Cocoa Brownie',
    category: 'Brownies',
    price: 28.00,
    rating: 4.9,
    reviews: 287,
    tag: 'Fan Favorite',
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>',
    description: 'Three layers of intense chocolate in a fudgy, decadent brownie.',
  },
  {
    id: 3,
    name: 'Wild Blueberry Chia',
    category: 'Tarts',
    price: 44.00,
    rating: 4.7,
    reviews: 98,
    tag: 'New',
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>',
    description: 'Fresh wild blueberries atop a creamy chia pudding base.',
  },
];

export const signatureCollection = [
  {
    id: 10,
    name: 'Red Velvet Dream',
    category: 'Cakes',
    subtitle: 'The Mango Specials',
    price: 48.00,
    rating: 4.9,
    reviews: 213,
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>',
    description: 'A stunning red velvet cake with velvety cream cheese frosting and hand-crafted detailing.',
    badge: 'Signature',
  },
  {
    id: 11,
    name: 'Classic Pineapple Cream',
    category: 'Cakes',
    subtitle: 'Artisan Collection',
    price: 35.00,
    rating: 4.6,
    reviews: 89,
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>',
    description: 'Light vanilla sponge layered with house-made pineapple compote and fresh cream.',
    badge: 'Classic',
  },
];

export const classicCakes = [
  {
    id: 20,
    name: 'Belgian Chocolate',
    category: 'Cakes',
    price: 42.00,
    rating: 4.8,
    reviews: 176,
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>',
    label: 'Artisanal Premium',
    description: 'Deep Belgian chocolate layered cake with ganache frosting.',
  },
  {
    id: 21,
    name: 'Vanilla Ombre',
    category: 'Cakes',
    price: 38.00,
    rating: 4.5,
    reviews: 112,
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>',
    label: 'Artisanal Premium',
    description: 'Delicate ombre vanilla layers with Swiss meringue buttercream.',
  },
  {
    id: 22,
    name: 'Fluffy Chiffon',
    category: 'Cakes',
    price: 34.00,
    rating: 4.4,
    reviews: 67,
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>',
    label: 'Artisanal Premium',
    description: 'Light-as-air chiffon sponge with whipped cream and seasonal fruit.',
  },
  {
    id: 23,
    name: 'Hazelnut Divine',
    category: 'Cakes',
    price: 45.00,
    rating: 4.7,
    reviews: 143,
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>',
    label: 'Artisanal Premium',
    description: 'Rich hazelnut cake with praline cream and chocolate shards.',
  },
];

export const celebrationCakes = [
  {
    id: 30,
    name: 'Floral Birthday Dream',
    category: 'Celebration',
    subtitle: 'Best for Her',
    price: 68.00,
    rating: 4.9,
    reviews: 56,
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>',
    description: 'A feminine and romantic masterpiece with fresh roses and custom gold detailing.',
  },
  {
    id: 31,
    name: 'Royal Celebration Tier',
    category: 'Celebration',
    subtitle: 'Best for Events',
    price: 120.00,
    rating: 5.0,
    reviews: 34,
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>',
    description: 'Impressive two-tier gold theme design with elegant sphere accents, perfect for grand events.',
  },
];

export const specialities = [
  {
    id: 1,
    name: 'Brownie Brownies',
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>',
    description: 'Dense, fudgy brownies with a crackly top and gooey center.',
  },
  {
    id: 2,
    name: 'Signature Cakes',
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>',
    description: 'Each signature cake is perfected to become a masterpiece of your emotions.',
  },
  {
    id: 3,
    name: 'Petite Panties',
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>',
    description: 'Miniature pastries with a delicate balance of texture and the Bakester signature.',
  },
];

// All products merged — used for search & filter
export const allProducts = [
  ...bestSellers,
  ...signatureCollection,
  ...classicCakes,
  ...celebrationCakes,
];

