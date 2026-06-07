import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiShoppingCart } from 'react-icons/fi';
import { HiStar, HiHeart, HiOutlineHeart } from 'react-icons/hi2';
import { useCart } from '../../context/CartContext';

export default function ProductCard({ product, size = 'md' }) {
  const { addItem } = useCart();
  const [liked,     setLiked]     = useState(false);
  const [added,     setAdded]     = useState(false);

  const imageSrc   = product.image_url || product.image || '';
  const outOfStock = product.in_stock === false;
  const badge      = product.badge?.trim() || null;
  const hasRating  = product.rating && product.rating > 0;
  const isLarge    = size === 'lg';

  const handleAdd = (e) => {
    e.preventDefault();
    if (outOfStock) return;
    addItem({ ...product, image: imageSrc });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked((v) => !v);
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`product-card group relative flex flex-col ${outOfStock ? 'opacity-80' : ''}`}
    >
      {/* ── Image ── */}
      <div className={`relative overflow-hidden flex-shrink-0 ${isLarge ? 'h-60' : 'h-44 sm:h-52'} bg-cream-100`}>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          /* Attractive placeholder when no image exists */
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-cream-100 to-rose-pale/30">
            <span className="text-5xl mb-1">🎂</span>
            <span className="text-[11px] text-chocolate/40 font-medium">No image</span>
          </div>
        )}

        {/* Hover gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Out of Stock overlay */}
        {outOfStock && (
          <div className="absolute inset-0 bg-white/55 backdrop-blur-[2px] flex items-center justify-center">
            <span className="px-3 py-1.5 bg-gray-800/80 text-white text-[11px] font-bold rounded-full tracking-wide">
              Out of Stock
            </span>
          </div>
        )}

        {/* Badge */}
        {badge && (
          <span className="absolute top-2.5 left-2.5 bg-rose-bakery text-white text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide shadow-sm">
            {badge}
          </span>
        )}

        {/* Wishlist button */}
        <button
          onClick={handleLike}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-200 active:scale-90 ${
            liked ? 'bg-rose-bakery' : 'bg-white/90 backdrop-blur-sm hover:bg-rose-pale'
          }`}
          aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {liked
            ? <HiHeart size={16} className="text-white" />
            : <HiOutlineHeart size={16} className="text-rose-bakery" />
          }
        </button>
      </div>

      {/* ── Content ── */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        {/* Category label */}
        {product.category && (
          <p className="text-[10px] sm:text-[11px] text-rose-bakery font-bold uppercase tracking-wider mb-1">
            {product.category}
          </p>
        )}

        {/* Name */}
        <h3 className="font-serif text-sm sm:text-base font-semibold text-chocolate mb-1 line-clamp-2 leading-snug">
          {product.name}
        </h3>

        {/* Description — only if non-empty */}
        {product.description && (
          <p className="text-[11px] sm:text-xs text-chocolate/55 mb-2 line-clamp-2 leading-relaxed flex-1">
            {product.description}
          </p>
        )}

        {/* Rating */}
        {hasRating && (
          <div className="flex items-center gap-0.5 mb-2">
            {[1,2,3,4,5].map((s) => (
              <HiStar
                key={s}
                size={11}
                className={s <= Math.round(product.rating) ? 'text-gold' : 'text-cream-300'}
              />
            ))}
            <span className="text-[10px] sm:text-[11px] text-chocolate/50 ml-1">{product.rating}</span>
          </div>
        )}

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <div>
            <span className="font-serif text-base sm:text-lg font-bold text-chocolate">
              ₹{product.price?.toFixed(0)}
            </span>
            {product.quantity > 0 && !outOfStock && (
              <p className="text-[9px] sm:text-[10px] text-chocolate/40 mt-0.5">
                {product.quantity} left
              </p>
            )}
          </div>

          <button
            onClick={handleAdd}
            disabled={outOfStock}
            className={`flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-semibold px-3 sm:px-4 py-2 rounded-full transition-all duration-200 active:scale-95 flex-shrink-0 ${
              outOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                : added
                ? 'bg-emerald-500 text-white'
                : 'bg-rose-bakery text-white hover:bg-rose-dark'
            }`}
            aria-label={outOfStock ? `${product.name} is out of stock` : `Add ${product.name} to cart`}
          >
            {!added && <FiShoppingCart size={12} />}
            <span>{outOfStock ? 'Unavailable' : added ? '✓ Added!' : 'Add'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
