# Codebase Summary

## Overview
This is a **React** application built with **Vite**, using **Firebase** for backend services (Authentication, Firestore, Storage). It serves as a personal productivity tool with features for task management and document organization.

## Key Technologies
- **Frontend**: React 18, Vite
- **Routing**: React Router Dom v7
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Icons**: Lucide React
- **Styling**: Inline styles + CSS

## Project Structure
```
src/
├── components/       # Reusable UI components (Sidebar, ProtectedRoute)
├── contexts/         # React Contexts (AuthContext)
├── firebase/         # Firebase configuration and service functions
├── pages/            # Main page components
│   ├── AllTasks.jsx      # Main task dashboard
│   ├── DocumentsV2.jsx   # Document management system
│   ├── Login.jsx         # Authentication
│   └── ...
├── App.jsx           # Main application component & Routing
└── main.jsx          # Entry point
```

## Key Features & Logic

### 1. Task Management (`AllTasks.jsx`)
- **Functionality**: Create, read, update, delete (CRUD) tasks.
- **Organization**: Tasks are organized by **Categories** (e.g., Office, Home, Projects).
- **Data Model**:
  - stored in Firestore: `users/{userId}/tasks`
  - Fields: `text`, `completed`, `category`, `priority` (low/medium/high), `status` (new/in-progress/done), `dueDate`.
- **UI**: Displays active and completed tasks in tables with filtering by category.

### 2. Document Management (`DocumentsV2.jsx`)
- **Functionality**: Manage document types and records.
- **Structure**:
  - **Document Types**: Acts as folders (e.g., "Invoices", "Contracts").
  - **Records**: Individual document entries within a type.
- **Data Model**:
  - Stored in Firestore: `users/{userId}/documentsV2`
  - Each document type is a document in the collection.
  - **Records** are stored as an array within the document type document (embedded data model).
  - Record fields: `name`, `number`, `category`, `issuedOn`, `expireAt`, `issuedBy`, `downloadLink`.

### 3. Authentication
- Managed via `AuthContext`.
- Uses Firebase Auth.
- Protected routes ensure only authenticated users can access the app.

## Observations
- **Styling**: The application relies heavily on inline styles for components, which allows for quick iteration but might be harder to maintain at scale compared to CSS classes or styled-components.
- **Data Fetching**: Real-time updates are implemented using Firestore `onSnapshot` listeners (seen in `subscribeToTasks`, `subscribeToUserDocuments`), ensuring the UI stays in sync with the database.
