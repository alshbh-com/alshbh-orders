export interface ThemeProps {
  store: any;
  products: any[];
  categories: any[];
  filteredProducts: any[];
  featuredProducts: any[];
  bestSellers: any[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (c: string | null) => void;
  getAvgRating: (id: string) => string | null;
  onProductClick: (productId: string) => void;
  cartCount: number;
  onCartOpen: () => void;
  onShare: () => void;
}
