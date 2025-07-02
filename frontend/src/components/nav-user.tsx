'use client';

import { BadgeCheck, Bell, ChevronsUpDown, LogOut } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import logo from '../assets/GB-logo.png';
import { ModeToggle } from './mode-toggle';
import { User } from '@/api/user';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { NavLink } from 'react-router-dom';
import { useUserStore } from '@/stores/userStore';

// interface NavUserAccountProps {
//   firstName: string;
//   lastName: string;
//   email: string;
//   avatar: string;
// }
interface NavUserProps {
  user: User | null;
  handleLogout: () => void;
}

// TODO: make a computed function in the User class
const getUserProfile = (user: User | null) => {
  if (!user) return { initials: '', firstLast: '' };
  const userProfile: {
    initials: string;
    firstLast: string;
  } = { initials: '', firstLast: '' };
  const defaultFirstName =
    user?.firstName && user?.firstName?.length > 0 ? user?.firstName : '';
  const defaultLastName =
    user?.lastName && user?.lastName?.length > 0 ? user?.lastName : '';
  const firstInitial = defaultFirstName && defaultFirstName.substring(0, 1);
  const lastInitial = defaultLastName && defaultLastName.substring(0, 1);
  userProfile.initials = `${firstInitial} ${lastInitial}`;
  userProfile.firstLast = `${defaultFirstName} ${defaultLastName}`;

  return userProfile;
};

function SignUpOrInButton() {
  return (
    <SidebarMenuButton
      size="lg"
      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
    >
      <NavLink viewTransition to="/">
        <Button variant="ghost" size="icon">
          <img
            src={logo}
            alt="GB Logo"
            className="group-data-[state=collapsed]:w-[28px] group-data-[state=collapsed]:h-[28px]"
          />
        </Button>
      </NavLink>
      <div className="flex h-5 items-center space-x-4 text-sm data-[state=collapsed]:hidden">
        <NavLink viewTransition to={'/signup'}>
          <Button variant="link">Register</Button>
        </NavLink>
        <Separator orientation="vertical" />
        <NavLink viewTransition to={'/login'}>
          <Button variant="link">Sign in</Button>
        </NavLink>
      </div>
    </SidebarMenuButton>
  );
}

export function NavUser({ handleLogout }: NavUserProps) {
  const { isMobile } = useSidebar();
  const currentUser = useUserStore((state) => state.user);
  const userProfile = currentUser && getUserProfile(currentUser);
  return (
    <SidebarMenu>
      {currentUser ? (
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <img src={logo} alt="Logo" />
                <div className="grid flex-1 text-center text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {userProfile?.firstLast}
                  </span>
                  <span className="truncate text-xs">{currentUser?.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? 'bottom' : 'right'}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      // src={user.avatar}
                      alt={userProfile?.firstLast}
                    />
                    <AvatarFallback className="rounded-lg">
                      {userProfile?.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {userProfile?.firstLast}
                    </span>
                    <span className="truncate text-xs">
                      {currentUser?.email}
                    </span>
                  </div>
                  <ModeToggle />
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <BadgeCheck />
                  Manage Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell />
                  Notifications
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      ) : (
        <SignUpOrInButton />
      )}
    </SidebarMenu>
  );
}
