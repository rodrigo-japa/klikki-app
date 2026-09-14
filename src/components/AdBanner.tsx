import React from 'react';
import { Megaphone } from 'lucide-react';

interface AdBannerProps {
  onAdvertiseClick?: () => void;
}

export const AdBanner: React.FC<AdBannerProps> = () => {
  return (
    <div
      id="advertisement-banner-container"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6"
    >
      <div
        id="ad-banner-placeholder"
        className="relative overflow-hidden rounded-2xl border border-dashed border-orange-300/80 bg-orange-50/40 p-4 sm:p-5 text-center sm:text-left transition-all hover:bg-orange-50/70"
      >
        <div className="flex flex-col sm:flex-row items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm bg-orange-100 text-orange-700 border border-orange-200">
                Espaço Publicitário
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Banner Horizontal (Placeholder)
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-700 mt-1">
              Destaque sua empresa ou serviço para milhares de clientes da sua região.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
