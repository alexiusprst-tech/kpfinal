import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

export default function SearchableSelect({ 
    options = [], 
    value = '', 
    onChange, 
    placeholder = 'Pilih...', 
    searchPlaceholder = 'Cari...',
    disabled = false
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [openUpward, setOpenUpward] = useState(false);
    const containerRef = useRef(null);

    // Filter options based on search query
    const filteredOptions = options.filter(option => {
        const text = String(option.label || '').toLowerCase();
        return text.includes(search.toLowerCase());
    });

    // Find the currently selected option
    const selectedOption = options.find(option => String(option.value) === String(value));
    const displayText = selectedOption ? selectedOption.label : placeholder;

    // Detect if dropdown should flip upwards when near bottom of viewport
    useEffect(() => {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            if (spaceBelow < 260 && rect.top > 260) {
                setOpenUpward(true);
            } else {
                setOpenUpward(false);
            }
        }
    }, [isOpen]);

    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset search query when dropdown closes
    useEffect(() => {
        if (!isOpen) {
            setSearch('');
        }
    }, [isOpen]);

    return (
        <div className="relative w-full" ref={containerRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 border rounded-xl text-xs outline-none bg-white text-left transition-all ${
                    isOpen 
                        ? 'border-[#801720] ring-2 ring-[#801720]/20' 
                        : selectedOption
                        ? 'border-gray-300 hover:border-gray-400 font-semibold text-gray-900'
                        : 'border-gray-200 hover:border-gray-300 text-gray-400'
                } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer'}`}
            >
                <span className={`block truncate pr-2 ${selectedOption ? 'text-gray-900 font-bold' : 'text-gray-400'}`}>
                    {displayText}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-[#801720]' : ''}`} />
            </button>

            {isOpen && (
                <div 
                    className={`absolute z-50 w-full min-w-[280px] bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in duration-100 ${
                        openUpward 
                            ? 'bottom-full mb-1.5 slide-in-from-bottom-1' 
                            : 'top-full mt-1.5 slide-in-from-top-1'
                    }`}
                    style={{ maxHeight: '300px' }}
                >
                    {/* Search Input Box */}
                    <div className="p-2 border-b border-gray-100 flex items-center gap-2 bg-gray-50/80">
                        <Search className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="w-full text-xs outline-none border-none bg-transparent focus:ring-0 p-1 text-gray-800 placeholder-gray-400"
                            autoFocus
                        />
                    </div>

                    {/* Options List */}
                    <div className="overflow-y-auto flex-1 max-h-56 py-1 divide-y divide-gray-50">
                        {filteredOptions.length === 0 ? (
                            <div className="px-4 py-5 text-xs text-gray-400 text-center italic">
                                Dosen tidak ditemukan
                            </div>
                        ) : (
                            filteredOptions.map(option => {
                                const isSelected = String(option.value) === String(value);
                                const isDisabled = Boolean(option.disabled);

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        disabled={isDisabled}
                                        onClick={() => {
                                            if (!isDisabled) {
                                                onChange(option.value);
                                                setIsOpen(false);
                                            }
                                        }}
                                        className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors flex items-center justify-between ${
                                            isDisabled 
                                                ? 'bg-slate-50/90 text-slate-400 cursor-not-allowed select-none' 
                                                : isSelected 
                                                ? 'bg-[#801720]/10 text-[#801720] font-bold cursor-pointer' 
                                                : 'hover:bg-gray-50 text-gray-700 font-medium cursor-pointer'
                                        }`}
                                    >
                                        <span className={`truncate pr-2 ${isDisabled ? 'text-slate-400 font-normal' : ''}`}>
                                            {option.label}
                                        </span>

                                        {/* Disabled Reason Badge + Checkmark */}
                                        {isDisabled && option.badge && (
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold shrink-0 border ${
                                                option.badge === 'Koor' || option.badge === 'Koordinator'
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                            }`}>
                                                <span>{option.badge}</span>
                                                <Check className="w-3 h-3 stroke-[2.5]" />
                                            </span>
                                        )}

                                        {/* Active Selected Checkmark */}
                                        {!isDisabled && isSelected && (
                                            <Check className="w-3.5 h-3.5 text-[#801720] shrink-0 stroke-[2.5]" />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
