import React, { createContext, useState, useContext, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('campusbazaar_user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = (userData) => {
    // Store user data with UserType
    const userToStore = {
      EmailID: userData.EmailID,
      FirstName: userData.FirstName,
      LastName: userData.LastName,
      UserType: userData.UserType || 'regular',
      StudentInfo: userData.StudentInfo,
      FacultyInfo: userData.FacultyInfo
    }
    setUser(userToStore)
    localStorage.setItem('campusbazaar_user', JSON.stringify(userToStore))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('campusbazaar_user')
  }

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

