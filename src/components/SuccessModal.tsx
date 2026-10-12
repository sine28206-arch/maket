import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle,
  Gift,
  MapPin,
  Users,
  Store,
  Share2,
  X,
  Phone,
  Clock,
  Sparkles,
  Coffee,
  Check
} from 'lucide-react';
import { SubmissionRecord, LuckyTicketItem } from '../types';

interface Props {
  record: SubmissionRecord | null;
  onClose: () => void;
  onReset: () => void;
}

export const SuccessModal: React.FC<Props> = ({ record, onClose, onReset }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (record) {
      try {
        const confettiFn = (confetti as any)?.default || confetti;
        if (typeof confettiFn === 'function') {
          confettiFn({
            particleCount: 90,
            spread: 75,
            origin: { y: 0.6 },
            colors: ['#0E9F98', '#FF8C32', '#0284C7', '#FBBF24']
          });
        }
      } catch {
        // silent ignore for environments without canvas
      }
    }
  }, [record]);

  if (!record) return null;

  // 자리 번호 안전 추출
  const rawSeat = record.seatNumber || record.fleaMarket || '미신청';
  const isSeller = rawSeat !== '미신청' && rawSeat !== '';
  const seatNumber = isSeller ? (rawSeat === '신청' ? '1번 자리' : rawSeat) : '미신청';

  // 자녀당 개별 행운 뽑기권 안전 파싱 (절대 크래시 방지)
  const ticketItems: LuckyTicketItem[] = (() => {
    if (record.luckyTicketsList && Array.isArray(record.luckyTicketsList) && record.luckyTicketsList.length > 0) {
      return record.luckyTicketsList.map((item, idx) => ({
        childName: item?.childName || `자녀 ${idx + 1}`,
        ticketNumber: item?.ticketNumber || `LKN-${1001 + idx}`,
        seatNumber: isSeller ? (item?.seatNumber || seatNumber) : undefined,
        paperAirplane: item?.paperAirplane ?? Boolean(record.paperAirplane ?? true)
      }));
    }

    const studentNames = String(record.studentName || '')
      .split('/')
      .map((s) => s.trim())
      .filter(Boolean);

    const luckyTicketStr = String(record.luckyTicket || '');
    if (!luckyTicketStr || luckyTicketStr === '미신청') {
      return (studentNames.length > 0 ? studentNames : ['학생']).map((name, idx) => ({
        childName: name,
        ticketNumber: `LKN-${1001 + idx}`,
        seatNumber: isSeller ? seatNumber : undefined,
        paperAirplane: Boolean(record.paperAirplane ?? true)
      }));
    }

    const parts = luckyTicketStr.split('/').map((s) => s.trim()).filter(Boolean);
    return parts.map((p, idx) => {
      const match = p.match(/(LKN-\d+)(?:\(([^)]+)\))?/);
      return {
        ticketNumber: match ? match[1] : p,
        childName: (match && match[2]) || studentNames[idx] || `자녀 ${idx + 1}`,
        seatNumber: isSeller ? seatNumber : undefined,
        paperAirplane: Boolean(record.paperAirplane ?? true)
      };
    });
  })();

  const handleShareOrCopy = () => {
    const seatLine = isSeller ? `• 셀러 자리: ${seatNumber}\n` : '• 참여: 일반 방문 (셀러 자리 미신청)\n';
    const textToCopy = `[한마음초 프리마켓] 신청 완료!\n${seatLine}• 학생: ${record.studentName || '-'}\n• 행운권: ${record.luckyTicket || '-'}\n• 일시: 10월 24일 11:00~14:00 (표선생활체육관)`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }).catch(() => {});
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 sm:p-6 text-slate-800 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          title="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 상단 축하 헤더 */}
        <div className="text-center mb-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-teal-100 text-[#0E9F98] flex items-center justify-center mb-2 ring-6 ring-teal-50">
            <CheckCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {isSeller ? '셀러 자리 & 행운권 발급 완료!' : '참여 신청 & 행운권 발급 완료!'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            10월 24일 표선생활체육관에서 만나요! 🎈
          </p>
        </div>

        {/* 셀러 참여자에게는 자리번호 + 행운뽑기권 배너 / 일반 참여자에게는 행운뽑기권 중심 배너 */}
        {isSeller ? (
          <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-[#0E9F98] via-teal-600 to-teal-800 text-white shadow-lg border border-teal-300 relative overflow-hidden">
            <div className="flex flex-col items-center text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider mb-1">
                <Store className="w-3.5 h-3.5 text-amber-300" />
                <span>셀러 부스 자리 배정</span>
              </span>
              <div className="text-xs text-teal-100">배정된 셀러 자리 번호</div>
              <div className="text-3xl sm:text-4xl font-black text-amber-300 font-mono tracking-tight my-1 drop-shadow-sm bg-slate-950/30 px-5 py-1.5 rounded-xl border border-white/20">
                {seatNumber}
              </div>
              <div className="text-[11px] text-white/95 mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>행사 당일 <strong>10:30까지</strong> 체육관 도착 후 세팅을 완료해 주세요!</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 text-amber-950 text-center">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold mb-1">
              <Gift className="w-3.5 h-3.5 text-[#FF8C32]" />
              <span>일반 방문 참여 등록 완료</span>
            </div>
            <p className="text-xs text-slate-700 font-medium">
              셀러 자리 미신청 참여자입니다. 아래 <strong>자녀별 행운 뽑기권</strong>으로 행사에 참여하세요!
            </p>
          </div>
        )}

        {/* 자녀당 1매씩 발행된 행운 뽑기권 티켓 카드 목록 */}
        {ticketItems.length > 0 && (
          <div className="space-y-2.5 mb-4">
            <div className="flex items-center justify-between text-xs text-slate-700 font-bold px-1">
              <span className="flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-[#FF8C32]" />
                <span>자녀별 행운 뽑기권 (총 {ticketItems.length}매)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">현장 호명 시 화면 제시</span>
            </div>

            {ticketItems.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-gradient-to-r from-[#FF8C32] to-[#F59E0B] text-white shadow-xs relative overflow-hidden"
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-white/20 text-xs">
                  <span className="font-bold">
                    [{item.childName}] 학생의 행운 뽑기권
                  </span>
                  <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-full">
                    {isSeller ? seatNumber : '일반참여'}
                  </span>
                </div>

                <div className="py-2 text-center">
                  <div className="text-2xl sm:text-3xl font-black tracking-widest font-mono drop-shadow-xs">
                    {item.ticketNumber}
                  </div>
                </div>

                {/* 종이비행기 접기 대회 신청 여부 표시 */}
                {item.paperAirplane && (
                  <div className="pt-1.5 border-t border-white/20 flex items-center justify-between text-[11px] bg-white/10 -mx-3.5 -mb-3.5 px-3 py-1.5 rounded-b-xl">
                    <span className="font-bold flex items-center gap-1">
                      <span>✈️ 종이비행기 접기 대회 참가 신청</span>
                    </span>
                    <span className="text-[10px] font-bold bg-white text-[#FF8C32] px-2 py-0.5 rounded-full shadow-2xs">
                      1등·2등·3등 상품 도전 🏆
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 접수 상세 요약 (간결하게 정리) */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1.5 mb-4">
          <div className="flex items-center justify-between text-slate-600">
            <span>참여 학생</span>
            <span className="font-bold text-slate-900">{record.studentName || '-'} ({record.studentGradeClass || '-'})</span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span>보호자 연락처</span>
            <span className="font-semibold text-slate-800">{record.phone || '-'}</span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span>참여 유형</span>
            <span className={`font-bold ${isSeller ? 'text-[#0E9F98]' : 'text-slate-800'}`}>
              {isSeller ? `셀러 (${seatNumber})` : '일반 방문객 (셀러 자리 미신청)'}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 text-[11px] text-slate-500">
            <span>10월 24일 11시~2시</span>
            <span>표선생활체육관</span>
          </div>
        </div>

        {/* 확인 버튼들 */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleShareOrCopy}
            className="py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">복사 완료!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>내역 복사</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              onClose();
              onReset();
            }}
            className="py-2.5 px-3 rounded-xl bg-[#0E9F98] hover:bg-[#0c857f] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <span>확인 완료</span>
          </button>
        </div>
      </div>
    </div>
  );
};
