# Samvedana Foundation SMM Admin Panel

A modern React + TypeScript admin application for managing Samvedana Foundation's social media workflow. This frontend-only application provides a clean interface for creating events, generating AI-powered social media drafts, and publishing content across multiple platforms.

## 🚀 Features

- **Event Creation**: Create social media events with images and detailed descriptions
- **AI Draft Generation**: Generate platform-specific content for LinkedIn, Instagram, Facebook, and Twitter
- **Draft Editing**: Edit and customize AI-generated content with real-time preview
- **Multi-Platform Publishing**: Publish to selected social media platforms
- **Event History**: Track all events with filtering and status management
- **Authentication**: Secure admin access using Firebase Firestore
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS with custom design system
- **UI Components**: Shadcn/ui with custom variants
- **State Management**: React hooks + localStorage for draft management
- **Authentication**: Firebase Firestore (Authority collection)
- **Routing**: React Router v6
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18+ and npm
- Firebase project with Firestore database
- Backend API implementing the webhook contract (see API Contract below)

## ⚙️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing project
3. Go to Project Settings > General > Your apps
4. Click "Add app" and select "Web"
5. Copy the Firebase configuration object
6. Open `src/lib/firebase.ts`
7. Replace the placeholder configuration:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com", 
  projectId: "your-actual-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 3. Configure API Base URL

1. Open `src/lib/config.ts`
2. Set your backend API URL:

```typescript
export const API_BASE = "https://your-api-domain.com/api/v1";
```

### 4. Setup Firestore Authority Collection

Create a Firestore collection named `Authority` with documents structured as:

```
Collection: Authority
Document ID: {mobile_number}
Fields:
  - mobile_number: string
  - name: string
  - password: string (Note: Use hashed passwords in production)
  - role: string (must be "Administrator" for admin access)
```

**Example Document:**
```
Document ID: "9876543210"
{
  mobile_number: "9876543210",
  name: "Admin User",
  password: "admin123",
  role: "Administrator"
}
```

## 🚀 Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📤 Deployment to Hostinger

### 1. Build the Project
```bash
npm run build
```

### 2. Upload to Hostinger
1. Compress the `dist` folder contents
2. Upload to your Hostinger public_html directory
3. Extract the files
4. Ensure the domain points to the correct directory

### 3. Configure Web Server
For single-page application support, create a `.htaccess` file in your root directory:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

## 📡 API Contract

Your backend must implement these webhook endpoints:

### POST /webhook/event-create
**Content-Type**: `multipart/form-data`
**Body**:
- `prompt_text`: string
- `date_time`: string (ISO format)
- `created_by`: string
- `images[]`: File array (1-4 images)

**Response**: `{ event_id: string }`

### POST /webhook/generate
**Content-Type**: `application/x-www-form-urlencoded`
**Body**: `event_id=string`

**Response**:
```json
{
  "event_id": "string",
  "platform_drafts": {
    "linkedin": { "text": "...", "hashtags": "...", "seo_keywords": "..." },
    "instagram": { "text": "...", "hashtags": "...", "seo_keywords": "..." },
    "facebook": { "text": "...", "hashtags": "...", "seo_keywords": "..." },
    "twitter": { "text": "...", "hashtags": "...", "seo_keywords": "..." }
  }
}
```

### POST /webhook/publish
**Content-Type**: `application/json`
**Body**:
```json
{
  "event_id": "string",
  "platforms": ["linkedin", "instagram"],
  "final_drafts": {
    "linkedin": { "text": "...", "hashtags": "...", "seo_keywords": "..." }
  }
}
```

**Response**: `{ success: boolean, published_platforms: string[], links?: object }`

### GET /webhook/history
**Query Parameters**: `limit`, `status`, `start_date`, `end_date`

**Response**:
```json
{
  "events": [
    {
      "event_id": "string",
      "title": "string", 
      "status": "draft|published|failed",
      "created_at": "ISO string",
      "published_at": "ISO string",
      "platforms": ["linkedin"],
      "links": { "linkedin": "https://..." }
    }
  ],
  "total": number
}
```

## 🔒 Security Recommendations

⚠️ **IMPORTANT**: This implementation uses client-side password validation for demo purposes.

**For Production:**
1. Implement server-side password hashing and validation
2. Use Firebase Authentication instead of custom auth
3. Add proper Firestore security rules
4. Implement JWT tokens for session management
5. Add rate limiting and CSRF protection
6. Use HTTPS for all communications

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/          # Layout components
│   └── ui/              # Reusable UI components
├── hooks/               # Custom React hooks
├── lib/                 # Configuration and utilities
├── pages/               # Page components
├── utils/               # API utilities
└── styles/              # Global styles
```

## 🎨 Design System

The app uses a professional design system with:
- **Primary**: Indigo blue (#1e293b)
- **Accent**: Success green (#16a34a)  
- **Semantic tokens**: All colors defined in CSS variables
- **Consistent spacing**: Using Tailwind's spacing scale
- **Custom shadows**: Professional depth and elevation

## 🐛 Troubleshooting

### Firebase Configuration Issues
- Ensure your Firebase config values are correct
- Check Firestore security rules allow read/write for Authority collection
- Verify your project ID matches the configuration

### API Connection Issues  
- Confirm API_BASE URL is correct and reachable
- Check CORS settings on your backend
- Verify webhook endpoints match the contract

### Build Issues
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Check TypeScript errors: `npm run build`

## 📄 License

© 2024 Samvedana Foundation. All rights reserved.

---

For support or questions, contact your system administrator.