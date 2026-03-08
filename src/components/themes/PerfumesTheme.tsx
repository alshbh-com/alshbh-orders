import { ThemeProps } from "./ThemeProps";
import { Store, ShoppingCart, Search, Star, Share2, MessageCircle, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function PerfumesTheme({ store, products, categories, filteredProducts, featuredProducts, bestSellers, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, getAvgRating, onProductClick, cartCount, onCartOpen, onShare }: ThemeProps) {
  return (
    <>
      {/* Luxury Dark Header */}
      <header className="relative overflow-hidden" style={{ background: `linear-gradient(180deg, #1a1a2e 0%, ${store.primary_color}30 100%)` }}>
        <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(ellipse at 30% 50%, gold 0%, transparent 70%)' }} />
        <div className="relative container py-10 text-white">
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="text-white/60 hover:text-white rounded-full" onClick={onShare}><Share2 className="h-5 w-5" /></Button>
              {store.whatsapp_number && (
                <a href={`https://wa.me/${store.whatsapp_number}`} target="_blank">
                  <Button variant="ghost" size="icon" className="text-white/60 hover:text-white rounded-full"><MessageCircle className="h-5 w-5" /></Button>
                </a>
              )}
            </div>
            <Button className="relative rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-sm" onClick={onCartOpen}>
              <ShoppingCart className="h-5 w-5 ml-1" />السلة
              {cartCount > 0 && <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-amber-400 text-black text-xs flex items-center justify-center font-bold">{cartCount}</span>}
            </Button>
          </div>
          <div className="text-center">
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.store_name} className="h-28 w-28 rounded-full object-cover ring-2 ring-amber-400/40 shadow-2xl mx-auto mb-4" />
            ) : (
              <div className="h-28 w-28 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center ring-2 ring-amber-400/40 mx-auto mb-4">
                <Droplets className="h-12 w-12 text-amber-400" />
              </div>
            )}
            <h1 className="text-3xl font-bold tracking-wider">{store.store_name}</h1>
            <p className="text-white/50 mt-2 text-sm tracking-widest uppercase">عطور فاخرة — Luxury Fragrances</p>
          </div>
        </div>
      </header>

      {/* Search - Elegant */}
      <div className="container mt-6">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="ابحث عن عطرك المفضل..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-11 rounded-full h-12 border-2 bg-card" />
        </div>
      </div>

      {/* Categories - Elegant pills */}
      {categories.length > 0 && (
        <div className="container mt-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide justify-center flex-wrap">
            <button onClick={() => setSelectedCategory(null)} className={`px-6 py-2 rounded-full text-sm font-semibold border-2 transition-all ${!selectedCategory ? 'text-white border-transparent' : 'border-border bg-card'}`} style={!selectedCategory ? { backgroundColor: store.primary_color, borderColor: store.primary_color } : {}}>
              الكل
            </button>
            {categories.map(c => (
              <button key={c.id} onClick={() => setSelectedCategory(c.id)} className={`px-6 py-2 rounded-full text-sm font-semibold border-2 transition-all ${selectedCategory === c.id ? 'text-white border-transparent' : 'border-border bg-card'}`} style={selectedCategory === c.id ? { backgroundColor: store.primary_color, borderColor: store.primary_color } : {}}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Featured - Luxurious cards */}
      {featuredProducts.length > 0 && !searchQuery && !selectedCategory && (
        <section className="container mt-8">
          <h2 className="text-center text-base font-bold tracking-[0.2em] uppercase mb-6" style={{ color: store.primary_color }}>✦ عطور مميزة ✦</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide justify-center">
            {featuredProducts.map(p => (
              <div key={p.id} className="w-48 shrink-0 text-center cursor-pointer group" onClick={() => onProductClick(p.id)}>
                <div className="relative aspect-square rounded-full overflow-hidden mx-auto mb-3 ring-2 ring-border group-hover:ring-amber-400/50 transition-all" style={{ width: 140, height: 140 }}>
                  {p.main_image_url ? (
                    <img src={p.main_image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center"><Droplets className="h-8 w-8 text-muted-foreground" /></div>
                  )}
                </div>
                <h3 className="font-bold text-sm">{p.name}</h3>
                <p className="text-sm mt-1" style={{ color: store.primary_color }}>{p.discount_price || p.price} جنيه</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Products Grid - Perfume elegant grid */}
      <main className="flex-1 container py-8">
        <h2 className="text-center text-base font-bold tracking-[0.15em] uppercase mb-6">
          {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : "جميع العطور"}
        </h2>
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16"><Droplets className="h-14 w-14 text-muted-foreground mx-auto mb-4" /><p className="font-semibold">لا توجد عطور</p></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {filteredProducts.map(p => {
              const hasDiscount = p.discount_price && p.discount_price < p.price;
              return (
                <div key={p.id} className="bg-card rounded-2xl border border-border overflow-hidden cursor-pointer group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1" onClick={() => onProductClick(p.id)}>
                  <div className="relative aspect-square overflow-hidden">
                    {p.main_image_url ? (
                      <img src={p.main_image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center"><Droplets className="h-10 w-10 text-muted-foreground" /></div>
                    )}
                    {hasDiscount && <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground border-0 rounded-full text-xs px-3">خصم</Badge>}
                  </div>
                  <div className="p-4 text-center">
                    <h3 className="font-bold text-sm mb-1">{p.name}</h3>
                    {getAvgRating(p.id) && <div className="flex items-center gap-1 justify-center mb-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /><span className="text-xs">{getAvgRating(p.id)}</span></div>}
                    <div className="flex items-center gap-2 justify-center">
                      <span className="font-bold" style={{ color: store.primary_color }}>{p.discount_price || p.price} جنيه</span>
                      {hasDiscount && <span className="text-xs text-muted-foreground line-through">{p.price}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
