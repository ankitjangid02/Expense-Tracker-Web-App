# Firebase Setup Instructions

This guide will help you set up Firebase for your Enhanced Expense Tracker application.

## Prerequisites
- A Google account
- Node.js installed on your system

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "expense-tracker-app")
4. Choose whether to enable Google Analytics (optional)
5. Accept terms and create the project

## Step 2: Set up Authentication

1. In your Firebase project console, click on "Authentication" in the left sidebar
2. Click on "Get started"
3. Go to the "Sign-in method" tab
4. Enable "Email/Password" authentication:
   - Click on "Email/Password"
   - Enable both options
   - Click "Save"

## Step 3: Set up Firestore Database

1. Click on "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" for now (we'll configure security rules later)
4. Select a location closest to your users
5. Click "Done"

## Step 4: Get Your Firebase Configuration

1. Click on the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click on the "</>" (web) icon to add a web app
5. Register your app with a name (e.g., "Expense Tracker Web")
6. Copy the Firebase configuration object

## Step 5: Update Your Application

1. Open `src/config/firebase.js` in your project
2. Replace the placeholder configuration with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

## Step 6: Configure Firestore Security Rules (Optional but Recommended)

1. Go to Firestore Database > Rules
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can only access their own transactions
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

3. Click "Publish"

## Step 7: Test Your Setup

1. Start your development server:
   ```bash
   npm start
   ```

2. Try to create a new account and verify that:
   - User authentication works
   - User data is stored in Firestore
   - Transactions are saved and retrieved correctly

## Troubleshooting

### Common Issues:

1. **"Firebase App named '[DEFAULT]' already exists"**
   - This usually means you're importing Firebase multiple times
   - Make sure you're only initializing Firebase once in `firebase.js`

2. **"Missing or insufficient permissions"**
   - Check your Firestore security rules
   - Make sure you're authenticated before making database calls

3. **"Failed to get document because the client is offline"**
   - Check your internet connection
   - Firebase works offline but needs initial connection

### Getting Help:

- Check the [Firebase Documentation](https://firebase.google.com/docs)
- Visit [Firebase Support](https://support.google.com/firebase)
- Check the browser console for detailed error messages

## Next Steps

Once Firebase is set up and working:

1. You can deploy your app using Firebase Hosting
2. Set up monitoring and analytics
3. Configure email templates for password reset
4. Add additional authentication providers (Google, Facebook, etc.)

## Production Considerations

Before deploying to production:

1. Review and tighten Firestore security rules
2. Set up proper Firebase project billing
3. Configure authentication domain restrictions
4. Set up monitoring and alerts
5. Consider implementing data backup strategies