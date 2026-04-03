import React, { useState } from 'react'
import {
  Wifi,
  Thermometer,
  Square,
  Baby,
  Wind,
  Briefcase,
  Luggage,
  Sparkles,
  Shirt,
  Sofa,
  ChefHat,
  Bed,
  ShowerHead,
  ArrowUpDown,
  Flame,
  Bike,
  Music,
  Coffee,
  Trees,
  Activity,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import amenitiesData from '@/data/barcelona-guest-floor-amenities.json'

const iconMap: Record<string, LucideIcon> = {
  Wifi,
  Thermometer,
  Square,
  Baby,
  Wind,
  Briefcase,
  Luggage,
  Sparkles,
  Shirt,
  Sofa,
  ChefHat,
  Bed,
  ShowerHead,
  ArrowUpDown,
  Flame,
  Bike,
  Music,
  Coffee,
  Trees,
  Activity,
}

interface AmenityItem {
  icon: string
  label: string
  link?: string
  /** When set with `link`, shown as the anchor text instead of linking the whole row. */
  linkLabel?: string
}

const initialCount = 8

export default function AmenitiesCards() {
  const [showAll, setShowAll] = useState(true)
  const amenities = amenitiesData as AmenityItem[]
  const displayed = showAll ? amenities : amenities.slice(0, initialCount)

  return (
    <div className="my-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {displayed.map((item, index) => {
          const Icon = iconMap[item.icon] ?? Wifi
          const secondaryLinkClass =
            'text-[13px] text-muted-foreground no-underline hover:text-foreground transition-colors'
          return (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className="w-5 h-5 shrink-0" strokeWidth={1.5} />
                {item.link && item.linkLabel ? (
                  <span className="text-[15px] leading-snug flex flex-col gap-1 items-start min-w-0">
                    <span>{item.label}</span>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={secondaryLinkClass}
                    >
                      {item.linkLabel}
                    </a>
                  </span>
                ) : item.link ? (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[15px] leading-snug text-foreground no-underline hover:text-foreground/90 transition-colors"
                  >
                    {item.label}
                  </a>
                ) : (
                  <span className="text-[15px] leading-snug">{item.label}</span>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
      {amenities.length > initialCount && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="mt-4 px-4 py-2 border border-border rounded-lg text-[15px] font-medium hover:bg-muted/50 transition-colors"
        >
          {showAll ? 'Show less' : `Show all ${amenities.length} amenities`}
        </button>
      )}
    </div>
  )
}
