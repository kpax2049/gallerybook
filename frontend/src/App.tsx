import { Navigate, Outlet, Route, Routes, useNavigate } from 'react-router';
import './App.css';
import { useEffect } from 'react';
import { getUser, User } from './api/user';
import { UserRole } from './common/enums';
import Dashboard from './app/dashboard/Dashboard';
import UserList from './app/user/UserList';
import { LoginForm } from './app/login/LoginForm';
import { SignupForm } from './app/signup/SignupForm';
import { GalleryEditor } from './app/gallery/GalleryEditor';
// import GalleryList from './app/gallery/GalleryList';
import GalleryPage from './app/gallery/Gallery';
import { GalleryExistingEditor } from './app/gallery/GalleryExistingEditor';
import { useUserStore } from '@/stores/userStore';
import GalleriesPage from './app/gallery/GalleriesPage';
import CommentsPage from './app/comment/CommentsPage';
import GalleriesLayout from './app/gallery/GalleriesLayout';

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
  // const ProtectedRoutes = () => {
  //   // TODO: Use authentication token
  //   const localStorageToken = localStorage.getItem('ACCESS_TOKEN');

  //   return localStorageToken ? <Dashboard /> : <Navigate to="/login" replace />;
  // };
  const setGlobalUser = useUserStore((state) => state.setUser);
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    getUser().then((user: User) => {
      setGlobalUser(user);
    });
  }, [setGlobalUser]);

  const handleLogin = (user: User) => {
    setGlobalUser(user);
  };

  const handleLogout = () => {
    // Clear user in Zustand store and reset local storage
    useUserStore.getState().clearUser();
    localStorage.removeItem('ACCESS_TOKEN');
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
            <Route path="galleries" element={<GalleriesLayout />}>
              <Route index element={<GalleriesPage />} /> {/* /galleries */}
              <Route path=":slug" element={<GalleryPage />} />
              <Route path="new" element={<GalleryEditor />} />
              <Route
                path="edit/:galleryId"
                element={<GalleryExistingEditor />}
              />
            </Route>
            {/* <Route path="galleries" element={<GalleriesPage />} />
            <Route path="galleries/:galleryId" element={<GalleryPage />} /> */}
            {/* <Route path="comments" element={<GalleriesPage />} /> */}
            <Route path="/me/comments" element={<CommentsPage />} />
            {/* <Route
              path="gallery/minimal-tiptap"
              element={<GalleryMinimalTiptapEditor />}
            /> */}
            {/* <Route
              path="galleries/edit/:galleryId"
              element={<GalleryExistingEditor />}
            /> */}
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
