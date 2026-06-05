import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShoppingCart, FiStar } from 'react-icons/fi';
import { HiHeart, HiOutlineHeart } from 'react-icons/hi2';
import { useCart } from '../../context/CartContext';

export default function ProductCard({ product, size = 'md' }) {
  const { addItem } = useCart();
  const [liked, setLiked] = useState(false);
  const [added, setAdded] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);

  // Support both DB (image_url) and legacy (image) field names
  const imageSrc = product.image_url || product.image || '';
  const outOfStock = product.in_stock === false;

  const handleAdd = (e) => {
    e.preventDefault();
    if (outOfStock) return;
    addItem({ ...product, image: imageSrc });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked((prev) => !prev);
    if (!liked) {
      setHeartBurst(true);
      setTimeout(() => setHeartBurst(false), 600);
    }
  };

  const isLarge = size === 'lg';

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      className={`product-card group relative ${outOfStock ? 'opacity-75' : ''}`}
    >
      {/* ── Image area ── */}
      <div className={`relative overflow-hidden ${isLarge ? 'h-64' : 'h-52'} bg-cream-100`}>
        {imageSrc ? (
          <motion.img
            src={imageSrc}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl bg-cream-100">
            🎂
          </div>
        )}
        {/* Dark gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Out of Stock overlay */}
        {outOfStock && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
            <span className="px-3 py-1.5 bg-gray-800/80 text-white text-xs font-bold rounded-full tracking-wide">
              Out of Stock
            </span>
          </div>
        )}

        {/* ── Like / Wishlist button — always visible ── */}
        <div className="absolute top-3 right-3">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={handleLike}
            className={`relative w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${
              liked
                ? 'bg-rose-bakery'
                : 'bg-white/90 backdrop-blur-sm hover:bg-rose-pale'
            }`}
            aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
            id={`wishlist-${product.id}`}
          >
            <AnimatePresence mode="wait">
              {liked ? (
                <motion.span
                  key="filled"
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  <HiHeart size={17} className="text-white" />
                </motion.span>
              ) : (
                <motion.span
                  key="outline"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <HiOutlineHeart size={17} className="text-rose-bakery" />
                </motion.span>
              )}
            </AnimatePresence>

            {/* Heart burst particles */}
            <AnimatePresence>
              {heartBurst && (
                <>
                  {[...Array(6)].map((_, i) => (
                    <motion.span
                      key={i}
                      className="absolute w-1.5 h-1.5 rounded-full bg-rose-bakery pointer-events-none"
                      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                      animate={{
                        x: Math.cos((i / 6) * Math.PI * 2) * 20,
                        y: Math.sin((i / 6) * Math.PI * 2) * 20,
                        opacity: 0,
                        scale: 0,
                      }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  ))}
                </>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Tag/Badge — top left */}
        {(product.tag || product.badge) && !outOfStock && (
          <span className={`absolute top-3 left-3 badge text-[10px] ${
            product.tag ? 'bg-rose-bakery text-white' : 'bg-chocolate text-white'
          }`}>
            {product.tag || product.badge}
          </span>
        )}
      </div>

      {/* ── Content ── */}
      <div className="p-4">
        {product.category && (
          <p className="text-[11px] text-rose-bakery font-semibold uppercase tracking-wider mb-1">
            {product.category}
          </p>
        )}
        <h3 className="font-serif text-base font-semibold text-chocolate mb-1 line-clamp-1">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-chocolate/60 mb-3 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}

        {/* Rating row */}
        {product.rating && (
          <div className="flex items-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <FiStar
                key={i}
                size={11}
                className={
                  i < Math.floor(product.rating)
                    ? 'fill-gold text-gold'
                    : 'text-cream-300'
                }
              />
            ))}
            <span className="text-[11px] text-chocolate/50 ml-0.5">
              {product.rating}
              {product.reviews ? ` (${product.reviews})` : ''}
            </span>
          </div>
        )}

        {/* Price + Add to Cart */}
        <div className="flex items-center justify-between mt-2">
          <span className="font-serif text-lg font-bold text-chocolate">
            ₹{product.price?.toFixed(0)}
          </span>
          <motion.button
            whileHover={outOfStock ? {} : { scale: 1.05 }}
            whileTap={outOfStock ? {} : { scale: 0.95 }}
            onClick={handleAdd}
            disabled={outOfStock}
            className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full transition-all duration-300 ${
              outOfStock
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : added
                ? 'bg-green-500 text-white'
                : 'bg-rose-bakery text-white hover:bg-rose-dark'
            }`}
            aria-label={outOfStock ? `${product.name} is out of stock` : `Add ${product.name} to cart`}
          >
            <FiShoppingCart size={13} />
            {outOfStock ? 'Out of Stock' : added ? 'Added! ✓' : 'Add to Cart'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
