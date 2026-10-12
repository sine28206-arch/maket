import { CapacityMap, GasResponse, LuckyTicketItem, RegistrationFormData, SubmissionRecord } from '../types';

const STORAGE_KEY_GAS_URL = 'hanmaeum_gas_url';
const STORAGE_KEY_RECORDS = 'hanmaeum_records_prod_v1';
const STORAGE_KEY_LAST_LUCKY = 'hanmaeum_last_lucky_prod_v1';
const STORAGE_KEY_LAST_SEAT = 'hanmaeum_last_seat_prod_v1';

const INITIAL_RECORDS: SubmissionRecord[] = [];

// 이전 버전의 잔여 로컬스토리지 키 말끔히 정리 (새로운 1번 자리부터 시작 보장)
function cleanOldStorageKeys(): void {
  const oldKeys = [
    'hanmaeum_records_flea_v1',
    'hanmaeum_records_flea_v2',
    'hanmaeum_records_flea_v3',
    'hanmaeum_records_flea_v4',
    'hanmaeum_records_flea_v5',
    'hanmaeum_records_flea_v6',
    'hanmaeum_records_flea_v7',
    'hanmaeum_last_seat_v5',
    'hanmaeum_last_seat_v6',
    'hanmaeum_last_seat_v7',
    'hanmaeum_last_lucky_v5',
    'hanmaeum_last_lucky_v6',
    'hanmaeum_last_lucky_v7',
    'hanmaeum_records_v1',
    'hanmaeum_records_v2'
  ];
  oldKeys.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  });
}

// 모듈 로드 시 이전 키 정리
cleanOldStorageKeys();

export function getSavedGasUrl(): string {
  return localStorage.getItem(STORAGE_KEY_GAS_URL) || '';
}

export function saveGasUrl(url: string): void {
  localStorage.setItem(STORAGE_KEY_GAS_URL, url.trim());
}

export function clearSavedGasUrl(): void {
  localStorage.removeItem(STORAGE_KEY_GAS_URL);
}

export function getLocalRecords(): SubmissionRecord[] {
  cleanOldStorageKeys();
  const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(INITIAL_RECORDS));
    localStorage.setItem(STORAGE_KEY_LAST_LUCKY, '1000');
    localStorage.setItem(STORAGE_KEY_LAST_SEAT, '0');
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

export async function resetLocalRecords(clearGas: boolean = false): Promise<void> {
  cleanOldStorageKeys();
  localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEY_LAST_LUCKY, '1000');
  localStorage.setItem(STORAGE_KEY_LAST_SEAT, '0');

  if (clearGas) {
    clearSavedGasUrl();
  }

  const gasUrl = getSavedGasUrl();
  if (gasUrl) {
    try {
      // CORS preflight 없이 실행되도록 단순 GET 요청
      await fetch(`${gasUrl}?action=reset&t=${Date.now()}`, {
        method: 'GET'
      });
    } catch {
      // no-cors fallback
      try {
        await fetch(`${gasUrl}?action=reset&t=${Date.now()}`, {
          method: 'GET',
          mode: 'no-cors'
        });
      } catch {
        // ignore
      }
    }
  }
}

export async function fetchCurrentStatus(): Promise<{
  counts: CapacityMap;
  records: SubmissionRecord[];
  isLiveGas: boolean;
}> {
  const gasUrl = getSavedGasUrl();
  if (gasUrl) {
    try {
      // 단순 GET 요청 (헤더를 넣으면 CORS Preflight 에러 발생하므로 헤더 제외)
      const response = await fetch(`${gasUrl}?action=getStatus&t=${Date.now()}`, {
        method: 'GET'
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.status === 'success') {
          return {
            counts: {},
            records: Array.isArray(data.records) ? data.records : [],
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
    counts: {},
    records,
    isLiveGas: false
  };
}

export async function submitRegistration(formData: RegistrationFormData): Promise<GasResponse> {
  const gasUrl = getSavedGasUrl();

  // 1. 프리마켓 자리 번호 결정 (가족당 1자리 배정: 예: 1번 자리, 2번 자리...)
  const records = getLocalRecords();
  let maxSeat = 0;
  records.forEach((r) => {
    const seatMatch = String(r.fleaMarket || r.seatNumber || '').match(/(\d+)번/);
    if (seatMatch) {
      const sNum = parseInt(seatMatch[1], 10);
      if (sNum > maxSeat) maxSeat = sNum;
    }
  });

  const lastSeatStr = localStorage.getItem(STORAGE_KEY_LAST_SEAT) || '0';
  let lastSeat = parseInt(lastSeatStr, 10);
  if (isNaN(lastSeat)) lastSeat = 0;
  if (maxSeat > lastSeat) lastSeat = maxSeat;

  const assignedSeatNumber = formData.fleaMarket === '신청' ? `${lastSeat + 1}번 자리` : '미신청';
  if (formData.fleaMarket === '신청') {
    localStorage.setItem(STORAGE_KEY_LAST_SEAT, String(lastSeat + 1));
  }

  // 2. 자녀별 행운 뽑기권 번호 결정 (1인 1매 각각 순차 배정)
  let maxLucky = 1000;
  records.forEach((r) => {
    const lMatch = String(r.luckyTicket || '').match(/LKN-(\d+)/);
    if (lMatch) {
      const lNum = parseInt(lMatch[1], 10);
      if (lNum > maxLucky) maxLucky = lNum;
    }
  });

  const lastLuckyStr = localStorage.getItem(STORAGE_KEY_LAST_LUCKY) || '1000';
  let lastLucky = parseInt(lastLuckyStr, 10);
  if (isNaN(lastLucky) || lastLucky < 1000) lastLucky = 1000;
  if (maxLucky > lastLucky) lastLucky = maxLucky;

  const luckyTicketsList: LuckyTicketItem[] = [];
  const ticketStrings: string[] = [];

  formData.children.forEach((c) => {
    lastLucky++;
    const tNum = `LKN-${lastLucky}`;
    const cName = c.name.trim();
    const isAirplane = c.paperAirplane ?? true;
    luckyTicketsList.push({
      childName: cName,
      ticketNumber: tNum,
      seatNumber: assignedSeatNumber,
      paperAirplane: isAirplane
    });
    ticketStrings.push(`${tNum}(${cName})`);
  });

  localStorage.setItem(STORAGE_KEY_LAST_LUCKY, String(lastLucky));
  const fullLuckyTicketStr = ticketStrings.join(' / ');

  const studentGradeClass = formData.children
    .map((c) => `${c.grade} ${c.classNum}`)
    .join(' / ');
  const studentName = formData.children
    .map((c) => c.name.trim())
    .join(' / ');
  const childrenList = formData.children.map((c) => c.name.trim());
  const hasAnyAirplane = formData.children.some((c) => c.paperAirplane);

  // 3. 실시간 구글 앱스 스크립트 웹앱이 연결된 경우 백그라운드 비동기 동기화 (UI 블로킹 방지)
  if (gasUrl) {
    const payload = {
      studentGradeClass,
      studentName,
      childrenList,
      children: formData.children,
      phone: formData.phone,
      fleaMarket: assignedSeatNumber,
      seatNumber: assignedSeatNumber,
      programName: hasAnyAirplane ? '✓' : '-',
      paperAirplane: hasAnyAirplane,
      luckyDraw: '참여',
      luckyTicket: fullLuckyTicketStr,
      luckyTicketsList,
      noticeAgreed: formData.noticeAgreed ? '동의완료' : '미동의'
    };

    // 팝업이 즉시 뜨도록 백그라운드로 안전하게 동기화 시도
    try {
      fetch(gasUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      }).catch(() => {
        // CORS 리디렉션 이슈 발생 시 no-cors 모드로 백그라운드 시트 쓰기 보장
        try {
          fetch(gasUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(payload)
          }).catch(() => {});
        } catch {
          // ignore
        }
      });
    } catch {
      // ignore
    }
  }

  // 4. 로컬 및 공통 완료 레코드 생성 (팝업 즉각 0초 호출 보장):
  // 자녀 수만큼 개별 행(Row) 생성하여 기록!
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const timestamp = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;

  const newChildRows: SubmissionRecord[] = formData.children.map((c, idx) => {
    const item = luckyTicketsList[idx];
    const isAirplane = c.paperAirplane ?? true;
    return {
      id: `REC-${Date.now()}-${idx}`,
      timestamp,
      studentGradeClass: `${c.grade} ${c.classNum}`,
      studentName: c.name.trim(),
      phone: formData.phone,
      fleaMarket: assignedSeatNumber,
      seatNumber: assignedSeatNumber,
      programName: isAirplane ? '✓' : '-',
      paperAirplane: isAirplane,
      timeSlotLabel: assignedSeatNumber,
      luckyTicket: item ? item.ticketNumber : `LKN-${lastLucky}`,
      luckyTicketsList: [item],
      noticeAgreed: '동의완료'
    };
  });

  const updatedRecords = [...newChildRows, ...records];
  saveLocalRecords(updatedRecords);

  // 통합 대표 레코드 (팝업 노출용: 모든 자녀 명단 및 모든 행운권 포함)
  const summaryRecord: SubmissionRecord = {
    id: `REC-${Date.now()}-summary`,
    timestamp,
    studentGradeClass,
    studentName,
    phone: formData.phone,
    fleaMarket: assignedSeatNumber,
    seatNumber: assignedSeatNumber,
    programName: hasAnyAirplane ? '✓' : '-',
    paperAirplane: hasAnyAirplane,
    timeSlotLabel: assignedSeatNumber,
    luckyTicket: fullLuckyTicketStr,
    luckyTicketsList,
    noticeAgreed: '동의완료'
  };

  return {
    status: 'success',
    message: `신청이 완료되었습니다! 프리마켓 [${assignedSeatNumber}] 및 자녀 ${formData.children.length}명에게 각각 행운 뽑기권이 부여되었습니다.`,
    seatNumber: assignedSeatNumber,
    luckyTicket: fullLuckyTicketStr,
    luckyTicketsList,
    record: summaryRecord,
    records: updatedRecords
  };
}
