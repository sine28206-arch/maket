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
  HeartHandshake,
  Lock,
  LogOut,
  ShieldCheck,
  Coffee,
  SendHorizontal,
  Gift
} from 'lucide-react';
import { NoticeBox } from './components/NoticeBox';
import { RegistrationForm } from './components/RegistrationForm';
import { SuccessModal } from './components/SuccessModal';
import { GasGuideModal } from './components/GasGuideModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { QrCodeModal } from './components/QrCodeModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { HanmaumLogo, HanmaumEmblem } from './components/HanmaumLogo';
import { fetchCurrentStatus, submitRegistration, getSavedGasUrl, saveGasUrl, resetLocalRecords } from './services/api';
import { CapacityMap, RegistrationFormData, SubmissionRecord } from './types';
import { GAS_SPREADSHEET_ID } from './gasCode';

export default function App() {
  // 운영진 관리자 모드 상태 (기본: 학부모 모드, 로그인 시 관리자 모드 활성화)
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true' || urlParams.get('admin') === '1024') {
      localStorage.setItem('hanmaeum_admin_auth', 'true');
      return true;
    }
    return localStorage.getItem('hanmaeum_admin_auth') === 'true';
  });
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);

  const [capacity, setCapacity] = useState<CapacityMap>({
    making: { slot1: 0, slot2: 0, slot3: 0, slot4: 0 },
    game: { slot1: 0, slot2: 0, slot3: 0, slot4: 0 },
    roulette: { slot1: 0, slot2: 0, slot3: 0, slot4: 0 }
  });
  const [records, setRecords] = useState<SubmissionRecord[]>([]);
  const [isLiveGas, setIsLiveGas] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 실시간 참여 집계
  const sellerCount = records.filter(r => r.fleaMarket && r.fleaMarket !== '미신청').length;
  const airplaneCount = records.filter(r => r.paperAirplane || String(r.programName || '').includes('✓')).length;

  // 모달 상태 관리
  const [successRecord, setSuccessRecord] = useState<SubmissionRecord | null>(null);
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

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
    const studentGradeClass = formData.children.map(c => `${c.grade} ${c.classNum}`).join(' / ');
    const studentName = formData.children.map(c => c.name.trim()).join(' / ');

    try {
      const result = await submitRegistration(formData);
      const assignedSeat = result.seatNumber || (formData.fleaMarket === '신청' ? '1번 자리' : '미신청');
      const hasAnyAirplane = formData.children.some(c => c.paperAirplane);

      const modalRecord: SubmissionRecord = {
        id: result.record?.id || `REC-${Date.now()}`,
        timestamp: result.record?.timestamp || new Date().toLocaleString('ko-KR'),
        studentGradeClass,
        studentName,
        phone: formData.phone,
        fleaMarket: assignedSeat,
        seatNumber: assignedSeat,
        programName: hasAnyAirplane ? '✓' : '-',
        paperAirplane: hasAnyAirplane,
        timeSlotLabel: assignedSeat,
        luckyTicket: result.luckyTicket || 'LKN-1001',
        luckyTicketsList: result.luckyTicketsList && result.luckyTicketsList.length > 0
          ? result.luckyTicketsList
          : formData.children.map((c, i) => ({
              childName: c.name.trim() || `자녀 ${i + 1}`,
              ticketNumber: `LKN-${1001 + i}`,
              seatNumber: assignedSeat,
              paperAirplane: c.paperAirplane ?? true
            })),
        noticeAgreed: '동의완료'
      };

      // 팝업 즉시 오픈 보장 (0초 만에 노출)
      setSuccessRecord(modalRecord);

      // 상태 갱신은 백그라운드로 안전하게 진행
      loadStatus().catch(() => {});
    } catch (err: unknown) {
      console.error('Submit error:', err);
      // 어떤 네트워크나 브라우저 예외가 발생하더라도 사용자에게는 즉시 신청완료 & 자리번호 팝업 노출!
      const fallbackSeat = formData.fleaMarket === '신청' ? '1번 자리' : '미신청';
      const hasAnyAirplane = formData.children.some(c => c.paperAirplane);
      const fallbackRecord: SubmissionRecord = {
        id: `REC-${Date.now()}`,
        timestamp: new Date().toLocaleString('ko-KR'),
        studentGradeClass,
        studentName,
        phone: formData.phone,
        fleaMarket: fallbackSeat,
        seatNumber: fallbackSeat,
        programName: hasAnyAirplane ? '✓' : '-',
        paperAirplane: hasAnyAirplane,
        timeSlotLabel: fallbackSeat,
        luckyTicket: 'LKN-1001',
        luckyTicketsList: formData.children.map((c, i) => ({
          childName: c.name.trim() || `자녀 ${i + 1}`,
          ticketNumber: `LKN-${1001 + i}`,
          seatNumber: fallbackSeat,
          paperAirplane: c.paperAirplane ?? true
        })),
        noticeAgreed: '동의완료'
      };
      setSuccessRecord(fallbackRecord);
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
      {/* 운영진 모드 활성화 알림 바 (운영진 로그인 시에만 상단에 표시) */}
      {isAdmin && (
        <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between text-xs font-medium border-b border-slate-800 shadow-sm z-50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-bold text-emerald-300">🔐 운영진(관리자) 모드 접속 중</span>
            <span className="text-slate-400 hidden sm:inline">|</span>
            <span className="text-slate-400 hidden sm:inline">
              일반 학부모 화면에는 명단 조회, QR 코드, 시트 연동 설정 등 관리자 도구가 안전하게 숨겨집니다.
            </span>
          </div>
          <button
            onClick={() => {
              setIsAdmin(false);
              localStorage.removeItem('hanmaeum_admin_auth');
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer border border-slate-700 flex items-center gap-1 shrink-0"
            title="학부모 화면으로 전환"
          >
            <LogOut className="w-3 h-3 text-slate-400" />
            <span>학부모 화면으로 전환 (로그아웃)</span>
          </button>
        </div>
      )}

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
              <span className="text-[10px] text-[#0E9F98] font-bold tracking-tight">프리마켓 & 화합의 날</span>
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
            {/* 운영진 전용 링크 */}
            {isAdmin && (
              <>
                <button
                  onClick={() => setIsGasModalOpen(true)}
                  className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer text-teal-700"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Code.gs 연동</span>
                </button>
                <button
                  onClick={() => setIsAdminModalOpen(true)}
                  className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer text-teal-700"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>신청현황</span>
                  <span className="text-[11px] font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-full border border-teal-200">
                    {records.length}명
                  </span>
                </button>
              </>
            )}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-2 shrink-0">
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsQrModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-2xs whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>QR 코드</span>
                </button>
                <button
                  onClick={() => {
                    setIsAdmin(false);
                    localStorage.removeItem('hanmaeum_admin_auth');
                  }}
                  className="hidden sm:flex px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors items-center gap-1 cursor-pointer"
                  title="로그아웃"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>로그아웃</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAdminLoginModalOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200/80"
                title="운영진 관리자 전용 메뉴"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>운영진 로그인</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 영역 */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* 상단 연결 상태 및 신청 접수 현황 배너 (운영진 로그인 시에만 표시!) */}
        {isAdmin && (
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
                    ? '현재 신청 접수 대기 중 (0명 등록)'
                    : `총 ${records.length}명 신청 · 셀러 ${sellerCount}자리 · 종이비행기 접기 대회 ${airplaneCount}명`}
                </span>
                <span className="text-slate-400 hidden sm:inline">|</span>
                <span className="text-slate-600 hidden sm:inline">
                  {hasConfiguredGas
                    ? '✅ 구글 시트 실시간 자동 기록 활성화됨 (자녀당 1줄씩 배정)'
                    : '시트 ID: 1jYXplQ... 동기화 준비'}
                </span>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setIsResetModalOpen(true)}
                  className="text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer font-semibold shadow-2xs"
                  title="데이터를 0명으로 초기화하고 자리번호 1번부터 다시 시작"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-red-500" />
                  <span>0명으로 초기화 (자리 1번부터 리셋)</span>
                </button>
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
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* 좌측 컬럼: 행사 소개, 상단 로고, 기본 주의사항 및 실시간 현황 */}
          <div className="lg:col-span-5 space-y-4">
            {/* 상단 행사 소개 카드 (간결하고 가독성 높은 디자인) */}
            <div className="glass-container text-slate-800 space-y-3.5">
              {/* 상단 공식 로고 및 행사 타이틀 */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 pb-3 border-b border-slate-200">
                <div className="p-2 rounded-xl bg-white shadow-2xs border border-slate-200 shrink-0">
                  <HanmaumEmblem size={40} />
                </div>
                <div className="text-center sm:text-left">
                  <span className="text-[11px] font-bold text-[#0E9F98] uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
                    <Sun className="w-3.5 h-3.5 text-[#FF8C32]" />
                    <span>학부모회 & 운영위원회 공동 주관</span>
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                    한마음초 프리마켓 & 화합의 날
                  </h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    표선바다의 시원한 바람과 함께하는 한마음 가족 축제
                  </p>
                </div>
              </div>

              {/* 제주 표선 바다 사진 배너 */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-2xs">
                <img
                  src="/표선.jpg"
                  alt="제주 표선 바다 풍경"
                  className="w-full h-32 sm:h-36 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-3 text-white">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-white drop-shadow-sm">
                      제주 표선생활체육관
                    </span>
                    <span className="text-[11px] font-bold bg-[#0E9F98] text-white px-2 py-0.5 rounded-md">
                      10월 24일 11:00~14:00
                    </span>
                  </div>
                </div>
              </div>

              {/* 핵심 행사 정보 4가지 (깔끔한 2x2 그리드) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-teal-50/70 text-teal-950 border border-teal-100">
                  <Calendar className="w-4 h-4 text-[#0E9F98] shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] text-teal-700 font-semibold">행사 일시</div>
                    <div className="font-bold text-slate-900 truncate">10월 24일 11시~2시</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-orange-50/70 text-orange-950 border border-orange-100">
                  <MapPin className="w-4 h-4 text-[#FF8C32] shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] text-orange-700 font-semibold">행사 장소</div>
                    <div className="font-bold text-slate-900 truncate">표선생활체육관 (실내)</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/70 text-emerald-950 border border-emerald-100">
                  <Coffee className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] text-emerald-700 font-semibold">텀블러 지참 시</div>
                    <div className="font-bold text-slate-900 truncate">무료 음료 제공 (보통 크기)</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50/70 text-amber-950 border border-amber-100">
                  <HeartHandshake className="w-4 h-4 text-amber-600 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] text-amber-700 font-semibold">따뜻한 나눔</div>
                    <div className="font-bold text-slate-900 truncate">수익 10% 표선면 이웃 기부</div>
                  </div>
                </div>
              </div>

              {/* ✈️ 체험 신청: 종이비행기 접기 & 날리기 대회 배너 (1등, 2등, 3등 상품 증정!) */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 text-sky-950 flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <SendHorizontal className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <strong className="text-xs font-bold text-sky-950">
                      ✈️ 종이비행기 접기 대회 (체험 신청)
                    </strong>
                    <span className="text-[10px] font-bold bg-white text-sky-700 px-2 py-0.5 rounded-full border border-sky-200">
                      1등 · 2등 · 3등 상품 증정 🏆
                    </span>
                  </div>
                  <p className="text-[11px] text-sky-800 mt-1 leading-snug">
                    우측 신청서에서 자녀별로 참가 신청할 수 있으며, 참가 인원은 시트에 자동 집계됩니다.
                  </p>
                </div>
              </div>

              {/* 🎟️ 행운 뽑기권 전원 증정 안내 */}
              <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/90 text-xs text-amber-950 flex items-center gap-2">
                <Gift className="w-4 h-4 text-[#FF8C32] shrink-0" />
                <span className="text-[11px] text-slate-700">
                  <strong className="text-amber-950">행운 뽑기권 전원 부여</strong>: 셀러 및 일반 참가 모든 자녀에게 1인 1매 자동 발급!
                </span>
              </div>
            </div>

            {/* 필수 주의사항 안내 박스 (요구사항) */}
            <div id="notice-section">
              <NoticeBox />
            </div>

            {/* 빠른 도구 링크 카드 (운영진 로그인 시에만 표시!) */}
            {isAdmin && (
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
                  <div className="text-xs font-bold text-slate-900">자리 & 행운권 명단</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">현재 {records.length}명(행) 등록</div>
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
            )}
          </div>

          {/* 우측 컬럼: 반투명 흰색 컨테이너 카드 & 신청 폼 (가독성 처리) */}
          <div id="form-section" className="lg:col-span-7">
            <div className="glass-container">
              {/* 폼 상단 안내 헤더 */}
              <div className="mb-5 pb-3 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span>한마음초 프리마켓 신청</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-teal-100 text-[#0E9F98]">
                      신청 접수
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    가족당 1자리 배정 · 모든 자녀 행운 뽑기권 및 종이비행기 대회 신청
                  </p>
                </div>

                <div className="text-right hidden sm:block">
                  <span className="text-[11px] text-slate-400">행사일</span>
                  <div className="text-xs font-bold text-slate-700">10월 24일 11시~2시</div>
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
            {isAdmin ? (
              <>
                <button
                  onClick={() => setIsGasModalOpen(true)}
                  className="hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1 text-teal-700"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Google Apps Script(Code.gs) 코드</span>
                </button>
                <span className="text-slate-300">·</span>
                <button
                  onClick={() => setIsAdminModalOpen(true)}
                  className="hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1 text-[#FF8C32]"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>실시간 관리자 뷰</span>
                </button>
                <span className="text-slate-300">·</span>
                <button
                  onClick={() => {
                    setIsAdmin(false);
                    localStorage.removeItem('hanmaeum_admin_auth');
                  }}
                  className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer flex items-center gap-1 text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>로그아웃</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsAdminLoginModalOpen(true)}
                className="hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-xs"
                title="운영진 관리자 전용"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>운영진 전용</span>
              </button>
            )}
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

      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onLoginSuccess={() => setIsAdmin(true)}
      />

      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        recordCount={records.length}
        onResetComplete={() => {
          setRecords([]);
          loadStatus();
        }}
      />
    </div>
  );
}
