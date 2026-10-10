export interface ChildInfo {
  grade: string;
  classNum: string;
  name: string;
}

export type ProgramId = 'making' | 'game' | 'roulette';

export type TimeSlotId = 'slot1' | 'slot2' | 'slot3' | 'slot4';

export interface ProgramSelection {
  programId: ProgramId;
  timeSlotId: TimeSlotId;
  participantName: string;
}

export interface CapacityMap {
  [key: string]: {
    [slot: string]: number;
  };
}

export interface LuckyTicketItem {
  childName: string;
  ticketNumber: string;
}

export interface RegistrationFormData {
  children: ChildInfo[]; // 최대 4명까지 지원
  phone: string;
  fleaMarket: '신청' | '미신청';
  programs: ProgramSelection[]; // 각 자녀별 선택된 프로그램 목록
  luckyDraw: boolean;
  noticeAgreed: boolean;
}

export interface SubmissionRecord {
  id: string;
  timestamp: string;
  studentGradeClass: string;
  studentName: string;
  phone: string;
  fleaMarket: '신청' | '미신청';
  programName: string; // 예: "게임(홍은) / 만들기(홍은) / 게임(홍윤) / 만들기(홍윤)"
  timeSlotLabel: string; // 예: "2타임: 11:00 ~ 12:00 / 1타임: 10:00 ~ 11:00 / 2타임: 11:00 ~ 12:00 / 3타임: 13:00 ~ 14:00"
  luckyTicket: string; // 예: "LKN-1004(홍은) / LKN-1005(홍윤)"
  luckyTicketsList?: LuckyTicketItem[];
  noticeAgreed: string;
}

export interface GasResponse {
  status: 'success' | 'error';
  message: string;
  luckyTicket?: string;
  luckyTicketsList?: LuckyTicketItem[];
  record?: SubmissionRecord;
  currentCounts?: CapacityMap;
}
