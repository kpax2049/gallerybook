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
            <Route path="/me/comments" element={<CommentsPage />} />
            <Route path="/me/following" element={<FollowingPage />} />
          </Route>
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
};

export default App;
