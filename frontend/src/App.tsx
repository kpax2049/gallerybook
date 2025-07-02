import { Navigate, Outlet, Route, Routes, useNavigate } from 'react-router';
import './App.css';
import { useEffect, useState } from 'react';
import { getUser, User } from './api/user';
import { UserRole } from './common/enums';
import Dashboard from './app/dashboard/Dashboard';
import UserList from './app/user/UserList';
import { LoginForm } from './app/login/LoginForm';
import { SignupForm } from './app/signup/SignupForm';
import { GalleryEditor } from './app/gallery/GalleryEditor';
import GalleryList from './app/gallery/GalleryList';
import GalleryPage from './app/gallery/Gallery';
import { GalleryExistingEditor } from './app/gallery/GalleryExistingEditor';
import { useUserStore } from '@/stores/userStore';

const Landing = () => {
  return <h2>Landing (Public: anyone can access this page)</h2>;
};

const Home = () => {
  return <h2>Home (Protected: authenticated user required)</h2>;
};

const Dashboard1 = () => {
  return <h2>Dashboard (Protected: authenticated user required)</h2>;
};

const Analytics = () => {
  return (
    <h2>
      Analytics (Protected: authenticated user with permission 'analyze'
      required)
    </h2>
  );
};

const Admin = () => {
  return (
    <h2>Admin (Protected: authenticated user with role 'admin' required)</h2>
  );
};

type ProtectedRouteProps = {
  isAllowed: boolean;
  redirectPath?: string;
  children?: React.ReactNode;
};

const ProtectedRoute = ({
  isAllowed,
  redirectPath = '/',
  children,
}: ProtectedRouteProps) => {
  if (!isAllowed) {
    return <Navigate to={redirectPath} replace />;
  }

  return children ? children : <Outlet />;
};

const App = () => {
  // const [user, setUser] = useState<User | null>(null);
  // const ProtectedRoutes = () => {
  //   // TODO: Use authentication token
  //   const localStorageToken = localStorage.getItem('ACCESS_TOKEN');

  //   return localStorageToken ? <Dashboard /> : <Navigate to="/login" replace />;
  // };
  const setGlobalUser = useUserStore((state) => state.setUser);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getUser().then((user: User) => {
      setGlobalUser(user);
    });
  }, [setGlobalUser]);

  const handleLogin = (user: User) => {
    setUser(user);
  };

  const handleLogout = () => {
    setUser(null);
    // Clear user in Zustand store
    useUserStore.getState().clearUser();
    navigate('/login');
  };

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={<Dashboard user={user} handleLogout={handleLogout} />}
        >
          <Route index element={<Landing />} />

          <Route
            element={
              //TODO: temporarly disable authentication
              <ProtectedRoute isAllowed={true} redirectPath="/login" />
              // <ProtectedRoute isAllowed={!!user} redirectPath="/login" />
            }
          >
            <Route path="home" element={<Home />} />
            <Route path="dashboard" element={<Dashboard1 />} />
            <Route path="admin/users" element={<UserList />} />
            <Route path="galleries" element={<GalleryList />} />
            <Route path="galleries/:galleryId" element={<GalleryPage />} />
            <Route path="gallery/new" element={<GalleryEditor />} />
            {/* <Route
              path="gallery/minimal-tiptap"
              element={<GalleryMinimalTiptapEditor />}
            /> */}
            <Route
              path="gallery/edit/:galleryId"
              element={<GalleryExistingEditor />}
            />
          </Route>
          <Route
            path="analytics"
            element={
              <ProtectedRoute
                redirectPath="/home"
                isAllowed={!!user && user.role === UserRole.ADMIN} //!!user && user.permissions.includes('analyze')}
              >
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin"
            element={
              <ProtectedRoute
                redirectPath="/home"
                isAllowed={!!user && user.role === UserRole.ADMIN}
              >
                <Admin />
              </ProtectedRoute>
            }
          ></Route>
        </Route>
        <Route
          path="/login"
          element={<LoginForm handleLogin={handleLogin} />}
        />
        <Route path="/signup" element={<SignupForm />} />

        <Route path="*" element={<p>There's nothing here: 404!</p>} />
      </Routes>
    </>
  );

  // const router = createBrowserRouter([
  //   {
  //     path: '/',
  //     element: <LoginForm />,
  //     index: true,
  //   },
  //   {
  //     // element: <ProtectedRoutes />,
  //     element: <ProtectedRoute isAuthenticated={isAuthenticated()} />,
  //     children: [
  //       {
  //         path: '/admin/users',
  //         element: <UserList />,
  //       },
  //       {
  //         path: '/galleries',
  //         element: <Gallery />,
  //       },
  //       // {
  //       //   path: '/route3',
  //       //   element: <Screen3 />,
  //       // },
  //     ],
  //   },
  //   {
  //     path: '*',
  //     element: <NotFoundPage />,
  //   },
  // ]);
  // return <RouterProvider router={router} />;
};

export default App;
