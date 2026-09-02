# HANDOFF — สถานะงานและแผนต่อ

> **ไฟล์ชั่วคราวสำหรับส่งต่อ session** — ไม่ใช่เอกสารของ product · ลบทิ้งได้เมื่องานที่ค้างในนี้จบ
> เขียนเมื่อ 2026-09-02 · **แก้ล่าสุด 2026-09-02 (P2#5 + #6 + #7 — ปิด P2 audit ครบ · commit + push + deploy แล้ว)**
> ก่อนหน้า: 2026-09-01 (C3 + currency enum + FX audit + P2#4 + column contracts + credit column precision)
>
> **P2 audit ปิดครบ 100% แล้ว** — ไม่มีงาน currency/FX ที่ค้างต้องทำต่อ · เหลือแต่ backlog P3–P4 (ต้องมี
> ตัวขับ/ต้องถามลูกค้า) + งานเก็บกวาดเล็ก ๆ (ดู §"เหลืออะไร" ท้ายหัวข้อ P2#5/#6/#7)

---

## 1 · สถานะล่าสุด

ทั้งสอง repo push แล้ว ตรงกัน — **HEAD ปัจจุบันเป็น commit เรื่อง pgpool/HA ของผู้ใช้เอง** ทำต่อบนงาน
currency/column-contracts ของรอบนี้ (ไม่เกี่ยวกับเนื้อหาไฟล์นี้ ไม่ต้องอ่าน):

| Repo | HEAD ปัจจุบัน | commit ล่าสุดของงานรอบนี้ |
|---|---|---|
| `iotechsoft-company/erp-api` | `d7efab1` fix(install-pgpool): … | `3c22b48` refactor: shared column contracts, currency on pre-booking documents, 4-decimal credit columns |
| `iots1/plan-erp` (submodule) | `80e305c` docs: record HA drill results, … | `f87d102` docs: shared column contracts, currency on pre-booking documents, money precision |

**สุขภาพระบบตอนนี้** (ยืนยันแล้วทั้งหมด ไม่ใช่เดา · รันซ้ำหลัง P2#5/#6/#7):

- **1474 tests / 108 suites ผ่านทั้งหมด** (+20 จากรอบ P2 — 8 leaf util + 12 service)
- **sales/supplier/finance `migration:generate` = `No changes`** หลังรัน migration รอบนี้ (4 ตัว) ·
  inventory/iam/auth ไม่แตะ
- boot จริงผ่านทั้ง 4 BC ที่แตะ — `finance-bc` 55 routes · `sales-bc` 46 · `supplier-bc` 26 · `report-bc` 18 · DI resolve ครบ ไม่มี error (ไม่มี endpoint ใหม่)
- eslint **0 error 0 warning** (warning เดิมที่ `jest-setup-env.js:67` ถูก `--fix` ไปแล้ว)
- eslint เหลือ **1 warning เดิม** ที่ไม่เกี่ยวข้อง (`libs/common/test/jest-setup-env.js:67` — unused eslint-disable directive)
- endpoint รวม **308 เส้น** และตาราง index ใน `api-workflow-guide.html` ตรงกับหัวข้อทุก BC (ตรวจทีละแถวแล้ว)

**สิ่งที่ทำเสร็จในรอบก่อนหน้า** (ทั้งหมด implement + test + เอกสารครบ): Purchase Return, stock period
lock, AP Invoice + 3-way match, Credit Limit (SO), เพดาน WHT ที่ payment, Receipt↔Delivery Note
match, due_date + AR/AP aging, reorder alert job, VAT registration enforcement, Sales Return +
partial COGS reversal, D1–D3 (credit re-check ตอนส่งของ / price tolerance ตั้งค่าได้ + หน้า UI /
เพดานอนุมัติใบปรับยอดสต็อก), vendor credit note, **C3 multi-currency ตอนตัดชำระ + realised FX, currency
enum ระดับ DB, FX audit (P1 แก้ 3 ข้อ), P2#4 (FX บน quotation/SO/PO), shared column contracts (7
interface), credit column precision → numeric(18,4), **P2#5 (raw_* ระดับบรรทัด) + P2#6 (currency ใน
print) + P2#7 (party_currency_enforcement ตั้งค่าได้) — ปิด P2 audit ครบ (รอบ 2026-09-02 ยังไม่ commit)**

---

## 2 · งานที่ค้าง — เรียงตามที่แนะนำให้ทำ

### ~~C3 · multi-currency ตอนตัดชำระ~~ ✅ **เสร็จแล้ว 2026-09-01**

ลูกค้าตอบคำถามทั้ง 4 ข้อครบแล้ว (ผ่าน `AskUserQuestion` แบบ D1–D3) และ implement ตามคำตอบเรียบร้อย:

| คำถาม | คำตอบที่ได้ |
|---|---|
| ขายเป็นสกุลต่างประเทศจริงไหม | **มี** (USD/อื่น) → ทำ C3 |
| FX gain/loss ลงบัญชีอะไร | **แยกสองบัญชี `4300` กำไร / `5300` ขาดทุน** ตามธรรมเนียม Thai SME — ตั้งเป็นมาตรฐานของแพลตฟอร์ม |
| ใช้อัตราไหนตอนตัดชำระ | **ผู้ใช้กรอกเองต่อใบจ่าย** (อัตราที่ธนาคารให้จริง) เทียบกับ snapshot บนใบกำกับเพื่อหา FX |
| ซื้อเป็นสกุลต่างประเทศด้วยไหม | **ทั้งซื้อและขาย** → `ap_invoices` ได้ `raw_*` ครบชุดด้วย |

**แกนของสิ่งที่ทำ — สองอัตรา ไม่ใช่อัตราเดียว** (นี่คือส่วนที่ต้องเข้าใจก่อนแก้อะไรต่อ):

- เอกสาร (`receipts`/`ap_invoices`) snapshot อัตราที่ **หนี้ถูกบันทึก**
- `payment_entries` มี `currency_rate` ของตัวเอง = อัตราที่ **เงินเคลื่อนไหวจริง**
- ผลต่างของสองอัตรานี้ **เฉพาะบนส่วนที่ตัดหนี้จริง** = realised FX → `4300`/`5300`

**invariant ย้ายไปฝั่ง `raw_*` ทั้งชุด** — `chk_payment_entries_allocated_within_settleable` (THB)
ถูก **drop** แล้วแทนด้วย `chk_payment_entries_raw_allocated_within_settleable` เพราะฝั่ง THB
*ไม่ถูกต้อง*เมื่อมีสองอัตรา: ใบ USD 100 บันทึกไว้ที่ 35 (AR 3,500) จ่ายครบที่ 36 (เงินสด 3,600)
จะถูกปฏิเสธว่าเกินยอดทั้งที่ปิดหนี้พอดี และในทางกลับกันจะปล่อยยอดขาดจริงผ่าน

**คอลัมน์ THB บน `payment_entries` ไม่ใช่การแปลงตรงๆ จาก `raw_*` — จุดเดียวในแพลตฟอร์มที่เป็นแบบนี้:**

| คอลัมน์ | อัตราที่ใช้ | เหตุผล |
|---|---|---|
| `paid_amount` / `wht_amount` | ของ**ใบจ่ายนี้** | เงินสดเคลื่อนที่อัตรานั้น · WHT certificate ออกตามอัตราวันจ่าย |
| `allocated_amount` | ของ**แต่ละใบที่ถูกตัด** | ต้องลด AR/AP ด้วยมูลค่าที่บันทึกไว้จริง ไม่งั้นใบที่จ่ายครบจะเหลือเศษค้างใน AR ที่ไม่มีใบจ่ายไหนล้างได้ |
| `unallocated_amount` | ของ**ใบจ่ายนี้** | ยังไม่ปิดหนี้ใบใด จึงยังไม่เกิด FX |

ดังนั้น `allocated + unallocated ≠ paid + wht` เมื่ออัตราต่างกัน — **ช่องว่างนั้นคือ FX พอดี** และ
`PaymentGlPostingService` คิดเป็น **residual** (`fx = (paid+wht) − allocated − unallocated`)
ไม่ใช่คำนวณซ้ำจากอัตรา เพื่อให้ voucher balance ถึงระดับสตางค์โดยโครงสร้าง ไม่ขึ้นกับการปัดเศษ
· เมื่อ `currency=THB` ทุกอัตราเป็น 1 → residual = 0 → ไม่มีบรรทัด FX → journal เหมือนเดิมทุกตัวอักษร

**ไฟล์ที่แตะ (20 ไฟล์):**

- **ใหม่ใน `@lib/common`** — `utils/currency.util.ts` (`BOOK_CURRENCY`, `resolveCurrencyContext`,
  `toRawCurrency`, `toBookCurrency`, `resolveRealisedFxDifference`) + `interfaces/currency-context.interface.ts`
  · **ย้ายมาจาก `receipts.service.ts`** (เดิมเป็น private method ที่นั่น) แล้ว `receipts.service` /
  `ap-invoices.service` / `payment-entries.service` ใช้ตัวเดียวกัน — ลบ `receipt-currency-context.interface.ts` ทิ้ง
- `GlAccount` +`ForeignExchangeGain='4300'` +`ForeignExchangeLoss='5300'`
- `payment_entries` +`currency`/`currency_rate`/`currency_date`/`raw_paid_amount`/`raw_wht_amount`/
  **`raw_allocated_amount`/`raw_unallocated_amount`** (สองตัวหลังเกินจาก scope เดิมใน HANDOFF แต่**จำเป็น** —
  ไม่มีก็ไม่มีที่เก็บ invariant ฝั่ง raw ให้ CHECK ตรวจได้)
- `payment_allocations` +`raw_allocated_amount` (ไม่ใช่แค่ audit — invariant กับการเฉลี่ย WHT คิดจากตัวนี้)
- `ap_invoices` +`currency`/`currency_rate`/`currency_date` + `raw_*` ครบ 6 ตัว (mirror `receipts`) ·
  credit note **inherit FX snapshot** จากใบที่อ้างอิง ด้วยเหตุผลเดียวกับที่ inherit `vat_rate`
- `PaymentEntriesService` — refactor จริง: แยก `assertAllocationTargetsWellFormed()` ออกมา, เพิ่ม
  `resolveAllocationRates()` (โหลด FX ของเอกสารปลายทาง + **ปฏิเสธการตัดข้ามสกุล**), `resolveWithholdingSplit()`
  เฉลี่ยในสกุลที่ทำรายการแล้วแปลงกลับที่อัตราของแต่ละใบ, `sumRawAllocations()`
- `PaymentGlPostingService` +`fxLine()` · `APInvoiceGlPostingService` **ไม่ต้องแก้** (อ่านแต่คอลัมน์ THB —
  FX เกิดตอน *ตัดชำระ* ไม่ใช่ตอนรับรู้หนี้) เพิ่มแต่ docblock อธิบาย
- migration `1788271413628-AddMultiCurrencyToPaymentsAndAPInvoices.ts` — **hand-edit 3 จุดจาก generated diff**
  (ดู docblock ในไฟล์): `currency_date` ต้อง add nullable → backfill → set NOT NULL, `raw_*` ต้อง
  backfill จากคอลัมน์ THB ไม่ใช่ปล่อยเป็น 0 (ไม่งั้น `chk_payment_allocations_raw_allocated_amount_gt_0`
  **fail ทันที**บนแถวเดิมทุกแถว), และ drop CHECK ตัวเก่า
- เอกสาร: `srs-p5.html` (ER diagram 3 ตาราง + rulebox `MULTI-CURRENCY SETTLEMENT & REALISED FX` +
  แก้ invariant ใน `RULE · PAYMENT ALLOCATION`) · `api-workflow-guide.html` (currency ใน request body +
  rulebox เตือน FE ว่า `allocated_amount` คิดที่อัตราของ**ใบกำกับ** ไม่ใช่ของใบจ่าย) — render-check ผ่านทั้งคู่

**เทสต์ที่เพิ่ม (+30):** `currency.util.spec.ts` (15) · FX ใน `payment-gl-posting.service.spec.ts` (7 —
รวมเคสเศษสตางค์ที่ยืนยันว่า voucher balance) · multi-currency ใน `payment-entries.service.spec.ts` (8)

**ยังไม่ทำ (จงใจ) — unrealised FX**: การตีราคา AR/AP ที่ยังเปิดอยู่ ณ วันสิ้นงวด (TFRS 21 อีกครึ่ง)
เป็น period-end adjustment ของทั้ง ledger ไม่ใช่ผลของเอกสารใบใดใบหนึ่ง จึงไม่อยู่ใน posting rule ของเอกสาร
· ถ้าลูกค้าต้องการ ต้องเป็นงานใหม่ที่มีตัวขับของตัวเอง (คู่กับ `finance_settings.ledger_frozen_upto`)

---

### FX / currency audit — จัดระดับ P0–P4 (ตรวจ 2026-09-01)

ตรวจทั้ง repo หา "หลุดเคส/ช่องโหว่เรื่องอัตราสกุลเงินซื้อ-ขาย" ด้วยสองวิธีใน §5
(หาคอลัมน์ที่ประกาศแล้วไม่มีใครอ่าน + เทียบความสมมาตรซื้อ↔ขาย)

**P0 — ไม่พบ.** ไม่มีจุดใดที่พังหรือทำข้อมูลเสียในการใช้งาน THB ล้วนตามปกติ · ทางตัดชำระถูกปิดไปแล้วใน C3

#### P1 — แก้แล้วรอบนี้ (มีเทสต์คุมทั้งสามข้อ)

| # | ช่องโหว่ | ผลถ้าไม่แก้ |
|---|---|---|
| 1 | **ใบลดหนี้ฝั่งขายไม่ inherit FX snapshot** — `receipts` รับ `currency` จาก client ตรงๆ ขณะที่ `ap_invoices` inherit ตั้งแต่วันแรก (asymmetry ซื้อ↔ขาย) | ใบลดหนี้ที่ปรับใบ USD@35 ออกเป็น THB หรือ USD@40 ได้ → net กับ AR ผิดอัตรา เหลือเศษค้างที่**ไม่มีใบจ่ายไหนล้างได้** และไม่มี FX event อธิบาย · guard ตัดข้ามสกุลจับไม่ได้เพราะใบปรับยอดลง ledger ตรงๆ ไม่ผ่านใบจ่าย |
| 2 | **`price_lists.currency` ถูกทิ้งที่ BC boundary** — `IItemPriceLookupResult` ส่งแค่ `{rate, price_list_id}` แม้ query จะ join `price_list` อยู่แล้ว | `assertPriceWithinReferenceBound` เทียบเลขสองตัวเสมือนหน่วยเดียวกัน · price list USD อ้างอิง 100 กับบรรทัด THB 3,600 → **ปฏิเสธเอกสารที่ถูก** และบรรทัด THB 100 → **ผ่าน** ทั้งที่ควรตก = ขายต่ำกว่าราคาไป ~36 เท่า **ผ่าน guard ที่มีไว้กันการขายต่ำราคาเอง** |
| 3 | **3 ใน 6 คอลัมน์ currency ไม่ได้ validate ISO เลย** — `customers.billing_currency`, `suppliers.billing_currency`, `price_lists.currency` มีแค่ `@IsString()` | เก็บ `'ZZ'`/`'usd'`/คำอะไรก็ได้ลง DB ได้ · ปิดด้วย enum ระดับ DB (ดู §2 ด้านล่าง) |

#### P2 — ✅ ปิดครบทั้ง 4 ข้อแล้ว (2026-09-02)

| # | เรื่อง | สถานะ |
|---|---|---|
| ~~4~~ | ~~**`quotations` / `purchase_orders` ไม่มี currency เลย**~~ | ✅ **เสร็จแล้ว 2026-09-01** — ดู §"P2#4" ด้านล่าง |
| ~~5~~ | ~~**`receipt_items` / `ap_invoice_items` ไม่มี `raw_*`**~~ | ✅ **เสร็จแล้ว 2026-09-02** — ดู §"P2#5+#6+#7" ด้านล่าง |
| ~~6~~ | ~~**report-bc print ไม่รู้จัก currency เลย**~~ | ✅ **เสร็จแล้ว 2026-09-02** — mock invoice + `formatMoney` |
| ~~7~~ | ~~**`billing_currency` ทั้งสองฝั่งยังไม่มีใครอ่าน**~~ | ✅ **เสร็จแล้ว 2026-09-02** — ลูกค้าเลือก "enforcement mode ตั้งค่าได้ + ทุกเอกสาร party-facing" |

#### P3–P4 — รู้ไว้ ไม่ต้องรีบ

| # | ระดับ | เรื่อง |
|---|---|---|
| 8 | P3 | **`billing_notes` รวมใบข้ามสกุลได้** — บวก `receipt.total` (THB) จึงถูกต้องภายในตัว แต่ BN ของลูกค้าที่วางบิลเป็น USD จะแสดงยอด THB ก้อนเดียว · เป็นคำถามเรื่องการจัดกลุ่ม/พิมพ์ ไม่ใช่ตัวเลขผิด |
| 9 | P3 | **`credit_limit`/`credit_exposure` เป็น THB** — ถูกต้องในฐานะสกุลบัญชี แต่ไม่มีที่ไหนเขียนไว้ วงเงินของลูกค้า USD ก็เป็น THB |
| 10 | P4 | **`item_prices` ไม่มี currency ของตัวเอง** — สืบทอดจาก price list ซึ่ง docblock ระบุไว้แล้วว่าจงใจ (ตรงกับ SAP/Odoo/NetSuite) · **ไม่ใช่บั๊ก** บันทึกไว้เพราะ audit ต้องยืนยัน |
| 11 | P4 | **เพิ่มสกุลเงินใหม่ = 4 migration** (finance/sales/supplier/inventory) — ราคาของ enum ต่อ database · จงใจ เขียนไว้ใน docblock ของ `Currency` |
| 12 | P4 | **unrealised FX ยังไม่ทำ** (จากรอบ C3) — period-end revaluation ตาม TFRS 21 อีกครึ่ง เป็นงานของทั้ง ledger ไม่ใช่ของเอกสารใบใด |

---

### currency → enum ระดับ DB ✅ **เสร็จแล้ว 2026-09-01**

ทั้ง **6 คอลัมน์** เป็น Postgres enum แล้ว: `receipts.currency`, `ap_invoices.currency`,
`payment_entries.currency`, `price_lists.currency`, `customers.billing_currency`,
`suppliers.billing_currency` · source of truth เดียวคือ `Currency` ใน `@lib/common/enum/currency.enum.ts`

- **157 ค่า** — generate จากรายการ ISO 4217 ชุดเดียวกับที่ class-validator ใช้ (179 code point)
  แล้วตัด 22 ตัวที่เป็น ISO จริงแต่**ไม่ใช่สกุลเงินที่ทำรายการได้**: โลหะมีค่า (`XAU`/`XAG`/`XPT`/`XPD`),
  bond unit (`XBA`–`XBD`), unit of account (`XDR`/`XSU`/`XUA`), code สงวน (`XTS` ทดสอบ, `XXX` = ไม่มีสกุลเงิน),
  fund/index ที่ทับสกุลจริง (`BOV`/`CHE`/`CHW`/`CLF`/`COU`/`MXV`/`USN`/`UYI`/`UYW`)
  · **แต่เก็บ `XAF`/`XOF`/`XPF`/`XCD` ไว้** เพราะเป็นเงินหมุนเวียนจริงของ 14 ประเทศ ไม่ใช่โลหะ
  · **ถ้าลูกค้าอยากได้ครบ 179 ตัวจริงๆ** แก้ที่ exclude list ในไฟล์เดียว แล้ว regenerate + migration
- **DTO เปลี่ยนเป็น `@IsEnum(Currency)`** แทน `@IsISO4217CurrencyCode()` — นิยาม "สกุลเงินที่ถูกต้อง" สองชุด
  คือทางที่ API จะเริ่มรับ code ที่ DB ปฏิเสธแล้วกลายเป็น 500 แทน 400 · ตัวพิมพ์เล็กยัง normalize ที่ขอบด้วย
  `toCurrencyCode` (`@Transform`) จึง **ไม่ breaking** กับ client ที่ส่ง `'usd'` มาอยู่แล้ว
- **`resolveCurrencyContext` ไม่ `.toUpperCase()` อีกแล้ว** — ย้ายไปที่ขอบ DTO โดยเจตนา: ซ่อมค่าลึกๆ ใน service
  เท่ากับกลบเกลื่อน caller ที่ข้าม validation ไปแทนที่จะให้มันพัง
- **seed folder แก้ครบ** — `IPriceListDef.currency` เป็น `Currency` และ `facility.data.ts` ใช้ `Currency.THB`
  (seeder เขียน raw SQL ไม่ผ่าน entity จึงไม่มีอะไร type-check ให้)

---

### P2#4 · FX snapshot บนเอกสารก่อน booking ✅ **เสร็จแล้ว 2026-09-01**

`quotations`, `sales_orders`, `purchase_orders` ได้ `currency`/`currency_rate`/`currency_date`
+ ชุด `raw_*` แล้ว — สกุลเงินไม่โผล่ขึ้นมากลางทางที่ใบกำกับอีก

**currency เดินตามเส้นทางเดียวกับ `is_vat_included` เป๊ะๆ ไม่ได้คิดกฎใหม่:**

| เอกสาร | currency มาจากไหน | เหตุผล |
|---|---|---|
| Quotation | **คัดลอกจาก `price_lists.currency`** (ไม่มีใน DTO) | เส้นทางเดียวกับ `is_vat_included` · ให้ client ส่งมาด้วยจะมีสองแหล่งของข้อเท็จจริงเดียวที่ขัดกันได้ — price list USD แต่ quote เป็น THB คือเอกสารที่ทุกตัวเลขผิดไปเท่าอัตราแลกเปลี่ยน · ขายสกุลต่างประเทศ = เสนอราคาจาก price list สกุลนั้น |
| Sales Order | **คัดลอกจาก quotation** | เหมือนทุก money field ที่ SO คัดลอกมาอยู่แล้ว · อ่านอัตราใหม่ตอน convert = restate เอกสารที่ลูกค้าอนุมัติแล้วแบบเงียบๆ |
| Purchase Order | **ผู้จัดซื้อระบุ** (มีใน DTO) | ไม่มีเอกสารต้นทางที่ตอบให้ — เหตุผลเดียวกับ `PurchaseOrder.is_vat_included` |

`currency_rate` มาจาก client เสมอ เพราะ inventory-bc เก็บราคา ไม่ได้เก็บอัตราแลกเปลี่ยน ·
price list ที่ไม่ใช่ THB **บังคับ** ต้องส่ง `currency_rate` ไม่งั้น 400 (ไม่ใช่ปล่อยให้เอกสารมีมูลค่าศูนย์)

**`IPriceListLookupResult` เพิ่ม `currency`** — docblock ของมันเขียนไว้เองตั้งแต่แรกว่าค่าที่
denormalize ข้าม BC ต้องพา "ความหมาย" ไปด้วย (ซึ่งเป็นเหตุผลที่ `is_vat_included` อยู่ในนั้น) ·
handler ส่ง entity ทั้งตัวอยู่แล้ว currency จึงอยู่บนสายมาตลอด แค่ interface ไม่ประกาศ

**เจอปัญหาออกแบบเพิ่มจากการเขียนเทสต์ (ไม่ได้อยู่ใน audit เดิม):** guard ±20% เทียบ
`unit_cost`/`unit_price` (ซึ่งเป็น THB) กับ reference rate (สกุลของ price list) **โดยไม่แปลงค่า** ·
แค่บังคับให้สกุลตรงกันยังไม่พอ — ตอนนี้ reference ถูก **แปลงเป็นสกุลบัญชีด้วยอัตราของเอกสารเอง**
ตอน resolve เลย (`toBookCurrency`) แล้ว bound check ไม่ต้องรู้เรื่องสกุลเงินอีก ·
`assertReferencePriceInBookCurrency` จึงกลายเป็น `assertReferencePriceCurrencyMatches` ที่เทียบกับ
สกุลของ **เอกสาร** ไม่ใช่ THB ตายตัว (USD quote จาก USD price list ผ่านได้แล้ว)

---

### Refactor · shared column contracts ✅ **เสร็จแล้ว 2026-09-01**

Scan ทั้ง 112 entity หากลุ่มคอลัมน์ที่ซ้ำกันแล้วยังไม่มีสัญญาคุม ได้ **7 interface ใหม่**
(รายละเอียดครบอยู่ใน root `CLAUDE.md` § "Shared column contracts"):

`ICurrencySnapshot` (6 entity) · `IRawVatDocumentTotals` (4) · `IDiscountableDocumentHeader` (5) ·
`IDiscountableDocumentLine` (5) · `IVatBucketedDocumentHeader` (4) · `IWithholdingTaxDocument` (2) ·
`ISubmittedAudit` (**8** — แต่ละตัวประกาศคอลัมน์คู่เดียวกันด้วยมือทั้งหมด)

- **ไม่มีคอลัมน์ใหม่ ไม่มี schema เปลี่ยน** — เป็น type-level contract ทั้งหมด · ทั้ง 6 DB ยัง `No changes`
- **tsc ผ่านทันทีทั้ง 17 entity โดยไม่ต้องแก้อะไรเลย** = พิสูจน์ว่าชนิดตรงกัน byte-for-byte อยู่แล้ว
  ไม่ได้บังคับให้เหมือน · interface ที่ต้องแก้ entity ให้เข้าพวกคือ interface ที่กำลังอธิบาย "ความต่าง"
  ไม่ใช่ "แนวคิดร่วม"
- **ทำไมเป็น interface ไม่ใช่ abstract class**: `ICurrencySnapshot` — `currency_rate` ของเอกสารคือ
  อัตราที่หนี้ถูก**บันทึก** แต่ของ `PaymentEntry` คืออัตราที่เงิน**เคลื่อนไหวจริง** การสืบทอดจะยืนยัน
  ความเท่ากันที่เป็นเท็จ (และผลต่างของสองอันนี้คือแกนทั้งหมดของ C3) · `ISubmittedAudit` — ถ้าย้าย
  `submitted_*` ไปไว้บน `SubmittableDocumentEntity` จะไปเพิ่ม 2 คอลัมน์ให้ `Quotation`/`PurchaseOrder`
  ที่ไม่มีขั้น submit เลย (มันถูก *ส่ง* และ *อนุมัติ*) = แก้ schema เพื่อให้ refactor สวย
- **`PurchaseOrder` ถูกเว้นจาก `IVatBucketedDocumentHeader` โดยเจตนา** — PO ไม่มีขั้น VAT เลย
  บังคับให้ implement = เพิ่ม 5 คอลัมน์ที่ไม่มีใครคำนวณ ซึ่งคือ pattern ช่องโหว่ที่ audit เจอ 6/6 ครั้ง

---

### Money precision · credit columns ขยายเป็น `numeric(18,4)` ✅ **เสร็จแล้ว 2026-09-01**

Scan ทั้ง 155 numeric column ในโปรเจกต์ (ผู้ใช้ถามตรงว่าเงินครบ 4 ตำแหน่งหมดหรือยัง) พบ
**5 คอลัมน์เป็น `numeric(18,2)`** ทั้งหมดอยู่ sales-bc เรื่องวงเงินเครดิต:
`customers.credit_limit`, `sales_orders`/`delivery_notes` คู่ `credit_limit_snapshot` +
`credit_exposure_snapshot`

- **`credit_exposure_snapshot` เป็นจุดที่ตัดข้อมูลจริง ไม่ใช่แค่เบี่ยง convention** — มันคำนวณจาก
  `receipts.total`/`sales_orders.total` ซึ่งเป็น `numeric(18,4)` ผ่าน `roundMoney()` แล้วเขียนลง
  คอลัมน์ 2 ตำแหน่งแบบเงียบๆ ทำให้ snapshot ที่เก็บไว้ต่างจากตัวเลขที่ใช้ตัดสินอนุมัติได้ถึงครึ่งสตางค์
  — ขัดกับ comment ของคอลัมน์เองที่บอกว่า "เก็บไว้ให้ผู้อนุมัติเห็นตัวเลขที่ใช้ตัดสินจริง"
- `credit_limit_snapshot`/`credit_limit` เองไม่เคยตัดจริง (รับค่าจากกันเองที่ ≤2 ตำแหน่งอยู่แล้ว) —
  ขยายเพื่อความสม่ำเสมอทั้งระบบตามที่สั่ง ไม่ใช่เพราะเป็นบั๊ก
- migration `1788278222823-WidenCreditColumnsToScale4.ts` เป็น `ALTER COLUMN TYPE numeric(18,4)`
  ตรงๆ **ไม่ต้องแก้มือ** เพราะเป็นการขยาย scale ล้วนๆ (Postgres cast กว้างขึ้นให้เองแบบ implicit
  ไม่มี `DROP COLUMN`) — ต่างจาก currency enum conversion ที่ต้องแก้มือเพราะเปลี่ยนข้าม type
- DTO `create-customer.dto.ts` แก้ `maxDecimalPlaces: 2 → 4` คู่กัน ไม่งั้น API จะบล็อกค่า 4
  ตำแหน่งที่ DB รับได้แล้ว
- (7,4)/(18,7)/(10,4)/(5,2) ที่เหลือใน numeric ทั้งหมด ตรวจแล้วว่า**ไม่ใช่เงิน** (เปอร์เซ็นต์/อัตรา/
  factor) จึงไม่ต้องแก้ · `timestamptz`: ตรวจครบ 112 entity แล้ว **0 ข้อผิด**

**ยังไม่ทำ**: ไม่มีการบันทึกเรื่องนี้ใน `srs-p5.html` — เป็น schema-precision fix ล้วนๆ ไม่ใช่
business rule ใหม่ จึงตัดสินใจไม่เพิ่ม rulebox ให้ ถ้าเห็นต่างบอกได้

---

### P2#5 + #6 + #7 · ปิด P2 audit ครบ ✅ **เสร็จแล้ว 2026-09-02** (ยังไม่ commit)

ลูกค้าตอบ 3 คำถามผ่าน `AskUserQuestion`: (1) mismatch policy = **enforcement mode ตั้งค่าได้**
(off/warn/block ต่อ BC เหมือน `price_tolerance_percent`) · (2) scope = **ทุกเอกสาร party-facing**
(quotation, SO, PO, receipt, AP invoice) · (3) batch = **#5 + #6 + #7 + seed re-verify**

**P2#7 — `party_currency_enforcement`:**
- ใหม่ใน `@lib/common`: `enum/party-currency-enforcement.enum.ts` (`OFF|WARN|BLOCK`) +
  `utils/party-currency.util.ts` (`assertPartyCurrencyMatchesBilling` — คืน `{warning}` ใน WARN,
  throw `422` ใน BLOCK, no-op อื่น ๆ รวมถึง mode ที่อ่านมาเป็น `undefined` จาก settings row เก่า)
- คอลัมน์ enum `party_currency_enforcement` (default `off`) เพิ่มบน `sales_settings` /
  `supplier_settings` / `finance_settings` · migration ต่อ BC (`ADD ... NOT NULL DEFAULT 'off'` ปลอดภัยบน
  singleton row เดิม ไม่ต้องแก้มือ) · DTO ทั้ง 3 เพิ่ม field แบบ `@IsOptional()` (body เดิมที่ส่งแค่
  `price_tolerance_percent` ยังใช้ได้)
- `ICustomerLookupResult` + `ISupplierLookupResult` (สำเนา finance-bc) เพิ่ม `billing_currency?` —
  RPC handler ส่ง entity เต็มอยู่แล้ว ค่าจึงอยู่บนสายมาตลอด แค่ interface ไม่ประกาศ
- 5 service เรียก `assertPartyCurrency(...)` ตอน create (+ update ที่ currency/party เปลี่ยนได้) ·
  quotation/PO เทียบ local repo, receipt/AP เทียบผ่าน RPC lookup, SO เทียบตอน convert
  (customer.billing_currency อาจเปลี่ยนหลัง quotation อนุมัติ) · WARN → `logger.warn` `action:
  PARTY_CURRENCY_MISMATCH` (ยังไม่ทำ `meta.warnings` ใน envelope — เป็น follow-up ถ้าต้องการให้ client เห็น)
- iam System Settings: การ์ดใหม่ "การบังคับสกุลเงินคู่ค้า" + 3 `<select>` · `build:assets:iam` แล้ว

**P2#5 — `raw_*` ระดับบรรทัด:**
- `receipt_items` / `ap_invoice_items` เพิ่ม 5 คอลัมน์ `numeric(18,4)`:
  `raw_unit_price`/`raw_unit_cost`, `raw_discount`, `raw_header_discount_amount`, `raw_vat_amount`,
  `raw_line_total` · `implements IRawDocumentLineTotals` (interface ใหม่ใน `@lib/common` — 4 คอลัมน์
  ร่วม, per-unit แยกเพราะชื่อคอลัมน์ต่างกัน)
- **`raw_line_total`/`raw_vat_amount` เฉลี่ยแบบ pro-rata จากยอด raw ของหัวเอกสาร** (`allocateRawLineTotals`
  ใหม่ใน `currency.util.ts` เรียก `allocateProRata`) ไม่ใช่แปลงทีละบรรทัด → `Σ raw_line_total ===
  raw_net_amount` ตรงถึงสตางค์โดยโครงสร้าง · หัวเอกสาร `raw_*` **ไม่เปลี่ยนวิธีคิด** (แปลงยอดรวมทีเดียวเหมือนเดิม)
  ไม่มี test churn ที่นั่น
- migration `1788285230902-AddRawColumnsToReceiptAndAPInvoiceItems.ts` — **hand-edit**: `ADD ... NOT NULL
  DEFAULT 0` (ปลอดภัยเพราะมี default) แล้ว `UPDATE ... FROM` parent backfill `raw_x = book_x /
  currency_rate` (แถวเดิมทั้งหมดเป็น THB rate=1 จึง = สำเนา) · ap-invoice `update()` ที่แก้ rate อย่างเดียว
  (`built === undefined`) ก็ restate `raw_*` ของบรรทัดที่เก็บไว้ ไม่งั้น Σ หลุด
- response DTO ของ item ทั้งสองฝั่งเพิ่ม 5 field

**P2#6 — currency ใน report-bc print:**
- ใหม่ `@lib/common/utils/format-money.util.ts` — `formatMoney(value, currency=THB)` → `"USD 1,234.00"`
  (ISO code prefix ชัดเจนสำหรับเอกสารภาษี/ส่งออก)
- `CreateInvoicePrintDTO` +`currency?` · `invoice-print.service.ts` ใช้ `formatMoney` แทน `formatAmount`
  เดิม · `invoice.ejs` ตัด "บาท" ที่ hard-code + เพิ่มบรรทัด "สกุลเงิน / Currency"
- **ข้อจำกัด**: real print path ปัจจุบันคือ mock endpoint (`POST /report/v1/invoices/mock-pdf`) เท่านั้น ·
  `print-template` banded engine ไม่ได้ format เงินเอง จึงไม่ต้องแก้ · ไม่ได้เขียน spec เต็มให้
  `invoice-print.service` (มี `format-money.util.spec` + boot check + typecheck คุมแล้ว — เกินสัดส่วนสำหรับ mock)

**seed re-verify**: `npm run seed -- --dry-run` → **15/15 seeders ok** · seed แตะแค่
`erp_inventory`+`erp_supplier` ไม่แตะตารางที่ batch นี้แก้เลย (grep แล้ว 0 hit) · คอลัมน์ใหม่มี DB default
ทั้งหมด · **`--fresh --yes` บน scratch DB ยังไม่ได้รัน** (connection pool ตึงตอนทำ — ควรรันซ้ำ)

**สุขภาพหลังงาน**: 1474 tests / 108 suites ผ่าน · eslint 0/0 · migration:generate ทั้ง 3 BC = No changes ·
boot ผ่านทั้ง 4 BC (finance 55 · sales 46 · supplier 26 · report 18 routes — ไม่มี endpoint ใหม่) ·
เอกสาร: `srs-p5.html` (rulebox 2 จุด) + `api-workflow-guide.html` (rulebox 1 จุด) render-check mermaid 0 error

**เทสต์ที่เพิ่ม (+12):** `party-currency.util.spec` (6) · `format-money.util.spec` (3) · block/off ใน
receipts (3) / ap-invoices (3) / quotations (2) / PO (2) / SO (1) · raw reconciliation ใน receipts + ap-invoices

**ไฟล์หลักที่แตะ:** `@lib/common` (enum + 2 util + 1 interface + barrel) · 3 settings entity/dto/service/swagger ·
`quotations`/`sales-orders`/`purchase-orders`/`receipts`/`ap-invoices` service + module · 2 item entity + 2 response dto ·
4 migration · report-bc print (dto/service/ejs) · iam system-setting (ejs/js) · 5 spec

#### E2E บน production จริง (ยิงผ่าน domain 2026-09-02) — ผ่านทั้งหมด

| เทสต์ | ผล |
|---|---|
| settings ทั้ง 3 BC — `PUT/PATCH` → `block`/`warn`/`off` แล้ว `GET` กลับ | round-trip ตรง (คอลัมน์+migration+DTO+service live) |
| `POST /finance-bc/v1/receipts` USD · ลูกค้า billing THB · mode `block` | **422** `Customer 'CUST-TEST-03' is billed in THB, but this document is in USD…` |
| `POST /supplier-bc/v1/purchase-orders` USD · ผู้ขาย billing THB · mode `block` | **422** ข้อความฝั่ง supplier (คนละ code path — local repo ไม่ใช่ RPC) |
| mode `warn` / `off` → POST ใบเดิม | **201** ทั้งคู่ (warn ลง log, off เงียบ) |
| P2#5 — receipt USD @35, 2 บรรทัด | `Σ raw_line_total = 142.8571` **=** header `raw_net_amount = 142.8571` · `raw_unit_price` = 1000/35, 3000/35 |
| P2#6 — `POST /report-bc/v1/invoices/mock-pdf {"currency":"USD"}` | **201** PDF 46,817 bytes · `{"currency":"ZZZ"}` → **400** พร้อมรายการ 157 สกุลจาก `@IsEnum(Currency)` |

cleanup แล้ว: settings กลับเป็น `off` ทั้ง 3 · ลบ test receipts หมด · **เหลือ**
`CUST-TEST-03.billing_currency = THB` (เดิม null) ไว้เพื่อเทสต์ซ้ำได้ — revert ด้วย
`PUT /sales-bc/v1/customers/<id> {"billing_currency":null}` ถ้าไม่ต้องการ

#### บั๊ก deploy ที่เจอตอนเทสต์ (ไม่ใช่จากโค้ดรอบนี้)

หน้า System Settings ยิง `localhost:3004/3005/3006` บน production — `SALES_/SUPPLIER_/FINANCE_PUBLIC_URL`
**ไม่เคยอยู่ใน `.env.example`** (ต่างจาก `AUTH_`/`REPORT_PUBLIC_URL`) คนตั้ง server จึงไม่รู้ว่าต้องตั้ง แล้ว
fallback ไป port map ของ docker-compose · แก้แล้ว: เติมใน `.env` ของเครื่อง + `pm2 reload iam` + เพิ่มลง
`.env.example` (commit `215426e`) + เขียนเป็น **บั๊ก #11 ใน `deployment-guide.html` §09** พร้อม
`*_PUBLIC_URL` ครบ 6 ตัวในตาราง §08

✅ **ปิดครบแล้ว 2026-09-02** — GitHub Environment secret `ENV_FILE` (deploy workflow เขียนทับ `.env`
ทั้งไฟล์จาก secret นี้ทุกครั้ง) sync ใหม่จาก `.env` ของเครื่องแล้วทั้ง `production` และ `development`
(174 บรรทัด / 7,513 bytes มี `*_PUBLIC_URL` ครบ) → deploy รอบหน้าไม่ลบทิ้งอีก · คำสั่งที่ใช้:

```bash
ssh app-server 'cat /root/erp-api/.env' | gh secret set ENV_FILE --env production  --repo iotechsoft-company/erp-api
ssh app-server 'cat /root/erp-api/.env' | gh secret set ENV_FILE --env development --repo iotechsoft-company/erp-api
```

> **ลำดับสำคัญ** — แก้ `.env` บนเครื่องก่อน แล้วค่อย sync ขึ้น secret เสมอ · ทำกลับด้าน (แก้ secret ก่อน
> แล้ว deploy) จะเสี่ยงกว่าเพราะ secret อ่านกลับไม่ได้ ถ้าเนื้อหาขาดจะรู้ตัวตอน `.env` บนเครื่องถูกทับไปแล้ว

---

### งานอื่นที่รู้อยู่ (ไม่บล็อกอะไร)

| งาน | หมายเหตุ |
|---|---|
| **`npm run seed --fresh` ตรวจซ้ำ** | **ยังค้างอยู่** (C3 ไม่กระทบ — ตรวจแล้วว่า seed ไม่แตะ `ap_invoices`/`payment_entries`/`payment_allocations` เลย เพราะ seed ครอบแค่ `erp_inventory`+`erp_supplier`) · รอบก่อนแก้ให้ปฏิเสธอย่างชัดเจนแล้วเมื่อมีเอกสารธุรกรรมค้าง แต่หลังจากนั้นเพิ่มตารางใหม่หลายตัว (`sales_returns`, `sales_return_receipts`, `sales_settings`, `supplier_settings`, …) — **ควรรัน `npm run seed -- --dry-run` และ `--fresh --yes` บน DB scratch อีกครั้ง** เพื่อดูว่า `truncates:` ใน seeder ยังครบ (ดู `libs/database/src/scripts/seed/README.md`) |
| **`system-settings-bc`** | ผู้ใช้เคยถามว่าควรมีไหม · คำตอบที่ให้ไว้: **ไม่ควร** เพราะ settings ถูกอ่านในทรานแซกชันที่บังคับใช้มัน (`assertPeriodOpen` อยู่ใน GL posting) ย้ายออกแล้วต้องมี cache และ cache ที่ค้างจะปล่อยเอกสารเข้างวดที่ปิดแล้ว · "settings" ไม่ใช่ bounded context · หน้า iam System Settings เป็น **UI aggregator** ซึ่งแก้ปัญหา "ที่เดียว" ได้แล้ว · **ผู้ใช้ยังไม่ได้ยืนยันว่าเห็นด้วย** — ถ้าเปิด session ใหม่แล้วสั่งทำ ให้ทำตามที่สั่ง |
| **audit log กลาง** | ตอนนี้มีแต่ log ต่อ aggregate ใน iam (`role_policy_audit_logs`, `user_role_audit_logs`) ไม่มี facility กลาง · เป็นงานคนละเรื่องกับ settings ตัดสินใจแยกได้ |
| **DEBIT_NOTE ฝั่งซื้อ** | จงใจไม่ทำ (ดู docblock ของ `APInvoiceDocumentType`) — ไม่ใช่โค้ดเดิมกลับเครื่องหมาย เพราะไม่ถูกจำกัดด้วยจำนวนบนใบเดิมหรือของที่เคลื่อนจริง (มักเป็นการแก้ราคา) ต้องมีเพดานและตัวขับของตัวเอง |

---

## 3 · คำสั่งที่ใช้จริง (ไม่ตรงกับที่เดาจาก package.json)

เสียเวลาไปกับเรื่องพวกนี้มาแล้ว จดไว้:

```bash
# เทสต์ — ต้องมี NODE_ENV ไม่งั้น config validation ตาย
#   [Error: Config validation error: "NODE_ENV" must be one of [local, dev, staging, prod]]
NODE_ENV=local npx jest                        # ทั้งหมด
NODE_ENV=local npx jest apps/finance-bc/test/unit
# ไม่มี script test:unit:<bc> · jest --config apps/<bc>/test/jest-unit.json ใช้ไม่ได้

# migration — ชื่อส่งผ่าน env ไม่ใช่ --name
npm_config_name=MyMigrationName npm run migration:generate:finance
npm run migration:run:finance
npm_config_name=Check npm run migration:generate:finance   # "No changes" = ไม่มี drift
# bc ที่ใช้ได้: sales supplier finance inventory iam auth

# หลังเพิ่ม/แก้ @RequirePermission ต้อง sync ก่อน แล้วค่อยเขียน grant migration
npm run permissions:sync

# frontend asset ของ iam (esbuild) — ต้องรันเองหลังแก้ไฟล์ใน apps/iam/public
npm run build:assets:iam

# ตรวจว่า route map จริง / DI resolve จริง (คุ้มมาก เจอบั๊กที่เทสต์จับไม่ได้)
NODE_ENV=local npx nest start <bc>        # แล้ว grep "Mapped {" ใน log

# render-check เอกสาร (บังคับตาม docs/plan-erp/CLAUDE.md)
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --virtual-time-budget=9000 \
  --dump-dom "file://$PWD/<file>.html" > /tmp/out.txt
grep -c 'Syntax error in text' /tmp/out.txt     # 0 = mermaid ผ่าน
```

---

## 4 · กับดักที่เจอมาแล้ว — อย่าเหยียบซ้ำ

1. **`migration:generate` เคยจะ `DROP COLUMN "submitted_by"`** (ข้อมูลจริง) เพราะ patch แทรก
   คอลัมน์ใหม่คั่นระหว่าง `@Column()` เดิมกับชื่อ property ทำให้ decorator ผูกผิดตัว →
   **อ่าน SQL ที่ generate ออกมาทุกครั้งก่อนรัน** ตามที่ `CLAUDE.md` สั่ง
2. **แก้ไฟล์ด้วย python ต้องอ่านเข้าตัวแปรก่อนเขียน** — `open(p,'w').write(open(p).read()...)`
   ตัดไฟล์เป็นศูนย์ก่อนอ่าน (เคยทำ entity หายไปทั้งไฟล์)
3. **`??` กับค่า `null` ที่มีความหมาย** — เคยเขียน `options.returnedQty ?? {}` ใน test harness
   ทำให้ `null` (= "RPC ล้ม") ยุบเป็น `{}` (= "ไม่มีของคืน") ซึ่งคือความต่างที่โค้ดจริงตัดสินจากมัน
   → เทสต์ผ่านด้วยเหตุผลผิด · ใช้ `!== undefined` เมื่อ `null` มีความหมาย
4. **mermaid ใน `.html` พังง่าย** — เคยแทรกคอลัมน์ก่อน comment เดิมทำให้บรรทัดมี 2 quoted string
   แล้วไดอะแกรมพังทั้งอัน (HTML ยัง parse ผ่าน จับได้จาก render-check เท่านั้น)
5. **เพิ่ม parameter ใน constructor ของ service = spec ทุกตัวที่ new มันพัง**
   (`Cannot read properties of undefined (reading 'tableName')`) ต้องไปเติม mock ในตำแหน่งที่ถูก
6. **enum ใหม่ใน `DomainEvent` ต้องเพิ่มใน `DOMAIN_EVENT_ROUTING` ด้วย** ไม่งั้น tsc ตาย
   (`Record<DomainEvent, …>` บังคับให้ครบ)
7. **(จาก C3) `migration:generate` เขียน `ADD "col" ... NOT NULL` โดยไม่มี DEFAULT** สำหรับคอลัมน์
   `timestamptz` ที่ entity ประกาศ non-null — **พังทันที**ถ้าตารางมีแถวอยู่ ต้องแก้เป็น add nullable →
   `UPDATE` backfill → `SET NOT NULL` เอง · และคอลัมน์ที่ generator ใส่ `DEFAULT 0` ให้ ถ้ามันควรมีค่า
   *อนุมานจากคอลัมน์อื่น* (เช่น `raw_*` ของแถว THB เดิม = คอลัมน์ THB เพราะ rate เป็น 1) ต้อง backfill
   **ก่อน**บรรทัด `ADD CONSTRAINT` ไม่งั้น CHECK ที่บังคับ `> 0` fail บนแถวเดิมทุกแถว —
   ทั้งสองอย่างคือเหตุผลที่ `CLAUDE.md` สั่งอ่าน SQL ที่ generate ทุกครั้ง ไม่ใช่แค่กัน `DROP COLUMN`
8. **(จาก currency enum) `migration:generate` แปลงชนิดคอลัมน์ด้วย `DROP COLUMN` + `ADD COLUMN`**
   ซึ่ง**ล้างค่าที่เก็บอยู่ทุกแถว** (กลายเป็น default หรือ NULL) — ต้องเขียนมือเป็น
   `ALTER COLUMN ... TYPE ... USING col::text::<enum>` · รอบนี้ถ้ารันตามที่ generate มา
   `suppliers.billing_currency` 14 แถวจะกลายเป็น NULL และ `receipts.currency` 7 แถวถูก reset
   (ตรวจด้วยการ query จริงหลังรัน ไม่ใช่เดา) · ถ้าค่าเดิมอาจมีตัวพิมพ์เล็ก ให้ `UPPER(TRIM(...))`
   ก่อน cast (lossless) แต่**อย่า** `NULL` ค่าที่ยัง cast ไม่ผ่าน — ปล่อยให้ migration ล้มดังๆ ดีกว่าทิ้งข้อมูลที่คนพิมพ์มาจริง
9. **(จาก C3) ถ้าจะเทียบเงินสองยอดที่คิดจาก "อัตราคนละตัว" ให้หยุดคิดก่อน** — bug ที่แพงที่สุดของ C3
   คือการเผลอเทียบยอด THB ของใบจ่าย (อัตราวันจ่าย) กับยอด THB ของใบกำกับ (อัตราวันออกใบ) ·
   invariant ทุกตัวที่เทียบ *ใบจ่าย ↔ เอกสาร* ต้องอยู่ฝั่ง `raw_*` และทุกตัวที่เทียบ *เอกสาร ↔ เอกสารเดียวกัน*
   (outstanding, เพดาน WHT) อยู่ฝั่ง THB ได้ เพราะทุกแถวที่ตัดใบเดียวกันใช้อัตราเดียวกัน

---

## 5 · ถ้าจะทำ audit ซ้ำ

วิธีที่ได้ผลรอบก่อน: หา **"คอลัมน์/ค่าที่ประกาศไว้พร้อม comment อธิบายกฎ แต่ไม่มีโค้ดไหนอ่าน"**
— เจอ pattern นี้ 6 ครั้ง (`stock_frozen_upto`, `ledger_frozen_upto`, `credit_limit`,
`credit_terms`, `is_vat_registered` ×2, `reference_ap_invoice_id`) ทุกครั้งเป็นช่องโหว่จริง

อีกวิธี: **เทียบความสมมาตรซื้อ↔ขาย** — Purchase Return มีแต่ Sales Return ไม่มี, AP บังคับ
`grn_item_id` แต่ AR ไม่บังคับ `dn_item_id`, PO มี `returned_qty` แต่ SO ไม่มี · ทุกข้อเป็นงานจริง
ทั้งหมด

ตรวจ endpoint index ในเอกสารกับ route ที่ map จริงตอน boot ก็เจอ `POST /products` ที่หายไปจาก index
