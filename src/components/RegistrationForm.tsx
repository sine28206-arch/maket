import React, { useState } from 'react';
import {
  UserPlus,
  Trash2,
  Phone,
  Store,
  Ticket,
  CheckCircle2,
  Users,
  Send,
  Loader2,
  Info,
  Clock,
  Sparkles,
  Gift,
  Coffee
} from 'lucide-react';
import { CapacityMap, RegistrationFormData } from '../types';

interface Props {
  capacity?: CapacityMap;
  isSubmitting: boolean;
  onSubmit: (data: RegistrationFormData) => void;
}

const GRADES = ['1학년', '2학년', '3학년', '4학년', '5학년', '6학년'];
const CLASSES = ['1반', '2반', '3반', '4반'];

export const RegistrationForm: React.FC<Props> = ({
  isSubmitting,
  onSubmit
}) => {
  // 1. 학생 정보 (최대 4자녀까지 추가 지원)
  const [children, setChildren] = useState<{ grade: string; classNum: string; name: string }[]>([
    { grade: '1학년', classNum: '1반', name: '' }
  ]);

  // 2. 연락처
  const [phone, setPhone] = useState('');

  // 3. 프리마켓 자리 신청 여부 (기본: 신청)
  const [fleaMarket, setFleaMarket] = useState<'신청' | '미신청'>('신청');

  // 4. 주의사항 동의 체크
  const [noticeAgreed, setNoticeAgreed] = useState(false);

  // 오류 메시지 상태
  const [errorMsg, setErrorMsg] = useState('');

  // 자녀 추가 핸들러 (최대 4자녀)
  const handleAddChild = () => {
    if (children.length >= 4) return;
    const nextGrade = `${Math.min(6, children.length + 1)}학년`;
    setChildren([...children, { grade: nextGrade, classNum: '1반', name: '' }]);
  };

  // 자녀 삭제 핸들러
  const handleRemoveChild = (index: number) => {
    if (children.length <= 1) return;
    setChildren(children.filter((_, idx) => idx !== index));
  };

  const handleChildChange = (index: number, field: 'grade' | 'classNum' | 'name', value: string) => {
    const updated = [...children];
    updated[index][field] = value;
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
                <span className="w-5 h-5 rounded-full bg-teal-100 text-[#0E9F98] text-[11px] font-black flex items-center justify-center">
                  {index + 1}
                </span>
                <span>자녀 {index + 1}</span>
                <span className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                  행운 뽑기권 1회 자동 부여
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

        <div className="p-2.5 rounded-xl bg-teal-50/80 border border-teal-200/90 text-[11px] text-teal-900 flex items-start gap-2">
          <Info className="w-4 h-4 text-[#0E9F98] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>구글 시트 자동 기록 안내:</strong> 신청 완료 시 구글 시트에{' '}
            <strong className="underline underline-offset-2">자녀 수({children.length}명)에 맞춰 {children.length}줄로</strong>{' '}
            각각 아이 이름당 프리마켓 자리와 행운 뽑기권 번호가 자동으로 부여되어 입력됩니다.
          </div>
        </div>
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
          행사 당일 긴급 안내 및 배정된 자리 번호 확인에 사용됩니다.
        </p>
      </div>

      {/* 3. 프리마켓 자리 신청 여부 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Store className="w-4 h-4 text-[#0E9F98]" />
            <span>3. 프리마켓 자리(셀러) 신청</span>
          </label>
          <span className="text-[11px] font-bold text-[#FF8C32] bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
            가족당 1자리 배정
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFleaMarket('신청')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              fleaMarket === '신청'
                ? 'bg-teal-50 border-[#0E9F98] ring-2 ring-[#0E9F98]/30 text-teal-950 font-bold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-bold">셀러 자리 신청함</span>
              <span className="text-base">🏕️</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              신청 시 자리 번호 자동 부여 (예: 1번 자리, 2번 자리...)
            </p>
            <div className="mt-2 text-[10px] text-teal-700 bg-white/80 px-2 py-0.5 rounded border border-teal-200 inline-block font-semibold">
              셀러는 10시 30분까지 세팅 완료
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFleaMarket('미신청')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              fleaMarket === '미신청'
                ? 'bg-teal-50 border-[#0E9F98] ring-2 ring-[#0E9F98]/30 text-teal-950 font-bold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-bold">자리 미신청 (방문객)</span>
              <span className="text-base">🚶</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              물품 판매 없이 행사 관람 및 구매만 참여
            </p>
          </button>
        </div>
      </div>

      {/* 4. 행운 뽑기권 자동 발급 & 스페셜 미션 안내 */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FF8C32] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <span>자녀별 행운 뽑기권 자동 부여</span>
                <Sparkles className="w-3.5 h-3.5 text-[#FF8C32]" />
              </h4>
              <p className="text-[11px] text-amber-800">
                자리를 신청한 아이들에게 1인 1매씩 행운 뽑기권 번호가 자동 발행됩니다.
              </p>
            </div>
          </div>
          <span className="text-xs font-black bg-[#FF8C32] text-white px-2.5 py-1 rounded-full shadow-2xs shrink-0">
            총 {children.length}매 발급 예정
          </span>
        </div>

        {/* 미션 이벤트 안내 박스 */}
        <div className="p-3 rounded-xl bg-white/90 border border-amber-200 text-xs text-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-950 text-xs">
            <Gift className="w-4 h-4 text-[#FF8C32] shrink-0" />
            <span>[현장 추가 획득 이벤트] 행운 뽑기권 1매 더 받기!</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed pl-5">
            행사 당일 <strong className="text-slate-900 underline decoration-amber-400">셀러 물건 1개</strong> + <strong className="text-slate-900 underline decoration-amber-400">음식 1개</strong> + <strong className="text-slate-900 underline decoration-amber-400">체험 1개</strong>를 참여하시면 운영본부에서 <strong className="text-amber-900 font-bold">행운 뽑기권 1매를 추가로 증정</strong>합니다!
          </p>
        </div>
      </div>

      {/* 5. 행사 일시 및 셀러 세팅 시간 안내 박스 */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
        <Clock className="w-4 h-4 text-[#0E9F98] shrink-0 mt-0.5" />
        <div className="leading-snug space-y-1">
          <div>
            <strong className="text-slate-900">행사 일시:</strong> 10월 24일 11시 ~ 2시 (11:00 ~ 14:00)
          </div>
          <div className="text-teal-900 font-bold">
            ⚠️ 프리마켓 셀러는 10시 30분까지 도착하여 자리 세팅을 완료해 주세요!
          </div>
        </div>
      </div>

      {/* 6. 텀블러 지참 시 무료 음료 제공 안내 */}
      <div className="p-3 rounded-xl bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
        <Coffee className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="leading-snug space-y-0.5">
          <div className="font-bold text-emerald-900 flex items-center gap-1.5 flex-wrap">
            <span>텀블러 지참 시 무료 음료 제공!</span>
            <span className="text-[10px] bg-emerald-200/90 text-emerald-900 px-1.5 py-0.2 rounded-md font-bold">보통 사이즈</span>
          </div>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            개인 텀블러를 지참해 오시면 맛있는 무료 음료를 드립니다. 텀블러 크기는 <strong>보통 사이즈</strong>로 부탁드리며, 너무 크면 다른 사람들을 위해 더 양보해 주세요 🥤
          </p>
        </div>
      </div>

      {/* 7. 필수 주의사항 동의 체크 */}
      <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={noticeAgreed}
            onChange={(e) => setNoticeAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-[#0E9F98] border-slate-300 rounded focus:ring-[#0E9F98] cursor-pointer"
          />
          <div className="text-xs text-slate-800">
            <span className="font-bold text-amber-950">
              [필수] 행사 참여 필수 주의사항 및 나눔 기부(10%)에 동의합니다.
            </span>
            <p className="text-[11px] text-slate-600 mt-0.5">
              판매 수익금 10% 표선면 이웃 기부, 체육관 내 음식물 섭취 금지, 쓰레기 되가져가기, 셀러 10:30 세팅 완료 내용을 모두 확인하였습니다.
            </p>
          </div>
        </label>
      </div>

      {/* 오류 메시지 */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold animate-shake flex items-center gap-2">
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
            <span>신청 접수 및 자리 배정 중...</span>
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            <span>
              프리마켓 자리 & 행운 뽑기권 신청 완료 (총 {children.length}명)
            </span>
          </>
        )}
      </button>
    </form>
  );
};
