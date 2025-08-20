// import { AppWindowIcon, CodeIcon } from 'lucide-react';

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
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useUserStore } from '@/stores/userStore';
export interface UserProfileFormDataProps {
  fullName: string;
  username: string;
}
interface UserProfileEditorProps {
  setOpen: Dispatch<SetStateAction<boolean>>;
  onSubmit: (
    formData: UserProfileFormDataProps,
    setOpen: Dispatch<SetStateAction<boolean>>
  ) => void;
}
export function UserProfileEditor({
  onSubmit,
  setOpen,
}: UserProfileEditorProps) {
  const initial = useUserStore((state) => state.user);
  const [formData, setFormData] = useState<UserProfileFormDataProps>({
    fullName: '',
    username: '',
  });

  useEffect(() => {
    if (!initial) return;
    setFormData((prev) => ({
      fullName: initial.fullName ?? prev.fullName,
      username: initial.username ?? prev.username,
    }));
  }, [initial?.fullName, initial?.username]);

  const handleSubmit = (event: React.SyntheticEvent) => {
    event.preventDefault();
    onSubmit(formData, setOpen);
  };

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>
                  Make changes to your account here. Click save when you&apos;re
                  done.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                {/* <div className="grid gap-3"> */}
                <AvatarUpload />
                {/* </div> */}
                <div className="grid gap-3">
                  <Label htmlFor="user-profile-fullName">Name</Label>
                  <Input
                    id="user-profile-fullName"
                    type="text"
                    name="user-profile-fullName"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="user-profile-username">Username</Label>
                  <Input
                    id="user-profile-username"
                    type="text"
                    name="user-profile-username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                  />
                </div>
              </CardContent>
              {/* <CardFooter>
              <Button>Save changes</Button>
            </CardFooter> */}
            </Card>
          </form>
        </TabsContent>
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Change your password here. After saving, you&apos;ll be logged
                out.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="user-profile-current">Current password</Label>
                <Input id="user-profile-current" type="password" />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="user-profile-new">New password</Label>
                <Input id="user-profile-new" type="password" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save password</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
