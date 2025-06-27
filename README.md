# Logistics Calculator - Personal Prototype

A desktop-optimized logistics pricing calculator built with React and Firebase. This is a personal prototype project for calculating shipping costs and managing logistics offers.

## 🚀 Features

- **Freight Calculation**: Calculate costs for LTL, FTL, Air, and Ocean freight
- **Zone-based Pricing**: Comprehensive zone mapping system
- **Offer Management**: Save, edit, and manage pricing offers
- **PDF Generation**: Generate professional quotes
- **Authentication**: Simple weekly password system with rate limiting
- **Desktop-First Design**: Optimized for desktop use with Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: React 18, Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication, Functions)
- **PDF Generation**: jsPDF with custom templates
- **State Management**: React Context + Local Storage
- **Build Tool**: Create React App

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/armanyuvarlak/Logistics_DBMS.git
cd logistic

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Firebase credentials

# Start development server
npm start
```

## 🔧 Configuration

### Environment Variables
Copy `.env.example` to `.env` and configure your Firebase credentials:

```bash
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Firebase Setup
1. Create a Firebase project
2. Enable Firestore Database
3. Set up Authentication (Anonymous sign-in)
4. Deploy Firestore security rules from `firestore.rules`

## 🎯 Usage

### Authentication
The application uses a weekly password system:
- Password format: `TRdb{weekNumber}{reverseYear}`
- Rate limiting: 5 attempts per 15 minutes
- Session expires after 7 days

### Calculating Freight
1. Select service type (LTL, FTL, Air, Ocean)
2. Enter origin and destination
3. Specify cargo details (weight, dimensions)
4. Review calculated pricing
5. Save offer if needed

### Managing Offers
- View all saved offers on the Database page
- Edit existing offers with authentication
- Generate PDF quotes
- Filter and search offers

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── DynamicTable.jsx
│   ├── OfferEditModal.jsx
│   ├── PDFPreview.jsx
│   └── ...
├── contexts/           # React contexts
│   └── AuthContext.jsx
├── firebase/           # Firebase configuration
│   ├── firebaseConfig.js
│   └── firebaseUtils.js
├── pages/             # Page components
│   ├── CalculatePage.jsx
│   ├── DatabasePage.jsx
│   └── ...
├── services/          # Business logic
│   ├── calculatorService.js
│   ├── offerService.js
│   └── ...
└── utils/             # Utility functions
    ├── authUtils.js
    └── pdfGenerator.js
```

## 🔐 Security Features

- **Rate Limiting**: Prevents brute force attacks
- **Session Management**: Automatic token expiration
- **Environment Variables**: Secure credential storage
- **Input Validation**: XSS prevention and data validation
- **Authentication**: Required for sensitive operations

## 📱 Desktop-First Design

The application is optimized for desktop use with:
- Two-column layouts throughout
- Larger form elements and buttons
- Desktop-optimized spacing and typography
- No mobile breakpoints (purely desktop-focused)

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Firebase Deployment
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy to Firebase Hosting
firebase deploy
```

## 📊 Performance

- **Caching**: 5-minute localStorage cache for offers
- **Code Splitting**: Components loaded on demand
- **Optimized Builds**: Clean production builds without debug info
- **React Optimization**: useCallback and useMemo for performance

## 🛡️ Security Status

This is a personal prototype with appropriate security measures:
- ✅ Environment variables for Firebase config
- ✅ Rate limiting and session management
- ✅ Input validation and error handling
- ✅ Clean production code

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Repository

[GitHub Repository](https://github.com/armanyuvarlak/Logistics_DBMS)
