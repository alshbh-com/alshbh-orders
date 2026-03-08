import { ThemeProps } from "./ThemeProps";
import { Store, ShoppingCart, Search, Star, Share2, MessageCircle, ShoppingBag, Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function SupermarketTheme({ store, products, categories, filteredProducts, featuredProducts, bestSellers, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, getAvgRating, onProductClick, cartCount, onCartOpen, onShare }: ThemeProps) {
  return (
    <>
      {/* Supermarket Compact Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container py-3">
          <div className="flex items-center gap-3">
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.store_name} className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${store.primary_color}15` }}>
                <ShoppingBag className="h-5 w-5" style={{ color: store.primary_color }} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-base truncate">{store.store_name}</h1>
              <p className="text-xs text-muted-foreground">🚚 توصيل سريع</p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={onShare}><Share2 className="h-4 w-4" /></Button>
              <Button size="icon" className="h-9 w-9 rounded-full relative" style={{ backgroundColor: store.primary_color }} onClick={onCartOpen}>
                <ShoppingCart className="h-4 w-4 text-white" />
                {cartCount > 0 && <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-white text-[10px] flex items-center justify-center font-bold">{cartCount}</span>}
              </Button>
            </div>
          </div>
          {/* Search inline */}
          <div className="relative mt-2">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="ابحث عن منتج..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10 rounded-xl h-10 bg-muted border-0 text-sm" />
          </div>
        </div>
      </header>

      {/* Categories - Grid icons style */}
      {categories.length > 0 && (
        <div className="container mt-3">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <div onClick={() => setSelectedCategory(null)} className={`shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl cursor-pointer transition-all ${!selectedCategory ? 'bg-primary/10' : ''}`}>
              <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: !selectedCategory ? `${store.primary_color}20` : 'hsl(var(--muted))' }}>
                <ShoppingBag className="h-5 w-5" style={{ color: !selectedCategory ? store.primary_color : undefined }} />
              </div>
              <span className={`text-[10px] font-semibold ${!selectedCategory ? '' : 'text-muted-foreground'}`} style={!selectedCategory ? { color: store.primary_color } : {}}>الكل</span>
            </div>
            {categories.map((c, i) => {
              const emojis = ['🥩', '🥛', '🧃', '🍞', '🧀', '🥚', '🍫', '🧹'];
              return (
                <div key={c.id} onClick={() => setSelectedCategory(c.id)} className={`shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl cursor-pointer transition-all ${selectedCategory === c.id ? 'bg-primary/10' : ''}`}>
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: selectedCategory === c.id ? `${store.primary_color}20` : 'hsl(var(--muted))' }}>
                    {emojis[i % emojis.length]}
                  </div>
                  <span className={`text-[10px] font-semibold ${selectedCategory === c.id ? '' : 'text-muted-foreground'}`} style={selectedCategory === c.id ? { color: store.primary_color } : {}}>
                    {c.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Offers Banner */}
      {featuredProducts.length > 0 && !searchQuery && !selectedCategory && (
        <section className="container mt-3">
          <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${store.primary_color}, ${store.secondary_color})` }}>
            <h3 className="text-white font-bold text-lg mb-1">🔥 عروض النهاردة!</h3>
            <p className="text-white/70 text-sm">{featuredProducts.length} منتج بأسعار خاصة</p>
          </div>
          <div className="flex gap-3 mt-3 overflow-x-auto pb-2 scrollbar-hide">
            {featuredProducts.map(p => (
              <div key={p.id} className="w-36 shrink-0 bg-card rounded-xl border border-border overflow-hidden cursor-pointer hover:shadow-md transition-all" onClick={() => onProductClick(p.id)}>
                <div className="relative h-28">
                  {p.main_image_url ? (
                    <img src={p.main_image_url} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center"><ShoppingBag className="h-6 w-6 text-muted-foreground" /></div>
                  )}
                  {p.discount_price && <Badge className="absolute top-1 left-1 bg-destructive text-destructive-foreground border-0 text-[10px] px-1.5">عرض</Badge>}
                </div>
                <div className="p-2">
                  <h3 className="text-xs font-semibold truncate">{p.name}</h3>
                  <span className="text-xs font-bold" style={{ color: store.primary_color }}>{p.discount_price || p.price} ج</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Best Sellers */}
      {bestSellers.length > 0 && bestSellers[0].sales_count > 0 && !searchQuery && !selectedCategory && (
        <section className="container mt-4">
          <h3 className="font-bold text-sm flex items-center gap-1 mb-3"><TrendingUp className="h-4 w-4" style={{ color: store.primary_color }} />الأكتر مبيعاً</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {bestSellers.map(p => (
              <div key={p.id} className="flex items-center gap-2 bg-card rounded-xl border border-border p-2 shrink-0 cursor-pointer hover:shadow-md transition-all min-w-[200px]" onClick={() => onProductClick(p.id)}>
                {p.main_image_url ? (
                  <img src={p.main_image_url} alt={p.name} className="h-14 w-14 rounded-lg object-cover" loading="lazy" />
                ) : (
                  <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center shrink-0"><ShoppingBag className="h-5 w-5 text-muted-foreground" /></div>
                )}
                <div className="min-w-0">
                  <h4 className="text-xs font-bold truncate">{p.name}</h4>
                  <p className="text-xs font-bold mt-0.5" style={{ color: store.primary_color }}>{p.discount_price || p.price} جنيه</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Products Grid - Compact supermarket style */}
      <main className="flex-1 container py-4 pb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm">{selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : "كل المنتجات"}</h2>
          <Badge variant="secondary" className="text-xs">{filteredProducts.length}</Badge>
        </div>
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12"><ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-3" /><p className="text-sm font-semibold">مفيش منتجات</p></div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {filteredProducts.map(p => {
              const hasDiscount = p.discount_price && p.discount_price < p.price;
              return (
                <div key={p.id} className="bg-card rounded-xl border border-border overflow-hidden cursor-pointer hover:shadow-md transition-all group" onClick={() => onProductClick(p.id)}>
                  <div className="relative aspect-square overflow-hidden">
                    {p.main_image_url ? (
                      <img src={p.main_image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center"><ShoppingBag className="h-5 w-5 text-muted-foreground" /></div>
                    )}
                    {hasDiscount && <Badge className="absolute top-1 left-1 bg-destructive text-destructive-foreground border-0 text-[9px] px-1">خصم</Badge>}
                  </div>
                  <div className="p-2">
                    <h3 className="text-[11px] font-semibold line-clamp-2 leading-tight mb-1">{p.name}</h3>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold" style={{ color: store.primary_color }}>{p.discount_price || p.price} ج</span>
                      {hasDiscount && <span className="text-[10px] text-muted-foreground line-through">{p.price}</span>}
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
