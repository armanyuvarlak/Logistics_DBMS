# Logistics Calculator Web App

This is a web-based version of the Logistics Calculator application.

## Setup and Deployment

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)
- Firebase CLI (`npm install -g firebase-tools`)

### Local Development
1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm start
   ```

3. Open your browser to [http://localhost:3000](http://localhost:3000)

### Production Deployment
1. Login to Firebase:
   ```
   firebase login
   ```

2. Build and deploy the app:
   ```
   npm run deploy
   ```

## Application Structure
- The app uses React for the frontend
- Firebase Authentication for user management
- Firestore database for data storage
- Firebase Hosting for deployment

## Data Storage
- User data is stored in Firestore when logged in
- LocalStorage is used as a fallback when offline

## Features
- Single logistics offers calculation
- Database management
- User authentication
- Results export
- Review offers history 