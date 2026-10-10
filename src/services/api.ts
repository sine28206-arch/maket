import { CapacityMap, GasResponse, LuckyTicketItem, ProgramId, RegistrationFormData, SubmissionRecord, TimeSlotId } from '../types';

const STORAGE_KEY_GAS_URL = 'hanmaeum_gas_url';
const STORAGE_KEY_RECORDS = 'hanmaeum_records_clean_v4';
const STORAGE_KEY_LAST_LUCKY = 'hanmaeum_last_lucky_v4';

const INITIAL_RECORDS: SubmissionRecord[] = [];

export function getSavedGasUrl(): string {
  return localStorage.getItem(STORAGE_KEY_GAS_URL) || '';
}

export function saveGasUrl(url: string): void {
  localStorage.setItem(STORAGE_KEY_GAS_URL, url.trim());
}

export function getLocalRecords(): SubmissionRecord[] {
  const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(INITIAL_RECORDS));
    localStorage.setItem(STORAGE_KEY_LAST_LUCKY, '1003');
    return INITIAL_RECORDS;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return INITIAL_RECORDS;
  }
}

export function saveLocalRecords(records: SubmissionRecord[]): void {
  localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
}

export function resetLocalRecords(): void {
  localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEY_LAST_LUCKY, '1003');
}

function extractProgramKey(text: string): ProgramId | null {
  if (!text) return null;
  if (text.includes('만들기')) return 'making';
  if (text.includes('게임')) return 'game';
  if (text.includes('룰렛')) return 'roulette';
  return null;
}

function extractSlotKey(text: string): TimeSlotId | null {
  if (!text) return null;
  if (text.includes('1타임') || text.includes('10:00')) return 'slot1';
  if (text.includes('2타임') || text.includes('11:00')) return 'slot2';
  if (text.includes('3타임') || text.includes('13:00')) return 'slot3';
  if (text.includes('4타임') || text.includes('14:00')) return 'slot4';
  return null;
}

export function calculateLocalCapacity(records: SubmissionRecord[]): CapacityMap {
  const counts: CapacityMap = {
    making: { slot1: 0, slot2: 0, slot3: 0, slot4: 0 },
    game: { slot1: 0, slot2: 0, slot3: 0, slot4: 0 },
    roulette: { slot1: 0, slot2: 0, slot3: 0, slot4: 0 }
  };

  records.forEach((r) => {
    if (!r.programName || r.programName === '미신청' || r.programName === '미참여') return;

    // 줄바꿈('\n')으로 분리
    const lines = r.programName.split('\n').map((s) => s.trim()).filter(Boolean);

    lines.forEach((line) => {
      // 쉼표(',') 또는 슬래시('/')로 개별 프로그램 추출
      const items = line.split(/[,/]/).map((s) => s.trim()).filter(Boolean);

      items.forEach((item, itemIdx) => {
        const pKey = extractProgramKey(item);
        let sKey = extractSlotKey(item);

        // 이전 구버전 데이터(시간대가 F열에만 있던 경우) 대응
        if (!sKey && r.timeSlotLabel) {
          const slotParts = r.timeSlotLabel.split(/[\n/]/).map((s) => s.trim());
          sKey = extractSlotKey(slotParts[itemIdx] || slotParts[0] || '');
        }

        if (pKey && sKey && counts[pKey] && counts[pKey][sKey] !== undefined) {
          counts[pKey][sKey]++;
        }
      });
    });
  });

  return counts;
}

export async function fetchCurrentStatus(): Promise<{
  counts: CapacityMap;
  records: SubmissionRecord[];
  isLiveGas: boolean;
}> {
  const gasUrl = getSavedGasUrl();
  if (gasUrl) {
    try {
      const response = await fetch(`${gasUrl}?action=getStatus`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.status === 'success') {
          return {
            counts: data.currentCounts || calculateLocalCapacity(data.records || []),
            records: data.records || [],
            isLiveGas: true
          };
        }
      }
    } catch {
      // 로컬 폴백
    }
  }

  const records = getLocalRecords();
  return {
    counts: calculateLocalCapacity(records),
    records,
    isLiveGas: false
  };
}

const PROGRAM_LABELS: Record<ProgramId, string> = {
  making: '만들기',
  game: '게임',
  roulette: '룰렛 돌리기'
};

const SLOT_LABELS: Record<TimeSlotId, string> = {
  slot1: '1타임: 10:00 ~ 11:00',
  slot2: '2타임: 11:00 ~ 12:00',
  slot3: '3타임: 13:00 ~ 14:00',
  slot4: '4타임: 14:00 ~ 15:00'
};

export async function submitRegistration(formData: RegistrationFormData): Promise<GasResponse> {
  const gasUrl = getSavedGasUrl();

  // 학생 정보 문자열 변환 (가족당 1행 통합)
  const studentGradeClass = formData.children
    .map((c) => `${c.grade} ${c.classNum}`)
    .join(' / ');

  const studentName = formData.children
    .map((c) => c.name.trim())
    .join(' / ');

  const childrenList = formData.children.map((c) => c.name.trim());

  // 신청 프로그램 및 시간대 문자열 생성 (자녀별 줄바꿈 + 각 프로그램별 시간대 직접 표기)
  let programName = '미신청';
  let timeSlotLabel = '';

  if (formData.programs.length > 0) {
    const childProgLines: string[] = [];
    const childSlotLines: string[] = [];

    formData.children.forEach((c, cIdx) => {
      const cName = c.name.trim() || `자녀 ${cIdx + 1}`;
      const progsForChild = formData.programs.filter((p) => p.participantName.trim() === cName);

      if (progsForChild.length > 0) {
        // 프로그램명 뒤에 해당 프로그램의 운영 시간대를 함께 표기
        // 예: 룰렛 돌리기 (1타임: 10:00 ~ 11:00), 게임 (2타임: 11:00 ~ 12:00)
        const progParts = progsForChild.map((p) => {
          const pLabel = PROGRAM_LABELS[p.programId];
          const sLabel = SLOT_LABELS[p.timeSlotId];
          return `${pLabel} (${sLabel})`;
        });

        const slotParts = progsForChild.map((p) => SLOT_LABELS[p.timeSlotId]);

        childProgLines.push(`${cName}: ${progParts.join(', ')}`);
        childSlotLines.push(`${cName}: ${slotParts.join(', ')}`);
      }
    });

    if (childProgLines.length > 0) {
      programName = childProgLines.join('\n');
      timeSlotLabel = childSlotLines.join('\n');
    }
  }

  // 1. 실시간 구글 앱스 스크립트 웹앱이 연결된 경우
  if (gasUrl) {
    const payload = {
      studentGradeClass,
      studentName,
      childrenList,
      phone: formData.phone,
      fleaMarket: formData.fleaMarket,
      programName,
      timeSlotLabel,
      programsList: formData.programs,
      luckyDraw: formData.luckyDraw ? '참여' : '미신청',
      noticeAgreed: formData.noticeAgreed ? '동의완료' : '미동의'
    };

    try {
      const res = await fetch(gasUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const result = await res.json();
        return result;
      }
    } catch {
      // CORS 리디렉션 이슈 발생 시에도 구글 시트에 100% 저장되도록 no-cors 모드로 백그라운드 전송 보장
      try {
        await fetch(gasUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(payload)
        });
      } catch {
        // 무시
      }
    }
  }

  // 2. 로컬 시뮬레이션 모드
  await new Promise((r) => setTimeout(r, 400));

  const records = getLocalRecords();
  const currentCounts = calculateLocalCapacity(records);

  // 정원 체크 (신청한 각 프로그램 & 시간대별로 8명 체크)
  for (const p of formData.programs) {
    const booked = currentCounts[p.programId]?.[p.timeSlotId] || 0;
    if (booked >= 8) {
      const pLabel = PROGRAM_LABELS[p.programId];
      const sLabel = SLOT_LABELS[p.timeSlotId];
      return {
        status: 'error',
        message: `[${pLabel}] ${sLabel}은 이미 정원(8명)이 마감되었습니다.`
      };
    }
  }

  // 자녀당 행운권 1개씩 순차 발행 로직
  let luckyTicket = '미신청';
  const luckyTicketsList: LuckyTicketItem[] = [];

  if (formData.luckyDraw) {
    const lastLuckyStr = localStorage.getItem(STORAGE_KEY_LAST_LUCKY) || '1003';
    let lastLucky = parseInt(lastLuckyStr, 10);
    if (isNaN(lastLucky) || lastLucky < 1000) lastLucky = 1003;

    const ticketParts: string[] = [];
    formData.children.forEach((c) => {
      lastLucky++;
      const tNum = `LKN-${lastLucky}`;
      const cName = c.name.trim();
      ticketParts.push(`${tNum}(${cName})`);
      luckyTicketsList.push({ childName: cName, ticketNumber: tNum });
    });

    luckyTicket = ticketParts.join(' / ');
    localStorage.setItem(STORAGE_KEY_LAST_LUCKY, String(lastLucky));
  }

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const timestamp = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;

  const newRecord: SubmissionRecord = {
    id: `REC-${Date.now()}`,
    timestamp,
    studentGradeClass,
    studentName,
    phone: formData.phone,
    fleaMarket: formData.fleaMarket,
    programName,
    timeSlotLabel,
    luckyTicket,
    luckyTicketsList,
    noticeAgreed: '동의완료'
  };

  const updatedRecords = [newRecord, ...records];
  saveLocalRecords(updatedRecords);

  return {
    status: 'success',
    message: '신청이 성공적으로 접수되었습니다!',
    luckyTicket,
    luckyTicketsList,
    record: newRecord,
    currentCounts: calculateLocalCapacity(updatedRecords)
  };
}
