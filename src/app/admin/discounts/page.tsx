"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { PromoCode } from "@/lib/types";
import { Plus, Trash2, X } from "lucide-react";
import { useToast } from "@/context/toast-context";

export default function DiscountsPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const { success, error: toastError } = useToast();
  
  // New code state
  const [newCode, setNewCode] = useState<Partial<PromoCode>>({
      code: "",
      discount_percent: 10,
      usage_limit: 100,
      is_active: true
  });

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    setIsLoading(true);
    try {
        const { data, error } = await supabase
            .from('promo_codes')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (data) setCodes(data);
        if (error) console.error("Error", error);
    } catch (error) {
        console.error("Error fetching codes:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const { data, error } = await supabase
            .from('promo_codes')
            .insert([newCode])
            .select();
          
          if (error) throw error;
          if (data) setCodes([...data, ...codes]);
          setIsCreating(false);
          setNewCode({ code: "", discount_percent: 10, usage_limit: 100, is_active: true });
          success("Promo code created successfully.");
      } catch (error: any) {
          console.error("Error creating code:", error);
          toastError(error.message || "Failed to create code");
      }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
      try {
          const { error } = await supabase
            .from('promo_codes')
            .update({ is_active: !currentStatus })
            .eq('id', id);
          
          if (error) throw error;
          
          setCodes(codes.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
          success(`Promo code ${!currentStatus ? 'activated' : 'disabled'}.`);
      } catch (error) {
          console.error("Error updating status:", error);
          toastError("Failed to update status.");
      }
  };
  
  const deleteCode = async (id: string) => {
      if(!confirm("Delete this promo code?")) return;
      try {
          const { error } = await supabase.from('promo_codes').delete().eq('id', id);
          if (error) throw error;
          setCodes(codes.filter(c => c.id !== id));
          success("Promo code deleted.");
      } catch (error) {
          console.error("Error deleting code:", error);
          toastError("Failed to delete code.");
      }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-3xl font-heading font-bold mb-1">DISCOUNTS</h2>
            <p className="text-gray-500 font-mono text-sm">Manage promo codes and offers.</p>
        </div>
        <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center justify-center gap-2 bg-primary text-black px-6 py-3 rounded font-bold hover:bg-white transition-colors"
        >
            <Plus size={18} />
            <span>NEW CODE</span>
        </button>
      </div>

      {isCreating && (
          <div className="bg-[#111] border border-[#333] p-6 rounded-lg animate-in slide-in-from-top-4">
              <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-xl">Create New Code</h3>
                  <button onClick={() => setIsCreating(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Code Name</label>
                      <input 
                        type="text" 
                        required
                        value={newCode.code}
                        onChange={e => setNewCode({...newCode, code: e.target.value.toUpperCase()})}
                        className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 font-mono uppercase"
                        placeholder="SUMMER2025"
                      />
                  </div>
                  <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Discount %</label>
                      <input 
                        type="number" 
                        required
                        min="1" max="100"
                        value={newCode.discount_percent}
                        onChange={e => setNewCode({...newCode, discount_percent: parseInt(e.target.value)})}
                        className="w-full bg-[#222] border border-[#333] rounded px-4 py-2"
                      />
                  </div>
                  <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Usage Limit</label>
                      <input 
                        type="number" 
                        min="0"
                        value={newCode.usage_limit}
                        onChange={e => setNewCode({...newCode, usage_limit: parseInt(e.target.value)})}
                        className="w-full bg-[#222] border border-[#333] rounded px-4 py-2"
                      />
                  </div>
                  <button type="submit" className="bg-white text-black font-bold px-4 py-2 rounded h-10 hover:bg-gray-200">
                      CREATE
                  </button>
              </form>
          </div>
      )}

      {isLoading ? (
          <div className="text-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-500 font-mono">Loading discounts...</p>
          </div>
      ) : (
          <div className="bg-[#111] border border-[#333] rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead className="bg-[#1a1a1a] text-gray-500 font-mono text-xs uppercase tracking-widest">
                    <tr>
                        <th className="p-4 font-normal">Code</th>
                        <th className="p-4 font-normal">Discount</th>
                        <th className="p-4 font-normal">Usage</th>
                        <th className="p-4 font-normal">Status</th>
                        <th className="p-4 font-normal text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#333]">
                    {codes.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-gray-500">No promo codes active.</td>
                        </tr>
                    )}
                    {codes.map((code) => (
                        <tr key={code.id} className="hover:bg-[#1a1a1a] transition-colors">
                            <td className="p-4 font-mono font-bold text-lg">{code.code}</td>
                            <td className="p-4 text-green-500 font-bold">{code.discount_percent}% OFF</td>
                            <td className="p-4 font-mono text-sm text-gray-400">
                                {code.usage_count} / {code.usage_limit || '∞'}
                            </td>
                            <td className="p-4">
                                <button 
                                    onClick={() => toggleStatus(code.id, code.is_active)}
                                    className={`text-[10px] uppercase border px-2 py-1 rounded font-bold transition-colors ${
                                        code.is_active 
                                        ? 'border-green-900 text-green-500 bg-green-900/10' 
                                        : 'border-red-900 text-red-500 bg-red-900/10'
                                    }`}
                                >
                                    {code.is_active ? 'Active' : 'Disabled'}
                                </button>
                            </td>
                            <td className="p-4 text-right">
                                <button 
                                    onClick={() => deleteCode(code.id)}
                                    className="p-2 hover:bg-red-900/20 rounded text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
      )}
    </div>
  );
}
