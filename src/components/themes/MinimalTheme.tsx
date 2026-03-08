import { ThemeProps } from "./ThemeProps";
import { ShoppingCart, Search, Star, Share2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function MinimalTheme({ store, products, categories, filteredProducts, featuredProducts, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, getAvgRating, onProductClick, cartCount, onCartOpen, onShare }: ThemeProps) {
  return (
    <>
      {/* Ultra minimal header */}
      <header className="border-b border-border bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {store.logo_url ? (
                <img src={store.logo_url} alt={store.store_name} className="h-9 w-9 rounded-lg object-cover" />
              ) : (
                <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: store.primary_color }}>
                  {store.store_name?.charAt(0)}
                </div>
              )}
              <h1 className="font-bold text-lg">{store.store_name}</h1>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onShare}><Share2 className="h-4 w-4" /></Button>
              {store.whatsapp_number && (
                <a href={`https://wa.me/${store.whatsapp_number}`} target="_blank">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><MessageCircle className="h-4 w-4" /></Button>
                </a>
              )}
              <Button variant="outline" size="sm" className="rounded-full relative gap-1" onClick={onCartOpen}>
                <ShoppingCart className="h-3.5 w-3.5" />
                {cartCount > 0 && <span className="text-xs font-bold" style={{ color: store.primary_color }}>{cartCount}</span>}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Banner */}
      {store.banner_url && (
        <div className="h-36 overflow-hidden">
          <img src={store.banner_url} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Search + Categories inline */}
      <div className="container mt-4 space-y-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10 rounded-lg h-10 border bg-background" />
        </div>
        {categories.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            <button onClick={() => setSelectedCategory(null)} className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${!selectedCategory ? 'text-white' : 'bg-muted text-muted-foreground'}`} style={!selectedCategory ? { backgroundColor: store.primary_color } : {}}>
              الكل
            </button>
            {categories.map(c => (
              <button key={c.id} onClick={() => setSelectedCategory(c.id)} className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${selectedCategory === c.id ? 'text-white' : 'bg-muted text-muted-foreground'}`} style={selectedCategory === c.id ? { backgroundColor: store.primary_color } : {}}>
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Products - clean 2 col */}
      <main className="flex-1 container py-5 pb-8">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">لا توجد منتجات</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map(p => {
              const hasDiscount = p.discount_price && p.discount_price < p.price;
              return (
                <div key={p.id} className="cursor-pointer group" onClick={() => onProductClick(p.id)}>
                  <div className="relative aspect-square rounded-lg overflow-hidden mb-2 bg-muted">
                    {p.main_image_url ? (
                      <img src={p.main_image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    ) : <div className="w-full h-full" />}
                    {hasDiscount && <Badge className="absolute top-1.5 left-1.5 bg-destructive text-destructive-foreground border-0 text-[10px] px-1.5">خصم</Badge>}
                  </div>
                  <h3 className="text-sm font-medium truncate">{p.name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-sm font-bold" style={{ color: store.primary_color }}>{p.discount_price || p.price} جنيه</span>
                    {hasDiscount && <span className="text-[11px] text-muted-foreground line-through">{p.price}</span>}
                  </div>
                  {getAvgRating(p.id) && <div className="flex items-center gap-0.5 mt-0.5"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /><span className="text-[11px]">{getAvgRating(p.id)}</span></div>}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
