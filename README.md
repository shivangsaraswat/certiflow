# certiflow
Certificate Generation Web Application

A production-ready MVP for generating professional certificates using **PDF templates** with dynamic data overlay.

## Key Features

- **PDF-Native Rendering**: Uses PDF files as base templates, preserving vector quality
- **No Rasterization**: Original PDF fonts, graphics, and layout remain untouched
- **Dynamic Overlay**: Text and images are overlaid on precise coordinates
- **Multi-Page Support**: Works with single and multi-page PDF templates
- **Bulk Generation**: Process thousands of certificates efficiently
- **Designer-Friendly**: Works with professionally designed PDF certificates

## Project Structure

```
certif/
├── frontend/          # Next.js 16 Application
├── backend/           # Node.js/Express API
└── storage/           # Local file storage
    ├── templates/     # PDF certificate templates
    ├── signatures/    # Signature images
    ├── generated/     # Generated certificates
    └── bulk-zips/     # Bulk download archives
```

## Tech Stack

### Frontend
- **Next.js 16** with App Router
- **Tailwind CSS** for styling
- **ShadCN UI** for components
- **React Hook Form + Zod** for form validation
- **TypeScript** throughout

### Backend
- **Node.js + Express**
- **pdf-lib** for PDF manipulation (no rasterization)
- **TypeScript** throughout

## Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn

### Installation

1. **Install backend dependencies:**
```bash
cd backend
npm install
```

2. **Install frontend dependencies:**
```bash
cd frontend
npm install
```

### Running the Application

1. **Start the backend server:**
```bash
cd backend
npm run dev
```
The backend will run on http://localhost:3001

2. **Start the frontend (in another terminal):**
```bash
cd frontend
npm run dev
```
The frontend will run on http://localhost:3000

## Features

### Template Management
- Upload PDF certificate templates
- Configure attribute positions with page selection
- Multi-page PDF support

### Single Certificate Generation
- Select template
- Fill form with recipient details
- Generate and download PDF with overlaid data

### Bulk Certificate Generation
- Upload CSV file with recipient data
- Map CSV columns to template attributes
- Generate all certificates in batch
- Download as ZIP archive

### Signature Management
- Upload signature images (PNG, JPG)
- Use signatures in certificate generation

## PDF Template Approach

### Why PDF Templates?

1. **Print-Grade Quality**: Vector graphics preserved at any resolution
2. **No DPI Issues**: No scaling or resolution problems
3. **Designer-Friendly**: Works with professional design tools
4. **Efficient Bulk Processing**: No image manipulation overhead

### How It Works

1. Upload a PDF certificate template
2. Configure positions for dynamic fields (name, date, etc.)
3. Dynamic text/images are overlaid using `pdf-lib`
4. Original PDF structure is preserved
5. Final certificate is a high-quality PDF

### Coordinate System

- Coordinates are in **PDF points** (72 points = 1 inch)
- Origin (0,0) is at the **bottom-left** of each page
- Y values **increase upward**

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/templates | List all templates |
| POST | /api/templates | Upload PDF template |
| PUT | /api/templates/:id/positions | Update attribute positions |
| DELETE | /api/templates/:id | Delete template |
| POST | /api/generate/single | Generate single certificate |
| POST | /api/generate/bulk | Generate certificates from CSV |
| GET | /api/files/download/:type/:filename | Download file |
| POST | /api/files/signature | Upload signature |
| GET | /api/files/signatures | List signatures |

## Configuration

### Backend Environment Variables

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
STORAGE_ROOT=../storage
MAX_BULK_BATCH_SIZE=50
```

### Frontend Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Template JSON Structure

```json
{
  "name": {
    "page": 1,
    "x": 320,
    "y": 480,
    "fontSize": 36,
    "fontFamily": "Helvetica",
    "fontWeight": "bold",
    "color": "#1F2A44",
    "align": "center"
  },
  "description": {
    "page": 1,
    "x": 220,
    "y": 400,
    "fontSize": 16,
    "fontFamily": "Helvetica",
    "maxWidth": 400,
    "align": "center"
  },
  "certificateId": {
    "page": 1,
    "x": 50,
    "y": 50,
    "fontSize": 10,
    "fontFamily": "Courier",
    "color": "#666666"
  },
  "signature": {
    "page": 1,
    "x": 400,
    "y": 100,
    "width": 120,
    "height": 60
  }
}
```

## CSV Format for Bulk Generation

```csv
name,certificateId,description,date
John Doe,CERT-001,For completing the course,January 15, 2024
Jane Smith,CERT-002,For completing the course,January 15, 2024
```

## Supported Fonts

| User-Friendly Name | PDF Standard Font |
|--------------------|-------------------|
| Helvetica, Arial | Helvetica |
| Times New Roman | Times-Roman |
| Courier | Courier |

## Architecture Decisions

1. **PDF-Native Approach**: No image conversion maintains quality
2. **pdf-lib**: Pure JavaScript PDF manipulation
3. **Monorepo Structure**: Clear separation of frontend/backend
4. **Storage Abstraction**: Ready for cloud migration (S3, GCS)
5. **Batch Processing**: Memory-safe with configurable batch sizes

## Future Enhancements

- [ ] Google Sheets integration (OAuth-based)
- [ ] QR code generation for verification
- [ ] Custom font embedding
- [ ] Visual position editor with PDF preview
- [ ] Email delivery of certificates
- [ ] Cloud storage support (S3, GCS)

## License

MIT
