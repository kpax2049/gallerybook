 
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, useNavigate } from 'react-router-dom';
import LoginPage from './Login';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../components/ui/form';
import { PasswordInput } from '../../components/ui/password-input';
import { authUser, getOAuthLoginUrl, signout } from '@/api/auth';
import { getUser, User } from '@/api/user';
import { toast } from '@/hooks/use-toast';

const formSchema = z.object({
  email: z
    .string()
    .min(2, {
      message: 'Email must be at least 2 characters.',
    })
    .email('This is not a valid email.'),
  password: z.string().min(2, {
    message: 'Password must be at least 8 characters.',
  }),
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
  const [loading, setLoading] = useState<boolean>(false);
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
      <div
        className={cn('flex flex-col gap-6 text-white', className)}
        {...props}
      >
        <Card className="border-0 bg-transparent shadow-none">
          <CardHeader className="px-0 pb-5 text-left">
            <div className="mb-2 inline-flex w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
              Account access
            </div>
            <CardTitle className="text-3xl tracking-normal text-white">
              Sign in
            </CardTitle>
            <CardDescription className="text-sm leading-6 text-white/78">
              Use Google, GitHub, or your email and password.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="grid gap-5">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Button
                      variant="outline"
                      className="h-12 justify-start rounded-lg border-white/22 bg-white/10 px-4 text-white shadow-none hover:border-white/45 hover:bg-white/18 hover:text-white"
                      asChild
                    >
                      <a href={getOAuthLoginUrl('github')}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.745.083-.729.083-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.835 2.807 1.305 3.492.998.108-.776.418-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.382 1.235-3.222-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.912 1.23 3.222 0 4.61-2.805 5.625-5.475 5.922.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                            fill="currentColor"
                          />
                        </svg>
                        GitHub
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 justify-start rounded-lg border-white/22 bg-white/10 px-4 text-white shadow-none hover:border-white/45 hover:bg-white/18 hover:text-white"
                      asChild
                    >
                      <a href={getOAuthLoginUrl('google')}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                            fill="currentColor"
                          />
                        </svg>
                        Google
                      </a>
                    </Button>
                  </div>
                  <div className="relative py-1 text-center text-xs uppercase tracking-[0.18em] after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-white/24">
                    <span className="relative z-10 bg-[#0f0d0b] px-2 text-white/72">
                      Or use email
                    </span>
                  </div>

                  <div className="grid gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Email</FormLabel>
                          <FormControl>
                            <Input
                              className="h-12 rounded-lg border-white/20 bg-black/35 text-white placeholder:text-white/45 focus-visible:ring-white/55"
                              placeholder="you@example.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid gap-2">
                      <div className="flex items-center">
                        <Label htmlFor="password" className="text-white">
                          Password
                        </Label>
                        <a
                          href="#"
                          className="ml-auto text-sm text-white/82 underline-offset-4 hover:text-white hover:underline"
                        >
                          Forgot your password?
                        </a>
                      </div>
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <PasswordInput
                                className="h-12 rounded-lg border-white/20 bg-black/35 text-white placeholder:text-white/45 focus-visible:ring-white/55"
                                placeholder="Password"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="h-12 w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                      loading={loading}
                    >
                      {loading ? 'Logging in...' : 'Login'}
                    </Button>
                  </div>
                  <div className="rounded-lg border border-white/18 bg-white/10 px-4 py-3 text-center text-sm text-white/82">
                    New here?{' '}
                    <Link
                      className="font-medium text-white underline underline-offset-4"
                      to="/signup"
                      viewTransition
                    >
                      Create an account
                    </Link>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        <div className="text-balance border-t border-white/20 pt-4 text-center text-xs leading-5 text-white/72 [&_a]:font-medium [&_a]:text-white [&_a]:underline [&_a]:underline-offset-4">
          By clicking continue, you agree to our{' '}
          <Link to="/terms">Terms of Service</Link> and{' '}
          <Link to="/privacy">Privacy Policy</Link>.
        </div>
      </div>
    </LoginPage>
  );
}
