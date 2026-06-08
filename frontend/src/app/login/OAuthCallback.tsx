import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getUser, User } from '@/api/user';
import LoginPage from './Login';
import { signout } from '@/api/auth';
import { toast } from '@/hooks/use-toast';

type OAuthCallbackProps = {
  handleLogin: (u: User) => void;
};

export function OAuthCallback({ handleLogin }: OAuthCallbackProps) {
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

    localStorage.setItem('ACCESS_TOKEN', accessToken);
    window.history.replaceState(null, '', '/auth/oauth/callback');

    getUser()
      .then((user: User) => {
        handleLogin(user);
        navigate('/', { replace: true, viewTransition: true });
      })
      .catch(async () => {
        localStorage.removeItem('ACCESS_TOKEN');
        try {
          await signout();
        } catch {
          // The session may already be unusable.
        }
        toast({
          variant: 'default',
          title: 'Approval pending',
          description: 'Your account is waiting for admin approval.',
        });
        navigate('/login', { replace: true });
      });
  }, [handleLogin, navigate]);

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
