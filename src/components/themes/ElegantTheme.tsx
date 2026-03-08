import { ThemeProps } from "./ThemeProps";
import { ShoppingCart, Search, Star, Share2, MessageCircle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function ElegantTheme({ store, products, categories, filteredProducts, featuredProducts, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, getAvgRating, onProductClick, cartCount, onCartOpen, onShare }: ThemeProps) {
  return (
    <>
      {/* Hero with banner */}
      <header className="relative">
        {store.banner_url ? (
          <div className="h-52 overflow-hidden">
            <img src={store.banner_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
          </div>
        ) : (
          <div className="h-44" style={{ background: `linear-gradient(135deg, ${store.primary_color || '#1a1a2e'}ee, ${store.secondary_color || '#16213e'}ee)` }} />
        )}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-white/15 backdrop-blur-md text-white hover:bg-white/25" onClick={onShare}><Share2 className="h-4 w-4" /></Button>
            {store.whatsapp_number && (
              <a href={`https://wa.me/${store.whatsapp_number}`} target="_blank">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-white/15 backdrop-blur-md text-white hover:bg-white/25"><MessageCircle className="h-4 w-4" /></Button>
              </a>
            )}
          </div>
          <Button className="rounded-full bg-white/15 backdrop-blur-md text-white border-0 hover:bg-white/25 gap-1.5" onClick={onCartOpen}>
            <ShoppingCart className="h-4 w-4" />السلة
            {cartCount > 0 && <span className="h-5 w-5 rounded-full bg-white text-[10px] flex items-center justify-center font-bold" style={{ color: store.primary_color }}>{cartCount}</span>}
          </Button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <div className="flex items-end gap-3">
            {store.logo_url && (
              <img src={store.logo_url} alt={store.store_name} className="h-16 w-16 rounded-2xl object-cover border-2 border-white/30 shadow-lg" />
            )}
            <div>
              <h1 className="text-2xl font-bold drop-shadow-lg">{store.store_name}</h1>
              <p className="text-white/70 text-sm">{products.length} منتج متاح</p>
            </div>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="container mt-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="ابحث هنا..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10 rounded-2xl h-11 border-2 border-border bg-card" />
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="container mt-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => setSelectedCategory(null)} className={`shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-all ${!selectedCategory ? 'text-white shadow-md' : 'bg-card border border-border text-foreground'}`} style={!selectedCategory ? { backgroundColor: store.primary_color } : {}}>
              الكل
            </button>
            {categories.map(c => (
              <button key={c.id} onClick={() => setSelectedCategory(c.id)} className={`shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === c.id ? 'text-white shadow-md' : 'bg-card border border-border text-foreground'}`} style={selectedCategory === c.id ? { backgroundColor: store.primary_color } : {}}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Featured */}
      {featuredProducts.length > 0 && !searchQuery && !selectedCategory && (
        <section className="container mt-6">
          <h2 className="font-bold mb-3 flex items-center gap-2">⭐ مميز</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {featuredProducts.map(p => (
              <div key={p.id} className="w-56 shrink-0 bg-card rounded-2xl border border-border overflow-hidden cursor-pointer hover:shadow-xl transition-all group" onClick={() => onProductClick(p.id)}>
                <div className="relative h-36 overflow-hidden">
                  {p.main_image_url ? (
                    <img src={p.main_image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-muted" />
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-sm truncate">{p.name}</h3>
                  <p className="font-bold text-sm mt-1" style={{ color: store.primary_color }}>{p.discount_price || p.price} جنيه</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Products */}
      <main className="flex-1 container py-6">
        <h2 className="font-bold mb-4">{selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : "جميع المنتجات"}</h2>
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">لا توجد منتجات</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredProducts.map(p => {
              const hasDiscount = p.discount_price && p.discount_price < p.price;
              return (
                <div key={p.id} className="bg-card rounded-2xl border border-border overflow-hidden cursor-pointer group hover:shadow-lg transition-all" onClick={() => onProductClick(p.id)}>
                  <div className="relative aspect-square overflow-hidden">
                    {p.main_image_url ? (
                      <img src={p.main_image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-muted" />
                    )}
                    {hasDiscount && <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground border-0 text-xs">خصم</Badge>}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm truncate">{p.name}</h3>
                    {getAvgRating(p.id) && <div className="flex items-center gap-1 mt-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /><span className="text-xs">{getAvgRating(p.id)}</span></div>}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-sm" style={{ color: store.primary_color }}>{p.discount_price || p.price} جنيه</span>
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
