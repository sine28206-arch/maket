import React, { useState } from 'react';
import {
  Users,
  Store,
  Sparkles,
  Gift,
  Download,
  RotateCcw,
  Search,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { CapacityMap, SubmissionRecord } from '../types';
import { resetLocalRecords } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  records: SubmissionRecord[];
  capacity: CapacityMap;
  onDataReset: () => void;
}

export const AdminDashboardModal: React.FC<Props> = ({
  isOpen,
  onClose,
  records,
  capacity,
  onDataReset
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgram, setFilterProgram] = useState<string>('all');

  if (!isOpen) return null;

  // 통계 계산
  const totalFamilies = records.length;
  const fleaMarketCount = records.filter((r) => r.fleaMarket === '신청').length;
  const luckyDrawCount = records.filter((r) => r.luckyTicket && r.luckyTicket !== '미신청').length;

  // 필터링된 기록
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.studentName.includes(searchTerm) ||
      r.studentGradeClass.includes(searchTerm) ||
      r.phone.includes(searchTerm) ||
      (r.luckyTicket && r.luckyTicket.includes(searchTerm));

    const matchesProgram =
      filterProgram === 'all' ||
      (filterProgram === 'flea' && r.fleaMarket === '신청') ||
      r.programName.includes(filterProgram);

    return matchesSearch && matchesProgram;
  });

  // CSV 다운로드 핸들러
  const handleDownloadCsv = () => {
    const headers = [
      '접수번호',
      '신청일시',
      '학생 이름',
      '학년/반',
      '연락처',
      '프리마켓 부스',
      '체험 프로그램',
      '시간대',
      '행운권 번호',
      '주의사항 동의'
    ];

    const rows = records.map((r, i) => [
      `"${i + 1}"`,
      `"${r.timestamp}"`,
      `"${r.studentName}"`,
      `"${r.studentGradeClass}"`,
      `"${r.phone}"`,
      `"${r.fleaMarket}"`,
      `"${r.programName}"`,
      `"${r.timeSlotLabel}"`,
      `"${r.luckyTicket}"`,
      `"${r.noticeAgreed}"`
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `한마음초_프리마켓_신청자명단_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    if (confirm('신청자 데이터를 0명(초기 대기 상태)으로 초기화하시겠습니까? 모든 시간대 정원이 8명으로 복원됩니다.')) {
      resetLocalRecords();
      onDataReset();
    }
  };

  const programs = [
    { key: 'making', name: '만들기' },
    { key: 'game', name: '게임' },
    { key: 'roulette', name: '룰렛 돌리기' }
  ];

  const slots = [
    { key: 'slot1', label: '1타임 (10~11시)' },
    { key: 'slot2', label: '2타임 (11~12시)' },
    { key: 'slot3', label: '3타임 (13~14시)' },
    { key: 'slot4', label: '4타임 (14~15시)' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-5xl glass-modal p-5 sm:p-7 text-slate-800 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 상단 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#0E9F98]" />
              <span>운영진 실시간 신청 현황 & 정원 대시보드</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              한마음초등학교 학부모회 & 운영위원회 전용 현황 모니터링
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCsv}
              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>명단 CSV 다운로드</span>
            </button>
            <button
              onClick={handleReset}
              title="초기 시연 데이터로 복원"
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>초기화</span>
            </button>
          </div>
        </div>

        {/* 상단 요약 지표 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="text-slate-500 text-xs flex items-center gap-1 mb-1">
              <Users className="w-3.5 h-3.5 text-teal-600" />
              <span>총 신청 가족</span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {totalFamilies}
              <span className="text-xs font-normal text-slate-500 ml-1">가족</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="text-slate-500 text-xs flex items-center gap-1 mb-1">
              <Store className="w-3.5 h-3.5 text-[#0E9F98]" />
              <span>프리마켓 부스</span>
            </div>
            <div className="text-2xl font-black text-teal-700 font-mono">
              {fleaMarketCount}
              <span className="text-xs font-normal text-slate-500 ml-1">자리 신청</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="text-slate-500 text-xs flex items-center gap-1 mb-1">
              <Gift className="w-3.5 h-3.5 text-[#FF8C32]" />
              <span>행운권 응모자</span>
            </div>
            <div className="text-2xl font-black text-[#FF8C32] font-mono">
              {luckyDrawCount}
              <span className="text-xs font-normal text-slate-500 ml-1">명</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="text-slate-500 text-xs flex items-center gap-1 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>타임별 정원 한도</span>
            </div>
            <div className="text-2xl font-black text-sky-700 font-mono">
              8<span className="text-xs font-normal text-slate-500 ml-1">명/슬롯</span>
            </div>
          </div>
        </div>

        {/* 프로그램별 타임슬롯 정원 현황 그리드 */}
        <div className="mb-6 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#0E9F98]" />
            <span>체험 프로그램 타임별 정원(8명) 실시간 예약 현황</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {programs.map((prog) => (
              <div key={prog.key} className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200 space-y-2">
                <div className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-1 flex items-center justify-between">
                  <span>{prog.name}</span>
                  <span className="text-[10px] text-slate-500">최대 8명</span>
                </div>

                <div className="space-y-1.5">
                  {slots.map((s) => {
                    const booked = capacity[prog.key]?.[s.key] || 0;
                    const isFull = booked >= 8;
                    const percent = Math.min(100, Math.round((booked / 8) * 100));

                    return (
                      <div key={s.key} className="text-xs">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-slate-600 text-[11px]">{s.label}</span>
                          <span className={`text-[11px] font-bold ${isFull ? 'text-red-600' : 'text-slate-800'}`}>
                            {isFull ? '[마감] 8/8명' : `${booked}/8명 (잔여 ${8 - booked})`}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isFull ? 'bg-red-500' : 'bg-[#0E9F98]'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 검색 및 필터 바 */}
        <div className="flex flex-col sm:flex-row items-center gap-2 mb-3">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="학생 이름, 학년반, 연락처, 행운권 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 rounded-lg bg-white border border-slate-300 focus:border-[#0E9F98] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
            <select
              value={filterProgram}
              onChange={(e) => setFilterProgram(e.target.value)}
              className="text-xs px-2.5 py-2 rounded-lg bg-white border border-slate-300 focus:border-[#0E9F98] focus:outline-none w-full sm:w-auto"
            >
              <option value="all">전체 프로그램 보기</option>
              <option value="만들기">만들기만</option>
              <option value="게임">게임만</option>
              <option value="룰렛">룰렛 돌리기만</option>
              <option value="flea">프리마켓 신청자만</option>
            </select>
          </div>
        </div>

        {/* 신청자 목록 테이블 */}
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100/90 text-slate-700 sticky top-0 border-b border-slate-200 font-bold">
                <tr>
                  <th className="p-2.5 text-center w-12">#</th>
                  <th className="p-2.5 whitespace-nowrap">학생 이름</th>
                  <th className="p-2.5 whitespace-nowrap">학년/반</th>
                  <th className="p-2.5 whitespace-nowrap">연락처</th>
                  <th className="p-2.5 text-center whitespace-nowrap">프리마켓</th>
                  <th className="p-2.5 whitespace-nowrap">체험 프로그램 (참여 학생)</th>
                  <th className="p-2.5 whitespace-nowrap">시간대</th>
                  <th className="p-2.5 text-center whitespace-nowrap">행운권 번호</th>
                  <th className="p-2.5 whitespace-nowrap">접수시각</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400 text-xs">
                      검색 조건과 일치하는 신청 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r, index) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 text-center text-slate-400 font-mono text-[11px]">
                        {index + 1}
                      </td>
                      <td className="p-2.5 font-bold text-slate-900 whitespace-nowrap">
                        {r.studentName}
                      </td>
                      <td className="p-2.5 text-slate-600 whitespace-nowrap">
                        {r.studentGradeClass}
                      </td>
                      <td className="p-2.5 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                        {r.phone}
                      </td>
                      <td className="p-2.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.fleaMarket === '신청'
                              ? 'bg-teal-100 text-teal-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {r.fleaMarket}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-800 font-medium whitespace-pre-line leading-relaxed min-w-[220px]">
                        {r.programName}
                      </td>
                      <td className="p-2.5 text-slate-600 text-[11px] whitespace-pre-line leading-relaxed min-w-[180px]">
                        {r.timeSlotLabel || '-'}
                      </td>
                      <td className="p-2.5 text-center whitespace-nowrap">
                        {r.luckyTicket && r.luckyTicket !== '미신청' ? (
                          <span className="font-mono font-bold text-[#FF8C32] bg-orange-50 px-2 py-0.5 rounded text-[11px] border border-orange-200">
                            {r.luckyTicket}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">미신청</span>
                        )}
                      </td>
                      <td className="p-2.5 text-slate-400 text-[10px] whitespace-nowrap">
                        {r.timestamp}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
