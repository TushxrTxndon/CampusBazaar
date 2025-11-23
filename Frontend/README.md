# CampusBazaar Frontend

A modern, responsive React frontend for the CampusBazaar marketplace platform.

## Features

- 🎨 Modern, attractive UI with smooth animations
- 📱 Fully responsive design
- 🛒 Shopping cart functionality
- 👤 User authentication and registration
- 📦 Product browsing and details
- 🛍️ Order management
- ⚡ Fast and optimized with Vite

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Navigate to the Frontend directory:
```bash
cd Frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
Frontend/
├── src/
│   ├── components/      # Reusable components
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   └── ProductCard.jsx
│   ├── pages/           # Page components
│   │   ├── Home.jsx
│   │   ├── Products.jsx
│   │   ├── ProductDetail.jsx
│   │   ├── Register.jsx
│   │   ├── Login.jsx
│   │   ├── Cart.jsx
│   │   └── Orders.jsx
│   ├── context/         # React Context providers
│   │   ├── AuthContext.jsx
│   │   └── CartContext.jsx
│   ├── services/        # API services
│   │   └── api.js
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── index.html
├── package.json
└── vite.config.js
```

## API Configuration

The frontend is configured to connect to the backend API at `http://127.0.0.1:8000`. Make sure your FastAPI backend is running before using the frontend.

You can modify the API base URL in `src/services/api.js` if needed.

## Features Overview

### Home Page
- Hero section with call-to-action
- Feature highlights
- Modern gradient design

### Products Page
- Product grid with search functionality
- Product cards with hover effects
- Quick add to cart

### Product Detail
- Full product information
- Quantity selector
- Add to cart functionality

### Shopping Cart
- View all cart items
- Update quantities
- Remove items
- Order summary
- Checkout functionality

### Authentication
- User registration
- Login (mock implementation - integrate with backend)
- Protected routes

### Orders
- View order history
- Order details

## Styling

The frontend uses custom CSS with CSS variables for theming. The design is modern, clean, and fully responsive.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development

The project uses:
- **React 18** - UI library
- **React Router** - Routing
- **Vite** - Build tool and dev server
- **Axios** - HTTP client

## Notes

- The login functionality currently uses mock authentication. You'll need to integrate it with your backend authentication endpoint.
- Some product data is mocked for demonstration. Connect to your backend API endpoints for real data.
- The frontend assumes certain API endpoints exist. Make sure your backend has corresponding routes.

