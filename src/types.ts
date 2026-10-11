export interface ChildInfo {
  grade: string;
  classNum: string;
  name: string;
}

export interface LuckyTicketItem {
  childName: string;
  ticketNumber: string;
  seatNumber?: string;
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
  fleaMarket: string; // 예: "1번 자리" or "신청"
  seatNumber?: string; // 예: "1번 자리"
  programName?: string; // "-"
  timeSlotLabel?: string; // "1번 자리"
  luckyTicket: string; // 예: "LKN-1001"
  luckyTicketsList?: LuckyTicketItem[];
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
