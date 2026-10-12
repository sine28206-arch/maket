import React from 'react';
import { AlertTriangle, Trash2, UtensilsCrossed, Maximize2, Users } from 'lucide-react';

export const NoticeBox: React.FC = () => {
  const notices = [
    {
      num: 1,
      icon: Users,
      title: '타학교 친구들도 신청 가능합니다',
      desc: '한마음초 재학생뿐만 아니라 인근 타학교 친구들과 형제자매도 자유롭게 신청하고 함께 참여할 수 있습니다! 환영합니다 🎈',
      highlight: true
    },
    {
      num: 2,
      icon: UtensilsCrossed,
      title: '체육관 내부 음식물 섭취 절대 불가',
      desc: '표선생활체육관 마루 바닥 보호를 위해 체육관 내부 음식물 반입 및 섭취가 엄격히 금지됩니다. (생수 제외)',
      highlight: false
    },
    {
      num: 3,
      icon: Trash2,
      title: '쓰레기 되가져가기',
      desc: '행사장에서 본인이 발생시킨 모든 쓰레기는 클린 제주를 위해 반드시 각자 가정으로 되가져가 주시기 바랍니다.',
      highlight: false
    },
    {
      num: 4,
      icon: Maximize2,
      title: '돗자리 크기 준수',
      desc: '통로 안전 확보를 위해 돗자리 규격은 최대 200cm × 240cm를 초과할 수 없습니다.',
      highlight: false
    }
  ];

  return (
    <div className="bg-amber-50/80 border border-amber-200/70 rounded-2xl p-4 shadow-xs text-slate-800">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-[#FF8C32] text-white flex items-center justify-center shrink-0 shadow-xs">
          <AlertTriangle className="w-3.5 h-3.5" />
        </div>
        <h3 className="text-sm font-bold text-amber-950 tracking-tight">
          행사 참여 필수 안내 및 주의사항
        </h3>
        <span className="text-[11px] font-semibold text-amber-800 ml-auto bg-amber-100 px-2 py-0.5 rounded-md">
          필독 4가지
        </span>
      </div>

      <div className="space-y-2">
        {notices.map((n) => {
          const Icon = n.icon;
          return (
            <div
              key={n.num}
              className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all ${
                n.highlight
                  ? 'bg-amber-100/70 border-amber-300 shadow-2xs'
                  : 'bg-white/90 border-amber-100/80'
              }`}
            >
              <div className={`w-5 h-5 rounded-full font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                n.highlight
                  ? 'bg-[#FF8C32] text-white'
                  : 'bg-amber-500/15 text-amber-800'
              }`}>
                {n.num}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${n.highlight ? 'text-[#FF8C32]' : 'text-slate-600'}`} />
                  <span className={n.highlight ? 'text-amber-950' : 'text-slate-900'}>{n.title}</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  {n.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
