import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  MapPin,
  Sparkles,
  QrCode,
  FileCode,
  FileSpreadsheet,
  CheckCircle,
  RefreshCw,
  Sun,
  RotateCcw,
  HeartHandshake
} from 'lucide-react';
import { NoticeBox } from './components/NoticeBox';
import { RegistrationForm } from './components/RegistrationForm';
import { SuccessModal } from './components/SuccessModal';
import { GasGuideModal } from './components/GasGuideModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { QrCodeModal } from './components/QrCodeModal';
import { HanmaumLogo, HanmaumEmblem } from './components/HanmaumLogo';
import { fetchCurrentStatus, submitRegistration, getSavedGasUrl, saveGasUrl, resetLocalRecords } from './services/api';
import { CapacityMap, RegistrationFormData, SubmissionRecord } from './types';
import { GAS_SPREADSHEET_ID } from './gasCode';

export default function App() {
  const [capacity, setCapacity] = useState<CapacityMap>({
    making: { slot1: 0, slot2: 0, slot3: 0, slot4: 0 },
    game: { slot1: 0, slot2: 0, slot3: 0, slot4: 0 },
    roulette: { slot1: 0, slot2: 0, slot3: 0, slot4: 0 }
  });
  const [records, setRecords] = useState<SubmissionRecord[]>([]);
  const [isLiveGas, setIsLiveGas] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 모달 상태 관리
  const [successRecord, setSuccessRecord] = useState<SubmissionRecord | null>(null);
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // 상단 빠른 구글 시트 연동 인풋 상태
  const [quickGasUrl, setQuickGasUrl] = useState(getSavedGasUrl());
  const [quickSaveSuccess, setQuickSaveSuccess] = useState(false);

  // 데이터 로드
  const loadStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const status = await fetchCurrentStatus();
      setCapacity(status.counts);
      setRecords(status.records);
      setIsLiveGas(status.isLiveGas);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleQuickSaveGasUrl = () => {
    if (!quickGasUrl.trim()) {
      alert('배포된 구글 앱스 스크립트 웹 앱 URL을 입력해 주세요.');
      return;
    }
    saveGasUrl(quickGasUrl.trim());
    setQuickSaveSuccess(true);
    loadStatus();
    setTimeout(() => setQuickSaveSuccess(false), 3000);
  };

  // 제출 핸들러
  const handleFormSubmit = async (formData: RegistrationFormData) => {
    setIsSubmitting(true);
    try {
      const result = await submitRegistration(formData);
      if (result.status === 'success') {
        if (result.record) {
          setSuccessRecord({
            ...result.record,
            luckyTicketsList: result.luckyTicketsList || result.record.luckyTicketsList
          });
        } else {
          // record가 없으면 기본 생성
          const studentGradeClass = formData.children.map(c => `${c.grade} ${c.classNum}`).join(' / ');
          const studentName = formData.children.map(c => c.name).join(' / ');
          const progDict: Record<string, string> = {
            making: '만들기',
            game: '게임',
            roulette: '룰렛 돌리기'
          };
          const slotDict: Record<string, string> = {
            slot1: '1타임: 10:00 ~ 11:00',
            slot2: '2타임: 11:00 ~ 12:00',
            slot3: '3타임: 13:00 ~ 14:00',
            slot4: '4타임: 14:00 ~ 15:00'
          };

          let programName = '미신청';
          let timeSlotLabel = '';

          if (formData.programs.length > 0) {
            const childProgLines: string[] = [];
            const childSlotLines: string[] = [];

            formData.children.forEach((c, cIdx) => {
              const cName = c.name.trim() || `자녀 ${cIdx + 1}`;
              const progsForChild = formData.programs.filter((p) => p.participantName.trim() === cName);
              if (progsForChild.length > 0) {
                const progParts = progsForChild.map((p) => `${progDict[p.programId]} (${slotDict[p.timeSlotId]})`);
                const slotParts = progsForChild.map((p) => slotDict[p.timeSlotId]);
                childProgLines.push(`${cName}: ${progParts.join(', ')}`);
                childSlotLines.push(`${cName}: ${slotParts.join(', ')}`);
              }
            });

            if (childProgLines.length > 0) {
              programName = childProgLines.join('\n');
              timeSlotLabel = childSlotLines.join('\n');
            }
          }

          setSuccessRecord({
            id: 'REC-NEW',
            timestamp: new Date().toLocaleString('ko-KR'),
            studentGradeClass,
            studentName,
            phone: formData.phone,
            fleaMarket: formData.fleaMarket,
            programName,
            timeSlotLabel,
            luckyTicket: result.luckyTicket || '미신청',
            luckyTicketsList: result.luckyTicketsList,
            noticeAgreed: '동의완료'
          });
        }
        await loadStatus();
      } else {
        alert(result.message || '신청 등록 중 문제가 발생했습니다.');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      alert('오류가 발생했습니다: ' + errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasConfiguredGas = Boolean(getSavedGasUrl());

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-[#0E9F98] selection:text-white">
      {/* 
        Top Bar Contract (Section 2 of Frontend Design Constitution):
        Exactly three zones separated by gap-8:
        [Brand title, 1 line] — [4-5 nav links, 1-2 words, single-line] — [1 primary action]
      */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark with official School Emblem */}
          <a
            href="/"
            className="text-base sm:text-lg font-black tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-2.5"
          >
            <HanmaumEmblem size={34} />
            <div className="flex flex-col">
              <span className="leading-tight font-black">한마음초등학교</span>
              <span className="text-[10px] text-[#0E9F98] font-bold tracking-tight">프리마켓 & 체험 프로그램</span>
            </div>
          </a>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-semibold text-slate-600">
            <a
              href="#form-section"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              신청접수
            </a>
            <a
              href="#notice-section"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              주의사항
            </a>
            <button
              onClick={() => setIsGasModalOpen(true)}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <span>Code.gs 연동</span>
            </button>
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <span>신청현황</span>
              <span className="text-[11px] font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-full border border-teal-200">
                {records.length}명
              </span>
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-2xs whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR 코드</span>
            </button>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 영역 */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* 상단 연결 상태 및 신청 접수 현황 배너 */}
        <div className="mb-6 space-y-3">
          {!hasConfiguredGas ? (
            <div className="p-4 rounded-2xl bg-amber-50/95 border-2 border-amber-300 text-amber-950 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="text-xl shrink-0 mt-0.5">⚠️</span>
                  <div>
                    <h3 className="font-bold text-sm text-amber-950 flex items-center gap-1.5 flex-wrap">
                      <span>구글 시트(ID: {GAS_SPREADSHEET_ID.slice(0, 10)}...) 실시간 자동 연동 설정</span>
                      <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                        설정 대기
                      </span>
                    </h3>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                      학부모가 신청 시 선생님 구글 시트에 1행씩 실시간 자동 저장되려면 <strong>배포된 웹 앱 URL</strong>을 아래에 등록해 주세요.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${GAS_SPREADSHEET_ID}/edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-slate-800 font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                  >
                    <span>구글 시트 열기</span>
                    <span className="text-[10px]">↗</span>
                  </a>
                  <button
                    onClick={() => setIsGasModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>Code.gs 코드 복사</span>
                  </button>
                </div>
              </div>

              {/* 빠른 웹 앱 URL 입력창 */}
              <div className="pt-2 border-t border-amber-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="url"
                  placeholder="배포된 웹 앱 URL 붙여넣기 (예: https://script.google.com/macros/s/.../exec)"
                  value={quickGasUrl}
                  onChange={(e) => setQuickGasUrl(e.target.value)}
                  className="flex-1 text-xs font-mono px-3.5 py-2 rounded-xl bg-white border border-amber-300 focus:border-[#0E9F98] focus:ring-1 focus:ring-[#0E9F98] focus:outline-none"
                />
                <button
                  onClick={handleQuickSaveGasUrl}
                  className="px-4 py-2 rounded-xl bg-[#0E9F98] hover:bg-[#0c857f] text-white font-bold text-xs shrink-0 transition-colors cursor-pointer shadow-2xs flex items-center justify-center gap-1"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>URL 저장 및 시트 연동 활성화</span>
                </button>
              </div>

              {quickSaveSuccess && (
                <p className="text-xs font-bold text-teal-800 bg-teal-100/80 p-2 rounded-lg flex items-center gap-1">
                  <span>✅ 구글 시트 웹 앱 URL이 등록되었습니다! 이제 모든 신청이 구글 시트에 실시간 자동 입력됩니다.</span>
                </p>
              )}
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-teal-50/95 border border-teal-300 text-teal-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-teal-500 animate-pulse shrink-0" />
                <div>
                  <strong className="font-bold text-teal-900">구글 시트 실시간 자동 연동 활성화됨:</strong>
                  <span className="text-slate-700 ml-1">
                    신청서 접수 즉시 '한마음초 프리마켓' 시트에 1행씩 실시간 추가됩니다.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`https://docs.google.com/spreadsheets/d/${GAS_SPREADSHEET_ID}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-white border border-teal-200 hover:bg-teal-100 text-teal-900 font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <span>시트 확인</span>
                  <span className="text-[10px]">↗</span>
                </a>
                <button
                  onClick={() => setIsGasModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-[#0E9F98] hover:bg-[#0c857f] text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  연동 관리 / 재설정
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-xs text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  hasConfiguredGas ? 'bg-teal-500' : 'bg-emerald-500'
                }`}
              />
              <span className="font-bold text-slate-900">
                {records.length === 0
                  ? '현재 신청 접수 대기 중 (모든 운영 시간대 8명 정원 여유)'
                  : `현재 총 ${records.length}가족 신청 완료`}
              </span>
              <span className="text-slate-400 hidden sm:inline">|</span>
              <span className="text-slate-600 hidden sm:inline">
                {hasConfiguredGas
                  ? '✅ 구글 시트 실시간 자동 기록 활성화됨'
                  : '시트 ID: 1jYXplQ... 동기화 준비'}
              </span>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {records.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('신청자 데이터를 0명(초기 대기 상태)으로 초기화하시겠습니까?')) {
                      resetLocalRecords();
                      loadStatus();
                    }
                  }}
                  className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                  title="데이터를 0명으로 초기화"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>0명으로 초기화</span>
                </button>
              )}
              <button
                onClick={loadStatus}
                disabled={isLoading}
                className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>새로고침</span>
              </button>
              <button
                onClick={() => setIsGasModalOpen(true)}
                className="text-xs text-[#0E9F98] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Code.gs & 연동 설정</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* 좌측 컬럼: 행사 소개, 상단 로고, 기본 주의사항 및 실시간 현황 */}
          <div className="lg:col-span-5 space-y-6">
            {/* 상단 로고 & 행사 메인 카드 */}
            <div className="glass-container text-slate-800 relative overflow-hidden">
              {/* 상단 로고 (상단 중앙 배치 요구사항) */}
              <div className="flex flex-col items-center text-center pb-5 border-b border-slate-200/80">
                {/* 학교 공식 로고 배지 (사용자 스크린샷 100% 일치) */}
                <div className="mb-3.5 p-3 px-6 rounded-2xl bg-white shadow-xs border border-slate-200/80 inline-flex items-center justify-center">
                  <HanmaumLogo size="lg" layout="horizontal" />
                </div>

                <span className="text-xs font-bold text-[#0E9F98] tracking-wider uppercase flex items-center gap-1 mb-1">
                  <Sun className="w-3.5 h-3.5 text-[#FF8C32]" />
                  <span>학부모회 & 운영위원회 공동 주관</span>
                </span>

                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                  한마음초 프리마켓 &<br />
                  <span className="text-[#0E9F98]">체험 프로그램 신청</span>
                </h1>
                
                {/* 한 줄 문구: 표선바다의 시원한 바람과 함께 펼쳐지는 한마음 가족 화합의 날! */}
                <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200/90 text-xs font-bold text-teal-900 text-center whitespace-nowrap overflow-hidden text-ellipsis shadow-2xs">
                  표선바다의 시원한 바람과 함께 펼쳐지는 한마음 가족 화합의 날!
                </div>
              </div>

              {/* 메인 화면 제주 표선 바닷가 사진 카드 */}
              <div className="relative mt-4 rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs group">
                <img
                  src="/표선.jpg"
                  alt="제주 표선 바다 풍경"
                  className="w-full h-40 sm:h-44 object-cover group-hover:scale-102 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-3 text-white">
                  <span className="text-[10px] font-bold bg-[#0E9F98] text-white px-2 py-0.5 rounded-md inline-block w-fit mb-1 shadow-xs">
                    제주 표선 바다
                  </span>
                  <p className="text-xs font-bold text-white tracking-tight drop-shadow-sm whitespace-nowrap overflow-hidden text-ellipsis">
                    표선바다의 시원한 바람과 함께 펼쳐지는 한마음 가족 화합의 날!
                  </p>
                </div>
              </div>

              {/* 행사 기본 일시 및 장소 정보 */}
              <div className="pt-4 space-y-2 text-xs">
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-teal-50/80 text-teal-950 border border-teal-100">
                  <Calendar className="w-4 h-4 text-[#0E9F98] shrink-0" />
                  <div>
                    <span className="text-slate-500 font-normal mr-1">일시:</span>
                    <strong className="font-bold">10월 24일 10시~3시 (10:00 ~ 15:00)</strong>
                    <span className="text-[11px] text-teal-700 ml-1.5">(시작 20분 전 세팅)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-orange-50/80 text-orange-950 border border-orange-100">
                  <MapPin className="w-4 h-4 text-[#FF8C32] shrink-0" />
                  <div>
                    <span className="text-slate-500 font-normal mr-1">장소:</span>
                    <strong className="font-bold">표선생활체육관</strong>
                    <span className="text-[11px] text-orange-700 ml-1.5">(실내 체육관)</span>
                  </div>
                </div>

                {/* 수익 10% 기부 하이라이트 */}
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-50/90 text-amber-950 border border-amber-200/90">
                  <HeartHandshake className="w-4 h-4 text-[#FF8C32] shrink-0" />
                  <div>
                    <strong className="font-bold text-amber-900">수익의 10% 기부:</strong>
                    <span className="text-slate-700 ml-1">표선면 어려운 이웃을 위해 따뜻하게 나눕니다</span>
                  </div>
                </div>
              </div>

              {/* 체험 프로그램 3종 안내 요약 */}
              <div className="mt-4 pt-4 border-t border-slate-200/80">
                <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#0E9F98]" />
                  <span>타임별 체험 프로그램 (각 8명 정원)</span>
                </h4>
                <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                  <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <div className="text-base mb-0.5">🎨</div>
                    <div className="font-bold text-[11px] text-slate-800">1. 만들기</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">석고방향제&키링</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <div className="text-base mb-0.5">🎯</div>
                    <div className="font-bold text-[11px] text-slate-800">2. 게임</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">미니컬링&신발양궁</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <div className="text-base mb-0.5">🎡</div>
                    <div className="font-bold text-[11px] text-slate-800">3. 룰렛</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">행운의 선물 룰렛</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 필수 주의사항 안내 박스 (요구사항) */}
            <div id="notice-section">
              <NoticeBox />
            </div>

            {/* 빠른 도구 링크 카드 */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="p-3 rounded-xl bg-white/90 border border-slate-200 hover:border-teal-400 text-left transition-all cursor-pointer shadow-2xs flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-teal-700 mb-1">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="text-[10px] font-bold bg-teal-50 px-1.5 py-0.5 rounded">
                    운영진
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900">신청 명단 & 잔여석</div>
                <div className="text-[10px] text-slate-500 mt-0.5">현재 {records.length}가족 접수</div>
              </button>

              <button
                onClick={() => setIsQrModalOpen(true)}
                className="p-3 rounded-xl bg-white/90 border border-slate-200 hover:border-orange-400 text-left transition-all cursor-pointer shadow-2xs flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-[#FF8C32] mb-1">
                  <QrCode className="w-4 h-4" />
                  <span className="text-[10px] font-bold bg-orange-50 px-1.5 py-0.5 rounded">
                    출력용
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900">신청 QR 코드 보기</div>
                <div className="text-[10px] text-slate-500 mt-0.5">안내장 & 포스터 인쇄</div>
              </button>
            </div>
          </div>

          {/* 우측 컬럼: 반투명 흰색 컨테이너 카드 & 신청 폼 (가독성 처리) */}
          <div id="form-section" className="lg:col-span-7">
            <div className="glass-container">
              {/* 폼 상단 안내 헤더 */}
              <div className="mb-6 pb-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span>행사 참가 신청서</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-teal-100 text-[#0E9F98]">
                      온라인 접수
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    가족당 1회 신청 (자녀가 2명인 경우 '+ 두 번째 자녀 추가' 클릭)
                  </p>
                </div>

                <div className="text-right hidden sm:block">
                  <span className="text-[11px] text-slate-400">행사일</span>
                  <div className="text-xs font-bold text-slate-700">2026. 10. 24 (토)</div>
                </div>
              </div>

              {/* 신청 폼 컴포넌트 */}
              <RegistrationForm
                capacity={capacity}
                isSubmitting={isSubmitting}
                onSubmit={handleFormSubmit}
              />
            </div>
          </div>
        </div>
      </main>

      {/* 푸터 영역 */}
      <footer className="mt-12 py-6 bg-white/80 backdrop-blur-md border-t border-slate-200/80 text-xs text-slate-600">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="space-y-0.5">
            <p className="font-bold text-slate-800">
              제주 한마음초등학교 학부모회 & 운영위원회
            </p>
            <p className="text-[11px] text-slate-500">
              표선생활체육관 · 행사 문의: 한마음초 학부모회 운영지원팀
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <button
              onClick={() => setIsGasModalOpen(true)}
              className="hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1"
            >
              <FileCode className="w-3.5 h-3.5 text-[#0E9F98]" />
              <span>Google Apps Script(Code.gs) 코드</span>
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1"
            >
              <CheckCircle className="w-3.5 h-3.5 text-[#FF8C32]" />
              <span>실시간 관리자 뷰</span>
            </button>
          </div>
        </div>
      </footer>

      {/* 모달 팝업들 */}
      <SuccessModal
        record={successRecord}
        onClose={() => setSuccessRecord(null)}
        onReset={() => {
          setSuccessRecord(null);
          loadStatus();
        }}
      />

      <GasGuideModal
        isOpen={isGasModalOpen}
        onClose={() => setIsGasModalOpen(false)}
        onUrlUpdated={() => {
          loadStatus();
        }}
      />

      <AdminDashboardModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        records={records}
        capacity={capacity}
        onDataReset={() => {
          loadStatus();
        }}
      />

      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />
    </div>
  );
}
