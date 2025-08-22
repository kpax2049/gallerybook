import { useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AvatarUpload } from './AvatarUpload';
import { useUserStore } from '@/stores/userStore';
import {
  changePassword,
  ChangePasswordResponse,
  verifyCurrentPassword,
} from '@/api/auth';
import { toast } from '@/hooks/use-toast';

const profileSchema = z.object({
  fullName: z.string().min(1, { message: 'Name is required.' }),
  username: z
    .string()
    .min(3, { message: 'Username must be at least 3 characters.' }),
});

// Keep server calls OUT of schema — validation should be synchronous/local only.
const passwordSchema = z
  .object({
    current: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters.' }),
    next: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters.' }),
    confirmNext: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters.' }),
  })
  .superRefine(({ current, next, confirmNext }, ctx) => {
    if (current === next) {
      ctx.addIssue({
        code: 'custom',
        path: ['next'],
        message: 'New password must be different from current password.',
      });
    }
    if (confirmNext !== next) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmNext'],
        message: 'Passwords do not match.',
      });
    }
  });

export type ProfileForm = z.infer<typeof profileSchema>;
export type PasswordForm = z.infer<typeof passwordSchema>;

export function UserProfileEditor() {
  const initial = useUserStore((s) => s.user);

  // --- Profile form ---
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors, isSubmitting: isSubmittingProfile },
    reset: resetProfile,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: '', username: '' },
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  useEffect(() => {
    if (!initial) return;
    resetProfile({
      fullName: initial.fullName ?? '',
      username: initial.username ?? '',
    });
  }, [initial, resetProfile]);

  // --- Password form ---
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors, isSubmitting: isSubmittingPassword },
    reset: resetPassword,
    setError,
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema), // only local checks
    defaultValues: { current: '', next: '', confirmNext: '' },
    mode: 'onSubmit',
    reValidateMode: 'onSubmit', // avoid onChange validation after a failed submit
  });

  // --------------- Handlers ---------------
  async function onSubmitProfile(values: ProfileForm) {
    console.log('profile ->', values);
    // await fetch('/api/account/profile', { method: 'PUT', body: JSON.stringify(values) })
  }

  async function onSubmitPassword(values: PasswordForm) {
    // 1) Verify current password — ONLY when user submits
    try {
      const { valid } = (await verifyCurrentPassword({
        currentPassword: values.current,
      })) as { valid: boolean };

      if (!valid) {
        setError('current', {
          type: 'manual',
          message: 'Current password is incorrect.',
        });
        return; // <- do not proceed to change password
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      const status = e?.status || e?.response?.status;
      if (status === 429) {
        setError('current', {
          type: 'manual',
          message: 'Too many attempts. Please wait and try again.',
        });
        return;
      }
      setError('current', {
        type: 'server',
        message: 'Could not verify password. Please try again.',
      });
      return;
    }

    // 2) Change password
    try {
      const data: ChangePasswordResponse = await changePassword({
        currentPassword: values.current,
        newPassword: values.next,
      });

      if (data?.accessToken) {
        localStorage.setItem('ACCESS_TOKEN', data.accessToken);
      }

      resetPassword({ current: '', next: '', confirmNext: '' });
      toast({
        variant: 'default',
        title: 'Success',
        description: `${initial?.username}, your password was successfully updated!`,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    } catch (e: any) {
      setError('next', {
        type: 'server',
        message: 'Could not update password. Please try again.',
      });
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>

        {/* --- Account tab --- */}
        <TabsContent
          value="account"
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted-foreground/20 focus-visible:ring-offset-0"
        >
          <form
            onSubmit={handleSubmitProfile(onSubmitProfile)}
            id="profileForm"
          >
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>
                  Make changes to your account here. Click save when you&apos;re
                  done.
                </CardDescription>
              </CardHeader>

              <CardContent className="grid gap-6">
                <AvatarUpload />

                <div className="grid gap-2">
                  <Label htmlFor="user-profile-fullName">Name</Label>
                  <Input
                    id="user-profile-fullName"
                    autoComplete="name"
                    {...registerProfile('fullName')}
                    aria-invalid={!!profileErrors.fullName}
                  />
                  {profileErrors.fullName && (
                    <p className="text-sm text-destructive">
                      {profileErrors.fullName.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="user-profile-username">Username</Label>
                  <Input
                    id="user-profile-username"
                    autoComplete="username"
                    {...registerProfile('username')}
                    aria-invalid={!!profileErrors.username}
                  />
                  {profileErrors.username && (
                    <p className="text-sm text-destructive">
                      {profileErrors.username.message}
                    </p>
                  )}
                </div>
              </CardContent>

              <CardFooter>
                <Button type="submit" disabled={isSubmittingProfile}>
                  {isSubmittingProfile ? 'Saving…' : 'Save changes'}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        {/* --- Password tab --- */}
        <TabsContent value="password">
          <form
            onSubmit={handleSubmitPassword(onSubmitPassword)}
            id="passwordForm"
          >
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  Change your password here. After saving, you&apos;ll be logged
                  out.
                </CardDescription>
              </CardHeader>

              <CardContent className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="user-profile-current">Current password</Label>
                  <Input
                    id="user-profile-current"
                    type="password"
                    placeholder="Current password"
                    autoComplete="current-password"
                    {...registerPassword('current')}
                    aria-invalid={!!passwordErrors.current}
                  />
                  {passwordErrors.current && (
                    <p className="text-sm text-destructive">
                      {passwordErrors.current.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="user-profile-next">New password</Label>
                  <Input
                    id="user-profile-next"
                    type="password"
                    placeholder="New password"
                    autoComplete="new-password"
                    {...registerPassword('next')}
                    aria-invalid={!!passwordErrors.next}
                  />
                  {passwordErrors.next && (
                    <p className="text-sm text-destructive">
                      {passwordErrors.next.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="user-profile-confirmNext">
                    Confirm new password
                  </Label>
                  <Input
                    id="user-profile-confirmNext"
                    type="password"
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    {...registerPassword('confirmNext')}
                    aria-invalid={!!passwordErrors.confirmNext}
                  />
                  {passwordErrors.confirmNext && (
                    <p className="text-sm text-destructive">
                      {passwordErrors.confirmNext.message}
                    </p>
                  )}
                </div>
              </CardContent>

              <CardFooter>
                <Button type="submit" disabled={isSubmittingPassword}>
                  {isSubmittingPassword ? 'Saving…' : 'Save password'}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
