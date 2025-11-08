# Frontend Setup Instructions

## Quick Start

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   The frontend will be available at `http://localhost:5173`

## Important Notes

- **Backend must be running** on `http://localhost:3000` before starting the frontend
- The frontend is configured to proxy API requests to the backend automatically
- Default login credentials are available in the backend seed script

## Default Login Credentials

- **Admin**: `admin@workzen.com` / `Admin@123`
- **HR Officer**: `hr@workzen.com` / `HR@123`
- **Payroll Officer**: `payroll@workzen.com` / `Payroll@123`
- **Employee**: `employee@workzen.com` / `Employee@123`

## Features

✅ Authentication (Login/Register)
✅ Dashboard with statistics
✅ Attendance management (Check-in/Check-out)
✅ Leave management (Apply for leave)
✅ Payroll viewing
✅ User management (Admin/HR only)
✅ Role-based access control
✅ Responsive design with Tailwind CSS

## Troubleshooting

If you encounter issues:

1. Make sure the backend is running on port 3000
2. Check that all dependencies are installed: `npm install`
3. Clear browser cache and localStorage if authentication issues occur
4. Check browser console for any error messages

