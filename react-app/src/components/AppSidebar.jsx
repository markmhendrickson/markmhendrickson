import { Link, useLocation } from 'react-router-dom'
import { Home, FileText, Share2, Clock, Music } from 'lucide-react'
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar'

export function AppSidebar() {
  const location = useLocation()
  const { isMobile, setOpen } = useSidebar()

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  const handleLinkClick = () => {
    if (isMobile) {
      setOpen(false)
    }
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-center h-16">
          <Link to="/" onClick={handleLinkClick} className="flex items-center gap-3">
            <span className="text-base font-medium">Mark Hendrickson</span>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/')}>
                <Link to="/" onClick={handleLinkClick}>
                  <Home className="size-4" />
                  <span>Home</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/posts')}>
                <Link to="/posts" onClick={handleLinkClick}>
                  <FileText className="size-4" />
                  <span>Posts</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/timeline')}>
                <Link to="/timeline" onClick={handleLinkClick}>
                  <Clock className="size-4" />
                  <span>Timeline</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/social')}>
                <Link to="/social" onClick={handleLinkClick}>
                  <Share2 className="size-4" />
                  <span>Links</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/songs')}>
                <Link to="/songs" onClick={handleLinkClick}>
                  <Music className="size-4" />
                  <span>Songs</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
