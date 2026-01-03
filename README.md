# DynamoDB Desktop GUI

A modern, open-source graphical interface for Amazon DynamoDB built with Electron. Manage your DynamoDB tables, scan and query data, and edit items with a beautiful, native desktop experience across Windows, macOS, and Linux.

<br />

![Electron](https://img.shields.io/badge/v37.3.1-Electron-blue) &nbsp;
![React](https://img.shields.io/badge/v19.1.1-React-blue) &nbsp;
![TypeScript](https://img.shields.io/badge/v5.9.2-TypeScript-blue) &nbsp;
![AWS SDK](https://img.shields.io/badge/AWS_SDK-v3-orange) &nbsp;
![Tailwind](https://img.shields.io/badge/v4.1.12-Tailwind-blue)

<br />

## Features

### 🔐 **AWS Credentials**

- Automatic detection of AWS CLI credentials
- Support for multiple AWS profiles
- Easy profile and region switching
- Uses AWS SDK v3 for optimal performance

### 📊 **Table Management**

- Browse all DynamoDB tables in your AWS account
- View detailed table information (item count, size, indexes)
- Search and filter tables
- Favorite tables for quick access
- Sort by name, items, size, or creation date

### 🔍 **Scan & Query**

- Powerful scan and query builder
- Support for partition key and sort key conditions
- Filter expressions with multiple operators
- Select specific indexes (GSI/LSI)
- Attribute projection (all attributes, keys only, or specific attributes)
- Pagination with "Load More" functionality

### ✏️ **Item Editor**

- Rich JSON editor powered by CodeMirror
- Real-time JSON validation
- Syntax highlighting and error detection
- Edit existing items or create new ones
- Toggle between standard JSON and DynamoDB JSON format
- Auto-formatting and line numbers
- Copy JSON to clipboard

### 🎨 **Modern UI**

- Clean, dark-themed interface
- Responsive design
- Collapsible JSON tree view for results
- Custom window controls and titlebar
- Keyboard shortcuts

<br />

## Technology Stack

🔹 **[Electron](https://www.electronjs.org)** - Cross-platform desktop framework<br />
🔹 **[React](https://react.dev)** - Modern UI library<br />
🔹 **[TypeScript](https://www.typescriptlang.org)** - Type-safe development<br />
🔹 **[AWS SDK v3](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/)** - DynamoDB client<br />
🔹 **[CodeMirror](https://codemirror.net)** - JSON editor with validation<br />
🔹 **[TailwindCSS](https://tailwindcss.com)** - Utility-first styling<br />
🔹 **[Zod](https://zod.dev)** - Schema validation<br />
🔹 **[Electron Vite](https://electron-vite.org)** - Lightning-fast build tool

<br />

## Prerequisites

Before running the application, ensure you have:

1. **Node.js** (v18 or higher)
2. **AWS CLI** configured with valid credentials

   ```bash
   aws configure
   ```

   Or manually create `~/.aws/credentials` with your access keys:

   ```ini
   [default]
   aws_access_key_id = YOUR_ACCESS_KEY
   aws_secret_access_key = YOUR_SECRET_KEY

   [profile-name]
   aws_access_key_id = YOUR_ACCESS_KEY
   aws_secret_access_key = YOUR_SECRET_KEY
   ```

<br />

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/dynamodb-gui

# Change directory
cd dynamodb-gui

# Install dependencies
npm install
```

<br />

## Development

Start the development server:

```bash
npm run dev
```

This launches the application in development mode with hot-reload enabled.

<br />

## Usage

### Connecting to DynamoDB

1. Launch the application
2. Select your AWS profile from the dropdown (default profile is pre-selected)
3. Choose your AWS region
4. Click "Connect" to load your tables

### Browsing Tables

- View all tables in a sortable, searchable list
- Click the star icon to favorite frequently used tables
- Click on any table to view its details and data

### Scanning/Querying Data

1. Select a table from the sidebar
2. Choose between "Scan" or "Query" mode
3. For Query mode:
   - Enter the partition key value (required)
   - Optionally add sort key conditions
4. Add filters to narrow results (optional)
5. Select attribute projection (all, keys only, or specific attributes)
6. Click "Run" to execute

### Editing Items

1. Run a scan or query to display items
2. Hover over any item to reveal the edit button (✏️)
3. Modify the JSON in the editor
4. Click "Format" to auto-format JSON
5. Toggle "View DynamoDB JSON" to see the type-annotated format
6. Click "Save" to update the item

### Creating Items

1. Navigate to a table
2. Run any scan/query to see results
3. Click "Create item" button
4. Enter the JSON for your new item (must include partition key and sort key if applicable)
5. Click "Save"

### Deleting Items

1. Hover over any item in the results
2. Click the delete button (🗑️)
3. Click again to confirm deletion

<br />

## Keyboard Shortcuts

- **Alt** (Windows) / **⌥ Option** (macOS) - Toggle menu bar
- **Ctrl+C** / **⌘+C** - Copy (in editor)
- **Ctrl+A** / **⌘+A** - Select all (in editor)

<br />

## Building for Production

Build the application for your platform:

```bash
# For Windows
npm run build:win

# For macOS
npm run build:mac

# For Linux
npm run build:linux

# Unpacked (for testing)
npm run build:unpack
```

Distribution files will be in the `dist` directory.

<br />

## Project Structure

```
dynamodb-gui/
├── app/                          # Renderer process (React UI)
│   ├── components/
│   │   ├── dynamodb/            # DynamoDB-specific components
│   │   │   ├── DynamoDBApp.tsx  # Main app container
│   │   │   ├── ConnectionHeader.tsx
│   │   │   ├── TablesView.tsx   # Table listing
│   │   │   ├── ExplorerView.tsx # Scan/Query interface
│   │   │   └── DocumentEditor.tsx # JSON editor
│   │   ├── ui/                  # Reusable UI components
│   │   └── window/              # Custom window controls
│   └── styles/                  # Global styles
├── lib/
│   ├── conveyor/                # IPC communication layer
│   │   ├── api/                 # Client-side API
│   │   ├── handlers/            # Server-side handlers
│   │   └── schemas/             # Zod validation schemas
│   ├── main/                    # Electron main process
│   ├── preload/                 # Preload scripts
│   └── services/
│       └── dynamodb-service.ts  # DynamoDB SDK wrapper
└── resources/                   # Build resources (icons, etc.)
```

<br />

## Security

- Uses AWS SDK's credential provider chain for secure authentication
- Context isolation enabled for security
- No credentials stored in the application
- All IPC communication is validated with Zod schemas

<br />

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<br />

## License

This project is licensed under the MIT License - see the LICENSE file for details.

<br />

## Acknowledgments

- Built with [Electron React App](https://github.com/guasam/electron-react-app) template
- Uses AWS SDK for JavaScript v3
- CodeMirror for the JSON editor
- Tailwind CSS for styling

<br />

## Support

If you find this project helpful, please give it a ⭐️ on GitHub!
