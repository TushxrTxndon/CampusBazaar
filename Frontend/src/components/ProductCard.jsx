import React from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import './ProductCard.css'

const ProductCard = ({ product }) => {
  const { addToCart } = useCart()

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Check stock before adding
    if (product.TotalStock !== undefined && product.TotalStock === 0) {
      alert('This product is out of stock')
      return
    }
    
    addToCart(product)
  }

  return (
    <Link to={`/products/${product.PID}`} className="product-card card">
      <div className="product-image">
        {product.PrimaryImage ? (
          <img
            src={`http://127.0.0.1:8000/${product.PrimaryImage}`}
            alt={product.ProductName}
            className="product-image-img"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextElementSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <div className="product-placeholder" style={{ display: product.PrimaryImage ? 'none' : 'flex' }}>
          <span className="product-icon">📦</span>
        </div>
        <button
          onClick={handleAddToCart}
          className="add-to-cart-btn"
          title="Add to cart"
        >
          ➕
        </button>
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.ProductName}</h3>
        <p className="product-description">
          {product.Description?.substring(0, 80)}
          {product.Description?.length > 80 ? '...' : ''}
        </p>
        
        {product.AvgRating && (
          <div className="product-rating">
            <span className="rating-stars">
              {'⭐'.repeat(Math.round(product.AvgRating))}
            </span>
            <span className="rating-text">
              {product.AvgRating.toFixed(1)} ({product.ReviewCount || 0} reviews)
            </span>
          </div>
        )}
        
        {product.TotalStock !== undefined && (
          <div className="product-stock">
            {product.TotalStock > 0 ? (
              <span className="stock-available">In Stock ({product.TotalStock} available)</span>
            ) : (
              <span className="stock-unavailable">Out of Stock</span>
            )}
          </div>
        )}
        
        <div className="product-footer">
          <span className="product-price">₹{product.Price?.toFixed(2)}</span>
          <button
            onClick={handleAddToCart}
            className="btn btn-primary btn-sm"
            disabled={product.TotalStock === 0}
          >
            {product.TotalStock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </Link>
  )
}

export default ProductCard

