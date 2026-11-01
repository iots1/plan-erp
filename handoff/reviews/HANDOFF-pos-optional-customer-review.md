# Handoff — รีวิว PR #5 `feature/sales-optional-custumer` (ขายหน้าร้านแบบไม่ระบุลูกค้า)

> ถึง: poompakorn · รีวิวเมื่อ 2026-11-01
> PR: `iotechsoft-company/erp-api#5` — review แบบ **Request changes** + inline comment 14 จุด (โพสต์บน PR แล้ว)
> commit ที่รีวิว:
>
> - `b0d4600` feat(sales): allow cash sales without customer
> - `49276d5` chore: add trailing newlines to customer optional smoke tests
>
> base: `main` @ `e61c95a` — ไม่ตามหลัง main, GitHub บอก mergeable

**สถานะ**

| PR | สถานะ |
|---|---|
| #5 `feature/sales-optional-custumer` | **รอผู้เขียนแก้** — ครั้งนี้ผู้รีวิวไม่ได้แก้ให้ (§4) · ห้าม merge จนกว่า §5 จะเขียวครบ |

### เอกสารอ้างอิง (spec ที่ deploy แล้ว)

| เรื่อง | ลิงก์ |
|---|---|
| POS — spec ปัจจุบันยังบอกว่า "ต้องมี customer จริงเสมอ" (PR นี้ต้องแก้ตรงนี้) | [srs-p4 · Phase 4](https://iots1.github.io/plan-erp/srs-p4.html#p4) · [api-workflow-guide · B5 ขายหน้าร้าน POS](https://iots1.github.io/plan-erp/api-workflow-guide.html#flow-sell) |
| ใบกำกับอย่างย่อ §86/6 vs เต็มรูป §86/4 · ผู้ซื้อเครดิตภาษีซื้อจากใบอย่างย่อไม่ได้ (§82/5) | [api-workflow-guide · A5 "ใบกำกับเต็มรูป vs อย่างย่อ"](https://iots1.github.io/plan-erp/api-workflow-guide.html#flow-buy) · B5 "document_type ไม่ส่งมา = ABB_TAX_INVOICE" ใน [#flow-sell](https://iots1.github.io/plan-erp/api-workflow-guide.html#flow-sell) |
| พักบิล / complete / claim | [api-workflow-guide · B5.1 พักบิล](https://iots1.github.io/plan-erp/api-workflow-guide.html#pos-held) · [resolve-completion](https://iots1.github.io/plan-erp/api-workflow-guide.html#pos-resolve-completion) |
| `document_type` 8 ค่าของ receipt และใบไหนต้องระบุผู้ซื้อ | [srs-p5 · Phase 5](https://iots1.github.io/plan-erp/srs-p5.html#p5) |
| ออกเลขเอกสาร (issue) · CN/DN อ้างใบเดิม | [srs-p5 · lifecycle](https://iots1.github.io/plan-erp/srs-p5.html#p5-lifecycle) |
| รับชำระ · `unallocated_amount` (เงินรับล่วงหน้า) · aging C7 | [api-workflow-guide · ฝั่งเงิน](https://iots1.github.io/plan-erp/api-workflow-guide.html#flow-money) |
| เครดิตลูกค้า — ตัดเครดิต / คืนเงิน | [srs-p5 · customer credit](https://iots1.github.io/plan-erp/srs-p5.html#customer-credit) · [api-workflow-guide · C10](https://iots1.github.io/plan-erp/api-workflow-guide.html#customer-credit) |
| กฎโดเมนของเอกสารธุรกิจ (เงิน ภาษี เลขที่ตามกฎหมาย) | [backend-convention · 16 Business Documents](https://iots1.github.io/plan-erp/backend-convention.html#documents) |
| migration: generate จาก entity, timestamp ต้องเป็น `Date.now()` จริง | [backend-convention · 13 Migrations & Seed](https://iots1.github.io/plan-erp/backend-convention.html#migrations) |
| response `{ th, en }` เป็น stable contract | [i18n-guide · Response](https://iots1.github.io/plan-erp/i18n-guide.html#response) |

---

## 0. PR นี้ทำอะไร

ทำให้ `customer_id` เป็น null ได้ทั้งสาย เพื่อให้ขายหน้าร้านแบบ walk-in (ใบกำกับภาษีอย่างย่อ §86/6) และพักบิล
ได้โดยไม่ต้องเลือกลูกค้า:

| BC | ที่เปลี่ยน |
|---|---|
| sales-bc | `pos_sales.customer_id`, `customer_name_th` → nullable · `CreatePosSaleDTO.customer_id` optional · FULL_TAX_INVOICE ยังบังคับลูกค้า (ทั้งตอนขายตรงและตอน complete บิลพัก) |
| finance-bc | `receipts.customer_id/customer_name_th/customer_tax_id`, `payment_entries.party_id/party_name_th`, `profit_loss_records.customer_id` → nullable · `CreateReceiptDTO.customer_id` และ `CreatePaymentEntryDTO.party_id` optional |
| report-bc | `profit_by_lots.customer_id` → nullable |
| libs/common | `IRecordPosSaleRequest`, `IRecordedPosSaleLookup`, `ISaleRevenueLookupResult` · `customer_id: string \| null` |

---

## 1. อ่านก่อน

1. **PR นี้กลับ design เดิมที่ตั้งใจไว้** — เดิม `pos_sales.customer_id` บังคับมีค่า และ comment ของ entity/DTO
   บอกเหตุผลไว้ว่า *"ให้ร้านสร้าง customer 'ลูกค้าทั่วไป' ไว้หนึ่งแถวต่อสาขา เพราะถ้าปล่อยว่าง ยอดขายกลุ่มนี้จะหายไปจากรายงานลูกหนี้และรายงานขาย"*
   ใบกำกับภาษี**อย่างย่อ**ที่ไม่ระบุผู้ซื้อถูกต้องตามกฎหมาย (§86/6) จึงรับได้ —
   **แต่ความเสี่ยงที่ comment เดิมเตือนไว้ยังอยู่ และ PR นี้ยังไม่ได้ปิด** (F2, F3: ลูกหนี้กับเงินรับล่วงหน้าที่ไม่มีลูกค้า
   หายจาก aging แบบเงียบ ๆ และตัดยอดไม่ได้)
2. **branch นี้ไม่เคยผ่าน smoke**
   - migration ทั้ง 3 ตัวยังไม่เคยรันบน DB กลาง — ตรวจเมื่อ 2026-11-01 คอลัมน์ทุกตัวในตาราง §0 ยังเป็น `NOT NULL`
     และไม่มีชื่อ migration ทั้งสามในตาราง `migrations` ของ `erp_sales` / `erp_finance` / `erp_report`
   - smoke ทั้ง 3 ไฟล์ตรวจแค่ `information_schema` ว่าคอลัมน์ nullable — **ไม่ได้ยิง endpoint จริงเลย**
     (`CLAUDE.md` § Definition of Done) — ดูเคสที่ต้องมีที่ §4 ข้อ 4
3. **lint fail** — commit `49276d5` ("add trailing newlines") เพิ่มบรรทัดว่าง**เกิน**ท้ายไฟล์ smoke ทั้ง 3 ไฟล์
   และบรรทัดยาวใน smoke ของ finance → prettier error · `pnpm lint` แก้ให้เอง
4. **docs ไม่ได้อัปเดต** — `pnpm check:branch` เตือน `docs-not-updated` · ต้องแก้ srs-p4 (POS), srs-p5 (receipt / payment),
   `api-workflow-guide.html` (`customer_id` / `party_id` เป็น optional) ในรอบเดียวกับโค้ด
5. **commit subject ไม่ตรงกับ diff** — `feat(sales): …` แต่ diff ส่วนใหญ่อยู่ใน finance-bc (receipt, payment, customer credit)
   และ report-bc · ควรแยกเป็น `feat(finance): …` / `feat(report): …` / `feat(sales): …`
   (`.claude/rules/branches-and-commits.md`) — commit ที่ push แล้วไม่ต้องแก้ history ให้แก้เป็น commit ต่อท้าย

### ผลการตรวจอัตโนมัติ (รันใน worktree ของ `49276d5`)

| ขั้น | ผล |
|---|---|
| `pnpm check:branch` (สคริปต์ล่าสุดจาก main) | ⚠️ 0 error · 1 warning `docs-not-updated` |
| typecheck (`tsconfig.build.json`) | ✅ |
| lint | ❌ prettier ใน `apps/{finance,report,sales}-bc/test/smoke/*customer-optional.smoke.mjs` |
| unit | ✅ finance-bc 567 · sales-bc 351 · report-bc 9 |
| spec-tree typecheck (`tsconfig.json`) | error ชุดเดียวกับบน `main` — ไม่มี error ใหม่จาก PR นี้ |
| migration เทียบกับ `migration:generate` (ต้องตรงทุกคำสั่ง) | finance ✅ · report ✅ · **sales ❌** — ไม่มีคู่ `DROP CONSTRAINT` / `ADD CONSTRAINT "fk_pos_sales_customer_id"` ที่ generator สร้าง = ไฟล์ถูกเขียนเองหรือแก้หลัง generate (F8) |
| migration บน DB กลาง | ❌ ยังไม่ได้รัน |
| e2e / build / smoke | ไม่ได้รัน — lint fail ก่อน และ smoke จะ fail อยู่แล้วเพราะ migration ยังไม่ได้รัน |

---

## 2. Findings

### 🔴 F1 · แก้ draft ให้เป็นใบกำกับภาษีเต็มรูปที่ไม่มีผู้ซื้อได้

`apps/finance-bc/src/modules/receipt/services/receipts.service.ts` — `update()`

การเช็คว่า "FULL_TAX_INVOICE / INV_TAX_INVOICE ต้องมีลูกค้า" อยู่ใน `resolveCustomer()` แต่ `update()` เรียกมัน
**เฉพาะตอนที่ body ส่ง `customer_id` มา**:

1. `POST /receipts` ABB_TAX_INVOICE ไม่มีลูกค้า → draft
2. `PUT /receipts/:id` `{ "document_type": "FULL_TAX_INVOICE" }` → `customer === undefined`, `stored.customer_id === null` → ไม่มีอะไรเช็ค
3. `issue()` ก็ไม่เช็คผู้ซื้อ → **ได้ใบกำกับภาษีเต็มรูป (§86/4) ที่ไม่มีชื่อ/เลขผู้เสียภาษีผู้ซื้อ**
   และเลขที่ออกไปแล้วถอยไม่ได้ (เลขต้องต่อเนื่อง)

**ผลกระทบ:** เอกสารภาษีผิดกฎหมาย ผู้ซื้อเอาไปเครดิตภาษีซื้อไม่ได้
**กฎ:** `.claude/rules/business-documents.md` § Statutory documents ·
[srs-p5 · lifecycle](https://iots1.github.io/plan-erp/srs-p5.html#p5-lifecycle) ·
[backend-convention · 16](https://iots1.github.io/plan-erp/backend-convention.html#documents)
**แก้:** ใน `update()` เช็ค "type ที่จะเป็นต้องมีลูกค้าหรือไม่" เทียบกับลูกค้า**ที่จะเป็น** (`data.customer_id` ถ้าส่งมา ไม่งั้น
`stored.customer_id`) ทุกครั้ง และเพิ่ม guard เดียวกันใน `issue()` เพราะเป็นด่านสุดท้ายก่อนออกเลข

### 🔴 F2 · `INVOICE` (ขายเชื่อ) สร้างได้โดยไม่มีลูกค้า → ลูกหนี้ที่ไม่มีเจ้าของ และหายจาก aging

`resolveCustomer()` ยอมให้ `customer_id` เป็น null สำหรับ**ทุก type** ที่ไม่ใช่ FULL/INV_TAX ซึ่งรวม `INVOICE`, `DEBIT_NOTE`
และ `ABB_TAX_INVOICE` ที่สร้างผ่าน `/receipts` ตรง ๆ (ไม่ได้รับเงินทันทีเหมือนเส้น POS)
ทั้งหมดนี้อยู่ใน `ALLOCATABLE_RECEIPT_DOCUMENT_TYPES` คือสร้างยอดลูกหนี้ แต่ aging (`receipts.service.ts` ~1967, ~2198)
ทำ `if (receipt.customer_id === null) continue;`

**ผลกระทบ:** ยอดค้างรับจริงหายจากรายงานลูกหนี้แบบเงียบ ๆ ยอดรวมจึงไม่ตรงกับบัญชีลูกหนี้ใน GL — ตรงกับที่ comment เดิมเตือนไว้
**อ้างอิง:** [srs-p5 · document_type](https://iots1.github.io/plan-erp/srs-p5.html#p5) ·
[api-workflow-guide · C7 aging](https://iots1.github.io/plan-erp/api-workflow-guide.html#flow-money)
("AR นับเฉพาะเอกสาร ISSUED ต่อใบ = total − ใบลดหนี้ − เครดิต − ยอดที่ตัดชำระแล้ว" — ไม่มีข้อยกเว้นสำหรับใบที่ไม่มีลูกค้า)
**แก้ (แนะนำ):**
1. อนุญาต `customer_id = null` **เฉพาะ `ABB_TAX_INVOICE` กับ `RECEIPT`** (และ CN/DN ที่อ้างใบที่ไม่มีลูกค้า) —
   `INVOICE` / FULL_TAX / INV_TAX ต้องมีลูกค้าเสมอ ทำเป็น constant set แบบเดียวกับ `BUYER_TAX_ID_REQUIRED_RECEIPT_DOCUMENT_TYPES`
2. aging **อย่า `continue`** — รวมยอดที่ไม่มีลูกค้าเป็นแถว "ไม่ระบุลูกค้า / walk-in" (`customer_id: null`) เพื่อให้ยอดรวมตรงกับ GL
   และใบ ABB ที่สร้างตรงแล้วยังไม่ได้รับเงินยังมองเห็นได้

### 🔴 F3 · `POST /payment-entries` แบบ RECEIVE ไม่ต้องมี `party_id` → เงินรับล่วงหน้าที่ไม่มีวันถูกใช้

`CreatePaymentEntryDTO.party_id` เป็น optional ใน **public API** ทั้งหมด ไม่ได้จำกัดแค่ POS facade

- RECEIVE ไม่มี party และไม่มี allocation (หรือรับเกินยอดที่ allocate) → ได้ `unallocated_amount > 0` ที่ไม่มีเจ้าของ:
  credit application / customer refund ต้องระบุ `customer_id` จึงใช้เงินก้อนนี้ไม่ได้ และ aging ก็ `continue` ทิ้ง
  → **เงินเข้าบัญชีแล้ว แต่ไม่มีใครเห็นและตัดยอดไม่ได้**
- payment ที่ไม่มี party ตัดใบไหนก็ได้ที่ไม่มีลูกค้า (`(receipt.customer_id ?? null) !== (partyId ?? null)` → `null === null`)
  ใบ walk-in ทุกใบจึงกลายเป็นลูกค้าคนเดียวกัน

**กฎ:** `business-documents.md` § Refuse what does not add up ·
[api-workflow-guide · `unallocated_amount`](https://iots1.github.io/plan-erp/api-workflow-guide.html#flow-money) ·
[srs-p5 · customer credit](https://iots1.github.io/plan-erp/srs-p5.html#customer-credit)
**แก้ (แนะนำ):** RECEIVE ที่ `party_id` เป็น null ต้อง (ก) มี allocation อย่างน้อย 1 รายการ (ข) ทุกใบที่ตัดไม่มีลูกค้า
(ค) allocate **เต็ม** `paid_amount + wht_amount` ไม่เหลือเศษ — ขาดข้อใดตอบ 400
· เช็ค "PAY ต้องมี party" ตอนนี้ซ้ำอยู่สองที่ (`resolveParty()` กับ `assertAllocationsValid()`) ให้เหลือที่เดียว

### 🔴 F4 · `PUT /receipts/:id` ส่ง `customer_id: null` → id ลูกค้าเดิมยังอยู่ แต่ชื่อ/เลขภาษีถูกล้าง

```ts
const customerId = data.customer_id ?? stored.customer_id;   // ~1183
```

`??` ถือว่า `null` เท่ากับ "ไม่ได้ส่งมา" จึงได้ id เดิมกลับมา แต่ `customer = resolveCustomer(null)` ได้ `null`
→ snapshot `customer_name_th` / `customer_tax_id` / `customer_address` กลายเป็น null ขณะที่ `customer_id` ยังชี้ลูกค้าคนเดิม
และ `resolveReferencedReceipt()` ก็ได้ id ผิดตัวไปด้วย

**ผลกระทบ:** เอกสารชี้ลูกค้าคนหนึ่งแต่พิมพ์ชื่อว่าง
**แก้:** `data.customer_id !== undefined ? data.customer_id : stored.customer_id` (แยก "ไม่ส่ง" ออกจาก "ล้าง")
แล้วเขียน `customer_id` จากค่าเดียวกับที่ใช้ resolve snapshot

### 🟠 F5 · CN/DN ออกให้ผู้ซื้อคนละคนได้ เมื่อฝั่งใดฝั่งหนึ่งเป็น null

`resolveReferencedReceipt()` (~339) ข้ามการเช็คเมื่อ `customerId` หรือ `referenced.customer_id` เป็น null —
ใบลดหนี้ที่ไม่ระบุลูกค้าจึงอ้างใบ ABB ที่**มี**ลูกค้าได้ (และกลับกัน) ซึ่งขัดกฎ "adjustment ต้องออกให้ผู้ซื้อคนเดียวกับใบที่อ้าง"
**แก้:** เทียบ `(customerId ?? null) !== (referenced.customer_id ?? null)` ตรง ๆ — null ต้องคู่กับ null

### 🟠 F6 · response contract ของ `customer_name` (i18n)

`PosSaleResponseDTO.customer_name: { th; en } | null` — `LocalizationInterceptor` ส่ง `{ th: null, en: null }` เสมอ
ไม่เคยส่ง `null` ทั้งก้อน (root `CLAUDE.md` § bilingual i18n — stable contract ·
[i18n-guide · Response](https://iots1.github.io/plan-erp/i18n-guide.html#response)) → คืน type เดิม
`{ th: string | null; en: string | null }` และใช้ `@ApiProperty`
ส่วน `customer_id` / `party_id` ใน response DTO ทุกตัว: field มีอยู่เสมอ แค่ค่าเป็น null → `@ApiProperty({ nullable: true })`
ถูกกว่า `@ApiPropertyOptional`

### 🟠 F7 · migration `down()` พังทันทีที่มีข้อมูลจริง

ทั้ง 3 ไฟล์ `SET NOT NULL` ตรง ๆ — มีบิล walk-in แถวเดียว rollback ก็ล้ม และของ finance มี 6 คำสั่ง
พังคำสั่งไหนก็ค้างครึ่ง ๆ ส่วนแถวที่ไม่มีลูกค้าก็เติมค่าที่ถูกต้องกลับไม่ได้
**แก้:** ใน `down()` นับแถวที่เป็น null ก่อน แล้ว `throw` ข้อความชัด ๆ ว่า rollback ไม่ได้เพราะมีเอกสาร walk-in กี่ใบ
(แนวเดียวกับ migration บิลพัก — `HANDOFF-product-suspend-sales-review.md` §3)
**กฎ:** `.claude/rules/migrations-and-seed.md` ·
[backend-convention · 13 Migrations & Seed](https://iots1.github.io/plan-erp/backend-convention.html#migrations)

### 🔴 F8 · migration ต้องเป็นไฟล์ที่ TypeORM generate ออกมาตรง ๆ — ห้ามเขียนเองหรือให้ AI เขียน

กฎ: entity ที่เปลี่ยน schema ต้องมี migration ใน PR เดียวกัน และ migration ต้องมาจาก
`pnpm run migration:generate:<bc> --name=<Name>` **ตามที่ generator เขียนออกมาทุกคำสั่ง** (format ด้วย `pnpm lint` ได้)
สิ่งที่เติมเองได้มีแค่ data backfill (`UPDATE` / `INSERT`) และ guard ใน `down()` (นับแถวแล้ว `throw`)

ผลเทียบกับ generator (`.claude/skills/review-pr/scripts/migration-audit.mjs --generate`):

- `1793348536105-MakePosSalesCustomerNullable` (sales) **ไม่ตรง** — generator ปลด/ใส่ FK ใหม่รอบการเปลี่ยน nullable
  (`ALTER TABLE "pos_sales" DROP CONSTRAINT "fk_pos_sales_customer_id"` … `ADD CONSTRAINT "fk_pos_sales_customer_id" FOREIGN KEY …`)
  แต่ไฟล์ใน PR ไม่มีคู่นี้ = เขียนเองหรือตัดออกหลัง generate
- finance และ report ตรงทุกคำสั่ง แต่ timestamp ห่างกัน**พอดี 1000 ms** (`1793351930993` → `1793351931993`) —
  generator ไม่มีทางให้เลขแบบนี้ ดูเหมือนพิมพ์เลขเอง
  ([backend-convention · 13](https://iots1.github.io/plan-erp/backend-convention.html#migrations): timestamp ต้องเป็น `Date.now()` จริง)

**แก้:** ลบ migration ทั้ง 3 ไฟล์ (ยังไม่เคยรันที่ไหน ลบได้ปลอดภัย) → `pnpm run migration:generate:sales|finance|report --name=…`
→ commit ไฟล์ที่ได้**โดยไม่แก้ SQL** → ถ้าต้องมี guard ใน `down()` (F7) ให้เติมเป็นโค้ด TS ก่อนคำสั่งที่ generate ไว้
→ รัน `migration-audit.mjs --generate` ซ้ำ ต้องขึ้น "exactly what TypeORM emits" ทั้ง 3 BC

### 🟡 อื่น ๆ

- error message / comment เก่ายังพูดถึง "general customer" — `pos-sales.service.ts` ~349 และ ~847
  ("a POS sale must name a real customer") และ ~837 ("a bill always has a customer") ซึ่งไม่จริงแล้ว
- description ของ `CreatePosSaleDTO.customer_id` บอกว่า "การขายเสร็จสมบูรณ์ต้องมีลูกค้า" แต่โค้ดยอมให้ ABB ไม่มีลูกค้า —
  Swagger ขัดกับพฤติกรรมจริง (prose ยาวควรย้ายไปไว้ใน `constants/*.swagger.ts` ตาม `naming-and-code-style.md`)
- `completeHeld()` เช็ค `claimed.customer_id === ''` — คอลัมน์ uuid เป็น `''` ไม่ได้ ตัดทิ้ง
- `credit-applications.service.ts:100` `target.customer_name_th ?? ''` และ aging `receipt.customer_name_th ?? ''`
  — อย่าซ่อน null ด้วย placeholder · target ผ่านเช็ค `target.customer_id === customerId` มาแล้วจึงมีลูกค้าเสมอ ให้ narrow / refuse
  เพื่อให้ type บอกความจริง
- GL narration (`receipt-gl-posting.service.ts:109`, `payment-gl-posting.service.ts:81`) ต่อ string ด้วย `— ${customer_name_th}`
  → สมุดบัญชีจะขึ้น `"— null"`
- print: `receipt-print-params.util.ts` ส่ง `customer_name_th` / `customer_tax_id` เป็น null — paginator แสดง null เป็นค่าว่าง
  (สลิปขึ้น `ลูกค้า: ` ว่าง ๆ) ไม่พัง แต่ field อื่นในไฟล์เดียวกันใช้ `?? ''` ทั้งหมด ควรทำให้เหมือนกัน
  หรือพิมพ์ "ลูกค้าทั่วไป / Walk-in" บนสลิป
- unit test ที่ยังขาด: complete บิลพัก FULL_TAX ที่ไม่มีลูกค้า (ต้อง 400 และบิลกลับเป็น HELD), `receipts.update` (F1, F4),
  payment RECEIVE ไม่มี party (F3), CN อ้างใบที่ลูกค้าต่างกัน (F5)

### ✅ ที่ทำได้ดี

- เช็คว่า FULL_TAX_INVOICE ต้องมีลูกค้า ทั้งตอนขายตรงและตอน complete บิลพัก และทำ**หลัง claim**
  (กัน race กับ `updateHeld`) แล้ว release claim ก่อน throw — ถูกต้อง
- ไล่ nullable ของ `customer_id` ครบทั้งสาย (entity → contract interface → event payload → read model ของ report)
  ไม่มีปัญหา snapshot ค้างแบบที่เจอรอบก่อน (P1 / C1)
- migration ของ finance / report ตรงกับที่ TypeORM generate ทุกคำสั่ง และ comment คอลัมน์อัปเดตตาม entity

---

## 3. การตัดสินใจ

| เรื่อง | ตัดสินใจ / แนะนำ |
|---|---|
| ยอมให้ขายหน้าร้านไม่ระบุลูกค้าหรือไม่ | **ยอม** สำหรับ ABB_TAX_INVOICE (§86/6) และบิลพัก — FULL_TAX_INVOICE ยังบังคับ (ตามที่ PR ทำ) |
| type ไหนใน finance-bc ที่ไม่มีลูกค้าได้ | **แนะนำ:** เฉพาะ `ABB_TAX_INVOICE`, `RECEIPT` และ CN/DN ที่อ้างใบที่ไม่มีลูกค้า (F2) |
| ยอดที่ไม่มีลูกค้าใน aging | **แนะนำ:** แสดงเป็นแถว "ไม่ระบุลูกค้า" ไม่ตัดทิ้ง (F2) |
| payment RECEIVE ที่ไม่มี party | **แนะนำ:** ต้องตัดใบที่ไม่มีลูกค้าเต็มจำนวน ห้ามมีเงินเหลือ (F3) |

ถ้าจะทำต่างจากที่แนะนำ ให้คุยกับ lead ก่อนเริ่มแก้ แล้วเขียนเหตุผลลง srs-p5

---

## 4. แผนแก้ (poompakorn — ทำบน branch เดิม แก้เป็น commit ต่อท้าย)

1. **F1–F4 (🔴)** พร้อม unit test ของแต่ละข้อ
2. **F8** — ลบ migration ทั้ง 3 ไฟล์แล้ว generate ใหม่ด้วย TypeORM (ห้ามแก้ SQL ที่ได้)
3. **F5–F7** และรายการ 🟡
4. **smoke ที่ยิง endpoint จริง** — copy โครงจาก `apps/sales-bc/test/smoke/customers.smoke.mjs`
   ของ sales-bc ต้องประกาศ `needs: ['finance-bc']` เคสอย่างน้อย:
   - `POST /pos-sales` ABB_TAX_INVOICE ไม่ส่ง `customer_id` → 201 · ตรวจใน finance DB ว่า `receipts.customer_id` และ
     `payment_entries.party_id` เป็น null
   - `POST /pos-sales` FULL_TAX_INVOICE ไม่ส่ง `customer_id` → 400
   - พักบิลไม่มีลูกค้า → complete เป็น ABB ได้ · เป็น FULL_TAX_INVOICE ได้ 400 และบิล**กลับเป็น HELD**
   - `POST /receipts` FULL_TAX_INVOICE / INVOICE ไม่มีลูกค้า → 400 · `PUT` draft ABB เป็น FULL_TAX_INVOICE → 400 (F1)
   - `POST /payment-entries` RECEIVE ไม่มี party และไม่มี allocation → 400 (F3)
5. รัน migration ทั้ง 3 BC (`migration:run:sales|finance|report`) → `pnpm verify sales-bc`, `pnpm verify finance-bc`,
   `pnpm verify report-bc` ต้องเขียวครบ 6 ขั้น
6. docs: srs-p4 (rule "ต้องมี customer จริงเสมอ" ใน [#p4](https://iots1.github.io/plan-erp/srs-p4.html#p4)) /
   srs-p5 / `api-workflow-guide.html` (rulebox "ไม่มีลูกค้าทั่วไปฝังในระบบ" และ comment `// บังคับ` ของ `customer_id` ใน
   [B5](https://iots1.github.io/plan-erp/api-workflow-guide.html#flow-sell)) → commit + **push submodule ก่อน** ยืนยันด้วย
   `git -C docs/plan-erp branch -r --contains HEAD` แล้วจึง `git add docs/plan-erp`
7. `pnpm check:branch` ต้องผ่าน 0 warning → push → ขอรีวิวรอบสอง

---

## 5. ผลหลังแก้

_ยังไม่ได้แก้ — เติมหลังรีวิวรอบสอง_

| BC | typecheck | lint | unit | e2e | build | smoke |
|---|---|---|---|---|---|---|
| sales-bc | | | | | | |
| finance-bc | | | | | | |
| report-bc | | | | | | |

- migration ที่รันบน DB กลาง:
- สิ่งที่ frontend ต้องรู้: `customer_id` ของ POS / receipt / payment entry เป็น `null` ได้ · `customer_name` ยังเป็น `{ th, en }` เสมอ
  (ค่าข้างในเป็น null ได้)
