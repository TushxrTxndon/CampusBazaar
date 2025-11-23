import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Register from './pages/Register'
import Login from './pages/Login'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Orders from './pages/Orders'
import MyListings from './pages/MyListings'
import OAuthCallback from './pages/OAuthCallback'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="app">
            <Header />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:pid" element={<ProductDetail />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/my-listings" element={<MyListings />} />
                <Route path="/oauth/callback" element={<OAuthCallback />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  )
}

export default App

