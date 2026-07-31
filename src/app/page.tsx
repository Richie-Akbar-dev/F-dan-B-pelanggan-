'use client'

import { useState } from 'react'
import CustomerView from '@/components/order-system/CustomerView'
import KitchenView from '@/components/order-system/KitchenView'
import { Button } from '@/components/ui/button'
import { UtensilsCrossed, ChefHat } from 'lucide-react'
import { cn } from '@/lib/utils'

type ViewMode = 'customer' | 'kitchen'

export default function Home() {
  const [mode, setMode] = useState<ViewMode>('customer')

  return (
    <div className="min-h-screen">
      {/* Mode Switcher - floating */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100]">
        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md border border-stone-200 rounded-full p-1 shadow-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode('customer')}
            className={cn(
              'rounded-full gap-1.5 text-sm px-4',
              mode === 'customer'
                ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-md'
                : 'text-stone-600 hover:text-stone-800'
            )}
          >
            <UtensilsCrossed className="w-4 h-4" />
            Pelanggan
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode('kitchen')}
            className={cn(
              'rounded-full gap-1.5 text-sm px-4',
              mode === 'kitchen'
                ? 'bg-stone-800 hover:bg-stone-900 text-white shadow-md'
                : 'text-stone-600 hover:text-stone-800'
            )}
          >
            <ChefHat className="w-4 h-4" />
            Dapur
          </Button>
        </div>
      </div>

      {mode === 'customer' ? <CustomerView /> : <KitchenView />}
    </div>
  )
}
