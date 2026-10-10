import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { QrCode, Download, Copy, Check, X, Smartphone, Printer } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const QrCodeModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    if (isOpen && currentUrl) {
      QRCode.toDataURL(currentUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#034E4B',
          light: '#FFFFFF'
        }
      })
        .then((url) => {
          setDataUrl(url);
        })
        .catch(() => {});
    }
  }, [isOpen, currentUrl]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = '한마음초_프리마켓_신청_QR코드.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md glass-modal p-6 text-slate-800 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-4">
          <div className="w-12 h-12 mx-auto rounded-xl bg-teal-100 text-[#0E9F98] flex items-center justify-center mb-2">
            <QrCode className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            학부모 접속용 QR 코드
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            가정통신문 및 행사장 안내 포스터에 인쇄하여 바로 사용할 수 있습니다.
          </p>
        </div>

        {/* QR 코드 디스플레이 카드 */}
        <div className="bg-white p-5 rounded-2xl border-2 border-teal-100/80 shadow-md text-center max-w-[260px] mx-auto mb-4">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt="신청 QR 코드"
              className="w-full h-auto rounded-lg mx-auto"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center bg-slate-100 rounded-lg text-xs text-slate-400">
              QR 코드 생성 중...
            </div>
          )}
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] font-bold text-teal-900">
            한마음초 프리마켓 & 체험 신청
          </div>
          <p className="text-[10px] text-slate-400">스마트폰 기본 카메라로 비추면 자동 연결</p>
        </div>

        {/* URL 표시 및 복사 */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 mb-4 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <span className="text-[11px] text-slate-600 truncate flex-1 font-mono">
            {currentUrl}
          </span>
          <button
            onClick={handleCopyUrl}
            className="px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold shrink-0 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* 액션 버튼 */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleDownload}
            className="py-2.5 px-3 rounded-xl bg-[#0E9F98] hover:bg-[#0c857f] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>QR 이미지 저장</span>
          </button>
          <button
            onClick={handlePrint}
            className="py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>안내장 인쇄하기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
