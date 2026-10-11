import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  Check,
  ExternalLink,
  Save,
  X,
  HelpCircle,
  Database,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Play,
  Loader2
} from 'lucide-react';
import { GAS_SPREADSHEET_ID, GOOGLE_APPS_SCRIPT_CODE } from '../gasCode';
import { getSavedGasUrl, saveGasUrl } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUrlUpdated: () => void;
}

export const GasGuideModal: React.FC<Props> = ({ isOpen, onClose, onUrlUpdated }) => {
  const [copied, setCopied] = useState(false);
  const [gasUrl, setGasUrl] = useState(getSavedGasUrl());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveUrl = () => {
    saveGasUrl(gasUrl);
    setSaveSuccess(true);
    onUrlUpdated();
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // 실제 구글 시트 연동 테스트 전송
  const handleTestConnection = async () => {
    if (!gasUrl.trim()) {
      setTestResult({
        success: false,
        message: '먼저 배포된 Google Apps Script 웹 앱 URL을 입력해 주세요.'
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const testPayload = {
        studentGradeClass: '1학년 2반 (테스트)',
        studentName: '홍길동(연동테스트)',
        phone: '010-0000-0000',
        fleaMarket: '신청',
        programName: '-',
        timeSlotLabel: '1번 자리',
        luckyDraw: '참여',
        noticeAgreed: '동의완료'
      };

      const res = await fetch(gasUrl.trim(), {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(testPayload)
      });

      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success') {
          setTestResult({
            success: true,
            message: '🎉 연동 성공! 구글 시트를 새로고침해 보세요. 테스트 1행이 실시간으로 입력되었습니다!'
          });
          onUrlUpdated();
        } else {
          setTestResult({
            success: false,
            message: '시트 응답 오류: ' + (json.message || '알 수 없는 응답')
          });
        }
      } else {
        setTestResult({
          success: false,
          message: 'HTTP 통신 오류 (' + res.status + '). 웹 앱 배포 권한이 [모든 사용자(Anyone)]로 설정되었는지 확인해 주세요.'
        });
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setTestResult({
        success: false,
        message: '네트워크 연결 실패 (' + errMsg + '). Apps Script 배포 시 [새 배포] -> 액세스 권한: [모든 사용자]인지 다시 확인해 주세요.'
      });
    } finally {
      setTesting(false);
    }
  };

  const sheetUrl = `https://docs.google.com/spreadsheets/d/${GAS_SPREADSHEET_ID}/edit`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-3xl glass-modal p-5 sm:p-7 text-slate-800 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 상단 헤더 */}
        <div className="flex items-start gap-3 mb-5 pb-4 border-b border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-[#0E9F98] flex items-center justify-center shrink-0">
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              구글 시트 실시간 자동 입력 완벽 가이드
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              사용자 시트 컬럼([A] 학년/반 ~ [G] 행운권 번호)에 100% 맞춰 자동 기록됩니다.
            </p>
          </div>
        </div>

        {/* 사용자 시트 컬럼 100% 매칭 현황 */}
        <div className="mb-4 p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-xs">
          <div className="font-bold text-amber-950 flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="w-4 h-4 text-[#FF8C32]" />
            <span>선생님의 구글 시트 컬럼 규격 100% 동기화 완료:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[11px] text-slate-700 font-medium">
            <span className="bg-white/80 px-2 py-1 rounded border border-amber-100">A열: 학년/반</span>
            <span className="bg-white/80 px-2 py-1 rounded border border-amber-100">B열: 학생 이름</span>
            <span className="bg-white/80 px-2 py-1 rounded border border-amber-100">C열: 연락처</span>
            <span className="bg-white/80 px-2 py-1 rounded border border-amber-100">D열: 프리마켓 자리신청</span>
            <span className="bg-white/80 px-2 py-1 rounded border border-amber-100">E열: 체험 프로그램</span>
            <span className="bg-white/80 px-2 py-1 rounded border border-amber-100">F열: 배정 순서</span>
            <span className="bg-white/80 px-2 py-1 rounded border border-amber-100">G열: 행운권 번호</span>
          </div>
        </div>

        {/* 왜 자동 입력이 안 될까요? 핵심 이유 안내 */}
        <div className="mb-5 p-3.5 rounded-xl bg-blue-50/90 border border-blue-200 text-xs text-blue-950">
          <div className="font-bold flex items-center gap-1.5 mb-1">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <span>왜 지금 시트에 자동으로 안 들어갈까요?</span>
          </div>
          <p className="text-[11px] leading-relaxed text-blue-900">
            구글 시트는 보안상 웹 브라우저에서 직접 쓰기를 허용하지 않습니다. 구글 스프레드시트의 <strong>[확장 프로그램] → [Apps Script]</strong>에서 코드를 배포한 후 발급되는 <strong>웹 앱 URL(`https://script.google.com/macros/s/.../exec`)</strong>을 아래에 등록해야 신청서 제출 시 구글 시트로 실시간 데이터가 자동 전송됩니다.
          </p>
        </div>

        {/* 웹 앱 URL 등록 및 즉시 테스트 섹션 */}
        <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#0E9F98]" />
              <span>배포된 Google Apps Script 웹 앱 URL 입력</span>
            </span>
            <span className="text-[11px] text-[#0E9F98] font-semibold">1회만 등록하면 계속 자동 입력</span>
          </label>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              value={gasUrl}
              onChange={(e) => setGasUrl(e.target.value)}
              className="flex-1 text-xs font-mono px-3 py-2.5 rounded-lg bg-white border border-slate-300 focus:border-[#0E9F98] focus:outline-none"
            />
            <button
              onClick={handleSaveUrl}
              className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>URL 저장</span>
            </button>
            <button
              onClick={handleTestConnection}
              disabled={testing || !gasUrl.trim()}
              className="px-3.5 py-2.5 rounded-lg bg-[#0E9F98] hover:bg-[#0c857f] disabled:bg-slate-300 text-white text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer"
            >
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              <span>시트 연동 테스트 전송</span>
            </button>
          </div>

          {saveSuccess && (
            <p className="text-[11px] text-teal-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>웹 앱 URL이 저장되었습니다! 이제 모든 신청서가 실제 구글 시트에 즉시 기록됩니다.</span>
            </p>
          )}

          {testResult && (
            <div
              className={`p-2.5 rounded-lg text-xs font-medium flex items-start gap-1.5 ${
                testResult.success
                  ? 'bg-teal-50 border border-teal-200 text-teal-900'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <span className="text-[11px] leading-relaxed">{testResult.message}</span>
            </div>
          )}
        </div>

        {/* 4단계 배포 초간단 순서 */}
        <div className="mb-5 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-[#FF8C32]" />
              <span>구글 시트 3분 배포 순서 (따라하기)</span>
            </h3>
            <a
              href={sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#0E9F98] font-bold hover:underline flex items-center gap-1"
            >
              <span>스프레드시트 열기</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-lg bg-white border border-slate-200">
              <span className="font-bold text-[#0E9F98] mr-1">1단계.</span>
              <strong>Apps Script 열기</strong>
              <p className="text-slate-600 text-[11px] mt-1">
                구글 시트 메뉴의 <strong>[확장 프로그램] → [Apps Script]</strong>를 클릭합니다.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-white border border-slate-200">
              <span className="font-bold text-[#0E9F98] mr-1">2단계.</span>
              <strong>Code.gs 붙여넣기</strong>
              <p className="text-slate-600 text-[11px] mt-1">
                아래 <strong>[Code.gs 전체 복사]</strong> 버튼을 눌러 복사한 스크립트를 붙여넣고 저장(Ctrl+S)합니다.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-white border border-slate-200">
              <span className="font-bold text-[#0E9F98] mr-1">3단계.</span>
              <strong>새 배포 실행</strong>
              <p className="text-slate-600 text-[11px] mt-1">
                우측 상단 <strong>[배포] → [새 배포]</strong> 클릭 후 톱니바퀴에서 <strong>[웹 앱]</strong>을 선택합니다.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-white border border-slate-200">
              <span className="font-bold text-[#0E9F98] mr-1">4단계.</span>
              <strong>액세스: '모든 사용자' (필수★)</strong>
              <p className="text-slate-600 text-[11px] mt-1">
                액세스 권한을 반드시 <strong>'모든 사용자(Anyone)'</strong>로 설정하고 배포 후 생성된 웹 앱 URL을 복사하여 위 칸에 넣어주세요.
              </p>
            </div>
          </div>
        </div>

        {/* Code.gs 전체 코드 복사 영역 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              Code.gs 전체 소스 코드 (클릭하여 복사)
            </span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>복사 완료!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Code.gs 전체 복사</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 text-[11px] font-mono leading-relaxed overflow-x-auto max-h-72 border border-slate-800 select-all">
            {GOOGLE_APPS_SCRIPT_CODE}
          </pre>
        </div>

        {/* 하단 닫기 */}
        <div className="mt-5 pt-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
