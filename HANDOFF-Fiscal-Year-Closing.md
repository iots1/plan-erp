# HANDOFF — ปิดปีบัญชี + ยอดยกมา (Fiscal Year Closing / Carried-Forward Balances)

แผนนี้เป็น backlog **D2** ที่ตัดออกจากรอบ chart-of-accounts (ดู
`HANDOFF-Configurable-Chart-Of-Accounts.md` §9/§11) — เขียนก่อน implement ตามกฎเดียวกัน
(`.claude/rules` "Definition of Done", root `CLAUDE.md` "ก่อน implement ต้องมีแผน")

## 0 · สรุปสั้น

ระบบอ้างอิงที่เทียบไว้ตอนทำ chart-of-accounts มี `balances[]` — ยอดยกมา/ยอดสะสมต่อบัญชีต่อปีบัญชี
ที่ erp-api **ยังไม่มีเลย**: `TrialBalancesService` วันนี้เป็น `SUM(debit)/SUM(credit)` สดจาก
`ledger_entries` ทุกครั้งที่เรียก ไม่มีแนวคิด "ปีบัญชี" ไม่มีการ "ปิดปี" ที่ล้างยอด
REVENUE/EXPENSE เข้า equity แบบบัญชีคู่มาตรฐาน และไม่มีตาราง snapshot ที่ freeze ตัวเลขปีที่ปิดแล้วไว้

งานนี้เพิ่ม: (1) แนวคิดปีบัญชีที่ตั้งเดือนเริ่มต้นได้ต่อ deployment, (2) action ปิดปีบัญชีแยกจากปิดงวด
รายเดือนที่มีอยู่แล้ว ที่ post closing entries จริงล้าง REVENUE/EXPENSE เข้า Retained Earnings ผ่าน
`GlAccountRole` ตัวใหม่ (เดินตามกลไก resolve-by-role เดิมของ chart-of-accounts ทุกจุด ไม่ hard-code
account code), (3) ตาราง snapshot ยอดยกมาต่อบัญชีต่อปี ที่ freeze ถาวรหลังปิด

## 1 · สถานะโค้ดจริงวันนี้ (ตรวจแล้ว 2026-09-06)

- **`ledger_frozen_upto`** (`finance_settings`, แถวเดียว) เป็นแค่ "ห้ามโพสต์/แก้ก่อนวันนี้" — ไม่ผูกกับ
  เดือน/ปีในเชิงโครงสร้างเลย เป็น **one-way ratchet จริง** (`applyPeriodLock()` throw ถ้า
  `upto <= ledger_frozen_upto` เดิม) วันนี้ใช้ระดับ**เดือน**ตามรอบยื่น ภ.พ.30
- **ไม่มีแนวคิด "ปีบัญชี" ที่ไหนเลย** ในทั้ง repo — grep `fiscal_year`/`FiscalYear`/`ปีบัญชี` ไม่เจอ
  มีแค่ `businessYearOf()`/`todayBusinessYear()` (`libs/common/src/utils/business-date.util.ts`) ซึ่ง
  คือ**ปีปฏิทิน Asia/Bangkok** ใช้แค่เลือกแถว counter ของเลขที่เอกสาร ไม่เกี่ยวกับบัญชี
- **`POST /finance-settings/close-period` (`closePeriodWithRevaluation()`)** ทำแค่ FX revaluation
  (กลับ run เก่า → ตีราคาใหม่ AR/AP ต่างสกุลที่ยังเปิด → post unrealised FX → เลื่อน `ledger_frozen_upto`)
  **ไม่รู้จัก balance-sheet vs P&L เลย ไม่มีการล้างยอด revenue/expense ใดๆ** — คนละปัญหากับงานนี้
  แค่ใช้ field ล็อกร่วมกัน
- **`TrialBalancesService`** เป็น `SUM(debit)/SUM(credit)` สดจากต้นบัญชี ไม่มี "ยอดยกมา" ผูกไว้เลย —
  `ledger_entries` เป็น append-only จริง (ยกเลิก = post กลับรายการ ไม่ลบ/แก้)
- **`GlAccountType`/`NormalBalance`** พร้อมสำหรับงานนี้แล้ว: `ASSET/LIABILITY/EQUITY` = งบดุล,
  `REVENUE/EXPENSE` = งบกำไรขาดทุน (คอมเมนต์ของ enum เขียนไว้ตรงๆ) `normal_balance` เป็นคอลัมน์แยก
  ไม่ derive จาก `account_type` (กัน contra account)
- **`GlAccountRole` (14 ค่า) ไม่มี Retained Earnings** — grep ทั้งไฟล์แล้วไม่มี แต่ **บัญชีมีอยู่แล้วใน
  seed**: `3200-00 กำไรสะสม / Retained Earnings` (EQUITY, CREDIT-normal, `account_role: null`,
  `is_locked: false`) และ `3300-00 กำไร(ขาดทุน)สุทธิ / Net Profit (Loss)` (เหมือนกัน) — ยังไม่มี
  posting rule ไหนแตะทั้งคู่เลย
- **report-bc ไม่เคยวางแผน balance_sheet/profit_and_loss read model** — grep ทั้ง `srs-p6.html`/HANDOFF
  ทุกไฟล์ไม่เจอ มีแค่ 4 read model เดิม (`profit_by_lots`/`expiry_alerts`/`low_stocks`/`sales_summaries`)
- **`stock_frozen_upto` (inventory-bc) ไม่ใช่ pattern เดียวกัน** — เป็น field ธรรมดาใน `PUT
  /stock-settings` ไม่มี ratchet guard (reopen ได้) ไม่มี process "ปิด" แนบมาด้วย ไม่มีอะไรให้ก็อป
- **ไม่มี endpoint สร้าง manual journal entry ทั่วไป** — `GeneralLedgerService.post()` ถูกเรียกจาก
  5 posting service ภายในเท่านั้น ไม่มีทางให้ผู้ใช้โพสต์เองตรงๆ (มีผลต่อ §3.2.1 ด้านล่าง)

## 2 · ขอบเขต

**ทำ**: ตั้งเดือนเริ่มต้นปีบัญชีต่อ deployment · action ปิดปีบัญชีแยกจากปิดงวดเดือน · post closing
entries จริงล้าง REVENUE/EXPENSE เข้า Retained Earnings ผ่าน role ใหม่ · ตาราง snapshot ยอดยกมา
ต่อบัญชีต่อปี (freeze ถาวร) · endpoint อ่านยอดยกมา (`balances[]`-style) · permission 2 ตัวใหม่

**ไม่ทำ** (นอกขอบเขต ดู §9): งบการเงิน (งบดุล/งบกำไรขาดทุนที่จัดกลุ่ม+พิมพ์) = **D3** · โอนกำไรสุทธิ
เข้ากำไรสะสมแบบ 2 ขั้น (ผ่านมติที่ประชุมผู้ถือหุ้น, ใช้ `3300-00` เป็นบัญชีพัก) · reopen ปีบัญชีที่ปิดแล้ว ·
Admin UI เต็มรูป (ทำแค่ปุ่ม/หน้าเรียบง่ายที่สุด ดู §4)

## 3 · ดีไซน์ backend

### 3.1 ปีบัญชีตั้งค่าได้ต่อ deployment

`finance_settings` เพิ่ม `fiscal_year_start_month: int` (1-12, default `1` = ปีปฏิทิน — ตรงกับ
พฤติกรรมโดยนัยที่ระบบมีอยู่แล้ว ไม่ breaking) แก้ผ่าน `PUT /finance-settings` เดิม (ฟิลด์เพิ่ม ไม่ต้อง
endpoint ใหม่) หน้า System Settings (`apps/iam`) เพิ่ม dropdown เดือนได้ในฟอร์มเดิม

ยูทิลิตี้ใหม่ `libs/common/src/utils/fiscal-year.util.ts` (เหตุผลที่อยู่ `@lib/common` ไม่ใช่แค่
finance-bc: เป็นแนวคิดบัญชีทั่วไปที่ report-bc/future ต้องใช้ตรงกันแน่ๆ ตอน D3):

```ts
resolveFiscalYear(date: Date, startMonth: number): { fiscal_year: number; start: Date; end: Date }
```

`fiscal_year` ตั้งชื่อด้วย**ปีที่ปีบัญชีเริ่ม** (ตรงกับ `businessYearOf()` งบเอกสารที่ใช้ปีเริ่มอยู่แล้ว
ไม่ใช้ปีที่จบ กันสับสนกับปีปฏิทิน) เช่น `start_month=4` → ปีบัญชี "2026" = 1 เม.ย. 2026 – 31 มี.ค. 2027

### 3.2 `GlAccountRole.RetainedEarnings` — role ใหม่ตัวที่ 15

เพิ่ม `RETAINED_EARNINGS` ใน enum (`ROLE_REQUIRED_ACCOUNT_TYPE[RetainedEarnings] = EQUITY`) ผูกกับ
`3200-00 กำไรสะสม` ที่ seed ไว้แล้วผ่าน migration DML (`UPDATE gl_accounts SET account_role =
'RETAINED_EARNINGS' WHERE code = '3200-00'`) — ย้ายทีหลังได้ผ่าน `PATCH /gl-accounts/:id/role` เดิม
เหมือน 14 role แรก ไม่ต้องเขียนกลไกใหม่

**`3300-00 กำไร(ขาดทุน)สุทธิ` ไม่ได้ role ในรอบนี้** — งานนี้ปิดปีบัญชีแบบ **direct method**: ล้าง
REVENUE/EXPENSE ตรงเข้า Retained Earnings เลย ไม่ผ่านบัญชีพักกำไรสุทธิ (two-step ผ่านมติที่ประชุม
ผู้ถือหุ้นเป็นขั้นตอนที่ต้องมี manual journal entry endpoint ก่อน ซึ่งไม่มีอยู่เลยวันนี้ — ดู §9) ลูกค้าที่
ต้องการ 2 ขั้นตอนยังใช้ `3300-00` เป็นบัญชี equity ธรรมดาได้เองถ้าจะมี manual entry ในอนาคต

### 3.3 `FiscalYearClose` (header) + `GlAccountYearEndBalance` (snapshot ต่อบัญชี)

โมดูลใหม่ `apps/finance-bc/src/modules/fiscal-year-close/` — คัดลอกโครง `fx-revaluation/` เป๊ะ (เหตุผล
เดียวกัน: ต้องใช้ทั้ง `GeneralLedgerService` และ `GlAccountsService` ซึ่งอยู่คนละ module จาก
`general-ledger` เอง import กลับไม่ได้ ต้องเป็น module แยกที่ inject ทั้งสองเข้ามา — กฎ
module-boundaries.md ข้อ 2)

```
FISCAL_YEAR_CLOSES {
    uuid id PK
    int fiscal_year UK "unique — ปิดซ้ำปีเดิมไม่ได้"
    timestamptz fiscal_year_start
    timestamptz fiscal_year_end
    decimal net_profit_or_loss "residual ที่ post เข้า Retained Earnings — บวก=กำไร, ลบ=ขาดทุน"
    timestamptz closed_at
    uuid closed_by
}
GL_ACCOUNT_YEAR_END_BALANCES {
    uuid id PK
    uuid fiscal_year_close_id FK
    uuid gl_account_id FK "ON DELETE RESTRICT — เหมือน ledger_entries.account_id"
    int fiscal_year "denormalized จาก header เพื่อ query ตรงไม่ต้อง join เสมอ"
    decimal opening_balance "งบดุล = closing ปีก่อน · งบกำไรขาดทุน = 0 เสมอ (นิยาม)"
    decimal period_activity "SUM(debit)-SUM(credit) เฉพาะรายการในปีนี้ (ตามฝั่ง normal_balance)"
    decimal closing_balance "opening+activity · งบดุล = ยอดยกไปปีหน้า · งบกำไรขาดทุน = ยอดทั้งปี (ข้อมูลเชิงประวัติ ไม่ได้ยกไปไหน เพราะถูกล้างเป็น 0 จริงด้วย closing entry)"
    enum account_type "snapshot ตอนปิด กันบัญชีย้ายหมวดทีหลังแล้วตีความยอดเก่าใหม่"
    enum normal_balance "snapshot เหตุผลเดียวกัน"
}
@Unique(gl_account_id, fiscal_year) -- ปิดปีเดิมซ้ำไม่ได้ต่อบัญชี (เช็คคู่กับ fiscal_year_closes.fiscal_year UK)
FISCAL_YEAR_CLOSES ||--o{ GL_ACCOUNT_YEAR_END_BALANCES : produces
GL_ACCOUNTS ||--o{ GL_ACCOUNT_YEAR_END_BALANCES : "snapshotted in"
```

ทั้งสองตาราง**ไม่มี `update()` เปิดผ่าน API เลย** — สร้างได้ทางเดียวคือผ่าน `closeFiscalYear()`
(ตรงกับปรัชญา "ปิดแล้วห้ามขยับ" ที่ `ledger_frozen_upto` ใช้อยู่แล้ว) `is_deleted`/soft-delete ก็ไม่มี
เหตุผลจะมี — เป็น statutory record ที่ไม่ควรลบได้เลยแม้จะ soft

### 3.4 `FiscalYearClosingService.closeFiscalYear(fiscal_year, currentUser)`

ทำในทรานแซคชันเดียว (mirror `closePeriodWithRevaluation()`):

1. **Guard ลำดับ**: `fiscal_year` ต้องไม่เคยปิดมาก่อน (`fiscal_year_closes.fiscal_year` unique) และ
   ต้องเป็นปีถัดจากปีล่าสุดที่ปิด (ปิดข้ามปีไม่ได้ — ปิดปี 2027 ก่อนปี 2026 จะทำให้ opening ของ 2027
   หาปีก่อนหน้าไม่เจอ)
2. **Guard เดือน**: `finance_settings.ledger_frozen_upto` ต้อง **≥ fiscal_year_end** อยู่แล้ว — ปิด
   ปีบัญชีได้ก็ต่อเมื่อทุกเดือนในปีนั้นถูกปิดงวดรายเดือน (`close-period`) มาแล้วครบ ไม่งั้น 400 บอกเดือน
   ล่าสุดที่ยังไม่ปิด (กันปิดปีก่อนงบเดือนสุดท้ายนิ่ง)
3. โหลดทุก **leaf** account (`is_group = false`, ยกเว้น locked ก็รวมด้วย — locked ป้องกันแค่แก้/ลบ
   ไม่เกี่ยวกับการโพสต์)
4. ต่อบัญชี: หา `opening_balance` (ASSET/LIABILITY/EQUITY = closing ของปีก่อนจาก
   `gl_account_year_end_balances`, ถ้าเป็นปีแรกที่ปิดในระบบ = `SUM` ทั้งหมดของ `ledger_entries`
   ก่อน `fiscal_year_start` ครั้งเดียว, REVENUE/EXPENSE = `0` เสมอ) และ `period_activity` =
   `SUM(debit)-SUM(credit)` ของ `ledger_entries` ที่ `entry_date` อยู่ในช่วงปีนี้ ปรับเครื่องหมายตาม
   `normal_balance` แล้วคำนวณ `closing_balance` → insert 1 แถว `gl_account_year_end_balances`
5. รวม `period_activity` ของทุกบัญชี REVENUE (ลบ) และ EXPENSE (บวก) → `net_profit_or_loss`
   (residual-based เหมือน `resolveRealisedFxDifference` เพื่อให้ balance ถึงสตางค์โดยไม่ขึ้นกับ
   การปัดเศษต่อบัญชี)
6. Post **1 closing journal** ผ่าน `GeneralLedgerService.post()`: 1 บรรทัดต่อบัญชี
   REVENUE/EXPENSE ที่ `period_activity ≠ 0` (ปรับให้ยอดเป็นศูนย์) + 1 บรรทัดสุดท้ายที่ role
   `RetainedEarnings` รับ residual — `ref_doc_type = 'FISCAL_YEAR_CLOSE'`, `ref_doc_id =
   fiscal_year_closes.id` (เหตุผลเดียวกับ FX revaluation: กัน `reverse()` ทีหลังไปกวาดโดนของเอกสาร
   อื่นที่ใช้ ref_doc_id เดียวกันโดยบังเอิญ)
7. Insert `fiscal_year_closes` header (`net_profit_or_loss` ที่คำนวณได้)

**ตั้งใจไม่มี "reverse ปีบัญชี"** — ต่างจาก `postCancel()` ของ payment/FX ที่ reverse ได้ เพราะ
`ledger_frozen_upto` บังคับให้ทุกเดือนในปีนั้นปิดสนิทแล้วก่อนจะปิดปีได้ (ขั้น 2) การแก้หลังปิดปีคือ
adjusting entry ที่ปีถัดไป (เปิดอยู่) ไม่ใช่เปิดปีเก่ากลับมา — ตรงกับกฎ "a closed period must not move
after the fact" ที่ระบบยึดอยู่แล้วทุกจุด

### 3.5 API

| Method | Path | Permission |
|---|---|---|
| `POST` | `/fiscal-year-closes` (body `{ fiscal_year }`) | `fiscal_year_close:create` |
| `GET` | `/fiscal-year-closes` | `fiscal_year_close:view` |
| `GET` | `/fiscal-year-closes/:id` | `fiscal_year_close:view` |
| `GET` | `/gl-account-year-end-balances` (filter `fiscal_year`/`gl_account_id`) | `gl_account_year_end_balance:view` |

`gl-account-year-end-balances` เป็น read-only ล้วน (`BaseServiceOperations`/`BaseControllerOperations`
ไม่มี create/update/delete เหมือน `LedgerEntriesController`) — นี่คือ endpoint ที่ตอบโจทย์
"ยอดยกมา/`balances[]`" ที่เทียบกับระบบอ้างอิงไว้ตอนแรก

## 4 · Admin UI (ทำเวอร์ชันเรียบง่ายสุด ตาม pattern D1)

หน้าเดียวใน `apps/iam` (`views/pages/fiscal-year-closes/index.ejs`): ตาราง `fiscal_year_closes`
ที่ปิดไปแล้ว (ปี, net_profit_or_loss, วันที่ปิด) + ปุ่ม "ปิดปีบัญชี" เปิด dialog ยืนยัน (แสดงปีที่จะปิด,
เตือนว่าย้อนกลับไม่ได้) แถวละบัญชีดูได้ผ่าน "ดูรายละเอียด" → ไปหน้า `gl-account-year-end-balances`
กรองตาม `fiscal_year_close_id` เดียวกัน (ตาราง reuse component เดิมทั้งหมด ไม่ต้องเขียน UI ใหม่มาก)
permission ui-plane: `page:view_fiscal_year_closes`, `component:close_fiscal_year`

## 5 · ผลกระทบต่อไฟล์ (checklist ตอน implement)

**สร้างใหม่ — finance-bc** (`apps/finance-bc/src/modules/fiscal-year-close/`): entities (2),
dto (create/response ×2), service, controllers (2), constants, module + ลงทะเบียนใน
`finance-bc.module.ts`

**สร้างใหม่ — `@lib/common`**: `utils/fiscal-year.util.ts` + spec

**สร้างใหม่ — iam**: view controller + 1-2 EJS + JS (§4)

**แก้ไข**:

| ไฟล์ | สิ่งที่ต้องทำ |
|---|---|
| `finance-setting/entities/finance-setting.entity.ts` | เพิ่ม `fiscal_year_start_month: number` |
| `finance-setting/dto/update-finance-setting.dto.ts` | เพิ่มฟิลด์ + validate 1-12 |
| `general-ledger/enums/gl-account-role.enum.ts` | เพิ่ม `RetainedEarnings` + `ROLE_REQUIRED_ACCOUNT_TYPE` |
| `apps/iam/views/pages/system-setting/*` | dropdown เดือนเริ่มต้นปีบัญชี |
| `apps/iam/ui-permissions.manifest.json` | 2 permission ใหม่ |

## 6 · แผน migration

1. **`AddFiscalYearStartMonthToFinanceSettings`** (generate) — `ADD COLUMN ... DEFAULT 1` ปลอดภัย
   (ไม่ breaking, แถวเดียวอยู่แล้ว)
2. **`CreateFiscalYearClosesAndBalances`** (generate, รีวิว SQL, partial unique index
   `(gl_account_id, fiscal_year)` บน balances ต้องเติมมือถ้า generator ไม่ออกให้)
3. **`AssignRetainedEarningsRole`** (hand-written DML) — `UPDATE gl_accounts SET account_role =
   'RETAINED_EARNINGS' WHERE code = '3200-00' AND account_role IS NULL` (guard `IS NULL` กันรัน
   ซ้ำทับ role ที่ผู้ใช้ย้ายไปแล้วหลัง deploy รอบแรก)
4. Permission grant migrations — **เรียนจากบั๊กรอบ chart-of-accounts (§7 ด้านล่าง) ทำให้ถูกตั้งแต่
   commit แรก**: ui-plane (`page:view_fiscal_year_closes` + `component:close_fiscal_year`) ใช้
   self-upsert pattern (`SeedGlAccountsUiPermission`) ชิปพร้อมโค้ดได้เลยไม่ต้องรอ · api-plane
   (`fiscal_year_close:*`, `gl_account_year_end_balance:view`) **ต้องรอ deploy รอบ 2** เท่านั้น
   (permissions:sync ต้องรันก่อนมี catalog row ให้ join)

## 7 · Permission + กับดักลำดับ deploy (2 plane, ต้อง 2 deploy ฝั่ง api)

เหมือน chart-of-accounts เป๊ะ — ui-plane self-upsert ไม่ติดกับดัก, api-plane ติด **ต้องแยก 2 deploy**
(โค้ด+`@RequirePermission()` รอบแรก → sync → grant migration รอบสอง) — ห้ามย่อเหลือ deploy เดียว

| Plane | Permission |
|---|---|
| api (finance-bc) | `fiscal_year_close:create`, `fiscal_year_close:view`, `gl_account_year_end_balance:view` |
| ui (iam) | `page:view_fiscal_year_closes`, `component:close_fiscal_year` |

## 8 · แผนเทส

- **Unit**: `resolveFiscalYear()` ทุก edge case (start_month=1 = ปีปฏิทิน, start_month=4 ข้ามปี,
  วันสุดท้าย/แรกของปีบัญชีพอดี) · `FiscalYearClosingService`: ปิดปีแรก (ไม่มี opening ก่อนหน้า) ·
  ปิดปีที่สอง (opening = closing ปีก่อน) · ปิดซ้ำปีเดิมถูกปฏิเสธ · ปิดข้ามปี (ปี N+2 ก่อน N+1) ถูก
  ปฏิเสธ · ปิดก่อนเดือนสุดท้ายของปีถูกปิดงวดถูกปฏิเสธ 400 · residual คำนวณถูกทั้งกรณีกำไร/ขาดทุน
- **E2E**: CRUD 2 endpoint ใหม่ (mocked service)
- **Smoke** (`apps/finance-bc/test/smoke/fiscal-year-close.smoke.mjs`): ปิดปีบัญชีจริงบน DB จริง (ปี
  ทดสอบที่ไม่ชนของจริง เช่นปีอนาคตไกลๆ ที่ยังไม่มีใครปิด) → เช็ค `gl_account_year_end_balances` มีแถว
  ตรงจำนวน leaf account จริง → เช็คว่าปิดซ้ำได้ 409/400 → เช็ค `GET
  /gl-account-year-end-balances?fiscal_year=...` คืนค่าตรงกับที่ query `ledger_entries` เองได้ (เหมือน
  gl-accounts smoke's trial-balance cross-check) — **ข้อควรระวัง**: การปิดปีบัญชีเป็น one-way ratchet
  จริงบน DB ที่ใช้ร่วมกับ production (§4 กับดัก #10 ของ HANDOFF-Feature.md) **ห้าม smoke test ปิดปี
  บัญชีจริงที่มีผลกับรายงานจริงเด็ดขาด** — ถ้าจะเทสข้อนี้ต้องคุยกับ user ก่อนเลือกวิธี (ปีทดสอบใน
  อนาคตที่ไม่กระทบใคร หรือข้ามการเทสระดับนี้ไปเป็น unit-only เหมือนที่เจอกับ smoke ข้อ payment ของ
  gl-accounts ในรอบก่อน)
- **Admin UI**: manual QA (ไม่มี automated test เหมือนทุกหน้า admin ในโปรเจกต์นี้)

## 9 · ขอบเขตที่ไม่อยู่ในรอบนี้

- **D3 · งบการเงิน** (งบดุล/งบกำไรขาดทุนที่จัดกลุ่มตาม `account_type` + subtree sum + พิมพ์) — ใช้
  ข้อมูลจาก D2 นี้ตรงๆ เป็นฐาน แต่เป็นงาน reporting/print แยก
- **โอนกำไรสุทธิแบบ 2 ขั้นผ่านมติที่ประชุมผู้ถือหุ้น** (`3300-00`) — ต้องมี manual journal entry
  endpoint ก่อน ซึ่งไม่มีอยู่เลยวันนี้ (นอกขอบเขตของงานนี้ด้วย)
- **Reopen ปีบัญชีที่ปิดแล้ว** — จงใจไม่ทำ ตรงกับปรัชญา "ปิดแล้วห้ามขยับ" ทั้งระบบ
- **D4 · import/export ผังบัญชี** — ไม่เกี่ยวกับงานนี้ อยู่ backlog เดิม

## 10 · ขนาดงานโดยประมาณ

| ขั้น | งาน | ประเมิน |
|---|---|---|
| 1 | `fiscal_year_start_month` + `resolveFiscalYear()` util + unit test | 0.5 วัน |
| 2 | entity + migration (2 ตาราง) + role ใหม่ + DML migration | 1 วัน |
| 3 | `FiscalYearClosingService` (residual calc + posting + guard 3 ชั้น) + unit test | 2 วัน |
| 4 | controller + DTO + e2e | 1 วัน |
| 5 | Admin UI (หน้าเดียว + dialog ยืนยัน) | 1 วัน |
| 6 | smoke (ต้องตัดสินใจ §8 ก่อนเขียน) + permission sync/grant 2 deploy | 1 วัน |
| 7 | เอกสาร (srs-p5.html) | 0.5 วัน |
| | **รวม** | **7 วันทำงาน** |

## 11 · Log การตัดสินใจ

| # | คำถาม | คำตอบ |
|---|---|---|
| E1 | ปีบัญชีปฏิทินตายตัวหรือตั้งค่าได้ | **ตั้งค่าเดือนเริ่มต้นได้ต่อ deployment** (§3.1) |
| E2 | ปิดปีบัญชีรวมกับปิดงวดเดือนไหม | **แยก action ใหม่** `POST /fiscal-year-closes` (§3.4, §3.5) |
| E3 | Post closing entries จริงไหม | **Post จริง** ล้าง REVENUE/EXPENSE เข้า Retained Earnings (§3.4 ข้อ 6) |
| E4 | ต้องมีตาราง snapshot ไหม | **ต้องมี** `gl_account_year_end_balances` freeze ถาวร (§3.3) |
| E5 (ตัดสินใจเพิ่มระหว่างออกแบบ) | Direct method หรือผ่านบัญชีพัก `3300-00` ก่อน | **Direct method** เข้า Retained Earnings ตรงๆ — 2 ขั้นตอนต้องรอ manual journal entry endpoint ซึ่งไม่มีอยู่ (§3.2, §9) |
| E6 (ตัดสินใจเพิ่มระหว่างออกแบบ) | ปิดปีบัญชีที่ยังไม่ปิดงวดเดือนสุดท้ายได้ไหม | **ไม่ได้** บังคับ `ledger_frozen_upto ≥ fiscal_year_end` ก่อนเสมอ (§3.4 ข้อ 2) |
