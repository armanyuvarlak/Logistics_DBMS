# 🚚 Logistics Calculator Web Application

> **A comprehensive web-based logistics calculation and management system built with React and Firebase**

[![Live Demo](https://img.shields.io/badge/Demo-Live-green)](https://your-app-url.web.app)
[![Version](https://img.shields.io/badge/Version-1.0.0-blue)](#)
[![License](https://img.shields.io/badge/License-MIT-yellow)](#)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Usage](#usage)
- [Application Structure](#application-structure)
- [Firebase Configuration](#firebase-configuration)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

The **Logistics Calculator Web Application** is a modern, responsive web platform designed for logistics professionals to calculate shipping costs, manage offers, and maintain comprehensive databases of logistics operations. The application provides real-time calculations, user authentication and data persistence.

## ✨ Features

### 🔐 Authentication & Security
- **Firebase Authentication** with email/password and Google Sign-In
- **Email verification** required for account activation
- **Secure user sessions** with automatic refresh
- **Protected routes** for authenticated users only

### 📊 Logistics Calculations
- **Single Offer Calculator** with comprehensive cost breakdown
- **Multi-parameter pricing** including weight, dimensions, distance
- **Real-time calculations** with instant updates
- **Custom pricing rules** and rate management

### 📁 Data Management
- **Firestore Database** integration for cloud storage
- **LocalStorage backup** for offline functionality
- **User-specific data** isolation and security
- **Data export/import** capabilities

### 📄 Report Generation
- **Professional PDF reports** with company branding
- **Customizable templates** for different report types
- **Automatic calculations** and summary generation
- **Download and share** functionality

### 🎨 User Interface
- **Modern responsive design** built with Tailwind CSS
- **Mobile-first approach** for all device compatibility
- **Intuitive navigation** with collapsible sidebar
- **Dark/light theme** support (coming soon)

### 📈 Review & Analytics
- **Offer history** and review system
- **Search and filter** functionality
- **Data visualization** for insights
- **Export capabilities** for analysis

## 🛠 Technology Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **React Router 6** - Client-side routing
- **Tailwind CSS 3** - Utility-first CSS framework
- **Heroicons** - Beautiful SVG icons

### Backend & Database
- **Firebase 11** - Backend-as-a-Service platform
- **Firestore** - NoSQL cloud database
- **Firebase Auth** - Authentication service
- **Firebase Hosting** - Static web hosting

### Development Tools
- **Create React App** - Development environment
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing
- **jsPDF** - PDF generation library

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14.0.0 or higher)
- **npm** (v6.0.0 or higher) or **yarn**
- **Firebase CLI** for deployment
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/armanyuvarlak/Logistics_DBMS.git
   cd Logistics_DBMS
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication, Firestore, and Hosting
   - Copy your Firebase config to `src/firebase/firebaseConfig.js`

4. **Start development server**
   ```bash
   npm start
   # or
   yarn start
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage

### Getting Started
1. **Create an Account** - Sign up with email or Google
2. **Verify Email** - Check your inbox and verify your email address
3. **Login** - Access the application with your credentials

### Creating Logistics Offers
1. Navigate to **"Single Offer"** from the sidebar
2. Fill in the required logistics parameters:
   - Origin and destination
   - Package dimensions and weight
   - Service type and priority
3. Review the automatic cost calculations
4. Save or export your offer as PDF

### Managing Database
1. Access the **"Database"** section
2. View, edit, or delete existing records
3. Add new logistics partners or routes
4. Import/export data for backup

### Reviewing Offers
1. Go to **"Review Offers"** section
2. Browse your offer history
3. Filter by date, status, or customer
4. Generate reports and analytics

## 🏗 Application Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.jsx       # Navigation header
│   ├── Sidebar.jsx      # Navigation sidebar
│   ├── ResultsSection.jsx
│   └── SummarySection.jsx
├── contexts/            # React context providers
│   └── AuthContext.jsx  # Authentication state management
├── firebase/            # Firebase configuration and utilities
│   ├── firebaseConfig.js
│   ├── authUtils.js
│   ├── firebaseUtils.js

├── pages/               # Main application pages
│   ├── LoginPage.jsx
│   ├── SingleOfferPage.jsx
│   ├── DatabasePage.jsx
│   ├── ResultsPage.jsx
│   └── ReviewOffersPage.jsx
├── services/            # Business logic services
│   ├── calculatorService.js
│   └── pricingService.js
├── utils/               # Utility functions

└── App.jsx              # Main application component
```

## 🔧 Firebase Configuration

### Environment Setup
Create a `firebaseConfig.js` file in the `src/firebase/` directory:

```javascript
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
```

### Firestore Security Rules
The application uses custom security rules to ensure data privacy and security. Check `firestore.rules` for current configuration.

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Firebase
```bash
# Login to Firebase (first time only)
firebase login

# Deploy to Firebase Hosting
npm run deploy
```

### Manual Firebase Deployment
```bash
# Build the application
npm run build

# Deploy using Firebase CLI
firebase deploy
```

### Development Guidelines
- Follow React best practices and hooks
- Use Tailwind CSS for styling
- Maintain TypeScript-like prop documentation
- Write meaningful commit messages
- Test thoroughly before submitting

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
