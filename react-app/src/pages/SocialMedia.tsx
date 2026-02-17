import { Helmet } from 'react-helmet-async'
import { Github, Linkedin, Instagram, Twitter, Facebook, Youtube, Mail, Globe, type LucideIcon } from 'lucide-react'
import linksData from '@cache/links.json'

interface LinkData {
  name: string
  url: string
  icon: string
  description: string
}

interface LinkWithIcon extends Omit<LinkData, 'icon'> {
  icon: LucideIcon
}

// Branded icons (Simple Icons paths)
function BrandedIcon({
  className,
  size = 24,
  path,
  ...props
}: React.SVGProps<SVGSVGElement> & { path: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
      {...props}
    >
      <path d={path} />
    </svg>
  )
}

const SubstackIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <BrandedIcon path="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" {...p} />
)
const HackerNewsIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <BrandedIcon path="M0 24V0h24v24H0zM6.951 5.896l4.112 7.708v5.064h1.583v-4.972l4.148-7.799h-1.749l-2.457 4.875c-.372.745-.688 1.434-.688 1.434s-.297-.708-.651-1.434L8.831 5.896h-1.88z" {...p} />
)
const IndieHackersIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <BrandedIcon path="M0 0h24v24H0V0Zm5.4 17.2h2.4V6.8H5.4v10.4Zm4.8 0h2.4v-4h3.6v4h2.4V6.8h-2.4v4h-3.6v-4h-2.4v10.4Z" {...p} />
)
const XIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <BrandedIcon path="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" {...p} />
)
const BlueskyIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <BrandedIcon path="M5.202 2.857C7.954 4.922 10.913 9.11 12 11.358c1.087-2.247 4.046-6.436 6.798-8.501C20.783 1.366 24 .213 24 3.883c0 .732-.42 6.156-.667 7.037-.856 3.061-3.978 3.842-6.755 3.37 4.854.826 6.089 3.562 3.422 6.299-5.065 5.196-7.28-1.304-7.847-2.97-.104-.305-.152-.448-.153-.327 0-.121-.05.022-.153.327-.568 1.666-2.782 8.166-7.847 2.97-2.667-2.737-1.432-5.473 3.422-6.3-2.777.473-5.899-.308-6.755-3.369C.42 10.04 0 4.615 0 3.883c0-3.67 3.217-2.517 5.202-1.026" {...p} />
)

// Map icon names to actual icon components
const iconMap: Record<string, LucideIcon> = {
  Github,
  Linkedin,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  Mail,
  Globe,
  Substack: SubstackIcon as LucideIcon,
  HackerNews: HackerNewsIcon as LucideIcon,
  IndieHackers: IndieHackersIcon as LucideIcon,
  X: XIcon as LucideIcon,
  Bluesky: BlueskyIcon as LucideIcon
}

// Transform JSON data to include icon components
const links: LinkWithIcon[] = (linksData as LinkData[]).map(link => ({
  ...link,
  icon: iconMap[link.icon] || Globe
}))

export default function SocialMedia() {
  const pageTitle = 'Links — Mark Hendrickson'
  const pageDesc = 'Links to profiles and contact channels.'
  const canonicalUrl = 'https://markmhendrickson.com/links'
  const defaultOgImage = 'https://markmhendrickson.com/images/og-default-1200x630.jpg'
  const ogImageWidth = 1200
  const ogImageHeight = 630

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta name="author" content="Mark Hendrickson" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={defaultOgImage} />
        <meta property="og:image:width" content={String(ogImageWidth)} />
        <meta property="og:image:height" content={String(ogImageHeight)} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDesc} />
        <meta name="twitter:image" content={defaultOgImage} />
        <meta name="twitter:image:width" content={String(ogImageWidth)} />
        <meta name="twitter:image:height" content={String(ogImageHeight)} />
      </Helmet>
      <div className="flex justify-center items-start min-h-content pt-8 pb-4 px-4 md:py-20 md:px-8">
        <div className="max-w-[600px] w-full">
          <h1 className="text-[28px] font-medium mb-2 tracking-tight">Links</h1>
          <div className="text-[17px] text-[#666] mb-12 font-normal tracking-wide">
            Connect with me across platforms
          </div>

          <div className="space-y-4">
            {links.map((link) => {
              const Icon = link.icon
              return (
                <a
                  key={link.name}
                  href={link.url}
                  target={link.url.startsWith('mailto:') ? undefined : '_blank'}
                  rel={link.url.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                  className="flex items-center gap-4 p-4 rounded-lg border border-[#e0e0e0] hover:border-[#999] hover:bg-[#fafafa] transition-all group"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#f5f5f5] flex items-center justify-center group-hover:bg-[#e8e8e8] transition-colors">
                    <Icon className="w-6 h-6 text-[#333]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[16px] font-medium text-[#333] mb-1">
                      {link.name}
                    </div>
                    <div className="text-[13px] text-[#666] line-clamp-1">
                      {link.description}
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
