import { Link } from '@inertiajs/react';
import { ArrowUpRight } from 'lucide-react';

export default function StatCard({ 
    label, 
    value, 
    icon: Icon, 
    color, 
    badgeBg, 
    iconBg, 
    iconColor, 
    href, 
    sublabel 
}) {
    const bgClass = iconBg || color || badgeBg || 'bg-blue-600';
    const textClass = iconColor || 'text-white';

    const cardContent = (
        <div className={`bg-white border border-slate-200/90 rounded-[8px] p-4 flex flex-col gap-3 shadow-2xs transition-colors duration-150 ${
            href ? 'hover:border-slate-300 hover:bg-slate-50/50 group cursor-pointer' : ''
        }`}>
            <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-[6px] ${bgClass} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${textClass}`} />
                </div>
                {href && (
                    <div className="w-6 h-6 rounded-[4px] bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-[#9E1B28]/10 group-hover:text-[#9E1B28] transition-colors">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                )}
            </div>
            <div className="min-w-0">
                <p className="text-2xl font-bold text-slate-900 leading-tight tracking-tight">{value}</p>
                <p className={`text-xs text-slate-500 font-normal leading-snug truncate ${href ? 'group-hover:text-slate-900' : ''} transition-colors`}>{label}</p>
                {sublabel && (
                    <p className="text-[11px] text-slate-400 font-normal mt-0.5 truncate">{sublabel}</p>
                )}
            </div>
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="block focus:outline-hidden focus:ring-2 focus:ring-[#9E1B28]/20 rounded-[8px]">
                {cardContent}
            </Link>
        );
    }

    return cardContent;
}
