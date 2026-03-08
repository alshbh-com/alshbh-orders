import { ThemeProps } from "./ThemeProps";
import { Store, ShoppingCart, Search, Star, Share2, MessageCircle, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function ClothesTheme({ store, products, categories, filteredProducts, featuredProducts, bestSellers, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, getAvgRating, onProductClick, cartCount, onCartOpen, onShare }: ThemeProps) {
  return (
    <>
      {/* Minimal Fashion Header */}
      <header className="bg-card border-b border-border">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {store.logo_url ? (
                <img src={store.logo_url} alt={store.store_name} className="h-12 w-12 rounded-xl object-cover" />
              ) : (
                <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${store.primary_color}15` }}>
                  <Shirt className="h-6 w-6" style={{ color: store.primary_color }} />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold tracking-tight">{store.store_name}</h1>
                <p className="text-xs text-muted-foreground">{products.length} قطعة متاحة</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="rounded-full" onClick={onShare}><Share2 className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" className="rounded-full relative" onClick={onCartOpen}>
                <ShoppingCart className="h-4 w-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-[10px] flex items-center justify-center font-bold text-white" style={{ backgroundColor: store.primary_color }}>{cartCount}</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="relative h-48 overflow-hidden" style={{ background: `linear-gradient(135deg, ${store.primary_color}15, ${store.secondary_color}15)` }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2" style={{ color: store.primary_color }}>تشكيلة جديدة ✨</h2>
            <p className="text-muted-foreground">أحدث الموديلات وأجمل التصاميم</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="container mt-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="ابحث عن قطعة..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10 rounded-full h-11 border-2" />
        </div>
      </div>

      {/* Categories - Underline style */}
      {categories.length > 0 && (
        <div className="container mt-4 border-b border-border">
          <div className="flex gap-0 overflow-x-auto scrollbar-hide">
            <button onClick={() => setSelectedCategory(null)} className={`px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${!selectedCategory ? '' : 'border-transparent text-muted-foreground'}`} style={!selectedCategory ? { borderColor: store.primary_color, color: store.primary_color } : {}}>
              الكل
            </button>
            {categories.map(c => (
              <button key={c.id} onClick={() => setSelectedCategory(c.id)} className={`px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${selectedCategory === c.id ? '' : 'border-transparent text-muted-foreground'}`} style={selectedCategory === c.id ? { borderColor: store.primary_color, color: store.primary_color } : {}}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Featured - Large cards */}
      {featuredProducts.length > 0 && !searchQuery && !selectedCategory && (
        <section className="container mt-6">
          <h2 className="text-base font-bold mb-3 uppercase tracking-wider" style={{ color: store.primary_color }}>— مميز —</h2>
          <div className="grid grid-cols-2 gap-4">
            {featuredProducts.slice(0, 2).map(p => (
              <div key={p.id} className="relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer group" onClick={() => onProductClick(p.id)}>
                {p.main_image_url ? (
                  <img src={p.main_image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center"><Shirt className="h-10 w-10 text-muted-foreground" /></div>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4">
                  <h3 className="text-white font-bold text-sm">{p.name}</h3>
                  <p className="text-white/80 text-sm font-semibold">{p.discount_price || p.price} جنيه</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Products Grid - Fashion grid */}
      <main className="flex-1 container py-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold uppercase tracking-wider" style={{ color: store.primary_color }}>
            {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : "جميع القطع"}
          </h2>
          <span className="text-xs text-muted-foreground">{filteredProducts.length} قطعة</span>
        </div>
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16"><Shirt className="h-14 w-14 text-muted-foreground mx-auto mb-4" /><p className="font-semibold">مفيش قطع هنا</p></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredProducts.map(p => {
              const hasDiscount = p.discount_price && p.discount_price < p.price;
              const discountPercent = hasDiscount ? Math.round((1 - p.discount_price / p.price) * 100) : 0;
              return (
                <div key={p.id} className="cursor-pointer group" onClick={() => onProductClick(p.id)}>
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2">
                    {p.main_image_url ? (
                      <img src={p.main_image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center"><Shirt className="h-8 w-8 text-muted-foreground" /></div>
                    )}
                    {hasDiscount && <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground border-0 rounded-lg text-xs">-{discountPercent}%</Badge>}
                    {p.stock !== null && p.stock <= 0 && <Badge variant="destructive" className="absolute bottom-2 right-2 text-xs rounded-lg">نفذ</Badge>}
                  </div>
                  <h3 className="font-semibold text-sm truncate">{p.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-bold text-sm" style={{ color: store.primary_color }}>{p.discount_price || p.price} جنيه</span>
                    {hasDiscount && <span className="text-xs text-muted-foreground line-through">{p.price}</span>}
                  </div>
                  {getAvgRating(p.id) && <div className="flex items-center gap-1 mt-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /><span className="text-xs">{getAvgRating(p.id)}</span></div>}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
