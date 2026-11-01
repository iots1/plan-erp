# Handoff — รีวิว branch `feature/purchase-discound-document`

> ถึง: poompakorn · รีวิวเมื่อ 2026-10-23
> ขอบเขต: 2 commit บน branch นี้ เทียบกับ `main` (`dc0689f`)
>
> - `2b4f60e` feat: add discount and subtotal details to goods receipt print template and parameters
> - `0a114ae` fix: remove empty or unneeded file from repository

การแก้ไขทั้งหมด push ขึ้น branch เดิมแล้วเป็น 6 commit **ต่อท้าย** commit ของคุณ
(`c7e1fae` → `903a171`) ไม่ได้แก้ history และไม่ได้ force push commit ทั้งสองของคุณยังอยู่ครบ
ให้ `git pull` ก่อนทำงานต่อบน branch นี้

---

## 1. สิ่งที่ต้องทำต่อ (สำคัญที่สุด อ่านก่อน)

1. **docs ใน `docs/plan-erp` @ `d8e1de9` คือฉบับหลักแล้ว — `9d81fd6` ถูกแทนที่**
   commit `0a114ae` เคยชี้ submodule ไปที่ `9d81fd6` ซึ่งไม่เคยถูก push ขึ้น `iots1/plan-erp`
   ตอนนี้ pin ไปที่ `d8e1de9` (ต่อจาก `d4e6371` และอยู่บน remote แล้ว) และใช้ฉบับนี้เป็นหลัก
   ในเครื่องคุณให้รัน `git pull && git submodule update docs/plan-erp` อย่า commit pin `9d81fd6` กลับเข้ามา
   ถ้าใน `9d81fd6` มีเนื้อหาที่ยังต้องการ ให้เขียนใหม่ต่อจาก `origin/main` ของ submodule แล้ว push submodule **ก่อน**
   จากนั้นค่อย commit pin ใน erp-api
2. **ตรวจสอบการแก้ไขใน §3** ทุกอย่าง push แล้ว ถ้าไม่เห็นด้วยกับข้อไหน ให้ revert เป็นราย commit ได้ เพราะแยก commit ตามเรื่องไว้
3. ถ้ามี environment ที่ใช้ DB แยกจากตัวที่ dev ใช้อยู่ ต้อง**ลงทะเบียน `receipt_slip`** เองที่นั่น (ดู §5)

---

## 2. สรุปผล verify

ผล `pnpm verify <bc>` รอบสุดท้ายหลังแก้ทั้งหมด (6 ขั้น: typecheck → lint → unit → e2e → build → smoke)

| BC | typecheck | lint | unit | e2e | build | smoke |
|---|---|---|---|---|---|---|
| inventory-bc | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 8/8 |
| supplier-bc | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 2/2 |
| sales-bc | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 7/7 |
| finance-bc | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 13/13 |
| report-bc | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 1/1 |

ระหว่างทางเจอ smoke `finance-bc · supplier credit` fail เพราะสมมติฐานเรื่องข้อมูล ไม่เกี่ยวกับ branch นี้:
smoke หยิบราคาทุนของ GRN ล่าสุดมาทำใบลดหนี้ 1 หน่วย แล้วดึงเครดิตออก 100 บาท ตอนนี้ GRN ล่าสุดทุน 90 บาท (+VAT = 96.3)
จึงแก้ query ให้เลือกเฉพาะบรรทัดที่ `import_cost >= 100`

`npx tsc -p tsconfig.json --noEmit` (ซึ่งรวม spec ด้วย) ยังมี error 7 จุดที่มีอยู่แล้วก่อน branch นี้
(spec ของ customer/supplier credit ใน finance-bc และ `delivery-note-operations.service.spec.ts`) ไม่ได้แตะ

รอบ baseline ก่อนแก้ (โค้ดตาม 2 commit เดิม) static ผ่านครบ แต่ smoke **fail 2 จุด**
(`sales-bc · POS counter sale` และ `finance-bc · supplier credit`) ด้วยสาเหตุเดียวกัน:
`column "source_doc_number" of relation "stock_movements" does not exist` เพราะ migration ของ branch ยังไม่ได้รัน
ซึ่งแปลว่า branch นี้**ยังไม่เคยผ่านขั้น smoke** ก่อน push

---

## 3. สิ่งที่แก้ไขไปแล้ว

| # | ปัญหาที่พบ | แก้อย่างไร | ไฟล์หลัก |
|---|---|---|---|
| 1 | ใบรับสินค้า (GR) ที่พิมพ์ใช้ `sub_total`/`total_discount`/`total` **ของ PO ทั้งใบ** ขณะที่บรรทัดสินค้ามาจาก GR ถ้ารับไม่ครบหรือแบ่งรับหลายใบ ยอดท้ายใบจะเกินของที่รับจริง เทสต์เดิมก็มีความลักลั่นนี้ฝังอยู่ (บรรทัดรวม 900 แต่พิมพ์ sub_total 1,000) | คิดใหม่จาก**เงื่อนไข PO × จำนวนที่รับในใบนี้**: ราคาต่อหน่วย = `unit_cost` ของ PO; `per_item` ส่วนลด % ใช้ตามเดิม ส่วนลดเป็นเงินเฉลี่ยตามรับ÷สั่ง; `header` เอา `total_discount` ของ PO × สัดส่วน sub_total; `total = sub_total − total_discount` เสมอ | `goods-receipt-print-params.util.ts`, `received-line-amounts.interface.ts` |
| 2 | `catch {}` เปล่าตอนเรียก supplier-bc ซึ่งเป็นโค้ดที่ไม่มีวันทำงาน เพราะ `sendWithContext` คืน `null` ไม่ throw ผลคือพิมพ์ต้นฉบับแบบไม่มีส่วนลดโดยไม่มีใครรู้ | PO เป็น `null` → **503 ไม่พิมพ์** | `goods-receipts.service.ts` |
| 3 | fallback จับคู่บรรทัดด้วย `product_id` เป็นโค้ดที่ไม่มีวันถูกใช้ เพราะ `po_item_id` เป็น `NOT NULL` | ลบออก | util เดียวกัน |
| 4 | โค้ดสร้าง `discount_label` ซ้ำกันใน inventory-bc กับ supplier-bc และฝั่ง inventory ใช้ string `'header'`/`'percent'` แทน enum | ย้ายไปเป็น `formatDiscountModeLabel()` ใน `libs/common/src/utils/print-format.util.ts` พร้อม spec ใช้ทั้งสอง BC | `print-format.util.ts`, `purchase-order-print-params.util.ts` |
| 5 | `IPurchaseOrderLookupResult.discount_mode/discount_type` ประกาศเป็น `string` | เปลี่ยนเป็น `DiscountMode` / `DiscountType` | `purchase-order-lookup-result.interface.ts` |
| 6 | `format: 'slip'` ใช้ได้กับใบเสร็จ**ทุกประเภท** รวมถึงใบกำกับเต็มรูปและใบลด/เพิ่มหนี้ ซึ่งสลิปไม่มีที่ใส่ข้อมูลผู้ซื้อที่ §86/4 และ §86/22 บังคับ | จำกัดให้ใช้ได้เฉพาะ `RECEIPT` และ `ABB_TAX_INVOICE` ประเภทอื่นตอบ 400 | `receipts.service.ts`, `receipt-document-type.constants.ts` |
| 7 | magic string `'slip'`/`'a4'`/`'receipt_slip'` | enum `ReceiptPrintFormat` ใน `libs/common` (ใช้ 2 BC จึงย้ายได้ตาม Rule of Second Use) + constant `RECEIPT_SLIP_PRINT_DOCUMENT_TYPE_CODE` | `receipt-print-format.enum.ts` |
| 8 | `default_receipt_format` เป็น `varchar` + `@IsString()` เลยรับค่าอะไรก็ได้ | เปลี่ยนเป็น enum ระดับ DB + `@IsEnum` **และสร้าง migration ใหม่จาก `migration:generate`** แทนตัวที่เขียนเอง (ตัวเดิมยังไม่เคยรันที่ไหน จึงเปลี่ยนได้) | `sales-setting.entity.ts`, `1792725073669-AddDefaultReceiptFormatToSalesSettings.ts` |
| 9 | `source_doc_type` ไม่สอดคล้องกัน: `stock_movements` ของ POS เป็น `POS_SALE` แต่ event `stock.deducted`/`stock.deduction_reversed` ยังเป็น `DELIVERY` | event ใช้ค่าเดียวกับ movement (เช็คแล้วว่า finance-bc ไม่ได้ใช้ค่านี้) และเพิ่ม comment อธิบายว่าทำไม `reverseDelivery` ไม่ filter ด้วย type | `delivery-issues.service.ts`, `delivery-issue.entity.ts` |
| 10 | string `'DELIVERY'`/`'POS_SALE'` เขียนตรงๆ ใน sales-bc | constant ใน `delivery-note.constants.ts` / `pos-sale.constants.ts` | 2 service |
| 11 | comment ของ `source_doc_number` ไม่ระบุว่าคัดลอกมาจากตารางไหน (ผิด `.claude/rules/entities-and-schema.md`) | ระบุ `goods_receipts.grn_number` / `delivery_notes.dn_number` / `pos_sales.pos_number` ทั้งใน entity และ migration (migration ยังไม่เคยรัน จึงแก้ได้) และเพิ่ม docblock ว่า backfill ได้เฉพาะ GRN | `stock-movement.entity.ts`, migration inventory |
| 12 | `source_doc_number?:` เป็น optional ขณะที่ field ข้างเคียงไม่ใช่ | เปลี่ยนเป็น `string \| null` | DTO + interface ของ stock ledger |
| 13 | การคำนวณ margin ใช้ ternary ซ้อนกัน 4 ชุดที่ซ้ำกัน และมีเลข `25.4`/`0.1`/`0.4` ฝังอยู่ | แยกเป็น `resolveMarginsIn()` + constant + `IGotenbergMarginsIn` (interface แยกไฟล์ตาม convention) | `print-templates.service.ts`, `gotenberg.service.ts` |
| 14 | comment ในโค้ดเป็นภาษาไทย (repo ใช้ภาษาไทยเฉพาะ column comment และ Swagger) | โค้ดที่เขียนใหม่ใช้ภาษาอังกฤษ | util GR |
| 15 | ไม่มี smoke test เลยสำหรับทุกเรื่องใน branch | เพิ่ม/ขยาย smoke 4 ไฟล์ (ดูตารางถัดไป) | `apps/*/test/smoke/` |
| 16 | comment ของ `print_templates.paper_size` ยังบอกแค่ A4/A5/Letter/Legal | เพิ่ม Roll80 + migration comment-only ที่ generate มา | `print-template.entity.ts`, `1792726960467-…` |

**Smoke ที่เพิ่ม**

| ไฟล์ | พิสูจน์อะไร |
|---|---|
| `sales-bc/test/smoke/pos-sales.smoke.mjs` (ขยาย) | movement ของบิล POS ถูกบันทึกเป็น `POS_SALE` และ `source_doc_number` = เลข POS (เช็คใน Postgres จริง) |
| `sales-bc/test/smoke/sales-settings-receipt-format.smoke.mjs` (ใหม่) | API คืน `default_receipt_format` ตรงกับ DB, ค่าแปลกตอบ 400, PUT ค่าเดิมกลับได้ 200 |
| `finance-bc/test/smoke/receipt-slip-print.smoke.mjs` (ใหม่) | ใบกำกับเต็มรูปที่ขอเป็น slip → 400, format แปลก → 400, `receipt_slip` ลงทะเบียนเป็น Roll80 แล้ว, ABB พิมพ์เป็น slip ได้จริงผ่าน template นั้น |
| `inventory-bc/test/smoke/goods-receipts-print.smoke.mjs` (ขยาย) | เพิ่ม `supplier-bc` ใน `needs` และเช็คว่า snapshot ที่พิมพ์มี `sub_total − total_discount = total` |

---

## 4. สิ่งที่ไม่ควรทำ / ผิด convention พร้อมเหตุผล

### 1) ข้อความ commit ต้องตรงกับเนื้อหา และหนึ่ง commit ควรมีเรื่องเดียว
`0a114ae` บอกว่า "remove empty or unneeded file" แต่ข้างในเพิ่มฟีเจอร์ใหม่ 3 เรื่อง
(สลิปใบเสร็จ 80mm, `stock_movements.source_doc_number`, `sales_settings.default_receipt_format`)
และไม่มีไฟล์ไหนถูกลบเลย ทั้งสามเรื่องก็ไม่เกี่ยวกับชื่อ branch (ส่วนลดในเอกสารจัดซื้อ)
**ทำไม:** คนที่ `git log`/`git blame` หาว่าคอลัมน์ใหม่มาจากไหนจะหาไม่เจอ revert แยกเรื่องก็ทำไม่ได้
และ `scripts/resolve-deploy-scope.mjs` ตัดสินว่าจะรัน migration ของ BC ไหนจาก diff ถ้ารวมหลายเรื่องไว้ด้วยกัน
reviewer จะไม่รู้ตัวว่า deploy ครั้งนี้แตะ DB ถึง 2 ตัว
**ครั้งหน้า:** แยก commit ตามเรื่อง เช่น `feat(inventory): …`, `feat(finance): receipt slip …`
ส่วนการเปลี่ยนจาก lint `--fix` (เช่นลบ `public` ออกจาก migration เก่า 20 ไฟล์ใน `2b4f60e`) ให้แยกเป็น `style:` commit ต่างหาก

> การลบ `public` ออกจาก migration เก่า**ไม่ต้องแก้กลับ** เพราะเป็นไปตาม rule `explicit-member-accessibility: no-public`
> SQL ไม่ได้เปลี่ยน และ TypeORM ระบุ migration จาก `name` ไม่ได้ดูเนื้อไฟล์ ข้อติดมีแค่ว่าปนอยู่ใน commit ของฟีเจอร์

### 2) ต้อง push submodule ก่อน commit ตัว pin
อย่า commit ตัว pin ที่ชี้ไป commit ซึ่งยังไม่มีบน remote ลำดับที่ถูกคือ push `docs/plan-erp` ก่อน
ยืนยันว่ามีบน `origin` แล้ว จากนั้นค่อย commit pin ใน `erp-api`
**ทำไม:** pin ที่ชี้ไปของที่ไม่มีอยู่ทำให้ทุกคนที่ clone/update พัง และแก้ได้ทางเดียวคือหาเครื่องที่ยังมี commit นั้นอยู่

### 3) ห้ามดึงเลขเอกสารนอก transaction โดยไม่ตัดสินใจและบันทึกไว้
`pos-sales.service.ts` ย้าย `generateNextNumber()` ออกมานอก transaction และไม่ส่ง `manager`
เลขจึงถูก commit ทันที ถ้าตัดสต็อกไม่ผ่าน (เกิดบ่อยมาก) หรือ finance-bc ล่ม เลข POS ที่ขอไปแล้วก็สูญเปล่า
`.claude/rules/data-access.md` ระบุว่าเป็น bug และยกไฟล์นี้เป็นตัวอย่างที่ถูกต้องด้วย
**สิ่งที่ตัดสินใจไว้:** ยอมให้เลข POS ข้ามได้ เพราะ `pos_number` เป็นเลขอ้างอิงภายใน ไม่ใช่เลขตาม §86/4
(เลขใบกำกับที่ finance-bc ออกยังเรียงไม่ขาด) ได้เพิ่ม comment ในโค้ด แก้ข้อความ 503 ให้บอกเลขที่ข้าม และบันทึกกติกาใน srs-p4 แล้ว
**ทำไมต้องบันทึก:** ถ้าไม่บันทึก คนถัดไปจะคิดว่าเป็น bug แล้ว "แก้" กลับ หรือแย่กว่านั้นคือเอารูปแบบนี้ไปใช้กับเลขใบกำกับที่กฎหมายบังคับให้ต่อเนื่อง

### 4) ห้าม `catch {}` เปล่าเพื่อ "fallback อย่างนุ่มนวล" ในงานที่ผลลัพธ์ถาวร
การพิมพ์ครั้งแรกถูกบันทึกเป็น**ต้นฉบับ** (`copy_number = 1`) ถ้า supplier-bc ล่มตอนนั้น ต้นฉบับจะออกมาโดยไม่มีส่วนลด
และแก้ด้วยการพิมพ์ซ้ำไม่ได้ (ใบถัดไปเป็นสำเนา)
และ `sendWithContext` **ไม่เคย throw** (คืน `null`) ดังนั้น `catch` นั้นไม่เคยทำงานเลย
**หลัก:** ถ้าการเรียกข้าม BC ล้มแล้วทำให้ผลลัพธ์ผิดแบบถาวร ให้ตอบ 503 ถ้ายอมให้ผ่านได้จริง อย่างน้อยต้อง log ไม่ใช่เงียบ
(ดู "Microservice (TCP) calls" ใน CLAUDE.md: เช็ค `null` ไม่ใช่ `try/catch`)

### 5) ห้ามคิดยอดเอกสารหนึ่งจากยอดรวมของอีกเอกสาร
ใบรับสินค้าคือ "ของที่มาจริงในใบนี้" ส่วน `sub_total`/`total` ของ PO คือ "ทั้งคำสั่งซื้อ"
การเอายอดของ PO มาใส่ท้ายใบรับ ผิดทุกครั้งที่รับไม่ครบหรือแบ่งรับ
**ทำไม:** ฝ่ายบัญชีเอาใบรับที่พิมพ์ไปเทียบกับใบแจ้งหนี้ของผู้ขาย ถ้ายอดบนใบรับเกินของที่มาจริง ใบแจ้งหนี้ที่เรียกเก็บเกินจะดูเหมือนถูกต้อง
(ระบบ 3-way match ใน finance-bc ใช้ข้อมูล GR จริง ไม่ได้ใช้ PDF แต่คนที่ตรวจด้วยตาจะใช้ PDF)

### 6) ห้ามเปิดให้พิมพ์เอกสารภาษีบน layout ที่ไม่มีช่องสำหรับข้อมูลที่กฎหมายบังคับ
สลิปไม่มีชื่อ ที่อยู่ เลขผู้เสียภาษี และสาขาของผู้ซื้อ ถ้าพิมพ์ใบกำกับเต็มรูป (§86/4) หรือใบลด/เพิ่มหนี้ (§86/22) ลงสลิป
จะได้เอกสารภาษีที่ไม่ครบตามกฎหมาย ต้อง guard ฝั่ง backend ไม่ใช่หวังให้ FE ไม่ส่งมา

### 7) Enum ไม่ใช่ `string` + `@IsString()`
`default_receipt_format` และ `format` มีค่าที่เป็นไปได้จำกัด ต้องเป็น enum + `@IsEnum` + enum ระดับ DB
ไม่งั้น `PUT { "default_receipt_format": "foo" }` จะถูกเก็บลง DB และหน้าร้านพิมพ์ไม่ได้
ทั้งนี้ `discount_mode`/`discount_type` ที่ฝั่ง inventory ใช้ string `'header'`/`'percent'` ก็เป็นปัญหาเดียวกัน

### 8) Migration ที่เปลี่ยน schema ให้ generate จาก entity diff อย่าเขียนเอง
`.claude/rules/migrations-and-seed.md`: แก้ entity ก่อน แล้ว `npm run migration:generate:<bc> --name=…`
(ใช้ `npm` เพราะ `pnpm` ส่ง `--name` ผ่าน `$npm_config_name` ไม่ได้) แล้วอ่าน SQL ที่ได้
migration ที่เขียนเองมักไม่ตรงกับ entity และ `migration:generate` รอบถัดไปจะ "แก้กลับ" ให้โดยไม่มีใครรู้
ส่วนที่เขียนเองได้คือ backfill เช่น `UPDATE … FROM goods_receipts` ใน migration ของ inventory ซึ่งทำถูกแล้ว

### 9) Copy-paste logic ข้าม BC → ย้ายไป `libs/common` ตั้งแต่เกิดการใช้ครั้งที่สอง
`discount_label` ถูกเขียนซ้ำใน supplier-bc และ inventory-bc (Rule of Second Use ใน `.claude/rules/naming-and-code-style.md`)
**ทำไม:** สองสำเนาจะเริ่มต่างกันเมื่อมีคนแก้แค่ฝั่งเดียว แล้ว PO กับใบรับของเอกสารเดียวกันจะเรียกส่วนลดคนละแบบ

### 10) Magic string ที่ข้าม BC ให้เป็น constant
`'DELIVERY'`, `'POS_SALE'`, `'receipt_slip'`, `'Roll80'` ถ้าพิมพ์ผิดตัวเดียว ledger จะได้ type ใหม่ที่ไม่มีใครรู้จัก
หรือการพิมพ์จะ 404 โดยที่ compiler ไม่เตือน

### 11) Column comment ต้องบอกว่าค่าคัดลอกมาจากตารางไหน
`.claude/rules/entities-and-schema.md`: ค่าที่คัดลอกมาจากตารางอื่น (snapshot) ต้องระบุ `คัดลอกจาก <table>.<column>`
และระบุ BC ถ้าข้าม BC คำว่า "เลขที่เอกสารต้นทาง เช่น GRN-…" ไม่บอกว่าข้อมูลมาจากไหน

### 12) ทุกฟีเจอร์ต้องมี smoke และต้องผ่าน `pnpm verify` ก่อน push
CLAUDE.md "Definition of Done" — branch นี้ไม่มี smoke เลย และ smoke เดิมก็ fail
เพราะ migration ไม่ได้รัน ขั้น 1–5 (typecheck/lint/unit/e2e/build) มองไม่เห็นปัญหาแบบนี้
มีแค่ขั้น 6 ที่เห็น และต้องอัปเดต SRS/api-workflow-guide ใน turn เดียวกัน

### 13) อื่นๆ เล็กน้อย
- ชื่อ branch สะกดผิด `discound` → `discount` (ถ้าจะเปลี่ยน ต้องเปิด branch ใหม่ ไม่ต้อง rename branch ที่ push ไปแล้ว)
- shape ที่ใช้มากกว่าหนึ่งที่ (เช่น margins ที่ทั้ง `print-templates.service.ts` และ `gotenberg.service.ts` ใช้) ให้เป็น `I*` interface ในไฟล์ของตัวเองใต้ `interfaces/` แทนการเขียน object type inline ซ้ำๆ
- Comment ในโค้ดใช้ภาษาอังกฤษให้เหมือนส่วนอื่นของ repo
- ข้อความ commit ใช้ conventional commits พร้อม scope (`feat(inventory): …`)

---

## 5. การเปลี่ยนแปลงใน DB / environment ที่ทำไปแล้ว

DB ที่ `.env` ชี้อยู่ (ตอนนี้ dev/prod ใช้ DB ร่วมกัน):

| อะไร | สถานะ |
|---|---|
| `erp_inventory` · `AddSourceDocNumberToStockMovements1792663880392` | **รันแล้ว** (เพิ่มคอลัมน์ nullable + backfill GRN) |
| `erp_sales` · `AddDefaultReceiptFormatToSalesSettings1792725073669` | **รันแล้ว** (enum `slip`/`a4` default `slip`) — ไฟล์ `1792655587438-…` ตัวเดิมถูกแทนที่ เพราะไม่เคยรันที่ไหนมาก่อน |
| `erp_report` · `AddRoll80ToPrintTemplatePaperSizeComment1792726960467` | **ยังไม่รัน** (แก้แค่ comment) CI จะรันให้ตอน deploy |
| `print_templates` `receipt_slip` (Roll80, banded, จาก `receipt-slip.html`) + `document_types` `receipt_slip` | **สร้างแล้ว** ผ่าน `POST /print-templates` และ `POST /document-types` |
| drift check (`migration:generate --check`) ของ sales และ inventory | ไม่มี drift |

CI (`.github/workflows/deploy.yml`) รัน `migration:run` ให้เองเมื่อ push เข้า `main`/`develop`
โดยดูจาก diff ใน `libs/database/src/migrations/erp_<bc>/` migration ที่รันไปแล้วจะถูกข้าม (มีชื่ออยู่ในตาราง `migrations`)
**แต่ `receipt_slip` ไม่ใช่ migration** environment อื่นต้องลงทะเบียนเองตาม `apps/report-bc/src/modules/print-template/assets/templates/_README.md`

---

## 6. เอกสารที่อัปเดต (`docs/plan-erp` @ `d8e1de9` — push แล้ว)

- `srs-p3.html` — ER `STOCK_MOVEMENTS` (+`source_doc_type`, `source_doc_number`), RULE · LEDGER ระบุเอกสารแม่ได้เอง, RULE · ใบรับสินค้าที่พิมพ์ = เงื่อนไข PO × จำนวนที่รับจริง
- `srs-p4.html` — ขั้นตัดสต็อกของ POS, RULE · เลข POS ออกก่อนตัดสต็อก (ข้ามได้โดยตั้งใจ), RULE · กระดาษใบเสร็จเริ่มต้นของร้าน
- `srs-p5.html` — RULE · สลิปใบเสร็จ 80mm
- `api-workflow-guide.html` — B5 POS (`format: slip`, rulebox เลข POS/ledger), ตารางใบเสร็จ, E1 stock ledger (`source_doc_number`), E3.1 (`format`, แถวพิมพ์ GR, rulebox slip และยอดใบรับสินค้า), ตาราง settings

ทั้งหมด render-check ด้วย headless Chrome แล้ว (mermaid ไม่มี error, tag เปิด-ปิดครบ)
