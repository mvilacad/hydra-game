import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { cn } from '@/lib/utils';
import { Smartphone, Wifi, Users, Play, Pause } from 'lucide-react';

interface QRCodeDisplayProps {
  className?: string;
  onStartBattle?: () => void;
  canStart?: boolean;
  playerCount?: number;
}

export function QRCodeDisplay({ className, onStartBattle, canStart = false, playerCount = 0 }: QRCodeDisplayProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        // Get current URL and modify for mobile
        const currentUrl = window.location.href;
        const mobileUrl = currentUrl.replace('?view=hub', '?view=mobile');
        
        const qrCodeData = await QRCode.toDataURL(mobileUrl, {
          errorCorrectionLevel: 'M',
          type: 'image/png',
          quality: 0.92,
          margin: 1,
          color: {
            dark: '#ef4444', // Red color
            light: '#ffffff'
          },
          width: 200
        });
        
        setQrCodeDataUrl(qrCodeData);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQRCode();
  }, []);

  return (
    <div className={cn("game-card max-w-sm mx-auto p-6", className)}>
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="badge-purple">
            <Smartphone className="w-4 h-4 mr-2 inline" />
            Batalha
          </div>
          <h3 className="title-large">Entrar!</h3>
        </div>
        {/* QR Code */}
        <div className="flex justify-center">
          <div className="relative p-3 bg-white rounded-lg">
            {qrCodeDataUrl ? (
              <img 
                src={qrCodeDataUrl} 
                alt="QR Code para entrar na batalha" 
                className="w-32 h-32 sm:w-40 sm:h-40"
              />
            ) : (
              <div className="w-32 h-32 sm:w-40 sm:h-40 bg-gray-200 rounded flex items-center justify-center">
                <div className="text-gray-500 text-xs">Gerando...</div>
              </div>
            )}
            
            {/* Corner decorations */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-l-2 border-t-2 border-red-500 rounded-tl" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-r-2 border-t-2 border-red-500 rounded-tr" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-l-2 border-b-2 border-red-500 rounded-bl" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-r-2 border-b-2 border-red-500 rounded-br" />
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-white font-medium text-sm">
            <Smartphone className="w-4 h-4 text-blue-400" />
            Escaneie com seu celular
          </div>
          
          <p className="text-gray-300 text-xs">
            Use a câmera do celular
          </p>

          {/* URL for manual access */}
          <div className="bg-gray-800/50 p-2 rounded border border-gray-600/30">
            <p className="text-xs text-gray-400 mb-1">Ou acesse:</p>
            <p className="text-xs text-blue-400 font-mono break-all">
              localhost:5000/?view=mobile
            </p>
          </div>
        </div>

        {/* Player Count */}
        <div className="flex items-center justify-center gap-2 p-2 bg-gray-800/30 rounded border border-gray-600/30">
          <Users className="w-4 h-4 text-green-400" />
          <span className="text-white font-semibold text-sm">{playerCount}</span>
          <span className="text-gray-400 text-xs">jogadores</span>
          <div className={cn(
            "w-2 h-2 rounded-full ml-1",
            playerCount > 0 ? "bg-green-400 animate-pulse" : "bg-gray-500"
          )} />
        </div>

        {/* Start Battle Button */}
        <div className="pt-1">
          <button
            onClick={onStartBattle}
            disabled={!canStart}
            className={cn(
              "w-full py-3 px-4 rounded-lg font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2",
              canStart 
                ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 animate-pulse-red" 
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            )}
          >
            {canStart ? (
              <>
                <Play className="w-4 h-4" />
                Iniciar Batalha!
              </>
            ) : (
              <>
                <Pause className="w-4 h-4" />
                Aguardando...
              </>
            )}
          </button>
          
          {!canStart && (
            <p className="text-center text-xs text-gray-400 mt-1">
              Precisa de jogadores
            </p>
          )}
        </div>
      </div>
    </div>
  );
}