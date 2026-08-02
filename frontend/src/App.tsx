import { Navigate, Outlet, Route, Routes, useNavigate } from 'react-router';
import './App.css';
import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { getUser } from './api/user';
import { UserRole } from './common/enums';
import Dashboard from './app/dashboard/Dashboard';
import UserList from './app/user/UserList';
import { LoginForm } from './app/login/LoginForm';
import { OAuthCallback } from './app/login/OAuthCallback';
import { SignupForm } from './app/signup/SignupForm';
import { PendingActivation } from './app/signup/PendingActivation';
// import GalleryList from './app/gallery/GalleryList';
import { useUserStore } from '@/stores/userStore';
import GalleriesPage from './app/gallery/GalleriesPage';
import CommentsPage from './app/comment/CommentsPage';
import GalleriesLayout from './app/gallery/GalleriesLayout';
import FollowingPage from './app/following/FollowingPage';
import { LegalPage } from './app/legal/LegalPage';
import { UNAUTHORIZED_SESSION_EVENT } from './lib/apiClient';
import { PublicFolderPage } from './app/folder/PublicFolderPage';
import { Loader2 } from 'lucide-react';
import {
  clearAuthSession,
  endAuthSession,
  getAuthSessionRevision,
  isAuthSessionRevisionCurrent,
  startAuthSession,
} from '@/lib/authSession';

const GalleryPage = lazy(() => import('./app/gallery/Gallery'));
const GalleryEditor = lazy(() =>
  import('./app/gallery/GalleryEditor').then((module) => ({
    default: module.GalleryEditor,
  }))
);

function DeferredRoute({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-[40vh] items-center justify-center"
          role="status"
          aria-label="Loading page"
        >
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

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
  isLoading?: boolean;
  redirectPath?: string;
  children?: React.ReactNode;
};

const ProtectedRoute = ({
  isAllowed,
  isLoading = false,
  redirectPath = '/',
  children,
}: ProtectedRouteProps) => {
  if (isLoading) {
    return null;
  }

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
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const sessionRevision = getAuthSessionRevision();

    (async () => {
      try {
        const user = await getUser({
          suppressUnauthorizedRedirect: true,
        });
        if (cancelled || !isAuthSessionRevisionCurrent(sessionRevision)) {
          return;
        }
        await startAuthSession(user);
      } catch {
        if (!cancelled && isAuthSessionRevisionCurrent(sessionRevision)) {
          clearAuthSession();
        }
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleUnauthorizedSession = () => {
      clearAuthSession();
      navigate('/login', { replace: true });
    };

    window.addEventListener(
      UNAUTHORIZED_SESSION_EVENT,
      handleUnauthorizedSession
    );
    return () => {
      window.removeEventListener(
        UNAUTHORIZED_SESSION_EVENT,
        handleUnauthorizedSession
      );
    };
  }, [navigate]);
  // useEffect(() => {
  //   getUser().then((user: User) => {
  //     setGlobalUser(user);
  //   })
  // }, [setGlobalUser]);

  // const loadFollow = useFollowStore((s) => s.load);
  // useEffect(() => {
  //   loadFollow();
  // }, [loadFollow]);

  const handleLogout = async () => {
    try {
      await endAuthSession();
    } catch {
      // Local session state is cleared even if server sign-out fails.
    }
    navigate('/login');
  };

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={<Dashboard user={user} handleLogout={handleLogout} />}
        >
          <Route
            index
            element={
              <ProtectedRoute
                isAllowed={!!user}
                isLoading={!authReady}
                redirectPath="/login"
              >
                <Navigate to="/galleries" replace />
              </ProtectedRoute>
            }
          />

          <Route
            element={
              <ProtectedRoute
                isAllowed={!!user}
                isLoading={!authReady}
                redirectPath="/login"
              />
            }
          >
            <Route path="home" element={<Home />} />
            <Route path="dashboard" element={<Dashboard1 />} />
            <Route
              path="admin/users"
              element={
                <ProtectedRoute
                  isAllowed={!!user && user.role === UserRole.ADMIN}
                  isLoading={!authReady}
                  redirectPath="/galleries"
                >
                  <UserList />
                </ProtectedRoute>
              }
            />
            <Route path="galleries" element={<GalleriesLayout />}>
              <Route index element={<GalleriesPage />} /> {/* /galleries */}
              <Route
                path=":slug"
                element={
                  <DeferredRoute>
                    <GalleryPage />
                  </DeferredRoute>
                }
              />
              <Route
                path="new"
                element={
                  <ProtectedRoute
                    isAllowed={!!user && user.role === UserRole.ADMIN}
                    isLoading={!authReady}
                    redirectPath="/galleries"
                  >
                    <DeferredRoute>
                      <GalleryEditor />
                    </DeferredRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="edit/:galleryId"
                element={
                  <ProtectedRoute
                    isAllowed={!!user && user.role === UserRole.ADMIN}
                    isLoading={!authReady}
                    redirectPath="/galleries"
                  >
                    <DeferredRoute>
                      <GalleryEditor mode="edit" />
                    </DeferredRoute>
                  </ProtectedRoute>
                }
              />
            </Route>
            {/* <Route path="galleries" element={<GalleriesPage />} />
            <Route path="galleries/:galleryId" element={<GalleryPage />} /> */}
            {/* <Route path="comments" element={<GalleriesPage />} /> */}
            <Route path="/me/comments" element={<CommentsPage />} />
            <Route path="/me/following" element={<FollowingPage />} />
            {/* <Route
              path="gallery/minimal-tiptap"
              element={<GalleryMinimalTiptapEditor />}
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
        <Route path="/login" element={<LoginForm />} />
        <Route
          path="/terms"
          element={
            <>
              <LoginForm />
              <LegalPage type="terms" />
            </>
          }
        />
        <Route
          path="/privacy"
          element={
            <>
              <LoginForm />
              <LegalPage type="privacy" />
            </>
          }
        />
        <Route path="/auth/oauth/callback" element={<OAuthCallback />} />
        <Route
          path="/folders/:username/:folderSlug"
          element={<PublicFolderPage />}
        />
        <Route
          path="/shared/galleries/:galleryId"
          element={
            <DeferredRoute>
              <GalleryPage publicView />
            </DeferredRoute>
          }
        />
        <Route path="/signup" element={<SignupForm />} />
        <Route path="/account/pending" element={<PendingActivation />} />

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
