# HANDOFF — Configurable Chart of Accounts (ผังบัญชีที่ลูกค้าแก้ไขเองได้)

> **เอกสารแผนงาน (plan) เขียนก่อน implement** — ไม่ใช่บันทึกงานที่ทำเสร็จแล้วแบบ
> `HANDOFF-Feature.md` และไม่ใช่ backlog ยาว ๆ แบบ `HANDOFF-Backlog-Reporting-Print-Tax.md`
> เมื่อ implement เสร็จให้ย้ายสรุปผลไปที่ `HANDOFF-Feature.md` + `srs-p5.html` แล้วลบไฟล์นี้ทิ้ง
>
> **เขียนเมื่อ 2026-09-06** — ที่มา: ทีมเอา response ตัวอย่างของ **ระบบอ้างอิง** (ระบบบัญชีคลาวด์
> เชิงพาณิชย์ที่ใช้เทียบฟีเจอร์ — ในเอกสารนี้เรียกแทนด้วยคำนี้เสมอ ไม่ระบุชื่อผลิตภัณฑ์และไม่คัดลอก
> ข้อมูลจริงจากระบบนั้นมาลงเอกสาร) มาเทียบว่าระบบเรามีตรงไหนต้องปรับปรุง — เจอ 3 ช่องว่าง (ผังบัญชี,
> หนังสือรับรองหัก ณ ที่จ่าย, เอกสารค่าใช้จ่ายทั่วไป) เอกสารนี้ครอบคลุม **เฉพาะข้อแรก** ซึ่งเป็นข้อที่
> ใหญ่ที่สุดและเป็นฐานของอีกสองข้อ
>
> **อัปเดต 2026-09-06 (รอบสอง)** — จุดตัดสินใจทั้งหมดที่เปิดไว้ (§11 เดิม) ปิดหมดแล้ว รวม 2 จุดที่
> เปลี่ยนขอบเขตงาน: **ย้าย `account_role` ข้ามบัญชีได้** (§3.2.1) และ **ทำ Admin UI ในรอบนี้เลย**
> (§4) — ไม่ใช่แค่ API เฉย ๆ แบบร่างแรก
>
> **สถานะ**: แผนล็อกแล้ว ยังไม่เริ่ม implement — งานที่เหลือก่อนลงมือคือ §10 ขั้นที่ 2 (ให้นักบัญชี
> ตรวจรายชื่อผังบัญชี ~130 บัญชีจริง) และ §10 ขั้นที่ 3 (inventory รายชื่อ deployment ลูกค้าที่ต้อง
> รัน migration C)

---

## 0 · สรุปสั้น

| หัวข้อ | สาระ |
|---|---|
| ปัญหา | ผังบัญชีเป็น **enum ปิด 14 รหัส** (`GlAccount`) ลูกค้าเพิ่ม/แก้บัญชีเองไม่ได้ — ลูกค้าใหม่ที่มีผังบัญชีต่างจาก 14 รหัสนี้ ต้องแก้โค้ด + deploy ใหม่ทุกครั้ง |
| ทางแก้ | เปลี่ยนเป็นตาราง `gl_accounts` (tree, nested-set) + enum ใหม่ `GlAccountRole` ให้ posting rule อ้างอิง **บทบาท** แทนรหัสบัญชี + ย้าย role ข้ามบัญชีได้ผ่าน API |
| ขนาด | อยู่ใน finance-bc + หน้า admin ใน iam · ~2 สัปดาห์รวมเทส · ไม่กระทบ BC อื่น |
| ความเสี่ยงหลัก | migration ที่ต้อง backfill `ledger_entries` (ตาราง append-only ที่มีข้อมูลจริง) + กับดักลำดับ deploy ของ permission (ต้อง 2 deploy) |
| Seed | ผังบัญชีมาตรฐาน SME ไทยเต็มชุด ~130 บัญชี (§3.3) |
| Admin UI | ทำในรอบนี้ — หน้า host ใน `apps/iam/views` ตาม pattern เดียวกับ `warehouses` (§4) |

**ลำดับที่แนะนำ**: §6 migration → §5 refactor posting services → §3.6 API ใหม่ (รวมย้าย role) →
§4 Admin UI → §8 เทส (รวม smoke ตัวแรกของ finance-bc) → deploy รอบ 1 → §7 grant migration →
deploy รอบ 2

---

## 1 · สถานะโค้ดจริงวันนี้ (ตรวจแล้ว 2026-09-06)

### 1.1 `GlAccount` — enum ปิด 14 ค่า ไม่ใช่ตาราง

`apps/finance-bc/src/modules/general-ledger/enums/gl-account.enum.ts` — 14 รหัส: `1010` Cash,
`1130` AR, `1150` Inventory, `1160` InputVat, `1180` WHT Receivable, `2110` AP, `2130` OutputVat,
`2140` WHT Payable, `4100` SalesRevenue, `4300`/`4301` FX Gain (realised/unrealised), `5100` COGS,
`5300`/`5301` FX Loss (realised/unrealised)

docblock ของ enum เองเขียนทางออกไว้แล้ว — เอกสารนี้คือการทำตามนั้น:

> "**If that mapping ever needs to be configurable per deployment, this becomes a `gl_accounts`
> table and the posting rules reference it by role rather than by code** — the rules are already
> written in terms of the role each account plays, so that change stays contained."

**ไฟล์ที่อ้าง `GlAccount` (จำนวนจุดอ้างอิง)** — production code:

| ไฟล์ | จุด |
|---|---|
| `payment/services/payment-gl-posting.service.ts` | 10 |
| `receipt/services/receipt-gl-posting.service.ts` | 7 |
| `fx-revaluation/services/fx-revaluations.service.ts` | 5 |
| `cogs/services/cogs-gl-posting.service.ts` | 5 |
| `ap-invoice/services/ap-invoice-gl-posting.service.ts` | 5 |
| `general-ledger/entities/ledger-entry.entity.ts` | 3 |
| `general-ledger/dto/ledger-entry-response.dto.ts` | 3 |
| `general-ledger/services/trial-balances.service.ts` | 2 |
| `general-ledger/interfaces/trial-balance-row.interface.ts` | 2 |
| `general-ledger/interfaces/journal.interface.ts` | 2 |
| `general-ledger/dto/trial-balance-query-params.dto.ts` | 1 |

+ เทส 4 ไฟล์: `fx-revaluations.service.spec.ts`, `general-ledger.service.spec.ts`,
`receipt-gl-posting.service.spec.ts`, `payment-gl-posting.service.spec.ts`

### 1.2 แก้ความเข้าใจผิด — งบทดลอง **มีอยู่แล้ว**

`GET /trial-balances` (`trial-balances.controller.ts` + `TrialBalancesService`, permission
`trial_balance:view`) คำนวณ `SUM(debit)`/`SUM(credit)`/`balance`/`is_balanced` ต่อบัญชี พร้อมกรอง
ช่วงวันที่ และรวม reversing entries เข้าไปด้วยโดยตั้งใจ

**สิ่งที่มันยังทำไม่ได้** (คือช่องว่างจริงที่เหลือ): `GROUP BY entry.account` เป็นรหัส enum ล้วน ๆ —
ไม่มีชื่อบัญชี ไม่มี `account_type` ไม่มีลำดับชั้น จึงยัง**จัดกลุ่มเป็นงบการเงินไม่ได้** (สินทรัพย์/
หนี้สิน/ทุน/รายได้/ค่าใช้จ่าย) และไม่มียอดสะสมต่อปีบัญชีแบบ `balances[]` ของระบบอ้างอิง

### 1.3 `ledger_entries` เป็น API อ่านอย่างเดียว — เปลี่ยนคอลัมน์ได้ปลอดภัยกว่าที่คิด

`LedgerEntriesController` มีแค่ `GET /ledger-entries` และ `GET /ledger-entries/:id`
· `CreateLedgerEntryDTO` **เป็นคลาสว่างเปล่าโดยตั้งใจ** (docblock: "has no create endpoint and never
will") — GL row เกิดได้ทางเดียวคือผ่าน `GeneralLedgerService.post()`

**ผลต่อแผนนี้**: เปลี่ยน `account` (enum) → `account_id` (FK) **ไม่ใช่ breaking change ฝั่ง write**
เพราะไม่มี client ไหนส่ง `account` เข้ามาได้อยู่แล้ว กระทบเฉพาะ **response shape** ของ 2 endpoint
(`/ledger-entries`, `/trial-balances`) ซึ่งต้องประกาศใน `api-workflow-guide.html` ตอนปิดงาน — ในรีโปนี้
ไม่มี client ไหนกินสอง endpoint นี้เลย (`frontend-web` มีแค่ `ui-permissions.manifest.json` โค้ด FE
จริงอยู่คนละรีโป) แต่ต้องเคลียร์กับทีม FE ก่อน deploy อยู่ดี

### 1.4 finance-bc **ยังไม่มี smoke file เลยสักไฟล์** — `verify` ขั้นที่ 6 ข้ามทุกครั้ง

`apps/finance-bc/test/smoke/` **ไม่มีอยู่จริง** (มีแค่ `apps/sales-bc/test/smoke/`) —
`scripts/verify.mjs` จึงรายงานขั้น smoke เป็น *skipped* พร้อมข้อความ "no smoke files in
apps/finance-bc/test/smoke/ — a feature is not verified until one exercises it against the running
service"

แปลว่าทุกอย่างที่ทำใน finance-bc ที่ผ่านมา **ไม่เคยผ่านขั้นที่ 6 เลย** งานนี้ต้องสร้าง smoke file
ตัวแรกของ finance-bc ไปด้วย (ดู §8.3)

### 1.5 finance-bc ยังไม่มี precedent การ seed master data

`grep` หา `INSERT INTO tax_configs` — ไม่เจอ · `libs/database/src/scripts/seed/` ครอบคลุมแค่
`erp_inventory` + `erp_supplier` เท่านั้น (15 seeders) แปลว่า `gl_accounts` จะเป็น master data ชุดแรก
ของ finance-bc ที่ต้องมีข้อมูลตั้งต้น — และต้อง seed ผ่าน **migration** ไม่ใช่ seed script (ดู §6.2)

### 1.6 หน้า admin ทั้งระบบอยู่ที่ `apps/iam` ที่เดียว — คนละ BC ก็ host ที่นี่

`grep` หา `views/` ทั้ง `apps/*` — เจอแค่ `apps/iam/views` BC อื่นไม่มีของตัวเอง แม้แต่ `warehouses`
(ข้อมูล/API เป็นของ `inventory-bc`) หน้า admin ก็ host อยู่ที่
`apps/iam/src/modules/views/controllers/warehouses.controller.ts` +
`apps/iam/views/pages/warehouses/` — **นี่คือ pattern ที่ `gl-accounts` ต้องเดินตาม** (§4)

---

## 2 · ขอบเขต

**1 deployment ต่อ 1 ลูกค้า** — ลูกค้าแต่ละรายมี Postgres ของตัวเองอยู่แล้ว ผังบัญชีจึงเป็นข้อมูลธรรมดา
ในตารางเดียว ไม่มี scope key ใด ๆ เพิ่ม

---

## 3 · ดีไซน์ backend ที่จะทำ

### 3.1 ตารางใหม่ `gl_accounts`

ใช้ pattern tree เดิมของโปรเจกต์ (`item_groups`, `warehouses` — nested-set `lft`/`rgt` + rebuild
เต็มต้นทุกครั้งที่ insert/re-parent/delete ผ่าน `@lib/common/utils/nested-set/rebuild-nested-set.util.ts`)
ไม่ประดิษฐ์ pattern ใหม่:

| คอลัมน์ | ชนิด | หมายเหตุ |
|---|---|---|
| `id` | uuid | จาก `BaseEntity` |
| `code` | varchar(20) | รหัสบัญชี `"1010"`, `"5470-11"` — `@Unique('uq_gl_accounts_code')` · **ไม่บังคับรูปแบบ** (แค่ unique/ไม่ว่าง/≤20 ตัว) เพื่อรองรับลูกค้าที่ย้ายจากระบบเดิมมาพร้อมเลขของตัวเอง |
| `name_th` / `name_en` | varchar(255) | i18n แบบ flat ตามกฎโปรเจกต์ (interceptor ยุบเป็น `{ th, en }` ตอน response) |
| `parent_gl_account_id` | uuid null | บัญชีแม่ (null = root) · self-FK `fk_gl_accounts_parent_gl_account_id` |
| `lft` / `rgt` | int | nested-set bounds (ระบบคำนวณ) |
| `is_group` | boolean | true = node (บัญชีคุม, ลงรายการไม่ได้) · false = leaf (ลงรายการได้) — ตรงกับธงบัญชีคุมของระบบอ้างอิง และกฎ "เฉพาะ leaf ที่ผูกสินค้าได้" ของ `item_groups` |
| `account_type` | enum | `ASSET` \| `LIABILITY` \| `EQUITY` \| `REVENUE` \| `EXPENSE` — **ต้องตรงกับพ่อแม่เสมอ** ดู §3.5.1 |
| `normal_balance` | enum | `DEBIT` \| `CREDIT` — **ไม่ derive จาก `account_type`** ดู §3.1.1 |
| `account_role` | enum null | `GlAccountRole` — หัวใจของดีไซน์ ดู §3.2 |
| `is_locked` | boolean | true = แถวระบบ seed มา ห้ามลบ/ห้ามแก้ `account_type`/`normal_balance` ของตัวเอง (= ธงบัญชีระบบของระบบอ้างอิง) — **ไม่เกี่ยวกับ `account_role`** ย้าย role เข้า/ออกบัญชี locked ได้ปกติ (§3.2.1) |
| `is_active` | boolean | ปิดใช้งานโดยไม่ลบ (เอกสารเก่าที่อ้างอยู่ไม่กระทบ) — pattern เดียวกับ `tax_configs.is_active` |
| `note_th` / `note_en` | text null | หมายเหตุ |

Index: `idx_gl_accounts_parent_gl_account_id`, `idx_gl_accounts_account_type`
· partial unique index `uq_gl_accounts_account_role` บน `(account_role) WHERE account_role IS NOT NULL
AND is_deleted = false` — **หนึ่ง role มีได้บัญชีเดียว** คือสิ่งที่ทำให้ `resolveIdByRole()` ใน §3.2
คืนค่าได้แน่นอนเสมอ

`@Check()` ทุกตัวต้องประกาศบน entity ด้วย decorator ไม่ใช่เขียนแต่ใน migration — ไม่งั้น
`migration:generate` ครั้งถัดไปจะ drop ทิ้งเงียบ ๆ

#### 3.1.1 ทำไม `normal_balance` ต้องเป็นคอลัมน์ ไม่ derive จาก `account_type`

สูตรง่าย ๆ (ASSET/EXPENSE = debit, ที่เหลือ = credit) **ผิดกับบัญชีปรับมูลค่า (contra account)** ซึ่ง
ผังบัญชีจริงมีเพียบ:

- `1420-xx ค่าเสื่อมราคาสะสม` — `type: ASSET` แต่ยอดปกติอยู่ฝั่ง **credit**
- `4100-03 รับคืนสินค้า`, `4100-04 ส่วนลดจ่าย` — `type: REVENUE` แต่ยอดปกติอยู่ฝั่ง **debit**
- `1130-03 ค่าเผื่อหนี้สงสัยจะสูญ` — `type: ASSET` ยอดปกติฝั่ง **credit**

ถ้า derive เอา งบทดลอง/งบการเงินจะแสดงเครื่องหมายกลับด้านทันทีที่ลูกค้าสร้างบัญชี contra ซึ่งเป็น
เรื่องปกติมากในผังบัญชีไทย

### 3.2 `GlAccountRole` — กลไกที่กันของเดิมพัง

ปัญหา: posting rule ปัจจุบันเขียนว่า `GlAccount.Cash` ตรง ๆ ถ้าเปลี่ยนเป็นตารางแล้วให้มันไปหา
"บัญชีที่ลูกค้าตั้งชื่ออะไรก็ได้" ระบบจะพังทันทีที่ลูกค้าลบ/เปลี่ยนบัญชีที่ posting rule พึ่งอยู่

ทางแก้: enum ใหม่ `GlAccountRole` **ก็อป 14 ค่าจาก `GlAccount` เดิมมาตรง ๆ แต่เก็บ *ความหมาย* แทน
*รหัส*** แล้ว posting service เรียกผ่าน lookup:

```ts
// เดิม
account: GlAccount.Cash,
// ใหม่
account_id: await this.glAccountsService.resolveIdByRole(GlAccountRole.Cash),
```

`GlAccountsService.resolveIdByRole()` cache ผลไว้ในหน่วยความจำ (invalidate เมื่อมีการเขียนตาราง) —
ลูกค้าจะเปลี่ยนรหัส `1010` เป็น `1111-01` หรือเปลี่ยนชื่อเป็นอะไรก็ได้ posting rule ไม่รู้ไม่สนใจ
ตราบใดที่แถวนั้นยังถือ role `Cash` อยู่

#### 3.2.1 ย้าย `account_role` ข้ามบัญชีได้ (อยู่ในรอบนี้)

เหตุผลที่ต้องมีตั้งแต่รอบแรก ไม่ใช่รอบหน้า: ถ้าไม่มีกลไกนี้ ทุกครั้งที่ mapping ใน §3.3.1 ผิดใจ
นักบัญชี หรือลูกค้าโรงงานต้องการให้ `Inventory` ชี้บัญชีวัตถุดิบแทนสินค้าสำเร็จรูป จะต้องรอ migration
ใหม่ทุกครั้ง — มีกลไกนี้แล้ว ปรับเองผ่าน API ได้ทันที ซึ่งคือหัวใจของฟีเจอร์ทั้งอัน ("config ได้ต่อ
deployment")

**กติกา — ย้าย (move) เท่านั้น ห้าม "ปลด" role เปล่า ๆ**: role ต้องมีเจ้าของ 1 บัญชีเสมอ เพราะ
`resolveIdByRole()` พึ่ง invariant นี้ — endpoint จึงรับแค่ "ย้าย role X ไปบัญชี Y" ไม่มี "ถอด role X
ออกโดยไม่ระบุบัญชีใหม่"

- `PATCH /gl-accounts/:id/role` body `{ account_role: GlAccountRole }` — ตั้ง role ให้บัญชี `:id`
  service หาบัญชีเดิมที่ถือ role นั้นอยู่ (ถ้ามี) แล้วเคลียร์ให้อัตโนมัติในทรานแซคชันเดียว
- เงื่อนไขก่อนย้ายได้ — ปลายทางต้อง `is_group=false`, `is_active=true`, และ `account_type` ตรงกับ
  "ชนิดที่ role นั้นต้องการ" (ตาราง `ROLE_REQUIRED_ACCOUNT_TYPE` คงที่ในโค้ด — เช่น `Cash` ต้องเป็น
  `ASSET`, `AccountsPayable` ต้องเป็น `LIABILITY`) กันคนตั้ง role เงินสดไปโดนบัญชีค่าใช้จ่ายโดยไม่ตั้งใจ
- ย้ายแล้ว **รายการ `ledger_entries` เก่าไม่ย้อนกลับไปแก้** (ledger ผูกด้วย `account_id` ตรง ๆ
  ไม่ใช่ผ่าน role) — งบทดลองช่วงก่อน/หลังย้ายเห็นสองบัญชีแยกกันตามความจริงที่เกิดขึ้น ถูกต้องแล้ว
- `is_locked` ไม่เกี่ยวกับกติกานี้ — ย้าย role เข้า/ออกบัญชี locked ได้ตามปกติ (locked ป้องกันแค่
  ลบ/แก้ `account_type`/`normal_balance` ของตัวเอง)
- cache ของ `resolveIdByRole()` invalidate ทันทีที่ endpoint นี้ commit

### 3.3 Seed — ผังบัญชีมาตรฐาน SME ไทยเต็มชุด

seed เต็มชุด ~130 บัญชี ไม่ใช่แค่ 14 แถวขั้นต่ำ เหตุผล: ลูกค้าเปิดระบบมาแล้วลงบัญชีได้เลยโดยไม่ต้อง
สร้างผังเอง (เป็นจุดขายตอน demo) และบัญชีที่ไม่ได้ใช้ลูกค้าลบทิ้งเองได้อยู่แล้วเพราะไม่ `is_locked`

โครงสร้างที่ seed (เลขหมวดเป็นมาตรฐานบัญชี SME ไทยทั่วไป ไม่ได้ลอกจากระบบใดระบบหนึ่ง):

| หมวด | ช่วงรหัส | `account_type` | ตัวอย่างชั้นถัดไป |
|---|---|---|---|
| สินทรัพย์ | `1000-00` | ASSET | `1100-00` หมุนเวียน → `1110-00` เงินสด/ธนาคาร → `1111-01` เงินสด |
| หนี้สิน | `2000-00` | LIABILITY | `2100-00` หมุนเวียน → `2120-00` เจ้าหนี้ → `2120-01` เจ้าหนี้การค้า |
| ส่วนของผู้ถือหุ้น | `3000-00` | EQUITY | `3100-00` ทุน, `3200-00` กำไรสะสม, `3300-00` กำไร(ขาดทุน) |
| รายได้ | `4000-00` | REVENUE | `4100-00` รายได้จากการขาย-สุทธิ → `4100-01` รายได้จากการขาย |
| ค่าใช้จ่าย | `5000-00` | EXPENSE | `5100-00` ต้นทุนขาย, `5400-00` ค่าใช้จ่ายบริหาร → `5411-01` เงินเดือน |

ลึกไม่เกิน 5 ชั้นนับจาก root (มาตรฐานนี้ใช้จริง 3–4) · node ทุกตัว `is_group = true` (ลงรายการไม่ได้)
· เฉพาะ leaf ที่ `is_group = false`

#### 3.3.1 การผูก 14 `account_role` เข้ากับผังมาตรฐาน

**สำคัญ**: role ไปเกาะบัญชี leaf ของผังมาตรฐาน **ไม่ใช่สร้าง 14 บัญชีแปลกปลอมเพิ่ม** (ไม่งั้นจะได้
"เงินสด" สองบัญชีซ้ำกันคือ `1010` ของเดิมกับ `1111-01` ของผังมาตรฐาน)

| `account_role` | รหัสใหม่ (ผังมาตรฐาน) | รหัสเดิมใน enum | `normal_balance` |
|---|---|---|---|
| `Cash` | `1111-01` เงินสด | 1010 | DEBIT |
| `AccountsReceivable` | `1130-01` ลูกหนี้การค้า | 1130 | DEBIT |
| `Inventory` | `1140-02` สินค้าสำเร็จรูปคงเหลือ | 1150 | DEBIT |
| `InputVat` | `1154-00` ภาษีซื้อ | 1160 | DEBIT |
| `WithholdingTaxReceivable` | `1158-00` ภาษีหัก ณ ที่จ่ายที่ใช้สิทธิ์ได้ | 1180 | DEBIT |
| `AccountsPayable` | `2120-01` เจ้าหนี้การค้า | 2110 | CREDIT |
| `OutputVat` | `2135-00` ภาษีขาย | 2130 | CREDIT |
| `WithholdingTaxPayable` | `2132-00` ภาษีหัก ณ ที่จ่ายค้างจ่าย | 2140 | CREDIT |
| `SalesRevenue` | `4100-01` รายได้จากการขาย | 4100 | CREDIT |
| `ForeignExchangeGain` | `4200-04` กำไรจากอัตราแลกเปลี่ยน | 4300 | CREDIT |
| `UnrealisedForeignExchangeGain` | `4200-10` กำไรจากอัตราแลกเปลี่ยนที่ยังไม่เกิดขึ้นจริง | 4301 | CREDIT |
| `CostOfGoodsSold` | `5110-00` ต้นทุนสินค้าเพื่อขาย | 5100 | DEBIT |
| `ForeignExchangeLoss` | `5470-09` ขาดทุนจากอัตราแลกเปลี่ยน | 5300 | DEBIT |
| `UnrealisedForeignExchangeLoss` | `5470-13` ขาดทุนจากอัตราแลกเปลี่ยนที่ยังไม่เกิดขึ้นจริง | 5301 | DEBIT |

**คอลัมน์ "รหัสเดิมใน enum" ไม่ใช่ของประดับ** — มันคือ mapping ที่ §6.3 ใช้ backfill ข้อมูล
`ledger_entries` ที่มีอยู่จริง ห้ามทิ้ง

**หมายเหตุ 3 ข้อที่ต้องยืนยันกับนักบัญชีก่อนลงมือ** (นี่คือ mapping ตั้งต้นของผม ไม่ใช่คำตอบสุดท้าย —
ถ้านักบัญชีเห็นต่าง ย้าย role ผ่าน §3.2.1 ได้เลย ไม่ต้องแก้แผนนี้):

1. `2132-00` ภาษีหัก ณ ที่จ่ายค้างจ่าย — ผังมาตรฐานมักแตกลูกตามแบบยื่น (ภ.ง.ด.1/2/3/53) แต่ระบบวันนี้
   ยังแยกประเภทเงินได้ไม่ได้ (ยังไม่มี `tax_configs.income_type`) จึง seed เป็น **leaf ตัวเดียว** ไปก่อน
   เมื่องานหนังสือรับรองหัก ณ ที่จ่ายลงจริง ค่อยแตกเป็น node + ลูกตามแบบ แล้วย้าย role ลงลูกตัวที่ใช้
   ผ่าน §3.2.1 (มีกลไกอยู่แล้ว ไม่ต้องรอ migration ใหม่)
2. `4200-10` / `5470-13` (FX ที่ยังไม่เกิดขึ้นจริง) — **ผังมาตรฐานทั่วไปไม่มี 2 บัญชีนี้** เราเพิ่มเอง
   ตามเหตุผลใน docblock ของ enum เดิม: กำไร/ขาดทุน FX ที่ยังไม่เกิดขึ้นจริง (TFRS 21 ตีราคาปลายงวด)
   ต้องแยกจากที่เกิดขึ้นจริง ไม่งั้นผู้สอบบัญชีอ่านงบทดลองแล้วแยกไม่ออก
3. `Inventory` → `1140-02` (สินค้าสำเร็จรูป) เหมาะกับธุรกิจซื้อมาขายไป — ถ้าลูกค้าเป็นโรงงานผลิตอาจ
   ต้องเป็น `1140-01` วัตถุดิบ หรือ `1140-03` งานระหว่างทำ ตามชนิดสินค้า — ย้ายผ่าน §3.2.1 ต่อ
   deployment ได้เลยตอน onboard ไม่ต้องรอ migration ใหม่

#### 3.3.2 กฎการเขียน migration seed

- **UUID ต้อง hard-code เป็นค่าคงที่** ไม่ใช่ `gen_random_uuid()` — ทุก deployment มี id เดียวกัน
  เวลา support ไล่ปัญหาข้ามเครื่องจะเทียบกันได้ (หลักการเดียวกับที่กฎ migrations-and-seed บอกให้
  "keep the linking UUIDs in sync" ระหว่าง `erp_auth`/`erp_iam`)
- **`lft`/`rgt` คำนวณล่วงหน้าแล้ว hard-code ลงไปเลย** ไม่ใช่เรียก rebuild ตอน migration — ผังที่ seed
  เป็นต้นไม้คงที่ที่รู้ค่าแน่นอนอยู่แล้ว การให้ migration ไปเรียก utility ของ runtime แปลว่า migration
  เก่าจะเปลี่ยนพฤติกรรมตามโค้ดที่แก้ทีหลัง ซึ่งผิดหลัก migration
- **ข้อมูล ~130 แถวเขียน inline ในไฟล์ migration** ไม่ import จาก `@lib/common` หรือ `data/*.data.ts`
  ด้วยเหตุผลเดียวกัน — migration ต้อง frozen in time
- `down()` = `DELETE FROM gl_accounts` ทั้งตาราง (ตารางนี้เกิดจาก migration A เท่านั้น ไม่มีข้อมูล
  ก่อนหน้า) — แต่ต้องรันหลัง `down()` ของ migration C ที่คืน `ledger_entries.account` กลับมาแล้ว

### 3.4 `ledger_entries.account` → `account_id`

- `account` (enum column) → `account_id` uuid + **FK จริง** `fk_ledger_entries_account_id` →
  `gl_accounts.id` (อยู่ `erp_finance` เดียวกัน ใส่ FK ได้ ต่างจาก cross-BC ที่ห้าม)
- index `idx_ledger_entries_account_entry_date` เปลี่ยนเป็น `(account_id, entry_date)`
- FK เป็น `ON DELETE RESTRICT` — ลบบัญชีที่เคยลงรายการแล้วไม่ได้ ซึ่งถูกต้องตามหลักบัญชี
  (ledger เป็น append-only อยู่แล้ว)
- **กติกาใหม่ที่ service ต้องบังคับ**: ลงรายการได้เฉพาะ `is_group = false` และ `is_active = true`
  เท่านั้น (ลงบัญชีคุมไม่ได้) — `GeneralLedgerService.post()` ตรวจก่อน insert เหมือนที่ตอนนี้ตรวจ
  `assertBalanced()`/`assertPeriodOpen()`

### 3.5 กติกาการแก้ไขของผู้ใช้

| การกระทำ | แถว `is_locked=true` | แถวที่ผู้ใช้สร้างเอง |
|---|---|---|
| แก้ `code`, `name_th/en`, `note` | ได้ | ได้ |
| ย้าย parent (re-parent) | ได้ — `account_type` ต้องตรงกับพ่อแม่ใหม่เสมอ (§3.5.1) | เหมือนกัน |
| ย้าย `account_role` เข้า/ออกบัญชีนี้ | ได้ (ผ่าน §3.2.1) | ได้ (ผ่าน §3.2.1) |
| แก้ `account_type` / `normal_balance` ของตัวเอง | **ไม่ได้** | ได้ ถ้ายังไม่มี ledger row |
| ลบ | **ไม่ได้** | ได้ เฉพาะเมื่อไม่มี ledger row และไม่มีลูก |
| ปิด `is_active` | **ไม่ได้** | ได้ |

ทุกข้อบังคับที่ service ด้วย exception ที่เจาะจง (`ConflictException`/`BadRequestException` ตามกฎ
error handling) ไม่ใช่แค่ DB constraint — ข้อความต้องบอกเหตุผล เช่น "ลบไม่ได้: บัญชีนี้มีรายการใน
สมุดรายวัน 1,284 รายการ"

#### 3.5.1 ข้อจำกัดเพิ่มเติมของ tree

- **ลูกต้อง `account_type` เดียวกับพ่อแม่เสมอ** — บังคับตอน `create()`/`update()`/re-parent ทั้งสาม
  จุด บัญชี `EXPENSE` ใต้ `ASSET` คือความผิดพลาดเสมอ และงบการเงินเดินตาม tree (รวมยอดทั้ง subtree) —
  ถ้าปนกัน งบดุลผิดทันทีโดยไม่มีทางเตือน กันไว้ตั้งแต่ input ถูกกว่าตรวจทีหลังมาก
- **ความลึกสูงสุด 5 ชั้นนับจาก root** — กันต้นไม้บานจน tree UI (§4.2) แสดงผลไม่ไหว

### 3.6 API

**เพิ่มใหม่** (module `gl-account` ใน finance-bc):

| Endpoint | Permission | หมายเหตุ |
|---|---|---|
| `GET /gl-accounts` (paginated + filter) | `gl_account:view` | |
| `GET /gl-accounts/:id` | `gl_account:view` | |
| `GET /gl-accounts/tree` (ทั้งต้นเรียงตาม nested-set) | `gl_account:view` | คืนทั้งต้นในครั้งเดียว (~130 แถว) ให้ client ประกอบเอง ไม่ lazy-load ทีละชั้น |
| `POST /gl-accounts` | `gl_account:create` | |
| `PATCH /gl-accounts/:id` | `gl_account:update` | แก้ `code`/ชื่อ/parent/`account_type`/`normal_balance`/`is_active` — **ไม่รวม `account_role`** |
| `PATCH /gl-accounts/:id/role` | `gl_account:update` | ย้าย `account_role` มาที่บัญชีนี้ (§3.2.1) — แยก endpoint เพราะกระทบบัญชีอื่นด้วย ไม่ใช่แค่ตัวเอง |
| `DELETE /gl-accounts/:id` | `gl_account:delete` | ทีละใบเท่านั้นรอบนี้ (ไม่ทำ bulk/cascade — ดู §9 decision C2) |

**เปลี่ยน response** (breaking change ต่อ client ที่อ่าน field เดิม — ในรีโปนี้ไม่มี แต่ต้องแจ้งทีม FE):

- `GET /ledger-entries` — `account: "1010"` → `account_id: "<uuid>"` + nested `account: { code,
  name: { th, en }, account_type }` (join มาให้เลย เพราะ client ต้องใช้ทุกครั้งอยู่แล้ว)
- `GET /trial-balances` — แต่ละแถวเพิ่ม `account_id`, `code`, `name`, `account_type`,
  `normal_balance` และเรียงตาม `code`

---

## 4 · Admin UI (ทำในรอบนี้)

`finance-bc` ไม่มี `views/` ของตัวเอง และไม่ควรมี — ทั้งระบบมีแค่ `apps/iam` ที่เป็น admin console จริง
(ยืนยันแล้ว §1.6) แม้แต่ `warehouses` ที่ข้อมูล/API เป็นของ `inventory-bc` หน้า admin ก็ host อยู่ที่
`apps/iam/views/pages/warehouses/` + `apps/iam/src/modules/views/controllers/warehouses.controller.ts`
— `gl-accounts` เดินตาม pattern เดียวกันเป๊ะ

### 4.1 ไฟล์ที่ต้องสร้าง (ทั้งหมดอยู่ใน `apps/iam`)

| ไฟล์ | หน้าที่ |
|---|---|
| `src/modules/views/controllers/gl-accounts.controller.ts` | route `/views/gl-accounts` (list), `/views/gl-accounts/new`, `/views/gl-accounts/:id/edit` — คัดลอกโครงจาก `warehouses.controller.ts` เป๊ะ (`@Public()`, `@Render`, `buildAdminViewConfig()`) |
| `views/pages/gl-accounts/index.ejs` | list page — แสดงเป็น indented tree ไม่ใช่ flat table (§4.2), toolbar ปุ่ม "สร้างบัญชี", table-toolbar มี search (ชื่อ/รหัส) + select `account_type` |
| `views/pages/gl-accounts/form.ejs` | สร้าง/แก้บัญชี: `code`, `name_th/en`, พ่อแม่ (dropdown ผังทั้งต้น), `account_type`, `normal_balance`, `note` — **ไม่มีฟิลด์ `account_role` ในฟอร์มนี้** (ดู §4.1.1) |
| `public/pages/gl-accounts/js/gl-accounts.controller.js` | render tree + ผูก event ของ index/form |
| `public/pages/gl-accounts/js/gl-accounts.service.js` | เรียก 7 endpoint จาก §3.6 ไปที่ finance-bc |

#### 4.1.1 ทำไม "ย้าย role" ไม่อยู่ในฟอร์ม create/edit ปกติ

การย้าย `account_role` กระทบบัญชี**อีกใบ**ด้วยเสมอ (เคลียร์ role จากเจ้าของเดิม) ไม่ใช่แค่ตัวเองแบบ
ฟิลด์อื่นในฟอร์ม — ถ้าซ่อนไว้ในฟอร์ม edit ธรรมดา ผู้ใช้จะไม่เห็นว่ากำลังไปแย่ง role จากบัญชีไหน ทำเป็น
action แยกต่างหาก: ปุ่ม "ตั้งเป็นบัญชี [role]" ต่อแถวในหน้า `index.ejs` (แสดงเฉพาะบัญชีที่ `is_group=false`,
`is_active=true`) เปิด `<dialog>` เล็ก ๆ ให้เลือก role + แสดงชื่อบัญชีเดิมที่จะถูกถอด role ก่อนยืนยัน —
ตรงกับกฎ "การกระทำที่กระทบเกินตัวเองต้องยืนยันชัดเจน" เดียวกับ `showConfirmDialog()`

### 4.2 Tree UI — ไม่มีของเดิมให้ก็อป ต้องเขียนใหม่

ตรวจแล้ว: `item_groups` (nested-set อีกตัวในระบบ) **ก็ยังไม่มีหน้า admin ของตัวเอง** จึงไม่มี
tree-rendering component สำเร็จรูปให้ใช้ซ้ำ — เขียนใหม่:

- fetch ทั้งต้นจาก `GET /gl-accounts/tree` (เรียงตาม `lft` มาให้แล้วจาก backend)
- render เป็น `<table class="p-table"><tbody>` ปกติตามกฎ (**ห้าม** card-grid) แค่เพิ่มคอลัมน์ indent
  ตามความลึก (คำนวณจาก `lft`/`rgt` ที่ nest กันฝั่ง client ได้ — ไม่ต้องให้ backend ส่ง `depth` มาเพิ่ม)
- ปุ่ม expand/collapse ต่อ node ที่มีลูก (`is_group=true`) — เก็บ state เปิด/ปิดใน `localStorage`
  ต่อ session พอ ไม่ต้องผูกกับ backend
- ไม่ต้องมี pager (กฎ admin-ui-ejs.md บังคับ pager เฉพาะ endpoint ที่ paginate จริง — `/gl-accounts/tree`
  ไม่ paginate เพราะ ~130 แถวโหลดทั้งต้นได้สบาย)

### 4.3 Permission — คนละ plane จาก API แต่ deploy-order trap เดียวกัน

ตามกฎ permissions.md: หน้า admin เป็น **ui-plane** (`page:*`/`component:*`) สแกนจาก
`data-permission="..."` ใน EJS ไม่ใช่จาก `@RequirePermission()` — ต้องประกาศ:

- `data-permission="page:view_gl_accounts"` ที่ root ของ `index.ejs` → derive เป็น resource
  `page_gl_accounts`
- `data-permission="component:create_gl_account"` / `component:delete_gl_account"` /
  `component:move_gl_account_role"` ต่อปุ่ม — เพราะนับใต้หน้าเดียวกัน จะ inherit resource
  `page_gl_accounts` อัตโนมัติ (กฎ "component นับใต้ page ไหนก็ resource ตามนั้น")

ทั้ง 2 plane (api ใน finance-bc, ui ใน iam) สแกนรวมกันในการรัน `permissions:sync` ครั้งเดียว —
กับดักลำดับ deploy ใน §7 จึงครอบทั้งสอง plane พร้อมกัน ไม่ใช่แค่ api-plane 4 permission เดิม

### 4.4 ขอบเขต UI รอบนี้

**ทำ**: list (แสดง tree), create, edit, delete ทีละใบ (พร้อม `showConfirmDialog`), ย้าย role
ผ่าน dialog แยก (§4.1.1)

**ไม่ทำ**: drag-and-drop re-parent (คลิกเลือกพ่อแม่ใหม่จาก dropdown ในฟอร์ม `edit` พอ — เขียนใหม่
น้อยกว่ามาก และ error-prone น้อยกว่า drag-and-drop), bulk/cascade delete (ทีละใบก่อนตาม §9 C2),
import/export (นอกรอบตาม §9)

---

## 5 · ผลกระทบต่อไฟล์ที่มีอยู่ (checklist ตอน implement)

**สร้างใหม่ — finance-bc** (`apps/finance-bc/src/modules/gl-account/`): entity, enums
(`GlAccountRole`, `GlAccountType`, `NormalBalance`), dto (create/update/update-role/query/response),
service, controller, constants (swagger), module + ลงทะเบียนใน `finance-bc.module.ts`

**สร้างใหม่ — iam** (§4.1): view controller + 2 EJS page + 2 JS file

**แก้ไข**:

| ไฟล์ | สิ่งที่ต้องทำ |
|---|---|
| `general-ledger/entities/ledger-entry.entity.ts` | `account` enum → `account_id` uuid + FK + `@ManyToOne` |
| `general-ledger/interfaces/journal.interface.ts` | `IJournalLineInput.account: GlAccount` → `account_id: string` |
| `general-ledger/services/general-ledger.service.ts` | `post()`/`reverse()` ใช้ `account_id` · เพิ่มตรวจ leaf/active · ข้อความ error ที่ปัจจุบันพิมพ์ `line.account` ต้องดึง `code` มาแสดงแทน uuid |
| `general-ledger/services/trial-balances.service.ts` | `groupBy('entry.account')` → join `gl_accounts` + group by `account_id` |
| `general-ledger/interfaces/trial-balance-row.interface.ts` | เพิ่ม field ตาม §3.6 |
| `general-ledger/dto/ledger-entry-response.dto.ts` | เปลี่ยน field |
| `general-ledger/dto/trial-balance-query-params.dto.ts` | filter ตาม `account` เดิม → `account_id`/`code` |
| `payment/services/payment-gl-posting.service.ts` (10 จุด) | `GlAccount.X` → `resolveIdByRole(GlAccountRole.X)` |
| `receipt/services/receipt-gl-posting.service.ts` (7 จุด) | เหมือนกัน |
| `fx-revaluation/services/fx-revaluations.service.ts` (5 จุด) | เหมือนกัน |
| `cogs/services/cogs-gl-posting.service.ts` (5 จุด) | เหมือนกัน |
| `ap-invoice/services/ap-invoice-gl-posting.service.ts` (5 จุด) | เหมือนกัน |
| `general-ledger/enums/gl-account.enum.ts` | **ลบทิ้ง** (แทนที่ด้วย seed + `GlAccountRole`) |

**ข้อควรระวังเรื่อง module boundary**: posting service ทั้ง 5 ตัวอยู่คนละ module กับ `gl-account` →
ต้อง **inject `GlAccountsService`** (ไม่ใช่ `@InjectRepository(GlAccount)`) และ `GlAccountModule`
ต้อง export service ตัวนั้น · ตรวจว่าไม่เกิด cycle: `GlAccountModule` ต้องไม่ import
`GeneralLedgerModule` กลับ (มันต้องการแค่ repository ของตัวเอง + นับ ledger row ตอนลบ ซึ่งควรทำผ่าน
`GeneralLedgerService` ที่ inject เข้ามาทางเดียว)

---

## 6 · แผน migration (ลำดับสำคัญมาก)

`libs/database/src/migrations/erp_finance/` — ทุกไฟล์ใช้ timestamp จริงจาก
`node -e "console.log(Date.now())"` ห้ามแต่งเลข (ล่าสุดในโฟลเดอร์คือ `1788622456246`)

### 6.1 Migration A — สร้างตาราง (generate)

```bash
pnpm run migration:generate:finance --name=CreateGlAccounts
```

รีวิว SQL ที่ได้ก่อนเสมอ · partial unique index ของ `account_role` (§3.1) generator มักไม่ออกให้ —
ต้องเติมมือ

### 6.2 Migration B — seed ผังมาตรฐาน ~130 บัญชี (hand-written, ดู §3.3)

`migration:create` เพราะเป็น DML ที่ generator มองไม่เห็น · UUID/`lft`/`rgt` คงที่ตาม §3.3.2 ·
`down()` = `DELETE FROM gl_accounts`

**ทำไม seed ที่นี่ ไม่ใช่ที่ `scripts/seed/`**: seed script เป็น *demo data* (ธุรกิจเกษตรไทย) ที่
รันหรือไม่รันก็ได้ แต่ 14 บัญชีที่ถือ `account_role` คือข้อมูลที่**ระบบโพสต์บัญชีไม่ได้เลยถ้าไม่มี** —
ต้องมาพร้อม schema ทุก deployment เสมอ และในเมื่อ 14 บัญชีนั้นเป็น leaf ของผังมาตรฐานอยู่แล้ว
(§3.3.1) ก็ seed ทั้งผังไปพร้อมกันในไฟล์เดียว ไม่ต้องแยกสองที่

### 6.3 Migration C — ย้าย `ledger_entries.account` → `account_id` (hand-written)

**ห้ามใช้ผลจาก `migration:generate` ตรง ๆ** — generator จะมองว่าเป็นการลบคอลัมน์เก่า + เพิ่ม
คอลัมน์ใหม่ แล้วออก `DROP COLUMN` ที่ **ทำข้อมูล ledger จริงหายทั้งตาราง** (กฎ migrations-and-seed
เตือนเรื่องนี้ไว้ตรง ๆ ว่า "it can emit destructive DROP/re-create for a rename")

ลำดับที่ต้องเขียนเอง:

1. `ADD COLUMN account_id uuid NULL`
2. **backfill ผ่านตาราง mapping ไม่ใช่ join รหัสตรง ๆ** — เพราะ seed ใช้ผังมาตรฐาน รหัสจึง
   **ไม่ตรง** กับ enum เดิม (`1010` → `1111-01` ฯลฯ ดู §3.3.1) การเขียน
   `WHERE ga.code = le.account::text` แบบตรงไปตรงมาจะ match ไม่ได้เลยสักแถว:

   ```sql
   UPDATE ledger_entries le
   SET    account_id = ga.id
   FROM  (VALUES ('1010','1111-01'), ('1130','1130-01'), ('1150','1140-02'),
                 ('1160','1154-00'), ('1180','1158-00'), ('2110','2120-01'),
                 ('2130','2135-00'), ('2140','2132-00'), ('4100','4100-01'),
                 ('4300','4200-04'), ('4301','4200-10'), ('5100','5110-00'),
                 ('5300','5470-09'), ('5301','5470-13')
        ) AS m(old_code, new_code)
   JOIN   gl_accounts ga ON ga.code = m.new_code
   WHERE  le.account::text = m.old_code;
   ```

3. ตรวจว่า backfill ครบ — `SELECT count(*) FROM ledger_entries WHERE account_id IS NULL` ต้อง = 0
   (ถ้าไม่ 0 = มีรหัสที่ไม่อยู่ใน mapping 14 คู่ → `RAISE EXCEPTION` ให้ migration ล้มไปเลย
   ดีกว่าปล่อยผ่านแล้วได้ ledger ที่ชี้บัญชีผิด)
4. `ALTER COLUMN account_id SET NOT NULL`
5. `ADD CONSTRAINT fk_ledger_entries_account_id ... ON DELETE RESTRICT`
6. `DROP INDEX idx_ledger_entries_account_entry_date` → สร้างใหม่บน `(account_id, entry_date)`
7. `DROP COLUMN account` + `DROP TYPE ledger_entries_account_enum`

`down()` ต้องย้อนได้จริง: สร้าง enum type กลับ → `ADD COLUMN account` → backfill ด้วย mapping
**ตัวกลับด้าน** (`new_code` → `old_code`) → `SET NOT NULL` → drop `account_id`

**สำคัญ — mapping นี้ freeze ตอนที่เขียน migration C เท่านั้น**: ถ้านักบัญชีขอย้าย role ผ่าน §3.2.1
*หลัง* migration C รันบน production ไปแล้ว ไม่กระทบ migration นี้เลย เพราะ backfill ใช้แค่ตอน
เปลี่ยนคอลัมน์ครั้งเดียว ledger แถวเก่าก็ยังชี้ `account_id` เดิมถูกต้อง (§3.2.1 บอกไว้แล้วว่ารายการ
เก่าไม่ย้อนกลับไปแก้)

### 6.4 ลำดับรันจริง

รันบน dev DB → `pnpm verify finance-bc` เขียว → รันบน production **ก่อน** deploy โค้ด (pipeline
รัน `migration:run` ก่อนอยู่แล้ว) · ก่อนแตะ production ให้ `pg_dump` ตาราง `ledger_entries` เก็บไว้
เพราะขั้นที่ 7 ลบคอลัมน์ทิ้งจริง · ทำ **inventory รายชื่อ deployment ลูกค้าจริง** ที่ต้องรัน migration
นี้ก่อนลงมือ (§10 ขั้นที่ 3) แล้วซ้อมบน dump ของแต่ละรายก่อนแตะของจริง

### 6.5 Seeder

`libs/database/src/scripts/seed/` ไม่ต้องแก้ (ไม่แตะ `erp_finance`) แต่ต้องรัน
`pnpm run seed -- --dry-run` ยืนยันว่าไม่พังตามกฎ

---

## 7 · Permission + กับดักลำดับ deploy — **ต้อง 2 deploy**

`.claude/rules/permissions.md` เตือนไว้ว่ากับดักนี้ทำให้เกิด 403 บน production มาแล้ว **2 ครั้ง**:
pipeline รัน `migration:run` **ก่อน** `permissions:sync` → grant migration ที่ `INSERT … JOIN
permissions` จะหาแถวไม่เจอ แล้ว grant ศูนย์ statement เงียบ ๆ พร้อมบันทึกตัวเองว่ารันแล้ว

**ครอบทั้ง 2 plane** (§4.3):

| Plane | Permission |
|---|---|
| api (finance-bc) | `gl_account:view`, `gl_account:create`, `gl_account:update`, `gl_account:delete` |
| ui (iam) | `page:view_gl_accounts`, `component:create_gl_account`, `component:delete_gl_account`, `component:move_gl_account_role` |

**ลำดับที่ปลอดภัย**:

1. **Deploy รอบ 1** — โค้ดทั้งหมด (finance-bc + iam) + migration A/B/C + `@RequirePermission()`
   ทั้ง 4 ตัว (api-plane) + `data-permission` ทั้ง 4 attribute (ui-plane) — ยังไม่มี grant migration
   → `permissions:sync` ตอนท้าย deploy สร้างแถวใน `erp_iam.permissions` ทั้งสอง plane พร้อมกัน
2. **Deploy รอบ 2** (commit แยก) — grant migration ที่ผูกทั้ง 8 permission เข้ากับ policy
   (ดู pattern จาก `ReapplyVatReturnPermissionsToMockPolicies`)

ระหว่างรอบ 1 กับ 2 ทั้งหน้า admin และ endpoint API จะยัง 403 อยู่ — ปกติและถูกต้อง อย่าพยายามลัดด้วย
การยัดรวม deploy เดียว ถ้าอยากปิดช่องเร็วกว่าที่จะรอ deploy รอบ 2 ให้ operator กด **Sync Permissions**
ที่หน้า iam Permissions แล้ว grant ผ่าน policy UI ได้เลยหลัง deploy รอบ 1 เสร็จ

---

## 8 · แผนเทส

### 8.1 Unit (`apps/finance-bc/test/unit/`)

- **ใหม่** `gl-account/gl-accounts.service.spec.ts` — สร้าง/แก้/ลบ, กติกา `is_locked`/`account_type`
  ตรงพ่อแม่/ความลึกไม่เกิน 5 ใน §3.5 และ §3.5.1, กันลบบัญชีที่มี ledger row, กันลบบัญชีที่มีลูก,
  nested-set rebuild ถูกต้องหลัง re-parent, `resolveIdByRole()` + cache invalidation, **ย้าย role
  (§3.2.1)**: ย้ายสำเร็จเคลียร์เจ้าของเดิมในทรานแซคชันเดียว, ปฏิเสธถ้าปลายทาง `account_type` ไม่ตรง
  `ROLE_REQUIRED_ACCOUNT_TYPE`, ปฏิเสธถ้าปลายทางเป็น `is_group`/`!is_active`
- **แก้ 4 ไฟล์เดิม** ที่ mock `GlAccount` → mock `GlAccountsService.resolveIdByRole()` แทน
- **เพิ่มใน `general-ledger.service.spec.ts`** — post ลงบัญชี `is_group=true` ต้องถูกปฏิเสธ,
  post ลงบัญชี `is_active=false` ต้องถูกปฏิเสธ

### 8.2 E2E (module-level, service mocked)

`apps/finance-bc/test/` — CRUD 7 endpoint ใหม่ (รวม `PATCH .../role`) + response shape ใหม่ของ
`/ledger-entries` และ `/trial-balances`

### 8.3 Smoke — **ไฟล์แรกของ finance-bc** (§1.4)

`apps/finance-bc/test/smoke/gl-accounts.smoke.mjs` — ก็อปโครงจาก
`apps/sales-bc/test/smoke/customers.smoke.mjs` ต้องยิงของจริงและครอบสิ่งที่ขั้น 1–5 มองไม่เห็น:

1. `GET /gl-accounts` → 200 · นับได้ ~130 บัญชี และ 14 บัญชีที่ถือ `account_role` ครบทุก role
   (ยืนยันว่า migration B รันจริงบน DB จริง ไม่ใช่แค่ผ่านบน dev)
2. `POST /gl-accounts` สร้างบัญชีลูกใหม่ใต้ node → 201 (ยืนยันว่า permission grant ทำงานจริง —
   §7 คือเหตุผลที่ข้อนี้สำคัญที่สุด)
3. `PATCH /gl-accounts/:id/role` ย้าย role จากบัญชี seed ไปบัญชีใหม่ที่เพิ่งสร้าง → 200 ·
   `GET` บัญชีเดิม ต้องเห็น `account_role: null` แล้ว (ยืนยันว่าเคลียร์เจ้าของเดิมจริง)
4. `DELETE` แถว `is_locked=true` → ต้องถูกปฏิเสธด้วย 409 ไม่ใช่ 500
5. `GET /trial-balances` → 200 และแต่ละแถวมี `code`/`name`/`account_type` ครบ
   (ยืนยันว่า join ใหม่ทำงานกับข้อมูลจริง)
6. ยิงเอกสารที่โพสต์ GL จริงหนึ่งใบ (เช่น submit AP Invoice) → เช็คใน DB ว่า `ledger_entries.account_id`
   ชี้ไปที่บัญชีที่ถูก role — **ข้อนี้คือข้อที่พิสูจน์ว่า refactor posting service ทั้ง 32 จุดไม่พัง**
   (ทำ**หลัง**ข้อ 3 เพื่อพิสูจน์ด้วยว่า posting เดินตาม role ที่ย้ายแล้ว ไม่ใช่ค้าง cache เก่า)

### 8.4 Admin UI — manual QA (ไม่มี automated test)

หน้า EJS + vanilla JS ของโปรเจกต์นี้ไม่มี automated test framework คลุมอยู่ (ตรวจแล้ว — `warehouses`
เองก็ไม่มี) รอบนี้ทำ checklist manual QA แทน: เปิด `/views/gl-accounts` เห็น tree 130 บัญชีถูก indent
ตามชั้น, expand/collapse ทำงาน, สร้าง/แก้/ลบบัญชีได้, ย้าย role ผ่าน dialog เห็นชื่อบัญชีเดิมที่จะถูก
ถอด role ก่อนยืนยัน, permission ทั้ง ui-plane ใช้งานได้หลัง deploy รอบ 2

### 8.5 เกณฑ์ปิดงาน

`pnpm verify finance-bc` เขียวครบ 6 ขั้น (ไม่ใช่ 5 ขั้น + smoke skipped แบบทุกวันนี้) + §8.4 QA
checklist ผ่านครบ

---

## 9 · ขอบเขตที่ **ไม่** อยู่ในรอบนี้

- **ยอดยกมา/ยอดสะสมต่อปีบัญชี** (`balances[]` แบบระบบอ้างอิง) — เป็นงาน reporting แยก ต้องออกแบบเรื่อง
  ปิดงวด/ปีบัญชีก่อน
- **งบการเงิน** (งบดุล/งบกำไรขาดทุน) ที่จัดกลุ่มตาม `account_type` + รวมยอดตาม subtree — ทำได้ง่ายขึ้น
  มากหลังงานนี้ (nested-set ทำให้ sum ทั้ง subtree เป็น query เดียว) แต่เป็นคนละงาน
- **import/export ผังบัญชี** (CSV/Excel) — ลูกค้าที่ย้ายจากระบบเดิมจะขอ แต่รอ requirement จริงก่อน
  (**D4**)
- **drag-and-drop re-parent, bulk/cascade delete ในหน้า admin** — ดู §4.4 (**C2**)
- **หนังสือรับรองหัก ณ ที่จ่าย** และ **เอกสารค่าใช้จ่ายทั่วไป** — อีก 2 ช่องว่างจากการเทียบระบบอ้างอิง
  (ดู `HANDOFF-Backlog-Reporting-Print-Tax.md` §5 สำหรับข้อแรก) (**D2/D3 อยู่ในนี้แล้ว**)

---

## 10 · ขนาดงานโดยประมาณ

| ขั้น | งาน | ประเมิน |
|---|---|---|
| 1 | entity + enums + migration A + รันบน dev | 1 วัน |
| 2 | เตรียม master data ผังมาตรฐาน ~130 บัญชี (รหัส/ชื่อ TH-EN/`account_type`/`normal_balance`/`lft`/`rgt`) + migration B — **ต้องผ่านนักบัญชีตรวจก่อนถือว่าจบ** | 1.5–2 วัน |
| 3 | inventory รายชื่อ deployment ลูกค้าจริง + ซ้อม migration C บน dump แต่ละราย | 0.5–1 วัน (ขึ้นกับจำนวนลูกค้า) |
| 4 | migration C จริง (backfill `ledger_entries` ผ่าน mapping + `down()`) | 0.5–1 วัน |
| 5 | `GlAccountsService` + controller + DTO + กติกา §3.5/§3.5.1 + ย้าย role §3.2.1 | 2–2.5 วัน |
| 6 | refactor posting service 5 ตัว (32 จุด) + `GeneralLedgerService` + `TrialBalancesService` | 1.5–2 วัน |
| 7 | Admin UI (iam): controller + 2 EJS + 2 JS + permission attributes | 2–3 วัน |
| 8 | unit + e2e + smoke ตัวแรก + manual QA UI | 2.5 วัน |
| 9 | `permissions:sync` + deploy รอบ 1 + grant migration (8 permission) + deploy รอบ 2 | 0.5–1 วัน |
| 10 | เอกสาร (`srs-p5.html`, `api-workflow-guide.html`, `HANDOFF-Feature.md`) | 0.5 วัน |
| | **รวม** | **13–16.5 วันทำงาน** |

ขั้นที่ 2 คืองานที่ประเมินยากที่สุด — ไม่ใช่เพราะเขียนโค้ดยาก แต่เพราะต้องให้นักบัญชีตรวจรายชื่อบัญชี
และ mapping ใน §3.3.1 ก่อน (ถ้าไม่ผ่านนักบัญชี ย้าย role แก้ทีหลังได้ผ่าน §3.2.1 อยู่แล้ว ไม่บล็อกยาว
เหมือนก่อนมีกลไกนี้ แต่ก็ยังต้องเริ่มจากรายชื่อที่พอใช้ได้)

ตัวเลขนี้ยาวกว่าประมาณการรอบแรก (~8–9 วัน) เพราะ 2 การตัดสินใจใหม่ (ย้าย role ได้ + ทำ UI เลย) เพิ่ม
งานจริง ไม่ใช่แค่เขียนแผนเพิ่ม — แลกกับ A2 ไม่เป็นคอขวดยาวอีกต่อไป และลูกค้าใช้ระบบได้จริงจบในรอบเดียว
ไม่ต้องรอ ticket ต่อสำหรับ UI

---

## 11 · Log การตัดสินใจ

รอบแรก (ก่อนคุยละเอียด): ล็อก **1 deployment ต่อ 1 ลูกค้า**, seed เต็มชุด ~130 บัญชี, ตัดเรื่อง
tenant/multi-company ออกจากขอบเขตถาวร (ไม่มีในตารางไหนเลย ไม่ต้องพิจารณาอีก)

รอบสอง (คุยประเด็นที่เหลือ 2026-09-06) — เคาะครบทุกจุด:

| # | คำถาม | คำตอบ |
|---|---|---|
| A1 | ใครร่างรายชื่อผัง ~130 บัญชี | ผมร่าง (§3.3) → ส่งนักบัญชีตรวจรอบเดียว |
| A2 | mapping 14 role ผิดใจนักบัญชีจะทำยังไง | ไม่บล็อกอีกต่อไป — ย้ายผ่าน §3.2.1 ได้เลย |
| A3 | ผังตั้งต้นชุดเดียวหรือแยกตามธุรกิจ | ชุดเดียว ลูกค้าลบเองได้ |
| A4 | ก่อนรัน migration C บน production ต้องรู้อะไร | inventory รายชื่อ deployment ลูกค้าจริงก่อน (§10 ขั้นที่ 3) |
| B1 | บังคับรูปแบบรหัสบัญชีไหม | ไม่บังคับ |
| B2 | ลูกต้อง `account_type` เดียวกับแม่ไหม | บังคับ (§3.5.1) |
| B3 | จำกัดความลึกกี่ชั้น | 5 |
| B4 | แก้รหัสบัญชีที่มี ledger แล้วได้ไหม | ได้ |
| B5 | ย้าย `account_role` ข้ามบัญชีได้ไหม | **ได้ — อยู่ในรอบนี้** (§3.2.1) |
| B6 | response shape ใหม่ 2 endpoint | เปลี่ยนตรง ๆ ไม่ทำ backward-compat |
| C1 | `/gl-accounts/tree` คืนทั้งต้นหรือ lazy | ทั้งต้น |
| C2 | ลบทีละใบหรือ bulk | ทีละใบก่อน |
| C3 | smoke ต้องครอบ flow อื่นด้วยไหม | ต้องมี — submit เอกสารจริงเช็ค `ledger_entries.account_id` |
| C4 | ช่วง 403 ระหว่าง 2 deploy | ยอมรับ ใช้ Sync Permissions + policy UI แก้เร็วได้ถ้าจำเป็น |
| D1 | ทำ admin UI รอบนี้ไหม | **ทำ** (§4) |
| D2–D4 | ยอดยกมา/งบการเงิน/import-export | backlog (§9) |

**สิ่งที่ยังไม่ปิดจริง ๆ (ไม่ใช่การตัดสินใจ — เป็นงานที่ต้องลงมือทำ)**: A1 (ร่างรายชื่อ 130 บัญชีจริง
ยังไม่ได้เขียน มีแค่โครงหมวดใน §3.3) และ A4 (inventory รายชื่อ deployment ลูกค้ายังไม่ได้ทำ) — ทั้งคู่
อยู่ใน §10 ขั้นที่ 2–3 ของงาน implement ไม่ใช่สิ่งที่ต้องเคาะเพิ่มก่อนเริ่ม
