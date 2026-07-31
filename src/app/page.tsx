'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { UtensilsCrossed, ChefHat, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [tableInput, setTableInput] = useState('')
  const router = useRouter()

  const goToTable = () => {
    const num = parseInt(tableInput)
    if (num > 0) {
      router.push(`/pelanggan/meja/${num}`)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center">
            <UtensilsCrossed className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-stone-800">RestoOrder</h1>
          <p className="text-stone-500">Pesan makanan langsung dari meja Anda</p>
        </div>

        {/* Customer Entry */}
        <Card className="overflow-hidden border-2 border-orange-200">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-left">
                <h2 className="font-bold text-stone-800">Pelanggan</h2>
                <p className="text-xs text-stone-500">Pilih nomor meja Anda</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                placeholder="Nomor meja"
                value={tableInput}
                onChange={(e) => setTableInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') goToTable() }}
                className="flex-1 h-11 text-center text-lg"
              />
              <Button
                onClick={goToTable}
                disabled={!tableInput || parseInt(tableInput) < 1}
                className="bg-orange-600 hover:bg-orange-700 text-white h-11 px-5"
              >
                Pesan
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <p className="text-xs text-stone-400">Atau scan QR code di meja Anda</p>
          </CardContent>
        </Card>

        {/* Kitchen Entry */}
        <Link href="/dapur" className="block">
          <Card className="overflow-hidden border-2 border-stone-200 hover:border-stone-400 transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-stone-600" />
                </div>
                <div className="text-left">
                  <h2 className="font-bold text-stone-800">Dapur</h2>
                  <p className="text-xs text-stone-500">Kelola pesanan masuk</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-stone-400" />
            </CardContent>
          </Card>
        </Link>

        <p className="text-xs text-stone-400">v1.0 &middot; RestoOrder System</p>
      </div>
    </div>
  )
}
