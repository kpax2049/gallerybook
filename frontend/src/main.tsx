import { createRoot } from 'react-dom/client';
import './index.css';
// import { BrowserRouter } from 'react-router';
import App from './App';
import { StrictMode } from 'react';
import { ThemeProvider } from './components/theme-provider';
import { Toaster } from './components/ui/toaster';
import { BrowserRouter } from 'react-router-dom';

// const router = createBrowserRouter([
//   {
//     element: <Dashboard />,
//     children: [
//       {
//         path: '/',
//         index: true,
//         element: <App />,
//         errorElement: <NotFoundPage />,
//       },
//       {
//         path: '/login',
//         element: <LoginForm />,
//       },
//       {
//         path: '/signup',
//         element: <SignupForm />,
//       },
//       {
//         path: '/admin/users',
//         element: <UserList />,
//       },
//       {
//         path: '/user/profile',
//         element: <Dashboard />,
//       },
//       {
//         path: '/galleries',
//         element: <GalleryList />,
//       },
//       {
//         path: '/galleries/:galleryId',
//         // element: <GalleryView />,
//       },
//     ],
//   },
// ]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <BrowserRouter>
        <Toaster />
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
