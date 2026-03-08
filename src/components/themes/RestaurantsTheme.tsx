import { ThemeProps } from "./ThemeProps";
import { Store, ShoppingCart, Search, Star, Sparkles, TrendingUp, Share2, MessageCircle, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function RestaurantsTheme({ store, products, categories, filteredProducts, featuredProducts, bestSellers, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, getAvgRating, onProductClick, cartCount, onCartOpen, onShare }: ThemeProps) {
  return (
    <>
      {/* Warm Restaurant Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ 
          background: `linear-gradient(160deg, ${store.primary_color || '#D97706'} 0%, ${store.secondary_color || '#F59E0B'} 50%, ${store.primary_color || '#D97706'} 100%)`,
        }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 60%)' }} />
        <div className="relative container py-10 text-white">
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/20 rounded-full" onClick={onShare}>
                <Share2 className="h-5 w-5" />
              </Button>
              {store.whatsapp_number && (
                <a href={`https://wa.me/${store.whatsapp_number}`} target="_blank">
                  <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/20 rounded-full">
                    <MessageCircle className="h-5 w-5" />
                  </Button>
                </a>
              )}
            </div>
            <Button className="relative rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white" onClick={onCartOpen}>
              <ShoppingCart className="h-5 w-5 ml-1" />السلة
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white text-xs flex items-center justify-center font-bold" style={{ color: store.primary_color }}>
                  {cartCount}
                </span>
              )}
            </Button>
          </div>
          <div className="text-center">
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.store_name} className="h-24 w-24 rounded-full object-cover ring-4 ring-white/30 shadow-2xl mx-auto mb-4" />
            ) : (
              <div className="h-24 w-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-4 ring-white/30 mx-auto mb-4">
                <UtensilsCrossed className="h-10 w-10" />
              </div>
            )}
            <h1 className="text-3xl font-bold tracking-tight">{store.store_name}</h1>
            <p className="text-white/70 mt-2 text-lg">🍽️ أطلب واحنا هنوصّلك!</p>
            <div className="flex items-center gap-2 mt-3 justify-center">
              <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">🍕 {products.length} صنف</Badge>
              <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">🚚 توصيل سريع</Badge>
            </div>
          </div>
        </div>
        {/* Wave */}
        <svg viewBox="0 0 1440 60" className="relative -mb-1 w-full" preserveAspectRatio="none" style={{ height: 30 }}>
          <path d="M0,30 C360,60 720,0 1440,30 L1440,60 L0,60 Z" className="fill-muted/30" />
        </svg>
      </header>

      {/* Search */}
      <div className="container -mt-3 relative z-10">
        <div className="bg-card rounded-2xl shadow-lg border border-border p-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="بتشتهي إيه النهاردة؟ 🔍" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10 border-0 bg-muted/50 rounded-xl h-11" />
          </div>
        </div>
      </div>

      {/* Categories - Horizontal scroll pills */}
      {categories.length > 0 && (
        <div className="container mt-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => setSelectedCategory(null)} className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${!selectedCategory ? 'text-white shadow-lg' : 'bg-card border border-border'}`} style={!selectedCategory ? { backgroundColor: store.primary_color } : {}}>
              الكل 🔥
            </button>
            {categories.map(c => (
              <button key={c.id} onClick={() => setSelectedCategory(c.id)} className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${selectedCategory === c.id ? 'text-white shadow-lg' : 'bg-card border border-border'}`} style={selectedCategory === c.id ? { backgroundColor: store.primary_color } : {}}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Featured - Big horizontal cards */}
      {featuredProducts.length > 0 && !searchQuery && !selectedCategory && (
        <section className="container mt-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5" style={{ color: store.primary_color }} />الأطباق المميزة 🌟
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {featuredProducts.map(p => (
              <div key={p.id} className="w-64 shrink-0 bg-card rounded-2xl border border-border overflow-hidden cursor-pointer hover:shadow-xl transition-all group" onClick={() => onProductClick(p.id)}>
                <div className="relative h-36 overflow-hidden">
                  {p.main_image_url ? (
                    <img src={p.main_image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center"><UtensilsCrossed className="h-8 w-8 text-muted-foreground" /></div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-2 right-3 text-white font-bold">{p.discount_price || p.price} جنيه</span>
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-sm truncate">{p.name}</h3>
                  {p.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{p.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Products Grid - Menu style */}
      <main className="flex-1 container py-6 pb-8">
        <h2 className="text-lg font-bold mb-4">{selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : "المنيو كامل 📋"}</h2>
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <UtensilsCrossed className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
            <p className="font-semibold">مفيش أكل هنا 😅</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map(p => {
              const hasDiscount = p.discount_price && p.discount_price < p.price;
              return (
                <div key={p.id} className="flex gap-3 bg-card rounded-2xl border border-border p-3 cursor-pointer hover:shadow-lg transition-all group" onClick={() => onProductClick(p.id)}>
                  {p.main_image_url ? (
                    <img src={p.main_image_url} alt={p.name} className="h-24 w-24 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform" loading="lazy" />
                  ) : (
                    <div className="h-24 w-24 rounded-xl bg-muted flex items-center justify-center shrink-0"><UtensilsCrossed className="h-6 w-6 text-muted-foreground" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm mb-0.5">{p.name}</h3>
                    {p.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{p.description}</p>}
                    {getAvgRating(p.id) && <div className="flex items-center gap-1 mb-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /><span className="text-xs font-semibold">{getAvgRating(p.id)}</span></div>}
                    <div className="flex items-center gap-2">
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
