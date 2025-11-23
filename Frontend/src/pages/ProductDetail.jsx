import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProduct, getProductImages, getProductFeedbacks } from '../services/api'
import { useCart } from '../context/CartContext'
import './ProductDetail.css'

const ProductDetail = () => {
  const { pid } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [productImages, setProductImages] = useState([])
  const [feedbacks, setFeedbacks] = useState([])
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        // For demo, using mock data if API fails
        try {
          const data = await getProduct(pid)
          setProduct(data)
          
          // Fetch product images
          try {
            const images = await getProductImages(pid)
            setProductImages(images)
          } catch (imgErr) {
            console.error('Failed to load images:', imgErr)
            setProductImages([])
          }
          
          // Fetch product feedbacks
          try {
            const reviews = await getProductFeedbacks(pid)
            setFeedbacks(reviews)
          } catch (reviewErr) {
            console.error('Failed to load reviews:', reviewErr)
            setFeedbacks([])
          }
        } catch (err) {
          // Fallback to mock data
          const mockProduct = {
            PID: pid,
            ProductName: 'Sample Product',
            Description: 'This is a sample product description. In a real application, this would be fetched from the API.',
            Price: 99.99
          }
          setProduct(mockProduct)
        }
      } catch (err) {
        setError('Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [pid])

  const handleAddToCart = () => {
    // Check stock before adding
    if (product.TotalStock !== undefined && product.TotalStock === 0) {
      alert('This product is out of stock')
      return
    }
    
    // Add product with primary image
    const productWithImage = {
      ...product,
      PrimaryImage: productImages.length > 0 ? productImages[0].ImageURL : null
    }
    
    for (let i = 0; i < quantity; i++) {
      addToCart(productWithImage)
    }
    navigate('/cart')
  }

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="product-detail-page">
        <div className="container">
          <div className="alert alert-error">
            {error || 'Product not found'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="product-detail-page">
      <div className="container">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back
        </button>

        <div className="product-detail">
          <div className="product-detail-image-section">
            <div className="product-detail-main-image">
              {productImages.length > 0 ? (
                <img
                  src={`http://127.0.0.1:8000/${productImages[selectedImageIndex]?.ImageURL}`}
                  alt={product.ProductName}
                  className="product-detail-image-img"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextElementSibling.style.display = 'flex'
                  }}
                />
              ) : null}
              <div className="product-placeholder-large" style={{ display: productImages.length > 0 ? 'none' : 'flex' }}>
                <span className="product-icon-large">📦</span>
              </div>
            </div>
            {productImages.length > 1 && (
              <div className="product-image-thumbnails">
                {productImages.map((img, index) => (
                  <button
                    key={img.ImageID}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`thumbnail-btn ${selectedImageIndex === index ? 'active' : ''}`}
                  >
                    <img
                      src={`http://127.0.0.1:8000/${img.ImageURL}`}
                      alt={`${product.ProductName} ${index + 1}`}
                      className="thumbnail-image"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="product-detail-info">
            <h1 className="product-detail-name">{product.ProductName}</h1>
            
            {product.AvgRating && (
              <div className="product-rating-section">
                <span className="rating-stars-large">
                  {'⭐'.repeat(Math.round(product.AvgRating))}
                </span>
                <span className="rating-text-large">
                  {product.AvgRating.toFixed(1)} ({product.ReviewCount || 0} reviews)
                </span>
              </div>
            )}
            
            <p className="product-detail-price">₹{product.Price?.toFixed(2)}</p>
            
            {product.TotalStock !== undefined && (
              <div className="product-stock-info">
                {product.TotalStock > 0 ? (
                  <span className="stock-badge available">✓ In Stock ({product.TotalStock} available)</span>
                ) : (
                  <span className="stock-badge unavailable">✗ Out of Stock</span>
                )}
              </div>
            )}
            
            <p className="product-detail-description">{product.Description}</p>
            
            {product.Sellers && product.Sellers.length > 0 && (
              <div className="sellers-section">
                <h3>Sellers ({product.Sellers.length})</h3>
                <div className="sellers-list">
                  {product.Sellers.map((seller, idx) => (
                    <div key={idx} className="seller-item">
                      <span>{seller.FirstName} {seller.LastName}</span>
                      <span className="seller-stock">Stock: {seller.Stock}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="quantity-selector">
              <label htmlFor="quantity">Quantity:</label>
              <div className="quantity-controls">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="quantity-btn"
                >
                  −
                </button>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="quantity-input"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="quantity-btn"
                >
                  +
                </button>
              </div>
            </div>

            <div className="product-actions">
              <button 
                onClick={handleAddToCart} 
                className="btn btn-primary btn-large"
                disabled={product.TotalStock === 0}
              >
                {product.TotalStock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button 
                className="btn btn-outline btn-large"
                disabled={product.TotalStock === 0}
                onClick={() => {
                  if (product.TotalStock > 0) {
                    handleAddToCart()
                    navigate('/checkout')
                  }
                }}
              >
                Buy Now
              </button>
            </div>

            <div className="product-details-section">
              <h3>Product Details</h3>
              <ul className="details-list">
                <li><strong>Product ID:</strong> {product.PID}</li>
                <li><strong>Price:</strong> ₹{product.Price?.toFixed(2)}</li>
                {product.TotalStock !== undefined && (
                  <li><strong>Available Stock:</strong> {product.TotalStock}</li>
                )}
                {product.SellerCount > 0 && (
                  <li><strong>Number of Sellers:</strong> {product.SellerCount}</li>
                )}
              </ul>
            </div>
          </div>
        </div>
        
        {feedbacks.length > 0 && (
          <div className="reviews-section">
            <h2>Customer Reviews ({feedbacks.length})</h2>
            <div className="reviews-list">
              {feedbacks.map((review) => (
                <div key={review.FeedBackID} className="review-item">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <strong>{review.FirstName} {review.LastName}</strong>
                      <span className="review-date">{new Date(review.Date).toLocaleDateString()}</span>
                    </div>
                    <div className="review-rating">
                      {'⭐'.repeat(review.Rating)}
                    </div>
                  </div>
                  <p className="review-text">{review.Review}</p>
                  {review.Upvotes > 0 && (
                    <div className="review-upvotes">
                      👍 {review.Upvotes} helpful
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductDetail

