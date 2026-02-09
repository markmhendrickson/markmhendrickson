import { Helmet } from 'react-helmet-async'
import { Github, Linkedin, Instagram, Twitter, Facebook, Youtube, Mail, Globe, type LucideIcon } from 'lucide-react'
import linksData from '@/data/links.json'

interface LinkData {
  name: string
  url: string
  icon: string
  description: string
}

interface LinkWithIcon extends Omit<LinkData, 'icon'> {
  icon: LucideIcon
}

// Map icon names to actual icon components
const iconMap: Record<string, LucideIcon> = {
  Github,
  Linkedin,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  Mail,
  Globe
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
