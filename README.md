# Document Management System

A full-stack application for managing legal documents with secure storage, metadata extraction, and search capabilities.

## Overview

This document management system provides a comprehensive solution for uploading, storing, retrieving, and managing legal documents. It features a modern React frontend and a robust Node.js/Express backend with MongoDB storage.

## Features

- **Document Management**: Upload, view, update, and delete documents
- **Metadata Extraction**: Automatically extract metadata from uploaded documents
- **User Authentication**: Secure login with JWT-based authentication
- **PDF Viewer**: Built-in viewer for PDF documents

## Tech Stack

### Backend
- Node.js & Express
- TypeScript
- MongoDB with Mongoose
- JWT Authentication
- Multer for file uploads
- Jest for testing

### Frontend
- React 19
- TypeScript
- React Router
- Axios for API calls
- React-PDF for PDF viewing
- Vite as the build tool

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- Git

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/irfansherazi/test_task_docs_mgmt
cd test_task_docs_mgmt
```

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on the `.env.sample`:
   ```bash
   cp .env.sample .env
   ```

4. Configure your environment variables in the `.env` file:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/document-management
   JWT_SECRET=your_jwt_secret_key_here
   ```

5. Build the backend:
   ```bash
   npm run build
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on the `.env.sample`:
   ```bash
   cp .env.sample .env
   ```

4. Configure your environment variables in the `.env` file:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. The application will be available at `http://localhost:3000` by default.

## API Documentation

The backend API is fully documented using Swagger, providing an interactive way to explore and test all available endpoints.

### Accessing Swagger Documentation

Once the backend server is running, you can access the Swagger UI at:
```
http://localhost:5000/api-docs
```

### API Endpoints

The API provides the following main endpoints:

#### Authentication

- `POST /api/auth/login` - Authenticate and get JWT token

#### Documents

- `GET /api/documents` - Get all documents metadata
- `POST /api/documents` - Upload a new document
- `GET /api/documents/:id` - Get document metadata by ID
- `DELETE /api/documents/:id` - Delete a document
- `GET /api/documents/:id/extractions` - Get document text extractions
- `GET /api/documents/:id/file` - Download the document file

The complete API documentation with request/response schemas, required parameters, and authentication details is available through the Swagger UI.

## Running Tests

### Backend Tests

```bash
cd backend
npm test
```

For test coverage:
```bash
npm run test:coverage
```

## Project Structure

```
document-management/
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Utility functions
│   │   └── index.ts         # Entry point
│   └── uploads/             # Document storage directory
│
├── frontend/                # React frontend
│   ├── src/
│   │   ├── assets/          # Static assets
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # React context providers
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service functions
│   │   ├── styles/          # CSS stylesheets
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Utility functions
│   │   └── App.tsx          # Main application component
│   └── public/              # Public assets
│
└── README.md                # This file
```

## License

This project is licensed under the ISC License - see the LICENSE file for details. 