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
> **สถานะ**: ยังไม่เริ่ม implement — รออนุมัติแผนนี้ก่อน

---

## 0 · สรุปสั้น

| หัวข้อ | สาระ |
|---|---|
| ปัญหา | ผังบัญชีเป็น **enum ปิด 14 รหัส** (`GlAccount`) ลูกค้าเพิ่ม/แก้บัญชีเองไม่ได้ — ลูกค้าใหม่ที่มีผังบัญชีต่างจาก 14 รหัสนี้ ต้องแก้โค้ด + deploy ใหม่ทุกครั้ง |
| ทางแก้ | เปลี่ยนเป็นตาราง `gl_accounts` (tree, nested-set) + enum ใหม่ `GlAccountRole` ให้ posting rule อ้างอิง **บทบาท** แทนรหัสบัญชี |
| ขนาด | อยู่ใน finance-bc ที่เดียว · ~1–2 สัปดาห์รวมเทส · ไม่กระทบ BC อื่นเลย |
| ความเสี่ยงหลัก | migration ที่ต้อง backfill `ledger_entries` (ตาราง append-only ที่มีข้อมูลจริง) + กับดักลำดับ deploy ของ permission (ต้อง 2 deploy) |
| Seed | ผังบัญชีมาตรฐาน SME ไทยเต็มชุด ~130 บัญชี (ตัดสินใจแล้ว — ดู §3.3) |

**ลำดับที่แนะนำ**: §5 migration → §4 refactor posting services → §3.6 API ใหม่ → §7 เทส (รวม smoke ตัวแรกของ finance-bc) → deploy รอบ 1 → §6 grant migration → deploy รอบ 2

---

## 1 · สถานะโค้ดจริงวันนี้ (ตรวจแล้ว 2026-09-06)

### 1.1 `GlAccount` — enum ปิด 14 ค่า ไม่ใช่ตาราง

`apps/finance-bc/src/modules/general-ledger/enums/gl-account.enum.ts` — 14 รหัส (ไม่ใช่ 15 ตามที่พูดไว้
ตอนคุยกัน): `1010` Cash, `1130` AR, `1150` Inventory, `1160` InputVat, `1180` WHT Receivable,
`2110` AP, `2130` OutputVat, `2140` WHT Payable, `4100` SalesRevenue, `4300`/`4301` FX Gain
(realised/unrealised), `5100` COGS, `5300`/`5301` FX Loss (realised/unrealised)

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

ตอนคุยกันผมบอกว่า "ยังไม่มี endpoint งบทดลอง" — **ผิด** ของจริงมีอยู่แล้ว:
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
(`/ledger-entries`, `/trial-balances`) ซึ่งต้องประกาศใน `api-workflow-guide.html` ตอนปิดงาน

### 1.4 finance-bc **ยังไม่มี smoke file เลยสักไฟล์** — `verify` ขั้นที่ 6 ข้ามทุกครั้ง

`apps/finance-bc/test/smoke/` **ไม่มีอยู่จริง** (มีแค่ `apps/sales-bc/test/smoke/`) —
`scripts/verify.mjs` จึงรายงานขั้น smoke เป็น *skipped* พร้อมข้อความ "no smoke files in
apps/finance-bc/test/smoke/ — a feature is not verified until one exercises it against the running
service"

แปลว่าทุกอย่างที่ทำใน finance-bc ที่ผ่านมา **ไม่เคยผ่านขั้นที่ 6 เลย** งานนี้ต้องสร้าง smoke file
ตัวแรกของ finance-bc ไปด้วย (ดู §7.3)

### 1.5 finance-bc ยังไม่มี precedent การ seed master data

`grep` หา `INSERT INTO tax_configs` — ไม่เจอ · `libs/database/src/scripts/seed/` ครอบคลุมแค่
`erp_inventory` + `erp_supplier` เท่านั้น (15 seeders) แปลว่า `gl_accounts` จะเป็น master data ชุดแรก
ของ finance-bc ที่ต้องมีข้อมูลตั้งต้น — และต้อง seed ผ่าน **migration** ไม่ใช่ seed script (ดู §5.2)

---

## 2 · ขอบเขต

**1 deployment ต่อ 1 ลูกค้า** — ลูกค้าแต่ละรายมี Postgres ของตัวเองอยู่แล้ว ผังบัญชีจึงเป็นข้อมูลธรรมดา
ในตารางเดียว ไม่มี scope key ใด ๆ เพิ่ม

---

## 3 · ดีไซน์ที่จะทำ

### 3.1 ตารางใหม่ `gl_accounts`

ใช้ pattern tree เดิมของโปรเจกต์ (`item_groups`, `warehouses` — nested-set `lft`/`rgt` + rebuild
เต็มต้นทุกครั้งที่ insert/re-parent/delete ผ่าน `@lib/common/utils/nested-set/rebuild-nested-set.util.ts`)
ไม่ประดิษฐ์ pattern ใหม่:

| คอลัมน์ | ชนิด | หมายเหตุ |
|---|---|---|
| `id` | uuid | จาก `BaseEntity` |
| `code` | varchar(20) | รหัสบัญชี `"1010"`, `"5470-11"` — `@Unique('uq_gl_accounts_code')` |
| `name_th` / `name_en` | varchar(255) | i18n แบบ flat ตามกฎโปรเจกต์ (interceptor ยุบเป็น `{ th, en }` ตอน response) |
| `parent_gl_account_id` | uuid null | บัญชีแม่ (null = root) · self-FK `fk_gl_accounts_parent_gl_account_id` |
| `lft` / `rgt` | int | nested-set bounds (ระบบคำนวณ) |
| `is_group` | boolean | true = node (บัญชีคุม, ลงรายการไม่ได้) · false = leaf (ลงรายการได้) — ตรงกับธงบัญชีคุมของระบบอ้างอิง และกฎ "เฉพาะ leaf ที่ผูกสินค้าได้" ของ `item_groups` |
| `account_type` | enum | `ASSET` \| `LIABILITY` \| `EQUITY` \| `REVENUE` \| `EXPENSE` |
| `normal_balance` | enum | `DEBIT` \| `CREDIT` — **ไม่ derive จาก `account_type`** ดู §3.1.1 |
| `account_role` | enum null | `GlAccountRole` — หัวใจของดีไซน์ ดู §3.2 |
| `is_locked` | boolean | true = แถวระบบ seed มา posting rule พึ่งอยู่ ห้ามลบ/ห้ามเปลี่ยน `account_role` (= ธงบัญชีระบบของระบบอ้างอิง) |
| `is_active` | boolean | ปิดใช้งานโดยไม่ลบ (เอกสารเก่าที่อ้างอยู่ไม่กระทบ) — pattern เดียวกับ `tax_configs.is_active` |
| `note_th` / `note_en` | text null | หมายเหตุ |

Index: `idx_gl_accounts_parent_gl_account_id`, `idx_gl_accounts_account_type`
· partial unique index `uq_gl_accounts_account_role` บน `(account_role) WHERE account_role IS NOT NULL
AND is_deleted = false` — **หนึ่ง role มีได้บัญชีเดียว** คือสิ่งที่ทำให้ `resolveByRole()` ใน §3.2
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

### 3.3 Seed — **ผังบัญชีมาตรฐาน SME ไทยเต็มชุด** (ตัดสินใจแล้ว 2026-09-06)

ตัดสินใจแล้วว่า **seed เต็มชุด ~130 บัญชี** ไม่ใช่แค่ 14 แถวขั้นต่ำ เหตุผล: ลูกค้าเปิดระบบมาแล้ว
ลงบัญชีได้เลยโดยไม่ต้องสร้างผังเอง (เป็นจุดขายตอน demo) และบัญชีที่ไม่ได้ใช้ลูกค้าลบทิ้งเองได้อยู่แล้ว
เพราะไม่ `is_locked` — ต่างจากทางเลือก "14 แถวขั้นต่ำ" ที่ผลักภาระตั้งผังทั้งหมดไปให้ลูกค้าตอน onboard

โครงสร้างที่ seed (เลขหมวดเป็นมาตรฐานบัญชี SME ไทยทั่วไป ไม่ได้ลอกจากระบบใดระบบหนึ่ง):

| หมวด | ช่วงรหัส | `account_type` | ตัวอย่างชั้นถัดไป |
|---|---|---|---|
| สินทรัพย์ | `1000-00` | ASSET | `1100-00` หมุนเวียน → `1110-00` เงินสด/ธนาคาร → `1111-01` เงินสด |
| หนี้สิน | `2000-00` | LIABILITY | `2100-00` หมุนเวียน → `2120-00` เจ้าหนี้ → `2120-01` เจ้าหนี้การค้า |
| ส่วนของผู้ถือหุ้น | `3000-00` | EQUITY | `3100-00` ทุน, `3200-00` กำไรสะสม, `3300-00` กำไร(ขาดทุน) |
| รายได้ | `4000-00` | REVENUE | `4100-00` รายได้จากการขาย-สุทธิ → `4100-01` รายได้จากการขาย |
| ค่าใช้จ่าย | `5000-00` | EXPENSE | `5100-00` ต้นทุนขาย, `5400-00` ค่าใช้จ่ายบริหาร → `5411-01` เงินเดือน |

ลึก 3–4 ชั้น · node ทุกตัว `is_group = true` (ลงรายการไม่ได้) · เฉพาะ leaf ที่ `is_group = false`

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

**คอลัมน์ "รหัสเดิมใน enum" ไม่ใช่ของประดับ** — มันคือ mapping ที่ §5.3 ใช้ backfill ข้อมูล
`ledger_entries` ที่มีอยู่จริง ห้ามทิ้ง

**หมายเหตุ 3 ข้อที่ต้องยืนยันกับนักบัญชีก่อนลงมือ:**

1. `2132-00` ภาษีหัก ณ ที่จ่ายค้างจ่าย — ผังมาตรฐานมักแตกลูกตามแบบยื่น (ภ.ง.ด.1/2/3/53) แต่ระบบวันนี้
   ยังแยกประเภทเงินได้ไม่ได้ (ยังไม่มี `tax_configs.income_type`) จึง seed เป็น **leaf ตัวเดียว** ไปก่อน
   เมื่องานหนังสือรับรองหัก ณ ที่จ่ายลงจริง ค่อยแตกเป็น node + ลูกตามแบบ แล้วย้าย role ลงลูกตัวที่ใช้
   (ต้องมี migration ย้าย role ตอนนั้น — ดู §10 ข้อ 1)
2. `4200-10` / `5470-13` (FX ที่ยังไม่เกิดขึ้นจริง) — **ผังมาตรฐานทั่วไปไม่มี 2 บัญชีนี้** เราเพิ่มเอง
   ตามเหตุผลใน docblock ของ enum เดิม: กำไร/ขาดทุน FX ที่ยังไม่เกิดขึ้นจริง (TFRS 21 ตีราคาปลายงวด)
   ต้องแยกจากที่เกิดขึ้นจริง ไม่งั้นผู้สอบบัญชีอ่านงบทดลองแล้วแยกไม่ออก
3. `Inventory` → `1140-02` (สินค้าสำเร็จรูป) เหมาะกับธุรกิจซื้อมาขายไป — ถ้าลูกค้าเป็นโรงงานผลิตอาจ
   ต้องเป็น `1140-01` วัตถุดิบ หรือ `1140-03` งานระหว่างทำ ตามชนิดสินค้า ซึ่งระบบวันนี้ยังไม่แยก

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

| การกระทำ | แถว `is_locked=true` (14 แถวระบบ) | แถวที่ผู้ใช้สร้างเอง |
|---|---|---|
| แก้ `code`, `name_th/en`, `note` | ได้ | ได้ |
| ย้าย parent (re-parent) | ได้ | ได้ |
| แก้ `account_role` | **ไม่ได้** | ตั้งได้เฉพาะ role ที่ยังว่าง |
| แก้ `account_type` / `normal_balance` | **ไม่ได้** | ได้ ถ้ายังไม่มี ledger row |
| ลบ | **ไม่ได้** | ได้ เฉพาะเมื่อไม่มี ledger row และไม่มีลูก |
| ปิด `is_active` | **ไม่ได้** | ได้ |

ทุกข้อบังคับที่ service ด้วย exception ที่เจาะจง (`ConflictException`/`BadRequestException` ตามกฎ
error handling) ไม่ใช่แค่ DB constraint — ข้อความต้องบอกเหตุผล เช่น "ลบไม่ได้: บัญชีนี้มีรายการใน
สมุดรายวัน 1,284 รายการ"

### 3.6 API

**เพิ่มใหม่** (module `gl-account` ใน finance-bc):

| Endpoint | Permission |
|---|---|
| `GET /gl-accounts` (paginated + filter) | `gl_account:view` |
| `GET /gl-accounts/:id` | `gl_account:view` |
| `GET /gl-accounts/tree` (ทั้งต้นเรียงตาม nested-set) | `gl_account:view` |
| `POST /gl-accounts` | `gl_account:create` |
| `PATCH /gl-accounts/:id` | `gl_account:update` |
| `DELETE /gl-accounts/:id` | `gl_account:delete` |

**เปลี่ยน response** (ทั้งสองเป็น breaking change ต่อ client ที่อ่าน field เดิม):

- `GET /ledger-entries` — `account: "1010"` → `account_id: "<uuid>"` + nested `account: { code,
  name: { th, en }, account_type }` (join มาให้เลย เพราะ client ต้องใช้ทุกครั้งอยู่แล้ว)
- `GET /trial-balances` — แต่ละแถวเพิ่ม `account_id`, `code`, `name`, `account_type`,
  `normal_balance` และเรียงตาม `code`

---

## 4 · ผลกระทบต่อไฟล์ที่มีอยู่ (checklist ตอน implement)

**สร้างใหม่** — `apps/finance-bc/src/modules/gl-account/`: entity, enums (`GlAccountRole`,
`GlAccountType`, `NormalBalance`), dto (create/update/query/response), service, controller,
constants (swagger), module + ลงทะเบียนใน `finance-bc.module.ts`

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

## 5 · แผน migration (ลำดับสำคัญมาก)

`libs/database/src/migrations/erp_finance/` — ทุกไฟล์ใช้ timestamp จริงจาก
`node -e "console.log(Date.now())"` ห้ามแต่งเลข (ล่าสุดในโฟลเดอร์คือ `1788622456246`)

### 5.1 Migration A — สร้างตาราง (generate)

```bash
pnpm run migration:generate:finance --name=CreateGlAccounts
```

รีวิว SQL ที่ได้ก่อนเสมอ · partial unique index ของ `account_role` (§3.1) generator มักไม่ออกให้ —
ต้องเติมมือ

### 5.2 Migration B — seed ผังมาตรฐาน ~130 บัญชี (hand-written, ดู §3.3)

`migration:create` เพราะเป็น DML ที่ generator มองไม่เห็น · UUID/`lft`/`rgt` คงที่ตาม §3.3.2 ·
`down()` = `DELETE FROM gl_accounts`

**ทำไม seed ที่นี่ ไม่ใช่ที่ `scripts/seed/`**: seed script เป็น *demo data* (ธุรกิจเกษตรไทย) ที่
รันหรือไม่รันก็ได้ แต่ 14 บัญชีที่ถือ `account_role` คือข้อมูลที่**ระบบโพสต์บัญชีไม่ได้เลยถ้าไม่มี** —
ต้องมาพร้อม schema ทุก deployment เสมอ และในเมื่อ 14 บัญชีนั้นเป็น leaf ของผังมาตรฐานอยู่แล้ว
(§3.3.1) ก็ seed ทั้งผังไปพร้อมกันในไฟล์เดียว ไม่ต้องแยกสองที่

### 5.3 Migration C — ย้าย `ledger_entries.account` → `account_id` (hand-written)

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

### 5.4 ลำดับรันจริง

รันบน dev DB → `pnpm verify finance-bc` เขียว → รันบน production **ก่อน** deploy โค้ด (pipeline
รัน `migration:run` ก่อนอยู่แล้ว) · ก่อนแตะ production ให้ `pg_dump` ตาราง `ledger_entries` เก็บไว้
เพราะขั้นที่ 7 ลบคอลัมน์ทิ้งจริง

### 5.5 Seeder

`libs/database/src/scripts/seed/` ไม่ต้องแก้ (ไม่แตะ `erp_finance`) แต่ต้องรัน
`pnpm run seed -- --dry-run` ยืนยันว่าไม่พังตามกฎ

---

## 6 · Permission + กับดักลำดับ deploy — **ต้อง 2 deploy**

`.claude/rules/permissions.md` เตือนไว้ว่ากับดักนี้ทำให้เกิด 403 บน production มาแล้ว **2 ครั้ง**:
pipeline รัน `migration:run` **ก่อน** `permissions:sync` → grant migration ที่ `INSERT … JOIN
permissions` จะหาแถวไม่เจอ แล้ว grant ศูนย์ statement เงียบ ๆ พร้อมบันทึกตัวเองว่ารันแล้ว

**ลำดับที่ปลอดภัยสำหรับ 4 permission ใหม่** (`gl_account:view/create/update/delete`):

1. **Deploy รอบ 1** — โค้ดทั้งหมด + migration A/B/C + `@RequirePermission()` ทั้ง 4 ตัว
   (ยังไม่มี grant migration) → `permissions:sync` ตอนท้าย deploy สร้างแถวใน `erp_iam.permissions`
2. **Deploy รอบ 2** (commit แยก) — grant migration ที่ผูก 4 permission เข้ากับ policy
   (ดู pattern จาก `ReapplyVatReturnPermissionsToMockPolicies`)

ระหว่างรอบ 1 กับ 2 endpoint ใหม่จะยัง 403 อยู่ — ปกติและถูกต้อง อย่าพยายามลัดด้วยการยัดรวม deploy เดียว

---

## 7 · แผนเทส

### 7.1 Unit (`apps/finance-bc/test/unit/`)

- **ใหม่** `gl-account/gl-accounts.service.spec.ts` — สร้าง/แก้/ลบ, กติกา `is_locked` ทั้ง 6 ข้อ
  ใน §3.5, กันลบบัญชีที่มี ledger row, กันลบบัญชีที่มีลูก, nested-set rebuild ถูกต้องหลัง re-parent,
  `resolveIdByRole()` + cache invalidation, กันตั้ง role ซ้ำ
- **แก้ 4 ไฟล์เดิม** ที่ mock `GlAccount` → mock `GlAccountsService.resolveIdByRole()` แทน
- **เพิ่มใน `general-ledger.service.spec.ts`** — post ลงบัญชี `is_group=true` ต้องถูกปฏิเสธ,
  post ลงบัญชี `is_active=false` ต้องถูกปฏิเสธ

### 7.2 E2E (module-level, service mocked)

`apps/finance-bc/test/` — CRUD 6 endpoint ใหม่ + response shape ใหม่ของ `/ledger-entries`
และ `/trial-balances`

### 7.3 Smoke — **ไฟล์แรกของ finance-bc** (§1.5)

`apps/finance-bc/test/smoke/gl-accounts.smoke.mjs` — ก็อปโครงจาก
`apps/sales-bc/test/smoke/customers.smoke.mjs` ต้องยิงของจริงและครอบสิ่งที่ขั้น 1–5 มองไม่เห็น:

1. `GET /gl-accounts` → 200 · นับได้ ~130 บัญชี และ 14 บัญชีที่ถือ `account_role` ครบทุก role
   (ยืนยันว่า migration B รันจริงบน DB จริง ไม่ใช่แค่ผ่านบน dev)
2. `POST /gl-accounts` สร้างบัญชีลูกใหม่ใต้ node → 201 (ยืนยันว่า permission grant ทำงานจริง —
   §6 คือเหตุผลที่ข้อนี้สำคัญที่สุด)
3. `DELETE` แถว `is_locked=true` → ต้องถูกปฏิเสธด้วย 409 ไม่ใช่ 500
4. `GET /trial-balances` → 200 และแต่ละแถวมี `code`/`name`/`account_type` ครบ
   (ยืนยันว่า join ใหม่ทำงานกับข้อมูลจริง)
5. ยิงเอกสารที่โพสต์ GL จริงหนึ่งใบ (เช่น submit AP Invoice) → เช็คใน DB ว่า `ledger_entries.account_id`
   ชี้ไปที่บัญชีที่ถูก role — **ข้อนี้คือข้อที่พิสูจน์ว่า refactor posting service ทั้ง 32 จุดไม่พัง**

### 7.4 เกณฑ์ปิดงาน

`pnpm verify finance-bc` เขียวครบ 6 ขั้น (ไม่ใช่ 5 ขั้น + smoke skipped แบบทุกวันนี้)

---

## 8 · ขอบเขตที่ **ไม่** อยู่ในรอบนี้

- **ยอดยกมา/ยอดสะสมต่อปีบัญชี** (`balances[]` แบบระบบอ้างอิง) — เป็นงาน reporting แยก ต้องออกแบบเรื่อง
  ปิดงวด/ปีบัญชีก่อน
- **งบการเงิน** (งบดุล/งบกำไรขาดทุน) ที่จัดกลุ่มตาม `account_type` + รวมยอดตาม subtree — ทำได้ง่ายขึ้น
  มากหลังงานนี้ (nested-set ทำให้ sum ทั้ง subtree เป็น query เดียว) แต่เป็นคนละงาน
- **import/export ผังบัญชี** (CSV/Excel) — ลูกค้าที่ย้ายจากระบบเดิมจะขอ แต่รอ requirement จริงก่อน
- **หน้า admin UI** สำหรับจัดการผังบัญชี — งานนี้ทำแค่ API (ถ้าจะทำ UI ใช้ skill `init-view`)
- **หนังสือรับรองหัก ณ ที่จ่าย** และ **เอกสารค่าใช้จ่ายทั่วไป** — อีก 2 ช่องว่างจากการเทียบระบบอ้างอิง
  (ดู `HANDOFF-Backlog-Reporting-Print-Tax.md` §5 สำหรับข้อแรก)

---

## 9 · ขนาดงานโดยประมาณ

| ขั้น | งาน | ประเมิน |
|---|---|---|
| 1 | entity + enums + migration A + รันบน dev | 1 วัน |
| 2 | เตรียม master data ผังมาตรฐาน ~130 บัญชี (รหัส/ชื่อ TH-EN/`account_type`/`normal_balance`/`lft`/`rgt`) + migration B | 1–1.5 วัน |
| 3 | migration C (backfill `ledger_entries` ผ่าน mapping + `down()`) | 0.5–1 วัน |
| 4 | `GlAccountsService` + controller + DTO + กติกา §3.5 | 1.5–2 วัน |
| 5 | refactor posting service 5 ตัว (32 จุด) + `GeneralLedgerService` + `TrialBalancesService` | 1.5–2 วัน |
| 6 | unit + e2e + smoke ตัวแรก | 2 วัน |
| 7 | `permissions:sync` + deploy รอบ 1 + grant migration + deploy รอบ 2 | 0.5–1 วัน |
| 8 | เอกสาร (`srs-p5.html`, `api-workflow-guide.html`, `HANDOFF-Feature.md`) | 0.5 วัน |
| | **รวม** | **8.5–11 วันทำงาน** |

ขั้นที่ 2 คืองานที่ประเมินยากที่สุด — ไม่ใช่เพราะเขียนโค้ดยาก แต่เพราะต้องให้นักบัญชีตรวจรายชื่อบัญชี
และ mapping ใน §3.3.1 ก่อน ถ้าตรวจแล้วต้องขยับบัญชีที่ role เกาะอยู่ migration C จะเปลี่ยนตามทันที

---

## 10 · จุดที่ต้องตัดสินใจตอน implement

1. **ย้าย `account_role` ข้ามบัญชีได้ไหม?** เช่นลูกค้าอยากให้ role `Cash` ไปเกาะบัญชีที่เขาสร้างเอง
   แทน `1111-01` ที่ seed มา — ถ้าให้ทำได้ต้องมี endpoint ย้าย role (พร้อมกติกาว่าย้ายแล้วรายการเก่า
   ไม่ย้อนกลับไปแก้) · **แนะนำ: รอบนี้ยังไม่ต้อง** ให้แก้ `code`/ชื่อ ของบัญชีที่ถือ role เอาก็พอ
   ได้ผลเหมือนกันโดยไม่ต้องมีกลไกใหม่ — แต่ตอนงานหนังสือรับรองหัก ณ ที่จ่ายลง (§3.3.1 หมายเหตุ 1)
   จะต้องมีกลไกนี้แน่นอน
2. **`GET /gl-accounts/tree` คืนทั้งต้นเลย หรือ lazy ทีละชั้น?** ~130 บัญชีคืนทั้งต้นได้สบาย —
   แนะนำคืนทั้งต้น (เรียงตาม `lft`) ให้ client ประกอบเอง
3. **ลบบัญชีที่ seed มาแต่ไม่ได้ใช้ ทำเป็น bulk ได้ไหม?** ลูกค้าที่ไม่ใช้ผังฝั่งโรงงาน (`5500-xx`
   ค่าใช้จ่ายการผลิต) จะอยากลบทีเดียวทั้งกิ่ง — ถ้าไม่ทำ bulk ต้องลบทีละใบจากล่างขึ้นบน
   (กติกา §3.5 ห้ามลบบัญชีที่มีลูก) · แนะนำเริ่มจากลบทีละใบก่อน แล้วดูว่าลูกค้าจริงบ่นไหม
