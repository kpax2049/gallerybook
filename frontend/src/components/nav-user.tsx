'use client';

import { Bell, ChevronsUpDown, LogOut } from 'lucide-react';

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
import { getUserInitials, User } from '@/api/user';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { NavLink } from 'react-router-dom';
import { useUserStore } from '@/stores/userStore';
import { UserProfileDialog } from '@/app/userProfile/UserProfileDialog';
interface NavUserProps {
  user: User | undefined; // TODO: cleanup user prop
  handleLogout: () => void;
}

function SignUpOrInButton() {
  return (
    <SidebarMenuButton
      asChild
      size="lg"
      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
    >
      <div className="flex items-center gap-2">
        {/* Logo link */}
        <Button asChild variant="ghost" size="icon">
          <NavLink viewTransition to="/">
            <img
              src={logo}
              alt="GB Logo"
              className="group-data-[state=collapsed]:w-[28px] group-data-[state=collapsed]:h-[28px]"
            />
          </NavLink>
        </Button>

        {/* Auth links */}
        <div className="flex h-5 items-center space-x-4 text-sm data-[state=collapsed]:hidden">
          <Button asChild variant="link">
            <NavLink viewTransition to="/signup">
              Register
            </NavLink>
          </Button>
          <Separator orientation="vertical" />
          <Button asChild variant="link">
            <NavLink viewTransition to="/login">
              Sign in
            </NavLink>
          </Button>
        </div>
      </div>
    </SidebarMenuButton>
  );
}

export function NavUser({ handleLogout }: NavUserProps) {
  const { isMobile } = useSidebar();
  const currentUser = useUserStore((state) => state.user);

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
                    {currentUser.fullName}
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
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={currentUser.profile?.avatarUrl}
                      className="object-cover"
                      alt={currentUser.fullName}
                    />
                    <AvatarFallback className="rounded-lg">
                      {getUserInitials(currentUser)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {currentUser.fullName}
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
                <UserProfileDialog />
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
