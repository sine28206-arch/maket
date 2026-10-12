export interface ChildInfo {
  grade: string;
  classNum: string;
  name: string;
  paperAirplane?: boolean; // 체험신청: 종이비행기 접기 대회 신청 여부
}

export interface LuckyTicketItem {
  childName: string;
  ticketNumber: string;
  seatNumber?: string;
  paperAirplane?: boolean; // 종이비행기 대회 참가 여부
}

export interface RegistrationFormData {
  children: ChildInfo[]; // 최대 4명까지 지원
  phone: string;
  fleaMarket: '신청' | '미신청';
  seatNumber?: string;
  luckyDraw?: boolean;
  noticeAgreed: boolean;
}

export interface SubmissionRecord {
  id: string;
  timestamp: string;
  studentGradeClass: string;
  studentName: string;
  phone: string;
  fleaMarket: string; // 예: "1번 자리" or "미신청"
  seatNumber?: string; // 예: "1번 자리" or "미신청"
  programName?: string; // "✓" or "-" (종이비행기 접기 대회 신청 체크)
  timeSlotLabel?: string; // "1번 자리"
  luckyTicket: string; // 예: "LKN-1001"
  luckyTicketsList?: LuckyTicketItem[];
  paperAirplane?: boolean; // 종이비행기 접기 대회 신청 여부
  noticeAgreed: string;
}

export interface CapacityMap {
  [key: string]: {
    [slot: string]: number;
  };
}

export interface GasResponse {
  status: 'success' | 'error';
  message: string;
  seatNumber?: string;
  luckyTicket?: string;
  luckyTicketsList?: LuckyTicketItem[];
  record?: SubmissionRecord;
  records?: SubmissionRecord[];
  currentCounts?: CapacityMap;
}
