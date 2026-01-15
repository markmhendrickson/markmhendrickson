import React, { useState, useEffect, useRef } from 'react'
import { useLocation, Link, useParams } from 'react-router-dom'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import publicPostsData from '@/content/posts/posts.json'

// Route name mapping for friendly breadcrumb labels
const routeNames = {
  'posts': 'Posts',
  'timeline': 'Timeline',
  'newsletter': 'Newsletter',
  'social': 'Links',
  'songs': 'Songs',
  'test-error': 'Test Error',
}

export function Layout({ children }) {
  const location = useLocation()
  const params = useParams()
  const [postTitle, setPostTitle] = useState(null)
  const scrollPositions = useRef(new Map())
  const previousPathname = useRef(location.pathname)
  const isRestoringRef = useRef(false)

  // Save scroll position when leaving a page (runs before pathname changes)
  useEffect(() => {
    // Save current page's scroll position before navigation
    if (previousPathname.current !== location.pathname) {
      const scrollY = window.scrollY
      scrollPositions.current.set(previousPathname.current, scrollY)
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Scroll] Saved position for', previousPathname.current, ':', scrollY)
      }
      
      // Update previous pathname after saving
      previousPathname.current = location.pathname
    }
  }, [location.pathname])

  // Save scroll position as user scrolls (debounced)
  useEffect(() => {
    let scrollTimeout
    const handleScroll = () => {
      // Don't save scroll position if we're in the middle of restoring
      if (isRestoringRef.current) return
      
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        scrollPositions.current.set(location.pathname, window.scrollY)
      }, 150)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeout)
    }
  }, [location.pathname])

  // Restore scroll position or scroll to top on route change
  useEffect(() => {

    const savedPosition = scrollPositions.current.get(location.pathname)
    
    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Scroll] Route changed:', location.pathname)
      console.log('[Scroll] Saved positions:', Array.from(scrollPositions.current.entries()))
      console.log('[Scroll] Saved position for this route:', savedPosition)
    }
    
    if (savedPosition !== undefined && savedPosition > 0) {
      // Restore saved scroll position for previously visited pages
      isRestoringRef.current = true
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Scroll] Restoring to position:', savedPosition)
      }
      
      // Wait for content to render - use multiple strategies for reliability
      const restoreScroll = () => {
        // Try multiple times to ensure content is loaded
        let attempts = 0
        const maxAttempts = 10
        
        const tryRestore = () => {
          attempts++
          
          // Check if page has content (not just empty)
          const hasContent = document.body.scrollHeight > window.innerHeight
          
          if (process.env.NODE_ENV === 'development' && attempts === 1) {
            console.log('[Scroll] Content check - scrollHeight:', document.body.scrollHeight, 'innerHeight:', window.innerHeight, 'hasContent:', hasContent)
          }
          
          if (hasContent || attempts >= maxAttempts) {
            const actualPosition = Math.min(savedPosition, document.body.scrollHeight - window.innerHeight)
            window.scrollTo({
              top: actualPosition,
              behavior: 'auto'
            })
            
            if (process.env.NODE_ENV === 'development') {
              console.log('[Scroll] Restored to position:', actualPosition, '(attempt', attempts + ')')
            }
            
            // Allow scroll tracking after a brief delay
            setTimeout(() => {
              isRestoringRef.current = false
            }, 100)
          } else {
            // Retry after a short delay
            requestAnimationFrame(() => {
              setTimeout(tryRestore, 50)
            })
          }
        }
        
        // Start restoration process
        requestAnimationFrame(() => {
          setTimeout(tryRestore, 0)
        })
      }
      
      restoreScroll()
    } else {
      // Scroll to top for new pages
      if (process.env.NODE_ENV === 'development') {
        console.log('[Scroll] New page - scrolling to top')
      }
      
      isRestoringRef.current = true
      window.scrollTo({ top: 0, behavior: 'auto' })
      
      setTimeout(() => {
        isRestoringRef.current = false
      }, 100)
    }
  }, [location.pathname])

  // Load post title if we're on a post page
  useEffect(() => {
    if (params.slug) {
      // Check public posts first
      let post = publicPostsData.find(p => p.slug === params.slug)
      
      // If not found, try private posts
      if (!post) {
        import('@/content/posts/posts.private.json')
          .then(module => {
            const privatePosts = module.default || module
            const privatePost = privatePosts.find(p => p.slug === params.slug)
            if (privatePost) {
              setPostTitle(privatePost.title)
            }
          })
          .catch(() => {
            // Private file doesn't exist, keep null
          })
      } else {
        setPostTitle(post.title)
      }
    } else {
      setPostTitle(null)
    }
  }, [params.slug])

  // Generate breadcrumb items from pathname
  const getBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter((x) => x)
    const breadcrumbs = []

    // Always include Home
    breadcrumbs.push({ label: 'Home', href: '/' })

    // Build breadcrumbs from path segments
    let currentPath = ''
    pathnames.forEach((segment, index) => {
      currentPath += `/${segment}`
      const isLast = index === pathnames.length - 1

      // Use route name mapping if available, otherwise format the segment
      let label
      if (routeNames[segment]) {
        label = routeNames[segment]
      } else if (segment === params.slug && postTitle) {
        // Use post title for post slugs
        label = postTitle
      } else {
        // Format label (capitalize, replace hyphens with spaces)
        label = segment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      }

      breadcrumbs.push({
        label,
        href: currentPath,
        isLast,
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.href}>
                  <BreadcrumbItem>
                    {crumb.isLast ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to={crumb.href}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className="min-h-[calc(100vh-4rem)] p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
