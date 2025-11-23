import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { createOrder, addOrderDetail, initiatePayment, verifyPayment, resendOTP, checkStockMultiple } from '../services/api'
import './Checkout.css'

const Checkout = () => {
  const { cart, getCartTotal, clearCart } = useCart()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  
  const [step, setStep] = useState(1) // 1: Review, 2: Payment, 3: OTP, 4: Success
  const [orderId, setOrderId] = useState(null)
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('email-otp')
  const [stockError, setStockError] = useState('')

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return
    }
    
    // Check authentication and cart
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
      return
    }
    if (!cart || cart.length === 0) {
      navigate('/cart', { replace: true })
      return
    }
  }, [isAuthenticated, cart, navigate, authLoading])

  useEffect(() => {
    let timer
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  const handleCreateOrder = async () => {
    try {
      setLoading(true)
      setStockError('')
      
      // First, check stock availability for all items
      const stockCheckItems = cart.map(item => ({
        PID: item.PID,
        Quantity: item.quantity
      }))

      const stockCheck = await checkStockMultiple(stockCheckItems)
      
      if (!stockCheck.all_sufficient) {
        const insufficientItems = stockCheck.insufficient_items
        const itemNames = insufficientItems.map(item => {
          const cartItem = cart.find(c => c.PID === item.PID)
          return cartItem ? cartItem.ProductName : item.PID
        }).join(', ')
        
        setStockError(
          `Insufficient stock for: ${itemNames}. ` +
          `Please update your cart and try again.`
        )
        setLoading(false)
        return
      }

      // Create order
      const orderData = {
        OrderDate: new Date().toISOString().split('T')[0],
        EmailID: user.EmailID
      }

      const orderResponse = await createOrder(orderData)
      const newOrderId = orderResponse.OrderID
      setOrderId(newOrderId)

      // Add order details
      for (const item of cart) {
        await addOrderDetail({
          OrderID: newOrderId,
          PID: item.PID,
          Order_Qty: item.quantity || 1
        })
      }

      // Initiate payment
      const total = getCartTotal() || 0
      await initiatePayment({
        EmailID: user.EmailID,
        Amount: total,
        OrderID: newOrderId
      })

      setOtpSent(true)
      setCountdown(300) // 5 minutes
      setStep(3) // Go to OTP step
    } catch (error) {
      console.error('Order creation error:', error)
      const errorMessage = error.response?.data?.detail || 'Failed to create order. Please try again.'
      
      // Check if it's a stock-related error
      if (errorMessage.includes('Insufficient stock') || errorMessage.includes('45000')) {
        setStockError('One or more products have insufficient stock. Please update your cart and try again.')
      } else {
        setStockError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setOtpError('')

    if (otp.length !== 6) {
      setOtpError('OTP must be 6 digits')
      return
    }

    try {
      setLoading(true)
      
      await verifyPayment({
        EmailID: user.EmailID,
        OTP: otp,
        OrderID: orderId
      })

      clearCart()
      setStep(4) // Success step
    } catch (error) {
      setOtpError(error.response?.data?.detail || 'Invalid OTP. Please try again.')
      setOtp('')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    try {
      setLoading(true)
      await resendOTP(user.EmailID, orderId)
      setOtpSent(true)
      setCountdown(300)
      setOtpError('')
      alert('OTP has been resent to your email')
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to resend OTP')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Show loading while auth is loading or if data not ready
  if (authLoading || !isAuthenticated || !cart || cart.length === 0 || !user) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
            <p style={{ marginTop: '16px', color: 'var(--gray)' }}>Loading checkout...</p>
          </div>
        </div>
      </div>
    )
  }

  if (step === 1) {
    return (
      <div className="checkout-page">
        <div className="container">
          <h1 className="page-title">Checkout</h1>

          <div className="checkout-content">
            <div className="checkout-main">
              <div className="checkout-section card">
                <h2>Order Review</h2>
                <div className="order-items">
                  {cart && cart.length > 0 ? (
                    cart.map((item) => (
                      <div key={item.PID} className="checkout-item">
                        <div className="checkout-item-info">
                          <h3>{item.ProductName || 'Product'}</h3>
                          <p className="item-description">{item.Description || ''}</p>
                        </div>
                        <div className="checkout-item-details">
                          <span className="item-quantity">Qty: {item.quantity || 1}</span>
                          <span className="item-price">₹{((item.Price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>No items in cart</p>
                  )}
                </div>
              </div>

              <div className="checkout-section card">
                <h2>Payment Method</h2>
                <div className="payment-methods">
                  <label className="payment-method-option">
                    <input
                      type="radio"
                      name="payment"
                      value="email-otp"
                      checked={paymentMethod === 'email-otp'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="payment-method-info">
                      <span className="payment-method-name">Email OTP Payment</span>
                      <span className="payment-method-desc">Receive OTP on your registered email</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="checkout-sidebar">
              <div className="checkout-summary card">
                <h2>Order Summary</h2>
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>₹{(getCartTotal() || 0).toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping:</span>
                  <span>Free</span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-row summary-total">
                  <span>Total:</span>
                  <span>₹{(getCartTotal() || 0).toFixed(2)}</span>
                </div>

                {stockError && (
                  <div className="alert alert-error" style={{ marginTop: '16px', marginBottom: '0' }}>
                    {stockError}
                  </div>
                )}

                <button
                  onClick={handleCreateOrder}
                  className="btn btn-primary btn-large"
                  disabled={loading}
                  style={{ width: '100%', marginTop: '24px' }}
                >
                  {loading ? 'Processing...' : 'Proceed to Payment'}
                </button>

                <button
                  onClick={() => navigate('/cart')}
                  className="btn btn-outline"
                  style={{ width: '100%', marginTop: '12px' }}
                >
                  Back to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 3 && user) {
    return (
      <div className="checkout-page">
        <div className="container">
          <h1 className="page-title">Payment Verification</h1>

          <div className="otp-verification card">
            <div className="otp-header">
              <div className="otp-icon">📧</div>
              <h2>Enter OTP</h2>
              <p>We've sent a 6-digit OTP to your registered email:</p>
              <p className="user-email">{user?.EmailID || 'your email'}</p>
            </div>

            {countdown > 0 && (
              <div className="otp-timer">
                <span>OTP expires in: {formatTime(countdown)}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOTP} className="otp-form">
              <div className="otp-input-group">
                <label htmlFor="otp">Enter OTP</label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setOtp(value)
                    setOtpError('')
                  }}
                  placeholder="000000"
                  maxLength="6"
                  className={`otp-input ${otpError ? 'error' : ''}`}
                  autoFocus
                />
                {otpError && <p className="error-message">{otpError}</p>}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-large"
                disabled={loading || otp.length !== 6}
                style={{ width: '100%', marginTop: '20px' }}
              >
                {loading ? 'Verifying...' : 'Verify & Complete Payment'}
              </button>

              <div className="otp-actions">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className="btn btn-outline"
                  disabled={loading || countdown > 240}
                  style={{ width: '100%', marginTop: '12px' }}
                >
                  {loading ? 'Sending...' : 'Resend OTP'}
                </button>
                <p className="resend-hint">
                  {countdown > 240 ? 'You can resend OTP after 1 minute' : 'Didn\'t receive OTP? Check your spam folder or resend.'}
                </p>
              </div>
            </form>

            <div className="checkout-note">
              <p>💡 <strong>Note:</strong> This is a demo payment system. In production, this would integrate with actual payment gateways.</p>
              <p>Check your console/terminal for the OTP email content (for demo purposes).</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 4 && user) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="checkout-success card">
            <div className="success-icon">✅</div>
            <h1>Payment Successful!</h1>
            <p className="success-message">
              Your order has been confirmed. A confirmation email has been sent to <strong>{user?.EmailID || 'your email'}</strong>
            </p>
            <div className="success-details">
              <p><strong>Order ID:</strong> #{orderId}</p>
              <p><strong>Total Amount:</strong> ₹{getCartTotal().toFixed(2)}</p>
            </div>
            <div className="success-actions">
              <button
                onClick={() => navigate('/orders')}
                className="btn btn-primary btn-large"
              >
                View My Orders
              </button>
              <button
                onClick={() => navigate('/products')}
                className="btn btn-outline btn-large"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Fallback - should not reach here normally
  return (
    <div className="checkout-page">
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p style={{ marginTop: '16px', color: 'var(--gray)' }}>Preparing checkout...</p>
        </div>
      </div>
    </div>
  )
}

export default Checkout

