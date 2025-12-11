"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Product } from "@/lib/types";
import { ImageUpload } from "@/components/image-upload";
import { categories } from "@/lib/store-data";
import { useToast } from "@/context/toast-context";
import { logAdminAction } from "@/lib/admin-utils";
import { logger } from "@/lib/logger";

export default function NewProductPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  
  const [loading, setLoading] = useState(false);
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

    try {
        const { data, error } = await supabase
            .from('products')
            .insert([formData])
            .select('id')
            .single();
        
        if (error) throw error;

        await logAdminAction(
            'create_product',
            'products',
            data.id,
            { title: formData.title }
        );

        success("Product created successfully!");
        router.push('/admin/products');
        router.refresh();
    } catch (error) {
        logger.error("Error creating product:", error);
        toastError(error instanceof Error ? error.message : "Failed to create product.");
    } finally {
        setLoading(false);
    }
  };
  
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            <Link href="/admin/products" className="p-2 hover:bg-[#222] rounded-full transition-colors">
                <ChevronLeft size={24} />
            </Link>
            <div>
                <h2 className="text-3xl font-heading font-bold">NEW PRODUCT</h2>
                <p className="text-gray-500 font-mono text-sm">Create a new listing.</p>
            </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column - Media */}
            <div className="md:col-span-1 space-y-6">
                <div className="bg-[#111] border border-[#333] p-4 rounded-lg">
                    <label className="block text-xs font-mono uppercase tracking-widest text-gray-500 mb-4">Product Image</label>
                    <ImageUpload onUpload={handleImageUpload} defaultImage={formData.image_url} />
                </div>
                
                <div className="bg-[#111] border border-[#333] p-4 rounded-lg">
                    <label className="block text-xs font-mono uppercase tracking-widest text-gray-500 mb-4">Theme Colors</label>
                    <div className="space-y-4">
                        <div>
                            <span className="text-xs text-gray-400 mb-2 block">Background Color</span>
                            <div className="grid grid-cols-6 gap-2">
                                {colorOptions.map(c => (
                                    <button
                                        key={c.value}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, color: c.value }))}
                                        className={`w-6 h-6 rounded-full ${c.value.replace('bg-', 'bg-')} ${formData.color === c.value ? 'ring-2 ring-white' : 'opacity-50 hover:opacity-100'}`}
                                        title={c.label}
                                    />
                                ))}
                            </div>
                        </div>
                        <div>
                            <span className="text-xs text-gray-400 mb-2 block">Accent Color</span>
                            <div className="grid grid-cols-6 gap-2">
                                {colorOptions.map(c => (
                                    <button
                                        key={c.value}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, accent: c.value }))}
                                        className={`w-6 h-6 rounded-full ${c.value.replace('bg-', 'bg-')} ${formData.accent === c.value ? 'ring-2 ring-white' : 'opacity-50 hover:opacity-100'}`}
                                        title={c.label}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column - Details */}
            <div className="md:col-span-2 space-y-6">
                <div className="bg-[#111] border border-[#333] p-6 rounded-lg space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Title</label>
                            <input 
                                type="text" 
                                name="title"
                                required
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Subtitle</label>
                            <input 
                                type="text" 
                                name="subtitle"
                                value={formData.subtitle}
                                onChange={handleChange}
                                className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Description</label>
                        <textarea 
                            name="description"
                            rows={4}
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 focus:outline-none focus:border-primary"
                        />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
                                className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Discount (%)</label>
                            <input 
                                type="number" 
                                name="discount_percent"
                                min="0"
                                max="100"
                                value={formData.discount_percent}
                                onChange={handleChange}
                                className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 focus:outline-none focus:border-primary"
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
                                className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 focus:outline-none focus:border-primary"
                            />
                        </div>
                         <div className="space-y-2">
                            <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Age Rating</label>
                            <input 
                                type="text" 
                                name="age"
                                value={formData.age}
                                onChange={handleChange}
                                className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Category</label>
                            <select 
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 focus:outline-none focus:border-primary text-white appearance-none"
                            >
                                {categories.filter(c => c !== "ALL").map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex items-center gap-4 pt-8">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    name="is_published"
                                    checked={formData.is_published}
                                    onChange={handleToggle}
                                    className="sr-only peer" 
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                <span className="ml-3 text-sm font-medium text-gray-300">Published</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-4">
                    <Link href="/admin/products" className="px-6 py-3 rounded text-gray-500 hover:text-white transition-colors">
                        Cancel
                    </Link>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="flex items-center gap-2 bg-primary text-black px-8 py-3 rounded font-bold hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-black"></div>
                        ) : (
                            <Save size={18} />
                        )}
                        <span>CREATE PRODUCT</span>
                    </button>
                </div>
            </div>
        </div>
      </form>
    </div>
  );
}
