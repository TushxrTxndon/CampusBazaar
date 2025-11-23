import React, { createContext, useState, useContext, useEffect } from 'react'

const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([])

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('campusbazaar_cart')
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
  }, [])

  useEffect(() => {
    // Save cart to localStorage whenever it changes
    localStorage.setItem('campusbazaar_cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.PID === product.PID)
      if (existingItem) {
        return prevCart.map((item) =>
          item.PID === product.PID
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prevCart, { ...product, quantity: 1 }]
    })
  }

  const removeFromCart = (pid) => {
    setCart((prevCart) => prevCart.filter((item) => item.PID !== pid))
  }

  const updateQuantity = (pid, quantity) => {
    if (quantity <= 0) {
      removeFromCart(pid)
      return
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.PID === pid ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => {
    setCart([])
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.Price * item.quantity), 0)
  }

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemCount,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

