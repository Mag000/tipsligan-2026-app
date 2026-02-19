# Tipsligan 2026 App 🎯

A modern React application built with TypeScript, FluentUI 9, and React Router for the Tipsligan betting league.

## ✨ Features

- ✅ **FluentUI 9** - Modern Microsoft design system with beautiful components
- ✅ **Fully Responsive** - Perfect on desktop, tablet, and mobile devices
- ✅ **Burger Menu** - Mobile-friendly navigation with smooth drawer animation
- ✅ **React Router 6** - Modern client-side routing with protected routes
- ✅ **Login System** - Secure username/password authentication
- ✅ **TypeScript** - 100% type-safe codebase with zero compile errors
- ✅ **Session Management** - Persistent login state across page refreshes
- ✅ **Modern Architecture** - Clean separation of concerns

## 🚀 Quick Start

### Method 1: Using the Start Script (Recommended)

```powershell
cd c:\Repos\Tipsligan\tipsligan-2026-app
.\START.ps1
```

This will automatically:

- Check dependencies
- Install if needed
- Start the development server
- Open your browser to http://localhost:3000

### Method 2: Manual Start

```powershell
cd c:\Repos\Tipsligan\tipsligan-2026-app

# Install dependencies (first time only)
npm install

# Start development server
npm start
```

## 📁 Project Structure

```
tipsligan-2026-app/
├── START.ps1                  # Quick start script
├── package.json               # Dependencies
├── tsconfig.json             # TypeScript config
├── .env                      # Environment variables
├── public/
│   └── index.html            # HTML template
└── src/
    ├── App.tsx               # Main app with layout & routing ✅ NO ERRORS
    ├── index.tsx             # Application entry point
    ├── index.css             # Global styles
    ├── hooks/
    │   └── useToken.ts       # Token management hook
    ├── pages/
    │   ├── Login.tsx         # Login page with FluentUI
    │   ├── Home.tsx          # Dashboard with cards
    │   ├── Standings.tsx     # Standings page
    │   ├── Matches.tsx       # Matches page
    │   └── Profile.tsx       # User profile
    └── services/
        └── APIManager.ts     # API service layer
```

## 🎨 Design Features

### Responsive Layout

- **Desktop (≥768px)**: Fixed sidebar with icons and labels
- **Mobile (<768px)**: Burger menu button that opens drawer overlay
- **Smooth animations**: Drawer slides in/out smoothly
- **Touch-friendly**: All buttons sized for mobile interaction

### FluentUI 9 Components Used

- `FluentProvider` - Theme and design system provider
- `Button` - Interactive buttons with icons
- `Card` - Content containers
- `Drawer` - Mobile navigation overlay
- `Input` - Form inputs with icons
- `Title`, `Body1`, `Text` - Typography components
- Design tokens for consistent styling

### Navigation

- **Home** - Dashboard with welcome message
- **Standings** - League standings view
- **Matches** - Match schedule
- **Profile** - User account details
- **Logout** - Session termination

## 🔐 Authentication Flow

1. **Not Logged In**: Redirect to `/login`
2. **Login Page**: Enter username & password
3. **API Call**: POST to `/api/login`
4. **Success**: Token saved to sessionStorage
5. **Redirect**: Navigate to home page
6. **Protected Routes**: All pages require valid token
7. **Logout**: Clear token and return to login

### Login API

**Endpoint**: `POST /api/login`

**Request**:

```json
{
  "username": "string",
  "password": "string"
}
```

**Response**:

```json
{
  "UserId": "string",
  "UserName": "string",
  "token": "string"
}
```

## ⚙️ Configuration

### API Base URL

Default: `http://localhost:52259/api/`

**Option 1**: Edit `.env` file

```env
REACT_APP_API_BASE_URL=http://your-api-url/api/
```

**Option 2**: Edit `src/services/APIManager.ts`

```typescript
private basePath = "http://your-api-url/api/";
```

### Customize Responsive Breakpoint

Edit `src/App.tsx` - Look for `@media (min-width: 768px)` and `@media (max-width: 767px)`

## 🛠️ Development

### Available Scripts

```powershell
# Start development server (opens browser automatically)
npm start

# Run tests
npm test

# Build for production
npm run build

# Check for TypeScript errors
npm run type-check
```

### Adding New Pages

1. **Create component** in `src/pages/YourPage.tsx`
2. **Add route** in `src/App.tsx`:

```tsx
<Route
  path="/yourpage"
  element={
    <Layout>
      <YourPage />
    </Layout>
  }
/>
```

3. **Add navigation** in Layout component:

```tsx
<NavButton to="/yourpage" icon={<YourIcon24Regular />} text="Your Page" />
```

### Styling with FluentUI

```tsx
import { makeStyles, tokens } from "@fluentui/react-components";

const useStyles = makeStyles({
  myComponent: {
    padding: "16px",
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
  },
});
```

## 📦 Dependencies

### Core

- `react` ^18.2.0
- `react-dom` ^18.2.0
- `typescript` ^4.9.5

### UI & Styling

- `@fluentui/react-components` ^9.72.4
- `@fluentui/react-icons` ^2.0.250

### Routing

- `react-router-dom` ^6.20.0

### Testing

- `@testing-library/react` ^13.4.0
- `@testing-library/jest-dom` ^5.17.0

## 🐛 Troubleshooting

### Dependencies won't install

```powershell
# Clear npm cache
npm cache clean --force

# Install with legacy peer deps
npm install --legacy-peer-deps
```

### Port 3000 is in use

```powershell
# Use different port
$env:PORT=3001
npm start
```

### Can't connect to API

1. Check API is running at `http://localhost:52259`
2. Verify CORS is enabled on backend
3. Check browser console for errors
4. Verify `.env` file has correct API URL

### Build fails

```powershell
# Clear build cache
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
npm run build
```

## 📱 Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile Safari
- ✅ Chrome Mobile

## 🎯 Next Steps

1. **Customize the theme** - Add your brand colors to FluentUI theme
2. **Connect real API** - Update APIManager with your endpoints
3. **Add more pages** - Implement Standings, Matches functionality
4. **Add data fetching** - Use React Query or similar for data management
5. **Add error boundaries** - Graceful error handling
6. **Add loading states** - Skeleton screens and spinners
7. **Add tests** - Unit and integration tests
8. **Deploy** - Build and deploy to production

## 📄 License

Private - Tipsligan Project

---

**Built with ❤️ using React, TypeScript, and FluentUI 9**

Need help? Check the [SETUP GUIDE](../TIPSLIGAN-2026-SETUP-GUIDE.md) for detailed information.
