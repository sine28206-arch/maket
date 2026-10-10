import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle,
  Gift,
  Calendar,
  MapPin,
  Users,
  Store,
  Sparkles,
  Share2,
  X,
  Phone
} from 'lucide-react';
import { SubmissionRecord } from '../types';

interface Props {
  record: SubmissionRecord | null;
  onClose: () => void;
  onReset: () => void;
}

export const SuccessModal: React.FC<Props> = ({ record, onClose, onReset }) => {
  useEffect(() => {
    if (record) {
      // 폭죽 효과
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0E9F98', '#FF8C32', '#0284C7', '#FBBF24']
        });
      } catch {
        // ignore
      }
    }
  }, [record]);

  if (!record) return null;

  const hasLuckyTicket = record.luckyTicket && record.luckyTicket !== '미신청';

  // 자녀당 개별 행운권 파싱
  const ticketItems: { childName: string; ticketNumber: string }[] = React.useMemo(() => {
    if (!record?.luckyTicket || record.luckyTicket === '미신청') return [];
    if (record.luckyTicketsList && record.luckyTicketsList.length > 0) {
      return record.luckyTicketsList;
    }
    const studentNames = record.studentName.split('/').map(s => s.trim());
    const parts = record.luckyTicket.split('/');
    return parts.map((p, idx) => {
      const trimmed = p.trim();
      const match = trimmed.match(/(LKN-\d+)(?:\(([^)]+)\))?/);
      if (match) {
        return {
          ticketNumber: match[1],
          childName: match[2] || studentNames[idx] || `자녀 ${idx + 1}`
        };
      }
      return {
        ticketNumber: trimmed,
        childName: studentNames[idx] || `자녀 ${idx + 1}`
      };
    });
  }, [record]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg glass-modal p-6 text-slate-800 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 상단 축하 헤더 */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 mx-auto rounded-full bg-teal-100 text-[#0E9F98] flex items-center justify-center mb-3 ring-8 ring-teal-50">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            신청이 성공적으로 접수되었습니다!
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            제주 한마음초등학교 프리마켓 & 체험 행사에 함께해 주셔서 감사합니다.
          </p>
        </div>

        {/* 자녀당 1개씩 발행된 행운권 티켓 카드 목록 */}
        {hasLuckyTicket && ticketItems.length > 0 ? (
          <div className="space-y-3 mb-5">
            <div className="flex items-center justify-between text-xs text-amber-900 font-bold px-1">
              <span className="flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-[#FF8C32]" />
                <span>발행된 자녀별 행운권 ({ticketItems.length}매)</span>
              </span>
              <span className="text-[11px] text-slate-500 font-normal">행사 당일 화면을 캡처해 두세요</span>
            </div>

            {ticketItems.map((item, idx) => (
              <div
                key={idx}
                className="relative p-4 rounded-2xl bg-gradient-to-br from-[#FF8C32] to-[#F59E0B] text-white shadow-md overflow-hidden"
              >
                <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />

                <div className="flex items-center justify-between pb-2 border-b border-white/25">
                  <div className="flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-white" />
                    <span className="text-xs font-black tracking-wider uppercase">
                      [{item.childName}] 학생 전용 행운권
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                    10월 24일 추첨
                  </span>
                </div>

                <div className="py-3 text-center">
                  <div className="text-3xl font-black tracking-widest font-mono drop-shadow-sm">
                    {item.ticketNumber}
                  </div>
                  <p className="text-[10px] text-white/90 mt-1">
                    ※ {item.childName} 학생 고유 번호입니다. 당일 경품 추첨 시 호명됩니다!
                  </p>
                </div>

                <div className="pt-2 border-t border-dashed border-white/30 flex items-center justify-between text-[11px] text-white/90">
                  <span>학생: {item.childName}</span>
                  <span>장소: 표선생활체육관</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-5 p-3 rounded-xl bg-slate-100 text-slate-600 text-xs text-center">
            행운권 추첨은 <span className="font-semibold text-slate-800">미참여</span>로 등록되었습니다.
          </div>
        )}

        {/* 접수 상세 요약 */}
        <div className="bg-slate-50/90 rounded-xl p-4 border border-slate-200/80 space-y-2.5 text-xs mb-5">
          <div className="font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
            <span>접수 내역 요약</span>
            <span className="text-[11px] font-normal text-slate-500">{record.timestamp}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>학생 / 학년반</span>
            </span>
            <span className="font-bold text-slate-900 text-right">
              {record.studentName} ({record.studentGradeClass})
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>보호자 연락처</span>
            </span>
            <span className="font-semibold text-slate-800">{record.phone}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-slate-400" />
              <span>프리마켓 부스</span>
            </span>
            <span className={`font-bold ${record.fleaMarket === '신청' ? 'text-teal-700' : 'text-slate-600'}`}>
              {record.fleaMarket === '신청' ? '신청 완료 (가족당 1자리)' : '미신청'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
            <span className="text-slate-500 flex items-center gap-1.5 shrink-0 pt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-slate-400" />
              <span>체험 프로그램</span>
            </span>
            <div className="font-bold text-teal-800 text-left sm:text-right text-xs whitespace-pre-line leading-relaxed">
              <div>{record.programName}</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px] text-slate-600">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              10월 24일 10시~3시 (시작 20분 전 도착)
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              표선생활체육관
            </span>
          </div>
        </div>

        {/* 확인 버튼들 */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: '한마음초 프리마켓 & 체험 신청 완료',
                  text: `[한마음초 프리마켓] 신청 완료! 학생: ${record.studentName}, 행운권: ${record.luckyTicket}`,
                  url: window.location.href
                }).catch(() => {});
              } else {
                navigator.clipboard.writeText(
                  `[한마음초 프리마켓] ${record.studentName} 학생 신청완료 (행운권: ${record.luckyTicket})`
                );
                alert('신청 요약 내용이 클립보드에 복사되었습니다.');
              }
            }}
            className="py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>신청 내역 공유/복사</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onReset();
            }}
            className="py-2.5 px-3 rounded-xl bg-[#0E9F98] hover:bg-[#0c857f] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
          >
            <span>확인 완료</span>
          </button>
        </div>
      </div>
    </div>
  );
};
