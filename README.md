# Souk Manager - WebSocket Employee Table Demo

A real-time employee directory that displays randomly generated employee data via WebSocket connections.

## Features

- Real-time WebSocket connection
- Randomly generated employee data
- Beautiful shadcn/ui table interface
- Live connection status indicator
- Auto-updating data every 5 seconds
- **Delete functionality** - Remove employees from the table
- **SSR-compatible** - Proper client-side rendering for Next.js
- **Pagination** - Navigate through pages of employees
- **Data limits** - Maximum 100 employees with 10 per page

## Employee Data Structure

Each employee record includes:

- **ID**: Unique identifier
- **Name**: Full name
- **Position**: Job title (Software Engineer, Product Manager, etc.)
- **Team**: Team number (1-10)
- **Birthday**: Date of birth
- **Email**: Email address
- **Phone Number**: Contact number
- **Address**: Full address
- **Employment Status**: Full-time, Part-time, Contract, or Intern
- **Notes**: Additional information

## Getting Started

This project uses a custom Next.js server that integrates both the frontend and WebSocket functionality.

### Development

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

This starts a single server that handles:

- Next.js frontend on port 3000
- WebSocket server on the same port

### Production

```bash
# Build the application
pnpm build

# Start the production server
pnpm start
```

## CodeSandbox Demo

To use this in CodeSandbox:

1. The WebSocket server is configured to accept connections from `https://codesandbox.io`
2. The frontend will automatically connect to the WebSocket server
3. You'll see real-time employee data updates every 5 seconds

## Project Structure

```
souk-manager/
├── server.js              # Custom Next.js server with WebSocket
├── src/
│   ├── app/
│   │   ├── page.tsx       # Main page component
│   │   └── globals.css    # Global styles
│   ├── components/
│   │   ├── EmployeeTable.tsx  # Main table component
│   │   └── ui/            # shadcn/ui components
│   └── types/
│       └── employee.ts    # TypeScript types
└── public/
    └── index.html         # Standalone HTML for CodeSandbox
```

## Technologies Used

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui
- **WebSocket**: Socket.IO
- **Data Generation**: Faker.js
- **Build Tool**: Turbopack

## Railway Deployment

To deploy this application to Railway:

### Environment Variables

Set these environment variables in your Railway project:

```bash
# Your Railway app's public URL
PUBLIC_URL=https://your-app-name.railway.app

# WebSocket connection URL (same as PUBLIC_URL for Railway)
NEXT_PUBLIC_SOCKET_URL=https://your-app-name.railway.app
```

### Railway Configuration

1. **Build Command**: `pnpm build` (or use `./railway-build.sh` for clean builds)
2. **Start Command**: `pnpm start`
3. **Node Version**: 18 or higher

### Troubleshooting Railway Deployment

If you encounter a 502 error:

1. **Clean Build**: Delete the `.next` folder and rebuild

   ```bash
   rm -rf .next
   pnpm build
   ```

2. **Check Logs**: Look for module errors in Railway logs
3. **Verify Environment Variables**: Ensure all required variables are set
4. **Test Health Endpoint**: Visit `/health` to verify server status

### Important Notes

- Railway automatically sets `PORT` and `HOSTNAME` environment variables
- The WebSocket server will run on the same port as your Next.js app
- CORS is configured to accept connections from your Railway domain

## Development

The application now uses a **unified Next.js architecture**:

1. **Custom Next.js Server** (`server.js`): Integrates both frontend and WebSocket functionality
2. **Frontend** (`src/app/page.tsx`): Displays the data in a real-time table

### Configuration

- **Maximum Employees**: 100 total employees
- **Employees per Page**: 10 employees
- **Update Interval**: 5 seconds
- **Pagination**: Navigate through pages with Previous/Next buttons

The WebSocket server generates new employee data every 5 seconds and sends it to all connected clients. The frontend maintains a list of the most recent employees and updates the table in real-time. When the maximum limit is reached, the server stops generating new employees.
