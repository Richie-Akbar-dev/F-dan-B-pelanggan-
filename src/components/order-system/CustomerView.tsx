'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Plus,
  Minus,
  ShoppingCart,
  CheckCircle2,
  Clock,
  Flame,
  UtensilsCrossed,
  Coffee,
  Cookie,
  X,
  Send,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  image: string | null
  available: boolean
}

interface CartItem {
  menuItem: MenuItem
  quantity: number
  notes: string
}

interface ActiveOrder {
  id: string
  tableNumber: number
  status: string
  items: { menuItem: MenuItem; quantity: number; price: number }[]
}

const categoryConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  Makanan: { icon: <UtensilsCrossed className="w-4 h-4" />, color: 'bg-orange-100 text-orange-700' },
  Minuman: { icon: <Coffee className="w-4 h-4" />, color: 'bg-sky-100 text-sky-700' },
  Snack: { icon: <Cookie className="w-4 h-4" />, color: 'bg-amber-100 text-amber-700' },
  Dessert: { icon: <Cookie className="w-4 h-4" />, color: 'bg-pink-100 text-pink-700' },
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending: { label: 'Menunggu', icon: <Clock className="w-4 h-4" />, color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  preparing: { label: 'Dimasak', icon: <Flame className="w-4 h-4" />, color: 'bg-orange-100 text-orange-800 border-orange-300' },
  ready: { label: 'Siap Saji', icon: <CheckCircle2 className="w-4 h-4" />, color: 'bg-green-100 text-green-800 border-green-300' },
  served: { label: 'Selesai', icon: <CheckCircle2 className="w-4 h-4" />, color: 'bg-gray-100 text-gray-800 border-gray-300' },
  cancelled: { label: 'Dibatalkan', icon: <X className="w-4 h-4" />, color: 'bg-red-100 text-red-800 border-red-300' },
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

const emojiMap: Record<string, string> = {
  Makanan: '🍛',
  Minuman: '🥤',
  Snack: '🍟',
  Dessert: '🍮',
}

export default function CustomerView() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('resto-cart')
        return saved ? JSON.parse(saved) : []
      } catch { /* ignore */ }
    }
    return []
  })
  const [tableNumber, setTableNumber] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('resto-table') || '1'
    }
    return '1'
  })
  const [customerName, setCustomerName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('resto-customer-name') || ''
    }
    return ''
  })
  const [orderNotes, setOrderNotes] = useState<string>('')
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({})
  const [cartOpen, setCartOpen] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem('resto-cart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    localStorage.setItem('resto-table', tableNumber)
  }, [tableNumber])

  useEffect(() => {
    localStorage.setItem('resto-customer-name', customerName)
  }, [customerName])

  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch('/api/menu')
      if (res.ok) {
        const data = await res.json()
        setMenuItems(data)
      }
    } catch (e) {
      console.error('Failed to fetch menu:', e)
    }
  }, [])

  const fetchOrders = useCallback(async () => {
    try {
      const table = parseInt(tableNumber)
      if (isNaN(table)) return
      const res = await fetch('/api/orders')
      if (res.ok) {
        const allOrders = await res.json()
        const tableOrders = allOrders.filter(
          (o: ActiveOrder) => o.tableNumber === table && ['pending', 'preparing', 'ready'].includes(o.status)
        )
        setActiveOrders(tableOrders)
      }
    } catch (e) {
      console.error('Failed to fetch orders:', e)
    }
  }, [tableNumber])

  // Initial load + seed + socket
  useEffect(() => {
    fetch('/api/seed', { method: 'POST' })
    fetchMenu()

    const table = parseInt(tableNumber)
    if (isNaN(table)) return

    const socketInstance = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
    })

    socketRef.current = socketInstance

    const handleConnect = () => {
      socketInstance.emit('customer-join', table)
      fetchOrders()
    }

    socketInstance.on('connect', handleConnect)

    socketInstance.on('order-status', (data: { orderId: string; status: string; tableNumber: number }) => {
      if (data.tableNumber === table) {
        fetchOrders()
      }
    })

    return () => {
      socketInstance.off('connect', handleConnect)
      socketInstance.disconnect()
    }
  }, [tableNumber, fetchMenu, fetchOrders])

  const categories = ['Semua', ...Array.from(new Set(menuItems.map((item) => item.category)))]
  const filteredItems = selectedCategory === 'Semua'
    ? menuItems
    : menuItems.filter((item) => item.category === selectedCategory)

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id)
      if (existing) {
        return prev.map((c) =>
          c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      }
      return [...prev, { menuItem: item, quantity: 1, notes: '' }]
    })
  }

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.menuItem.id === menuItemId ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c
        )
        .filter((c) => c.quantity > 0)
    )
  }

  const totalItems = cart.reduce((sum, c) => sum + c.quantity, 0)
  const totalPrice = cart.reduce((sum, c) => sum + c.menuItem.price * c.quantity, 0)

  const submitOrder = async () => {
    if (cart.length === 0 || isSubmitting) return
    setIsSubmitting(true)

    try {
      const items = cart.map((c) => ({
        menuItemId: c.menuItem.id,
        quantity: c.quantity,
        notes: itemNotes[c.menuItem.id] || null,
      }))

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber: parseInt(tableNumber),
          customerName: customerName || null,
          notes: orderNotes || null,
          items,
        }),
      })

      if (res.ok) {
        const order = await res.json()
        socketRef.current?.emit('new-order', order)
        setCart([])
        setItemNotes({})
        setOrderNotes('')
        setCartOpen(false)
        fetchOrders()
      }
    } catch (e) {
      console.error('Failed to submit order:', e)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-orange-600" />
            <h1 className="text-lg font-bold text-stone-800">RestoOrder</h1>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-stone-500">Meja</label>
            <Input
              type="number"
              min="1"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-16 h-8 text-center text-sm"
            />
          </div>
          <Sheet open={cartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="relative gap-1.5">
                <ShoppingCart className="w-4 h-4" />
                <span>Keranjang</span>
                {totalItems > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center p-0">
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Keranjang Pesanan
                </SheetTitle>
                <SheetDescription>Review dan kirim pesanan Anda ke dapur</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                {cart.length === 0 ? (
                  <p className="text-stone-400 text-center py-8">Keranjang masih kosong</p>
                ) : (
                  <>
                    <ScrollArea className="max-h-[50vh]">
                      <div className="space-y-3 pr-2">
                        {cart.map((item) => (
                          <Card key={item.menuItem.id} className="overflow-hidden">
                            <CardContent className="p-3">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{item.menuItem.name}</p>
                                  <p className="text-xs text-stone-500">
                                    {formatRupiah(item.menuItem.price)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => updateQuantity(item.menuItem.id, -1)}
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                  <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => updateQuantity(item.menuItem.id, 1)}
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              <Input
                                placeholder="Catatan item..."
                                value={itemNotes[item.menuItem.id] || ''}
                                onChange={(e) =>
                                  setItemNotes((prev) => ({ ...prev, [item.menuItem.id]: e.target.value }))
                                }
                                className="mt-2 h-8 text-xs"
                              />
                              <p className="text-right text-sm font-semibold text-orange-700 mt-1">
                                {formatRupiah(item.menuItem.price * item.quantity)}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                    <Separator />
                    <div className="space-y-2">
                      <Input
                        placeholder="Nama (opsional)"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                      <Input
                        placeholder="Catatan pesanan..."
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                      />
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-stone-600">Total</span>
                        <span className="text-xl font-bold text-orange-700">{formatRupiah(totalPrice)}</span>
                      </div>
                      <Button
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                        size="lg"
                        onClick={submitOrder}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Mengirim...' : 'Pesan Sekarang'}
                        <Send className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Active Orders Tracking */}
      {activeOrders.length > 0 && (
        <div className="max-w-lg mx-auto px-4 pt-3">
          <div className="space-y-2">
            {activeOrders.map((order) => {
              const cfg = statusConfig[order.status] || statusConfig.pending
              return (
                <Card key={order.id} className={cn('border', cfg.color)}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {cfg.icon}
                        <div>
                          <p className="font-semibold text-sm">Pesanan #{order.id.slice(-6)}</p>
                          <p className="text-xs text-stone-500">
                            {order.items.map((i) => `${i.menuItem.name} x${i.quantity}`).join(', ')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={cn('text-xs', cfg.color)}>
                        {cfg.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const cfg = categoryConfig[cat]
            const isActive = selectedCategory === cat
            return (
              <Button
                key={cat}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'shrink-0 rounded-full gap-1.5 text-sm',
                  isActive && 'bg-orange-600 hover:bg-orange-700 text-white'
                )}
                onClick={() => setSelectedCategory(cat)}
              >
                {cfg?.icon || (cat === 'Semua' ? <UtensilsCrossed className="w-3.5 h-3.5" /> : null)}
                {emojiMap[cat] && <span>{emojiMap[cat]}</span>}
                {cat}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Menu Grid */}
      <main className="max-w-lg mx-auto px-4 pb-24 pt-2">
        <div className="grid grid-cols-2 gap-3">
          {filteredItems.map((item) => {
            const cfg = categoryConfig[item.category]
            const inCart = cart.find((c) => c.menuItem.id === item.id)
            return (
              <Card
                key={item.id}
                className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
              >
                <CardContent className="p-3 flex flex-col h-full">
                  <div className="flex items-start justify-between gap-1 mb-1">
                    {cfg && <Badge className={cn('text-[10px] px-1.5 py-0 shrink-0', cfg.color)}>{item.category}</Badge>}
                  </div>
                  <h3 className="font-semibold text-sm text-stone-800 leading-tight mt-1">{item.name}</h3>
                  {item.description && (
                    <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                  )}
                  <div className="mt-auto pt-2 flex items-end justify-between">
                    <p className="font-bold text-orange-700 text-sm">{formatRupiah(item.price)}</p>
                    <Button
                      size="icon"
                      className={cn(
                        'h-8 w-8 rounded-full shrink-0',
                        inCart
                          ? 'bg-orange-600 hover:bg-orange-700 text-white'
                          : 'bg-stone-100 hover:bg-orange-600 hover:text-white text-stone-600'
                      )}
                      onClick={() => addToCart(item)}
                    >
                      {inCart ? (
                        <span className="text-xs font-bold">{inCart.quantity}</span>
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-stone-400">
            <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Tidak ada menu di kategori ini</p>
          </div>
        )}
      </main>
    </div>
  )
}
