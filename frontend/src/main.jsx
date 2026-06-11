import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <App />
          <Toaster
            position="top-center"
            containerStyle={{ zIndex: 99999, top: 24 }}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#18181b',
                color: '#f4f4f5',
                border: '1px solid #3f3f46',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                padding: '14px 18px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                maxWidth: '420px',
              },
              success: {
                style: {
                  border: '1px solid rgba(139,92,246,0.4)',
                  background: '#18181b',
                },
                iconTheme: { primary: '#8b5cf6', secondary: '#18181b' },
              },
              error: {
                style: {
                  border: '1px solid rgba(239,68,68,0.5)',
                  background: '#1c1010',
                  color: '#fca5a5',
                },
                iconTheme: { primary: '#ef4444', secondary: '#1c1010' },
              },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </BrowserRouter>
)
