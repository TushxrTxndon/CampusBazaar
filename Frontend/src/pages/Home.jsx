import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProductCard from '../components/ProductCard'
import { getAllProducts } from '../services/api'
import './Home.css'

const Home = () => {
  const { isAuthenticated } = useAuth()
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const products = await getAllProducts({ sort_by: 'newest' })
        setFeaturedProducts(products.slice(0, 6)) // Show 6 newest products
      } catch (err) {
        console.error('Failed to load featured products:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchFeatured()
  }, [])

  return (
    <div className="home">
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Welcome to <span className="gradient-text">CampusBazaar</span>
            </h1>
            <p className="hero-subtitle">
              Your campus marketplace for buying and selling everything you need.
              From textbooks to electronics, find it all here!
            </p>
            <div className="hero-actions">
              <Link to="/products" className="btn btn-primary btn-large">
                Browse Products
              </Link>
              {!isAuthenticated && (
                <Link to="/register" className="btn btn-outline btn-large">
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2 className="section-title">Why Choose CampusBazaar?</h2>
          <div className="features-grid">
            <div className="feature-card card">
              <div className="feature-icon">🛒</div>
              <h3 className="feature-title">Easy Shopping</h3>
              <p className="feature-description">
                Browse and purchase products with ease. Simple, intuitive interface
                designed for students.
              </p>
            </div>

            <div className="feature-card card">
              <div className="feature-icon">💰</div>
              <h3 className="feature-title">Great Prices</h3>
              <p className="feature-description">
                Find amazing deals on textbooks, electronics, and more from fellow
                students.
              </p>
            </div>

            <div className="feature-card card">
              <div className="feature-icon">🚀</div>
              <h3 className="feature-title">Fast Delivery</h3>
              <p className="feature-description">
                Quick and convenient transactions. Meet up on campus or arrange
                delivery.
              </p>
            </div>

            <div className="feature-card card">
              <div className="feature-icon">⭐</div>
              <h3 className="feature-title">Trusted Community</h3>
              <p className="feature-description">
                Buy and sell with confidence in our verified campus community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {featuredProducts.length > 0 && (
        <section className="featured-products">
          <div className="container">
            <h2 className="section-title">Featured Products</h2>
            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : (
              <div className="products-grid">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.PID} product={product} />
                ))}
              </div>
            )}
            <div className="section-footer">
              <Link to="/products" className="btn btn-outline">
                View All Products
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Start Shopping?</h2>
            <p className="cta-subtitle">
              Join thousands of students buying and selling on CampusBazaar
            </p>
            <Link to="/products" className="btn btn-primary btn-large">
              Explore Products
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home

