import React, { useState } from 'react';
import { Lock, KeyRound, X, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // 행사 일시(10월 24일)에 맞춘 직관적인 기본 비밀번호 '1024' (또는 '0000', 'admin')
    const validPasswords = ['1024', '0000', 'admin'];

    if (validPasswords.includes(password.trim())) {
      localStorage.setItem('hanmaeum_admin_auth', 'true');
      onLoginSuccess();
      setPassword('');
      onClose();
    } else {
      setErrorMsg('비밀번호가 올바르지 않습니다. (기본 비밀번호: 1024)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm glass-modal p-6 text-slate-800 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-teal-100 text-[#0E9F98] flex items-center justify-center mb-3 shadow-xs">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            운영진 전용 관리자 인증
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            신청자 명단, QR 코드 출력, 시트 연동 설정은 운영진에게만 공개됩니다.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#0E9F98]" />
              <span>운영진 비밀번호</span>
            </label>
            <input
              type="password"
              autoFocus
              placeholder="비밀번호 입력 (기본: 1024)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 focus:border-[#0E9F98] focus:ring-2 focus:ring-[#0E9F98]/20 focus:outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-snug">
            💡 <strong>운영진 안내:</strong> 행사일(10월 24일)을 뜻하는 <strong className="underline">1024</strong>를 입력하시면 즉시 로그인되며, 로그인 후에는 이 브라우저에 관리자 상태가 안전하게 유지됩니다.
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-[#0E9F98] hover:bg-[#0c857f] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>운영진 모드로 접속</span>
          </button>
        </form>
      </div>
    </div>
  );
};
