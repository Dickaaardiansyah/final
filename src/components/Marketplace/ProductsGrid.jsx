// src/components/Marketplace/ProductsGrid.jsx
import React from 'react';
import { Star, MapPin, Package, Edit, ShoppingCart, Eye } from 'lucide-react';

function ProductsGrid({ products, onViewProduct, onEditProduct }) {
  if (products.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <Package size={64} />
        </div>
        <div className="empty-content">
          <h3 className="empty-title">Produk tidak ditemukan</h3>
          <p className="empty-description">
            Coba ubah filter atau kata kunci pencarian Anda
          </p>
        </div>
      </div>
    );
  }

  const formatPrice = (price) => {
    // Remove 'Rp' and format number
    return price;
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} size={12} fill="#ffc107" color="#ffc107" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star key={i} size={12} fill="#ffc107" color="#ffc107" style={{ opacity: 0.5 }} />
        );
      } else {
        stars.push(
          <Star key={i} size={12} color="#e0e0e0" />
        );
      }
    }
    return stars;
  };

  return (
    <div className="products-section">
      <h3 className="section-title">Produk Tersedia</h3>
      <div className="products-grid">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <div className="product-image-container">
              <img 
                src={product.image} 
                alt={product.title}
                className="product-image"
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=300&h=200&fit=crop";
                }}
              />
              {product.originalPrice && (
                <div className="discount-badge">
                  {Math.round((1 - parseInt(product.price.replace(/\D/g, '')) / parseInt(product.originalPrice.replace(/\D/g, ''))) * 100)}% OFF
                </div>
              )}
              <div className="product-actions">
                <button 
                  className="action-btn view-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewProduct(product.id);
                  }}
                  title="Lihat Detail"
                >
                  <Eye size={16} />
                </button>
                <button 
                  className="action-btn edit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditProduct(product.id);
                  }}
                  title="Edit Produk"
                >
                  <Edit size={16} />
                </button>
              </div>
            </div>

            <div className="product-info">
              <div className="product-header">
                <h4 className="product-title">{product.title}</h4>
                <div className="product-rating">
                  <div className="stars">
                    {renderStars(product.rating)}
                  </div>
                  <span className="rating-text">({product.reviews || 0})</span>
                </div>
              </div>

              <p className="product-description">{product.description}</p>

              <div className="product-meta">
                <div className="seller-info">
                  <span className="seller-name">{product.seller}</span>
                  <div className="location">
                    <MapPin size={12} />
                    <span>{product.location}</span>
                  </div>
                </div>
                <div className="stock-info">
                  <Package size={12} />
                  <span>Stok: {product.stock}</span>
                </div>
              </div>

              <div className="product-footer">
                <div className="price-section">
                  <div className="current-price">{formatPrice(product.price)}</div>
                  {product.originalPrice && (
                    <div className="original-price">{formatPrice(product.originalPrice)}</div>
                  )}
                </div>
                
                <button 
                  className="buy-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(`Membeli ${product.title}\nHarga: ${product.price}`);
                  }}
                  disabled={product.stock === 0}
                >
                  <ShoppingCart size={16} />
                  {product.stock > 0 ? 'Beli Sekarang' : 'Stok Habis'}
                </button>
              </div>
            </div>

            {product.stock <= 5 && product.stock > 0 && (
              <div className="low-stock-badge">
                Stok Terbatas!
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductsGrid;