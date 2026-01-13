import { Link, useLocation } from 'react-router-dom'
import { 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarFooter,
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton 
} from '@/components/ui/sidebar'

export function AppSidebar() {
  const location = useLocation()

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <Link to="/" className="text-[18px] font-medium hover:opacity-80 transition-opacity">
          Mark Hendrickson
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              className={isActive('/') ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}
            >
              <Link to="/">Home</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              className={isActive('/posts') ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}
            >
              <Link to="/posts">Posts</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              className={isActive('/newsletter') ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}
            >
              <Link to="/newsletter">Newsletter</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="https://github.com/markmhendrickson" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="mailto:mark@markmhendrickson.com">Email</a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
