"use client";

import { Edit, Trash2, Power, Eye } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CampaignSettings } from "@/lib/types";

interface CampaignCardProps {
    id: string;
    name: string;
    isActive: boolean;
    settings: CampaignSettings;
    onDelete: (id: string) => void;
    onActivate: (id: string) => void;
}

export function CampaignCard({ id, name, isActive, settings, onDelete, onActivate }: CampaignCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    // Extract theme colors for visual preview
    const bgColor = settings.theme?.colors?.background || '#000000';
    const primaryColor = settings.theme?.colors?.primary || '#ffffff';
    const bannerColor = settings.banner?.backgroundColor || '#333333';

    return (
        <div 
            className={`relative group bg-[#111] border rounded-xl overflow-hidden transition-all duration-300 ${
                isActive ? 'border-primary ring-1 ring-primary shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'border-[#333] hover:border-gray-500'
            }`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Active Badge */}
            {isActive ? <div className="absolute top-3 right-3 z-20 px-2 py-0.5 bg-primary text-black text-[10px] font-bold rounded-full uppercase tracking-wider animate-pulse">
                    Active
                </div> : null}

            {/* Card Content - Click to Edit */}
            <Link href={`/admin/discounts/${id}`} className="block h-full">
                {/* Visual Preview Header */}
                <div 
                    className="h-32 relative w-full overflow-hidden"
                    style={{ backgroundColor: bgColor }}
                >
                    {/* Mock Banner */}
                    {settings.banner?.enabled ? <div 
                            className="absolute top-0 left-0 right-0 h-6 w-full flex items-center justify-center text-[8px] font-mono tracking-widest z-10"
                            style={{ 
                                backgroundColor: bannerColor, 
                                color: settings.banner?.textColor,
                                backgroundImage: settings.banner?.backgroundImage ? `url(${settings.banner?.backgroundImage})` : undefined,
                                backgroundSize: 'cover'
                            }}
                        >
                            <span className="truncate px-4 opacity-80">{settings.banner?.text || "BANNER"}</span>
                        </div> : null}

                    {/* Mock Hero/Content */}
                    <div className="absolute inset-0 flex items-center justify-center pt-6">
                        <div className="text-center">
                            <div className="text-2xl font-heading font-bold opacity-30" style={{ color: primaryColor }}>
                                {settings.theme?.name || "THEME"}
                            </div>
                        </div>
                    </div>

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent pointer-events-none" />
                </div>

                {/* Card Body */}
                <div className="p-5">
                    <h3 className="text-lg font-bold text-white mb-1 truncate font-heading">{name}</h3>
                    <div className="flex gap-2 text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-4">
                        <span>{settings.discount?.enabled ? `${settings.discount.value}% OFF` : 'NO DISCOUNT'}</span>
                        <span>•</span>
                        <span>{settings.theme?.name || 'Default'}</span>
                    </div>

                    {/* Quick Stats or Preview Info */}
                    <div className="flex gap-2 mt-2">
                         {settings.banner?.enabled ? <span className="px-2 py-1 bg-[#222] rounded text-[10px] text-gray-400">Banner On</span> : null}
                         {settings.discount?.enabled ? <span className="px-2 py-1 bg-[#222] rounded text-[10px] text-gray-400">Discount On</span> : null}
                    </div>
                </div>
            </Link>

            {/* Actions Toolbar - Always visible on mobile, visible on hover for desktop */}
            <div className={`absolute bottom-0 left-0 right-0 p-4 flex gap-2 justify-end bg-gradient-to-t from-black via-black/90 to-transparent pt-8 transition-opacity duration-200 ${
                isHovered ? 'opacity-100' : 'opacity-100 md:opacity-0'
            }`}>
                <button
                    onClick={(e) => { e.stopPropagation(); onActivate(id); }}
                    className={`p-2 rounded-lg transition-colors ${
                        isActive 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/50 cursor-default' 
                        : 'bg-[#222] text-gray-400 hover:text-white hover:bg-[#333] border border-[#333]'
                    }`}
                    title={isActive ? "Currently Active" : "Activate Campaign"}
                >
                    <Power size={16} />
                </button>
                
                <Link 
                    href={`/admin/discounts/${id}`}
                    className="p-2 bg-[#222] text-gray-400 hover:text-white hover:bg-[#333] rounded-lg border border-[#333] transition-colors"
                >
                    <Edit size={16} />
                </Link>

                <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(id); }}
                    className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg border border-red-500/20 transition-colors"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}

