'use client';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface ItemProps {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
      isActive?: boolean;
    }[];
  }[];
}

// Accept just what we need from the router location
function isSubActiveByUrl(
  title: string,
  url: string,
  pathname: string,
  search: string
) {
  // In case of / or empty route
  if (!url || url.trim() === '' || url === '#') return false;

  const to = new URL(url, window.location.origin);
  const targetPath = to.pathname;

  if (pathname !== targetPath) {
    if (!(title === 'Comments' && pathname.startsWith('/me/comments'))) {
      return false;
    }
  }

  const sp = new URLSearchParams(search);

  switch (title) {
    case 'Galleries': {
      const owner = sp.get('owner');
      const favoriteBy = sp.get('favoriteBy');
      const statusRaw = sp.get('status');
      const statuses = statusRaw ? statusRaw.split(',') : [];
      return owner === 'me' && !favoriteBy && !statuses.includes('draft');
    }
    case 'Favorites':
      return sp.get('favoriteBy') === 'me';
    case 'Likes':
      return sp.get('likedBy') === 'me';
    case 'Drafts': {
      const owner = sp.get('owner');
      const statusRaw = sp.get('status');
      const statuses = statusRaw ? statusRaw.split(',') : [];
      return owner === 'me' && statuses.includes('draft');
    }
    case 'Comments':
      return pathname.startsWith('/me/comments');
    default:
      // strict path + query match
      return pathname === targetPath && search === to.search;
  }
}

export function NavMain({ items }: ItemProps) {
  const loc = useLocation();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const anyActive =
            item.items?.some((sub) =>
              isSubActiveByUrl(sub.title, sub.url, loc.pathname, loc.search)
            ) ?? false;

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive || anyActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => {
                      const active = isSubActiveByUrl(
                        subItem.title,
                        subItem.url,
                        loc.pathname,
                        loc.search
                      );

                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            size="sm"
                            isActive={active}
                          >
                            <NavLink
                              to={subItem.url}
                              end
                              className={() =>
                                cn(active ? 'data-[active=true]' : undefined)
                              }
                            >
                              <span>{subItem.title}</span>
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
