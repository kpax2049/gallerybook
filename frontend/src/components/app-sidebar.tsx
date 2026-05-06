import * as React from 'react';
import {
  Tags,
  SquareActivity,
  Frame,
  Search,
  Settings2,
  BookImage,
  Album,
} from 'lucide-react';

import { NavMain } from '@/components/nav-main';
import { NavProjects } from '@/components/nav-projects';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { User } from '@/api/user';
import { isAdmin } from '@/lib/authz';

const data = {
  navMain: [
    {
      title: 'My  stuff',
      url: '#',
      icon: Album,
      isActive: true,
      items: [
        {
          title: 'Galleries',
          url: '/galleries?owner=me',
        },
        {
          title: 'Favorites',
          url: '/galleries?favoriteBy=me',
        },
        {
          title: 'Likes',
          url: '/galleries?likedBy=me',
        },
        {
          title: 'Drafts',
          url: '/galleries?owner=me&status=draft',
        },
        {
          title: 'Comments',
          url: '/me/comments?scope=onMyGalleries',
        },
      ],
    },
    {
      title: 'Activity',
      url: '#',
      icon: SquareActivity,
      isActive: true,
      items: [
        {
          title: 'Activity',
          url: '#',
        },
        {
          title: 'Following',
          url: '/me/following',
        },
      ],
    },
    {
      title: 'Settings',
      url: '#',
      icon: Settings2,
      items: [
        {
          title: 'General',
          url: '#',
        },
        {
          title: 'Team',
          url: '#',
        },
        {
          title: 'Billing',
          url: '#',
        },
        {
          title: 'Limits',
          url: '#',
        },
      ],
    },
  ],
  galleries: [
    {
      name: 'All ',
      url: '#',
      icon: BookImage,
    },
    {
      name: 'Trending',
      url: '#',
      icon: Frame,
    },
    {
      name: 'Tags / Categories',
      url: '#',
      icon: Tags,
    },
    {
      name: 'Search',
      url: '#',
      icon: Search,
    },
  ],
};

interface AppSidebarProps {
  props?: React.ComponentProps<typeof Sidebar>;
  handleLogout: () => void;
  user: User | undefined;
}

export function AppSidebar({ handleLogout, user, ...props }: AppSidebarProps) {
  const navMain = React.useMemo(() => {
    if (isAdmin(user)) return data.navMain;

    return data.navMain.map((group) => ({
      ...group,
      items: group.items?.filter((item) => item.title !== 'Drafts'),
    }));
  }, [user]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavUser user={user} handleLogout={handleLogout} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavProjects projects={data.galleries} />
      </SidebarContent>
      <SidebarFooter></SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
