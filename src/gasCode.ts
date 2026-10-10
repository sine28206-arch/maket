export const GAS_SPREADSHEET_ID = "1jYXplQcgpHoclNYNDUesJ4YNvNeyF2G4jNR3RXD6syw";

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ==============================================================================
 * 한마음초 프리마켓 & 체험 행사 구글 시트 연동 스크립트 (Code.gs)
 * 
 * - 구글 시트 ID: 1jYXplQcgpHoclNYNDUesJ4YNvNeyF2G4jNR3RXD6syw
 * - 시트 컬럼 규격:
 *   [A열] 학년/반
 *   [B열] 학생 이름
 *   [C열] 연락처
 *   [D열] 프리마켓 자리신청
 *   [E열] 체험 프로그램 (자녀별 프로그램 통합)
 *   [F열] 배정 순서 (신청 시간대)
 *   [G열] 행운권 번호 (자녀당 1개씩 순차 발행: 예: LKN-1004(홍은) / LKN-1005(홍윤))
 * ==============================================================================
 */

const SPREADSHEET_ID = "1jYXplQcgpHoclNYNDUesJ4YNvNeyF2G4jNR3RXD6syw";
const MAX_CAPACITY_PER_SLOT = 8; // 타임별 최대 정원 8명

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
             .setVerticalAlignment("middle");
  sheet.setRowHeight(1, 36);
  sheet.setFrozenRows(1);
}

function doGet(e) {
  try {
    const sheet = getTargetSheet();
    const data = sheet.getDataRange().getValues();
    
    const counts = {
      making: { slot1: 0, slot2: 0, slot3: 0, slot4: 0 },
      game: { slot1: 0, slot2: 0, slot3: 0, slot4: 0 },
      roulette: { slot1: 0, slot2: 0, slot3: 0, slot4: 0 }
    };
    
    const records = [];
    let lastLuckyNumber = 1000;
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0] && !row[1]) continue;
      
      const studentGradeClass = row[0] || "";  // A열
      const studentName = row[1] || "";        // B열
      const phone = row[2] || "";              // C열
      const fleaMarket = row[3] || "미신청";     // D열
      const programName = row[4] || "미신청";    // E열
      const timeSlotLabel = row[5] || "";      // F열
      const luckyTicket = row[6] || "미신청";    // G열
      
      if (luckyTicket && String(luckyTicket) !== "미신청") {
        const matches = String(luckyTicket).match(/LKN-(\d+)/g);
        if (matches) {
          for (let m = 0; m < matches.length; m++) {
            const numPart = parseInt(matches[m].replace("LKN-", ""), 10);
            if (!isNaN(numPart) && numPart > lastLuckyNumber) {
              lastLuckyNumber = numPart;
            }
          }
        }
      }
      
      // 복수 프로그램 분리 집계 ('\n' 줄바꿈 및 ',' '/' 구분자 완벽 처리)
      if (programName && programName !== "미신청" && programName !== "미참여") {
        const lines = String(programName).split('\n');
        for (let lIdx = 0; lIdx < lines.length; lIdx++) {
          const line = lines[lIdx].trim();
          if (!line) continue;
          const progItems = line.split(/[,/]/);
          for (let pIdx = 0; pIdx < progItems.length; pIdx++) {
            const item = progItems[pIdx].trim();
            if (!item) continue;
            const pKey = mapProgramNameToKey(item);
            let sKey = mapSlotLabelToKey(item);

            // 이전 구버전 데이터(시간대가 F열에만 있던 경우) 호환
            if (!sKey && timeSlotLabel) {
              const slotParts = String(timeSlotLabel).split(/[\n/]/);
              sKey = mapSlotLabelToKey(slotParts[pIdx] || slotParts[0] || '');
            }

            if (pKey && sKey && counts[pKey] && counts[pKey][sKey] !== undefined) {
              counts[pKey][sKey]++;
            }
          }
        }
      }
      
      records.push({
        id: "REC-" + i,
        studentGradeClass: studentGradeClass,
        studentName: studentName,
        phone: String(phone),
        fleaMarket: fleaMarket,
        programName: programName,
        timeSlotLabel: timeSlotLabel,
        luckyTicket: luckyTicket
      });
    }
    
    const responsePayload = {
      status: "success",
      totalCount: records.length,
      currentCounts: counts,
      maxCapacity: MAX_CAPACITY_PER_SLOT,
      lastLuckyNumber: lastLuckyNumber,
      records: records
    };
    
    return ContentService.createTextOutput(JSON.stringify(responsePayload))
      .setMimeType(ContentService.MimeType.JSON);
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
    const programName = postData.programName || "미신청";
    const timeSlotLabel = postData.timeSlotLabel || "";
    
    // [정원 검증 로직]
    var requestedItems = [];
    if (Array.isArray(postData.programsList) && postData.programsList.length > 0) {
      for (var k = 0; k < postData.programsList.length; k++) {
        var pi = postData.programsList[k];
        if (pi.programId && pi.programId !== 'none' && pi.timeSlotId) {
          requestedItems.push({
            pKey: pi.programId,
            sKey: pi.timeSlotId,
            label: (mapProgramNameToKey(pi.programId) || pi.programId)
          });
        }
      }
    } else if (programName !== "미신청" && programName !== "미참여") {
      var lines = String(programName).split('\n');
      for (var lIdx = 0; lIdx < lines.length; lIdx++) {
        var progItems = lines[lIdx].split(/[,/]/);
        for (var pIdx = 0; pIdx < progItems.length; pIdx++) {
          var item = progItems[pIdx].trim();
          var pKey = mapProgramNameToKey(item);
          var sKey = mapSlotLabelToKey(item);
          if (!sKey && timeSlotLabel) {
            var slotParts = String(timeSlotLabel).split(/[\n/]/);
            sKey = mapSlotLabelToKey(slotParts[pIdx] || slotParts[0] || '');
          }
          if (pKey && sKey) {
            requestedItems.push({ pKey: pKey, sKey: sKey, label: item });
          }
        }
      }
    }

    if (requestedItems.length > 0) {
      for (var rIdx = 0; rIdx < requestedItems.length; rIdx++) {
        var reqPKey = requestedItems[rIdx].pKey;
        var reqSKey = requestedItems[rIdx].sKey;
        var currentBooked = 0;

        for (var rowIdx = 1; rowIdx < data.length; rowIdx++) {
          var exP = String(data[rowIdx][4] || '');
          var exS = String(data[rowIdx][5] || '');
          var exLines = exP.split('\n');

          for (var elIdx = 0; elIdx < exLines.length; elIdx++) {
            var exItems = exLines[elIdx].split(/[,/]/);
            for (var epIdx = 0; epIdx < exItems.length; epIdx++) {
              var exItem = exItems[epIdx].trim();
              var curPKey = mapProgramNameToKey(exItem);
              var curSKey = mapSlotLabelToKey(exItem);
              if (!curSKey && exS) {
                var exSlots = exS.split(/[\n/]/);
                curSKey = mapSlotLabelToKey(exSlots[epIdx] || exSlots[0] || '');
              }
              if (curPKey === reqPKey && curSKey === reqSKey) {
                currentBooked++;
              }
            }
          }
        }

        if (currentBooked >= MAX_CAPACITY_PER_SLOT) {
          lock.releaseLock();
          return ContentService.createTextOutput(JSON.stringify({
            status: "error",
            message: "[" + requestedItems[rIdx].label + "] 은 이미 정원(8명)이 마감되었습니다."
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }
    
    // 자녀당 행운권 1개씩 순차 발행 (예: LKN-1004(홍은) / LKN-1005(홍윤))
    let luckyTicket = "미신청";
    let luckyTicketsList = [];
    
    if (postData.luckyDraw === true || postData.luckyDraw === "true" || postData.luckyDraw === "참여") {
      let maxNum = 1000;
      for (let i = 1; i < data.length; i++) {
        const cellVal = String(data[i][6] || "");
        const matches = cellVal.match(/LKN-(\d+)/g);
        if (matches) {
          for (let m = 0; m < matches.length; m++) {
            const num = parseInt(matches[m].replace("LKN-", ""), 10);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        }
      }
      
      let childNames = [];
      if (Array.isArray(postData.childrenList) && postData.childrenList.length > 0) {
        childNames = postData.childrenList;
      } else if (postData.studentName) {
        childNames = String(postData.studentName).split('/').map(function(s) { return s.trim(); });
      } else {
        childNames = ["학생1"];
      }
      
      const ticketStrings = [];
      let currentNum = maxNum;
      for (let cIdx = 0; cIdx < childNames.length; cIdx++) {
        currentNum++;
        const tNum = "LKN-" + currentNum;
        const cName = childNames[cIdx];
        ticketStrings.push(tNum + "(" + cName + ")");
        luckyTicketsList.push({ childName: cName, ticketNumber: tNum });
      }
      luckyTicket = ticketStrings.join(" / ");
    }
    
    const newRow = [
      postData.studentGradeClass || "",
      postData.studentName || "",
      postData.phone || "",
      postData.fleaMarket || "미신청",
      programName,
      timeSlotLabel,
      luckyTicket
    ];
    
    sheet.appendRow(newRow);
    const lastRowIndex = sheet.getLastRow();
    const rowRange = sheet.getRange(lastRowIndex, 1, 1, newRow.length);
    rowRange.setHorizontalAlignment("center")
            .setVerticalAlignment("middle")
            .setWrap(true);

    const lineCount = Math.max(1, String(programName).split('\n').length);
    sheet.setRowHeight(lastRowIndex, Math.max(34, lineCount * 22));
    
    lock.releaseLock();
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "구글 시트에 성공적으로 자동 입력되었습니다!",
      luckyTicket: luckyTicket,
      luckyTicketsList: luckyTicketsList,
      rowIndex: lastRowIndex
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    lock.releaseLock();
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "시트 저장 오류: " + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function mapProgramNameToKey(name) {
  if (!name) return null;
  const str = String(name);
  if (str.indexOf("만들기") !== -1) return "making";
  if (str.indexOf("게임") !== -1) return "game";
  if (str.indexOf("룰렛") !== -1) return "roulette";
  return null;
}

function mapSlotLabelToKey(label) {
  if (!label) return null;
  const str = String(label);
  if (str.indexOf("1타임") !== -1 || str.indexOf("10:00") !== -1) return "slot1";
  if (str.indexOf("2타임") !== -1 || str.indexOf("11:00") !== -1) return "slot2";
  if (str.indexOf("3타임") !== -1 || str.indexOf("13:00") !== -1) return "slot3";
  if (str.indexOf("4타임") !== -1 || str.indexOf("14:00") !== -1) return "slot4";
  return null;
}
`;
