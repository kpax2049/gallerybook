import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import { LoginForm } from './components/login/LoginForm';
import { SignupForm } from './components/signup/SignupForm';
import NotFoundPage from './components/notfound/NotFoundPage';
import GalleryList from './components/gallery/GalleryList';
import UserList from './components/admin/user/UserList';

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
    <RouterProvider router={router} />
  </StrictMode>
);
