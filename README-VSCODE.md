# VS Code Deployment Guide for yt-chat-application

Follow these steps to run the application locally in VS Code.

## Prerequisites
*   **Node.js**: Installed (v16+ recommended).
*   **VS Code**: Installed.

## Step 1: Install Dependencies
Open two terminals in VS Code (Terminal -> New Terminal).

### Terminal 1 (Backend)
```bash
cd backend
npm install
```

### Terminal 2 (Frontend)
```bash
cd frontend
npm install
```

## Step 2: Environment Setup
Check the `backend/.env` file. It already contains a MongoDB URI, but you can update it if needed:
```env
PORT = 8080
MONGO_URI=your_mongodb_connection_string
JWT_SECRET_KEY=your_secret_key
```

## Step 3: Run the Application

### Start Backend (Terminal 1)
```bash
npm run dev
```
*Wait for "Server listen at prot 8080"*

### Start Frontend (Terminal 2)
```bash
npm start
```
*The app should open automatically at `http://localhost:3000`*

## Troubleshooting
*   **Port already in use**: If 8080 or 3000 are taken, change the PORT in `.env` or the frontend configuration.
*   **Database connection**: Ensure your network allows connections to MongoDB Atlas.
