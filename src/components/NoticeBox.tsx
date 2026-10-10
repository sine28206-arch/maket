import React from 'react';
import { AlertTriangle, Clock, Trash2, UtensilsCrossed, Users, Maximize2, HeartHandshake } from 'lucide-react';

export const NoticeBox: React.FC = () => {
  const notices = [
    {
      num: 1,
      icon: HeartHandshake,
      title: '수익의 10% 표선면 어려운 이웃 기부',
      desc: '따뜻한 나눔 실천을 위해 프리마켓 판매 수익금의 10%는 우리 고장 표선면의 어려운 이웃을 위해 기부됩니다.'
    },
    {
      num: 2,
      icon: UtensilsCrossed,
      title: '음식물 섭취 절대 불가',
      desc: '표선생활체육관 쾌적한 마루 바닥 보호를 위해 체육관 내부 음식물 반입 및 섭취가 엄격히 금지됩니다. (생수 제외)'
    },
    {
      num: 3,
      icon: Trash2,
      title: '쓰레기 되가져가기',
      desc: '행사장에서 본인이 발생시킨 모든 쓰레기는 클린 제주를 위해 반드시 각자 가정으로 되가져가 주시기 바랍니다.'
    },
    {
      num: 4,
      icon: Clock,
      title: '시작 20분 전 도착 및 세팅',
      desc: '원활한 행사 진행을 위하여 행사 시작 20분 전까지 체육관에 도착하셔서 자리 배정 및 준비를 완료해 주세요.'
    },
    {
      num: 5,
      icon: Users,
      title: '가족당 1자리 원칙',
      desc: '많은 학부모님과 아이들의 참여를 위해 프리마켓 부스 자리는 가족당 최대 1자리만 신청 가능합니다.'
    },
    {
      num: 6,
      icon: Maximize2,
      title: '돗자리 크기 준수',
      desc: '통로 안전 확보를 위해 돗자리 규격은 최대 200cm × 240cm를 초과할 수 없습니다.'
    }
  ];

  return (
    <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-4 sm:p-5 shadow-xs mb-6 text-slate-800">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-[#FF8C32] text-white flex items-center justify-center shrink-0 shadow-xs">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <h3 className="text-base font-bold text-amber-950 tracking-tight">
          행사 참여 필수 주의사항
        </h3>
        <span className="text-xs font-semibold text-amber-800 ml-auto bg-amber-100/90 px-2 py-0.5 rounded-md">
          필독
        </span>
      </div>

      <div className="space-y-2.5">
        {notices.map((n) => {
          const Icon = n.icon;
          return (
            <div
              key={n.num}
              className="flex items-start gap-2.5 p-2 rounded-xl bg-white/75 border border-amber-100/70"
            >
              <div className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                {n.num}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Icon className="w-3.5 h-3.5 text-[#FF8C32] shrink-0" />
                  <span>{n.title}</span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
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
