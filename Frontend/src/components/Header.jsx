import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import './Header.css'

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const { getCartItemCount } = useCart()
  const navigate = useNavigate()
  const cartItemCount = getCartItemCount()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <span className="logo-icon">🛍️</span>
            <span className="logo-text">CampusBazaar</span>
          </Link>

          <nav className="nav">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/products" className="nav-link">Products</Link>
            {isAuthenticated && (
              <>
                <Link to="/my-listings" className="nav-link">My Listings</Link>
                <Link to="/orders" className="nav-link">My Orders</Link>
              </>
            )}
          </nav>

          <div className="header-actions">
            <Link to="/cart" className="cart-link">
              <span className="cart-icon">🛒</span>
              {cartItemCount > 0 && (
                <span className="cart-badge">{cartItemCount}</span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="user-menu">
                <span className="user-name">
                  {user?.FirstName} {user?.LastName}
                </span>
                <button onClick={handleLogout} className="btn btn-outline">
                  Logout
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-outline">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

