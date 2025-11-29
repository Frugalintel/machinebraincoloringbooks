"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Product } from "@/lib/types";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, Eye, EyeOff, CheckSquare, Square, X } from "lucide-react";
import { useToast } from "@/context/toast-context";
import { useSettings } from "@/context/settings-context";
import { logAdminAction } from "@/lib/admin-utils";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
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
        console.error("Error fetching products:", error);
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
          console.error(err);
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
          console.error(err);
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
        <div className="flex items-center gap-2">
            <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded border ${viewMode === 'list' ? 'bg-[#222] border-white text-white' : 'border-[#333] text-gray-500 hover:text-white'}`}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            </button>
            <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded border ${viewMode === 'grid' ? 'bg-[#222] border-white text-white' : 'border-[#333] text-gray-500 hover:text-white'}`}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-16">
                    {filteredProducts.length === 0 && (
                        <div className="col-span-full p-12 text-center text-gray-500 bg-[#111] border border-[#333] rounded-lg">
                            No products found.
                        </div>
                    )}
                    {filteredProducts.map((product, i) => (
                        <div key={product.id} className="group perspective-1000 flex flex-col relative">
                             {/* Selection Checkbox for Grid */}
                             <div className="absolute top-2 left-2 z-50">
                                <button onClick={(e) => { e.preventDefault(); toggleSelection(product.id); }} className="bg-black/50 p-1 rounded backdrop-blur">
                                    {selectedIds.has(product.id) ? <CheckSquare size={20} className="text-primary" /> : <Square size={20} className="text-white/50 hover:text-white" />}
                                </button>
                             </div>

                             <div className="relative aspect-[3/4] w-full bg-[#111] shadow-lg transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-primary/20 border border-[#222] group-hover:border-primary/50 flex flex-col cursor-pointer z-0 hover:z-30">
                                {/* ... existing card content ... */}
                                {/* I'm reusing the existing card but adding the checkbox. 
                                    For brevity I'll truncate the visual parts in my head but I need to output full file.
                                    Actually I will copy the previous grid logic exactly.
                                */}
                                
                                {/* Spine Shadow (Left) */}
                                <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/60 to-transparent z-20 pointer-events-none"></div>
                                
                                <Link href={`/admin/products/${product.id}`} className="block h-full w-full">
                                    <div className="flex flex-col h-full">
                                        {/* Cover Top: Visuals */}
                                        <div className={`flex-1 ${product.color || 'bg-gray-800'} relative overflow-hidden`}>
                                            {/* Top Strip: Title */}
                                            <div className="absolute top-0 left-0 right-0 h-8 bg-black/30 flex items-center justify-center border-b border-black/10 backdrop-blur-sm z-10">
                                                <span className="font-heading text-white/90 text-xs tracking-widest uppercase truncate px-2">{product.subtitle}</span>
                                            </div>

                                            {/* Image or Abstract Art */}
                                            <div className="absolute inset-0 flex items-center justify-center p-4">
                                                <div className="absolute inset-0 opacity-30" 
                                                    style={{ backgroundImage: `radial-gradient(circle at 50% 50%, transparent 20%, #000 120%)` }}></div>
                                                
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt={product.title} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                ) : (
                                                    <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full border-[2px] border-white/20 flex items-center justify-center relative z-10`}>
                                                        <div className={`w-8 h-8 md:w-10 md:h-10 bg-white/10 rounded-full backdrop-blur-md`}></div>
                                                    </div>
                                                )}
                                                
                                                {/* Dither Pattern */}
                                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-multiply pointer-events-none"></div>
                                            </div>
                                        </div>
                                            
                                        {/* Cover Bottom: Data Block */}
                                        <div className="bg-[#0a0a0a] p-3 border-t border-[#333] flex flex-col justify-center relative z-10 min-h-[80px]">
                                            {/* Price & Difficulty */}
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    {globalDiscount.enabled ? (
                                                        <div className="flex flex-col leading-none">
                                                            <span className="text-gray-500 line-through text-[9px] font-mono">${product.price.toFixed(2)}</span>
                                                            <span className="font-heading text-white text-base md:text-lg tracking-tight">${(product.price * (1 - globalDiscount.percentage / 100)).toFixed(2)}</span>
                                                        </div>
                                                    ) : product.discount_percent > 0 ? (
                                                        <div className="flex flex-col leading-none">
                                                            <span className="text-gray-500 line-through text-[9px] font-mono">${product.price.toFixed(2)}</span>
                                                            <span className="font-heading text-white text-base md:text-lg tracking-tight">${(product.price * (1 - product.discount_percent / 100)).toFixed(2)}</span>
                                                        </div>
                                                    ) : (
                                                         <span className="font-heading text-white text-base md:text-lg tracking-tight">${product.price.toFixed(2)}</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end gap-0.5">
                                                    <div className="flex gap-[2px]">
                                                        {[...Array(5)].map((_, idx) => (
                                                            <div key={idx} className={`w-1 h-1.5 rounded-[1px] ${idx < (product.difficulty || 1) ? 'bg-primary' : 'bg-[#222]'}`}></div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Age & Vol */}
                                            <div className="flex items-center justify-between border-t border-[#222] pt-2 mt-auto">
                                                <span className="text-[8px] md:text-[9px] text-gray-400 font-mono uppercase tracking-widest truncate max-w-[60%]">{product.age || "All Ages"}</span>
                                                <span className="text-[8px] md:text-[9px] text-gray-600 font-mono">VOL. {String(i + 1).padStart(3, '0')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>

                                {/* Actions Overlay */}
                                <div className="absolute top-10 right-2 flex flex-col gap-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                                     <Link href={`/admin/products/${product.id}`} className="w-8 h-8 bg-black/80 backdrop-blur text-white flex items-center justify-center rounded hover:bg-primary hover:text-black transition-colors shadow-lg border border-white/10">
                                        <Edit size={14} />
                                    </Link>
                                    <button 
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleStatus(product); }}
                                        className={`w-8 h-8 backdrop-blur text-white flex items-center justify-center rounded hover:bg-white hover:text-black transition-colors shadow-lg border border-white/10 ${product.is_published ? 'bg-green-900/80' : 'bg-gray-800/80'}`}
                                        title={product.is_published ? "Unpublish" : "Publish"}
                                    >
                                        {product.is_published ? <Eye size={14} /> : <EyeOff size={14} />}
                                    </button>
                                    <button 
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(product.id.toString()); }}
                                        className="w-8 h-8 bg-red-900/80 backdrop-blur text-white flex items-center justify-center rounded hover:bg-red-500 transition-colors shadow-lg border border-white/10"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Title Below */}
                            <div className="mt-4 text-center px-1 relative z-20">
                                <h3 className="font-heading text-sm md:text-base text-white uppercase tracking-wide group-hover:text-primary transition-colors truncate">
                                    {product.title}
                                </h3>
                                <div className="flex justify-center mt-1">
                                    <span className={`text-[9px] uppercase border px-1.5 py-0.5 rounded ${product.is_published ? 'border-green-900 text-green-500' : 'border-gray-800 text-gray-500'}`}>
                                        {product.is_published ? 'Live' : 'Draft'}
                                    </span>
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
