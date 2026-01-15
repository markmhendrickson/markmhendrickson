import { Github, Linkedin, Instagram, Twitter, Facebook, Youtube, Mail, Globe } from 'lucide-react'
import linksData from '@/data/links.json'

// Map icon names to actual icon components
const iconMap = {
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
const links = linksData.map(link => ({
  ...link,
  icon: iconMap[link.icon]
}))

export default function SocialMedia() {
  return (
    <div className="flex justify-center items-start min-h-screen py-20 px-8">
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
                    <div className="flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-[#999] group-hover:text-[#333] transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </a>
                )
              })}
            </div>
      </div>
    </div>
  )
}
