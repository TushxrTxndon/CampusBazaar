import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getUserOrders } from '../services/api'
import './Orders.css'

const Orders = () => {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }
    fetchOrders()
  }, [isAuthenticated, user])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const data = await getUserOrders(user.EmailID)
      setOrders(data)
    } catch (err) {
      setError('Failed to load orders')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="orders-page">
        <div className="container">
          <div className="auth-required">
            <h2>Please login to view your orders</h2>
            <Link to="/login" className="btn btn-primary">
              Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="orders-page">
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="orders-page">
      <div className="container">
        <h1 className="page-title">My Orders</h1>

        {error && (
          <div className="alert alert-error">{error}</div>
        )}

        {orders.length === 0 ? (
          <div className="no-orders">
            <div className="no-orders-icon">📦</div>
            <h2>No orders yet</h2>
            <p>Start shopping to see your orders here!</p>
            <Link to="/products" className="btn btn-primary">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.OrderID} className="order-card card">
                <div className="order-header">
                  <div>
                    <h3 className="order-id">Order #{order.OrderID}</h3>
                    <p className="order-date">
                      {new Date(order.OrderDate).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <span className="order-status">Completed</span>
                </div>
                <div className="order-items">
                  <h4 className="order-items-title">Order Items:</h4>
                  {order.Items && order.Items.length > 0 ? (
                    <ul className="order-items-list">
                      {order.Items.map((item, index) => (
                        <li key={index} className="order-item">
                          <div className="order-item-info">
                            <span className="order-item-name">{item.ProductName}</span>
                            <span className="order-item-qty">Qty: {item.Order_Qty}</span>
                          </div>
                          <span className="order-item-price">
                            ₹{(item.Price * item.Order_Qty).toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="no-items">No items in this order</p>
                  )}
                </div>
                <div className="order-footer">
                  <span className="order-total">Total: ₹{order.Total?.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Orders

