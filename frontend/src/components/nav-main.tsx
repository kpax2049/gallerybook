'use client';

import { ChevronRight, type LucideIcon } from 'lucide-react';

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
import { NavLink, useNavigate } from 'react-router-dom';
import { useGalleryListState } from '@/stores/galleryStore';

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

export function NavMain({ items }: ItemProps) {
  const navigate = useNavigate();
  const { setFilters, setSort, setPager } = useGalleryListState();
  const goFavorites = () => {
    setFilters((f) => ({
      ...f,
      owner: 'any',
      favoriteBy: 'me',
      status: new Set(),
    }));
    setSort({ key: 'updatedAt', dir: 'desc' });
    setPager({ page: 1, pageSize: 24 });
    navigate('/galleries?favoriteBy=me'); // 👈 add the query
  };

  const goMyGalleries = () => navigate('/galleries?owner=me');
  const goDrafts = () => navigate('/galleries?owner=me&status=draft');

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
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
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem
                      key={subItem.title}
                      onClick={
                        subItem.title == 'Galleries'
                          ? goMyGalleries
                          : subItem.title == 'Favorites'
                            ? goFavorites
                            : goDrafts
                      }
                    >
                      {/* <NavLink viewTransition to={subItem.url}> */}
                      <SidebarMenuSubButton
                        asChild
                        size="sm"
                        isActive={subItem.isActive}
                        // onClick={() =>
                        //   navigate(subItem.url, {
                        //     viewTransition: true,
                        //   })
                        // }
                      >
                        <span>{subItem.title}</span>
                        {/* <a href={subItem.url}>
                            <span>{subItem.title}</span>
                          </a> */}
                      </SidebarMenuSubButton>
                      {/* </NavLink> */}
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
