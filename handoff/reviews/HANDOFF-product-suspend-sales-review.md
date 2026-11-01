# Handoff — รีวิว branch `feature/product`, `feature/suspend-sales` และ `feature/optional-cus-supplier`

> ถึง: poompakorn · รีวิวเมื่อ 2026-10-26
> ขอบเขต: ทั้งสาม branch แตกจาก `main` @ `d130438`
>
> - `feature/product` — `e7dee39` feat: make product english name nullable in database and DTOs ·
>   `b26a8c6` feat: add customer_id query filter to quotations, infer per-item discount mode in POS sales, and support continuous print templates
> - `feature/suspend-sales` — `98c070b` feat: add support for holding, completing, and cancelling POS sales
> - `feature/optional-cus-supplier` — `bbeb776` refactor: make English name optional for customers and suppliers with fallback to Thai name

**สถานะ**

| Branch | สถานะ |
|---|---|
| `feature/product` | แก้ + verify 5 BC ครบ 6 ขั้น → push แล้ว (commit แก้ 5 ตัว **ต่อท้าย** ของคุณ) → **merge เข้า `main` แล้ว** |
| `feature/suspend-sales` | ออกแบบเส้นบิลพักใหม่ + verify → push แล้ว (3 commit ต่อท้าย) → **merge เข้า `main` แล้ว** (`53a494d`) |
| `feature/optional-cus-supplier` | merge `main` เข้า branch (`49260cd`) + แก้ตาม §4 + verify 4 BC → push แล้ว (3 commit ต่อท้าย) → **merge เข้า `main` แล้ว** (`21aa675`) |

ไม่มีการแก้ history หรือ force push commit ของคุณยังอยู่ครบทุกตัว — **`git pull` ก่อนทำงานต่อบนทั้งสาม branch**

---

## 1. สิ่งที่ต้องรู้ก่อน (อ่านก่อน)

1. **pin `docs/plan-erp` → `9d81fd6` กลับมาเป็นครั้งที่ 3 แล้ว — ทั้งสาม branch** — commit นี้ไม่เคยอยู่บน
   `iots1/plan-erp` และ `HANDOFF-purchase-discount-document-review.md` §1.1 (2026-10-23) แจ้งไว้แล้วว่าห้าม commit pin นี้กลับเข้ามา
   ใครก็ตามที่ checkout branch จะ `git submodule update` ไม่ผ่าน
   - **ในเครื่องคุณ:** `cd docs/plan-erp && git fetch && git checkout origin/main` — `9d81fd6` ในเครื่องคุณไม่ต้องใช้แล้ว
     (ถ้าในนั้นมีเนื้อหาที่ยังต้องการ ให้เขียนใหม่ต่อจาก `origin/main` แล้ว push submodule **ก่อน**)
   - **สาเหตุที่เจอบ่อย:** `git add -A` / `git commit -a` หยิบ pin ที่ขยับไปด้วยเงียบ ๆ — ดู `git status` ทุกครั้งก่อน commit
     ถ้ามีบรรทัด `docs/plan-erp` ที่ไม่ได้ตั้งใจ ให้ `git checkout origin/main -- docs/plan-erp`
   - **ตอนนี้มีตัวจับให้แล้ว:** `pnpm check:branch` และ CI (§6) จะ fail ถ้า pin ชี้ commit ที่ไม่มีบน remote
2. **ไม่มี smoke file และไม่มี docs ในทั้งสาม branch** — `CLAUDE.md` § Definition of Done:
   ฟีเจอร์ที่ไม่มี `apps/<bc>/test/smoke/*.smoke.mjs` คุมถือว่ายังไม่ verify (ทุกปัญหา 🔴 ในไฟล์นี้ ขั้น 1–5 มองไม่เห็น มีแต่ smoke ที่เห็น)
   และ spec ใน `docs/plan-erp` ต้องอัปเดตในรอบเดียวกับโค้ด — รอบนี้ docs ทำให้แล้ว (§5.4)
3. **ทำทีละเรื่องต่อ commit** — `b26a8c6` รวม 3 เรื่อง (filter ใบเสนอราคา, ส่วนลด POS, print template) ใน commit เดียว
   และ `98c070b` ก็ 3 เรื่อง แยก commit ตามเรื่องเพื่อให้ revert / blame / deploy แยกกันได้
   (`.claude/rules/branches-and-commits.md`)

---

## 2. `feature/product`

### 🔴 P1 · `products.name_en` เป็น null ได้ แต่ทุกที่ที่ snapshot ชื่อนี้ยังเป็น `NOT NULL`

เปลี่ยนแค่ต้นทาง (`products.name_en`, `CreateProductDTO`, `IItemUpdatedEventPayload`,
`IGoodsReceiptLineRow`) แต่ชื่อสินค้าถูก **คัดลอกไปเก็บ** ในเอกสารทุกใบตอนออกเอกสาร และคอลัมน์ปลายทางยัง `NOT NULL`:

| BC | ตาราง · คอลัมน์ |
|---|---|
| sales-bc | `quotation_items`, `sales_order_items`, `pos_sale_items` · `product_name_en` |
| finance-bc | `receipt_items`, `ap_invoice_items` · `product_name_en` |
| report-bc | `low_stocks`, `expiry_alerts` · `product_name_en` (read model เขียนโดย event consumer) |

(`purchase_order_items` / `goods_receipt_items` nullable อยู่แล้วบน main)
และ `libs/common/src/interfaces/product-lookup-result.interface.ts` ยังประกาศ `name_en: string`
ผลคือ **สินค้าที่ไม่กรอกชื่ออังกฤษ จะเพิ่มลงใบเสนอราคา / SO / POS / ใบเสร็จ / AP ไม่ได้เลย**
(Postgres `23502` → `400`) และ consumer ของ report-bc จะ nack event ซ้ำ ๆ —
typecheck มองไม่เห็นเพราะ interface ข้าม BC ยังบอกว่าเป็น `string`

**ตัดสินใจ:** nullable ทั้งสาย — ทุก snapshot เป็น `string | null` + migration ที่ **generate** จาก entity diff ทุก BC
+ lookup interface + response DTO `nullable: true` + print mapper ส่ง `''` เมื่อเป็น null
(`LocalizationInterceptor` ส่ง `{ th, en: null }` ออกไปเหมือนเดิม) — กฎนี้เขียนไว้แล้วที่
`.claude/rules/entities-and-schema.md` § Changing a source column changes every copy of it

### 🔴 P2 · POS แอบเปลี่ยน `discount_mode` ขัดกฎ `business-documents.md`

```ts
data.discount_mode === HEADER ? HEADER
  : data.discount_mode === PER_ITEM || lines.some((l) => (l.discount ?? 0) > 0) ? PER_ITEM
  : data.discount_mode ?? NONE
```

`.claude/rules/business-documents.md` (domain law) ระบุว่า `discount_mode` เป็น**ตัวตัดสินเดียว** และ
"นอก `per_item` ส่วนลดรายบรรทัดที่ client ส่งมา**ถูกทิ้ง**" — โค้ดนี้ override แม้ client ส่ง `none` มา**ชัด ๆ**
ternary ซ้อนอ่านยาก และกฎนี้ไม่ได้เขียนไว้ที่ไหน

**ตัดสินใจ:** infer `per_item` **เฉพาะตอนที่ client ไม่ส่ง `discount_mode` มา** และมีบรรทัดที่มีส่วนลด
ถ้าส่งมาชัดเจนใช้ตามนั้น → `PosSalesService.resolveDiscountMode()` + เทสต์ 4 กรณี + เขียนเป็นข้อยกเว้นของ POS ใน rules และ srs-p4
(บิลพักใช้ method เดียวกันหลัง merge)

### 🟠 P3 · `customer_id` ของ quotations สร้าง filter ใน controller

logic ประกอบ query อยู่ใน controller (ควรบาง) และ mutate `query.filter` ที่รับเข้ามา
→ ย้ายไป `QuotationsService.findPaginated()` ประกอบบนสำเนา เป็น alias ของ `?filter=customer_id||$eq||<uuid>` (ส่งทั้งสองได้ = AND)

### 🟠 P4 · print template แบบไม่มี band (slip 80mm)

- `paginator.inline.js` early-return ทำให้ `{{__pages}}` เป็น `<span data-rp-pages>` ว่าง → เติม `1` ให้แล้ว
- การแก้ `receipt-slip.html` (`{{vat_rate}}%` → `{{vat_rate}}`) ถูกต้อง แต่ **ไม่มีผลกับระบบจริงเอง** —
  ไฟล์ใน `assets/templates/` ไม่ถูกอ่านตอน runtime ต้อง PATCH แถว `receipt_slip` ใน `print_templates`
  ตาม `_README.md` (ยังไม่ได้ทำ — ดู §7)

### 🟡 อื่น ๆ

- migration `MakeProductNameEnNullable` — `down()` เติม `name_en = name_th` ก่อน `SET NOT NULL` ถูกแล้ว ดีมาก
- variant generator: `name_en` null/ว่าง → null ถูกต้อง
- import `DiscountMode` วางผิดกลุ่ม

---

## 3. `feature/suspend-sales`

### 🔴 S1 · บิลพักตัดสต็อกทันที → COGS ลงบัญชีก่อนมีรายได้

การตัดสต็อกยิง `stock.deducted` → finance-bc ลง COGS + GL ทันที แต่ `findSaleRevenue()` ตอบ `null`
สำหรับบิลที่ยังไม่ COMPLETED จึงเกิดต้นทุนไม่มีรายได้คู่ (พักข้ามสิ้นเดือน งบเดือนนั้นผิด)
และทุกครั้งที่แก้บิลพักต้อง reverse ของเดิม + ตัดใหม่ ซึ่งเป็น RPC สองครั้งที่ไม่ atomic (S2)

**ตัดสินใจ: บิลพักไม่แตะสต็อกและ finance** — HELD คือตะกร้าที่บันทึกไว้ ตอนปิดบิลค่อยเดินเส้นปกติ
ข้อแลกเปลี่ยนที่ยอมรับ: ของอาจหมดก่อนปิดบิล (ปิดบิลจะได้ error ของ inventory-bc และบิลยังเป็น HELD) — เหมือน POS ทั่วไป

### 🔴 S2 · `updateHeld()` reverse แล้วค่อยตัดใหม่ — ถ้าขั้นที่สองพัง ข้อมูลเสีย

คืนของเดิมสำเร็จ → ตัดใหม่ล้ม → แถว `pos_sale_items` ยังชี้ id ที่**คืนสต็อกไปแล้ว** ปิดบิลต่อของจะออกโดยไม่ถูกตัด
และลบบรรทัดแบบ `delete` + insert ใหม่ ขัดกฎ "update ที่ส่ง `items` ต้อง sync ด้วย `planDocumentLineSync()`"

### 🔴 S3 · คำนวณ VAT เองด้วย `const vatRate = 7`

ขัด docblock ของ `PosSalesService` ("No tax arithmetic") และกฎภาษี: อัตรามาจาก `finance-bc.tax_configs` (มีวันมีผล),
ประเภท standard/zero/exempt มาจาก inventory-bc รายสินค้า — สินค้ายกเว้น VAT จะถูกคิด 7% และเมื่ออัตราเปลี่ยนจะผิดเงียบ ๆ

### 🔴 S4 · `completeHeld()` ไม่ตรวจเงินที่รับ

`Math.max(dto.paid_amount ?? 0, finance.total)` — จ่าย 10 บาทสำหรับบิล 1,000 ก็ผ่านและบันทึกว่ารับ 1,000 (ลิ้นชักขาด)
ต้องตรวจ**ก่อน**ตัดสต็อก/ออกใบกำกับ ไม่งั้นได้ใบกำกับที่มีเลขแล้วยกเลิกไม่ได้

### 🔴 S5 · ปิดบิลพร้อมกันสองเครื่อง → ออกใบกำกับภาษีสองใบ

ตรวจ HELD นอก lock แล้วเรียก finance-bc ทั้งสอง request → ได้ §86/4 สองเลข ก่อนจะชน 409 ตอนเขียนในเครื่อง

### 🟠 S6 · ใบกำกับภาษีใช้วันที่ตอนพัก ไม่ใช่วันที่ปิดบิล

พักเมื่อวาน ปิดวันนี้ = ใบกำกับย้อนวัน (ข้ามเดือน/ปี = เข้างวด/ลำดับเลขผิด) จุดเกิดภาษีคือวันที่ออก/รับเงิน

### 🟠 S7 · ส่วนลดหัวบิลล้างไม่ได้

`dto.discount_type ?? existing.discount_type` — เปลี่ยนจาก `header` เป็น `none` แล้ว type/value เดิมค้าง (กฎ: นอก `header` ต้องเป็น null)

### 🟡 Convention

- `data.payment_method!` (non-null assertion) และ `{ ...dto } as CreatePosSaleDTO` — ให้ type บอกความจริงแทนการ cast
- prose ของ `@ApiOperation` เขียนใน controller — ต้องอยู่ใน `constants/pos-sale.swagger.ts`
- route `PUT /pos-sales/:id/hold` — การแก้ resource คือ `PUT /pos-sales/:id`
- label ใหม่ของ `@RequirePermission('pos_sale:void', …)` จะ**เปลี่ยนชื่อ** permission เดิมใน catalog เงียบ ๆ
  (`permissions:sync` เก็บ label ตัวสุดท้ายที่ scan เจอ) — key เดิมต้องใช้ `{ th, en }` เดิมเป๊ะ
- docblock ของ `PosSalesService` และ `PosSaleStatus` ไม่จริงแล้ว · ไฟล์จบด้วยบรรทัดว่างเกิน
- migration เขียนมือ และ `down()` จะพังถ้ามีแถว HELD ที่ `payment_method` เป็น null
- ไม่มี unit test ของ hold/update/complete/cancel และไม่มี smoke

---

## 4. `feature/optional-cus-supplier`

### 🔴 C1 · แก้ snapshot แค่ 3 จุด จาก 14 ตาราง — ลูกค้าที่ไม่มีชื่ออังกฤษออกใบเสร็จไม่ได้

เป็นปัญหาเดียวกับ P1 ทุกประการ: `customers.name_en` / `suppliers.name_en` ถูกคัดลอกไปเก็บใน
`customer_name_en` / `supplier_name_en` ของเอกสาร **14 ตาราง** (sales-bc: quotation, SO, DN, sales return, POS ·
supplier-bc: PO · finance-bc: receipt, billing note, payment entry, AP invoice, ใบตัดเครดิต/ใบคืนเงินลูกค้าและผู้ขาย)
branch แก้แค่ POS / quotation / PO — **7 ตารางใน finance-bc ยัง `NOT NULL`** ลูกค้าที่ไม่กรอกชื่ออังกฤษจะ
ออกใบเสร็จ / ใบวางบิล / รับชำระไม่ได้ (`400`) และ `ICustomerLookupResult` / `ISupplierLookupResult` ยังเป็น `string`
typecheck จึงไม่เตือน

### 🔴 C2 · `?? name_th` เอาภาษาไทยไปใส่ช่องอังกฤษ

```ts
customer_name_en: customer.name_en ?? customer.name_th,
```

ทำให้ response ไม่ตรงความจริง — `{ th: "บริษัท ก", en: "บริษัท ก" }` client แยกไม่ออกว่าเป็นชื่ออังกฤษจริงหรือสำเนา
และขัดกับที่ตัดสินใจไว้กับ `products.name_en` (null ทั้งสาย) ในวันเดียวกัน
**ตัดสินใจ:** response ต้องตรงไปตรงมา — ไม่มีชื่ออังกฤษ = `en: null` แล้วให้หน้าบ้านเลือกเองว่าจะแสดงอะไร
→ ลบ fallback ทุกจุด และทำทุก snapshot ให้ nullable แบบ P1

### 🟠 C3 · `name_en?: string | null` ใน DTO

field ที่ไม่บังคับใน request body DTO ใช้ `@IsOptional()` + `name_en: string | null` **ไม่ใช้ `?`**
(เหมือน `CreateProductDTO.name_en`, `CreatePosSaleDTO.remark_th`) — กฎเขียนไว้แล้วที่
`.claude/rules/api-contract.md` § Optional body fields และ convention-guard มีตัวจับ `optional-dto-marker`
(DTO ของ held POS ที่ merge วันนี้ก็มี `?:` อยู่ — แก้ไปพร้อมกัน)

### 🟠 C4 · migration เขียนมือ

`1793018048064` / `1793018048065` ห่างกัน 1 ms ข้ามสอง database = ไม่ได้ generate
SQL ถูก แต่ต้องยืนยันด้วย `migration:generate` ว่าไม่มี diff ค้าง และ snapshot ที่เหลือต้อง generate เพิ่มอยู่ดี

### 🟡 อื่น ๆ

- unit test ใหม่ตรวจแค่ว่า `super.create` ถูกเรียก — ไม่ได้พิสูจน์อะไรเรื่อง `name_en`
- ไม่มีเทสต์ฝั่ง supplier-bc และไม่มี smoke ที่เอาลูกค้า/ผู้ขายไม่มีชื่ออังกฤษไปออกเอกสารจริง (ซึ่งจะจับ C1 ได้ทันที)
- pin `9d81fd6` (§1.1) — แก้แล้วตอน merge `main` เข้า branch

---

## 5. ผลการแก้ไข

### 5.1 `feature/product` — merge แล้ว

| commit | เรื่อง |
|---|---|
| `68a281d` | คืน pin `docs/plan-erp` |
| `b01af93` | paginator เติม `__pages` บน template ไม่มี band |
| `83dcb86` | `?customer_id=` ย้ายไปประกอบใน `QuotationsService` |
| `9791e2c` | POS infer `per_item` เฉพาะตอนไม่ส่ง `discount_mode` + rule |
| `8d3e6ba` | `product_name_en` nullable ทุก snapshot + migration 3 BC + smoke 6 ไฟล์ |

**migration** (generate ทั้งหมด รันบน DB แล้ว · `migration:generate` ไม่เจอ diff ทั้ง 5 BC):
`MakeProductNameEnNullable1792757851530` (inventory · ของคุณ) · `MakeSalesProductNameEnNullable1793022047759` ·
`MakeFinanceProductNameEnNullable1793022061333` · `MakeReportProductNameEnNullable1793022071096`

| BC | typecheck | lint | unit | e2e | build | smoke |
|---|---|---|---|---|---|---|
| sales-bc | ✅ | ✅ | ✅ 301 | ✅ 35 | ✅ | ✅ 8/8 |
| inventory-bc | ✅ | ✅ | ✅ 414 | ✅ | ✅ | ✅ 9/9 |
| supplier-bc | ✅ | ✅ | ✅ 137 | ✅ 14 | ✅ | ✅ 3/3 |
| finance-bc | ✅ | ✅ | ✅ 559 | ✅ 42 | ✅ | ✅ 14/14 |
| report-bc | ✅ | ✅ | ✅ 9 | ✅ | ✅ | ✅ 2/2 |

smoke ใหม่: สร้างสินค้าไม่มี `name_en` แล้วออกใบเสนอราคา / PO / ใบเสร็จได้จริง และ snapshot เป็น NULL ใน Postgres ·
`?customer_id=` คืนเฉพาะลูกค้านั้น AND กับ `?filter=` ได้ · POS ไม่ส่ง mode → `per_item` ส่ง `none` → ทิ้งส่วนลดบรรทัด

### 5.2 `feature/suspend-sales` — merge แล้ว

| commit | เรื่อง |
|---|---|
| `24d2c18` | คืน pin `docs/plan-erp` |
| `10b4f8f` | status `HELD` / `COMPLETING` / `CANCELLED` + `has_pending_stock_cut` + migration |
| `e395eb9` | เส้นบิลพักใหม่ทั้งหมด + unit + smoke |
| `53a494d` | merge เข้า `main` (conflict ใน `PosSalesService` — รวม `resolveDiscountMode` กับ `computeProvisionalTotals` และให้บิลพักใช้ `resolveDiscountMode` ด้วย) |

**API บิลพัก (frontend ต้องรู้ — route เปลี่ยนจากของเดิม)**

| Route | Body | สถานะ | Permission |
|---|---|---|---|
| `POST /pos-sales` + `is_held: true` | เหมือนขายปกติ (payment fields ถูกละ) | → `HELD` | `pos_sale:create` |
| `PUT /pos-sales/:id` (เดิม `/:id/hold`) | `customer_id`, `warehouse_id`, `document_type`, ส่วนลด, remark, `items` | `HELD` เท่านั้น | `pos_sale:create` |
| `POST /pos-sales/:id/complete` | `payment_method`, `paid_amount`, `reference`, `document_date` | `HELD → COMPLETING → COMPLETED` | `pos_sale:create` |
| `POST /pos-sales/:id/cancel` (เดิม `/cancel-hold`) | `cancel_reason` | `HELD → CANCELLED` | `pos_sale:void` |

แต่ละข้อแก้อย่างไร:
- **S1–S3** พัก / แก้ = ทำใน sales-bc ล้วน ไม่ตัดสต็อก ไม่เรียก finance ไม่คิด VAT — บิลพักเก็บ `sub_total`/`total_discount`/`total`
  ชั่วคราว (`computeProvisionalTotals()` ตัวเดียวกับที่ใช้ตรวจเงิน) ส่วน `vat_rate`/`net_amount`/`vat_amount` = 0 หมายถึง "ยังไม่คิดราคา"
  ไม่ใช่ "ไม่มี VAT" · แก้บิล sync บรรทัดด้วย `planDocumentLineSync()` บรรทัดเดิมเก็บ id ไว้
- **S4** ตรวจเงินก่อนแตะอะไรทั้งนั้น ขาด → 400 บิลยังเป็น `HELD`
- **S5** claim บิลเป็น `COMPLETING` ใน DB (ภายใต้ row lock) **ก่อน**เรียกข้าม BC — request ที่สองเห็น `COMPLETING` ได้ 409
  (ไม่ใช้ Redis lock เพราะหมดอายุเองตอน crash ซึ่งเป็นจังหวะที่สถานะไม่แน่นอนที่สุด)
- **S6** ใบกำกับและการตัดสต็อกลงวันที่ ณ ปิดบิล (`document_date` ส่งได้ ไม่ส่ง = ตอนนี้)
- **S7** เปลี่ยนออกจาก `header` → `discount_type`/`discount_value` เป็น null
- **ปิดบิลล้มกลางทาง:** inventory ปฏิเสธ → บิลกลับเป็น `HELD` ไม่มีอะไรขยับ · finance ปฏิเสธหลังตัดสต็อก → คืนสต็อก
  บิลกลับเป็น `HELD` และ **ทุกบรรทัดได้ id ใหม่** (inventory-bc `ConfirmDelivery` ข้าม id ที่เคยบันทึกแล้วแม้จะ reverse ไปแล้ว —
  ใช้ id เดิมซ้ำจะ "สำเร็จ" โดยไม่ตัดอะไร smoke พิสูจน์แล้ว) · คืนสต็อกไม่สำเร็จ → `has_pending_stock_cut = true` ห้ามแก้
  ปิดบิลซ้ำจะใช้การตัดเดิม ยกเลิกจะคืนสต็อก
- **Convention:** ไม่มี `!` / cast แล้ว · Swagger ย้ายไป constants · permission ใช้ label เดิม · docblock เขียนใหม่ ·
  migration เพิ่ม enum แบบ `ADD VALUE` (ไม่ rewrite ตาราง) และ `down()` ไม่ยอมรันถ้ามีบิลกำลังปิด

**verify:** worktree `sales-bc` ครบ 6 ขั้น · หลัง merge บน `main` ครบ 6 ขั้น unit 55 POS tests · **smoke 10/10**
(ระหว่างนั้นเจอ smoke `i18n nested request alias` ล้มเพราะอ่าน DB จาก standby ที่ยังไม่ replay — มีมาก่อน ไม่เกี่ยวกับ branch
แก้โดยย้าย `eventually()` ไปเป็น helper กลางใน smoke context `be14c2d`)

### 5.3 `feature/optional-cus-supplier` — merge แล้ว (`21aa675`)

| commit | เรื่อง |
|---|---|
| `49260cd` | merge `main` เข้า branch (คืน pin `docs/plan-erp`) |
| `6d56545` | Swagger ของ `complete`: inventory-bc ปฏิเสธ → ได้สถานะ/ข้อความของ inventory-bc เอง (ไม่ใช่ 503 เสมอ) |
| `a974699` | DTO ของบิลพักเลิกใช้ `?:` → `@IsOptional()` + `T \| null` |
| `f24f0b1` | `customer_name_en` / `supplier_name_en` / `party_name_en` null ทุก snapshot · ลบ fallback · migration generate 3 BC · unit + smoke |

- **C1/C2** ลบ `?? name_th` ทั้ง 5 จุด · snapshot nullable ครบ: sales-bc (quotation, SO, DN, sales return, POS) · supplier-bc (PO) ·
  finance-bc (receipt, billing note, payment entry `party_name_en`, AP invoice, ใบตัดเครดิต/ใบคืนเงินทั้งลูกค้าและผู้ขาย)
  (`goods_receipts.supplier_name_en` nullable อยู่แล้ว) · lookup interface + response DTO `nullable: true` · print mapper `?? ''`
  · ใบคืนเงินเดิมเขียน `''` ลงช่อง `_en` เมื่อต้นทางเป็น null → ตอนนี้เก็บ `null`
- **C3** `CreateCustomerDTO.name_en` / `CreateSupplierDTO.name_en` → `name_en: string | null` (ไม่มี `?`)
- **C4** migration เขียนมือ 2 ตัวของคุณ**ยังไม่เคยรัน** จึงลบทิ้งแล้ว generate ใหม่: `MakeSalesCustomerNameEnNullable1793025683049` ·
  `MakeSupplierNameEnNullable1793025697774` · `MakeFinancePartyNameEnNullable1793025701764` — รันแล้ว `migration:generate` ไม่เจอ diff
- **เทสต์:** unit "snapshot `customer_name_en`/`supplier_name_en` เป็น null ไม่ใช่ชื่อไทย" (ล้มทันทีถ้า fallback กลับมา) ·
  smoke 4 ไฟล์ — ลูกค้า/ผู้ขายไม่มีชื่ออังกฤษ → ใบเสนอราคา, บิลพัก, ขาย POS จริง (ใบเสร็จ + รับชำระใน finance), PO, ใบเสร็จ DRAFT,
  จ่ายเงินผู้ขาย, ใบรับสินค้า — snapshot NULL ทุกที่ใน Postgres

| BC | typecheck | lint | unit | e2e | build | smoke |
|---|---|---|---|---|---|---|
| sales-bc | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 11/11 |
| supplier-bc | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 4/4 |
| finance-bc | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 15/15 |
| inventory-bc | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 11/11 |

**frontend ต้องรู้:** `customer_name` / `supplier_name` / `party_name` ในทุกเอกสารและแถว aging อาจเป็น `{ th, en: null }` —
API ไม่คัดลอกชื่อไทยมาให้แล้ว หน้าบ้านเลือก fallback เองตอนแสดงผล

**deploy + ทดสอบบนโดเมน:** run `40347767639` ✅ (ตามด้วย `af37f1c` ที่ลบชื่อโปรเจกต์อื่นออกจาก comment) — ทุก service `/health` = `af37f1c` ·
smoke บนโดเมนจริง **5/5 ผ่าน**: ลูกค้าไม่มีชื่ออังกฤษ → ใบเสนอราคา / บิลพัก / ขาย POS จริง (`ABB-2026-00086`, void แล้ว) → `pos_sales`,
`receipts`, `payment_entries` เป็น NULL ทั้งหมด · ผู้ขายไม่มีชื่ออังกฤษ → PO / ใบรับสินค้า / จ่ายเงินผู้ขาย NULL · บิลพักครบเส้นอีกรอบหลังเปลี่ยน DTO

### 5.4 docs ที่อัปเดต (`docs/plan-erp` @ `463c417` — push แล้ว)

- `srs-p2` `products.name_en` ไม่บังคับ · `srs-p3/p4/p5/p6` snapshot `product_name_en` nullable
- `srs-p4` ER `POS_SALES`/`POS_SALE_ITEMS` + หัวข้อ "พักบิล (HELD)" + กฎส่วนลด POS
- `api-workflow-guide` B1 `?customer_id=` · B5 กฎส่วนลด POS · **B5.1 พักบิล** (state diagram, route, ตัวอย่าง JSON,
  ตารางผลเมื่อปิดบิลล้ม, หมายเหตุสำหรับ frontend) · แก้ข้อความเดิมใน B5 ที่บอกว่า "retry ได้เลย re-cut เป็น no-op" ซึ่งไม่จริง
- `i18n-guide` §02 ทำ `_en` ต้นทางให้ไม่บังคับ = ทุก snapshot ต้อง nullable ด้วย
- `HANDOFF-Feature.md` §2 รายการ 2026-10-26

### 5.5 deploy + ทดสอบบนโดเมน

- deploy run `40341227901` ✅ — ทุก service (`auth`, `iam`, `inventory-bc`, `supplier-bc`, `sales-bc`, `finance-bc`, `report-bc`, `storage`)
  `/health` = `2587b93` · migration ทั้งหมดรันบน DB ไว้ก่อนแล้ว deploy จึงข้าม · server รัน Node `24.22.1`
- **ทดสอบบนโดเมนจริงด้วย smoke ชุดเดียวกัน 9/9 ผ่าน** (DB ตรวจจริงทุกขั้น):
  - บิลพัก: พักแล้วสต็อกไม่ขยับ → แก้บิล (บรรทัดเก็บ id เดิม, เปลี่ยนโหมดแล้วส่วนลดหัวบิลถูกล้าง) → เงินขาด 400 บิลยังพัก →
    ปิดบิล สต็อก 5 → 3 ได้ `ABB-…` ลงวันที่ปิดบิล → ปิด/แก้/ยกเลิกซ้ำ 409 → ใบกำกับเต็มรูปให้ลูกค้าไม่จด VAT ถูก finance ปฏิเสธ →
    คืนสต็อก + re-key บรรทัด → ปิดซ้ำตัดจริง 3 → 2 → void ทั้งหมด สต็อกกลับ 5
  - POS ไม่ส่ง mode + ส่วนลดบรรทัด → `per_item` ยอด 90 · ส่ง `none` → ยอด 100
  - POS ขายปกติ (ตัดสต็อก, ledger ชื่อ `POS_SALE`, ใบกำกับ ABB/FULL, void คืนสต็อก) · i18n nested alias
  - สินค้าไม่มี `name_en`: สร้าง/แก้/ล้าง, variant, ใบเสนอราคา, PO, ใบเสร็จ DRAFT ได้ — snapshot NULL ทุกที่ · read model รับ NULL
  - `?customer_id=` คืนเฉพาะลูกค้านั้น AND กับ `?filter=` ได้ uuid ผิด 400
- **ข้อมูลทดสอบ:** บิล POS วันนี้ `VOIDED` 30 · `CANCELLED` 5 · ไม่มีบิลค้าง `HELD`/`COMPLETING` ·
  `POS-2026-00091` (`COMPLETED`, ลูกค้า `CUST-TEST-02`, 09:12 UTC) **ไม่ได้มาจากชุดทดสอบรอบนี้** — ไม่ได้แตะ ถ้าเป็นของคุณให้ void เอง

---

## 6. ที่เจอซ้ำ — ตอนนี้มีตัวจับอัตโนมัติแล้ว

ทุกข้อด้านล่างเจอใน review ของคุณมากกว่าหนึ่งครั้ง (รวม 2026-10-23) จึงแปลงเป็นกฎและเครื่องมือ — **รัน `pnpm check:branch` ก่อน push ทุกครั้ง**
(CI ก็รันให้ทุก push ของ feature branch แล้ว) — ลองรันกับ commit เดิมของคุณ มันจับได้ 5 จาก 7 ข้อที่ review เจอ

| ที่เจอ | ตอนนี้จับด้วย | อ่านเพิ่ม |
|---|---|---|
| pin `docs/plan-erp` ชี้ commit ที่ไม่ได้ push (3 ครั้ง) | `check:branch` → error | `.claude/rules/branches-and-commits.md` |
| ไม่มี smoke file | `check:branch` → error `smoke-missing` | `CLAUDE.md` § Definition of Done |
| VAT `7` เขียนตรง ๆ | `hardcoded-vat-rate` | `business-documents.md` § Tax |
| `value!` / `as XxxDTO` | `non-null-assertion` / `dto-cast` | `naming-and-code-style.md`, `data-access.md` |
| Swagger prose ใน controller (รวมแบบหลายบรรทัด) | `inline-swagger-prose` | `naming-and-code-style.md` |
| `field?:` ใน body DTO | `optional-dto-marker` | `api-contract.md` § Optional body fields |
| comment ภาษาไทยในโค้ด (คำศัพท์ในเครื่องหมายคำพูดได้) | `thai-code-comment` | `naming-and-code-style.md` |
| entity เปลี่ยนแต่ไม่มี migration / migration เขียนมือ | `check:branch` → warning | `migrations-and-seed.md` |
| commit เดียวหลายเรื่อง / ไม่ใช่ conventional | `check:branch` → warning | `branches-and-commits.md` |
| ทำต้นทาง nullable แต่ลืม snapshot ปลายทาง (2 branch วันนี้) | rule + คำสั่ง grep | `entities-and-schema.md` § Changing a source column |
| แก้ input ของ client เงียบ ๆ (`Math.max` เงินขาด, override mode, `catch {}`) | rule | `business-documents.md` § Refuse what does not add up |
| เปลี่ยนสถานะที่เรียกข้าม BC โดยไม่ claim ก่อน | rule | `business-documents.md` § A state transition… |
| เอกสารลงวันที่ของสถานะก่อนหน้า | rule | `business-documents.md` § Statutory documents |

ถ้าใช้ Claude Code ใน repo นี้ convention-guard จะเตือนตั้งแต่ตอนเขียน และมี skill `review-branch` ไว้ self-review ก่อน push

---

## 7. ยังค้าง / ต้องทำต่อ

1. **PATCH `print_templates` แถว `receipt_slip`** ด้วย `receipt-slip.html` ฉบับใหม่ (P4) ตาม `_README.md` — ไฟล์ใน repo ไม่ถูกอ่านตอน runtime
2. `PosSalesService.create()` (ขายปกติ มีมาก่อน branch) ยังเก็บ `discount_type`/`discount_value` นอกโหมด `header` — ขัดกฎ
3. `sendWithContext` **throw** เมื่อ BC ปลายทางตอบ 4xx/5xx แต่ docblock ของ `PosSaleProxyService`/`StockProxyService` บอกว่าคืน `null`
   → ใน `create()` ถ้า finance ปฏิเสธหลังตัดสต็อก error จะหลุดออกไปโดยไม่ log `POS_SALE_FINANCE_FAILED`
4. บิลที่ค้าง `COMPLETING` (process ตายหลังออกใบกำกับ) ยังไม่มี API กู้ — ต้องแก้ด้วยมือจาก receipt ที่ log ไว้
5. `QuotationQueryParamsDTO` ถูกใช้กับ `GET /quotations/:id` ด้วย Swagger จึงโชว์ `customer_id` ที่นั่น (ถูกละเงียบ ๆ)
6. paginator เส้นไม่มี band: `{{__page}}` ยังว่าง (แก้แค่ `__pages`)
