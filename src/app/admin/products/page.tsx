"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, Eye, EyeOff, CheckSquare, Square, X, LayoutGrid, List } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Product } from "@/lib/types";
import { useToast } from "@/context/toast-context";
import { useSettings } from "@/context/settings-context";
import { logAdminAction } from "@/lib/admin-utils";
import { logger } from "@/lib/logger";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const { success, error: toastError } = useToast();
  const { globalDiscount } = useSettings();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (!error && data) {
            setProducts(data);
        }
    } catch (error) {
        logger.error("Error fetching products:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleToggleStatus = async (product: Product) => {
      try {
          const newStatus = !product.is_published;
          const { error } = await supabase
            .from('products')
            .update({ is_published: newStatus })
            .eq('id', product.id);

          if (error) throw error;

          await logAdminAction(
              newStatus ? 'publish_product' : 'unpublish_product',
              'products',
              product.id,
              { title: product.title }
          );

          setProducts(products.map(p => p.id === product.id ? { ...p, is_published: newStatus } : p));
          success(newStatus ? "Product published successfully." : "Product unpublished.");
      } catch (err) {
          toastError("Failed to update product status.");
          logger.error("Error updating product status:", err);
      }
  };

  const handleDelete = async (id: string) => {
      if (!confirm("Are you sure you want to delete this product?")) return;

      const product = products.find(p => p.id === id);

      try {
          const { error } = await supabase.from('products').delete().eq('id', id);
          if (error) throw error;

          await logAdminAction(
              'delete_product',
              'products',
              id,
              { title: product?.title }
          );

          setProducts(products.filter(p => p.id !== id));
          if (selectedIds.has(id)) {
              const newSelected = new Set(selectedIds);
              newSelected.delete(id);
              setSelectedIds(newSelected);
          }
          success("Product deleted successfully.");
      } catch (err) {
          toastError("Failed to delete product.");
          logger.error("Error deleting product:", err);
      }
  };

  const toggleSelection = (id: string) => {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(id)) {
          newSelected.delete(id);
      } else {
          newSelected.add(id);
      }
      setSelectedIds(newSelected);
  };

  const toggleAll = () => {
      if (selectedIds.size === filteredProducts.length) {
          setSelectedIds(new Set());
      } else {
          setSelectedIds(new Set(filteredProducts.map(p => p.id)));
      }
  };

  const handleBulkDelete = async () => {
      if (!confirm(`Delete ${selectedIds.size} products?`)) return;

      try {
          const ids = Array.from(selectedIds);
          const { error } = await supabase.from('products').delete().in('id', ids);
          if (error) throw error;

          await logAdminAction(
              'bulk_delete_products',
              'products',
              null,
              { count: ids.length, ids }
          );

          setProducts(products.filter(p => !selectedIds.has(p.id)));
          setSelectedIds(new Set());
          success("Products deleted successfully.");
      } catch (err) {
          toastError("Failed to delete products.");
      }
  };

  const handleBulkStatus = async (publish: boolean) => {
      try {
          const ids = Array.from(selectedIds);
          const { error } = await supabase
            .from('products')
            .update({ is_published: publish })
            .in('id', ids);
          
          if (error) throw error;

          await logAdminAction(
              publish ? 'bulk_publish_products' : 'bulk_unpublish_products',
              'products',
              null,
              { count: ids.length, ids }
          );

          setProducts(products.map(p => selectedIds.has(p.id) ? { ...p, is_published: publish } : p));
          setSelectedIds(new Set());
          success(`Products ${publish ? 'published' : 'unpublished'} successfully.`);
      } catch (err) {
          toastError("Failed to update products.");
      }
  };

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-3xl font-heading font-bold mb-1">PRODUCTS</h2>
            <p className="text-gray-500 font-mono text-sm">Manage your store catalog.</p>
        </div>
        <Link 
            href="/admin/products/new"
            className="flex items-center justify-center gap-2 bg-primary text-black px-6 py-3 rounded font-bold hover:bg-white transition-colors"
        >
            <Plus size={18} />
            <span>ADD PRODUCT</span>
        </Link>
      </div>

      <div className="bg-[#111] border border-[#333] p-4 rounded-lg flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
                type="text" 
                placeholder="Search products..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#222] border border-[#333] rounded py-2 pl-10 pr-4 text-white focus:outline-none focus:border-primary"
            />
        </div>
        <div className="flex items-center gap-2 bg-[#222] p-1 rounded border border-[#333]">
            <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[#333] text-white' : 'text-gray-500 hover:text-white'}`}
                title="Grid View"
            >
                <LayoutGrid size={18} />
            </button>
            <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-[#333] text-white' : 'text-gray-500 hover:text-white'}`}
                title="List View"
            >
                <List size={18} />
            </button>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
          <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-4">
                  <span className="text-primary font-bold">{selectedIds.size} selected</span>
                  <div className="h-6 w-px bg-primary/20 hidden sm:block"></div>
                  <div className="flex items-center gap-4">
                    <button 
                        onClick={() => handleBulkStatus(true)}
                        className="text-sm hover:text-white text-gray-400 transition-colors"
                    >
                        Publish
                    </button>
                    <button 
                        onClick={() => handleBulkStatus(false)}
                        className="text-sm hover:text-white text-gray-400 transition-colors"
                    >
                        Unpublish
                    </button>
                    <button 
                        onClick={handleBulkDelete}
                        className="text-sm hover:text-red-500 text-red-900/50 transition-colors"
                    >
                        Delete
                    </button>
                  </div>
              </div>
              <button onClick={() => setSelectedIds(new Set())} className="text-gray-500 hover:text-white">
                  <X size={20} />
              </button>
          </div>
      )}

      {isLoading ? (
        <div className="text-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500 font-mono">Loading catalog...</p>
        </div>
      ) : (
        <>
            {viewMode === 'list' ? (
                <div className="bg-[#111] border border-[#333] rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="bg-[#1a1a1a] text-gray-500 font-mono text-xs uppercase tracking-widest">
                                <tr>
                                    <th className="p-4 w-10">
                                        <button onClick={toggleAll} className="flex items-center justify-center">
                                            {selectedIds.size === filteredProducts.length && filteredProducts.length > 0 ? (
                                                <CheckSquare size={16} className="text-primary" />
                                            ) : (
                                                <Square size={16} />
                                            )}
                                        </button>
                                    </th>
                                    <th className="p-4 font-normal">Product</th>
                                    <th className="p-4 font-normal">Price</th>
                                    <th className="p-4 font-normal">Category</th>
                                    <th className="p-4 font-normal">Status</th>
                                    <th className="p-4 font-normal text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#333]">
                                {filteredProducts.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500">
                                            No products found.
                                        </td>
                                    </tr>
                                )}
                                {filteredProducts.map((product) => (
                                    <tr key={product.id} className={`hover:bg-[#1a1a1a] transition-colors group ${selectedIds.has(product.id) ? 'bg-[#1a1a1a]' : ''}`}>
                                        <td className="p-4">
                                            <button onClick={() => toggleSelection(product.id)} className="flex items-center justify-center">
                                                {selectedIds.has(product.id) ? (
                                                    <CheckSquare size={16} className="text-primary" />
                                                ) : (
                                                    <Square size={16} className="text-gray-600" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 ${product.color || 'bg-gray-800'} rounded-md flex items-center justify-center relative overflow-hidden flex-shrink-0`}>
                                                    {product.image_url ? (
                                                        <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-xs font-bold text-white/50">{product.title.substring(0, 2)}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white truncate max-w-[200px]">{product.title}</div>
                                                    <div className="text-xs text-gray-500 font-mono uppercase truncate max-w-[200px]">{product.subtitle}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono">
                                            ${product.price.toFixed(2)}
                                            {globalDiscount.enabled ? (
                                                <span className="ml-2 text-xs text-primary">-{globalDiscount.percentage}% (Global)</span>
                                            ) : product.discount_percent > 0 ? (
                                                <span className="ml-2 text-xs text-green-500">-{product.discount_percent}%</span>
                                            ) : null}
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-[#222] border border-[#333] text-xs px-2 py-1 rounded font-mono uppercase text-gray-400">
                                                {product.category}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${product.is_published ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                                                <span className="text-xs text-gray-400">{product.is_published ? 'Published' : 'Draft'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link href={`/admin/products/${product.id}`} className="p-2 hover:bg-[#333] rounded text-gray-400 hover:text-white">
                                                    <Edit size={16} />
                                                </Link>
                                                <button 
                                                    onClick={() => handleToggleStatus(product)}
                                                    className="p-2 hover:bg-[#333] rounded text-gray-400 hover:text-white"
                                                    title={product.is_published ? "Unpublish" : "Publish"}
                                                >
                                                    {product.is_published ? <Eye size={16} /> : <EyeOff size={16} />}
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(product.id.toString())}
                                                    className="p-2 hover:bg-red-900/20 rounded text-gray-400 hover:text-red-500"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredProducts.length === 0 && (
                        <div className="col-span-full p-20 text-center text-gray-500 bg-[#111] border border-[#333] rounded-lg border-dashed">
                            <p className="font-heading text-xl mb-2">No products found</p>
                            <p className="text-xs font-mono">Try adjusting your search</p>
                        </div>
                    )}
                    {filteredProducts.map((product, i) => (
                        <div key={product.id} className="group relative bg-[#111] border border-[#333] hover:border-gray-500 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-1">
                             {/* Selection Checkbox */}
                             <div className="absolute top-3 left-3 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.preventDefault(); toggleSelection(product.id); }} className="bg-black/80 p-1.5 rounded backdrop-blur border border-white/10 hover:border-white/30 text-white transition-colors">
                                    {selectedIds.has(product.id) ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} className="text-gray-400 hover:text-white" />}
                                </button>
                             </div>

                             {/* Status Badge */}
                             <div className="absolute top-3 right-3 z-30">
                                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded backdrop-blur-md border shadow-sm ${
                                    product.is_published 
                                    ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                    : 'bg-black/60 text-gray-400 border-white/10'
                                }`}>
                                    {product.is_published ? 'Live' : 'Draft'}
                                </span>
                             </div>

                             <Link href={`/admin/products/${product.id}`} className="block h-full">
                                {/* Image / Cover Area */}
                                <div className={`aspect-[3/4] relative w-full overflow-hidden bg-[#050505]`}>
                                    {/* Background Visuals */}
                                    <div className={`absolute inset-0 opacity-20 ${product.color || 'bg-gray-800'}`}></div>
                                    <div className="absolute inset-0 bg-[url('/textures/noise.svg')] opacity-20 mix-blend-overlay"></div>
                                    
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-16 h-16 rounded-full border-2 border-white/10 flex items-center justify-center bg-white/5 backdrop-blur-sm">
                                                <span className="font-heading text-2xl text-white/30">{product.title.substring(0, 2)}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Gradient Overlay for Text */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/50 to-transparent opacity-90"></div>

                                    {/* Content Info */}
                                    <div className="absolute bottom-0 left-0 right-0 p-5">
                                        <div className="flex justify-between items-end mb-2">
                                            <div>
                                                <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-1">{product.category}</p>
                                                <h3 className="font-heading text-lg font-bold text-white leading-tight mb-1 truncate pr-2">{product.title}</h3>
                                                <p className="text-xs text-gray-400 truncate">{product.subtitle}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between border-t border-white/10 pt-3 mt-2">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-500 font-mono uppercase">Price</span>
                                                <span className="font-mono text-white">${product.price.toFixed(2)}</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] text-gray-500 font-mono uppercase">Difficulty</span>
                                                <div className="flex gap-0.5">
                                                    {[...Array(5)].map((_, idx) => (
                                                        <div key={idx} className={`w-1 h-2 rounded-sm ${idx < (product.difficulty || 1) ? 'bg-primary' : 'bg-[#333]'}`}></div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                             </Link>

                             {/* Actions Footer (Slide up on hover) */}
                             <div className="absolute bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#333] p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-200 flex justify-between items-center z-40">
                                <button 
                                    onClick={(e) => { e.preventDefault(); handleToggleStatus(product); }}
                                    className="p-2 hover:bg-[#333] rounded text-gray-400 hover:text-white transition-colors"
                                    title={product.is_published ? "Unpublish" : "Publish"}
                                >
                                    {product.is_published ? <Eye size={16} /> : <EyeOff size={16} />}
                                </button>
                                
                                <div className="flex gap-2">
                                    <Link href={`/admin/products/${product.id}`} className="p-2 hover:bg-[#333] rounded text-gray-400 hover:text-white transition-colors">
                                        <Edit size={16} />
                                    </Link>
                                    <button 
                                        onClick={(e) => { e.preventDefault(); handleDelete(product.id.toString()); }}
                                        className="p-2 hover:bg-red-900/20 rounded text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                             </div>
                        </div>
                    ))}
                </div>
            )}
        </>
      )}
    </div>
  );
}
