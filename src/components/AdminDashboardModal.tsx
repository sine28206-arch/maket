import React, { useState } from 'react';
import {
  Users,
  Store,
  Ticket,
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
  capacity?: CapacityMap;
  onDataReset: () => void;
}

export const AdminDashboardModal: React.FC<Props> = ({
  isOpen,
  onClose,
  records,
  onDataReset
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  // 통계 계산
  const totalEntries = records.length;
  const fleaMarketCount = records.filter(
    (r) => r.fleaMarket && r.fleaMarket !== '미신청'
  ).length;
  const luckyDrawCount = records.filter(
    (r) => r.luckyTicket && r.luckyTicket !== '미신청'
  ).length;

  // 필터링된 기록
  const filteredRecords = records.filter((r) => {
    return (
      r.studentName.includes(searchTerm) ||
      r.studentGradeClass.includes(searchTerm) ||
      r.phone.includes(searchTerm) ||
      (r.fleaMarket && r.fleaMarket.includes(searchTerm)) ||
      (r.luckyTicket && r.luckyTicket.includes(searchTerm))
    );
  });

  // CSV 다운로드 핸들러
  const handleDownloadCsv = () => {
    const headers = [
      '연번',
      '신청일시',
      '학생 이름',
      '학년/반',
      '연락처',
      '프리마켓 배정 자리',
      '행운 뽑기권 번호',
      '주의사항 동의'
    ];

    const rows = records.map((r, i) => [
      `"${i + 1}"`,
      `"${r.timestamp}"`,
      `"${r.studentName}"`,
      `"${r.studentGradeClass}"`,
      `"${r.phone}"`,
      `"${r.fleaMarket || r.seatNumber || '미신청'}"`,
      `"${r.luckyTicket}"`,
      `"${r.noticeAgreed}"`
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `한마음초_프리마켓_행운뽑기_명단_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    if (confirm('신청자 데이터를 0명(초기 대기 상태)으로 초기화하시겠습니까?')) {
      resetLocalRecords();
      onDataReset();
    }
  };

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
              <span>운영진 실시간 프리마켓 자리 & 행운 뽑기권 현황</span>
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
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>초기화</span>
            </button>
          </div>
        </div>

        {/* 상단 요약 지표 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="text-slate-500 text-xs flex items-center gap-1 mb-1">
              <Users className="w-3.5 h-3.5 text-teal-600" />
              <span>총 등록 학생 (행)</span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {totalEntries}
              <span className="text-xs font-normal text-slate-500 ml-1">명</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="text-slate-500 text-xs flex items-center gap-1 mb-1">
              <Store className="w-3.5 h-3.5 text-[#0E9F98]" />
              <span>배정된 프리마켓 자리</span>
            </div>
            <div className="text-2xl font-black text-teal-700 font-mono">
              {fleaMarketCount}
              <span className="text-xs font-normal text-slate-500 ml-1">자리</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="text-slate-500 text-xs flex items-center gap-1 mb-1">
              <Ticket className="w-3.5 h-3.5 text-[#FF8C32]" />
              <span>발행된 행운 뽑기권</span>
            </div>
            <div className="text-2xl font-black text-[#FF8C32] font-mono">
              {luckyDrawCount}
              <span className="text-xs font-normal text-slate-500 ml-1">매</span>
            </div>
          </div>
        </div>

        {/* 검색 바 */}
        <div className="mb-3">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="학생 이름, 학년반, 연락처, 자리번호, 행운 뽑기권 번호 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 rounded-lg bg-white border border-slate-300 focus:border-[#0E9F98] focus:outline-none"
            />
          </div>
        </div>

        {/* 신청자 목록 테이블 */}
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100/90 text-slate-700 sticky top-0 border-b border-slate-200 font-bold">
                <tr>
                  <th className="p-2.5 text-center w-12">#</th>
                  <th className="p-2.5 whitespace-nowrap">학생 이름</th>
                  <th className="p-2.5 whitespace-nowrap">학년/반</th>
                  <th className="p-2.5 whitespace-nowrap">연락처</th>
                  <th className="p-2.5 text-center whitespace-nowrap">프리마켓 자리</th>
                  <th className="p-2.5 text-center whitespace-nowrap">행운 뽑기권 번호</th>
                  <th className="p-2.5 whitespace-nowrap">접수시각</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                      신청 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r, index) => (
                    <tr key={r.id || index} className="hover:bg-slate-50 transition-colors">
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
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            r.fleaMarket && r.fleaMarket !== '미신청'
                              ? 'bg-teal-100 text-teal-900 border border-teal-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {r.fleaMarket || r.seatNumber || '미신청'}
                        </span>
                      </td>
                      <td className="p-2.5 text-center whitespace-nowrap">
                        {r.luckyTicket && r.luckyTicket !== '미신청' ? (
                          <span className="font-mono font-bold text-[#FF8C32] bg-orange-50 px-2 py-0.5 rounded text-[11px] border border-orange-200">
                            {r.luckyTicket}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">미발급</span>
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
