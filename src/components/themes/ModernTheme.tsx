import { ThemeProps } from "./ThemeProps";
import { ShoppingCart, Search, Star, Share2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function ModernTheme({ store, products, categories, filteredProducts, featuredProducts, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, getAvgRating, onProductClick, cartCount, onCartOpen, onShare }: ThemeProps) {
  return (
    <>
      {/* Sticky clean header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="container py-3">
          <div className="flex items-center gap-3">
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.store_name} className="h-10 w-10 rounded-xl object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: store.primary_color }}>
                {store.store_name?.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-base truncate">{store.store_name}</h1>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={onShare}><Share2 className="h-4 w-4" /></Button>
              {store.whatsapp_number && (
                <a href={`https://wa.me/${store.whatsapp_number}`} target="_blank">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full"><MessageCircle className="h-4 w-4" /></Button>
                </a>
              )}
              <Button size="icon" className="h-9 w-9 rounded-full relative text-white" style={{ backgroundColor: store.primary_color }} onClick={onCartOpen}>
                <ShoppingCart className="h-4 w-4" />
                {cartCount > 0 && <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-white text-[10px] flex items-center justify-center font-bold">{cartCount}</span>}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Banner */}
      {store.banner_url && (
        <div className="h-40 overflow-hidden">
          <img src={store.banner_url} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Search */}
      <div className="container mt-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="ابحث عن منتج..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10 rounded-xl h-10 bg-muted border-0" />
        </div>
      </div>

      {/* Categories - underline style */}
      {categories.length > 0 && (
        <div className="container mt-3 border-b border-border">
          <div className="flex gap-0 overflow-x-auto scrollbar-hide">
            <button onClick={() => setSelectedCategory(null)} className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${!selectedCategory ? '' : 'border-transparent text-muted-foreground'}`} style={!selectedCategory ? { borderColor: store.primary_color, color: store.primary_color } : {}}>
              الكل
            </button>
            {categories.map(c => (
              <button key={c.id} onClick={() => setSelectedCategory(c.id)} className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${selectedCategory === c.id ? '' : 'border-transparent text-muted-foreground'}`} style={selectedCategory === c.id ? { borderColor: store.primary_color, color: store.primary_color } : {}}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Featured horizontal */}
      {featuredProducts.length > 0 && !searchQuery && !selectedCategory && (
        <section className="container mt-4">
          <h2 className="text-sm font-bold mb-3" style={{ color: store.primary_color }}>✦ مميز</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {featuredProducts.map(p => (
              <div key={p.id} className="w-40 shrink-0 cursor-pointer group" onClick={() => onProductClick(p.id)}>
                <div className="aspect-square rounded-xl overflow-hidden mb-2">
                  {p.main_image_url ? (
                    <img src={p.main_image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                  ) : <div className="w-full h-full bg-muted" />}
                </div>
                <h3 className="text-xs font-semibold truncate">{p.name}</h3>
                <p className="text-xs font-bold mt-0.5" style={{ color: store.primary_color }}>{p.discount_price || p.price} جنيه</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Products - clean 3-col grid */}
      <main className="flex-1 container py-4 pb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm">{selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : "كل المنتجات"}</h2>
          <span className="text-xs text-muted-foreground">{filteredProducts.length} منتج</span>
        </div>
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">لا توجد منتجات</div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {filteredProducts.map(p => {
              const hasDiscount = p.discount_price && p.discount_price < p.price;
              return (
                <div key={p.id} className="bg-card rounded-xl border border-border overflow-hidden cursor-pointer group hover:shadow-md transition-all" onClick={() => onProductClick(p.id)}>
                  <div className="relative aspect-square overflow-hidden">
                    {p.main_image_url ? (
                      <img src={p.main_image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                    ) : <div className="w-full h-full bg-muted" />}
                    {hasDiscount && <Badge className="absolute top-1 left-1 bg-destructive text-destructive-foreground border-0 text-[9px] px-1.5">خصم</Badge>}
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
