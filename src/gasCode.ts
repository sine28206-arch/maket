export const GAS_SPREADSHEET_ID = "1jYXplQcgpHoclNYNDUesJ4YNvNeyF2G4jNR3RXD6syw";

export const GAS_CODE_STRING = `/**
 * ==============================================================================
 * 한마음초 프리마켓 & 행운 뽑기권 구글 시트 연동 스크립트 (Code.gs)
 * 
 * - 구글 시트 ID: 1jYXplQcgpHoclNYNDUesJ4YNvNeyF2G4jNR3RXD6syw
 * - 시트 컬럼 규격:
 *   [A열] 학년/반
 *   [B열] 학생 이름
 *   [C열] 연락처
 *   [D열] 프리마켓 자리신청 (자동 배정: 예: 1번 자리, 2번 자리...)
 *   [E열] 체험 프로그램 (-)
 *   [F열] 배정 순서 (자리 번호: 예: 1번 자리)
 *   [G열] 행운권 번호 (행운 뽑기권: 자녀당 1매씩 각각 순차 발행: 예: LKN-1001, LKN-1002)
 * 
 * * 규칙:
 * 1. 가족당 프리마켓 1자리 원칙 (2자녀 이상 신청 시 동일한 자리 번호 부여)
 * 2. 등록된 자녀 수만큼 구글 시트에 각 자녀당 1행씩(2자녀 등록 시 2줄) 자동 추가!
 * 3. 각 자녀 행마다 해당 아이의 행운 뽑기권 번호와 프리마켓 자리가 자동 기록됩니다.
 * ==============================================================================
 */

const SPREADSHEET_ID = "1jYXplQcgpHoclNYNDUesJ4YNvNeyF2G4jNR3RXD6syw";

function getTargetSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheets()[0];
  if (sheet.getLastRow() === 0) {
    initHeaders(sheet);
  }
  return sheet;
}

function initHeaders(sheet) {
  const headers = [
    "학년/반",
    "학생 이름",
    "연락처",
    "프리마켓 자리신청",
    "체험 프로그램",
    "배정 순서",
    "행운권 번호"
  ];
  sheet.appendRow(headers);
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold")
             .setHorizontalAlignment("center")
             .setVerticalAlignment("middle")
             .setBackground("#E6FFFA");
  sheet.setRowHeight(1, 38);
  sheet.setFrozenRows(1);
}

function doGet(e) {
  try {
    const sheet = getTargetSheet();
    const data = sheet.getDataRange().getValues();
    const records = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0] && !row[1]) continue;
      
      records.push({
        id: "REC-" + i,
        studentGradeClass: row[0] || "",
        studentName: row[1] || "",
        phone: row[2] || "",
        fleaMarket: row[3] || "미신청",
        seatNumber: row[3] || row[5] || "",
        programName: row[4] || "-",
        timeSlotLabel: row[5] || "",
        luckyTicket: row[6] || "미신청",
        noticeAgreed: "동의완료"
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      records: records,
      totalCount: records.length
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  const hasLock = lock.tryLock(15000);
  if (!hasLock) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "접속자가 많아 처리가 지연되었습니다. 잠시 후 다시 시도해 주세요."
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  try {
    let postData;
    if (e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (ex) {
        postData = e.parameter || {};
      }
    } else {
      postData = e.parameter || {};
    }
    
    const sheet = getTargetSheet();
    const data = sheet.getDataRange().getValues();
    
    // 1. 기존 시트에서 최대 자리 번호(D열, F열) 탐색
    let maxSeatNum = 0;
    for (let i = 1; i < data.length; i++) {
      const cellD = String(data[i][3] || "");
      const cellF = String(data[i][5] || "");
      const matchD = cellD.match(/(\\d+)번/);
      const matchF = cellF.match(/(\\d+)번/);
      if (matchD) {
        const numD = parseInt(matchD[1], 10);
        if (!isNaN(numD) && numD > maxSeatNum) maxSeatNum = numD;
      }
      if (matchF) {
        const numF = parseInt(matchF[1], 10);
        if (!isNaN(numF) && numF > maxSeatNum) maxSeatNum = numF;
      }
    }
    
    // 신규 배정 자리 번호 (가족당 1자리)
    const isFleaRequested = postData.fleaMarket !== "미신청";
    const assignedSeat = isFleaRequested ? (maxSeatNum + 1) + "번 자리" : "미신청";
    
    // 2. 기존 시트에서 최대 행운권 번호(G열) 탐색
    let maxLuckyNum = 1000;
    for (let i = 1; i < data.length; i++) {
      const cellG = String(data[i][6] || "");
      const matches = cellG.match(/LKN-(\\d+)/g);
      if (matches) {
        for (let m = 0; m < matches.length; m++) {
          const num = parseInt(matches[m].replace("LKN-", ""), 10);
          if (!isNaN(num) && num > maxLuckyNum) {
            maxLuckyNum = num;
          }
        }
      }
    }
    
    // 3. 자녀 목록 추출
    let childList = [];
    if (Array.isArray(postData.children) && postData.children.length > 0) {
      childList = postData.children.map(function(c) {
        return {
          gradeClass: (c.grade || "") + " " + (c.classNum || ""),
          name: (c.name || "").trim()
        };
      });
    } else if (Array.isArray(postData.childrenList) && postData.childrenList.length > 0) {
      const gradeParts = String(postData.studentGradeClass || "").split('/');
      childList = postData.childrenList.map(function(name, idx) {
        return {
          gradeClass: (gradeParts[idx] || gradeParts[0] || "").trim(),
          name: String(name).trim()
        };
      });
    } else {
      const nameParts = String(postData.studentName || "학생").split('/');
      const gradeParts = String(postData.studentGradeClass || "1학년 1반").split('/');
      childList = nameParts.map(function(name, idx) {
        return {
          gradeClass: (gradeParts[idx] || gradeParts[0] || "").trim(),
          name: String(name).trim()
        };
      });
    }
    
    // 4. 자녀별 1행씩 구글 시트에 추가
    const luckyTicketsList = [];
    let curLucky = maxLuckyNum;
    
    for (let cIdx = 0; cIdx < childList.length; cIdx++) {
      curLucky++;
      const childObj = childList[cIdx];
      const ticketNum = "LKN-" + curLucky;
      
      luckyTicketsList.push({
        childName: childObj.name,
        ticketNumber: ticketNum,
        seatNumber: assignedSeat
      });
      
      const childRow = [
        childObj.gradeClass,              // A열: 학년/반
        childObj.name,                    // B열: 학생 이름
        postData.phone || "",             // C열: 연락처
        assignedSeat,                     // D열: 프리마켓 자리신청 (예: 1번 자리)
        "-",                              // E열: 체험 프로그램 (-)
        assignedSeat,                     // F열: 배정 순서 (예: 1번 자리)
        ticketNum                         // G열: 행운권 번호 (예: LKN-1001)
      ];
      
      sheet.appendRow(childRow);
      
      const lastRow = sheet.getLastRow();
      const rRange = sheet.getRange(lastRow, 1, 1, childRow.length);
      rRange.setHorizontalAlignment("center")
            .setVerticalAlignment("middle");
      sheet.setRowHeight(lastRow, 34);
    }
    
    lock.releaseLock();
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "구글 시트에 " + childList.length + "줄로 아이별 행운 뽑기권과 " + assignedSeat + "가 자동 부여되었습니다!",
      seatNumber: assignedSeat,
      luckyTicketsList: luckyTicketsList
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    lock.releaseLock();
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

export const GOOGLE_APPS_SCRIPT_CODE = GAS_CODE_STRING;
