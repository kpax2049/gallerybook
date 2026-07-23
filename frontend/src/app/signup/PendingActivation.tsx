import { useEffect } from 'react';
import { Clock3, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import LoginPage from '../login/Login';

export function PendingActivation() {
  useEffect(() => {
    localStorage.removeItem('ACCESS_TOKEN');
  }, []);

  return (
    <LoginPage showSignupLink={false}>
      <div className="space-y-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#dceee7] text-[#27755e]">
          <Clock3 className="size-6" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h1 className="gb-serif text-2xl font-semibold text-[#3f3327]">
            Approval pending
          </h1>
          <p className="text-sm leading-6 text-[#6f604c]">
            Your account has been created and is waiting for an administrator to
            activate it. You can sign in once it has been approved.
          </p>
        </div>
        <Button
          asChild
          className="h-11 w-full bg-[#2f9d7d] text-white hover:bg-[#288c70]"
        >
          <Link to="/login" viewTransition>
            <LogIn className="size-4" aria-hidden="true" />
            Return to sign in
          </Link>
        </Button>
      </div>
    </LoginPage>
  );
}
