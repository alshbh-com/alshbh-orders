import { ThemeProps } from "./ThemeProps";
import { ShoppingCart, Search, Star, Share2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function BoldTheme({ store, products, categories, filteredProducts, featuredProducts, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, getAvgRating, onProductClick, cartCount, onCartOpen, onShare }: ThemeProps) {
  return (
    <>
      {/* Bold full-width header */}
      <header className="relative">
        {store.banner_url ? (
          <div className="h-48 overflow-hidden">
            <img src={store.banner_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
          </div>
        ) : (
          <div className="h-44" style={{ backgroundColor: store.primary_color }} />
        )}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <div className="flex gap-1.5">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-black/20 text-white hover:bg-black/40" onClick={onShare}><Share2 className="h-4 w-4" /></Button>
            {store.whatsapp_number && (
              <a href={`https://wa.me/${store.whatsapp_number}`} target="_blank">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-black/20 text-white hover:bg-black/40"><MessageCircle className="h-4 w-4" /></Button>
              </a>
            )}
          </div>
          <Button className="rounded-full bg-white text-foreground hover:bg-white/90 gap-1 shadow-lg" onClick={onCartOpen}>
            <ShoppingCart className="h-4 w-4" />
            {cartCount > 0 ? <span className="font-bold" style={{ color: store.primary_color }}>{cartCount}</span> : "السلة"}
          </Button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-end gap-3">
            {store.logo_url && (
              <img src={store.logo_url} alt={store.store_name} className="h-14 w-14 rounded-xl object-cover border-2 border-white/30" />
            )}
            <div className="text-white">
              <h1 className="text-2xl font-black">{store.store_name}</h1>
              <p className="text-white/60 text-sm">{products.length} منتج</p>
            </div>
          </div>
        </div>
      </header>

      {/* Search bar */}
      <div className="container mt-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="ابحث عن منتجاتك..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10 rounded-xl h-11 border-2 border-border" />
        </div>
      </div>

      {/* Categories - big rounded */}
      {categories.length > 0 && (
        <div className="container mt-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => setSelectedCategory(null)} className={`shrink-0 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${!selectedCategory ? 'text-white shadow-lg' : 'bg-muted text-foreground'}`} style={!selectedCategory ? { backgroundColor: store.primary_color } : {}}>
              الكل
            </button>
            {categories.map(c => (
              <button key={c.id} onClick={() => setSelectedCategory(c.id)} className={`shrink-0 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${selectedCategory === c.id ? 'text-white shadow-lg' : 'bg-muted text-foreground'}`} style={selectedCategory === c.id ? { backgroundColor: store.primary_color } : {}}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Featured - big card */}
      {featuredProducts.length > 0 && !searchQuery && !selectedCategory && (
        <section className="container mt-5">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {featuredProducts.slice(0, 3).map(p => (
              <div key={p.id} className="w-72 shrink-0 relative rounded-2xl overflow-hidden cursor-pointer group" onClick={() => onProductClick(p.id)} style={{ height: 180 }}>
                {p.main_image_url ? (
                  <img src={p.main_image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                ) : <div className="w-full h-full bg-muted" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-3 right-3 left-3 text-white">
                  <h3 className="font-black text-base">{p.name}</h3>
                  <span className="font-bold text-sm">{p.discount_price || p.price} جنيه</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Products - 2 col bold cards */}
      <main className="flex-1 container py-5 pb-8">
        <h2 className="font-black text-lg mb-4">{selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : "كل المنتجات"}</h2>
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">لا توجد منتجات</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredProducts.map(p => {
              const hasDiscount = p.discount_price && p.discount_price < p.price;
              const discountPercent = hasDiscount ? Math.round((1 - p.discount_price / p.price) * 100) : 0;
              return (
                <div key={p.id} className="bg-card rounded-2xl border border-border overflow-hidden cursor-pointer group hover:shadow-xl transition-all hover:-translate-y-0.5" onClick={() => onProductClick(p.id)}>
                  <div className="relative aspect-[4/5] overflow-hidden">
                    {p.main_image_url ? (
                      <img src={p.main_image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : <div className="w-full h-full bg-muted" />}
                    {hasDiscount && <Badge className="absolute top-2 left-2 text-white border-0 text-xs font-bold" style={{ backgroundColor: store.primary_color }}>-{discountPercent}%</Badge>}
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-sm truncate">{p.name}</h3>
                    {getAvgRating(p.id) && <div className="flex items-center gap-1 mt-0.5"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /><span className="text-xs">{getAvgRating(p.id)}</span></div>}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-black text-sm" style={{ color: store.primary_color }}>{p.discount_price || p.price} جنيه</span>
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
