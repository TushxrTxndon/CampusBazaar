import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { createOrder, addOrderDetail } from '../services/api'
import './Cart.css'

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart()
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (cart.length === 0) {
      return
    }

    try {
      // Create order
      const orderData = {
        OrderDate: new Date().toISOString().split('T')[0],
        EmailID: user.EmailID
      }

      const orderResponse = await createOrder(orderData)
      const orderId = orderResponse.OrderID

      // Add order details
      for (const item of cart) {
        await addOrderDetail({
          OrderID: orderId,
          PID: item.PID,
          Order_Qty: item.quantity
        })
      }

      clearCart()
      navigate('/orders')
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Checkout failed. Please try again.')
    }
  }

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <h1 className="page-title">Shopping Cart</h1>
          <div className="empty-cart">
            <div className="empty-cart-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Add some products to get started!</p>
            <Link to="/products" className="btn btn-primary">
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1 className="page-title">Shopping Cart</h1>

        <div className="cart-content">
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.PID} className="cart-item card">
                <div className="cart-item-image">
                  {item.PrimaryImage ? (
                    <img
                      src={`http://127.0.0.1:8000/${item.PrimaryImage}`}
                      alt={item.ProductName}
                      className="cart-item-img"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextElementSibling.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  <div className="product-placeholder-small" style={{ display: item.PrimaryImage ? 'none' : 'flex' }}>
                    <span className="product-icon-small">📦</span>
                  </div>
                </div>

                <div className="cart-item-info">
                  <h3 className="cart-item-name">{item.ProductName}</h3>
                  <p className="cart-item-description">{item.Description}</p>
                  <p className="cart-item-price">₹{item.Price.toFixed(2)}</p>
                </div>

                <div className="cart-item-quantity">
                  <label>Quantity:</label>
                  <div className="quantity-controls">
                    <button
                      onClick={() => updateQuantity(item.PID, item.quantity - 1)}
                      className="quantity-btn"
                    >
                      −
                    </button>
                    <span className="quantity-value">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.PID, item.quantity + 1)}
                      className="quantity-btn"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="cart-item-total">
                  <p className="item-total-price">
                    ₹{(item.Price * item.quantity).toFixed(2)}
                  </p>
                  <button
                    onClick={() => removeFromCart(item.PID)}
                    className="remove-btn"
                    title="Remove item"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary card">
            <h2 className="summary-title">Order Summary</h2>
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>₹{getCartTotal().toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping:</span>
              <span>Free</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row summary-total">
              <span>Total:</span>
              <span>₹{getCartTotal().toFixed(2)}</span>
            </div>

            <button
              onClick={() => {
                if (isAuthenticated) {
                  navigate('/checkout')
                } else {
                  navigate('/login')
                }
              }}
              className="btn btn-primary btn-large"
              style={{ width: '100%', marginTop: '24px' }}
            >
              {isAuthenticated ? 'Proceed to Checkout' : 'Login to Checkout'}
            </button>

            <Link to="/products" className="continue-shopping">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart

