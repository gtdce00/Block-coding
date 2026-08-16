/**
 * Robot Mission 3D — วางโค้ดนี้ใน Google Apps Script ของชีต
 *
 * 1. เปิด Google Sheet ใหม่
 * 2. Extensions / ส่วนขยาย → Apps Script
 * 3. ลบโค้ดเดิม วางไฟล์นี้ทั้งไฟล์ → Save
 * 4. Deploy → New deployment → Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Authorize แล้วคัดลอก Web app URL (ลงท้ายด้วย /exec)
 * 6. วาง URL ในเกมที่ ตั้งค่า → ลิงก์ Google Sheets แล้วกด SAVE
 *
 * ถ้าแก้โค้ดใน Script ต้อง Deploy → Manage deployments → ดินสอ → New version
 */

const SHEET_NAME = "Leaderboard";
const HEADERS = [
  "เวลาที่บันทึก",
  "ชื่อ",
  "ชั้น/ห้อง",
  "โรงเรียน",
  "คะแนน",
  "สมบัติ",
  "ถูก",
  "ผิด",
  "เวลาเหลือ",
  "วินาทีที่ใช้",
  "โลก",
  "สาเหตุจบ",
  "วันที่ ISO",
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = ensureSheet_();
    const data = parseBody_(e);
    sheet.appendRow([
      new Date(),
      str_(data.name) || "ผู้เล่น",
      str_(data.grade),
      str_(data.school),
      num_(data.score),
      num_(data.treasures),
      num_(data.correct),
      num_(data.wrong),
      str_(data.time) || "00:00",
      num_(data.timeUsed),
      num_(data.world) || 1,
      str_(data.reason),
      str_(data.date),
    ]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput("Robot Mission 3D Sheets OK");
}

function ensureSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, HEADERS.length);
  }
  return sheet;
}

function parseBody_(e) {
  const raw = (e && e.postData && e.postData.contents) || "{}";
  const data = JSON.parse(raw);
  if (!data || typeof data !== "object") throw new Error("invalid json");
  return data;
}

function str_(v) {
  return String(v == null ? "" : v).slice(0, 120);
}

function num_(v) {
  const n = Number(v);
  return isFinite(n) ? n : 0;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
