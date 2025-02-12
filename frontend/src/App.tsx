import { Navigate, Outlet, Route, Routes } from 'react-router';
import './App.css';
import { useState } from 'react';
import { User } from './api/user';
import { UserRole } from './common/enums';
import Dashboard from './app/dashboard/Dashboard';
import UserList from './app/user/UserList';
import { LoginForm } from './app/login/LoginForm';
import { SignupForm } from './app/signup/SignupForm';

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
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (user: User) => {
    setUser(user);
  };

  const handleLogout = () => setUser(null);

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
              <ProtectedRoute isAllowed={!!user} redirectPath="/login" />
            }
          >
            <Route path="home" element={<Home />} />
            <Route path="dashboard" element={<Dashboard1 />} />
            <Route path="admin/users" element={<UserList />} />
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
