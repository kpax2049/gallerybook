import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getUser } from '@/api/user';
import LoginPage from './Login';
import { toast } from '@/hooks/use-toast';
import {
  endAuthSession,
  setAccessToken,
  startAuthSession,
} from '@/lib/authSession';

export function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.hash.slice(1) || window.location.search.slice(1)
    );
    const accessToken = params.get('accessToken');

    if (!accessToken) {
      navigate('/login', { replace: true });
      return;
    }

    setAccessToken(accessToken);
    window.history.replaceState(null, '', '/auth/oauth/callback');

    getUser()
      .then(async (user) => {
        await startAuthSession(user);
        navigate('/', { replace: true, viewTransition: true });
      })
      .catch(async () => {
        try {
          await endAuthSession();
        } catch {
          // Local session state is still cleared.
        }
        toast({
          variant: 'destructive',
          title: 'Sign-in failed',
          description: 'Your account could not be loaded. Please try again.',
        });
        navigate('/login', { replace: true });
      });
  }, [navigate]);

  return (
    <LoginPage>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Signing you in</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          Please wait while your account is loaded.
        </CardContent>
      </Card>
    </LoginPage>
  );
}
