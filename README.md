# Docusnake

A comprehensive document scanner application that uses AI to extract key data points from scanned documents, stores them in structured formats (Excel/CSV), and provides flexible folder-based organization — all with secure user authentication.

## Architecture

| Layer | Technology |
|---|---|
| Mobile Frontend | React Native (Expo, TypeScript) |
| Backend API | ASP.NET Core 8 (.NET) |
| Database | SQLite via Entity Framework Core |
| Authentication | JWT (JSON Web Tokens) |
| Excel Export | ClosedXML |
| CSV Export | CsvHelper |

---

## Project Structure

```
Docusnake/
├── backend/                  .NET 8 Web API
│   ├── Docusnake.API/
│   │   ├── Controllers/      AuthController, DocumentsController,
│   │   │                     FoldersController, ExportController
│   │   ├── Data/             AppDbContext (EF Core + SQLite)
│   │   ├── DTOs/             Request/response data-transfer objects
│   │   ├── Models/           User, Document, Folder
│   │   ├── Services/         Auth, Document, Folder, Export, AiExtraction
│   │   └── Program.cs        DI, JWT, CORS, Swagger
│   └── Docusnake.Tests/      xUnit tests (18 tests)
└── frontend/                 React Native (Expo) App
    └── src/
        ├── api/              Axios client + endpoint wrappers
        ├── components/       DocumentCard, FolderCard, LoadingSpinner
        ├── context/          AuthContext (JWT lifecycle)
        ├── navigation/       Root → Auth / App (bottom tabs + stacks)
        ├── screens/
        │   ├── auth/         LoginScreen, RegisterScreen
        │   └── app/          Home, Documents, DocumentDetail,
        │                     Scan, Folders, FolderDetail
        ├── types/            TypeScript interfaces
        └── utils/            AsyncStorage helpers
```

---

## Features

### 📷 Document Scanning
- Capture documents using the device camera (`expo-camera`)
- Image picker fallback for selecting from gallery
- Preview captured image before saving
- Name documents before saving to the backend

### 🤖 AI Data Extraction
- Automatically extract structured data from document text using regex pattern matching
- Detects: dates, emails, phone numbers, amounts/totals, invoice numbers, names, addresses
- Extracted data displayed as key-value pairs on the Document Detail screen
- Trigger re-extraction on demand via the `/extract` endpoint

### 📁 Folder Organization
- Create unlimited nested folders and sub-folders
- Move documents between folders
- Browse folder hierarchy in a tree-like view
- Per-folder document listing

### 📊 Export
- Export documents to **Excel (.xlsx)** or **CSV (.csv)**
- Filter by folder (or export all documents)
- Files downloaded via `expo-file-system` and shared via `expo-sharing`

### 🔒 Authentication
- User registration with username, email, and password
- BCrypt password hashing
- JWT tokens (7-day expiry) stored securely in AsyncStorage
- All API routes protected; 401 responses auto-trigger logout

---

## Getting Started

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)

### Backend

```bash
cd backend
dotnet restore
dotnet run --project Docusnake.API
# API available at http://localhost:5000
# Swagger UI at http://localhost:5000/swagger
```

Run tests:
```bash
cd backend
dotnet test
```

### Frontend

```bash
cd frontend
npm install
npx expo start
```

- Press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with Expo Go.
- Update `src/api/client.ts` with your backend URL if not running locally.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, receive JWT |
| GET | `/api/documents` | List documents (optional `?folderId=`) |
| POST | `/api/documents` | Create document |
| GET | `/api/documents/{id}` | Get document |
| PUT | `/api/documents/{id}` | Update document |
| DELETE | `/api/documents/{id}` | Delete document |
| POST | `/api/documents/{id}/extract` | Re-run AI extraction |
| GET | `/api/folders` | List root folders (with children) |
| POST | `/api/folders` | Create folder |
| GET | `/api/folders/{id}` | Get folder with documents |
| PUT | `/api/folders/{id}` | Rename / move folder |
| DELETE | `/api/folders/{id}` | Delete folder |
| GET | `/api/export/excel` | Export to Excel (optional `?folderId=`) |
| GET | `/api/export/csv` | Export to CSV (optional `?folderId=`) |