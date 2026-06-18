import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { PasswordInput } from '@/components/ui/password-input';
import { authUser, getOAuthLoginUrl, signout } from '@/api/auth';
import { getUser, User } from '@/api/user';
import { toast } from '@/hooks/use-toast';
import LoginPage from './Login';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  email: z.string().min(2, 'Email must be at least 2 characters.').email('This is not a valid email.'),
  password: z.string().min(2, 'Password must be at least 8 characters.'),
});

type LoginFormProps = {
  className?: string;
  handleLogin: (u: User) => void;
  props?: React.ComponentPropsWithoutRef<'div'>;
};

export function LoginForm({
  className,
  handleLogin,
  ...props
}: LoginFormProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    authUser({ email: values.email, password: values.password })
      .then(async (response) => {
        localStorage.setItem('ACCESS_TOKEN', response.accessToken);
        try {
          const user: User = await getUser();
          handleLogin(user);
          setLoading(false);
          navigate('/', { viewTransition: true });
        } catch {
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
          setLoading(false);
        }
      })
      .catch(() => {
        setLoading(false);
      });
  }

  return (
    <LoginPage>
      <div className={cn('space-y-5', className)} {...props}>
        <header>
          <p className="gb-hand text-[34px] font-bold leading-none text-[#94794f]">
            Welcome back!
          </p>
          <p className="gb-serif mt-1 text-base italic text-[#6f604c]">
            Sign in to your shelf
          </p>
        </header>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <Label className="text-[#4f4233]">Email</Label>
                  <FormControl>
                    <Input
                      className="h-11 rounded-[11px] border-[#d8c9b7] bg-[#fffdf8] text-[#33271a] placeholder:text-[#9a8469] focus-visible:ring-[#2f9d7d]"
                      placeholder="you@example.com"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password" className="text-[#4f4233]">
                  Password
                </Label>
                <a
                  href="#"
                  className="ml-auto text-sm font-medium text-[#2f7d66] underline-offset-4 hover:underline"
                >
                  Forgot?
                </a>
              </div>
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <PasswordInput
                        id="password"
                        className="h-11 rounded-[11px] border-[#d8c9b7] bg-[#fffdf8] text-[#33271a] placeholder:text-[#9a8469] focus-visible:ring-[#2f9d7d]"
                        placeholder="Password"
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-between gap-3 text-sm text-[#6f604c]">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[#d8c9b7] accent-[#2f9d7d]"
                />
                Remember me
              </label>
            </div>

            <Button
              type="submit"
              className="h-12 w-full rounded-[11px] bg-[#2f9d7d] text-[#f3fffb] shadow-[0_14px_24px_-16px_rgba(47,157,125,.9)] hover:bg-[#288c70]"
              loading={loading}
            >
              {loading ? 'Opening...' : 'Open my album'}
            </Button>

            <div className="relative py-1 text-center text-[11px] uppercase tracking-[.16em] text-[#9a8469] after:absolute after:inset-x-0 after:top-1/2 after:border-t after:border-[#d8c9b7]">
              <span className="relative z-10 bg-[var(--gb-paper)] px-3">or</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-11 justify-center rounded-[11px] border-[#d8c9b7] bg-[#fffdf8] text-[#33271a] shadow-none hover:bg-[#f3eadb]"
                asChild
              >
                <a href={getOAuthLoginUrl('google')}>
                  <GoogleMark />
                  Google
                </a>
              </Button>
              <Button
                variant="outline"
                className="h-11 justify-center rounded-[11px] border-[#d8c9b7] bg-[#fffdf8] text-[#33271a] shadow-none hover:bg-[#f3eadb]"
                asChild
              >
                <a href={getOAuthLoginUrl('github')}>
                  <GitHubMark />
                  GitHub
                </a>
              </Button>
            </div>
          </form>
        </Form>

        <p className="text-center text-xs leading-5 text-[#7c6a54]">
          By continuing, you agree to our{' '}
          <Link to="/terms" className="font-medium underline underline-offset-4">
            Terms
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="font-medium underline underline-offset-4">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </LoginPage>
  );
}

function GoogleMark() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
        fill="currentColor"
      />
    </svg>
  );
}

function GitHubMark() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.745.083-.729.083-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.835 2.807 1.305 3.492.998.108-.776.418-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.382 1.235-3.222-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.912 1.23 3.222 0 4.61-2.805 5.625-5.475 5.922.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
        fill="currentColor"
      />
    </svg>
  );
}
