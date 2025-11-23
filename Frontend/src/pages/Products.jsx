import React, { useState, useEffect } from 'react'
import ProductCard from '../components/ProductCard'
import { getAllProducts, getAllCategories } from '../services/api'
import './Products.css'

const Products = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [productsData, categoriesData] = await Promise.all([
          getAllProducts(),
          getAllCategories().catch(() => []) // Categories optional
        ])
        setProducts(productsData)
        setCategories(categoriesData)
      } catch (err) {
        setError('Failed to load products. Make sure the backend is running.')
        console.error('Error fetching products:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    const fetchFilteredProducts = async () => {
      try {
        setLoading(true)
        const filters = {
          search: searchTerm || undefined,
          category_id: selectedCategory || undefined,
          min_price: priceRange.min || undefined,
          max_price: priceRange.max || undefined,
          sort_by: sortBy
        }
        const data = await getAllProducts(filters)
        setProducts(data)
      } catch (err) {
        setError('Failed to load products.')
        console.error('Error fetching products:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchFilteredProducts()
  }, [searchTerm, selectedCategory, sortBy, priceRange.min, priceRange.max])

  return (
    <div className="products-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">All Products</h1>
          <p className="page-subtitle">Browse our collection of campus essentials</p>
        </div>

        <div className="products-filters">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filters-row">
            <div className="filter-group">
              <label htmlFor="category">Category:</label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.CategoryID} value={cat.CategoryID}>
                    {cat.CategoryName}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="sort">Sort By:</label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="name">Name (A-Z)</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>

            <div className="filter-group price-filter">
              <label>Price Range:</label>
              <div className="price-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  className="price-input"
                  min="0"
                />
                <span>to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  className="price-input"
                  min="0"
                />
              </div>
            </div>

            {(selectedCategory || priceRange.min || priceRange.max) && (
              <button
                onClick={() => {
                  setSelectedCategory('')
                  setPriceRange({ min: '', max: '' })
                }}
                className="btn btn-outline btn-sm"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : products.length === 0 ? (
          <div className="no-products">
            <p>No products found. Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <div className="products-count">
              <p>Showing {products.length} product{products.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="products-grid">
              {products.map((product) => (
                <ProductCard key={product.PID} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Products
