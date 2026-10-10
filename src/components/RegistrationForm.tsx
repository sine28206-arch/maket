import React, { useState } from 'react';
import {
  UserPlus,
  Trash2,
  Phone,
  Store,
  Sparkles,
  Gift,
  CheckCircle2,
  Users,
  Send,
  Loader2,
  Info,
  PlusCircle,
  Clock,
  UserCheck
} from 'lucide-react';
import { CapacityMap, ProgramId, ProgramSelection, RegistrationFormData, TimeSlotId } from '../types';

interface Props {
  capacity: CapacityMap;
  isSubmitting: boolean;
  onSubmit: (data: RegistrationFormData) => void;
}

const ALL_PROGRAMS: { id: ProgramId; name: string; desc: string; icon: string }[] = [
  { id: 'making', name: '1. 만들기', desc: '바다 석고방향제 & 비즈 키링', icon: '🎨' },
  { id: 'game', name: '2. 게임', desc: '미니 컬링 & 신발 양궁 대항전', icon: '🎯' },
  { id: 'roulette', name: '3. 룰렛 돌리기', desc: '풍성한 경품의 한마음 행운 룰렛', icon: '🎡' }
];

const TIME_SLOTS: { id: TimeSlotId; timeRange: string; title: string }[] = [
  { id: 'slot1', timeRange: '10:00 ~ 11:00', title: '1타임' },
  { id: 'slot2', timeRange: '11:00 ~ 12:00', title: '2타임' },
  { id: 'slot3', timeRange: '13:00 ~ 14:00', title: '3타임' },
  { id: 'slot4', timeRange: '14:00 ~ 15:00', title: '4타임' }
];

const GRADES = ['1학년', '2학년', '3학년', '4학년', '5학년', '6학년'];
const CLASSES = ['1반', '2반', '3반', '4반'];

interface ChildProgramChoice {
  programId: ProgramId | 'none';
  timeSlotId: TimeSlotId;
}

export const RegistrationForm: React.FC<Props> = ({
  capacity,
  isSubmitting,
  onSubmit
}) => {
  // 1. 학생 정보 (최대 4자녀까지 추가 지원)
  const [children, setChildren] = useState<{ grade: string; classNum: string; name: string }[]>([
    { grade: '1학년', classNum: '1반', name: '' }
  ]);

  // 자녀별 체험 프로그램 신청 목록 (각 자녀 인덱스별로 1~2개 프로그램)
  // [자녀0: [prog1, prog2?], 자녀1: [prog1, prog2?], ...]
  const [childPrograms, setChildPrograms] = useState<ChildProgramChoice[][]>([
    [{ programId: 'making', timeSlotId: 'slot1' }]
  ]);

  // 2. 연락처
  const [phone, setPhone] = useState('');

  // 3. 프리마켓 자리 신청 여부
  const [fleaMarket, setFleaMarket] = useState<'신청' | '미신청'>('신청');

  // 4. 행운권 추첨 체크
  const [luckyDraw, setLuckyDraw] = useState(true);

  // 5. 주의사항 동의 체크
  const [noticeAgreed, setNoticeAgreed] = useState(false);

  // 오류 메시지 상태
  const [errorMsg, setErrorMsg] = useState('');

  // 자녀 추가 핸들러 (최대 4자녀)
  const handleAddChild = () => {
    if (children.length >= 4) return;
    const nextGrade = `${Math.min(6, children.length + 1)}학년`;
    const newChildren = [...children, { grade: nextGrade, classNum: '1반', name: '' }];
    setChildren(newChildren);

    // 새 자녀의 기본 프로그램 설정
    const defaultPrograms: ProgramId[] = ['game', 'roulette', 'making'];
    const defaultSlots: TimeSlotId[] = ['slot2', 'slot3', 'slot1'];
    const pId = defaultPrograms[(children.length - 1) % defaultPrograms.length];
    const sId = defaultSlots[(children.length - 1) % defaultSlots.length];

    setChildPrograms([...childPrograms, [{ programId: pId, timeSlotId: sId }]]);
  };

  // 자녀 삭제 핸들러
  const handleRemoveChild = (index: number) => {
    if (children.length <= 1) return;
    setChildren(children.filter((_, idx) => idx !== index));
    setChildPrograms(childPrograms.filter((_, idx) => idx !== index));
  };

  const handleChildChange = (index: number, field: 'grade' | 'classNum' | 'name', value: string) => {
    const updated = [...children];
    updated[index][field] = value;
    setChildren(updated);
  };

  // 특정 자녀의 프로그램 필드 변경 (안전한 배열 접근 보장)
  const handleChildProgramChange = (
    childIdx: number,
    itemIdx: number,
    field: 'programId' | 'timeSlotId',
    value: string
  ) => {
    const updated = childPrograms.map((list) => [...list]);
    while (updated.length <= childIdx) {
      updated.push([{ programId: 'making', timeSlotId: 'slot1' }]);
    }
    const currentList = updated[childIdx] || [];
    while (currentList.length <= itemIdx) {
      currentList.push({ programId: 'making', timeSlotId: 'slot1' });
    }
    currentList[itemIdx] = {
      programId: currentList[itemIdx]?.programId || 'making',
      timeSlotId: currentList[itemIdx]?.timeSlotId || 'slot1',
      [field]: value
    };
    updated[childIdx] = currentList;
    setChildPrograms(updated);
  };

  // 특정 자녀의 2번째 프로그램 추가 (자녀당 최대 2개)
  const handleAddProgramForChild = (childIdx: number) => {
    const updated = childPrograms.map((list) => [...list]);
    while (updated.length <= childIdx) {
      updated.push([{ programId: 'making', timeSlotId: 'slot1' }]);
    }
    const currentList = updated[childIdx] || [];
    if (currentList.length >= 2) return;

    // 이미 선택된 프로그램 제외하고 선택
    const usedProgIds = currentList.map((p) => p.programId);
    const availableProg = ALL_PROGRAMS.find((p) => !usedProgIds.includes(p.id));

    // 이미 선택된 시간대 제외하고 선택
    const usedSlotIds = currentList.map((p) => p.timeSlotId);
    const availableSlot = TIME_SLOTS.find((s) => !usedSlotIds.includes(s.id));

    currentList.push({
      programId: availableProg ? availableProg.id : 'roulette',
      timeSlotId: availableSlot ? availableSlot.id : 'slot3'
    });
    updated[childIdx] = currentList;
    setChildPrograms(updated);
  };

  // 특정 자녀의 2번째 프로그램 제거
  const handleRemoveProgramForChild = (childIdx: number, itemIdx: number) => {
    const updated = childPrograms.map((list) => [...list]);
    const currentList = updated[childIdx] || [];
    if (currentList.length <= 1) return;
    updated[childIdx] = currentList.filter((_, idx) => idx !== itemIdx);
    setChildPrograms(updated);
  };

  // 연락처 자동 포맷팅
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    let formatted = raw;
    if (raw.length <= 3) {
      formatted = raw;
    } else if (raw.length <= 7) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
    } else {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`;
    }
    setPhone(formatted);
  };

  // 제출 검증
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // 1. 모든 자녀 이름 검증
    for (let i = 0; i < children.length; i++) {
      if (!children[i].name.trim()) {
        setErrorMsg(`자녀 ${i + 1}의 이름을 입력해 주세요.`);
        return;
      }
    }

    // 2. 연락처 검증
    const cleanedPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanedPhone || cleanedPhone.length < 10) {
      setErrorMsg('올바른 학부모 연락처(예: 010-1234-5678)를 입력해 주세요.');
      return;
    }

    // 3. 자녀별 프로그램 유효성 및 정원(8명) 검증
    const flatPrograms: ProgramSelection[] = [];
    const requestedSlotCounts: Record<string, number> = {};

    for (let cIdx = 0; cIdx < children.length; cIdx++) {
      const childName = children[cIdx].name.trim();
      const pList = childPrograms[cIdx] || [];

      // 같은 자녀 내에서 프로그램 및 시간대 중복 검증
      if (pList.length === 2) {
        if (pList[0].programId !== 'none' && pList[0].programId === pList[1].programId) {
          setErrorMsg(`${childName} 학생의 체험 프로그램 1과 2가 중복되었습니다. 서로 다른 프로그램을 선택해 주세요.`);
          return;
        }
        if (pList[0].programId !== 'none' && pList[1].programId !== 'none' && pList[0].timeSlotId === pList[1].timeSlotId) {
          setErrorMsg(`${childName} 학생의 체험 1과 2 시간대가 겹칩니다. 다른 시간대를 선택해 주세요.`);
          return;
        }
      }

      for (let itemIdx = 0; itemIdx < pList.length; itemIdx++) {
        const item = pList[itemIdx];
        if (item.programId === 'none') continue;

        const key = `${item.programId}_${item.timeSlotId}`;
        requestedSlotCounts[key] = (requestedSlotCounts[key] || 0) + 1;
        const alreadyBooked = capacity[item.programId]?.[item.timeSlotId] || 0;

        if (alreadyBooked + requestedSlotCounts[key] > 8) {
          const pName = ALL_PROGRAMS.find((p) => p.id === item.programId)?.name || '';
          const sName = TIME_SLOTS.find((s) => s.id === item.timeSlotId)?.title || '';
          setErrorMsg(`[${pName}] ${sName}은 정원(8명)이 마감되었습니다 (현재 잔여: ${Math.max(0, 8 - alreadyBooked)}명). 다른 시간대를 선택해 주세요.`);
          return;
        }

        flatPrograms.push({
          programId: item.programId,
          timeSlotId: item.timeSlotId,
          participantName: childName
        });
      }
    }

    // 4. 주의사항 동의 검증
    if (!noticeAgreed) {
      setErrorMsg('행사 참여 필수 주의사항을 확인하시고 동의에 체크해 주세요.');
      return;
    }

    onSubmit({
      children,
      phone,
      fleaMarket,
      programs: flatPrograms,
      luckyDraw,
      noticeAgreed
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. 학생 정보 (최대 4자녀 지원) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#0E9F98]" />
            <span>1. 학생 정보 (최대 4자녀 등록 가능)</span>
          </label>
          {children.length < 4 && (
            <button
              type="button"
              onClick={handleAddChild}
              className="text-xs font-semibold text-[#FF8C32] hover:text-[#e07520] flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors cursor-pointer border border-orange-200/60"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ {children.length + 1}번째 자녀 추가 (최대 4명)</span>
            </button>
          )}
        </div>

        {children.map((child, index) => (
          <div
            key={index}
            className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5 transition-all"
          >
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-teal-100 text-[#0E9F98] text-[10px] font-black flex items-center justify-center">
                  {index + 1}
                </span>
                <span>자녀 {index + 1}</span>
              </span>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => handleRemoveChild(index)}
                  className="text-red-500 hover:text-red-700 flex items-center gap-1 text-xs cursor-pointer font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>삭제</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-4">
                <label className="block text-[11px] text-slate-500 mb-1">학년</label>
                <select
                  value={child.grade}
                  onChange={(e) => handleChildChange(index, 'grade', e.target.value)}
                  className="w-full text-xs font-medium px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-300 focus:border-[#0E9F98] focus:bg-white focus:outline-none transition-colors"
                >
                  {GRADES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-3">
                <label className="block text-[11px] text-slate-500 mb-1">반</label>
                <select
                  value={child.classNum}
                  onChange={(e) => handleChildChange(index, 'classNum', e.target.value)}
                  className="w-full text-xs font-medium px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-300 focus:border-[#0E9F98] focus:bg-white focus:outline-none transition-colors"
                >
                  {CLASSES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-5">
                <label className="block text-[11px] text-slate-500 mb-1">학생 이름</label>
                <input
                  type="text"
                  placeholder="예: 홍길동"
                  value={child.name}
                  onChange={(e) => handleChildChange(index, 'name', e.target.value)}
                  className="w-full text-xs font-medium px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-300 focus:border-[#0E9F98] focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        ))}
        <p className="text-[11px] text-slate-500 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>시트 A열(학년/반)과 B열(이름)에 슬래시('/')로 묶여 1행으로 자동 저장됩니다.</span>
        </p>
      </div>

      {/* 2. 연락처 */}
      <div className="space-y-1.5">
        <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <Phone className="w-4 h-4 text-[#0E9F98]" />
          <span>2. 보호자 연락처</span>
          <span className="text-red-500 text-xs">*</span>
        </label>
        <input
          type="tel"
          placeholder="010-0000-0000"
          value={phone}
          maxLength={13}
          onChange={handlePhoneChange}
          className="w-full text-sm font-medium px-3.5 py-2.5 rounded-xl bg-white/90 border border-slate-300 focus:border-[#0E9F98] focus:ring-2 focus:ring-[#0E9F98]/20 focus:outline-none transition-all placeholder:text-slate-400"
        />
        <p className="text-[11px] text-slate-500">
          행사 당일 긴급 안내 및 자리 배정 확인 문자에 사용됩니다.
        </p>
      </div>

      {/* 3. 프리마켓 자리 신청 여부 */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <Store className="w-4 h-4 text-[#0E9F98]" />
          <span>3. 프리마켓 자리 신청 여부</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFleaMarket('신청')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              fleaMarket === '신청'
                ? 'bg-teal-50 border-[#0E9F98] ring-1 ring-[#0E9F98] text-teal-950 font-bold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm">자리 신청함</span>
              <span className="text-xs">🏕️</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              가족당 1자리 (돗자리 200x240cm 이내)
            </p>
          </button>

          <button
            type="button"
            onClick={() => setFleaMarket('미신청')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              fleaMarket === '미신청'
                ? 'bg-teal-50 border-[#0E9F98] ring-1 ring-[#0E9F98] text-teal-950 font-bold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm">신청 안 함</span>
              <span className="text-xs">🚶</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              물품 판매 없이 구경 및 체험만 참여
            </p>
          </button>
        </div>
      </div>

      {/* 4. 자녀별 체험 프로그램 개별 신청 섹션 (두 자녀 이상 각각 신청 완벽 지원!) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#0E9F98]" />
            <span>4. 자녀별 체험 프로그램 예약 (자녀당 최대 2개)</span>
          </label>
          <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
            자녀별 개별 선택
          </span>
        </div>
        <p className="text-[11px] text-slate-500">
          각 자녀마다 원하는 체험 프로그램과 시간대를 각각 지정할 수 있습니다 (신청 완료를 1번만 누르면 한 번에 묶여 저장됩니다).
        </p>

        {/* 등록된 각 자녀별 프로그램 선택 카드 */}
        <div className="space-y-4 pt-1">
          {children.map((child, childIdx) => {
            const childName = child.name.trim() || `자녀 ${childIdx + 1}`;
            const pList = childPrograms[childIdx] || [{ programId: 'making', timeSlotId: 'slot1' }];

            return (
              <div
                key={childIdx}
                className="p-4 rounded-2xl bg-white border-2 border-teal-200 shadow-2xs space-y-3.5"
              >
                <div className="flex items-center justify-between border-b border-teal-100 pb-2">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[#0E9F98]" />
                    <span className="text-xs font-bold text-slate-900">
                      [{childName}] 학생의 체험 프로그램
                    </span>
                    <span className="text-[10px] text-slate-500">
                      ({child.grade} {child.classNum})
                    </span>
                  </div>

                  {pList.length < 2 && (
                    <button
                      type="button"
                      onClick={() => handleAddProgramForChild(childIdx)}
                      className="text-xs font-bold text-[#FF8C32] hover:text-[#e07520] flex items-center gap-1 cursor-pointer bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200/60"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ {childName} 2번째 프로그램 추가</span>
                    </button>
                  )}
                </div>

                {/* 이 자녀의 프로그램 슬롯들 (1~2개) */}
                <div className="space-y-3">
                  {pList.map((item, itemIdx) => {
                    const otherItem = pList.find((_, idx) => idx !== itemIdx);
                    const isOverlappingProg = (pId: ProgramId) => otherItem && otherItem.programId === pId;
                    const isOverlappingSlot = (sId: TimeSlotId) => otherItem && otherItem.timeSlotId === sId;

                    return (
                      <div
                        key={itemIdx}
                        className="p-3 rounded-xl bg-slate-50/90 border border-slate-200 space-y-2.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-[#0E9F98] text-white text-[10px] font-black flex items-center justify-center">
                              {itemIdx + 1}
                            </span>
                            <span>{itemIdx === 0 ? '첫 번째 선택' : '두 번째 추가 선택'}</span>
                          </span>

                          {pList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveProgramForChild(childIdx, itemIdx)}
                              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-0.5 cursor-pointer font-medium"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>삭제</span>
                            </button>
                          )}
                        </div>

                        {/* 프로그램 종류 선택 */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            프로그램 종류:
                          </label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {ALL_PROGRAMS.map((prog) => {
                              const isSelected = item.programId === prog.id;
                              const isOverlap = isOverlappingProg(prog.id);

                              return (
                                <button
                                  key={prog.id}
                                  type="button"
                                  disabled={isOverlap}
                                  onClick={() => handleChildProgramChange(childIdx, itemIdx, 'programId', prog.id)}
                                  className={`p-2 rounded-lg border text-left transition-all ${
                                    isOverlap
                                      ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                                      : isSelected
                                      ? 'bg-teal-50 border-[#0E9F98] text-teal-950 font-bold ring-1 ring-[#0E9F98] cursor-pointer'
                                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer'
                                  }`}
                                >
                                  <div className="text-sm">{prog.icon}</div>
                                  <div className="text-[11px] font-bold leading-tight mt-0.5">{prog.name}</div>
                                  {isOverlap && <div className="text-[9px] text-amber-700">(중복)</div>}
                                </button>
                              );
                            })}

                            {/* 미참여 옵션 */}
                            <button
                              type="button"
                              onClick={() => handleChildProgramChange(childIdx, itemIdx, 'programId', 'none')}
                              className={`p-2 rounded-lg border text-left transition-all ${
                                item.programId === 'none'
                                  ? 'bg-slate-200 border-slate-400 text-slate-900 font-bold'
                                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer'
                              }`}
                            >
                              <div className="text-sm">☕</div>
                              <div className="text-[11px] font-bold leading-tight mt-0.5">미참여</div>
                            </button>
                          </div>
                        </div>

                        {/* 운영 시간대 선택 (미참여가 아닐 때만) */}
                        {item.programId !== 'none' && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>운영 시간대 선택 (8명 정원):</span>
                              </label>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                              {TIME_SLOTS.map((slot) => {
                                const booked = capacity[item.programId]?.[slot.id] || 0;
                                const isFull = booked >= 8;
                                const isOverlap = isOverlappingSlot(slot.id);
                                const isSelected = item.timeSlotId === slot.id;
                                const remaining = Math.max(0, 8 - booked);

                                const isDisabled = isFull || isOverlap;

                                return (
                                  <button
                                    key={slot.id}
                                    type="button"
                                    disabled={isDisabled}
                                    onClick={() => handleChildProgramChange(childIdx, itemIdx, 'timeSlotId', slot.id)}
                                    className={`p-1.5 rounded-lg border text-left transition-all ${
                                      isDisabled
                                        ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                                        : isSelected
                                        ? 'bg-[#0E9F98]/15 border-[#0E9F98] text-teal-950 font-bold ring-1 ring-[#0E9F98] cursor-pointer'
                                        : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 cursor-pointer'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between text-[11px] font-bold">
                                      <span>{slot.title}</span>
                                      {isSelected && !isDisabled && <CheckCircle2 className="w-3 h-3 text-[#0E9F98]" />}
                                    </div>
                                    <div className="text-[9px] text-slate-500">{slot.timeRange}</div>
                                    <div className="text-[9px] mt-0.5 font-bold">
                                      {isOverlap ? (
                                        <span className="text-amber-700">[시간겹침]</span>
                                      ) : isFull ? (
                                        <span className="text-red-500">[마감] 8/8</span>
                                      ) : (
                                        <span className="text-teal-700">잔여 {remaining}</span>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. 행운권 추첨 체크박스 (자녀당 1개씩 순차 발행!) */}
      <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 flex items-start gap-3">
        <input
          id="luckyDrawCheckbox"
          type="checkbox"
          checked={luckyDraw}
          onChange={(e) => setLuckyDraw(e.target.checked)}
          className="w-5 h-5 rounded border-amber-400 text-[#FF8C32] focus:ring-[#FF8C32] shrink-0 mt-0.5 cursor-pointer accent-[#FF8C32]"
        />
        <label htmlFor="luckyDrawCheckbox" className="text-xs text-slate-800 cursor-pointer flex-1">
          <div className="font-bold text-amber-950 flex items-center gap-1.5 mb-0.5">
            <Gift className="w-4 h-4 text-[#FF8C32]" />
            <span>행운권 추첨 참여 (자녀당 1개씩 각각 발행)</span>
            <span className="text-[10px] font-bold bg-[#FF8C32] text-white px-2 py-0.5 rounded-full">
              총 {children.length}매 발급 (1인 1매)
            </span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            체크하시면 등록된 <strong>총 {children.length}명의 자녀</strong>({children.map((c, i) => c.name.trim() || `자녀 ${i + 1}`).join(', ')})에게 각각 고유 행운권 번호가 순차 발급되어 완료 화면에 개별 티켓으로 표시되고, 구글 시트 G열에도 모두 기록됩니다.
          </p>
        </label>
      </div>

      {/* 6. 주의사항 동의 체크박스 */}
      <div className="p-3.5 rounded-xl bg-white/95 border border-slate-300 flex items-start gap-3">
        <input
          id="noticeAgreeCheckbox"
          type="checkbox"
          checked={noticeAgreed}
          onChange={(e) => setNoticeAgreed(e.target.checked)}
          className="w-5 h-5 rounded border-slate-400 text-[#0E9F98] focus:ring-[#0E9F98] shrink-0 mt-0.5 cursor-pointer accent-[#0E9F98]"
        />
        <label htmlFor="noticeAgreeCheckbox" className="text-xs text-slate-800 cursor-pointer flex-1">
          <div className="font-bold text-slate-900 mb-0.5">
            행사 필수 주의사항(수익 10% 표선면 기부 포함) 확인 및 동의 <span className="text-red-500">*</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            수익 10% 표선면 어려운 이웃 기부, 체육관 내 음식물 섭취 금지, 쓰레기 되가져가기, 20분 전 세팅, 가족당 1자리, 돗자리 200x240cm 규격 준수에 동의합니다.
          </p>
        </label>
      </div>

      {/* 에러 메시지 알림 */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
          <span className="shrink-0">⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#0E9F98] to-[#0284C7] hover:from-[#0c857f] hover:to-[#0369a1] text-white font-bold text-sm shadow-md hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>구글 스프레드시트에 전체 신청 등록 중...</span>
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            <span>한마음초 프리마켓 & 체험 신청 완료하기 ({children.length}자녀 통합 접수)</span>
          </>
        )}
      </button>
    </form>
  );
};
