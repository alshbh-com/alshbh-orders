import { ThemeProps } from "./ThemeProps";
import { ShoppingCart, Search, Star, Share2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function ClassicTheme({ store, products, categories, filteredProducts, featuredProducts, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, getAvgRating, onProductClick, cartCount, onCartOpen, onShare }: ThemeProps) {
  return (
    <>
      {/* Classic gradient header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${store.primary_color || '#2d3436'}, ${store.secondary_color || '#636e72'})` }} />
        {store.banner_url && (
          <div className="absolute inset-0">
            <img src={store.banner_url} alt="" className="w-full h-full object-cover opacity-30" />
          </div>
        )}
        <div className="relative container py-8 text-white text-center">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-1.5">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-white/70 hover:text-white hover:bg-white/10" onClick={onShare}><Share2 className="h-4 w-4" /></Button>
              {store.whatsapp_number && (
                <a href={`https://wa.me/${store.whatsapp_number}`} target="_blank">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-white/70 hover:text-white hover:bg-white/10"><MessageCircle className="h-4 w-4" /></Button>
                </a>
              )}
            </div>
            <Button className="rounded-full bg-white/15 backdrop-blur-sm border-0 text-white hover:bg-white/25 gap-1" onClick={onCartOpen}>
              <ShoppingCart className="h-4 w-4" />السلة
              {cartCount > 0 && <span className="h-5 w-5 rounded-full bg-white text-[10px] flex items-center justify-center font-bold" style={{ color: store.primary_color }}>{cartCount}</span>}
            </Button>
          </div>
          {store.logo_url ? (
            <img src={store.logo_url} alt={store.store_name} className="h-20 w-20 rounded-full object-cover ring-3 ring-white/25 mx-auto mb-3" />
          ) : (
            <div className="h-20 w-20 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
              {store.store_name?.charAt(0)}
            </div>
          )}
          <h1 className="text-2xl font-bold">{store.store_name}</h1>
          <p className="text-white/60 text-sm mt-1">{products.length} منتج</p>
        </div>
      </header>

      {/* Search */}
      <div className="container mt-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="ابحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10 rounded-full h-11 border-2" />
        </div>
      </div>

      {/* Categories - pills */}
      {categories.length > 0 && (
        <div className="container mt-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide justify-center flex-wrap">
            <button onClick={() => setSelectedCategory(null)} className={`px-5 py-2 rounded-full text-sm font-medium border-2 transition-all ${!selectedCategory ? 'text-white border-transparent' : 'border-border bg-card'}`} style={!selectedCategory ? { backgroundColor: store.primary_color } : {}}>
              الكل
            </button>
            {categories.map(c => (
              <button key={c.id} onClick={() => setSelectedCategory(c.id)} className={`px-5 py-2 rounded-full text-sm font-medium border-2 transition-all ${selectedCategory === c.id ? 'text-white border-transparent' : 'border-border bg-card'}`} style={selectedCategory === c.id ? { backgroundColor: store.primary_color } : {}}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Featured */}
      {featuredProducts.length > 0 && !searchQuery && !selectedCategory && (
        <section className="container mt-6">
          <h2 className="text-center text-sm font-bold tracking-wider uppercase mb-4" style={{ color: store.primary_color }}>— المميز —</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {featuredProducts.map(p => (
              <div key={p.id} className="w-52 shrink-0 bg-card rounded-2xl border border-border overflow-hidden cursor-pointer group hover:shadow-lg transition-all" onClick={() => onProductClick(p.id)}>
                <div className="relative h-40 overflow-hidden">
                  {p.main_image_url ? (
                    <img src={p.main_image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  ) : <div className="w-full h-full bg-muted" />}
                </div>
                <div className="p-3 text-center">
                  <h3 className="font-bold text-sm">{p.name}</h3>
                  <p className="font-bold text-sm mt-1" style={{ color: store.primary_color }}>{p.discount_price || p.price} جنيه</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Products - list style */}
      <main className="flex-1 container py-6">
        <h2 className="font-bold mb-4">{selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : "جميع المنتجات"}</h2>
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">لا توجد منتجات</div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map(p => {
              const hasDiscount = p.discount_price && p.discount_price < p.price;
              return (
                <div key={p.id} className="flex gap-3 bg-card rounded-2xl border border-border p-3 cursor-pointer hover:shadow-md transition-all group" onClick={() => onProductClick(p.id)}>
                  {p.main_image_url ? (
                    <img src={p.main_image_url} alt={p.name} className="h-20 w-20 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform" loading="lazy" />
                  ) : (
                    <div className="h-20 w-20 rounded-xl bg-muted shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm mb-0.5">{p.name}</h3>
                    {p.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{p.description}</p>}
                    {getAvgRating(p.id) && <div className="flex items-center gap-1 mb-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /><span className="text-xs">{getAvgRating(p.id)}</span></div>}
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
