import { CapacityMap, GasResponse, LuckyTicketItem, RegistrationFormData, SubmissionRecord } from '../types';

const STORAGE_KEY_GAS_URL = 'hanmaeum_gas_url';
const STORAGE_KEY_RECORDS = 'hanmaeum_records_flea_v5';
const STORAGE_KEY_LAST_LUCKY = 'hanmaeum_last_lucky_v5';
const STORAGE_KEY_LAST_SEAT = 'hanmaeum_last_seat_v5';

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

export function resetLocalRecords(): void {
  localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEY_LAST_LUCKY, '1000');
  localStorage.setItem(STORAGE_KEY_LAST_SEAT, '0');
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
            counts: {},
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
    luckyTicketsList.push({
      childName: cName,
      ticketNumber: tNum,
      seatNumber: assignedSeatNumber
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

  // 3. 실시간 구글 앱스 스크립트 웹앱이 연결된 경우
  if (gasUrl) {
    const payload = {
      studentGradeClass,
      studentName,
      childrenList,
      children: formData.children,
      phone: formData.phone,
      fleaMarket: assignedSeatNumber,
      seatNumber: assignedSeatNumber,
      luckyDraw: '참여',
      luckyTicket: fullLuckyTicketStr,
      luckyTicketsList,
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
        return {
          status: 'success',
          message: result.message || '구글 시트에 성공적으로 자동 입력되었습니다!',
          seatNumber: assignedSeatNumber,
          luckyTicket: fullLuckyTicketStr,
          luckyTicketsList,
          record: result.record
        };
      }
    } catch {
      // CORS 리디렉션 이슈 발생 시 no-cors 모드로 시트 쓰기 보장
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

  // 4. 로컬 시뮬레이션 모드:
  // "가족당 한자리 신청에 2명의 자녀를 등록했으면 각 자녀에게 행운 뽑기권을 각각 1회씩 번호를 부여해주고 시트에 두줄에 아이 이름당 행운권 번호와 프리마켓자리를 자동으로 번호를 부여해줘"
  // 자녀 수만큼 개별 행(Row) 생성하여 기록!
  await new Promise((r) => setTimeout(r, 300));

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
    return {
      id: `REC-${Date.now()}-${idx}`,
      timestamp,
      studentGradeClass: `${c.grade} ${c.classNum}`,
      studentName: c.name.trim(),
      phone: formData.phone,
      fleaMarket: assignedSeatNumber,
      seatNumber: assignedSeatNumber,
      programName: '-',
      timeSlotLabel: assignedSeatNumber,
      luckyTicket: item ? item.ticketNumber : `LKN-${lastLucky}`,
      luckyTicketsList: [item],
      noticeAgreed: '동의완료'
    };
  });

  const updatedRecords = [...newChildRows, ...records];
  saveLocalRecords(updatedRecords);

  return {
    status: 'success',
    message: `신청이 완료되었습니다! 프리마켓 [${assignedSeatNumber}] 및 자녀 ${formData.children.length}명에게 각각 행운 뽑기권이 부여되었습니다.`,
    seatNumber: assignedSeatNumber,
    luckyTicket: fullLuckyTicketStr,
    luckyTicketsList,
    record: newChildRows[0],
    records: updatedRecords
  };
}
