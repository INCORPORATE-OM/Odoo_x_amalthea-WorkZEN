# WorkZen HRMS - Frontend

React + TypeScript frontend for WorkZen HRMS application.

## 🚀 Tech Stack

- **React 18** with TypeScript
- **Vite** - Build tool and dev server
- **React Router** - Routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling

## 📦 Installation

```bash
cd frontend
npm install
```

## 🏃 Running the Frontend

```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

**Note**: Make sure the backend is running on `http://localhost:3000`

## 🔧 Configuration

The frontend is configured to proxy API requests to the backend. Update `vite.config.ts` if your backend runs on a different port.

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable components
│   ├── contexts/       # React contexts (Auth)
│   ├── lib/            # Utilities (API client)
│   ├── pages/          # Page components
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── public/             # Static assets
└── index.html          # HTML template
```

## 🔐 Default Login Credentials

- **Admin**: `admin@workzen.com` / `Admin@123`
- **HR Officer**: `hr@workzen.com` / `HR@123`
- **Payroll Officer**: `payroll@workzen.com` / `Payroll@123`
- **Employee**: `employee@workzen.com` / `Employee@123`

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🌐 Pages

- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Dashboard (all roles)
- `/attendance` - Attendance management
- `/leaves` - Leave management
- `/payroll` - Payroll view
- `/users` - User management (Admin/HR only)

