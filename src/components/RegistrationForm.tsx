import React, { useState } from 'react';
import {
  UserPlus,
  Trash2,
  Phone,
  Store,
  Users,
  Send,
  Loader2,
  Gift,
  SendHorizontal
} from 'lucide-react';
import { CapacityMap, RegistrationFormData, ChildInfo } from '../types';

interface Props {
  capacity?: CapacityMap;
  isSubmitting: boolean;
  onSubmit: (data: RegistrationFormData) => void;
}

const GRADES = ['1학년', '2학년', '3학년', '4학년', '5학년', '6학년', '유치원/타학교'];
const CLASSES = ['1반', '2반', '3반', '4반', '해당없음'];

export const RegistrationForm: React.FC<Props> = ({
  isSubmitting,
  onSubmit
}) => {
  // 1. 학생 정보 (최대 4자녀까지 추가 지원, 자녀별 종이비행기 접기 대회 개별 신청 지원)
  const [children, setChildren] = useState<ChildInfo[]>([
    { grade: '1학년', classNum: '1반', name: '', paperAirplane: true }
  ]);

  // 2. 연락처
  const [phone, setPhone] = useState('');

  // 3. 참여 방식: 셀러 자리 신청 vs 일반 방문 참여 (두 경우 모두 행운뽑기권 증정!)
  const [fleaMarket, setFleaMarket] = useState<'신청' | '미신청'>('신청');

  // 4. 주의사항 동의 체크
  const [noticeAgreed, setNoticeAgreed] = useState(false);

  // 오류 메시지 상태
  const [errorMsg, setErrorMsg] = useState('');

  // 자녀 추가 핸들러 (최대 4자녀)
  const handleAddChild = () => {
    if (children.length >= 4) return;
    const nextGrade = `${Math.min(6, children.length + 1)}학년`;
    setChildren([
      ...children,
      { grade: nextGrade, classNum: '1반', name: '', paperAirplane: true }
    ]);
  };

  // 자녀 삭제 핸들러
  const handleRemoveChild = (index: number) => {
    if (children.length <= 1) return;
    setChildren(children.filter((_, idx) => idx !== index));
  };

  const handleChildChange = (index: number, field: keyof ChildInfo, value: any) => {
    const updated = [...children];
    updated[index] = { ...updated[index], [field]: value };
    setChildren(updated);
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

    // 3. 주의사항 동의 검증
    if (!noticeAgreed) {
      setErrorMsg('행사 참여 필수 안내 및 주의사항을 확인하시고 동의에 체크해 주세요.');
      return;
    }

    onSubmit({
      children,
      phone,
      fleaMarket,
      luckyDraw: true,
      noticeAgreed
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 1. 학생 정보 (최대 4자녀, 자녀별 개별 종이비행기 대회 신청) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#0E9F98]" />
            <span>1. 참여 학생 정보 ({children.length}명)</span>
          </label>
          {children.length < 4 && (
            <button
              type="button"
              onClick={handleAddChild}
              className="text-xs font-bold text-[#FF8C32] hover:text-[#e07520] flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors cursor-pointer border border-orange-200"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ 자녀 추가 (최대 4명)</span>
            </button>
          )}
        </div>

        {children.map((child, index) => (
          <div
            key={index}
            className="p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5 transition-all"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-[#0E9F98] text-[11px] font-black flex items-center justify-center">
                  {index + 1}
                </span>
                <span>자녀 {index + 1}</span>
                <span className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 font-semibold">
                  🎟️ 행운권 자동 발급
                </span>
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
                  className="w-full text-xs font-medium px-2 py-2 rounded-lg bg-slate-50 border border-slate-300 focus:border-[#0E9F98] focus:bg-white focus:outline-none transition-colors"
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
                  className="w-full text-xs font-medium px-2 py-2 rounded-lg bg-slate-50 border border-slate-300 focus:border-[#0E9F98] focus:bg-white focus:outline-none transition-colors"
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

            {/* 자녀별 종이비행기 접기 대회 개별 신청 체크박스 (두 자녀이면 각각 신청) */}
            <label className="flex items-center gap-2 p-2 rounded-lg bg-sky-50/70 border border-sky-200/80 cursor-pointer hover:bg-sky-50 transition-colors">
              <input
                type="checkbox"
                checked={child.paperAirplane ?? true}
                onChange={(e) => handleChildChange(index, 'paperAirplane', e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
              />
              <div className="flex items-center justify-between flex-1 text-xs">
                <span className="font-bold text-sky-950 flex items-center gap-1">
                  <SendHorizontal className="w-3.5 h-3.5 text-sky-600" />
                  <span>종이비행기 접기 & 날리기 대회 참가 신청</span>
                </span>
                <span className="text-[10px] font-bold text-sky-700 bg-white px-2 py-0.5 rounded-full border border-sky-200 shrink-0">
                  1·2·3등 상품 증정 🏆
                </span>
              </div>
            </label>
          </div>
        ))}
      </div>

      {/* 2. 참여 방식 선택 (셀러 자리 vs 일반 방문 참여) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Store className="w-4 h-4 text-[#0E9F98]" />
            <span>2. 참여 방식 선택</span>
          </label>
          <span className="text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md flex items-center gap-1">
            <Gift className="w-3 h-3 text-[#FF8C32]" />
            <span>전원 행운 뽑기권 부여</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setFleaMarket('신청')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              fleaMarket === '신청'
                ? 'bg-teal-50 border-[#0E9F98] ring-2 ring-[#0E9F98]/20 text-teal-950 font-bold shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold flex items-center gap-1">
                <span>🏕️ 셀러 자리 신청</span>
              </span>
              <span className="text-[10px] font-bold text-teal-700 bg-white px-1.5 py-0.5 rounded border border-teal-200">
                자리번호 배정
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              판매 부스 자리 배정 (10:30까지 세팅) + <strong>행운 뽑기권 증정</strong>
            </p>
          </button>

          <button
            type="button"
            onClick={() => setFleaMarket('미신청')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              fleaMarket === '미신청'
                ? 'bg-teal-50 border-[#0E9F98] ring-2 ring-[#0E9F98]/20 text-teal-950 font-bold shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold flex items-center gap-1">
                <span>🚶 일반 참가 (셀러 미신청)</span>
              </span>
              <span className="text-[10px] font-bold text-amber-700 bg-white px-1.5 py-0.5 rounded border border-amber-200">
                행운권만 증정
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              판매 자리 없이 자유 관람 & 구매 + <strong>행운 뽑기권 증정</strong>
            </p>
          </button>
        </div>
      </div>

      {/* 3. 보호자 연락처 */}
      <div className="space-y-1">
        <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <Phone className="w-4 h-4 text-[#0E9F98]" />
          <span>3. 보호자 연락처</span>
          <span className="text-red-500 text-xs">*</span>
        </label>
        <input
          type="tel"
          placeholder="010-0000-0000"
          value={phone}
          maxLength={13}
          onChange={handlePhoneChange}
          className="w-full text-xs sm:text-sm font-medium px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 focus:border-[#0E9F98] focus:ring-1 focus:ring-[#0E9F98] focus:outline-none transition-all placeholder:text-slate-400"
        />
      </div>

      {/* 4. 필수 확인 및 동의 */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={noticeAgreed}
            onChange={(e) => setNoticeAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-[#0E9F98] border-slate-300 rounded focus:ring-[#0E9F98] cursor-pointer"
          />
          <div className="text-xs text-slate-700 leading-relaxed">
            <span className="font-bold text-slate-900">
              [필수] 행사 참여 주의사항 및 나눔 기부(10%)에 동의합니다.
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              타학교 친구 신청 가능, 텀블러 무료 음료, 체육관 내 음식물 반입 금지 및 쓰레기 되가져가기 확인
            </p>
          </div>
        </label>
      </div>

      {/* 오류 메시지 */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3.5 px-4 rounded-xl bg-[#0E9F98] hover:bg-[#0c857f] active:scale-[0.99] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>신청 접수 처리 중...</span>
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            <span>
              신청 완료 (자녀 {children.length}명 행운 뽑기권 발급)
            </span>
          </>
        )}
      </button>
    </form>
  );
};
