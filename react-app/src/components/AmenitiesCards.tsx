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
}

const initialCount = 8

export default function AmenitiesCards() {
  const [showAll, setShowAll] = useState(false)
  const amenities = amenitiesData as AmenityItem[]
  const displayed = showAll ? amenities : amenities.slice(0, initialCount)

  return (
    <div className="my-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {displayed.map((item, index) => {
          const Icon = iconMap[item.icon] ?? Wifi
          const content = (
            <>
              <Icon className="w-5 h-5 shrink-0" strokeWidth={1.5} />
              <span className="text-[15px] leading-snug">{item.label}</span>
            </>
          )
          return (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-4 flex items-center gap-3">
                {item.link ? (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-foreground hover:underline underline-offset-2"
                  >
                    {content}
                  </a>
                ) : (
                  <div className="flex items-center gap-3">{content}</div>
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
