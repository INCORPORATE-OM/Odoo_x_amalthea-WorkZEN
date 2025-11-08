# Troubleshooting Blank Page

## Quick Fix Steps

1. **Open Browser Console (F12)** and check for errors
2. **Check if backend is running** on `http://localhost:3000`
3. **Clear browser cache and localStorage:**
   - Open DevTools (F12)
   - Go to Application tab
   - Clear Local Storage
   - Refresh page

## Test if React is Working

Temporarily modify `frontend/src/App.tsx`:

```tsx
function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>React is Working!</h1>
      <p>If you see this, React is rendering correctly.</p>
    </div>
  );
}
```

If this works, the issue is in the routing/auth. If not, check:
- Browser console for errors
- Network tab for failed requests
- Terminal for build errors

## Common Issues

### 1. Backend Not Running
- Make sure backend is running on port 3000
- Test: `http://localhost:3000/api/health`

### 2. CORS Issues
- Backend has CORS enabled, but check browser console

### 3. API Connection
- Check Network tab in DevTools
- Look for failed requests to `/api/auth/profile`

### 4. Build Errors
- Run `npm install` in frontend directory
- Check terminal for TypeScript errors

## Debug Mode

Add this to `frontend/src/App.tsx` temporarily:

```tsx
console.log('App component rendering');
console.log('User:', user);
console.log('Loading:', loading);
```

