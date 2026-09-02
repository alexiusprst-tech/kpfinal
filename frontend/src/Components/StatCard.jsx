import { Link } from '@inertiajs/react';
import { ArrowUpRight } from 'lucide-react';

export default function StatCard({ label, value, icon: Icon, color, href }) {
    const cardContent = (
        <div className={`bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex flex-col gap-3 transition-all duration-200 ${href ? 'hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5 group cursor-pointer' : ''
            }`}>
            <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0 transition-transform duration-200 ${href ? 'group-hover:scale-105' : ''} shadow-xs`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                {href && (
                    <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#801720]/10 group-hover:text-[#801720] transition-colors">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                )}
            </div>
            <div className="min-w-0">
                <p className="text-2xl font-extrabold text-gray-800 leading-tight tracking-tight">{value}</p>
                <p className={`text-xs text-gray-500 font-medium leading-snug truncate ${href ? 'group-hover:text-gray-900' : ''} transition-colors`}>{label}</p>
            </div>
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="block focus:outline-none focus:ring-2 focus:ring-[#801720]/20 rounded-2xl">
                {cardContent}
            </Link>
        );
    }

    return cardContent;
}
