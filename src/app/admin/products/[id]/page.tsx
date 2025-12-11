"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Save, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Product } from "@/lib/types";
import { ImageUpload } from "@/components/image-upload";
import { categories } from "@/lib/store-data";
import { useToast } from "@/context/toast-context";
import { logAdminAction } from "@/lib/admin-utils";
import { logger } from "@/lib/logger";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { success, error: toastError, info } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState<Partial<Product>>({
    title: "",
    subtitle: "",
    description: "",
    price: 0,
    discount_percent: 0,
    category: "SCI-FI",
    difficulty: 1,
    age: "All Ages",
    color: "bg-gray-800",
    accent: "bg-blue-500",
    is_published: false,
    image_url: ""
  });

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
      try {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();
          
          if (error) {
              if (id.length > 5) throw error;
              info("Editing static demo product (read-only).");
          }
          if (data) {
              setFormData(data);
          }
      } catch (error) {
          logger.error("Error fetching product:", error);
          toastError("Failed to load product.");
      } finally {
          setFetching(false);
      }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
     setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }));
  };

  const handleImageUpload = (url: string) => {
      setFormData(prev => ({ ...prev, image_url: url }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (id.length < 5) {
        info("Cannot save changes to static demo product.");
        setLoading(false);
        return;
    }

    try {
        const { error } = await supabase
            .from('products')
            .update(formData)
            .eq('id', id);
        
        if (error) throw error;

        await logAdminAction(
            'update_product',
            'products',
            id,
            { title: formData.title, changes: formData }
        );

        success("Product updated successfully!");
        router.push('/admin/products');
        router.refresh();
    } catch (error) {
        logger.error("Error updating product:", error);
        toastError(error instanceof Error ? error.message : "Failed to update product.");
    } finally {
        setLoading(false);
    }
  };
  
  const handleDelete = async () => {
      if(!confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;
      
      if (id.length < 5) {
          info("Cannot delete static demo product.");
          return;
      }

      try {
          const { error } = await supabase.from('products').delete().eq('id', id);
          if (error) throw error;

          await logAdminAction(
              'delete_product',
              'products',
              id,
              { title: formData.title }
          );

          success("Product deleted successfully.");
          router.push('/admin/products');
          router.refresh();
      } catch(error) {
          logger.error("Error deleting product:", error);
          toastError(error instanceof Error ? error.message : "Failed to delete product.");
      }
  }

  // Predefined Tailwind colors for selection
  const colorOptions = [
    { label: "Red", value: "bg-red-600" },
    { label: "Orange", value: "bg-orange-600" },
    { label: "Yellow", value: "bg-yellow-500" },
    { label: "Green", value: "bg-green-600" },
    { label: "Teal", value: "bg-teal-600" },
    { label: "Blue", value: "bg-blue-600" },
    { label: "Indigo", value: "bg-indigo-600" },
    { label: "Purple", value: "bg-purple-600" },
    { label: "Pink", value: "bg-pink-600" },
    { label: "Gray", value: "bg-gray-800" },
    { label: "Black", value: "bg-black" },
  ];
  
  if (fetching) {
      return (
          <div className="flex items-center justify-center min-h-[50vh]">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
      )
  }

  return (
    <div className="container mx-auto pb-20 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pt-4">
            <div className="flex items-center gap-4">
                <Link href="/admin/products" className="p-2 hover:bg-[#222] rounded-full transition-colors text-gray-400 hover:text-white">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-3xl font-heading font-bold text-white">Edit Product</h1>
                    <p className="text-gray-400 font-mono text-xs uppercase tracking-widest mt-1">
                        {formData.title || "New Product"}
                    </p>
                </div>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={handleDelete}
                    className="flex items-center gap-2 text-red-500 hover:bg-red-900/10 px-4 py-2 rounded transition-colors border border-transparent hover:border-red-900/20"
                >
                    <Trash2 size={16} />
                    <span className="text-xs font-bold uppercase hidden md:inline">Delete</span>
                </button>
                <button 
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center gap-2 bg-primary text-black px-6 py-3 rounded font-bold hover:bg-white transition-colors disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    <span>SAVE CHANGES</span>
                </button>
            </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Core Details */}
        <div className="lg:col-span-2 space-y-8 order-2 lg:order-1">
            
            {/* Step 1: Basic Info */}
            <div className="bg-[#111] border border-[#333] rounded-xl p-6">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-black flex items-center justify-center text-xs font-bold">1</span>
                    Core Information
                </h3>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Title</label>
                            <input 
                                type="text" 
                                name="title"
                                required
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full bg-[#222] border border-[#333] rounded px-4 py-3 text-white focus:outline-none focus:border-primary font-bold"
                                placeholder="Product Name"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Subtitle</label>
                            <input 
                                type="text" 
                                name="subtitle"
                                value={formData.subtitle}
                                onChange={handleChange}
                                className="w-full bg-[#222] border border-[#333] rounded px-4 py-3 text-white focus:outline-none focus:border-primary"
                                placeholder="Short description"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Description</label>
                        <textarea 
                            name="description"
                            rows={5}
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full bg-[#222] border border-[#333] rounded px-4 py-3 text-white focus:outline-none focus:border-primary leading-relaxed"
                            placeholder="Detailed product description..."
                        />
                    </div>
                </div>
            </div>

            {/* Step 2: Pricing & Categorization */}
            <div className="bg-[#111] border border-[#333] rounded-xl p-6">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-black flex items-center justify-center text-xs font-bold">2</span>
                    Market Data
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                     <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Price ($)</label>
                        <input 
                            type="number" 
                            name="price"
                            min="0"
                            step="0.01"
                            required
                            value={formData.price}
                            onChange={handleChange}
                            className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 text-white focus:outline-none focus:border-primary font-mono"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Discount %</label>
                        <input 
                            type="number" 
                            name="discount_percent"
                            min="0"
                            max="100"
                            value={formData.discount_percent}
                            onChange={handleChange}
                            className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 text-white focus:outline-none focus:border-primary font-mono"
                        />
                    </div>
                     <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Difficulty</label>
                        <input 
                            type="number" 
                            name="difficulty"
                            min="1"
                            max="5"
                            value={formData.difficulty}
                            onChange={handleChange}
                            className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 text-white focus:outline-none focus:border-primary font-mono"
                        />
                    </div>
                     <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Age Rating</label>
                        <input 
                            type="text" 
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 text-white focus:outline-none focus:border-primary"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Category</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {categories.filter(c => c !== "ALL").map(c => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, category: c }))}
                                className={`px-3 py-2 rounded text-xs font-mono uppercase border transition-colors ${
                                    formData.category === c 
                                    ? 'bg-primary text-black border-primary font-bold' 
                                    : 'bg-[#1a1a1a] border-[#333] text-gray-400 hover:border-white'
                                }`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column: Preview & Visuals */}
        <div className="lg:col-span-1 space-y-8 order-1 lg:order-2">
            
            {/* Live Preview Card */}
            <div className="space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-widest text-gray-500">Live Preview</h3>
                <div className="group relative bg-[#111] border border-[#333] rounded-xl overflow-hidden shadow-2xl mx-auto w-[280px]">
                    <div className={`aspect-[3/4] relative w-full overflow-hidden bg-[#050505]`}>
                        {/* Background Visuals */}
                        <div className={`absolute inset-0 opacity-20 ${formData.color || 'bg-gray-800'}`}></div>
                        <div className="absolute inset-0 bg-[url('/textures/noise.svg')] opacity-20 mix-blend-overlay"></div>
                        
                        {formData.image_url ? (
                            <img src={formData.image_url} alt={formData.title || "Preview"} className="absolute inset-0 w-full h-full object-cover opacity-90" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 rounded-full border-2 border-white/10 flex items-center justify-center bg-white/5 backdrop-blur-sm">
                                    <span className="font-heading text-2xl text-white/30">{(formData.title || "NP").substring(0, 2)}</span>
                                </div>
                            </div>
                        )}

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/50 to-transparent opacity-90"></div>

                        {/* Content Info */}
                        <div className="absolute bottom-0 left-0 right-0 p-5">
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-1">{formData.category || "CATEGORY"}</p>
                                    <h3 className="font-heading text-lg font-bold text-white leading-tight mb-1 truncate pr-2">{formData.title || "Product Title"}</h3>
                                    <p className="text-xs text-gray-400 truncate">{formData.subtitle || "Product Subtitle"}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between border-t border-white/10 pt-3 mt-2">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-500 font-mono uppercase">Price</span>
                                    <span className="font-mono text-white">${(formData.price || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] text-gray-500 font-mono uppercase">Difficulty</span>
                                    <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, idx) => (
                                            <div key={idx} className={`w-1 h-2 rounded-sm ${idx < (formData.difficulty || 1) ? 'bg-primary' : 'bg-[#333]'}`}></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Step 3: Media */}
            <div className="bg-[#111] border border-[#333] rounded-xl p-6">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-black flex items-center justify-center text-xs font-bold">3</span>
                    Visual Assets
                </h3>
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-mono uppercase tracking-widest text-gray-500 mb-4">Cover Image</label>
                        <ImageUpload onUpload={handleImageUpload} defaultImage={formData.image_url} />
                    </div>
                    
                    <div className="pt-6 border-t border-[#222]">
                        <label className="block text-xs font-mono uppercase tracking-widest text-gray-500 mb-4">Theme Colors</label>
                        <div className="space-y-4">
                            <div>
                                <span className="text-[10px] text-gray-400 mb-2 block uppercase">Background Base</span>
                                <div className="grid grid-cols-6 gap-2">
                                    {colorOptions.map(c => (
                                        <button
                                            key={c.value}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, color: c.value }))}
                                            className={`w-6 h-6 rounded-full ${c.value.replace('bg-', 'bg-')} ${formData.color === c.value ? 'ring-2 ring-white scale-110' : 'opacity-40 hover:opacity-100'} transition-all`}
                                            title={c.label}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-400 mb-2 block uppercase">Accent Pop</span>
                                <div className="grid grid-cols-6 gap-2">
                                    {colorOptions.map(c => (
                                        <button
                                            key={c.value}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, accent: c.value }))}
                                            className={`w-6 h-6 rounded-full ${c.value.replace('bg-', 'bg-')} ${formData.accent === c.value ? 'ring-2 ring-white scale-110' : 'opacity-40 hover:opacity-100'} transition-all`}
                                            title={c.label}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Publishing Status */}
            <div className="bg-[#111] border border-[#333] rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-sm text-white">Publishing Status</h4>
                        <p className="text-xs text-gray-500 mt-1">Make product visible in store</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            name="is_published"
                            checked={formData.is_published}
                            onChange={handleToggle}
                            className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-900 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                </div>
                <div className={`mt-4 p-3 rounded border text-xs text-center font-mono uppercase tracking-widest ${formData.is_published ? 'bg-green-900/20 text-green-500 border-green-900/50' : 'bg-gray-800/50 text-gray-500 border-gray-700'}`}>
                    {formData.is_published ? '• LIVE •' : '• DRAFT •'}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
