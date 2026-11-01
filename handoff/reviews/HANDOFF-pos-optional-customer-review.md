# Handoff — รีวิว PR #5 `feature/sales-optional-custumer` (ขายหน้าร้านแบบไม่ระบุลูกค้า)

> ถึง: poompakorn · รีวิวเมื่อ 2026-11-01 (ปรับเป็นรูปแบบ skill `review-pr` ฉบับใหม่ในวันเดียวกัน)
> PR: `iotechsoft-company/erp-api#5` — review **Request changes** + inline comment บน PR
> commit ที่รีวิว:
>
> - `b0d4600` feat(sales): allow cash sales without customer
> - `49276d5` chore: add trailing newlines to customer optional smoke tests
>
> base: `main` @ `e61c95a` — ไม่ตามหลัง main, GitHub บอก mergeable

**สถานะ**

| PR | สถานะ |
|---|---|
| #5 `feature/sales-optional-custumer` | **รอผู้เขียนแก้** — ผู้รีวิวไม่ได้แก้ให้ (§4) · ห้าม merge จนกว่า F1–F8 + **D1 (เอกสาร)** เสร็จ และ §5 เขียวครบ |

**วิธีอ่าน finding ในไฟล์นี้** — ทุกข้อมี 4 ส่วน: **ผิดกฎ** (ไฟล์กฎ + หัวข้อ + ลิงก์ spec) ·
**ทำไมกฎนี้มี** (ปัญหาที่กฎกันไว้ หรือเหตุการณ์ที่ทำให้มีกฎนี้) · **เกิดอะไรใน PR นี้** (ลำดับ request ที่ทำให้พัง และใครเดือดร้อน) · **แก้**

**ถอนจากรีวิวรอบแรก** (อ้างกฎที่ไม่มีอยู่จริง — ไม่ต้องแก้):

- ~~"response DTO ที่ field มีเสมอให้ใช้ `@ApiProperty({ nullable: true })` แทน `@ApiPropertyOptional`"~~ — ไม่มีกฎข้อนี้ และ
  response DTO ใน repo ใช้ `@ApiPropertyOptional({ nullable: true })` เป็นหลัก (206 จุด) แบบที่คุณเขียนถูกแล้ว
- ~~"description ใน DTO ต้องย้ายไป `constants/*.swagger.ts`"~~ — กฎ Swagger strings ครอบคลุมแค่ `@ApiOperation` / `@ApiParam` /
  `@ApiQuery` ใน controller ไม่รวม description ใน DTO (ส่วนที่ description **ขัดกับพฤติกรรม**ยังต้องแก้ — ดู 🟡)

### เอกสารอ้างอิง (spec ที่ deploy แล้ว)

| เรื่อง | ลิงก์ |
|---|---|
| POS — spec ปัจจุบันยังบอกว่า "ต้องมี customer จริงเสมอ" (**ต้องแก้ตาม D1**) | [srs-p4 · Phase 4](https://iots1.github.io/plan-erp/srs-p4.html#p4) · [api-workflow-guide · B5 ขายหน้าร้าน POS](https://iots1.github.io/plan-erp/api-workflow-guide.html#flow-sell) |
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

## 1. อ่านก่อน — สิ่งที่บล็อก merge ไม่ว่าโค้ดจะเป็นอย่างไร

1. **PR นี้กลับ design เดิมที่ตั้งใจไว้** — เดิม `pos_sales.customer_id` บังคับมีค่า และ comment ของ entity/DTO และ spec
   บอกเหตุผลไว้ว่า *"ให้ร้านสร้าง customer 'ลูกค้าทั่วไป' ไว้หนึ่งแถวต่อสาขา เพราะถ้าปล่อยว่าง ยอดขายกลุ่มนี้จะหายไปจากรายงานลูกหนี้และรายงานขาย"*
   ใบกำกับภาษี**อย่างย่อ**ที่ไม่ระบุผู้ซื้อถูกต้องตามกฎหมาย (§86/6) จึงรับได้ —
   **แต่ความเสี่ยงที่ comment เดิมเตือนไว้ยังอยู่ และ PR นี้ยังไม่ได้ปิด** (F2, F3) และ spec ยังเขียนตาม design เดิม (D1)
2. **ไม่เคยผ่าน smoke** — migration ทั้ง 3 ตัวยังไม่เคยรันบน DB กลาง (ตรวจ 2026-11-01: คอลัมน์ทุกตัวใน §0 ยัง `NOT NULL`
   และไม่มีชื่อ migration ในตาราง `migrations`) และ smoke ทั้ง 3 ไฟล์ตรวจแค่ `information_schema`
   - **ผิดกฎ:** root `CLAUDE.md` § Definition of Done · `.claude/rules/testing.md` § What a change owes the suite
   - **ทำไมกฎนี้มี:** ขั้น 1–5 (typecheck → build) มองไม่เห็น migration ที่ไม่ได้รัน, permission ที่ไม่ได้ grant หรือคอลัมน์ `NOT NULL`
     ที่ไม่มี DTO เติม — guard, Postgres และ broker เป็นของจริงเฉพาะใน smoke · endpoint ที่เปลี่ยนแต่ไม่มี smoke เรียกจริงถือว่ายังไม่ verify
   - **แก้:** smoke ที่ยิง endpoint จริง — เคสอยู่ที่ §4 ข้อ 5
3. **lint fail** — commit `49276d5` เพิ่มบรรทัดว่าง**เกิน**ท้ายไฟล์ smoke ทั้ง 3 ไฟล์ และบรรทัดยาวใน smoke ของ finance
   - **ผิดกฎ:** `naming-and-code-style.md` § Never disable or bypass a lint rule · **ทำไม:** `pnpm lint --fix` แก้ format ให้เองอยู่แล้ว
     สิ่งที่เหลือคือ signal จริง — แก้ด้วย `pnpm lint`
4. **commit subject ไม่ตรงกับ diff** — `feat(sales): …` แต่ diff ส่วนใหญ่อยู่ใน finance-bc และ report-bc
   - **ผิดกฎ:** `branches-and-commits.md` § Commits · **ทำไม:** subject ที่ไม่ตรงกับ diff ทำให้ `git blame`, การ revert ทีละเรื่อง
     และตัวเลือก BC ที่ต้องรัน migration ตอน deploy (อ่านจาก diff) ใช้ไม่ได้
   - **แก้:** commit ถัดไปแยกเป็น `feat(finance): …` / `feat(report): …` / `feat(sales): …` (commit ที่ push แล้วไม่ต้องแก้ history)
5. **D1 — เอกสารยังไม่ได้อัปเดต** (`pnpm check:branch`: `docs-not-updated`) — บังคับ ดู D1 ใน §2

### ผลการตรวจอัตโนมัติ (รันใน worktree ของ `49276d5`)

| ขั้น | ผล |
|---|---|
| `pnpm check:branch` (สคริปต์ล่าสุดจาก main) | ⚠️ 0 error · 1 warning `docs-not-updated` |
| typecheck (`tsconfig.build.json`) | ✅ |
| lint | ❌ prettier ใน `apps/{finance,report,sales}-bc/test/smoke/*customer-optional.smoke.mjs` |
| unit | ✅ finance-bc 567 · sales-bc 351 · report-bc 9 |
| spec-tree typecheck (`tsconfig.json`) | error ชุดเดียวกับบน `main` — ไม่มี error ใหม่จาก PR นี้ |
| migration ↔ `migration:generate` (ต้องตรงทุกคำสั่ง) | finance ✅ · report ✅ · **sales ❌** (F8) |
| migration บน DB กลาง | ❌ ยังไม่ได้รันทั้ง 3 BC |
| e2e / build / smoke | ไม่ได้รัน — lint fail ก่อน และ smoke จะ fail อยู่แล้วเพราะ migration ยังไม่ได้รัน |

---

## 2. Findings

### 🔴 F1 · แก้ draft ให้เป็นใบกำกับภาษีเต็มรูปที่ไม่มีผู้ซื้อได้

**ผิดกฎ:** `business-documents.md` § Statutory documents — gapless numbering and immutability ·
[srs-p5 · lifecycle](https://iots1.github.io/plan-erp/srs-p5.html#p5-lifecycle) ·
[backend-convention · 16](https://iots1.github.io/plan-erp/backend-convention.html#documents)
**ทำไมกฎนี้มี:** ใบกำกับภาษีเต็มรูปต้องระบุผู้ซื้อ (§86/4) และเลขต้องต่อเนื่องไม่มีช่องว่าง — เมื่อ `issue()` แล้วเอกสารแก้ไม่ได้
ทางแก้มีทางเดียวคือออกใบลดหนี้/เพิ่มหนี้ ใบที่ผิดตั้งแต่ตอนออกจึงแก้ย้อนไม่ได้
**เกิดอะไรใน PR นี้:** การเช็ค "FULL_TAX_INVOICE / INV_TAX_INVOICE ต้องมีลูกค้า" อยู่ใน `resolveCustomer()` แต่
`ReceiptsService.update()` เรียกมัน**เฉพาะตอนที่ body ส่ง `customer_id` มา**:

1. `POST /receipts` ABB_TAX_INVOICE ไม่มีลูกค้า → draft
2. `PUT /receipts/:id` `{ "document_type": "FULL_TAX_INVOICE" }` → `customer === undefined`, `stored.customer_id === null` → ไม่มีอะไรเช็ค
3. `issue()` ไม่เช็คผู้ซื้อ → **ได้ใบกำกับภาษีเต็มรูปที่ไม่มีชื่อ/เลขผู้เสียภาษีผู้ซื้อ** มีเลขแล้ว ถอยไม่ได้ — ผู้ซื้อเอาไปเครดิตภาษีซื้อไม่ได้

**แก้:** ใน `update()` เช็ค "type ที่จะเป็นต้องมีลูกค้าหรือไม่" เทียบกับลูกค้า**ที่จะเป็น** (`data.customer_id` ถ้าส่งมา ไม่งั้น
`stored.customer_id`) ทุกครั้ง และเพิ่ม guard เดียวกันใน `issue()` (ด่านสุดท้ายก่อนออกเลข) · unit test: PUT เปลี่ยน type → 400, issue → 400

### 🔴 F2 · `INVOICE` (ขายเชื่อ) สร้างได้โดยไม่มีลูกค้า → ลูกหนี้ที่ไม่มีเจ้าของ และหายจาก aging

**ผิดกฎ:** `business-documents.md` § Refuse what does not add up — never quietly repair it ·
spec [srs-p5 · document_type](https://iots1.github.io/plan-erp/srs-p5.html#p5) ·
[api-workflow-guide · C7 aging](https://iots1.github.io/plan-erp/api-workflow-guide.html#flow-money)
("AR นับเฉพาะเอกสาร ISSUED ต่อใบ = total − ใบลดหนี้ − เครดิต − ยอดที่ตัดชำระแล้ว" — ไม่มีข้อยกเว้นสำหรับใบที่ไม่มีลูกค้า)
**ทำไมกฎนี้มี:** การ "ทำให้ request ผ่าน" แบบเงียบ ๆ ทำให้ข้อมูลโกหก — กฎนี้เกิดจากเคสที่หลุดมาแล้วจริง (ลิ้นชักขาดเพราะ
`Math.max(paid, total)`, ค่า default แทน lookup ที่ล้ม) · การข้ามแถวในรายงานคือการซ่อมเงียบแบบเดียวกัน: รายงานดูถูก แต่ยอดไม่ตรง GL
**เกิดอะไรใน PR นี้:** `resolveCustomer()` ยอมให้ `customer_id` เป็น null สำหรับ**ทุก type** ที่ไม่ใช่ FULL/INV_TAX รวม `INVOICE`,
`DEBIT_NOTE` และ `ABB_TAX_INVOICE` ที่สร้างผ่าน `/receipts` ตรง ๆ (ไม่ได้รับเงินทันทีแบบเส้น POS) ทั้งหมดอยู่ใน
`ALLOCATABLE_RECEIPT_DOCUMENT_TYPES` (สร้างยอดลูกหนี้) แต่ aging (`receipts.service.ts` ~1967, ~2198) ทำ
`if (receipt.customer_id === null) continue;` → **ยอดค้างรับจริงหายจากรายงานลูกหนี้** ฝ่ายบัญชีกระทบยอดกับ GL ไม่ลง
**แก้ (แนะนำ):**
1. อนุญาต `customer_id = null` **เฉพาะ `ABB_TAX_INVOICE` กับ `RECEIPT`** (และ CN/DN ที่อ้างใบที่ไม่มีลูกค้า) —
   ทำเป็น constant set แบบเดียวกับ `BUYER_TAX_ID_REQUIRED_RECEIPT_DOCUMENT_TYPES` · type อื่นไม่มีลูกค้า → 400
2. aging **อย่า `continue`** — รวมเป็นแถว "ไม่ระบุลูกค้า / walk-in" (`customer_id: null`) ให้ยอดรวมตรง GL

### 🔴 F3 · `POST /payment-entries` แบบ RECEIVE ไม่ต้องมี `party_id` → เงินรับล่วงหน้าที่ไม่มีวันถูกใช้

**ผิดกฎ:** `business-documents.md` § Refuse what does not add up — never quietly repair it ·
[api-workflow-guide · `unallocated_amount`](https://iots1.github.io/plan-erp/api-workflow-guide.html#flow-money) ·
[srs-p5 · customer credit](https://iots1.github.io/plan-erp/srs-p5.html#customer-credit)
**ทำไมกฎนี้มี:** (เหตุผลเดียวกับ F2) request ที่ไม่สมเหตุสมผลต้องได้ 400 ที่บอกกฎ ไม่ใช่บันทึกให้ผ่านแล้วข้อมูลค้างอยู่ในสภาพที่ใช้ต่อไม่ได้
**เกิดอะไรใน PR นี้:** `CreatePaymentEntryDTO.party_id` เป็น optional ใน **public API** ทั้งหมด ไม่ได้จำกัดแค่ POS facade
- RECEIVE ไม่มี party + ไม่มี allocation (หรือรับเกินยอดที่ allocate) → `unallocated_amount > 0` ที่ไม่มีเจ้าของ:
  credit application / customer refund ต้องระบุ `customer_id` จึงใช้เงินก้อนนี้ไม่ได้ และ aging ก็ `continue` ทิ้ง →
  **เงินเข้าบัญชีแล้ว แต่ไม่มีใครเห็นและตัดยอดไม่ได้**
- payment ที่ไม่มี party ตัดใบไหนก็ได้ที่ไม่มีลูกค้า (`null === null`) — ใบ walk-in ทุกใบกลายเป็นลูกค้าคนเดียวกัน

**แก้ (แนะนำ):** RECEIVE ที่ `party_id` เป็น null ต้อง (ก) มี allocation อย่างน้อย 1 รายการ (ข) ทุกใบที่ตัดไม่มีลูกค้า
(ค) allocate **เต็ม** `paid_amount + wht_amount` — ขาดข้อใดตอบ 400 · เช็ค "PAY ต้องมี party" ที่ซ้ำสองที่
(`resolveParty()` กับ `assertAllocationsValid()`) ให้เหลือที่เดียว

### 🔴 F4 · `PUT /receipts/:id` ส่ง `customer_id: null` → id ลูกค้าเดิมยังอยู่ แต่ชื่อ/เลขภาษีถูกล้าง

**ผิดกฎ:** ไม่ใช่ convention — เป็น bug ตรง ๆ (ลำดับด้านล่างคือเหตุผล) · เกี่ยวกับ `api-contract.md` § Optional body fields —
`@IsOptional()` + `T | null`, never `?:` ซึ่งแยก "ไม่ส่ง" (`undefined`) ออกจาก "ล้างค่า" (`null`) ตั้งใจให้ service แยกสองกรณีนี้ด้วย
**เกิดอะไรใน PR นี้:**

```ts
const customerId = data.customer_id ?? stored.customer_id;   // ~1183
```

`??` ถือว่า `null` เท่ากับ "ไม่ได้ส่งมา" จึงได้ id เดิมกลับมา แต่ `customer = resolveCustomer(null)` ได้ `null`
→ snapshot `customer_name_th` / `customer_tax_id` / `customer_address` เป็น null ขณะที่ `customer_id` ยังชี้ลูกค้าคนเดิม —
เอกสารชี้ลูกค้าคนหนึ่งแต่พิมพ์ชื่อว่าง และ `resolveReferencedReceipt()` ก็ได้ id ผิดตัวไปด้วย
**แก้:** `data.customer_id !== undefined ? data.customer_id : stored.customer_id` แล้วเขียน `customer_id` จากค่าเดียวกับที่ใช้
resolve snapshot · unit test: PUT `customer_id: null` → id และชื่อเป็น null พร้อมกัน

### 🟠 F5 · CN/DN ออกให้ผู้ซื้อคนละคนได้ เมื่อฝั่งใดฝั่งหนึ่งเป็น null

**ผิดกฎ:** `business-documents.md` § Statutory documents — "a correction is a credit/debit note referencing the document" ·
[srs-p5 · lifecycle](https://iots1.github.io/plan-erp/srs-p5.html#p5-lifecycle)
**ทำไมกฎนี้มี:** ใบลดหนี้/เพิ่มหนี้คือการแก้ใบเดิม จึงต้องออกให้ผู้ซื้อคนเดียวกับใบที่อ้าง (เดิมโค้ดบังคับไว้แล้ว: "an adjustment must be
issued to the same buyer") — ไม่งั้นภาษีขายของใบเดิมถูกปรับโดยเอกสารของอีกคน
**เกิดอะไรใน PR นี้:** `resolveReferencedReceipt()` (~339) ข้ามการเช็คเมื่อ `customerId` หรือ `referenced.customer_id` เป็น null —
ใบลดหนี้ไม่ระบุลูกค้าอ้างใบ ABB ที่**มี**ลูกค้าได้ (และกลับกัน)
**แก้:** `(customerId ?? null) !== (referenced.customer_id ?? null)` → 400 — null ต้องคู่กับ null

### 🟠 F6 · `customer_name` ของ response เป็น `null` ทั้งก้อนได้

**ผิดกฎ:** root `CLAUDE.md` § Crucial project rule — bilingual i18n (TH/EN) ·
[i18n-guide · Response](https://iots1.github.io/plan-erp/i18n-guide.html#response)
**ทำไมกฎนี้มี:** `LocalizationInterceptor` ส่ง `{ th, en }` **เสมอ** แม้ทั้งสองค่าเป็น null — เป็น contract ที่คงที่ให้ frontend
อ่าน `customer_name.th` ได้โดยไม่ต้องเช็ค null ทั้งก้อน
**เกิดอะไรใน PR นี้:** `PosSaleResponseDTO.customer_name: { th; en } | null` + `@ApiPropertyOptional` — Swagger บอก client ว่าอาจได้
`null` ทั้งก้อน ซึ่งไม่จริง client ที่เชื่อ Swagger จะเขียน null-check เกินจำเป็น หรือที่แย่กว่าคือ client ที่ generate type จาก Swagger
**แก้:** คืน type เดิม `{ th: string | null; en: string | null }` + `@ApiProperty` (ส่วน `customer_id` แบบ
`@ApiPropertyOptional({ nullable: true })` ถูกแล้ว — ถอนข้อเสนอรอบแรก)

### 🟠 F7 · migration `down()` พังทันทีที่มีข้อมูลจริง

**ผิดกฎ:** `migrations-and-seed.md` § Migrations — generate from the entity diff, never hand-write schema
("review the generated SQL — the diff is a starting point, not gospel") ·
[backend-convention · 13](https://iots1.github.io/plan-erp/backend-convention.html#migrations)
**ทำไมกฎนี้มี:** generator เขียน `down()` เป็นภาพกลับด้านของ schema โดยไม่รู้ว่ามีข้อมูลแบบไหนอยู่ ผู้เขียนต้องอ่านและเติม guard เอง
**เกิดอะไรใน PR นี้:** ทั้ง 3 ไฟล์ `SET NOT NULL` ตรง ๆ — มีบิล walk-in แถวเดียว rollback ก็ล้ม (ของ finance มี 6 คำสั่ง พังกลางทาง)
และแถวที่ไม่มีลูกค้าเติมค่าที่ถูกต้องกลับไม่ได้
**แก้:** ใน `down()` (เป็นโค้ด TS ก่อนคำสั่งที่ generate ไว้) นับแถวที่เป็น null แล้ว `throw` ข้อความชัด ๆ ว่า rollback ไม่ได้เพราะมีเอกสาร
walk-in กี่ใบ — แนวเดียวกับ migration บิลพัก (`HANDOFF-product-suspend-sales-review.md` §3)

### 🔴 F8 · migration ต้องเป็นไฟล์ที่ TypeORM generate ออกมาตรง ๆ — ห้ามเขียนเองหรือให้ AI เขียน

**ผิดกฎ:** `migrations-and-seed.md` § Migrations — generate from the entity diff, never hand-write schema (+ bullet เรื่อง timestamp) ·
[backend-convention · 13](https://iots1.github.io/plan-erp/backend-convention.html#migrations)
**ทำไมกฎนี้มี:** schema ที่เขียนเองจะเพี้ยนจาก entity แล้ว `migration:generate` รอบถัดไปจะ "แก้กลับ" ให้เงียบ ๆ · timestamp คือลำดับการรัน
และเป็น key ในตาราง `migrations` — เลขที่แต่งเองหรือเอาเลขไฟล์ข้าง ๆ มาบวก จะสลับลำดับหรือชนกับ migration ที่เขียนทีหลัง
**เกิดอะไรใน PR นี้** (`.claude/skills/review-pr/scripts/migration-audit.mjs --generate`):

- `1793348536105-MakePosSalesCustomerNullable` (sales) **ไม่ตรงกับที่ generator สร้าง** — generator ปลด/ใส่ FK ใหม่รอบการเปลี่ยน nullable
  (`ALTER TABLE "pos_sales" DROP CONSTRAINT "fk_pos_sales_customer_id"` … `ADD CONSTRAINT "fk_pos_sales_customer_id" FOREIGN KEY …`)
  แต่ไฟล์ใน PR ไม่มีคู่นี้ = เขียนเองหรือตัดออกหลัง generate
- finance และ report SQL ตรง แต่ timestamp ห่างกัน**พอดี 1000 ms** (`1793351930993` → `1793351931993`) — generator ไม่ให้เลขแบบนี้

**แก้:** ลบ migration ทั้ง 3 ไฟล์ (ยังไม่เคยรันที่ไหน ลบได้ปลอดภัย) → `pnpm run migration:generate:sales|finance|report --name=…`
→ commit ไฟล์ที่ได้**โดยไม่แก้ SQL** (`pnpm lint` จัด format ได้) → guard ของ F7 เติมเป็นโค้ด TS → รัน
`node .claude/skills/review-pr/scripts/migration-audit.mjs --base <merge-base> --generate` ต้องขึ้น "exactly what TypeORM emits" ทั้ง 3 BC

### 🔴 D1 · อัปเดตเอกสารใน `docs/plan-erp` — บังคับ (บล็อก merge)

**ผิดกฎ:** root `CLAUDE.md` § Green verify is half of Done — the spec is the other half ·
`branches-and-commits.md` § The `docs/plan-erp` submodule pin
**ทำไมกฎนี้มี:** `docs/plan-erp` คือ spec ที่ทุกคนวางแผนงานจาก — โค้ดที่ ship โดยไม่แก้ spec ทำให้ spec โกหก
(2026-09-08: เอกสาร 3 ไฟล์อธิบายระบบที่ไม่มีอยู่จริงมาหลายวัน เจอตอนวางงานใหม่) · pin ที่ชี้ commit ที่ยังไม่ push ทำให้คนอื่น
`git submodule update` ไม่ได้ (เกิดแล้ว 2026-10-23 และ 2026-10-26 สองครั้ง)
**เกิดอะไรใน PR นี้:** pin ไม่ขยับ — spec ยังเขียนตาม design เดิมทุกจุด ต้องแก้**ทุกหน้า**ต่อไปนี้:

| หน้า | ข้อความที่ PR นี้ทำให้ไม่จริงแล้ว | ต้องแก้เป็น |
|---|---|---|
| [srs-p4 · #p4](https://iots1.github.io/plan-erp/srs-p4.html#p4) — กล่อง "ต้องมี customer จริงเสมอ" | "ไม่มี 'ลูกค้าทั่วไป' ฝังในระบบ — ร้านต้องสร้าง customer หนึ่งแถวต่อสาขาไว้ใช้ ถ้าปล่อยว่างได้ ยอดขายกลุ่มนี้จะหาย…" | ABB_TAX_INVOICE และบิลพักไม่ระบุลูกค้าได้ · FULL_TAX_INVOICE ต้องมี (ตอนขายและตอน complete) · ยอด walk-in อยู่ในแถว "ไม่ระบุลูกค้า" ของ aging (F2) |
| srs-p4 · ER diagram `POS_SALES` (หัวข้อ 04 ER Diagram) | `uuid customer_id FK` | `uuid customer_id FK "nullable — walk-in ABB / held bill"` และ `customer_name_th` nullable |
| srs-p4 · พักบิล "แก้บิลพัก `PUT /pos-sales/{id}` — แก้ได้ customer_id …" | ไม่บอกว่าล้างเป็น null ได้ | ส่ง `customer_id: null` เพื่อล้างลูกค้าได้ · complete เป็น FULL_TAX_INVOICE โดยไม่มีลูกค้า → 400 และบิลกลับเป็น HELD |
| [api-workflow-guide · B5](https://iots1.github.io/plan-erp/api-workflow-guide.html#flow-sell) — ตัวอย่าง JSON `POST /pos-sales` | `"customer_id": "57d7…", // บังคับ — ลูกค้าทั่วไปหน้าร้านก็ต้องเป็น customer หนึ่งแถว (ดู rulebox)` | optional — ไม่ส่ง/`null` ได้เมื่อ `document_type` = ABB_TAX_INVOICE |
| api-workflow-guide · B5 rulebox "ไม่มี 'ลูกค้าทั่วไป' ฝังในระบบ — ต้องมี customer จริงหนึ่งแถว" | "`customer_id` **บังคับ** ส่ง `null` ไม่ได้ — … สร้าง customer หนึ่งแถวชื่อ 'ลูกค้าทั่วไป / General Customer' ต่อสาขา" | เขียนกฎใหม่: เมื่อไหร่ไม่ต้องมีลูกค้า, เมื่อไหร่ต้องมี และเหตุผล (§86/6 vs §86/4) |
| [api-workflow-guide · ฝั่งเงิน](https://iots1.github.io/plan-erp/api-workflow-guide.html#flow-money) — ตัวอย่าง `POST /payment-entries` | `"party_id": "57d7…", // ลูกค้า (RECEIVE) หรือผู้ขาย (PAY)` | เงื่อนไขของ RECEIVE ที่ไม่มี party (F3) |
| api-workflow-guide · C7 aging | "AR นับเฉพาะเอกสาร ISSUED ต่อใบ = …" | เพิ่มแถว "ไม่ระบุลูกค้า" (F2) |
| [srs-p5 · #p5](https://iots1.github.io/plan-erp/srs-p5.html#p5) — ใกล้ย่อหน้า "ชื่อคู่ค้าภาษาอังกฤษเป็น nullable ทุกเอกสาร (2026-10-26)" + ER `RECEIPTS` / `PAYMENT_ENTRIES` | `uuid customer_id "ref sales-bc"` (ไม่บอกว่า null ได้) | ย่อหน้าใหม่แบบเดียวกัน: `receipts.customer_id` null ได้เฉพาะ type ไหน, `payment_entries.party_id` null ได้เมื่อไหร่, ผลต่อ aging / เครดิตลูกค้า |
| [handoff/HANDOFF-Feature.md](https://iots1.github.io/plan-erp/handoff/HANDOFF-Feature.md) §2 | — | บรรทัดสถานะ: ขายหน้าร้านไม่ระบุลูกค้าได้ (วันที่, BC, migration ที่รัน) |

**ขั้นตอน (ตรงนี้คือจุดที่พลาดบ่อยที่สุด):**
1. แก้ใน `docs/plan-erp` → เปิดหน้า HTML ใน browser ดูว่า render ถูก
2. `git -C docs/plan-erp fetch && git -C docs/plan-erp rebase origin/main` → commit → **push submodule ก่อน**
3. ยืนยัน `git -C docs/plan-erp branch -r --contains HEAD` ต้องเห็น `origin/main`
4. แล้วจึง `git add docs/plan-erp` ใน PR นี้ (pin ขยับ)

รีวิวรอบสองจะเช็คว่า pin ขยับไป commit ที่อยู่บน `origin/main` และทุกหน้าในตารางนี้ถูกแก้จริง — ไม่ครบยังเป็น Request changes

### 🟡 อื่น ๆ (แต่ละข้อยังบอกว่าผิดอะไร)

- **ข้อความ error / comment ที่ไม่จริงแล้ว** — `pos-sales.service.ts` ~349, ~847 ("a POS sale must name a real customer (use the shop's
  'general customer' record…)") และ ~837 ("a bill always has a customer") · ผิดเพราะ: cashier จะได้ error ที่สั่งให้ทำสิ่งที่ไม่จำเป็นแล้ว
  และ comment ที่ขัดกับโค้ดทำให้คนถัดไปเชื่อผิด (`review-branch` §2: "a branch that contradicts a docblock is usually wrong" — กลับกันคือ
  ถ้าตั้งใจเปลี่ยน ต้องแก้ docblock ด้วย)
- **description ของ `CreatePosSaleDTO.customer_id` ขัดกับพฤติกรรม** — บอก "การขายเสร็จสมบูรณ์ต้องมีลูกค้า" แต่ ABB ไม่ต้องมี ·
  ผิดเพราะ: Swagger คือ contract ที่ frontend อ่าน (ไม่ใช่เรื่องย้ายไฟล์ — ถอนข้อนั้นแล้ว)
- **`claimed.customer_id === ''`** ใน `completeHeld()` — คอลัมน์ uuid เป็น `''` ไม่ได้ ตัดทิ้ง (โค้ดที่เป็นไปไม่ได้ทำให้คนอ่านคิดว่ามีกรณีนั้น)
- **`?? ''` ซ่อน null** — `credit-applications.service.ts:100` `target.customer_name_th ?? ''` และ aging `receipt.customer_name_th ?? ''` ·
  ผิด `business-documents.md` § Refuse what does not add up (placeholder แทนค่าที่ "ไม่ควรเป็นไปได้") — target ผ่าน
  `target.customer_id === customerId` มาแล้วจึงมีลูกค้าเสมอ ให้ narrow type / refuse แทน
- **GL narration เป็น `"— null"`** — `receipt-gl-posting.service.ts:109`, `payment-gl-posting.service.ts:81` ต่อ string `— ${customer_name_th}` ·
  ผิดเพราะ: สมุดบัญชีที่ฝ่ายบัญชีอ่านขึ้นคำว่า null — ใช้ `?? 'ไม่ระบุลูกค้า'` หรือตัดส่วนชื่อออกเมื่อไม่มี
- **print** — `receipt-print-params.util.ts` ส่ง `customer_name_th` / `customer_tax_id` เป็น null (paginator แสดงเป็นค่าว่าง ไม่พัง) ·
  ตาม `entities-and-schema.md` § Every `*_en` column is nullable — "a print mapper sends `?? ''`" ทำให้เหมือน field อื่นในไฟล์
  และพิจารณาพิมพ์ "ลูกค้าทั่วไป / Walk-in" บนสลิป
- **unit test ที่ยังขาด** — `testing.md` § What a change owes the suite ("unit tests per branch including the error path, assert the
  exception class"): complete บิลพัก FULL_TAX ไม่มีลูกค้า (400 + กลับเป็น HELD), `receipts.update` (F1, F4), payment RECEIVE ไม่มี
  party (F3), CN อ้างใบที่ลูกค้าต่างกัน (F5)

### ✅ ที่ทำได้ดี

- เช็คว่า FULL_TAX_INVOICE ต้องมีลูกค้า ทั้งตอนขายตรงและตอน complete บิลพัก และทำ**หลัง claim** (กัน race กับ `updateHeld`)
  แล้ว release claim ก่อน throw — ตรงกับ `business-documents.md` § A state transition that calls another BC claims the row first
- ไล่ nullable ของ `customer_id` ครบทั้งสาย (entity → contract interface → event payload → read model ของ report) —
  ตรงกับ `entities-and-schema.md` § Changing a source column changes every copy of it ไม่มี snapshot ค้างแบบรอบก่อน
- DTO ใช้ `@IsOptional()` + `T | null` ถูกตาม `api-contract.md` § Optional body fields
- migration ของ finance / report SQL ตรงกับที่ TypeORM generate ทุกคำสั่ง และ comment คอลัมน์อัปเดตตาม entity

---

## 3. การตัดสินใจ

| เรื่อง | ตัดสินใจ / แนะนำ |
|---|---|
| ยอมให้ขายหน้าร้านไม่ระบุลูกค้าหรือไม่ | **ยอม** สำหรับ ABB_TAX_INVOICE (§86/6) และบิลพัก — FULL_TAX_INVOICE ยังบังคับ (ตามที่ PR ทำ) |
| type ไหนใน finance-bc ที่ไม่มีลูกค้าได้ | **แนะนำ:** เฉพาะ `ABB_TAX_INVOICE`, `RECEIPT` และ CN/DN ที่อ้างใบที่ไม่มีลูกค้า (F2) |
| ยอดที่ไม่มีลูกค้าใน aging | **แนะนำ:** แสดงเป็นแถว "ไม่ระบุลูกค้า" ไม่ตัดทิ้ง (F2) |
| payment RECEIVE ที่ไม่มี party | **แนะนำ:** ต้องตัดใบที่ไม่มีลูกค้าเต็มจำนวน ห้ามมีเงินเหลือ (F3) |
| migration | **บังคับ:** generate ใหม่ด้วย TypeORM ห้ามแก้ SQL (F8) |

ถ้าจะทำต่างจากที่แนะนำ ให้คุยกับ lead ก่อนเริ่มแก้ แล้วเขียนเหตุผลลง srs-p5

---

## 4. แผนแก้ (poompakorn — ทำบน branch เดิม แก้เป็น commit ต่อท้าย)

1. **F1–F4 (🔴)** พร้อม unit test ของแต่ละข้อ
2. **F8** — ลบ migration ทั้ง 3 ไฟล์แล้ว generate ใหม่ด้วย TypeORM (ห้ามแก้ SQL) · ใส่ guard ของ F7
3. **F5, F6** และรายการ 🟡 · `pnpm lint`
4. **D1** — แก้เอกสารทุกหน้าในตาราง D1 → push submodule ก่อน → bump pin
5. **smoke ที่ยิง endpoint จริง** — copy โครงจาก `apps/sales-bc/test/smoke/customers.smoke.mjs`
   ของ sales-bc ต้องประกาศ `needs: ['finance-bc']` เคสอย่างน้อย:
   - `POST /pos-sales` ABB_TAX_INVOICE ไม่ส่ง `customer_id` → 201 · ตรวจใน finance DB ว่า `receipts.customer_id` และ
     `payment_entries.party_id` เป็น null
   - `POST /pos-sales` FULL_TAX_INVOICE ไม่ส่ง `customer_id` → 400
   - พักบิลไม่มีลูกค้า → complete เป็น ABB ได้ · เป็น FULL_TAX_INVOICE ได้ 400 และบิล**กลับเป็น HELD**
   - `POST /receipts` FULL_TAX_INVOICE / INVOICE ไม่มีลูกค้า → 400 · `PUT` draft ABB เป็น FULL_TAX_INVOICE → 400 (F1)
   - `POST /payment-entries` RECEIVE ไม่มี party และไม่มี allocation → 400 (F3)
6. รัน migration ทั้ง 3 BC (`migration:run:sales|finance|report`) → `pnpm verify sales-bc`, `pnpm verify finance-bc`,
   `pnpm verify report-bc` เขียวครบ 6 ขั้น
7. `pnpm check:branch` ต้องผ่าน 0 warning (รวม `docs-not-updated`) → push → ขอรีวิวรอบสอง

---

## 5. ผลหลังแก้

_ยังไม่ได้แก้ — เติมหลังรีวิวรอบสอง_

| BC | typecheck | lint | unit | e2e | build | smoke |
|---|---|---|---|---|---|---|
| sales-bc | | | | | | |
| finance-bc | | | | | | |
| report-bc | | | | | | |

- migration ที่รันบน DB กลาง / audit `--generate`:
- D1 — pin ขยับไป: · หน้าที่แก้แล้ว:
- สิ่งที่ frontend ต้องรู้: `customer_id` ของ POS / receipt / payment entry เป็น `null` ได้ · `customer_name` ยังเป็น `{ th, en }` เสมอ
  (ค่าข้างในเป็น null ได้)
