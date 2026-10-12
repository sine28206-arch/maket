import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, CheckCircle, X, ShieldAlert, Sparkles, Trash2 } from 'lucide-react';
import { resetLocalRecords } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  recordCount: number;
  onResetComplete: () => void;
}

export const ResetConfirmModal: React.FC<Props> = ({
  isOpen,
  onClose,
  recordCount,
  onResetComplete
}) => {
  const [clearGasUrl, setClearGasUrl] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  if (!isOpen) return null;

  const handleExecuteReset = async () => {
    setIsProcessing(true);
    try {
      await resetLocalRecords(clearGasUrl);
      setIsDone(true);
      setTimeout(() => {
        setIsDone(false);
        setIsProcessing(false);
        onResetComplete();
        onClose();
      }, 1500);
    } catch (e) {
      console.error('Reset error:', e);
      setIsProcessing(false);
      onResetComplete();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 text-slate-800 relative">
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          title="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {isDone ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-slate-900">
              0명 초기화 완료!
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              모든 데이터가 0명으로 초기화되었습니다.<br />
              <strong>다음 셀러 신청자는 1번 자리</strong>부터 새롭게 배정됩니다.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  데이터 초기화 & 1번 자리 리셋
                </h3>
                <span className="text-xs text-red-600 font-semibold">
                  (공식 배포 전 초기화 작업)
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-[#FF8C32]" />
                <span>현재 등록된 신청자: 총 {recordCount}명(행)</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-700">
                <li>신청자 명단이 <strong>0명으로 즉시 초기화</strong>됩니다.</li>
                <li>다음 프리마켓 셀러 신청자에게 <strong>1번 자리</strong>부터 차례대로 배정됩니다.</li>
                <li>다음 행운 뽑기권 번호가 <strong>LKN-1001</strong>부터 부여됩니다.</li>
              </ul>
            </div>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 cursor-pointer select-none hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={clearGasUrl}
                onChange={(e) => setClearGasUrl(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
              />
              <div>
                <span className="font-semibold text-slate-900">구글 시트 연동 URL도 삭제</span>
                <p className="text-[11px] text-slate-500">완전한 초기 상태(새 시트 연동 대기)로 되돌립니다.</p>
              </div>
            </label>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                disabled={isProcessing}
                className="py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer shadow-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isProcessing ? '초기화 중...' : '0명 & 1번 자리로 리셋'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
