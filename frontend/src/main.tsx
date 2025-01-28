import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import { LoginForm } from './app/login/LoginForm';
import { SignupForm } from './app/signup/SignupForm';
import NotFoundPage from './app/notfound/NotFoundPage';
import GalleryList from './app/gallery/GalleryList';
import UserList from './app/user/UserList';
import { Toaster } from './components/ui/toaster';
import { ThemeProvider } from './components/theme-provider';
import Page from './app/dashboard/page';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <NotFoundPage />,
  },
  {
    path: '/login',
    element: <LoginForm />,
  },
  {
    path: '/signup',
    element: <SignupForm />,
  },
  {
    path: '/admin/users',
    element: <UserList />,
  },
  {
    path: '/user/profile',
    element: <Page />,
  },
  {
    path: '/galleries',
    element: <GalleryList />,
  },
  {
    path: '/galleries/:galleryId',
    // element: <GalleryView />,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Toaster />
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>
);
