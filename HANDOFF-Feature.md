# HANDOFF — สถานะงานและแผนต่อ

> **ไฟล์ชั่วคราวสำหรับส่งต่อ session** — ไม่ใช่เอกสารของ product · ลบทิ้งได้เมื่องานที่ค้างในนี้จบ
> เขียนเมื่อ 2026-09-02 · **แก้ล่าสุด 2026-09-09 (print pipeline P3 — ใบกำกับภาษีเต็มรูป + ใบเสนอราคาพิมพ์ออกมาเป็นเอกสารจริงได้แล้ว · เจอบั๊กจริง 3 ตัวระหว่างทาง · ดู §2 หัวข้อ 2026-09-09)**
> ก่อนหน้า 2026-09-08: audit doc drift — เอกสาร 3 ไฟล์เคยขัดกับโค้ดจริง แก้ให้ตรงแล้ว (ดู §0 แถว "doc drift" + §1)
> ก่อนหน้าในวันเดียวกัน (2026-09-08): `tax_configs` version อัตราภาษีได้แล้ว (constraint + supersede endpoint + Admin UI) · smoke runner รับ `needs:` · smoke ตัวแรกของ iam — ดู §2 หัวข้อ **2026-09-08**
> ก่อนหน้า 2026-09-07: Fiscal Year Closing / ยอดยกมา D2 — backend + Admin UI + smoke (§2) · storage — presigned URL เซ็นด้วย public origin, error taxonomy ของ S3 · docker log retention + PGDATA ของ postgres:18 · Discord notification ตอน deploy สำเร็จ (งาน infra ไม่มีหัวข้อใน §2 — ดู §1 "รอบ 2026-09-07")
> ก่อนหน้า 2026-09-06: Configurable Chart of Accounts + Admin UI (**ยังมี 2 จุดค้าง** — §2) · **document print pipeline P0→P2 — พิมพ์เอกสารครบวงจรได้จริงแล้ว 2 ใบ** (สถานะอยู่ที่ `HANDOFF-Document-Print-Pipeline.md` §7/§7.2 ไม่ได้ทำสำเนาไว้ใน §2)
> ก่อนหน้า 2026-09-05: P6 ครบ 4/4 read model + deploy แล้ว, `sales_summary` E2E ผ่านบน production ด้วยเอกสารจริง — `low_stock`/`expiry_alerts` **ยังไม่มีใครกลับไปยืนยันผล cron** (ค้างมาตั้งแต่คืน 2026-09-05, ดู §2 หัวข้อ P6 · low_stock + sales_summary)
> ก่อนหน้าในวันเดียวกัน: audit ช่องโหว่กฎหมาย/บัญชีจาก HANDOFF เดิม → เลือกทำ 3 จุด: A1 แยกใบกำกับเต็มรูป/อย่างย่อ, B1 RabbitMQ dead-letter exchange, C audit log กลางสำหรับ settings — ทั้งหมด implement + migrate + deploy + E2E บน production ผ่านแล้ว
> ก่อนหน้าในวันเดียวกัน (2026-09-03): #8 billing_notes ข้ามสกุล + DEBIT_NOTE ฝั่งซื้อ — ตัดสินใจแล้วทั้งคู่ + แก้บั๊กระหว่างทาง 3 จุด ·
> seed ตรวจซ้ำ ปิดงานแล้ว (`truncates:` ครบ ไม่ต้องแก้โค้ด) ·
> audit log กลาง (role/policy — ขอบเขตเริ่มเล็ก) เสร็จหมด + commit + push + deploy + E2E ผ่าน
> ก่อนหน้า: 2026-09-03 (P4 #12 unrealised FX/TFRS 21 — **commit `6254aee`+`2483cf4` + push + deploy แล้ว**) ·
> 2026-09-02 (dotenv tip mitigate + P3 #9 credit_limit เป็น THB — **commit `18f6acf`/`21b6bd4` + push แล้ว**) ·
> `meta.warnings` + บั๊ก auto-resolved price currency — **commit + push + deploy แล้ว** ·
> P2#5 + #6 + #7 — ปิด P2 audit ครบ · commit + push + deploy แล้ว · 2026-09-01 (C3 + currency enum + FX audit + P2#4 + column contracts + credit column precision)
>
> ✅ **2026-09-09 print pipeline P3 — พิมพ์เอกสารจริงได้ 2 ใบแล้ว** (`receipt_full_tax_invoice`, `quotation_standard` เป็น `banded` v3 บนโปรดักชัน) · mapper เลิกส่ง `items_text` เปลี่ยนเป็น `items[]` ที่ format มาแล้วทั้งหมด + `toThaiBahtText()`/`formatAmount()`/`formatQuantity()` ใน `@lib/common` · **เจอบั๊กจริง 3 ตัวที่ unit test จับไม่ได้เลย**: paginator หา `tbody` แบบไม่ scope (แถวสินค้าไปโผล่ในหัวเอกสาร หน้าเละแต่ไม่ error), `quotations-print.smoke.mjs` ไม่ได้ประกาศ `needs` (503 อ่านเหมือน sales-bc พัง), `mergeParams()` ให้ผู้เรียก override ตัวตนผู้ออกเอกสาร/ลายน้ำ DRAFT ได้ · **ค้าง (ไม่ใช่บั๊ก)**: `company_profiles` ยังว่างทุกช่อง เอกสารจึงพิมพ์โดยไม่มีผู้ออก — §86/4(1)–(2) บังคับ ต้องกรอกก่อนใช้จริง — ดู §2 หัวข้อ **2026-09-09**
> ✅ **2026-09-08 audit doc drift — เอกสารตรงกับโค้ดแล้ว 3 ไฟล์** · `HANDOFF-Document-Print-Pipeline.md` §7 ค้างที่ "P2 ⬜ ถัดไป" อยู่ 2 วันหลัง P2 ขึ้นโปรดักชัน (commit `d8b472b`) เพราะ doc-bump `10ab25d` แก้แต่ `api-workflow-guide.html` · `srs-p3.html` §"ยังไม่ได้ทำ · รอบถัดไป" ยังบอกว่า outbox/`stock.deducted`/`lot.created` ไม่ถูก emit จริง ทั้งที่ §07 ของหน้าเดียวกันเขียนไว้แล้วตั้งแต่ 2026-08 ว่ามีจริง และ Purchase Return ก็ทำแล้วใน P4 M4 · `HANDOFF-Backlog-Reporting-Print-Tax.md` §1 ยังพาดหัวว่า "พิมพ์เอกสารจริงไม่ได้เลยสักใบ" — **บทเรียน: doc-bump ที่ตามหลังโค้ดคนละคอมมิตคือจุดที่ drift เกิด · เฟส/งานที่ปิด ให้แก้ตารางสถานะในคอมมิตเดียวกับโค้ด**
> ✅ **2026-09-06 document print pipeline P0+P1+P2 — deploy แล้วทั้งสามเฟส** (`company_profiles`/`company_branches` · `document_prints` + `report.printDocument` RPC · `POST /quotations/:id/print` + `POST /receipts/:id/print`) — พิมพ์ครบวงจรจริง (RMQ → Gotenberg → storage → แถว `document_prints`) มี smoke คุมทั้งสองใบ · **ถัดไป P3** (HTML จริงแทน draft placeholder + เอนจิน `banded`) — เจ้าของสถานะคือ `HANDOFF-Document-Print-Pipeline.md` §7
> ✅ **2026-09-05 P6 — ครบ 4/4 read model + deploy แล้ว** (`profit_by_lot`, `expiry_alerts`, `low_stock`, `sales_summary`) — implement + migrate + commit + push + deploy ผ่านหมด, 1606/1606 test ผ่าน, eslint 0/0 · พบ+แก้บั๊กจริง 2 จุดระหว่างทาง (ดูรายละเอียด §2): `expiry_alerts` bind ผิด transport มาตั้งแต่เช้า (event จริงหายเข้า DLQ เงียบ ๆ) และ `processed_events` claim ชนกันเมื่อมี 2 consumer ต่อ 1 event · **`sales_summary` ยิง E2E บน production ด้วยเอกสารจริงผ่านแล้ว** (ยอดสะสมทับกันถูกต้อง) · `low_stock`/`expiry_alerts` รอ cron กลางคืนยืนยัน (ไม่มี endpoint กดรันเอง) — ดู §2 หัวข้อ **P6 · low_stock + sales_summary**
> ✅ **2026-09-05 audit ช่องโหว่กฎหมาย/บัญชี — 3 จุดที่เลือกทำเสร็จหมด + deploy + E2E บน production ผ่าน** (migration รันแล้วทั้ง 4 BC, `permissions:sync` + grant migration แล้ว, RabbitMQ broker policy ผูกแล้วจริง) — ดู §2 หัวข้อ **2026-09-05 · Legal/Accounting Audit**
> **P2 audit ปิดครบ 100% แล้ว — P3–P4 เหลือแค่ #10, #11 (รู้ไว้ ไม่ใช่บั๊ก ไม่ต้องรีบ, ตั้งใจไม่ทำถาวร)**
> ✅ **`meta.warnings` + บั๊ก auto-resolved price currency — commit `986b8b1` + push + deploy สำเร็จแล้ว** (deploy run 33639969936, 8 apps reload, ไม่มี migration)
> ✅ **dotenv tip mitigate — commit `18f6acf` + push แล้ว**
> ✅ **P3 #9 credit_limit เป็น THB เสมอ — commit `21b6bd4` + push แล้ว**
> ✅ **P4 #12 unrealised FX (TFRS 21) — เสร็จหมด + deploy แล้ว** (migration รันแล้ว, tests/lint/boot-check ผ่านหมด, `permissions:sync` + grant migration แล้ว, E2E จริงบน production ผ่าน) — ดู §2 หัวข้อ **P4 #12**
> ✅ **audit log กลาง (ขอบเขตเริ่มเล็ก) — เสร็จหมด + deploy แล้ว** (commit `92da11d`, grant migration เขียนพร้อมกันตั้งแต่แรก, E2E บน production ผ่านรอบแรกไม่มี 403) — ดู §2 หัวข้อ **audit log กลาง**
> ✅ **seed ตรวจซ้ำ — ปิดงานแล้ว** (`truncates:` ครบทุก 15 seeder, ไม่ต้องแก้โค้ด, แก้แค่ doc drift) — commit `aa4cdec`
> ✅ **#8 billing_notes ข้ามสกุล — ตัดสินใจ: เก็บพฤติกรรมเดิม + เอกสาร + WARN (C+)** และ
> ✅ **DEBIT_NOTE ฝั่งซื้อ — ยืนยันจงใจไม่ทำอีกรอบ** ทั้งคู่สำรวจโค้ดจริงก่อนตัดสินใจ (agent คู่ขนาน) +
> แก้บั๊กจริง 1 ตัว (AP credit note `update()` ตรวจผิดเพดาน) + error message ที่โกหกผู้ใช้ 1 จุด
> ระหว่างทาง — ดู §2 หัวข้อ **บั๊กที่แก้ระหว่างทาง**, **#8 billing_notes ข้ามสกุล**, **DEBIT_NOTE ฝั่งซื้อ**

## 0 · เปิด session ใหม่ — อ่านตรงไหน

**ไม่มีงานที่ค้างกลางคัน** — เริ่มงานใหม่ได้เลย ไม่ต้องสะสางอะไรก่อน

| อยากรู้ว่า | ไปที่ |
|---|---|
| ตอนนี้ระบบอยู่สถานะไหน / commit อะไรไปบ้าง | §1 |
| 2026-09-05 audit ช่องโหว่กฎหมาย/บัญชี (A1/B1/C) — ทำไปถึงไหน | §2 หัวข้อ **2026-09-05 · Legal/Accounting Audit** (เสร็จหมด + deploy + E2E แล้ว) |
| `meta.warnings` — สถานะล่าสุด | §2 หัวข้อ **`meta.warnings`** (commit+deploy แล้ว) |
| บั๊ก auto-resolved price ไม่แปลงอัตราแลกเปลี่ยน | หัวข้อ **บั๊ก · auto-resolved price…** ต่อจาก `meta.warnings` ใน §2 (commit+deploy แล้ว) |
| dotenv tip / P3 #9 credit_limit — ทำไปถึงไหน | commit แล้วทั้งคู่ (`18f6acf`/`21b6bd4`) — ดู §2 หัวข้อ **P3 #9** |
| P4 #12 unrealised FX (TFRS 21) — ทำไปถึงไหน | §2 หัวข้อ **P4 #12** (เสร็จหมด + deploy + E2E บน production แล้ว 2026-09-03) |
| **พิมพ์เอกสาร** — ทำไปถึงไหน / เฟสถัดไปคืออะไร | `HANDOFF-Document-Print-Pipeline.md` §7 (P0–P3 เสร็จแล้ว · §7.3 = ผลตรวจสอบ P3 · **P4 ถัดไป** = อีก 23 ใบ) — ไฟล์นั้นเป็นเจ้าของสถานะ ไม่ใช่ที่นี่ |
| ทำไมพิมพ์ออกมาแล้วไม่มีชื่อบริษัทผู้ขาย | `company_profiles` ยังว่างทุกช่อง — กรอกผ่าน `PATCH /finance-bc/v1/company-profiles/:id` (ดู §2 หัวข้อ **2026-09-09** และ print pipeline §7.3) |
| ผังบัญชีที่ตั้งค่าได้ (`gl_accounts`) — เหลืออะไร | §2 หัวข้อ **2026-09-06 · Configurable Chart of Accounts** (**ค้าง 2 จุด**: smoke §8.3 ข้อ 6 ที่ยังไม่ตัดสินใจ + manual QA UI ที่ยังไม่มีใคร click-through) |
| ปิดปีบัญชี / ยอดยกมา (D2) — ทำไปถึงไหน | §2 หัวข้อ **2026-09-07 · Fiscal Year Closing / ยอดยกมา (D2)** (backend + Admin UI + smoke ครบ) · งานต่อยอดที่ยังไม่ทำอยู่ใน `HANDOFF-Fiscal-Year-Closing.md` §9 (งบการเงิน D3, manual journal entry, import/export ผังบัญชี D4) |
| `tax_configs` version อัตราภาษี — ทำไปถึงไหน | §2 หัวข้อ **2026-09-08 · `tax_configs`** (constraint + supersede + Admin UI + smoke ครบ) |
| **doc drift** — เอกสารไหนเคยไม่ตรงกับโค้ด และแก้อะไรไป | §1 ท้ายหัวข้อ ("รอบ 2026-09-08 · audit doc drift") — 3 ไฟล์: print pipeline §7, `srs-p3.html`, backlog §1 |
| งานที่ยังเหลือทั้งระบบ (ไม่ใช่แค่ในไฟล์นี้) | `HANDOFF-Backlog-Reporting-Print-Tax.md` (§3 FE, §4.4, §5 WHT) · `HANDOFF-Document-Print-Pipeline.md` §7 (P3–P5) · `HANDOFF-Fiscal-Year-Closing.md` §9 · `HANDOFF-Postgresql.md` §2–§3 (**ไม่มี backup เลย = ความเสี่ยงสูงสุดในลิสต์**) |
| งานที่เหลือเลือกทำได้ (ทั้งหมดเป็น optional / ต้องถามลูกค้าก่อน) | §2 หัวข้อ **งานอื่นที่รู้อยู่** (#8, #10, #11) |
| จะทำ currency/FX ต่อ ต้องเข้าใจอะไรก่อน | §2 หัวข้อ **C3** (สองอัตรา) แล้วค่อย P2#4/#5/P4#12 |
| คำสั่งที่ใช้จริง (หลายตัวไม่ตรงกับที่เดาจาก `package.json`) | §3 |
| เคยพลาดอะไรมาแล้วบ้าง — **อ่านก่อนแตะ migration/deploy** | §4 |
| จะทำ audit หาช่องโหว่รอบใหม่ | §5 |

**ที่แนะนำถ้าจะทำต่อเลย** (ปรับใหม่ 2026-09-08 · ไม่มีข้อไหนบล็อกอีกข้อ):
1. **กรอก `company_profiles`** (5 นาที, ต้องใช้ข้อมูลจริงของบริษัท) — จนกว่าจะกรอก เอกสารทุกใบที่พิมพ์ออกมาไม่มีชื่อ/เลขผู้เสียภาษี/ที่อยู่ผู้ขาย ซึ่ง §86/4(1)–(2) บังคับ · ~~print pipeline P3~~ ✅ เสร็จแล้ว 2026-09-09 → **P4** (ขยายอีก 23 ใบ, ~0.5 วัน/ใบ) ใช้ 2 ใบที่ทำแล้วเป็นแม่แบบ
2. **ปิด 2 จุดค้างของ `gl_accounts`** — smoke §8.3 ข้อ 6 ถูกลงเยอะแล้วหลัง smoke runner รับ `needs:` (2026-09-08) · manual QA UI ทำได้เลยใน session ที่มี browser tool
3. **ยืนยันผล cron `low_stock`/`expiry_alerts`** — ค้างมาตั้งแต่คืน 2026-09-05 ยังไม่มีใครกลับไปดู (query ตารางอ่านเอาก็พอ ไม่มี endpoint กดรัน)
4. ถ้าจะเริ่ม **§5 หนังสือรับรองหัก ณ ที่จ่าย** — บล็อกเกอร์ยังจริง: `ap_invoices` ไม่มี `supplier_tax_id` snapshot (ยืนยันกับโค้ดแล้ว 2026-09-08) ต้องเพิ่มคอลัมน์ + migration ก่อน · ส่วน "ข้อมูลบริษัทผู้ออก" ปิดไปแล้วด้วย `company_profiles` จาก print P0
5. ~~`npm run seed -- --fresh --yes` บน scratch DB~~ ✅ **ปิดงานแล้ว 2026-09-03** — ดู §2 หัวข้อ **seed — ตรวจซ้ำ** (ผู้ใช้ตัดสินใจข้ามส่วน `--fresh` บน scratch DB) · ⚠️ กติกาเดิมยังใช้: **ห้ามรัน `--fresh` ใส่ DB จริง** (ดู §4 #10)
6. งานอื่นที่รู้อยู่ #8/#10/#11 — ทั้งหมด optional, ไม่ใช่บั๊ก (ดู §2 หัวข้อ **งานอื่นที่รู้อยู่**)

⚠️ **นอกลิสต์นี้แต่เสี่ยงกว่าทุกข้อรวมกัน**: `HANDOFF-Postgresql.md` §2.1 — **ยังไม่มี backup เลยแม้แต่ชุดเดียว** และไม่เคยพิสูจน์ว่ากู้กลับได้ · §3.1 VM ทั้ง 7 ตัวอยู่บน hypervisor เดียว

---

## 1 · สถานะล่าสุด

**working tree สะอาดทั้งสอง repo · deploy ขึ้น production แล้วและ E2E ผ่าน** ·
⚠️ **การแก้ doc drift รอบ 2026-09-08 commit แล้วแต่ยังไม่ push** (4 ไฟล์ในซับโมดูล + คอมมิต bump pin
ที่ `erp-api` — ท้ายหัวข้อนี้) · เป็นงานเอกสารล้วน ไม่ต้อง deploy

| Repo | HEAD ปัจจุบัน |
|---|---|
| `iotechsoft-company/erp-api` | `3f796d6` test(verify): let a smoke file declare the BCs it needs; first iam smoke (+ คอมมิต bump submodule ของรอบ doc drift ที่ตามมา ยังไม่ push) |
| `iots1/plan-erp` (submodule) | commit นี้เอง — doc drift 2026-09-08 (ก่อนหน้า `5dd3562` tax_configs versioning + กับดัก #14–16) |

**`bb81622`** (versioned tax rates + fiscal year closing + admin UIs) คือคอมมิตฟีเจอร์ตัวล่าสุด —
ที่ตามมาหลังจากนั้นเป็นงาน storage/infra ของ 2026-09-07 กับ smoke runner ของ 2026-09-08

**รอบ 2026-09-08** (ดู §2 หัวข้อ **2026-09-08 · `tax_configs` เคย version อัตราภาษีไม่ได้เลย**) — ยืนยันด้วย
การรันจริงทุกข้อ ไม่ใช่เดา:

- `pnpm typecheck` ผ่าน · `nx lint finance-bc` + `nx lint iam` **0 error**
- unit **finance-bc 420/420 (18 suites)** · **iam 186/186 (25 suites)** · finance-bc e2e 28/28
- **`pnpm verify finance-bc --steps=smoke` ผ่านครบ 4/4 โดยไม่ต้องใส่ flag ใดๆ** หลังเพิ่ม `needs` —
  runner สตาร์ท sales-bc/report-bc/storage ให้เองตามที่ไฟล์ smoke ประกาศ
- **`pnpm verify iam --steps=build,smoke` ผ่าน** — smoke ตัวแรกของ iam ยิงหน้า admin ครบ 18 หน้า
  + create form 11 หน้า + เช็คว่า sidebar render ครบ 7 กลุ่มตามลำดับ
- migration `erp_finance` + `erp_iam` **pending 0 ทั้งคู่** · ยืนยันบน DB จริงว่า
  `uq_tax_configs_code_open` มี predicate ถูกต้องและไม่มี code ไหนมีแถวเปิดค้างเกิน 1 แถว ·
  `page:view_tax_configs` grant ให้ 2 policy แล้ว
- **deploy run แรกล้มเพราะ `git fetch` บน app server ต่อ `github.com:22` timeout** (ไม่เกี่ยวกับโค้ด —
  สคริปต์ตายก่อนถึงขั้น migrate/pm2 จึงไม่ค้างครึ่งทาง) re-run แล้วผ่าน — `deployed main @ bb816220`

**รอบ 2026-09-08 · audit doc drift** (งานเอกสารล้วน ไม่แตะโค้ด) — ผู้ใช้ถามว่า "จาก SRS P1–5 + HANDOFF
เหลืออะไรต้องทำอีก" แล้วการไล่เทียบกับโค้ดจริงเจอว่า **เอกสาร 3 ไฟล์เล่าสถานะผิด** จึงแก้ก่อนตอบต่อ:

- `HANDOFF-Document-Print-Pipeline.md` — §7 ค้างที่ **"P2 ⬜ ถัดไป"** ทั้งที่ P2 ขึ้นโปรดักชันไปแล้ว
  ตั้งแต่ 2026-09-06 (commit `d8b472b`, 27 ไฟล์: 2 endpoint + mapper + smoke 2 ไฟล์ + grant migration) ·
  ต้นเหตุ: doc-bump `10ab25d` อัปเดตแต่ `api-workflow-guide.html` (รายการ endpoint) ไม่ได้แตะตารางเฟส —
  **แก้แล้ว** + เขียน §7.2 (ผลตรวจสอบ P2 จากโค้ดจริง) + หัวไฟล์เป็น P0+P1+P2 ✅ / P3 ถัดไป
- `srs-p3.html` §"ยังไม่ได้ทำ · รอบถัดไป" — ยังบอกว่า outbox / `stock.deducted` / `lot.created`
  ไม่ถูก emit จริง **ขัดกับ §07 ของหน้าเดียวกัน** ที่เขียนไว้แล้วตั้งแต่ 2026-08 ว่า `outbox_events`
  + relay job มีจริงทั้ง inventory-bc และ finance-bc · และ Purchase Return ที่บรรทัดเดียวกันเรียกว่า
  "ช่องว่างเดียวที่เหลือของ D3" ก็ทำแล้วใน `srs-p4.html` M4 — **แก้แล้ว** เหลือ valuation strategy override
  ระดับ item เป็นข้อเดียวที่ค้างจริง (render-check ผ่าน, mermaid 0 error)
- `HANDOFF-Backlog-Reporting-Print-Tax.md` — §0 + พาดหัว §1 ยังเป็น "พิมพ์เอกสารจริงไม่ได้เลยสักใบ" ·
  **แก้แล้ว** ให้ §1 เป็นบันทึก as-is ของ 2026-09-04 และชี้ว่าเจ้าของสถานะเรื่องพิมพ์คือ
  `HANDOFF-Document-Print-Pipeline.md` §7 · §2 (report-bc ไม่มี consumer) ก็ปิดไปแล้วตอน P6 ครบ 4/4

**บทเรียนที่เข้า §4 ได้เลย**: drift เกิดตรงจุดที่ **doc-bump ตามหลังโค้ดคนละคอมมิต** — เฟส/งานที่ปิด
ให้แก้ตารางสถานะของมันในคอมมิตเดียวกับโค้ด ไม่ใช่รอ bump รอบถัดไป · และเวลาอ่านเอกสารเพื่อวางแผน
**อย่าเชื่อตารางสถานะเปล่า ๆ** — เทียบกับ `git log`/โค้ดจริงก่อนสรุปว่าอะไรยังไม่ทำ

**รอบ 2026-09-07 · storage + infra** (ไม่มีหัวข้อของตัวเองใน §2 — งานเล็กหลายชิ้น):

- `de36459` — presigned URL เคยถูกเซ็นด้วย endpoint ภายใน ทำให้ลิงก์ใช้จากนอกไม่ได้ · แยกเป็นเซ็นด้วย
  public origin แต่เรียก S3 ผ่านเน็ตเวิร์กภายใน (`.env.example` +17 บรรทัด) — คู่กับ
  `runbook-image-confirm-storage-403.html` ที่เขียนในรอบเดียวกัน
- `7fd2350` + `ae9abff` — error taxonomy ของ S3: แยก "ไม่พบไฟล์" ออกจาก "บริการล่ม" ใน `headObject()`
  และจัดชั้น error ที่เหลือ (`storage-object.service.ts` ใน `libs/common` + `apps/storage`)
- `cfa011e` — จำกัดขนาด container log ทั้ง 3 compose (infra-erp/kong/observability) + แก้ mount ของ
  `PGDATA` สำหรับ `postgres:18` · `bada866` — Discord notification ตอน deploy สำเร็จ
- ⚠️ **ยังไม่ได้ยืนยันในไฟล์นี้ว่ารอบ 09-07 ถูก deploy แล้วหรือยัง** — commit/push แล้วแน่นอน แต่ผล
  deploy ไม่ได้บันทึกไว้ ใครทำต่อให้เช็ค deploy run ก่อนสรุปว่าโปรดักชันมีของพวกนี้แล้ว

ไล่ commit ของรอบ 2026-09-05 (เรียงเก่า→ใหม่):

| Repo | commit | เรื่อง |
|---|---|---|
| `erp-api` | `197f53e` | feat: separate full/abbreviated vendor tax invoices, RMQ dead-letter exchange, settings audit log (50 ไฟล์ — A1+B1+C ทั้งชุด) |
| `plan-erp` | `3ed572d` | docs: RabbitMQ reliability guide + vendor tax invoice type + setting audit log (7 ไฟล์) |
| `erp-api` | `99dd443` | docs: bump plan-erp submodule |

**สุขภาพระบบตอนนี้** (ยืนยันด้วยการรันจริงทั้งหมด ไม่ใช่เดา — รอบ 2026-09-05):

- **1585 tests / 113 suites ผ่านทั้งหมด** (+ใหม่จากรอบนี้: 6 เคส AP invoice + 5 เคส finance-settings + 2 เคส tax-configs)
- **finance/sales/supplier `migration:generate` = `No changes`** หลังรัน migration รอบนี้ (3 ไฟล์ — 1 คอลัมน์ใหม่ `ap_invoices.vendor_tax_invoice_type` + 3 ตารางใหม่ `*_setting_audit_logs`) ·
  `npm run permissions:sync` แล้ว sync 3 permission ใหม่เข้า `erp_iam` + grant migration (`1788577073884-GrantSettingAuditLogPermissionsToMockPolicies`) รันแล้วบน DB จริง
- build ผ่านทั้ง finance-bc/sales-bc/supplier-bc/report-bc/iam (webpack compiled successfully)
- eslint **0 error 0 warning** ทั้ง repo
- **deploy production สำเร็จ** (run `33940617869`) — 8 apps reload, migration รายงาน `No migrations are
  pending` ทุก BC เพราะรัน migrate ไว้ก่อน deploy แล้ว (dev/prod ใช้ Postgres ตัวเดียวกัน — ดู §4 กับดัก #10)
- **E2E บน production จริงผ่านครบทุกจุด** (ดูรายละเอียดเต็มที่ §2 หัวข้อ **2026-09-05 · Legal/Accounting Audit**):
  submit ใบ AP invoice จริง 2 ใบ (full + abbreviated) ผ่าน GL posting แล้วยืนยัน ภ.พ.30 ไม่นับใบ abbreviated ·
  audit log endpoint คืน 200 (ไม่ 403) + บันทึก diff ถูกต้องจาก PATCH จริง · RabbitMQ broker policy ผูกครบ 8 คิวจริงบน production vhost `/`

**สิ่งที่ทำเสร็จในรอบก่อนหน้า** (ทั้งหมด implement + test + เอกสารครบ): Purchase Return, stock period
lock, AP Invoice + 3-way match, Credit Limit (SO), เพดาน WHT ที่ payment, Receipt↔Delivery Note
match, due_date + AR/AP aging, reorder alert job, VAT registration enforcement, Sales Return +
partial COGS reversal, D1–D3 (credit re-check ตอนส่งของ / price tolerance ตั้งค่าได้ + หน้า UI /
เพดานอนุมัติใบปรับยอดสต็อก), vendor credit note, **C3 multi-currency ตอนตัดชำระ + realised FX, currency
enum ระดับ DB, FX audit (P1 แก้ 3 ข้อ), P2#4 (FX บน quotation/SO/PO), shared column contracts (7
interface), credit column precision → numeric(18,4), **P2#5 (raw_* ระดับบรรทัด) + P2#6 (currency ใน
print) + P2#7 (party_currency_enforcement ตั้งค่าได้) — ปิด P2 audit ครบ + แก้บั๊ก deploy
`*_PUBLIC_URL` + E2E บน production (รอบ 2026-09-02 · commit + push + deploy ครบแล้ว)**

---

## 2 · งานที่ค้าง — เรียงตามที่แนะนำให้ทำ

### 2026-09-09 · print pipeline P3 — เทมเพลตจริง 2 ใบ ✅ **เสร็จ + อัปโหลดขึ้นโปรดักชันแล้ว (v3)**

รายละเอียดเต็ม: `HANDOFF-Document-Print-Pipeline.md` §7.3 · สรุปสั้น:

**ส่งมอบ** — `receipt_full_tax_invoice` (ใบกำกับภาษีเต็มรูป/ใบเสร็จรับเงิน) และ `quotation_standard`
(ใบเสนอราคา) เป็นเทมเพลต `banded` จริง: ตารางรายการมีเส้นครบพร้อม filler เต็มกล่อง, หัวเอกสาร/หัว
คอลัมน์ซ้ำทุกหน้า, "มีต่อหน้า N", สรุปยอดแยก VAT (§86/4(6)), จำนวนเงินเป็นตัวอักษร, ช่องเซ็น, ลายน้ำ
DRAFT · ต้นฉบับ HTML เก็บใน repo ที่ `apps/report-bc/.../assets/templates/` (แหล่งความจริงยังเป็นแถวใน
`print_templates` — ไฟล์มีไว้ review + apply ซ้ำกับ deployment ใหม่)

**บั๊กจริง 3 ตัวที่เจอ** (ทุกตัวมองไม่เห็นจาก unit test — ต้องพิมพ์จริงถึงเจอ):
1. paginator หา `tbody`/`thead` แบบไม่ scope → แถวสินค้าไปโผล่ในตารางของหัวเอกสาร **หน้าเละแต่ไม่ error**
2. `quotations-print.smoke.mjs` ไม่ได้ประกาศ `needs` → 503 ที่อ่านเหมือน sales-bc พัง (กับดักตาม `CLAUDE.md`)
3. `mergeParams()` ให้ BC ผู้เรียก override `company_*` และ `draft_watermark_text` ได้ → ปลอมตัวตนผู้ออก
   เอกสาร/พิมพ์ร่างแบบไม่มีลายน้ำได้ · สลับให้คีย์ของเซิร์ฟเวอร์ชนะเสมอ

**เพิ่ม schema** — `customer_address` ทั้ง `receipts` และ `quotations` (§86/4(3) บังคับให้ใบกำกับภาษี
แสดงที่อยู่ผู้ซื้อ แต่ไม่เคย snapshot มาก่อน) + `address` ใน `ICustomerLookupResult` · migration รันบน
DB จริงแล้วทั้ง 2 BC (nullable ไม่ backfill — เอกสารเก่าไม่มีค่านี้จริง)

**🔴 ค้างจริง (ไม่ใช่โค้ด)** — `company_profiles` ของ deployment นี้**ว่างทุกช่อง** (P0 จงใจ seed แถว
เปล่าแทนที่จะเดาค่า) เอกสารทุกใบจึงพิมพ์โดยไม่มีชื่อ/เลขผู้เสียภาษี/ที่อยู่ผู้ขาย · smoke เตือนทุกครั้ง
แต่ไม่ทำให้ verify แดง เพราะเป็นข้อมูลของ deployment ไม่ใช่ความถูกต้องของโค้ด · **ต้องกรอกก่อนเอา
เอกสารไปให้ลูกค้า**

**ยืนยัน** — `pnpm verify finance-bc`/`sales-bc`/`report-bc` เขียวครบ · smoke ยิงพิมพ์จริงผ่าน
RMQ → Gotenberg → storage แล้วเช็คกลับว่าเป็น `banded` v3, snapshot มี `items[]`, ลายน้ำตรงสถานะ,
PDF จริง ~70KB · render ด้วย Chrome ในเครื่องแล้วดูหน้ากระดาษจริง (34 บรรทัด → 3 หน้า)

---

### 2026-09-08 · `tax_configs` เคย version อัตราภาษีไม่ได้เลย ✅ **แก้ constraint + supersede endpoint + Admin UI + smoke — ครบ**

**ตารางถูก ship มาด้วย `UNIQUE (code)` เปล่าๆ ซึ่งขัดกับทุกอย่างที่สร้างทับบนมัน** — `effective_from`/
`effective_upto` มีอยู่เพื่อทำ versioning, `assertNoOverlappingPeriod()` เขียนไว้รองรับหลายแถวต่อ code
ที่ช่วงไม่ทับกัน, และ `resolveEffectiveRate()` ก็จัดการเคสเจอหลาย candidate แล้ว (ถึงขั้น 409 ปฏิเสธการเดา)
แต่**ไปไม่ถึงโค้ดพวกนั้นเลย** เพราะ Postgres ตี `VAT7` แถวที่สองตกก่อน ผลคือทางเดียวที่จะเปลี่ยนอัตราตาม
ประกาศรัฐคือ**เขียนทับแถวเดิม** ซึ่งทำลายช่วงเวลาที่อัตราเก่าเคยมีผล → เอกสารที่ backdate เข้าไปในช่วงนั้น
จะ resolve ได้อัตราใหม่ (ผิด)

**Constraint** — เปลี่ยนเป็น partial unique index บนแถวที่ยังมีผลอยู่:
`(code) WHERE effective_upto IS NULL AND deleted_at IS NULL` (migration
`1788713267769-FixTaxConfigsCodeVersioning`) ประวัติทำได้แล้ว แต่ยังกัน "สองแถวเปิดค้างพร้อมกันต่อ 1 code"
ไว้ — เพราะสองแถวเปิดจะทำให้ `resolveEffectiveRate()` เจอ 2 candidate ทุกวันหลังแถวหลังเริ่ม แล้ว 409
**ตอนออกใบกำกับ** ซึ่งเป็นจังหวะที่แย่ที่สุด ส่วนช่วงที่ปิดแล้วทับกันปล่อยให้
`assertNoOverlappingPeriod()` คุม (index เขียน range check ไม่ได้) · `deleted_at IS NULL` อยู่ใน predicate
เพราะแถวเป็น soft-delete ถ้าไม่ใส่ แถวที่ลบแล้วจะยึดช่อง "เปิด" ของ code นั้นไว้ตลอดกาล

**`POST /tax-configs/:id/supersede`** — ปิดอัตราที่มีผลอยู่ + เปิดอัตราใหม่ใต้ code เดิม ใน transaction เดียว
ใต้ row lock (`pessimistic_write`) **ที่ต้องเป็น endpoint เดียวเพราะลำดับการเขียนไม่สมมาตร**: สร้างแถวใหม่
ก่อนจะ fail สะอาดที่ index เอง แต่ปิดแถวเก่าก่อนจะเปิดช่องที่ code นั้น**ไม่มีอัตราใดมีผลเลย** —
`resolveEffectiveRate()` คืน `null` และ `ReceiptsService` ตีความว่า 0% แล้วออกเอกสารต่อ (จงใจ เพราะบริษัท
ที่ไม่จด VAT ไม่มีอัตรา) → **ใบกำกับภาษีที่ออกในช่องนั้นจะไม่มี VAT และไม่มีอะไรเตือน** · อัตราเดิมถูกปิดที่
**วันก่อนหน้า** วันเริ่มของอัตราใหม่ตามปฏิทินไทย (ทั้งสองขอบเป็น inclusive calendar day ถ้าแชร์วันเดียวกัน
วันนั้นจะมีสองอัตรา)

**Admin UI** (`apps/iam`) — `views/tax-configs` list + form ตาราง**เดียว**อ่านเป็น version history
(คอลัมน์ช่วงที่มีผล + badge `ใช้อยู่ปัจจุบัน`/`ยังไม่เริ่ม`/`ถูกแทนที่แล้ว`/`ปิดใช้งาน` คำนวณฝั่ง client) ·
filter 3 ตัว: ค้นหา, ประเภท VAT/WHT, ช่วงเวลา (ใช้ `effective_upto||$isnull||true|false`) · ปุ่ม
"ปรับอัตราใหม่" เปิด dialog เรียก supersede — โผล่เฉพาะแถวที่ยังไม่ปิด **จงใจไม่ทำเป็น "แก้ไขอัตรา"
เพราะนั่นคือสิ่งที่งานนี้ทั้งงานพยายามกันไม่ให้เกิด** · ทุก input วันที่ผ่าน
`toDateInputValue`/`fromDateInputValue` ที่มีอยู่แล้วใน `utils.js` (`<input type="date">` ให้
`YYYY-MM-DD` เปล่าซึ่ง `@IsISO8601()` ปฏิเสธ และ slice ISO ดิบจะเพี้ยนไปหนึ่งวันสำหรับ instant หลัง 17:00)

**Refactor เมนูซ้าย** — กลุ่ม `ระบบ` เดิมโตจนกลายเป็นถังรวมของ 3 bounded context (คลังสินค้า, ผังบัญชี,
เทมเพลตพิมพ์ อยู่ปนกัน) แยกเป็น **ตั้งค่าบัญชีและการเงิน / ตั้งค่าคลังสินค้า / ตั้งค่าเอกสาร** ตามเจ้าของข้อมูล
URL เดิมทั้งหมด (bookmark/permission ไม่กระทบ) · เปลี่ยน `ประเภทภาษี` → **`ประเภทภาษีสินค้า`** เพื่อไม่ให้
อ่านเป็นคำเดียวกับหน้า `อัตราภาษี` ใหม่ — inventory-bc จัดประเภทสินค้า, finance-bc บอกอัตรา, ใบกำกับต้องอ่าน
ทั้งสองแหล่ง (srs-p5 §2)

**Permission** — ไม่สร้าง permission ใหม่เลย: supersede ใช้ `tax_config:update` เดิมร่วมกับ PUT/DELETE
(ถ้าไว้ใจให้แก้อัตราก็ไว้ใจให้ supersede ได้ — และเลี่ยงกับดัก deploy-order ไปเลย) · ui-plane
`page:view_tax_configs` ใช้ self-upsert pattern (`SeedTaxConfigsUiPermission1788755781581`) ปลอดภัย
ไม่ว่าจะรันก่อน/หลัง `permissions:sync`

**Smoke** (`apps/finance-bc/test/smoke/tax-configs.smoke.mjs`) — จุดสำคัญคือ**เคสนี้ unit test มองไม่เห็น
โดยหลักการ** เพราะมัน mock repository จึง "insert" แถวที่ Postgres จะตีตกได้อย่างสบายใจ ใช้ `code` สุ่มต่อรัน
+ ลงวันที่ปี 2090+ (กันไม่ให้อัตรา smoke resolve ชนเอกสารที่ smoke ไฟล์อื่นออกวันนี้) + `WHT` (ไม่มีอะไรใน
suite ออกเอกสารที่แบก WHT) และ soft-delete คืนใน `finally` ซึ่งคืนช่อง "เปิด" ของ code ให้รันซ้ำได้

**เพิ่มเติมที่ทำติดไปในรอบเดียวกัน** — `needs` ใน smoke runner: `scripts/verify.mjs` เดิมสตาร์ทแค่
`auth`+`iam`+BC ที่เทส ทำให้ smoke ที่ข้าม BC ได้ 503 ซึ่ง**หน้าตาเหมือน regression ของ BC ที่กำลังเทส**
(gl-accounts + receipts-print แดงอยู่วันนึงเพราะเรื่องนี้ และตอนแรกวินิจฉัยผิดว่าเป็นเพราะ `account_role`
enum เพิ่ม role) ตอนนี้ไฟล์ smoke ประกาศ `needs: ['report-bc', 'storage']` เองแล้ว runner สตาร์ทให้ ·
และเพิ่ม `apps/iam/test/smoke/admin-pages.smoke.mjs` ตัวแรกของ iam — iam โฮสต์หน้า admin 18 หน้าโดย
**ไม่มี smoke แม้แต่ไฟล์เดียว** ทั้งที่ typecheck/lint ไม่เคยเปิดไฟล์ `.ejs` และ unit test ทดสอบแค่
view controller คืนชื่อ template ไม่ใช่ template resolve ได้จริง → include พิมพ์ผิด/ลืมลงทะเบียนใน
`build-assets.mjs` จะเขียวแล้ว 500 บน production ตอนคลิกครั้งแรก

---

### 2026-09-07 · Fiscal Year Closing / ยอดยกมา (D2) ✅ **backend + Admin UI + smoke — implement ครบ**

Backlog D2 จากแผน chart-of-accounts (`HANDOFF-Configurable-Chart-Of-Accounts.md` §9/§11) — เต็มแผนอยู่ที่
`HANDOFF-Fiscal-Year-Closing.md`. สรุปสั้น:

**Backend** (`apps/finance-bc/src/modules/fiscal-year-close/`, โมดูลใหม่คัดลอกโครง `fx-revaluation/`) —
`finance_settings.fiscal_year_start_month` (1-12, default 1) + `resolveFiscalYear()`/`fiscalYearBounds()`
ใหม่ใน `@lib/common/utils/fiscal-year.util.ts` · `POST /fiscal-year-closes` ปิดปีบัญชีถาวร (guard 3 ชั้น:
ปิดซ้ำไม่ได้, ต้องเรียงลำดับ, ต้องปิดงวดรายเดือนครบทั้งปีก่อน) โพสต์ direct-method closing entry ล้าง
REVENUE/EXPENSE เข้า role ใหม่ `RetainedEarnings` (บัญชีที่ 15, ผูกกับ `3200-00` ที่ seed ไว้แล้ว) · snapshot
ถาวร `gl_account_year_end_balances` (opening/period_activity/closing_balance แบบ raw debit-credit
เหมือน `TrialBalancesService.build()`) · `GET /gl-account-year-end-balances` คือ endpoint "ยอดยกมา"
ที่ตอบโจทย์ `balances[]` ของระบบอ้างอิงที่เทียบไว้ตอนเริ่มทำ chart-of-accounts

**เจอบั๊กจริงระหว่างทำที่ unit test (mock) จับไม่ได้แต่ smoke (DB จริง) จับได้**: `Repository.findOne({
order: {...} })` ที่ไม่มี `where` เลย — TypeORM เวอร์ชันปัจจุบัน throw `"You must provide selection
conditions"` แทนที่จะคืนแถวแรกตาม order เฉยๆ (ต่างจากพฤติกรรมเก่าที่คุ้นเคย) ต้องใส่ `where: {}` เสมอ
(ตรงกับที่ `FinanceSettingsService.getOrCreate()` ทำอยู่แล้วโดยบังเอิญ) — แก้แล้ว เพิ่มคอมเมนต์เตือนไว้

**Admin UI** (`apps/iam`) — หน้าเดียว `views/fiscal-year-closes` (list + ปุ่ม "ปิดปีบัญชี" เปิด dialog
ยืนยัน ไม่มีฟอร์มสร้าง/แก้เลยเพราะเป็น action ทางเดียว) ปุ่ม "ดูยอดยกมาต่อบัญชี" ลิงก์ตรงไป raw API
response (ไม่ได้ทำหน้าตารางแยกให้ `gl_account_year_end_balances` เต็มรูปตามที่แผนเสนอไว้ — ลดขอบเขต
เพื่อความเร็ว ถ้าต้องการหน้าเต็มทีหลังค่อยทำเพิ่ม)

**Smoke** (`apps/finance-bc/test/smoke/fiscal-year-close.smoke.mjs`) — **ไม่ปิดปีบัญชีจริง**: การปิดปีบัญชี
ไม่มี reverse เลย (ต่างจาก gl-accounts/payment ที่ cancel คืนได้) ปิดปีจริงบน DB ที่ใช้ร่วมกันจะกินเลข
ปีถาวรและบังคับให้ปีถัดไปต้องปิดตามลำดับตลอดไป — ทดสอบด้วยการยิง `POST /fiscal-year-closes` กับปีปัจจุบัน
(ที่ยังไม่ปิดงวดครบแน่ๆ) แล้วเช็คว่าถูกปฏิเสธ 400 ถูกต้อง (พิสูจน์ guard/permission/route จริงโดยไม่ทำ
irreversible action) · ระหว่างทางเจอ **CASH role ค้างอยู่ที่บัญชีผิด** (`1111-02` แทนที่จะเป็น `1111-01`)
จาก run ก่อนหน้าที่ crash กลางคันเพราะ auth service ไม่เสถียรในเครื่อง — แก้กลับด้วย SQL ตรงแล้ว ยืนยันว่า
`1111-01` (`is_locked=true`) ถือ CASH role ถูกต้องแล้ว

**Permission 2-plane** — ทำถูกตั้งแต่ต้นรอบนี้ (เรียนจากบั๊ก gl-accounts): `permissions:sync` ก่อน แล้วค่อย
`GrantFiscalYearClosePermissionsToMockPolicies` (api-plane 3 ตัว) · ui-plane 2 ตัว
(`page:view_fiscal_year_closes`/`component:close_fiscal_year`) ใช้ `SeedFiscalYearClosesUiPermission`
self-upsert pattern ปลอดภัยไม่ว่าจะรันก่อน/หลัง sync

---

### 2026-09-06 · Configurable Chart of Accounts (`gl_accounts`) ✅ **backend + Admin UI + permission fix — ยังมี 2 จุดค้าง**

รายละเอียดเต็ม/decision log: `HANDOFF-Configurable-Chart-Of-Accounts.md`. สรุปสั้น:

**Backend** (`apps/finance-bc`, commit `c5c61e4`) — `gl_accounts` เป็น nested-set tree ที่ตั้งค่าได้ต่อ
deployment แทน `GlAccount` TS enum เดิม (ลบทิ้งแล้ว) · seed มาตรฐาน 216 บัญชี · 14 `account_role`
คงที่ (`resolveIdByRole()`, cache ในหน่วยความจำ, invalidate ทุกครั้งที่เขียน) ที่ posting service ทั้ง 5
ตัว (payment/receipt/COGS/AP invoice/FX revaluation, รวม 32 จุด) เรียกแทนการ hard-code `code` ·
ย้าย role ข้ามบัญชีได้ผ่าน `PATCH /gl-accounts/:id/role` โดยไม่ต้องแก้โค้ด · migration C (backfill
`ledger_entries.account` enum → `account_id` FK) ผ่าน mapping รหัสเดิม→รหัสผังใหม่ 14 คู่ ตรวจ
`ledger_entries` ทุกแถวมี `account_id` ที่ resolve ได้จริงก่อนรัน — verify แล้วด้วย `pg_dump` ก่อน/หลัง

**เจอบั๊กแพลตฟอร์มจริงระหว่างทำ**: `TransformInterceptor`'s bare-array branch (`GET
/gl-accounts/tree` เป็น endpoint แรกในทั้งระบบที่คืน array เปล่าผ่าน `@ResourceType()`) ไม่เคยใส่
`status` เข้า envelope เลย เพราะ `createSuccessCollectionResponse()` ไม่มี default เหมือนฝั่ง
paginated — แก้ใน `libs/common` แล้ว + regression test 5 เคส (ไม่กระทบ BC อื่น ตรวจแล้ว)

**Admin UI** (`apps/iam`, commit `709dbe4`) — hosted ที่ `apps/iam/views/pages/gl-accounts/`
เหมือนทรัพยากรข้ามบริบทอื่น (`warehouses`/`uoms`) · list เป็น **indented tree จริง** (ต่างจาก
`warehouses` ที่เป็น flat table แม้เป็น nested-set เหมือนกัน — แผนสั่งให้ทำ tree เพราะยังไม่มี
tree-rendering component ให้ก็อปในระบบเลย) พร้อม expand/collapse (localStorage) + search/type filter
(flatten เมื่อ filter active) · ย้าย role แยกเป็น dialog ต่างหาก ไม่ใช่ฟิลด์ในฟอร์ม edit ปกติ (กระทบบัญชี
อีกใบเสมอ)

**แก้กับดัก permission 2-plane** (commit ถัดมา, migration `SeedGlAccountsUiPermission` +
`ReapplyGlAccountPermissionsToMockPolicies`) — grant migration เดิม (`GrantGlAccountPermissionsToMockPolicies`)
shipped **ใน commit เดียวกัน**กับ `@RequirePermission()` ที่มันพึ่งพา ซึ่งเป็นกับดักเดียวกับที่ §4
เตือนไว้ (ดู `ReapplyVatReturnPermissionsToMockPolicies`) — เขียน migration ใหม่ 2 ไฟล์แก้:
ui-plane (4 permission ใหม่ `page:view_gl_accounts`+3 `component:*`) ใช้ pattern self-upsert
(`ON CONFLICT ... DO UPDATE`) ที่ปลอดภัยไม่ว่าจะรันก่อน/หลัง `permissions:sync`, ส่วน api-plane
เป็น Reapply migration แบบเดิม (idempotent, `NOT EXISTS`-guard) — รันทั้งคู่แล้วบน DB จริง ยืนยันด้วย
query ตรงว่าทั้ง 8 permission (4 api + 4 ui) ผูกกับทั้ง 2 mock policy ครบ **หมายเหตุ**: dev/prod ใช้
Postgres ตัวเดียวกัน (§4 กับดัก #10) — migration ที่รันตอน implement ก็คือรันบน production ไปแล้ว
ไม่ใช่แค่ dev เฉยๆ

**ยังค้างจริง (ไม่ใช่แค่ backlog D2-D4 ที่ตัดออกจากขอบเขตแล้วตามคำสั่งผู้ใช้)**:
1. **Smoke test §8.3 ข้อ 6** — ยังไม่ได้ยิงเอกสารจริงที่โพสต์ GL (เช่น submit AP Invoice/Payment Entry)
   **หลัง**ย้าย role เพื่อพิสูจน์ว่า posting เดินตาม role ใหม่ ไม่ใช่ค้าง cache เก่า — ตรวจแล้วพบว่าทุก
   flow ที่โพสต์ GL จริงต้องมี valid `customer_id`/`supplier_id` ที่ verify ผ่าน RPC ข้าม BC จริง (ไม่ใช่แค่
   UUID เปล่าๆ) ยกเว้น `POST /finance-settings/close-period` ซึ่ง**เป็น one-way ratchet ปิดงวดถาวร** —
   ไม่ควรเรียกมั่วบน DB ที่ใช้ร่วมกับ production (ตาม §4 กับดัก #10) เพื่อเทสเฉยๆ ยังไม่ได้ตัดสินใจว่าจะทำ
   ยังไง (รอ user เลือก: เพิ่ม sales-bc เป็น dependency ของ smoke suite / เชื่อ unit test ที่ mock
   `resolveIdByRole()` ต่อ posting service ทั้ง 5 ตัวว่าครอบความเสี่ยงจริงพอแล้ว)
2. **Manual QA UI (§8.4)** — เครื่องมือ browser (claude-in-chrome) ใช้ไม่ได้ใน session ที่ทำงานนี้ —
   ตรวจได้แค่ curl ดู HTML/bundle render ไม่พัง (ไม่ error, element id ครบ) ยังไม่มีใคร click-through จริง
   (tree expand/collapse, สร้าง/แก้/ลบ, ย้าย role ผ่าน dialog) — รอ session ที่มี browser tool หรือมนุษย์ตรวจ

---

### 2026-09-05 · P6 · profit_by_lot + expiry_alerts ✅ **2/4 read model แรก — implement + migrate + deploy แล้ว**

หลังปิด A1/B1/C (ด้านล่าง) ผู้ใช้ถามว่า P6 เสร็จหรือยัง (**ยัง 0%**) แล้วสั่งให้ทำ "task ที่ไม่ติด block"
ตามลำดับความสำคัญ — สำรวจโค้ดจริงก่อนออกแบบ (agent คู่ขนาน 2 ตัว) พบว่า `DOMAIN_EVENT_ROUTING`
route ทุก event ที่มีอยู่จริงไปหา report-bc แล้ว แต่ report-bc มี **0 consumer** เลยสักตัว และ
srs-p6.html §03 อ้างอิง event 3 ตัว (`so.confirmed`/`invoice.issued`/`stock.low`) ที่**ไม่มีอยู่จริงใน
`DomainEvent` enum** — จึงตัดขอบเขตเหลือ 2 read model ที่ event ต้นทางมีอยู่จริงแล้ว: `profit_by_lot`
(จาก `profit.calculated`) และ `expiry_alerts` (จาก `expiry.approaching`)

**สถาปัตยกรรม** — คัดลอก pattern ของ finance-bc's `CogsModule` (`StockEventsController`, consumer
ตัวแรกของทั้งแพลตฟอร์ม) ทุกจุด:
- `ReportProcessedEvent extends ProcessedEventEntity` + `ReportProcessedEventsService extends
  BaseProcessedEventService` — module ใหม่ `processed-event/` แยกต่างหาก (ไม่ผูกกับ feature module ไหน)
  เพราะมี 2 consumer ใช้ร่วมกันตั้งแต่วันแรก ต่างจาก finance-bc ที่ยังมีแค่ 1 consumer จึงเก็บไว้ใน
  `cogs` module เดียว — ทั้ง `profit-by-lot`/`expiry-alert` module import โมดูลนี้แบบทางเดียว (ตรงกับ
  pattern `FinanceSettingAuditLogModule` ของ A1/C ด้านล่าง)
- `profit_by_lots` — **insert-only**, `@Unique('sale_id', 'lot_id')` (เหมือน `cogs_entries`) เพราะ 1
  event ต่อ 1 sale เกิดครั้งเดียว
- `expiry_alerts` — **upsert ต่อ `lot_id`** (คนละแบบกับข้างบน) เพราะสแกนของ inventory-bc รันซ้ำทุกวันและ
  ส่งล็อตเดิมมาซ้ำเสมอพร้อม `days_to_expiry` ที่เปลี่ยนไป — `processed_events` (claim ต่อ `event_id`)
  กันแค่ raw redelivery ของ chunk เดิม ส่วนการ "สแกนวันใหม่ส่งล็อตเดิมมาซ้ำ" ต้อง upsert ถึงจะถูก
- **`lot.created` ไม่ได้ consume** แม้ §03 ของ srs-p6.html เขียนว่า `expiry_alerts` กินทั้งสอง event —
  payload ของ `expiry.approaching` เป็น snapshot ครบทุกฟิลด์ต่อล็อตอยู่แล้ว (ชื่อสินค้า/คลัง/ต้นทุน)
  ไม่มีอะไรที่ `lot.created` ต้องเติม เป็นการตัดขอบเขตที่ตั้งใจ บันทึกไว้ตรงๆ ใน docblock ของ entity
- ทั้งสอง query API เป็น read-only ล้วน (`BaseServiceOperations`/`BaseControllerOperations`, ไม่มี
  create/update/delete) เหมือน `LedgerEntriesController`

**migration** `1788608230132-AddP6ProfitByLotAndExpiryAlertReadModels.ts` (`erp_report`) — `CREATE
TABLE` ล้วน 3 ตาราง (`profit_by_lots`, `expiry_alerts`, `processed_events`) ไม่มี data risk รันแล้ว
บน DB จริง verify `migration:generate:report` = `No changes`

**permission ใหม่ 2 ตัว**: `profit_by_lot:view`, `expiry_alert:view` — sync เข้า `erp_iam` แล้ว
(ยืนยัน 2 added, 0 removed, 219 unchanged) **ก่อน** เขียน grant migration เสมอ (เรียนจากบั๊ก P4#12) —
`1788608297222-GrantP6ReadModelPermissionsToMockPolicies.ts` รันแล้วบน DB จริง

**เทสต์ที่เพิ่ม (+20)**: claim/idempotency ของทั้งสอง consumer, multi-lot payload → multi-row insert
(profit_by_lot), upsert-by-lot_id + "สแกนใหม่ทับค่าเก่าไม่ error" (expiry_alerts), redelivery เป็น no-op
ทั้งคู่

**ตรวจแล้ว**: 1594/1594 test ผ่าน (113→115 suites) · eslint 0/0 · `nx build report-bc` ผ่าน · boot จริง
(`nest start report-bc`) แมป route ครบทั้ง `GET /profit-by-lots(/:id)`/`GET /expiry-alerts(/:id)` DI
resolve ไม่มี error, dead-letter exchange (`erp.dlx`/`erp.dlq` จากงาน B1 เมื่อเช้า) ยัง setup สำเร็จตอน
บูตเหมือนเดิม · **ยังไม่ได้ E2E ด้วย event จริง** — ต่างจาก AP invoice/settings ที่ยิงทดสอบเองผ่าน POST
เดียวจบได้ `profit.calculated`/`expiry.approaching` ต้องรอการขายจริง (COGS posting) หรือรอบสแกนหมดอายุ
ถัดไปของ inventory-bc เกิดขึ้นเอง — ทิ้งไว้เป็นการตรวจสอบที่ยังติดค้าง เมื่อมีโอกาสธรรมชาติ (ขายจริง/
สแกนรอบถัดไป) ควรเช็ค `GET /report-bc/v1/profit-by-lots`/`expiry-alerts` ว่ามีแถวใหม่ขึ้นจริง

**ที่ยัง blocked จริง ไม่ใช่แค่ยังไม่ทำ**: `sales_summary` (ต้องการ `so.confirmed`/`invoice.issued`)
และ `low_stock` (ต้องการ `stock.low`) — ทั้งสามชื่อนี้ไม่มีอยู่ใน `DomainEvent` enum เลย ต้องมีคน
ตัดสินใจ+emit ฝั่ง producer (sales-bc/inventory-bc) ก่อนถึงจะทำฝั่งรับที่ report-bc ได้ นี่คืองานคนละ
ขนาดกับที่ทำรอบนี้ (ต้องแก้ business logic ฝั่งขาย/สต็อกด้วย ไม่ใช่แค่เพิ่ม consumer)

**เอกสาร**: `srs-p6.html` §06 (as-built) อัปเดตสถานะ 2/6→ชัดเจนว่า 2 ตัวทำแล้ว + rulebox ใหม่อธิบาย
ว่า 3 event ที่เหลือยังไม่มีจริง · `api-workflow-guide.html` E2 ใหม่ (เทียบกับ `GET
/inventory-bc/v1/expiry-alerts` ของจริงที่ยังสดกว่า — คนละ endpoint แม้ permission ชื่อเดียวกัน) +
endpoint index (report-bc 16→21, พบ+แก้ doc drift เดิม `POST .../invoices/mock-pdf` หายจาก index) ·
`HANDOFF-Backlog-Reporting-Print-Tax.md` §3 อัปเดตสถานะเต็ม (ดูรายละเอียดกฎ/เหตุผลออกแบบที่นั่น §3.4)

---

### 2026-09-05 · P6 · low_stock + sales_summary ✅ **4/4 read model ครบแล้ว — implement + migrate + deploy แล้ว, sales_summary E2E ผ่าน**

ผู้ใช้สั่งต่อ P6 ให้ครบหลังจาก `profit_by_lot`/`expiry_alerts` (ด้านล่าง) — วิจัยก่อนแก้โค้ดพบ **บั๊กจริงใน
สิ่งที่ deploy ไปแล้วเมื่อเช้าวันเดียวกัน** และเปลี่ยนขอบเขตงานที่วางแผนไว้ทั้งหมด:

**บั๊ก #1 (แก้แล้ว) — `ExpiryAlertEventsController` bind ผิด transport มาตั้งแต่เช้า**:
`expiry.approaching`/`stock.low` **ไม่ได้ผ่าน outbox/relay** เหมือน `profit.calculated` — inventory-bc
ยิงตรงด้วย `MicroserviceClientService.emitWithContext(client, { cmd: '...' }, payload)` ซึ่ง pattern เป็น
**object** ไม่ใช่ string เปล่า และ envelope บนสายเป็น `IMicroservicePayload<T>` (`{ payload, _context }`)
ไม่ใช่ `IDomainEventEnvelope` — **ไม่มี UUID event_id ให้ claim เลย** `ExpiryAlertEventsController` ที่ผมเขียน
เมื่อเช้า bind ด้วย `@EventPattern(DomainEvent.ExpiryApproaching)` (string เปล่า) ซึ่ง**ไม่มีวันแมตช์กับ
object pattern จริง** — ยืนยันจากซอร์ส NestJS เอง (`transformPatternToRoute()` normalize คนละ route key
ระหว่าง object กับ string) เหตุการณ์จริงทุกตัวหายเข้า `erp.dlq` เงียบ ๆ ตั้งแต่ deploy เมื่อเช้า (ไม่ crash
เพราะ DLX ที่เพิ่งทำไปพอดี — บั๊กหนึ่งซ่อนอีกบั๊กหนึ่งไว้ได้พอดิบพอดี) **แก้แล้ว**: เปลี่ยนเป็น
`@EventPattern({ cmd: AppMicroservice.Report.cmd.InventoryEventResources.ExpiryApproaching })` +
`@Payload() message: IMicroservicePayload<T>` + เอา `processed_events` claim ออก (ไม่มี event_id ให้ claim
— ใช้ upsert-by-`lot_id` เป็นตัวกัน redelivery แทน ซึ่งเดิมก็เป็นตัวกันหลักอยู่แล้ว)

**บั๊ก #2 (พบระหว่างทาง, แก้แล้ว) — `processed_events.event_id` unique เดี่ยว ๆ กันสองคนละ consumer ไม่ได้**:
`sales_summary` ต้อง consume `profit.calculated` ซ้ำ (ตัวที่สองอิสระจาก `profit_by_lot`) — ถ้า claim ด้วย
`event_id` เดี่ยว ๆ ตัวที่สองจะแพ้ claim ของตัวแรกเสมอแล้ว**ไม่ทำงานเลยแบบเงียบ ๆ** แก้โดยเพิ่มคอลัมน์
`consumer_name` และเปลี่ยน unique key เป็น `(event_id, consumer_name)` ใน `ProcessedEventEntity`
(shared abstract class) — กระทบทุก BC ที่มีตาราง `processed_events` จริง คือ report-bc (0 แถว ตอนนั้น) และ
finance-bc's `CogsService` (2 แถวจริง ต้อง backfill `consumer_name = 'cogs'` ก่อนตั้ง `NOT NULL`)

**ขอบเขตที่ตัดสินใจกับผู้ใช้ — `sales_summary` ใช้ `invoice.issued` เท่านั้น ไม่ใช้ `so.confirmed`**:
§03 เดิมของ srs-p6.html ระบุทั้งสองตัว — `so.confirmed` ต้องสร้าง outbox module แรกของ sales-bc ทั้งหมด
เพื่อรับรู้รายได้ตอน order commitment ซึ่งไม่ตรงกับที่อื่นในระบบ (`credit_limit`/aging ยึดเอกสารที่ออก
จริงเสมอ) — ผู้ใช้เลือก `invoice.issued` เป็นตัวขับเดียว (แนะนำ) `low_stock` กลับพบว่า `stock.low` **มีอยู่
แล้วในโปรดักชัน** จากสแกนกลางคืนของ `ReorderAlertModule` (`ReorderAlertsService.scanAndEmit()`) — ไม่ต้อง
เพิ่มฝั่ง producer เลย ต่างจากที่บันทึกไว้เมื่อเช้าว่า "ทั้งสามชื่อนี้ไม่มีอยู่จริง" (คลาดเคลื่อน — `stock.low`
มีอยู่จริง แค่ไม่ใช่ `DomainEvent` enum member แต่เป็น `AppMicroservice.Report.cmd.InventoryEventResources.StockLow`
คนละ mechanism)

**สถาปัตยกรรมที่สร้างใหม่**:
- `low_stocks` — mirror `expiry_alerts` เป๊ะ (upsert ต่อ `product_id`, ไม่มี `processed_events` claim,
  เหตุผลเดียวกัน) — ไม่ต้องแตะฝั่ง producer เลยเพราะ `stock.low` มีอยู่แล้ว
- `sales_summaries` — **daily rollup ไม่ใช่ per-event snapshot** แบบตารางอื่น: `period` (timestamptz,
  เที่ยงคืน Bangkok ผ่าน `businessDayStart(toBusinessDate(...))` — ไม่ใช่ `date` column ตามกฎ CLAUDE.md)
  เขียนด้วย `INSERT ... ON CONFLICT (period) DO UPDATE SET x = sales_summaries.x + EXCLUDED.x`
  (เพิ่มค่าทับ ไม่ใช่ upsert เขียนทับ) สองอีเวนต์คนละคอลัมน์: `invoice.issued` → `total_sales`/
  `order_count`, `profit.calculated` → `gross_profit` (คนละ handler ใน `SalesSummaryEventsController`
  เดียวกัน ทั้งคู่ผ่าน outbox/relay จริงเหมือน `profit_by_lot` — claim ปกติด้วย `consumer_name = 'sales_summary'`)
- `ReceiptsService.issue()` (finance-bc) เพิ่ม `this.outboxService.stage(manager, [...])` ในทรานแซกชัน
  เดียวกับขึ้นเลข/เปลี่ยนสถานะ (ที่เดิม log ไว้ว่า "receipt.issued (no subscriber yet)" — แทนที่แล้ว) —
  ยิงทุก `document_type` ไม่กรองเฉพาะใบกำกับภาษี เพราะใบเสร็จเงินสดก็เป็นรายได้ที่รับรู้จริง

**migration**: `1788622105389-AddLowStockReadModel.ts`, `1788622410420-AddConsumerNameToProcessedEvents.ts`
(erp_report, 0 แถว ก่อนแก้), `1788622456246-AddConsumerNameToProcessedEvents.ts` (erp_finance, **มี
backfill** เพราะมี 2 แถวจริงอยู่แล้ว — เพิ่มคอลัมน์แบบ nullable ก่อน, `UPDATE ... SET consumer_name =
'cogs'`, แล้วค่อย `ALTER COLUMN ... SET NOT NULL`), `1788622882556-AddSalesSummaryReadModel.ts` — รันแล้ว
บน DB จริงทั้งหมด verify `migration:generate` = `No changes` ทุก BC

**permission ใหม่ 2 ตัว**: `low_stock:view`, `sales_summary:view` — sync เข้า `erp_iam` แล้ว (ยืนยัน 2
added, 0 removed, 221 unchanged) ก่อนเขียน grant migration เสมอ —
`1788622929728-GrantP6LowStockAndSalesSummaryPermissionsToMockPolicies.ts` รันแล้วบน DB จริง

**ตรวจแล้ว**: 1606/1606 test ผ่าน (117 suites) · eslint 0/0 · `nx build report-bc`/`finance-bc` ผ่าน ·
migration ครบทุก BC ที่แตะ (report/finance/iam) = `No changes` after

**commit `a5563e5` (erp-api) + `8f8e962` (plan-erp) + push แล้ว → deploy pipeline รันอัตโนมัติสำเร็จ**
(GitHub Actions run `33976232115`, 6m13s) — **`sales_summary` ยิง E2E ด้วยเอกสารจริงบน production แล้ว**:
สร้าง+issue ใบเสร็จทดสอบ 2 ใบ (ลูกค้า `CUST-TEST-01`) — `RCPT-2026-00002` (฿100) แล้ว `RCPT-2026-00003`
(฿250) — `GET /report-bc/v1/sales-summaries` ตอบกลับแถวเดียวถูกต้อง `total_sales: 100→350`,
`order_count: 1→2`, `period` ตรง Bangkok midnight ของวันที่ออกจริง (`2026-09-04T17:00:00.000Z` =
เที่ยงคืน 2026-09-05 เวลาไทย) — ยืนยันว่า **การเพิ่มค่าทับ (ไม่ใช่เขียนทับ) ทำงานถูกต้องจริงบน Postgres จริง**
(ก่อนหน้านี้ตรวจแค่ unit test เท่านั้น) และ `processed_events` composite key ใหม่ไม่ชนกับของ
`profit_by_lot` เลย

**`low_stock`/`expiry_alerts` ยังไม่ได้ยิง E2E จริง** — ทั้งสองรันเฉพาะตอน `@Cron` กลางคืน
(expiry `0 1 * * *`, reorder `0 2 * * *` เวลาไทย) ไม่มี endpoint ให้กดรันเองได้ ตรวจได้แค่ route/permission
ทำงานถูกต้อง (`GET .../low-stocks`, `GET .../expiry-alerts` ตอบ `200` ข้อมูลว่างเปล่า ถูกต้องเพราะยังไม่ถึง
รอบสแกนหลัง deploy) — ต้องรอ cron รอบถัดไปคืนนี้ถึงจะยืนยันบั๊ก transport ที่แก้ไปว่าใช้ได้จริงกับ event จริง

**เอกสาร**: `srs-p6.html` §06 อัปเดตเป็น 4/4 + rulebox ใหม่อธิบายบั๊กทั้งสอง + การตัดขอบเขต so.confirmed ·
`api-workflow-guide.html` E2 เพิ่ม endpoint 2 ตัว + rulebox อธิบายบั๊ก transport · ไฟล์นี้ (ย่อหน้านี้) +
`HANDOFF-Backlog-Reporting-Print-Tax.md` §3 อัปเดตสถานะเต็ม

**ที่ยังไม่ทำ**: `document_types` ผูกกับการออกเลขจริงของเอกสาร P4/P5 ยังเป็นงานค้าง ·
`inventory_summary`/`customer_by_province` ในไดอะแกรม §04 ยังเป็น doc drift (ไม่มีอยู่ใน mapping §03)
ไม่ใช่งานที่ต้องทำตาม · **ยังไม่ได้เช็คผล low_stock/expiry_alerts หลัง cron คืนนี้ — งานค้างต่อ**

---

### 2026-09-05 · Legal/Accounting Audit — A1 + B1 + C ✅ **เสร็จหมด + deploy + E2E บน production ผ่าน**

ผู้ใช้ให้รีวิว `HANDOFF-Feature.md` + `HANDOFF-Backlog-Reporting-Print-Tax.md` หาช่องโหว่ที่ไม่ถูกต้องตาม
กฎหมายไทย/ไม่สอดคล้องกับการทำงานจริง (P1–P5) + จุดที่ควรมี audit log พิเศษ — เจอ 6 ประเด็น (2 legal เสี่ยงสูง,
2 business practice, จุด audit log ที่ขาด) ผู้ใช้เลือกทำ 3 จุดจากที่เสนอ: **A1** (แยกใบกำกับเต็มรูป/อย่างย่อ),
**B1** (RabbitMQ dead-letter exchange), **C** (audit log กลางสำหรับ settings) — ที่เหลือ (หนังสือรับรองหัก
ณ ที่จ่าย/ทวิ 50, ภ.ง.ด. filing, 6-เดือนอายุเครดิตภาษีซื้อ) ยังเป็น backlog เหมือนเดิม

#### A1 · แยกใบกำกับภาษีเต็มรูป/อย่างย่อ — ปิดช่องโหว่เครดิตภาษีซื้อเกินสิทธิ์

**ปัญหาที่พบ**: `APInvoicesService.sumVatBucketsForPeriod()` (ภ.พ.30 ฝั่งซื้อ) นับทุก AP Invoice ที่
`SUBMITTED` เท่ากันหมด ไม่แยกว่าใบที่ผู้ขายออกให้เป็นใบกำกับภาษีเต็มรูปหรืออย่างย่อ — ตาม ป.รัษฎากร §82/5
เครดิตภาษีซื้อต้องมาจาก**ใบกำกับภาษีเต็มรูปเท่านั้น** ใบอย่างย่อ (§86/6 — สิทธิ์ของผู้ขายค้าปลีก) ใช้เครดิต
ไม่ได้เลยแม้ผู้ขายจะจด VAT ก็ตาม (`is_supplier_vat_registered` เป็นคนละคำถาม) — ถ้าเอาเลขจาก endpoint นี้
ไปยื่นจริงตอนนั้น มีความเสี่ยงเครดิตภาษีซื้อเกินสิทธิ์ตามกฎหมาย

**แก้จริง**: enum ใหม่ `VendorTaxInvoiceType` (`full_tax_invoice` default / `abbreviated_tax_invoice`) +
คอลัมน์ `ap_invoices.vendor_tax_invoice_type` — AP Clerk ระบุจากใบกระดาษตอน create/update (DRAFT เท่านั้น)
· ใบลดหนี้ (`CREDIT_NOTE`) **สืบทอดจากใบที่อ้าง** เหมือน `vat_rate`/FX snapshot ไม่ resolve ใหม่ ·
`sumVatBucketsForPeriod()` กรอง `WHERE vendor_tax_invoice_type = 'full_tax_invoice'` — ตัดออก**ทั้งแถว**
(ไม่ใช่แค่ `vat_amount`) เพราะเอกสารทั้งใบไม่ใช่หลักฐานที่ใช้รายงานภาษีซื้อได้เลย

**เทสต์ที่เพิ่ม (+6)**: default เป็น `full_tax_invoice`, AP Clerk ระบุ `abbreviated_tax_invoice` เองได้,
credit note inherit จากบิลแม้บิลเป็น abbreviated, update() แก้ได้เฉพาะ non-credit-note, query filter
ที่ `sumVatBucketsForPeriod()` ต่อ `vendor_tax_invoice_type`

**migration** `1788576929502-AddVendorTaxInvoiceTypeAndSettingAuditLogs.ts` (`erp_finance`, รวมกับ C) —
`ADD COLUMN ... NOT NULL DEFAULT 'full_tax_invoice'` ปลอดภัยเพราะมี default (ค่านี้ = พฤติกรรมเดิมที่นับ
ทุกใบเป็นเครดิตได้ ไม่เปลี่ยน retroactively) — **รันแล้วบน DB จริง** verify `migration:generate:finance` =
`No changes`

**E2E บน production จริง**: สร้าง AP invoice จริง 2 ใบจาก GRN จริง (`APINV-2026-00001` full_tax_invoice,
`APINV-2026-00002` abbreviated_tax_invoice) → submit ผ่าน GL posting ทั้งคู่ (Dr 1150/Cr 2110 balance
ถูกต้อง) → `GET /vat-returns?year=2026&month=9` **`purchases_exempt_vat_price` คงที่ 450 หลัง submit ใบ
full เพียงใบเดียว และ**ไม่ขยับเป็น 900**หลัง submit ใบ abbreviated เพิ่ม** — พิสูจน์ว่ากรองถูกต้องจริงด้วย
ข้อมูลจริงบน production ไม่ใช่แค่ unit test (เอกสารทดสอบทั้งสองใบผู้ใช้ยืนยันให้เก็บไว้ได้ ไม่ต้องลบ — dev DB)

**เอกสาร**: `api-workflow-guide.html` A5 (ตัวอย่าง body + rulebox §82/5 vs §86/6) + C8 (ลบ "ยังไม่รองรับ"
ที่ล้าสมัย + rulebox ยืนยันผลทดสอบจริง) · `srs-p5.html` rulebox ใหม่ `RULE · VENDOR TAX INVOICE TYPE`

#### B1 · RabbitMQ Dead-Letter Exchange — ปิด (บางส่วน) ช่องโหว่ event หายเงียบ

**ปัญหาเดิม** (จาก `HANDOFF-Backlog-Reporting-Print-Tax.md` §2): RMQ server ทุก BC ตั้ง `noAck:false` +
`prefetchCount:1` — event ที่ route ไปหา BC ที่ไม่มี `@EventPattern` ตรงกันเลย (report-bc/sales-bc/
supplier-bc ทั้งสามยังไม่มี consumer เลยสักตัว) จะโดน `nack(msg,false,false)` แล้ว**หายถาวรอย่างเงียบๆ**
ไม่มี error ไม่มี log

**แก้จริง**: `ensureDeadLetterInfrastructure()` ใหม่ใน `microservice-transport.util.ts` — ประกาศ exchange
`erp.dlx` (fanout, durable) + queue `erp.dlq` (durable) + binding ทุกครั้งที่ BC บูต (idempotent, best-effort
ไม่บล็อกบูตถ้า broker ต่อไม่ติด) เรียกจาก `bootstrapApplication()` ก่อน `buildServerOptions()` ·
**ไม่แก้ที่ `queueOptions.arguments` ของคิวเดิมโดยตรง** — RabbitMQ ปฏิเสธการ redeclare คิวที่มีอยู่แล้วด้วย
arguments ต่างกัน (`PRECONDITION_FAILED`) ซึ่งจะทำทุก client ข้าม BC ต่อไม่ติดทันทีที่ deploy — ใช้ **broker
policy** แทน (ไม่ต้อง redeclare คิวเลย):

```bash
rabbitmqctl set_policy dlx-erp '^erp_.*_queue$' \
  '{"dead-letter-exchange":"erp.dlx"}' --apply-to queues
```

**ยืนยันจริงบน production**: ผ่าน RabbitMQ Management API (`172.16.0.220:15672`, vhost `/` คือ production
จริง ต่างจาก `/local-pp` ที่เป็น dev เครื่องนี้) — `erp.dlx`/`erp.dlq` ถูกสร้างจริงหลัง deploy · policy
`dlx-erp` apply แล้ว ทั้ง 8 คิว (`erp_auth_queue` ... `erp_supplier_queue`) โชว์ `policy: "dlx-erp"` โดย
`arguments` ยังเป็น `{}` เหมือนเดิม (ไม่กระทบ consumer ที่ต่ออยู่แม้แต่วินาทีเดียว)

**ยังไม่แก้ต้นเหตุ** — report-bc/sales-bc/supplier-bc ยังไม่มี `@EventPattern` เลย (คือ P6 CQRS Read Model
ที่ยังไม่ได้ทำ) event ที่ route มาตอนนี้จะไปนอนรอที่ `erp.dlq` แทนที่จะหายถาวร แต่ยังต้องมีคนทำ P6 จริงถึงจะ
ใช้ข้อมูลนั้นได้ — ดู `srs-p6.html` (แก้ note ให้ตรงกับโค้ดจริงแล้ว) และ backlog handoff §2/§3

**เอกสาร**: หน้าใหม่ `rabbitmq-reliability-guide.html` (7 หัวข้อเต็ม — ack contract, head-of-line block
vs silent message loss, ทำไมต้องใช้ broker policy, วิธี monitor/กู้คืนจาก DLQ, checklist ก่อนเพิ่ม consumer
ใหม่) ลงทะเบียนใน `index.html`/`components.js` แล้ว · ลิงก์จาก `backend-convention.html`/`srs-p6.html`

#### C · Audit Log กลางสำหรับ Settings — ปิดช่องโหว่ "แก้ค่าควบคุมแล้วไม่มีร่องรอย"

**ปัญหาที่พบ**: `finance_settings`/`sales_settings`/`supplier_settings` เป็น**แถวเดี่ยวที่ถูกเขียนทับ**
ทุกครั้งที่ `PATCH`/`PUT` — มีแค่ `updated_at`/`updated_by` จาก `BaseEntity` บอก "ใครแก้ล่าสุด" **ไม่มี
ประวัติว่าเคยเป็นค่าอะไรมาก่อน** — ถ้ามีคนดัน `price_tolerance_percent` ขึ้นชั่วคราวเพื่อดันใบราคาผิดปกติผ่าน
แล้วเซ็ตกลับ ไม่มีร่องรอยเหลือเลย (ต่างจาก `role_policy_audit_logs`/`user_role_audit_logs` ของ iam-bc ที่มี
audit log อยู่แล้ว — แต่คุมแค่สิทธิ์ ไม่คุม settings ทางการเงิน/ราคา)

**แก้จริง**: util ใหม่ `diffAuditableFields()` ใน `@lib/common` (ใช้ร่วม 3 BC) + ตารางใหม่ 3 ตัว
(`finance_setting_audit_logs` คุมทั้ง `finance_settings` และ `tax_configs` ด้วย `entity_name` แยก,
`sales_setting_audit_logs`, `supplier_setting_audit_logs`) — 1 แถวต่อ 1 ฟิลด์ที่เปลี่ยนจริง (ไม่เปลี่ยน =
ไม่เขียนแถว) ไม่ผูก FK กลับตารางต้นทาง (เหตุผลเดียวกับ `role_policy_audit_logs`) · `finance-setting-audit-log`
เป็นโมดูลแยกต่างหาก (ไม่ใช่ของ `finance-setting` หรือ `tax-config` เอง) เพราะทั้งสองโมดูลต้องเขียนเข้ามันและ
ห้าม import กันเอง (root CLAUDE.md § "Cross-module data access") — ทั้งสองโมดูล import โมดูลนี้แบบทางเดียว
แทน · endpoint `GET /*-setting-audit-logs` read-only ล้วน (เหมือน `LedgerEntriesController`)

**ฟิลด์ที่คุม**: `price_tolerance_percent`/`party_currency_enforcement`/`ledger_frozen_upto` (settings) +
`rate`/`effective_from`/`effective_upto`/`is_active` (`tax_configs`) — เฉพาะ business control ไม่ใช่
`code`/`name_th`/`name_en` ที่เป็น cosmetic

**permission ใหม่ 3 ตัว**: `finance_setting_audit_log:view`, `sales_setting_audit_log:view`,
`supplier_setting_audit_log:view` — **เรียนจากบั๊ก P4#12**: รัน `npm run permissions:sync` (ยืนยัน 3 added,
0 removed, 216 unchanged) **ก่อน** เขียน grant migration เสมอ — migration
`1788577073884-GrantSettingAuditLogPermissionsToMockPolicies.ts` (`erp_iam`) รันแล้วบน DB จริง

**migration**: `1788576929502-AddVendorTaxInvoiceTypeAndSettingAuditLogs.ts` (`erp_finance`, รวมกับ A1) ·
`1788576954611-AddSalesSettingAuditLogs.ts` (`erp_sales`) ·
`1788576975252-AddSupplierSettingAuditLogs.ts` (`erp_supplier`) — ทั้งหมด `CREATE TABLE` ล้วน ไม่มี data
risk เลย รันแล้วบน DB จริงทั้ง 3 BC verify `migration:generate` = `No changes` ทุกตัว

**เทสต์ที่เพิ่ม (+7)**: `applyPeriodLock`/`updateSettings` บันทึก diff ถูกต้อง + ไม่เขียนแถวเมื่อไม่เปลี่ยน
(finance) · เช่นกันสำหรับ `TaxConfigsService.update()`

**E2E บน production จริง**: `GET /finance-setting-audit-logs`/`sales-setting-audit-logs`/
`supplier-setting-audit-logs` → **200** (ไม่ 403 — permission grant ทำงานตั้งแต่ login ครั้งแรก ไม่ต้องรอ
login ใหม่เหมือน P4#12) · `PATCH /finance-settings {price_tolerance_percent: 25}` (จาก 20) → `GET
finance-setting-audit-logs` เห็นแถวใหม่ `{field_name: "price_tolerance_percent", old_value: "20",
new_value: "25", created_by: <user จริง>}` ทันที → revert กลับ 20 แล้ว (มีแถว audit ของการ revert ด้วย)

**เอกสาร**: `api-workflow-guide.html` C9 ใหม่ (endpoint + ตัวอย่าง response จริงจาก production) + แถวใน
Master Data table + endpoint index (finance-bc 56→57, sales-bc 46→47, supplier-bc 26→27 endpoints) ·
`srs-p5.html` rulebox ใหม่ `RULE · SETTING AUDIT LOG` (อ้างอิง COSO Internal Control Framework)

**ตรวจแล้วรวมทั้ง 3 จุด**: 1585/1585 test ผ่าน (113 suites) · eslint 0/0 ทั้ง repo · build ผ่านทั้ง
finance-bc/sales-bc/supplier-bc/report-bc/iam · deploy production สำเร็จ (run `33940617869`, 8 apps
reload, 4 BC migration รายงาน `No migrations are pending` เพราะรันไว้ก่อน deploy แล้ว) · commit + push
ทั้งสอง repo แล้ว (`erp-api` `197f53e`+`99dd443`, `plan-erp` `3ed572d`)

**ที่ยังเป็น backlog** (ไม่ได้เลือกทำรอบนี้ — อยู่ใน backlog handoff เดิม): หนังสือรับรองหัก ณ ที่จ่าย/ทวิ 50
(ต้องเพิ่ม `ap_invoices.supplier_tax_id` + `tax_configs.income_type` ก่อน), การยื่น ภ.ง.ด. ต่อกรมสรรพากร
(ไม่เคยถูกพูดถึงในเอกสารเดิมเลย — คนละเรื่องกับหนังสือรับรอง), 6-เดือนอายุเครดิตภาษีซื้อ (§82/3), ยอดยกไป/
สถานะ "ยื่นแล้ว" ต่อเดือนของ ภ.พ.30

### `meta.warnings` ใน JSON:API envelope ✅ **เสร็จสมบูรณ์ 2026-09-02 — commit `986b8b1` + push + deploy สำเร็จ**

ลูกค้าเลือกทำอันนี้ก่อนจากรายการ "ที่แนะนำถ้าจะทำต่อเลย" รอบก่อน (§0) — ตอนนี้ mode `warn` ของ
`party_currency_enforcement` ส่งข้อความ mismatch กลับใน response ด้วยแล้ว ไม่ใช่แค่ server log

**กลไก — AsyncLocalStorage, ไม่ใช่ DI**: `TransformInterceptor`/`LocalizationInterceptor` เป็น
`new`'d ตรงๆ ใน `bootstrap.util.ts` (`app.useGlobalInterceptors(...)`) ไม่ผ่าน `APP_INTERCEPTOR`
เลย **เป็น `Scope.REQUEST`/`@Inject(REQUEST)` ไม่ได้** และ service ที่ตรวจ party-currency
(`assertPartyCurrency` ใน 5 service) อยู่ลึกหลายชั้นจาก controller โดยไม่มี `@Req()` เลยสักตัว —
ทางเดียวที่ให้ service ส่งค่าขึ้นไปถึง interceptor ได้คือ ambient state ตาม async causality chain
ของ Node เอง (แนวเดียวกับที่ `nestjs-cls`/`cls-hooked` ใช้)

**โครงสร้าง `meta.warnings` — object ทรงเดียวกับ `errors`, ไม่ใช่ string เปล่า** (แก้หลัง code
review รอบสอง): ตอนแรก implement เป็น `string[]` แล้วผู้ใช้ทักว่าไม่สอดคล้องกับ `errors:
IErrorObject[]` ที่มีโครงสร้าง `{code, title, detail, ...}` อยู่แล้วในทุก envelope — ทำให้ client ต้อง
string-match ข้อความแทนที่จะเช็ค `code`) จึงเปลี่ยนเป็น `IWarningObject[]` (`{ code, detail }` —
mirror แค่ 2 field ที่ `IErrorObject` ใช้จริง ไม่ใส่ `source`/`field`/`meta` ที่ยังไม่มี use case) ·
พิจารณาแล้วว่า**ไม่ใช้ `status.code` แทน** (แบบ `200002` ที่มีอยู่แล้วสำหรับ large-dataset) เพราะ
`status.code` มีได้ค่าเดียวต่อ response และ message เป็น static template ต่อ code ขณะที่ warning
ของ party-currency เป็น dynamic text ผูกกับข้อมูลจริง (ชื่อลูกค้า/สกุลเงิน) และในอนาคตอาจมีมากกว่า 1
แหล่งพร้อมกัน — `meta` (extension point ตาม JSON:API spec) + array เหมาะกว่า

**ไฟล์:**
- ใหม่: `interfaces/response/warning-object.interface.ts` (`IWarningObject`) +
  `interfaces/response/paginated-data.interface.ts` (`IPaginatedData` — ย้ายมาจาก interface
  `PaginatedData` ที่เคย inline อยู่ใน `transform-interceptor.util.ts` เอง ตาม convention "local
  interface ต้องแยกไฟล์" ใน root `CLAUDE.md`)
- `libs/common/src/utils/http-success/request-warnings.util.ts` — เก็บ**ทั้ง lifecycle**ของ
  warnings ไว้ที่เดียว: `withRequestWarningsContext`/`addRequestWarning`/`consumeRequestWarnings`
  (AsyncLocalStorage) + `requestWarningsMiddleware` (connect-style, เข้า context ก่อน routing) +
  `attachWarnings<T>(envelope: IJsonApiResponse<T>)` (ย้ายมาจาก `TransformInterceptor` เอง —
  อยู่ไฟล์เดียวกับ `consumeRequestWarnings` ที่มันเรียกเข้าท่ากว่า)
- `bootstrap.util.ts` — `app.use(requestWarningsMiddleware)` เป็นบรรทัดแรกใน
  `registerGlobalMiddleware()` (ต้องมาก่อน guard/interceptor/controller ทั้งหมด)
- `TransformInterceptor` — เรียก `attachWarnings(...)` (import จาก request-warnings.util) ทุก
  branch (single/created/collection/paginated) · ไม่มีอะไรเลย = ไม่มี key `warnings` (ไม่ใช่ array
  ว่าง) ตอบเหมือนเดิม 100% กับ response ที่ไม่เคยเตือน
- `IMeta.warnings?: IWarningObject[]`
- 5 service (`quotations`, `sales-orders.convertFromQuotation`, `receipts`, `ap-invoices`,
  `purchase-orders`) — `assertPartyCurrency` เรียก
  `addRequestWarning({ code: 'PARTY_CURRENCY_MISMATCH', detail: warning })` ควบคู่กับ
  `this.logger.warn(...)` เดิม (ของเดิมไม่ถูกถอด — log ฝั่ง server ยังมีไว้ audit เหมือนเดิม)
- เอกสาร: `api-workflow-guide.html` รูลบอกซ์ "สกุลเงินเอกสารต้องตรง billing_currency…" แก้ตรง
  `warn` ว่าตอนนี้มากับ `meta.warnings` ด้วย (object `{code, detail}` ไม่ใช่ string) — render-check
  ผ่าน (mermaid 0 error)

**⚠️ กับดักที่เจอระหว่างทำ (จำไว้ถ้าจะแก้ `TransformInterceptor`/`request-warnings.util` อีก)**:
1. ผูก `attachWarnings` เข้ากับ interface ที่มี index signature (`[key: string]: unknown`) แล้วรับ
   `IJsonApiResponse<T>` เป็น argument **ผ่าน jest แต่ tsc/webpack build จริงพัง** —
   `TS2345: Index signature for type 'string' is missing in type 'IJsonApiResponse<...>'`
   เพราะ jest (ts-jest) ไม่ type-check ข้าม module boundary เข้มเท่า `tsc`/webpack —
   **เจอตอนบูตจริงเท่านั้น** ไม่ใช่ตอน `npx jest` (ทุกเทสต์ผ่านตอนนั้นทั้งที่ build จริงพัง) ·
   แก้โดย type `attachWarnings<T>(envelope: IJsonApiResponse<T>): IJsonApiResponse<T>` ตรงๆ
   (ไม่ต้องมี custom interface คั่นเลย เพราะ `IJsonApiResponse.meta` เป็น required field อยู่แล้ว) ·
   **ย้ำอีกที** ว่าทำไม `CLAUDE.md`/`HANDOFF` เดิมถึงสั่งให้ boot จริง (`nest start`) ก่อนเชื่อว่าเสร็จ
   ทุกครั้งที่แตะ global interceptor/filter — รอบนี้คือตัวอย่างจริงที่ jest เขียวหมดแต่ของพัง
2. เทสต์ที่ `expect(consumeRequestWarnings()).toEqual([{ code, detail: expect.stringContaining(...) }])`
   โดน eslint `@typescript-eslint/no-unsafe-assignment` เพราะ `expect.stringContaining()` type เป็น
   `any` — ห่อด้วย `expect.objectContaining({...})` **ไม่พอ** ต้อง cast ตัว matcher เองเป็น
   `as unknown` ด้วย (ตาม pattern ที่มีอยู่แล้วในไฟล์เดียวกัน: `expect.any(Date) as unknown`)

**E2E บน environment จริง (ยิงผ่าน `localhost` boot จริง ไม่ใช่ mock — 2026-09-02):** boot
`auth`/`iam`/`inventory-bc`/`sales-bc` ทั้ง 4 ตัวจริงในเครื่อง (เช็คก่อนว่า `RABBITMQ_VHOST=/local-pp`
เป็น vhost แยกของเครื่อง dev **ไม่ปนกับ RMQ consumer ของ production** แม้ Postgres จะแชร์กันจริงตาม
§4 #10 ก็ตาม) → login จริงด้วย `superadmin` → สร้าง USD price list + item price ชั่วคราวใน
inventory-bc (ไม่มี price list ต่างประเทศอยู่เลยในข้อมูลจริงตอนนี้) → ตั้ง `sales_settings.
party_currency_enforcement=warn` → สร้าง quotation จริงให้ `CUST-TEST-03` (billing_currency=THB ที่
รอบก่อนเหลือไว้ให้ใช้ซ้ำได้) → **response กลับมามี `meta.warnings: [{code:
"PARTY_CURRENCY_MISMATCH", detail: "Customer 'CUST-TEST-03' is billed in THB, but this document is
in USD..."}]` ตรงตามที่ออกแบบทุกประการ** → cleanup ครบ: ลบ quotation/item-price/price-list ทดสอบ
(verify 404 ทั้งคู่), revert `party_currency_enforcement` กลับ `off`, ไม่แตะ `CUST-TEST-03`, ปิด
เซอร์วิสทั้ง 4 (verify port ว่างหมด), ลบไฟล์ token ใน scratchpad

**ตรวจแล้ว**: 1496/1496 test ผ่าน · eslint 0/0 ทั้ง repo · `nest start sales-bc` build จริงผ่าน
(webpack compiled successfully) ทั้งก่อนและหลัง refactor เป็น `IWarningObject` DI resolve ครบ ไม่มี
error route map เหมือนเดิมทุกเส้น (46 routes) · E2E จริงผ่านตามด้านบน

**Commit + push + deploy**: ผู้ใช้อนุมัติแล้ว 2026-09-02 — `erp-api` commit `986b8b1` (รวมกับบั๊ก
pricing ด้านล่างในคอมมิตเดียว เพราะไฟล์ทับกันจน `git add -p` ไม่คุ้ม), `docs/plan-erp` commit
`e4a4dd6`/`ab891a7` · deploy run `33639969936` สำเร็จ — 8 apps reload (`auth`, `iam`,
`inventory-bc`, `supplier-bc`, `sales-bc`, `finance-bc`, `report-bc`, `storage`), ไม่มี migration
ใหม่ (`no BC migrations changed this deploy`)

### บั๊ก · auto-resolved price ของ price list ต่างประเทศไม่แปลงอัตรา ✅ **แก้แล้ว 2026-09-02**

เจอระหว่าง E2E ของ `meta.warnings` ด้านบน (คนละเรื่องกัน) — ราคาที่ auto-resolve ให้ (บรรทัดที่ไม่ส่ง
`unit_price` มา ให้ pricing rule engine/`item_prices` เสนอราคาเอง) **ไม่ถูกแปลงเป็น book currency
ก่อนบันทึก** เมื่อใช้ price list สกุลต่างประเทศ — ทดสอบจริงกับ USD price list rate=10, currency_rate=35
ได้ `unit_price` (book/THB) = 10 ทั้งที่ควรเป็น 350

**ต้นตอ — currency หายไประหว่างข้าม RPC boundary ไม่ใช่แค่ "ลืมแปลง"**: ตรวจแล้วว่า
`quotations.service.ts` จุด reference-bound check (~บรรทัด 508, สำหรับ `unit_price` ที่ client พิมพ์
เอง) เรียก `toBookCurrency(reference.rate, documentCurrencyRate)` ถูกต้อง แต่จุด auto-resolve
(~บรรทัด 538–570, `pricingRuleProxyService.resolvePrice(...)`) ใช้ผลลัพธ์ตรงๆ **ไม่แปลงเลย** ·
สืบเข้าไปใน inventory-bc's `PricingRulesService.resolvePrice()` พบว่า `IItemPriceLookupResult`
(ที่ reference-check ใช้) มี `currency` มาด้วยอยู่แล้ว แต่ `IResolvePriceResult` (ที่ auto-resolve ใช้)
**ทิ้ง `currency` ทันทีที่ประกอบ response** — สายที่เรียก `findEffectivePrice()` ภายใน `resolvePrice()`
เห็น `base.currency`/`fallback.currency` แต่ไม่เคยส่งต่อออกมาให้ sales-bc รู้เลย ไม่ใช่แค่ "ลืมเรียก
`toBookCurrency`" แต่ฝั่ง caller ไม่มีข้อมูลพอจะรู้ด้วยซ้ำว่าต้องแปลงไหม

**ความซับซ้อนที่ทำให้แก้แบบ "ครอบ `toBookCurrency` ทุกกรณี" ผิด**: ผลจาก `resolvePrice()` มี 2 กรณีที่
ต้องแยก — rule แบบ `RATE` คืนค่าที่ admin ตั้งเป็นราคาเด็ดขาด **ไม่ผูกกับ price list ใดเลย** (เป็น book
currency อยู่แล้วโดยธรรมชาติ แปลงซ้ำจะกลายเป็นบั๊กใหม่) ส่วน `DISCOUNT_PERCENT`/fallback มาจาก
`item_prices` จริง (ผูกกับ price list ก็ต้องแปลง) ทั้งสองกรณีนี้แยกไม่ได้จาก `pricing_rule_id !== null`
เพราะ `DISCOUNT_PERCENT` ก็มี `pricing_rule_id` ไม่เป็น null เหมือนกัน

**แก้จริง — เพิ่ม `currency: Currency | null` ใน contract ข้าม RPC**:
- `IResolvePriceResult` (ทั้ง 2 ที่ที่ประกาศซ้ำกันอยู่ — inventory-bc's
  `pricing-rule/interfaces/resolve-price-result.interface.ts` และ sales-bc's
  `integrations/inventory-bc/interfaces/resolve-price.interface.ts`, ไม่ได้ dedup เป็น
  `@lib/common` เพราะเกินขอบเขตของบั๊กนี้) เพิ่ม `currency: Currency | null` —
  `null` = RATE-type (ไม่ต้องแปลง), ค่าจริง = มาจาก price list นั้น (ต้องแปลง)
- `pricing-rules.service.ts::resolvePrice()` — ใส่ `currency: null` ใน branch RATE,
  `currency: base.currency`/`fallback.currency` ใน อีกสอง branch (inventory-bc **ไม่แปลงเอง** —
  แค่ relay currency ต่อ เหมือนที่ `getEffectivePrice` ทำอยู่แล้ว ให้ผู้บริโภคแปลงเองเมื่อรู้อัตราของ
  เอกสารตัวเอง)
- `quotations.service.ts` — เมื่อ `resolution.currency !== null` เรียก
  `assertReferencePriceCurrencyMatches(...)` (guard เดียวกับจุด reference-check) แล้ว
  `toBookCurrency(resolution.unit_price, documentCurrencyRate)` ก่อนเก็บลง
  `resolvedPriceByProductId` · เมื่อ `null` ใช้ค่าตรงๆ (RATE-type ไม่แปลง)

**เทสต์ที่เพิ่ม/แก้ (+4 ใหม่ · แก้ของเดิม 6 ตัวที่พังเพราะ `IResolvePriceResult` เปลี่ยน shape)**:
`pricing-rules.service.spec.ts` — แก้ 3 เทสต์เดิมให้ expect `currency` ที่ถูกต้อง + เพิ่ม 1 เทสต์ยืนยันว่า
currency ที่ไม่ใช่ THB ก็ relay ผ่านตรงๆ (ไม่ถูกแปลงเองที่ inventory-bc) ·
`quotations.service.spec.ts` — แก้ 3 เทสต์เดิม (เติม `currency: null`) + เพิ่ม 3 เทสต์ใหม่: (1) RATE-type
ไม่ถูกแปลงแม้เอกสารไม่ใช่ THB, (2) auto-resolve จาก USD price list แปลงถูกต้อง (10 USD × 35 = 350 THB
ตรงกับที่เจอจริงตอน E2E), (3) ปฏิเสธเมื่อ currency ที่ resolve ได้ไม่ตรงกับเอกสาร

**ขอบเขตที่ตรวจแล้วว่าไม่กระทบ** (สำรวจ 4 service ที่มี currency เป็นของตัวเอง): บั๊กนี้อยู่ที่
`quotations.service.ts` เท่านั้น — `purchase-orders`/`receipts`/`ap-invoices` ไม่มี auto-resolve
path เลย (`unit_cost`/`unit_price` เป็น required field ใน DTO เสมอ ไม่มี `@IsOptional()`) ·
`sales-orders.convertFromQuotation` ไม่ re-price อะไรเลย copy `unit_price`/`line_total` จาก
quotation มาตรงๆ (จะรับสืบทอดบั๊ก/การแก้ของ quotation มาเองโดยอัตโนมัติ ไม่ต้องแก้ซ้ำ)

**ตรวจแล้ว**: 1500/1500 test ผ่าน (+4 ใหม่) · eslint 0/0 ทั้ง repo · `nest start` ทั้ง `inventory-bc`
และ `sales-bc` build จริงผ่าน (webpack compiled successfully) route map ครบทุกเส้น ไม่มี error

---

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

**unrealised FX (TFRS 21 อีกครึ่ง) — ✅ เสร็จแล้ว 2026-09-03**: การตีราคา AR/AP ที่ยังเปิดอยู่ ณ วันสิ้นงวด
ผูกกับ `finance_settings.ledger_frozen_upto` ตามที่วางแผนไว้ตรงนี้ — ดู §2 หัวข้อ **P4 #12** ด้านล่างสำหรับรายละเอียด

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
| ~~8~~ | ~~P3~~ | ~~**`billing_notes` รวมใบข้ามสกุลได้**~~ ✅ **ตัดสินใจแล้ว 2026-09-03 — เก็บพฤติกรรมเดิม + เอกสาร + WARN** ดู §"#8 billing_notes ข้ามสกุล" ด้านล่าง |
| ~~9~~ | ~~P3~~ | ~~**`credit_limit`/`credit_exposure` เป็น THB**~~ ✅ **เสร็จแล้ว 2026-09-02** — ดู §"P3 #9" ด้านล่าง |
| 10 | P4 | **`item_prices` ไม่มี currency ของตัวเอง** — สืบทอดจาก price list ซึ่ง docblock ระบุไว้แล้วว่าจงใจ (ตรงกับ SAP/Odoo/NetSuite) · **ไม่ใช่บั๊ก** บันทึกไว้เพราะ audit ต้องยืนยัน |
| 11 | P4 | **เพิ่มสกุลเงินใหม่ = 4 migration** (finance/sales/supplier/inventory) — ราคาของ enum ต่อ database · จงใจ เขียนไว้ใน docblock ของ `Currency` |
| ~~12~~ | ~~P4~~ | ~~**unrealised FX ยังไม่ทำ**~~ ✅ **เสร็จแล้ว 2026-09-03** — ดู §"P4 #12" ด้านล่าง |

---

### P3 #9 · credit_limit/credit_exposure เป็น THB เสมอ — เขียนเป็น platform standard ✅ **เสร็จแล้ว 2026-09-02 — commit `21b6bd4` + push แล้ว**

งานเอกสารล้วน (ผู้ใช้ยืนยันชัดเจนว่าไม่แตะ logic) — `customers.credit_limit` และ snapshot ทั้งคู่
(`sales_orders`/`delivery_notes`) ถูกต้องอยู่แล้วในฐานะสกุลบัญชี (ยืนยันจากโค้ดจริง:
`SalesOrdersService.resolveCreditExposure()`/`evaluateCredit()` อ่านแต่ `unit_price`/`total` —
คอลัมน์ book/THB — ไม่แตะ `raw_*`/`currency` เลยสักจุด) แต่ไม่มีที่ไหนเขียนไว้เป็นลายลักษณ์อักษรว่าเป็น
กติกาของทั้งแพลตฟอร์ม ไม่ใช่แค่บังเอิญ

**ทำไมต้องเขียนตอนนี้**: M11 (`party_currency_enforcement`, 2026-09-02) เพิ่งทำให้
`customers.billing_currency` มีความหมายจริงเป็นครั้งแรก — ก่อนหน้านั้นค่านี้ไม่เคยถูกอ่านเลย
พอลูกค้าจริงเริ่มมี `billing_currency = USD` ได้ คำถาม "แล้ววงเงินเครดิตของเขาเป็นสกุลไหน" จึงเพิ่ง
กลายเป็นคำถามที่มีคนถามได้จริง — ก่อน M11 มันเป็นคำถามที่ไม่มีทางเกิดขึ้น

**ไฟล์ที่แตะ (เอกสาร + entity comment เท่านั้น ไม่มี business logic เปลี่ยน):**
- `customers.entity.ts` — comment คอลัมน์ `credit_limit` เพิ่ม "เสมอเป็น THB ไม่ผูกกับ billing_currency"
  · แก้ class docblock ที่ยังเขียนผิดว่า "NOT YET ENFORCED ANYWHERE" ทั้งที่บังคับใช้จริงมาตั้งแต่
  2026-08-30 (M8) — เจอระหว่างอ่านโค้ดเพื่อยืนยันเรื่อง currency
- `sales-order.entity.ts` / `delivery-note.entity.ts` — comment คอลัมน์ `credit_limit_snapshot` เพิ่ม
  ข้อความเดียวกัน (`credit_exposure_snapshot` อ้างอิงกลับไปที่ comment ของ `credit_limit_snapshot`
  อยู่แล้ว ไม่ต้องแก้ซ้ำ)
- migration `1788363515188-DocumentCreditLimitAlwaysThb.ts` — **รันแล้ว** บน `erp_sales` เป็น
  `COMMENT ON COLUMN` ล้วน 3 คำสั่ง ไม่มี data/schema risk เลย (`migration:generate:sales` ยืนยัน
  `No changes` หลังรัน)
- `srs-p4.html` — เพิ่ม paragraph "เพดานและยอดใช้วงเงินเป็น THB เสมอ — platform standard" ต่อท้าย
  rulebox `RULE · CREDIT LIMIT` เดิม (ไม่ทำ rulebox ใหม่แยก เพราะเป็นเรื่องเดียวกัน) อ้างอิงกลับไปที่
  `RULE · CURRENCY เป็น ENUM ระดับ DB` ใน srs-p5.html
- `api-workflow-guide.html` — เพิ่มบรรทัดเดียวกันในรูลบอกซ์ FE-facing (B2 · แปลงเป็นใบสั่งขาย) —
  **เจอบั๊กเอกสารจริงข้างๆ กันระหว่างแก้**: บรรทัดเดิมเขียนว่า "finance-bc ไม่ตอบ RPC = **ปล่อยผ่าน**
  ไม่บล็อกการขาย" ซึ่ง**ตรงข้ามกับโค้ดจริง** — `evaluateCredit()` ให้ `PENDING_APPROVAL` (hold) เมื่อ
  finance-bc ไม่ตอบ ไม่ใช่ปล่อยผ่าน (ตรงกับที่ srs-p4.html เขียนถูกอยู่แล้ว) แก้ให้ตรงกันในคราวเดียว
  เพราะเป็นย่อหน้าเดียวกับที่กำลังแก้อยู่แล้ว

**render-check ผ่านทั้งคู่** (mermaid 0 error, เนื้อหาใหม่ปรากฏจริง)

**ตรวจแล้ว**: 1500/1500 test ผ่าน (ไม่เพิ่ม/ไม่ลด — ไม่มี logic เปลี่ยน) · eslint 0/0 ทั้ง repo
(รวม migration file ที่ต้อง `--fix` ให้ตรง prettier/`explicit-member-accessibility` ก่อน) ·
`nest start sales-bc` build จริงผ่าน ไม่มี error · `migration:run:sales` สำเร็จบน DB จริง (dev/prod
ใช้ร่วมกัน — ดู §4 #10) แล้ว verify `migration:generate:sales` = `No changes` อีกครั้ง

---

### P4 #12 · unrealised FX (TFRS 21) — period-end retranslation ✅ **เสร็จแล้ว 2026-09-03**

การตีราคา AR/AP ต่างสกุลที่ยังเปิดอยู่ ณ วันปิดงวดใหม่ — ครึ่งที่ C3 (realised FX ตอนตัดชำระ) จงใจ
เว้นไว้เพราะเป็น period-end adjustment ของทั้ง ledger ไม่ใช่ผลของเอกสารใบใดใบหนึ่ง ผู้ใช้ยืนยัน 4
ทางเลือกออกแบบก่อนเริ่ม (ทั้งหมดเป็นตัวเลือกที่แนะนำ):

- **ตัวขับ**: ผูกกับ `POST /finance-settings/close-period` — ปิดงวดแล้วต้องตีราคาเสมอ ไม่มี endpoint
  แยกที่ปิดงวดโดยไม่ตีราคา (กันไม่ให้ operator ลืมตีราคาบางงวด)
- **อัตราปิดงวด**: ผู้ใช้กรอกเองต่อสกุลเงิน (`closing_rates: [{currency, rate}]`) เหมือนที่ผู้ใช้กรอก
  อัตราจริงตอนตัดชำระใน C3 — ไม่ lookup จากที่ไหน
- **บัญชี GL**: แยกบัญชีใหม่ `4301`/`5301` (unrealised gain/loss) ไม่ reuse `4300`/`5300` ของ
  realised — เพราะเป็นตัวเลขประมาณการที่จะถูกกลับทั้งหมดที่ต้นงวดถัดไป ผสมกับกำไร/ขาดทุนจริงจะทำให้
  งบไม่สะท้อนว่าส่วนไหนคือเงินสดจริง
- **การกลับรายการ**: auto-reverse ทั้ง run ก่อนหน้าที่ยัง `POSTED` ณ ต้นงวดถัดไป (ก่อนตีราคารอบใหม่
  เสมอ) แล้วคำนวณสดจากอัตราที่เอกสารบันทึกไว้จริง — ไม่ต่อยอดจากอัตราปิดงวดคราวก่อน (ถูกต้องเพราะ
  ledger ถูกกลับกลับไปที่มูลค่าตามบัญชีเดิมก่อนคำนวณรอบใหม่เสมอ)

**สถาปัตยกรรม — โมดูลใหม่ `fx-revaluation`** (`apps/finance-bc/src/modules/fx-revaluation/`):
- `FxRevaluation`/`FxRevaluationLine` (header+line, ตาม pattern `SubmittableDocumentEntity`/
  `DocumentLineItemEntity`) + `FxRevaluationNumberCounter` (`FXR-{YYYY}-{00001}`)
- `FxRevaluationsService.closePeriodWithRevaluation()` — ทำทั้งหมดใน 1 transaction: reverse run
  เก่า → หา open exposure (`ReceiptsService.findOpenForeignCurrencyReceipts()` /
  `APInvoicesService.findOpenForeignCurrencyInvoices()`, เมธอดใหม่ทั้งคู่) → เช็ค `closing_rates`
  ครบทุกสกุล (ไม่ครบ = 400 ระบุชื่อสกุลที่ขาด) → โพสต์ 1 journal ต่อ 1 เอกสาร (ไม่ใช่ 1 journal ต่อ
  ทั้ง run — `ref_doc_id` ของแต่ละบรรทัดคือ `fx_revaluation_lines.id` ของตัวเอง กัน `reverse()` ปน
  กับ issue/cancel ของเอกสารต้นทาง) → `FinanceSettingsService.applyPeriodLock()` เลื่อนล็อก
- **ทำไมไม่ใส่ไว้ใน `FinanceSettingModule`**: `FinanceSettingModule` ต้อง "depend on nothing else"
  เพราะ `GeneralLedgerModule` import กลับมาแล้ว — ถ้าให้ `FinanceSettingsService` เรียกกลับหา
  `FxRevaluationsService` จะกลายเป็น cycle (`FinanceSettingModule → FxRevaluationModule →
  GeneralLedgerModule → FinanceSettingModule`) แก้ด้วยการย้าย route `POST
  /finance-settings/close-period` เองไปอยู่ใน `fx-revaluation` module แทน (`ClosePeriodController`,
  ยังคง mount ที่ `finance-settings` เหมือนเดิม) — ตรงกับแพทเทิร์น "reconsider where the route
  lives" ใน root CLAUDE.md (เหมือน `ReorderLevelsController`) · `FinanceSettingsService` ได้เมธอด
  ใหม่ `applyPeriodLock(upto, manager, currentUser)` ให้ orchestrator เรียกกลับแทน `closePeriod()`
  เดิม (ลบทิ้ง)
- debit/credit ของบรรทัดควบคุม (AR/AP) คิดตามฝั่งบัญชี ไม่ใช่ทิศทางอัตราเฉยๆ — AR (debit-normal)
  มูลค่าขึ้น = debit เพิ่ม = กำไร, AP (credit-normal) มูลค่าขึ้น = credit เพิ่ม = ขาดทุน (ตรวจมือครบ
  4 combination: AR gain/loss, AP gain/loss)
- `resolveUnrealisedFxDifference()` ใหม่ใน `currency.util.ts` — คู่กับ `resolveRealisedFxDifference()`
  เดิมของ C3 แต่เทียบ valuation 2 จุดของ**ยอดที่ยังไม่ตัดชำระ** แทนยอดที่ตัดชำระจริง

**migration** `1788394702124-AddFxRevaluation.ts` (`erp_finance`) — สร้าง 3 ตารางใหม่
(`fx_revaluations`/`fx_revaluation_lines`/`fx_revaluation_number_counters`) + widen
`ledger_entries.account` (+`4301`/`5301`) และ `.voucher_type` (+`FX_REVALUATION`) ด้วย
enum-widen pattern ปลอดภัย (rename→create→`ALTER COLUMN...USING`→drop เดิม ไม่ใช่ DROP+ADD
COLUMN) — **รันแล้วบน DB จริง** (dev/prod ใช้ร่วมกัน — ดู §4 #10) แล้ว verify
`migration:generate:finance` = `No changes`

**เทสต์ที่เพิ่ม**: `resolveUnrealisedFxDifference` ใน `currency.util.spec.ts` (4) ·
`fx-revaluations.service.spec.ts` ใหม่ทั้งไฟล์ (12 — ครอบ missing-rate rejection, reversal-then-post
ordering, debit/credit ครบ 4 combination, zero-fx-amount filtering, no-exposure-skips-run) ·
`findOpenForeignCurrencyReceipts`/`findOpenForeignCurrencyInvoices` ใน spec เดิมของ
receipts/ap-invoices (9 รวมกัน) — พบและแก้ spec เก่าที่ค้าง (`finance-settings.service.spec.ts`
เทสต์ `closePeriod` เดิมที่ถูกลบไปแล้ว ต้องแก้เป็น `applyPeriodLock`)

**เอกสาร**: `srs-p5.html` — rulebox ใหม่ `RULE · UNREALISED FX (TFRS 21)` + แก้ rulebox
`MULTI-CURRENCY SETTLEMENT & REALISED FX` เดิมที่เคยเขียนว่า "ยังไม่ทำ" ให้ชี้มาที่ rulebox ใหม่ ·
`api-workflow-guide.html` (C6) — เพิ่ม `closing_rates` ใน request body, endpoint
`GET /fx-revaluations(/:id)` ใหม่, rulebox อธิบาย flow auto-reverse-then-revalue — render-check
(tag-balance) ผ่านทั้งคู่

**permission ใหม่**: `fx_revaluation:view` — sync เข้า `erp_iam` แล้วผ่าน `npm run permissions:sync`
(scan เจอ 1 permission ใหม่ตรงตามคาด ไม่มีอะไรหลุด/เปลี่ยนโดยไม่ตั้งใจ)

**บั๊กที่เจอตอน E2E บน production (แก้แล้ว)**: `permissions:sync` sync เข้า catalog อย่างเดียว
ไม่เคย grant ให้ policy ไหนใช้ได้จริง (ตรงกับที่ root `CLAUDE.md` เขียนเตือนไว้อยู่แล้วว่า "ยังต้องมี
grant migration แยก") — ตอนแรกลืมเขียน migration นี้ ทำให้แม้แต่ `superadmin` เองก็โดน
`403 Missing required permission: fx_revaluation:view` จริงบน production ตอนยิง
`GET /fx-revaluations` ทดสอบ (ส่วน `period:*` ไม่กระทบเพราะ grant ไว้แล้วตั้งแต่รอบก่อน) · แก้ด้วย
migration `1788419843315-GrantFxRevaluationPermissionsToMockPolicies.ts` (`erp_iam`, mirror
`GrantPeriodPermissionsToMockPolicies`) — **รันแล้วบน DB จริง** ยืนยันด้วยการ login ใหม่ (JWT
permissions resolve ตอน login เท่านั้น ต้องได้ token ใหม่ถึงจะเห็นสิทธิ์ใหม่) แล้วยิง
`GET /fx-revaluations` ซ้ำ ได้ `200` list ว่าง (ถูกต้อง — ยังไม่มีใครปิดงวดจริงเลย)

**ตรวจแล้ว**: 1525/1525 test ผ่าน (จากเดิม 1500 — เพิ่ม test ใหม่ทั้งหมด 25 ไม่มีของเดิมหาย) ·
eslint 0/0 ทั้ง repo (รวม migration/spec ใหม่ที่ต้อง `--fix` ก่อน) · `nx build finance-bc` /
`nx serve finance-bc` build+boot จริงผ่าน ไม่มี error ต่อ DB จริงหลัง migrate ·
**E2E บน production จริง (`erp-api.iotechsoft.com`)**: `GET /fx-revaluations` /
`GET /finance-settings` / `POST /finance-settings/close-period` ตอบ `401` ตอนไม่ auth (ยืนยัน
routing/deploy จริง) → login จริงด้วย superadmin → `GET /finance-settings` ได้ `200` ข้อมูลจริง →
`GET /fx-revaluations` เจอ `403` ตามบั๊กด้านบน → แก้แล้วได้ `200` list ว่างถูกต้อง ·
**ไม่ได้ยิง `POST /finance-settings/close-period` จริงบน production** — เป็น one-way ratchet ที่ปิด
งวดบัญชีจริง จึงหยุดแค่ยืนยัน routing/auth (401) ไม่ทำ state-changing test บนข้อมูลจริง ·
`migration:run:finance` สำเร็จบน DB จริงแล้ว verify `migration:generate:finance` = `No changes`

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

### P2#5 + #6 + #7 · ปิด P2 audit ครบ ✅ **เสร็จแล้ว 2026-09-02** (commit + push + deploy + E2E แล้ว)

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
| ~~**`npm run seed --fresh` ตรวจซ้ำ**~~ | ✅ **ตรวจแล้ว 2026-09-03 — `truncates:` ครบ ไม่ต้องแก้โค้ด** · ดู §"seed — ตรวจซ้ำ" ด้านล่าง (ส่วน `--fresh --yes` บน scratch DB **ผู้ใช้ตัดสินใจข้าม** เพราะคุ้มค่าน้อยเทียบกับความเสี่ยง — DB ที่ seed ชี้ไปเป็นเซิร์ฟเวอร์ LAN ที่ dev/prod ใช้ร่วมกัน) |
| **`system-settings-bc`** | ผู้ใช้เคยถามว่าควรมีไหม · คำตอบที่ให้ไว้: **ไม่ควร** เพราะ settings ถูกอ่านในทรานแซกชันที่บังคับใช้มัน (`assertPeriodOpen` อยู่ใน GL posting) ย้ายออกแล้วต้องมี cache และ cache ที่ค้างจะปล่อยเอกสารเข้างวดที่ปิดแล้ว · "settings" ไม่ใช่ bounded context · หน้า iam System Settings เป็น **UI aggregator** ซึ่งแก้ปัญหา "ที่เดียว" ได้แล้ว · **ผู้ใช้ยังไม่ได้ยืนยันว่าเห็นด้วย** — ถ้าเปิด session ใหม่แล้วสั่งทำ ให้ทำตามที่สั่ง |
| ~~**audit log กลาง**~~ | ✅ **ขอบเขต "เริ่มเล็ก" เสร็จแล้ว 2026-09-03** — ดู §"audit log กลาง" ด้านล่าง (ขอบเขตใหญ่กว่านี้ — pattern กลาง/audit-bc ใหม่ — ยังไม่ได้ทำ ถ้าต้องการค่อยคุยรอบหน้า) |
| **DEBIT_NOTE ฝั่งซื้อ** | ✅ **ทบทวนอีกรอบแล้ว 2026-09-03 — ยืนยันจงใจไม่ทำ** ดู §"DEBIT_NOTE ฝั่งซื้อ" ด้านล่าง (เจอ+แก้ error message ที่โกหกผู้ใช้ระหว่างทาง) |

---

### บั๊กที่แก้ระหว่างทาง (ก่อนเข้า #8/DEBIT_NOTE) ✅ **เสร็จแล้ว 2026-09-03**

สำรวจโค้ดจริงด้วย agent คู่ขนาน 2 ตัว (billing_notes ข้ามสกุล / DEBIT_NOTE ฝั่งซื้อ) ก่อนตัดสินใจ —
ระหว่างทางเจอบั๊กจริง 1 ตัวกับ comment/error message ที่เป็นเท็จอีก 2 จุด แก้ทั้งหมดก่อนเริ่ม implement
ตามคำแนะนำ:

1. **บั๊กจริง — `APInvoicesService.update()` ตรวจ credit note ผิดเพดาน** — `update()` เรียก
   `buildValidatedLines()` โดยไม่ส่ง `isCreditNote` (ดีฟอลต์ `false`) และไม่เรียก
   `assertCreditNoteBounds()` เลย ทำให้การแก้บรรทัดของใบลดหนี้สถานะ DRAFT ถูกตรวจด้วยเพดาน
   "ยังไม่ถูกตั้งหนี้" ซึ่งเป็นเพดานผิดตัวสำหรับใบลดหนี้ (docblock ของ parameter เขียนไว้ชัดว่าเพดานนี้
   "วัดผิด" สำหรับ CN) — **ยืนยันด้วยการรัน test จริงกับโค้ดก่อนแก้ (ผ่าน git stash) แล้วเห็น fail
   ทั้ง 3 เคสตามคาด** ก่อน apply fix จริง · แก้ที่ `apps/finance-bc/src/modules/ap-invoice/services/ap-invoices.service.ts`
   (`update()`) + เทสต์ใหม่ 3 เคสใน `ap-invoices.service.spec.ts`
2. **comment เป็นเท็จ 2 จุดบน `ap-invoice.entity.ts`** — `document_type` เคยเขียนว่า "ปัจจุบันมีค่าเดียว
   VENDOR_BILL" และ `reference_ap_invoice_id` เคยเขียนว่า "ยังไม่ใช้งานจริง" ทั้งคู่เป็นเท็จตั้งแต่ CN
   ขึ้นระบบ — แก้ comment + migration `1788436772842-FixApInvoiceDocumentTypeComments.ts`
   (`COMMENT ON COLUMN` ล้วน, hand-trim DROP/ADD CONSTRAINT ที่ generator แถมมาแบบไม่จำเป็นออก) —
   **รันแล้วบน DB จริง** verify `migration:generate:finance` = `No changes`
3. **error message สัญญาเกินจริง** — `GeneralLedgerService.assertPeriodOpen()` บอกผู้ใช้ว่า "แก้ด้วย
   ใบลด/เพิ่มหนี้ในงวดปัจจุบัน" ทั้งที่ฝั่งซื้อไม่มี DEBIT_NOTE เลย แก้ข้อความให้บอกตรงกับความจริง
   ("credit note, or a debit note where that document type offers one")

**ตรวจแล้ว**: 1530/1530 test ผ่าน (จากเดิม 1528 — ไม่มีของเดิมหาย) · eslint 0/0 ทั้ง repo ·
`nx build finance-bc` ผ่าน 2 รอบ (ก่อน/หลังเพิ่ม test)

---

### #8 · billing_notes ข้ามสกุล — ตัดสินใจแล้ว ✅ **2026-09-03**

สำรวจโค้ดจริงก่อนตัดสินใจ (agent แยกต่างหาก) พบข้อเท็จจริงที่ทำให้ปัญหาเบาลงมากจากที่บันทึกไว้เดิม:
**ใบวางบิลยังไม่มีทางพิมพ์เลยในระบบวันนี้** (ค้นทั้ง report-bc ไม่เจอ template/DTO ของ BN แม้แต่ตัวเดียว)
และ**ใบวางบิลไม่ลงบัญชีเลย** (ตั้งใจ) จึงไม่มีทางทำให้ ledger/AR ผิดได้ — สถานการณ์ "ลูกค้าเห็นยอด THB
ก้อนเดียว" ที่ #8 บรรยายไว้ยังเกิดขึ้นไม่ได้ผ่าน code path ใดในระบบเลย

**ตัวเลือกที่พิจารณา**: (A) บังคับสกุลเดียวกันทั้งใบ + เก็บ `currency`/`raw_total` [เข้มกว่านโยบายที่
srs เขียนไว้เอง และเข้มกว่า aging ที่รวมข้ามสกุลอยู่แล้ว] · (B) รวมได้แต่แยกยอดย่อยต่อสกุลบนเอกสาร/
ใบพิมพ์ [~2.5–3 เท่าของ A ต้นทุนส่วนใหญ่อยู่ที่ report-bc ซึ่งยังพิมพ์ BN ไม่ได้เลย] · **(C+) เลือกแล้ว**
เก็บพฤติกรรมเดิม (รวมข้ามสกุลได้ ผลรวมเป็น THB) + เอกสาร + surface ข้อมูลให้ครบ + เตือนเมื่อคร่อมสกุล

**สิ่งที่ทำจริง (ไม่มี migration, ไม่แตะ schema)**:
- `BillingNote` entity docblock — อธิบายว่าทำไมไม่ implement `ICurrencySnapshot` และทำไมรวมข้ามสกุลได้
  ปลอดภัย (ไม่เคยแตะฝั่ง `raw_*` เลย ต่างจากการตัดชำระที่ต้องห้าม)
- `BILLING_NOTE_ALLOWED_RELATIONS` เพิ่ม `'invoices.receipt'` — client ขอ
  `?relations=invoices.receipt` เพื่อดู `currency` ของแต่ละใบที่รวมได้ · `BillingNoteInvoiceResponseDTO`
  เพิ่ม `receipt?: { currency }` (optional, มีเมื่อขอ relation นี้เท่านั้น)
- `BillingNotesService.buildLines()` เพิ่ม `warnIfCurrenciesMixed()` — เมื่อใบที่รวมมีมากกว่า 1 สกุล
  log warning + `addRequestWarning({ code: 'BILLING_NOTE_MIXED_CURRENCY', detail })` (แพทเทิร์นเดียวกับ
  `PARTY_CURRENCY_MISMATCH`) — **ไม่ reject** สร้าง/ออกใบได้ปกติ
- เอกสาร: `srs-p5.html` — rulebox ใหม่ `RULE · ใบวางบิลรวมข้ามสกุลได้` ต่อจาก `RULE · UNREALISED FX`
  · `api-workflow-guide.html` (C3) — เพิ่ม rulebox FE-facing อธิบาย `meta.warnings` code ใหม่ +
  `?relations=invoices.receipt`

**เงื่อนไขที่ควรยก Option A ขึ้นมาทำจริง**: เมื่อเริ่มทำใบพิมพ์ใบวางบิลจริง หรือเริ่มมีหน้า FE ให้ผู้ใช้
สร้าง BN เอง — อันไหนมาก่อน ตอนนั้นแนะนำให้ทำแบบ**ไม่ต้องมี `currency_rate`** (ยอด raw ไม่กำกวมอยู่แล้ว
บวกกันตรงๆ ได้, ยอด THB คือยอดที่รับรู้ไปแล้วห้ามตีราคาใหม่) ซึ่งทำให้คำถามเดิมที่เคยค้าง ("เอาอัตราไหน
มาใช้") หายไปเอง

**ตรวจแล้ว**: 14/14 test ผ่านในโมดูล (เพิ่ม 2 เคสใหม่: ไม่เตือนเมื่อสกุลเดียว, เตือนแต่ยังสร้างได้เมื่อ
คร่อมสกุล) · eslint 0/0 · `nx build finance-bc` + boot จริงผ่าน (route `/billing-notes/*` ครบ)

---

### DEBIT_NOTE ฝั่งซื้อ — ทบทวนอีกรอบ ✅ **ยืนยันจงใจไม่ทำ 2026-09-03**

สำรวจโค้ดจริงก่อนตัดสินใจ (agent แยกต่างหาก) — เหตุผลเดิมใน docblock ของ `APInvoiceDocumentType`
ยังยืนอยู่และแข็งกว่าที่บันทึกไว้: เคสกลับข้าง (ผู้ขายเก็บเงินน้อยไปแล้วมาเก็บเพิ่ม) ไม่ถูกจำกัดด้วย
จำนวนบนใบเดิมหรือของที่เคลื่อนจริง เพราะมักเป็นการแก้ราคา จึงต้องมีเพดานของตัวเอง — ความไม่สมมาตร
ซื้อ↔ขาย (ฝั่งขายมี DEBIT_NOTE ฝั่งซื้อไม่มี) มีเอกสารรองรับใน srs-p5.html/api-workflow-guide.html
ทั้งคู่ ไม่ใช่ของที่หลุด

**ตัวบล็อกจริงคือบัญชี ไม่ใช่โค้ด**: GL ฝั่ง AP รองรับทิศทางที่ต้องใช้อยู่แล้ว (Dr สินค้าคงเหลือ/Dr
ภาษีซื้อ/Cr เจ้าหนี้ — path เดิมของ VENDOR_BILL) แต่สินค้าคงเหลือเป็น FIFO ต่อล็อตและต้นทุน snapshot
ไว้ตอนรับเข้า — ใบเพิ่มหนี้ที่มาถึงหลังของถูกขายไปแล้วจะ Dr สินค้าคงเหลือของสต็อกที่ไม่มีอยู่แล้ว
ยอดคงเหลือเพี้ยนถาวรและต้นทุนส่วนนั้นไม่มีทางไปถึง COGS ได้เลย (finance-bc แก้ `lots.import_cost`
ย้อนหลังไม่ได้ ข้าม BC และล็อตถูกใช้ไปแล้ว) — ต้องมี**บัญชีผลต่างราคาซื้อตัวใหม่ (5xxx)** ซึ่งเป็น
**การตัดสินใจผังบัญชี ไม่ใช่การเขียนโค้ด** และไม่มีคำตอบอยู่ที่ไหนในระบบเลย

**ตัวขับที่เจอจริง 1 อย่าง แต่คนละเรื่องกับที่ docblock พูด**: ตอนโพสต์ GL เข้างวดที่ปิดแล้ว ระบบขึ้น
ข้อความให้ "แก้ด้วยใบลด/เพิ่มหนี้ในงวดปัจจุบัน" — ฝั่งขายทำได้ทั้งสองครึ่ง ฝั่งซื้อทำได้แค่ครึ่งลดหนี้
เท่านั้น การแก้ฝั่งซื้อที่ต้อง**เพิ่ม**หนี้ในงวดที่ปิดแล้ววันนี้ไม่มีทางออกที่ถูกกฎเลย — แต่ตัวขับนี้
ต้องการใบเพิ่มหนี้เพื่อ**แก้งวด** ซึ่งเพดานที่เหมาะจะคนละแบบกับใบเพิ่มหนี้เพื่อ**แก้ราคา** ที่ docblock
พูดถึง ไม่ควรรวมเป็นงานเดียวถ้าจะทำ

**ค้นทั้ง repo แล้วไม่มีตัวขับอื่นเลย** — ไม่มี TODO ไม่มี FIXME และยังไม่มีรายงาน ภ.พ.30 อยู่เลย (P6
ยังไม่ได้ทำ) จึงไม่มีปลายทางที่จะพังหรือได้ประโยชน์จากการมี DEBIT_NOTE ฝั่งซื้อตอนนี้

**สิ่งที่ทำจริง**: แก้ error message ที่ `general-ledger.service.ts:188` (ดู §"บั๊กที่แก้ระหว่างทาง"
ด้านบน ข้อ 3) — เลิกสัญญาว่าฝั่งซื้อมี debit note · เอกสารเหตุผล/บั๊กช่องว่างงวดปิดบันทึกไว้ในหัวข้อนี้
ของ HANDOFF แล้ว (ไม่ต้องมี rulebox แยกใน srs-p5.html เพราะ docblock เดิมยังตรงและไม่มีอะไรเปลี่ยน)

**ถ้าจะทำ A ในอนาคต** ลำดับที่ถูกคือ (1) ตัดสินใจบัญชีผลต่างราคาซื้อ → (2) ตัดสินใจว่าบรรทัดที่ไม่มี
จำนวนหน้าตาแบบไหน (ทุกบรรทัด AP วันนี้ผูกกับ `grn_item_id` เสมอ) → (3) เลือกเพดาน — **ราคา PO เป็น
เพดานที่แนะนำ** เพราะเป็นราคาที่ตกลงกันไว้จริง และ RPC ที่ต้องใช้มีอยู่แล้ว
(`PurchaseOrderResources.GetPurchaseOrderById` คืน PO พร้อม `items.unit_cost` ครบ ไม่ต้องเพิ่ม RPC
ใหม่ฝั่ง supplier-bc แค่เพิ่ม proxy service ใหม่ฝั่ง finance-bc)

---

### seed — ตรวจซ้ำ ✅ **เสร็จแล้ว 2026-09-03 (ไม่ต้องแก้โค้ดเลย)**

งานนี้ค้างมาหลาย session เพราะกลัวว่า `truncates:` ในแต่ละ seeder จะไม่ครบหลังเพิ่มตารางใหม่
— ตรวจแล้ว **ครบทุกตัว ไม่มีอะไรต้องแก้** แยกเป็น 3 ส่วน:

1. **`truncates:` ครบ (static audit — ไม่แตะ DB)** — เทียบตารางที่ seeder แต่ละตัว *เขียน* กับที่
   *ประกาศ* ใน `truncates:` ตรงกันทั้ง 15 ตัว รวม 2 ตัวที่เขียนหลายตาราง
   (`item-attributes` → `item_attribute_values`+`item_attributes`, `products` →
   `item_variant_attributes`+`products`) ซึ่งเรียง child→parent ถูกต้องด้วย
2. **ตารางใหม่ไม่ทำให้พัง เพราะกลไกไม่ได้พึ่ง `truncates:` อยู่แล้ว** — `findExternalDependents()`
   ใน `seed-runner.ts` **ค้น FK จาก `pg_constraint` ตอน runtime** แล้ว **ปฏิเสธ (throw)** ถ้าตาราง
   นอกชุด seed มีแถวอ้างอิงอยู่ · ตารางธุรกรรมใหม่ (`sales_return_receipts`, `purchase_returns`, …)
   จึงถูกจับได้เองโดยไม่ต้องมาเติม `truncates:` มือ — ที่ต้อง maintain มือคือ *ตารางที่ seeder
   เขียนเอง* เท่านั้น (ข้อ 1)
3. **`npm run seed -- --dry-run` → 15/15 seeders ok** กับ schema จริงตอนนี้ (ปลอดภัย: seeder เช็ค
   `context.is_dry_run` แล้ว `continue` ก่อนเขียน และ runner ไม่ truncate เมื่อ dry-run) ·
   `settings` singleton (`stock_settings`, `supplier_settings`) จงใจไม่ seed เพราะสร้างเองผ่าน
   `getOrCreate()` · `uoms` มาจาก migration `SeedInventoryUoms` และ `resolveUomIds()` throw
   พร้อมข้อความชี้ migration ให้เลยถ้าขาด

**สิ่งเดียวที่เจอและแก้**: doc drift — README ของ seed ลิสต์ seeder แค่ 14 ตัว (ตกตาราง
`barcodes` ที่เป็นตัวที่ 15) และ root `CLAUDE.md` ยังเขียน 13 ตัว · แก้ทั้งคู่ให้ตรงกับ
`SEEDERS[]` จริง (commit `aa4cdec`) ยืนยันด้วย `npm run seed -- --list`

**ส่วนที่ข้าม (ผู้ใช้ตัดสินใจ)**: `--fresh --yes` บน scratch DB — ต้องสร้าง DB ใหม่บนเซิร์ฟเวอร์
LAN ที่ dev/prod ใช้ร่วมกัน (`172.16.0.x`) และถ้า env override พลาดจะ TRUNCATE master data จริง
ทั้งที่ได้ค่าเพิ่มแค่การพิสูจน์ลำดับ TRUNCATE บน DB ว่างเปล่า ซึ่งข้อ 2 มี safety net คุมอยู่แล้ว

---

### audit log กลาง — ขอบเขต "เริ่มเล็ก" ✅ **เสร็จแล้ว 2026-09-03**

ถามผู้ใช้ก่อนเริ่มว่าขอบเขตแบบไหน (3 ตัวเลือก: เริ่มเล็ก / กลาง-ใช้ pattern ร่วม / ใหญ่-audit-bc
ใหม่) — เลือก **เริ่มเล็ก**: แค่เปิดหน้า UI + API ให้ 2 ตารางที่มีอยู่แล้ว
(`role_policy_audit_logs`, `user_role_audit_logs` — เขียนมาตั้งแต่ก่อนหน้านี้แต่ไม่เคยมีใครอ่านได้
เลย) ไม่แตะ schema ไม่สร้าง BC ใหม่ ไม่ทำ pattern กลางข้าม BC

**Backend (iam-bc) — 2 resource read-only ใหม่ ในโมดูลที่มี repository อยู่แล้ว:**
- `RolePolicyAuditLogsService`/`RolePolicyAuditLogsController` (`GET /role-policy-audit-logs`,
  permission `role_policy_audit_log:view`) เพิ่มเข้า `RolesModule` ที่มีเดิม
- `UserRoleAuditLogsService`/`UserRoleAuditLogsController` (`GET /user-role-audit-logs`,
  permission `user_role_audit_log:view`) เพิ่มเข้า `UsersModule` ที่มีเดิม
- ทั้งคู่ตาม pattern `LedgerEntriesController`/`LoginHistoriesController` — read-only, มีแค่
  `findPaginated` ไม่มี `findOne` (ไม่มีอะไรน่า deep-link ไปดูทีละแถว), DTO create/update ว่างเปล่า
  (`BaseServiceOperations` ต้องการ type param แม้จะไม่มี route จริง)
- **บั๊กที่เจอจาก real boot check** (jest ผ่านแต่ build จริง fail): `RolePolicyAuditAction`/
  `UserRoleAuditAction` เป็น `type` alias ใช้เป็น property type บน response DTO ที่มี
  `emitDecoratorMetadata` — ต้อง `import type` ไม่งั้น TS1272 ("A type referenced in a decorated
  signature must be imported with 'import type'")

**Admin Console (iam-bc EJS) — เพิ่มเข้าหน้า `Audit Logs` เดิมแทนที่จะแยกหน้าใหม่:**
หน้าเดิม (`/views/audit-logs`) โชว์แค่ `login_histories` (auth-bc) ทั้งที่ตั้งชื่อ "Audit Logs"
มาตลอด — เปลี่ยนเป็น 3 แท็บด้วย `.um-page-tabs` (component เดียวกับที่
`print-templates/form.ejs` ใช้แยก "รายละเอียด"/"รายงาน"): เข้าใช้งาน (login, เดิม) /
บทบาท↔Policy (ใหม่) / ผู้ใช้↔บทบาท (ใหม่) — โหลดทั้ง 3 แท็บพร้อมกันตอนเปิดหน้า (ตารางเล็ก ไม่ใช่
transactional data จึงไม่ต้อง lazy-load) แท็บสลับแค่ toggle `.hidden` ไม่ fetch ซ้ำ ·
`role_id`/`policy_id`/`user_id` โชว์เป็น raw UUID (ไม่ join หา name — เป็น field ที่ไม่มี FK จริง
โดยตั้งใจ เพื่อให้ audit trail อยู่รอดแม้ role/policy/user ต้นทางถูกลบไปแล้ว; join จริงต้องรวม
soft-deleted ด้วย `withDeleted()` — ทิ้งไว้เป็นงานต่อยอดถ้าจำเป็นจริง ไม่ทำตอนนี้เพราะเกินขอบเขต
"เริ่มเล็ก")

**permission ใหม่**: `role_policy_audit_log:view`, `user_role_audit_log:view` — sync เข้า
`erp_iam` แล้ว **และเขียน grant migration ไปพร้อมกันในรอบเดียว** (ไม่ใช่ทำทีหลังเหมือน P4 #12 —
เรียนจากบั๊กที่เจอตอน E2E ของ P4 #12 ว่า `permissions:sync` ไม่เคย grant ให้ policy ไหนใช้ได้จริง)
— `1788425651764-GrantAuditLogPermissionsToMockPolicies.ts` (`erp_iam`, mirror
`GrantPeriodPermissionsToMockPolicies`) รันแล้วบน DB จริง

**ตรวจแล้ว**: 1525/1525 test ผ่าน (ไม่เพิ่ม — ทั้งสอง resource เป็น thin wrapper รอบ
`BaseServiceOperations`/`BaseControllerOperations` เหมือน `LedgerEntriesController` ซึ่งไม่มี spec
ของตัวเองเช่นกัน) · eslint 0/0 ทั้ง repo (ts + vanilla JS หน้า admin) · `nx build iam` build จริง
ผ่าน (หลังแก้ TS1272) · เสิร์ฟหน้าจริงบน port ทดสอบแล้วเช็ค HTML ที่ render ออกมา (tag-balance ผ่าน,
element id ทั้ง 3 แท็บครบ) และ bundle.js ที่ esbuild ปั้นออกมา syntax ผ่าน `node --check` ·
`migration:run:iam` สำเร็จบน DB จริงแล้ว verify `migration:generate:iam` = `No changes`

**commit `92da11d` + push + deploy สำเร็จแล้ว** · **E2E บน production จริง
(`erp-api.iotechsoft.com`) ผ่านตั้งแต่รอบแรก** — ต่างจาก P4 #12 ที่เจอ 403 รอบแรกเพราะลืม grant
migration, รอบนี้เขียน grant migration ไปพร้อมกันตั้งแต่แรกจึงไม่เจอปัญหาเดิมซ้ำ: login จริงด้วย
superadmin → `GET /role-policy-audit-logs` ได้ `200` พร้อมข้อมูลจริง 10 แถว →
`GET /user-role-audit-logs` ได้ `200` พร้อมข้อมูลจริง 5 แถว → หน้า
`/iam/v1/views/audit-logs` โหลดได้ `200` มีทั้ง 3 แท็บ (`auditTab-login`,
`auditTab-role-policy`, `auditTab-user-role`) → `bundle.js` โหลดได้ `200`

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
# ⚠️ ใช้ 15000 ไม่ใช่ 9000 — ไฟล์ใหญ่ (srs-p4/p5 ~1MB) render ไม่ทันที่ 9000
#    แล้ว grep เนื้อหาที่เพิ่งเพิ่มจะไม่เจอ ทั้งที่ HTML ถูกต้อง (หลงคิดว่าพังได้ง่ายมาก)
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --virtual-time-budget=15000 \
  --dump-dom "file://$PWD/<file>.html" > /tmp/out.txt
grep -c 'Syntax error in text' /tmp/out.txt     # 0 = mermaid ผ่าน
grep -c '<ข้อความที่เพิ่งเพิ่ม>' /tmp/out.txt   # ยืนยันว่าเนื้อหาใหม่ render จริง
```

### บน app server (ssh app-server → ubuntu-poc, DEPLOY_DIR=/root/erp-api)

```bash
# ⚠️ pm2/node ไม่อยู่ใน PATH ของ non-interactive ssh shell ต้อง export เอง
ssh app-server 'export PATH="$HOME/.local/share/pnpm/bin:$HOME/.nvm/versions/node/v24.18.0/bin:$PATH"
  cd /root/erp-api && pm2 reload iam --update-env && pm2 describe iam'
# *_PUBLIC_URL / ค่า config อื่นอ่านตอน bootstrap → แก้ .env แล้วต้อง reload เสมอ

# .env บนเครื่องถูกเขียนทับจาก GitHub Environment secret ทุก deploy → sync ขึ้นด้วย
ssh app-server 'cat /root/erp-api/.env' | gh secret set ENV_FILE --env production  --repo iotechsoft-company/erp-api
ssh app-server 'cat /root/erp-api/.env' | gh secret set ENV_FILE --env development --repo iotechsoft-company/erp-api
# pipe ตรงแบบนี้เพื่อไม่ให้ credential โผล่ใน output · แก้ไฟล์บนเครื่องก่อน แล้วค่อย sync เสมอ

# ดูว่า deploy รอบล่าสุด scope อะไร (docs-only ควรได้ deploy=false, job ถูก skip)
gh run list --workflow=deploy.yml --limit 3
gh run view <run-id> --log | grep -oE "deploy=(true|false)|reason=[^\r]*"
```

### E2E ยิงผ่าน domain จริง

```bash
# login (username/password ไม่ใช่ email) → ได้ access_token อายุ 8 ชม.
curl -s -X POST https://erp-api.<domain>/auth/v1/auth/login \
  -H 'content-type: application/json' -d '{"username":"<user>","password":"<pass>"}'
# guard รับทั้ง `Authorization: Bearer <token>` และ cookie access_token
# mutating request แนบ x-csrf-token (ค่าจาก login response) ไปด้วยได้ ปลอดภัยกว่า
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
10. **(จาก 2026-09-02) dev บนเครื่องกับ production ใช้ Postgres ตัวเดียวกัน** — `.env` ทั้งสองฝั่งชี้ไป
    pgpool ตัวเดียวกัน · แปลว่า `npm run migration:run:<bc>` ที่รันตอน implement **ลง production ไปแล้ว**
    ตั้งแต่ตอนนั้น ไม่ใช่ตอน deploy · deploy จึงรายงาน `No migrations are pending` ซึ่ง**ถูกต้อง ไม่ใช่บั๊ก** ·
    ผลข้างเคียงที่ต้องระวัง: migration ที่ยังไม่อยากให้ขึ้น prod ห้ามรัน local, และการ query ตรวจข้อมูล
    ก็คือการแตะข้อมูลจริง — ทดสอบอะไรให้ cleanup ทุกครั้ง
11. **(จาก 2026-09-02) `.env` บนเครื่องถูกเขียนทับทุก deploy** จาก GitHub Environment secret `ENV_FILE`
    (step "Sync .env from GitHub Environment secret" ใน `deploy.yml`) — แก้ไฟล์บนเครื่องอย่างเดียว
    **หายเงียบ**ตอน deploy รอบถัดไป แล้วบั๊กกลับมาโดยไม่มีใครแตะโค้ด · อ่านค่า secret กลับไม่ได้ด้วย
    ลำดับที่ถูกจึงเป็น **แก้ `.env` บนเครื่อง → `pm2 reload` → sync ขึ้น secret ทั้ง 2 environment**
12. **(จาก 2026-09-02) route ของแต่ละ resource ไม่ได้ใช้ verb เดียวกันหมด** — `customers` update เป็น
    `PUT /customers/:id` (ไม่ใช่ `PATCH`) ขณะที่ `finance-settings` เป็น `PATCH` และ
    `sales-settings`/`supplier-settings` เป็น `PUT` · ยิงผิด verb ได้ **404 `Cannot PATCH …`** ซึ่ง
    หน้าตาเหมือน "ไม่มี resource นี้" ทั้งที่มีอยู่ — เปิด controller ดูก่อนเสมอ อย่าเดาจาก REST convention
13. **(จาก 2026-09-06, gl-accounts) `TransformInterceptor`'s bare-array branch ไม่เคยใส่ `status`
    เข้า envelope** — `createSuccessCollectionResponse()` ไม่มี default เหมือนฝั่ง paginated
    (`createPaginatedResponse` มี) จึง endpoint ไหนก็ตามที่คืน `Promise<Entity[]>` เปล่าๆ (ไม่มี
    pagination) ผ่าน `@ResourceType()` จะได้ envelope ที่ไม่มี `status.code` เลย — บั๊กแฝงอยู่ตั้งแต่
    วันแรกของ `TransformInterceptor` ไม่มี endpoint ไหนเคยคืน bare array มาก่อนจนกระทั่ง
    `GET /gl-accounts/tree` เป็นตัวแรก แก้แล้วใน `libs/common` (`transform-interceptor.util.ts`)
    พร้อม regression test 5 เคสครอบทั้ง 4 shape — ถ้าจะเขียน endpoint ใหม่ที่คืน array เปล่าๆ
    (ไม่ paginate) ตรวจ response จริงว่ามี `status` เสมอ อย่าเชื่อแค่ shape ถูก
14. **(จาก 2026-09-08, tax_configs) constraint ที่ผิดทำให้ดีไซน์ทั้งชุด "ไปไม่ถึง" ได้ โดย unit test
    เขียวหมด** — `tax_configs` มี `UNIQUE (code)` ขณะที่ service ข้างบนเขียนรองรับหลายแถวต่อ code ไว้ครบ
    (`assertNoOverlappingPeriod()` + `resolveEffectiveRate()` ที่ handle หลาย candidate) โค้ดนั้นเป็น
    dead code มาตลอดโดยไม่มีใครรู้ เพราะ**เทสที่ mock repository ไม่เคยเจอ constraint จริง** — mock ยอมให้
    "insert" แถวที่ Postgres จะตีตก ทำให้เทสยืนยันตรรกะที่รันไม่ได้จริง บทเรียน: ถ้าฟีเจอร์พึ่ง invariant
    ระดับ DB (unique/CHECK/FK/partial index) **มันต้องมี smoke ที่ยิงของจริง** ไม่ใช่แค่ unit test —
    และเวลาอ่าน service ที่มี guard ซับซ้อน ให้ไปดู migration ด้วยว่า schema อนุญาตให้ guard นั้นทำงานจริงไหม
15. **(จาก 2026-09-08) `verify --steps=smoke` ไม่ build ให้** — สตาร์ทจาก `dist/` ที่มีอยู่ route ใหม่จะได้
    `404 Cannot POST /…` และ handler ที่แก้จะรันโค้ดเก่าเงียบๆ ใช้ `--steps=build,smoke` เสมอเมื่อแตะ source
16. **(จาก 2026-09-08) smoke ที่ข้าม BC ได้ 503 ซึ่งอ่านเหมือน regression ของ BC ที่กำลังเทส** — runner
    สตาร์ทแค่ `auth`+`iam`+BC เป้าหมาย ประกาศ `needs: ['report-bc']` ในไฟล์ smoke แล้ว runner จะสตาร์ทให้
    (อย่าไปแก้ด้วยการจำ `--with=` เพราะช่วยได้แค่คนที่รู้อยู่แล้วว่าต้องใส่)

---

## 5 · ถ้าจะทำ audit ซ้ำ

วิธีที่ได้ผลรอบก่อน: หา **"คอลัมน์/ค่าที่ประกาศไว้พร้อม comment อธิบายกฎ แต่ไม่มีโค้ดไหนอ่าน"**
— เจอ pattern นี้ 6 ครั้ง (`stock_frozen_upto`, `ledger_frozen_upto`, `credit_limit`,
`credit_terms`, `is_vat_registered` ×2, `reference_ap_invoice_id`) ทุกครั้งเป็นช่องโหว่จริง

อีกวิธี: **เทียบความสมมาตรซื้อ↔ขาย** — Purchase Return มีแต่ Sales Return ไม่มี, AP บังคับ
`grn_item_id` แต่ AR ไม่บังคับ `dn_item_id`, PO มี `returned_qty` แต่ SO ไม่มี · ทุกข้อเป็นงานจริง
ทั้งหมด

ตรวจ endpoint index ในเอกสารกับ route ที่ map จริงตอน boot ก็เจอ `POST /products` ที่หายไปจาก index

---

## 6 · dependency แปลกปลอมใน `dotenv@17.4.2` ✅ **mitigate แล้ว 2026-09-02**

**ไม่เกี่ยวกับ currency/`meta.warnings` เลย** — เจอโดยบังเอิญตอนรัน `NODE_ENV=local npx jest` แล้ว
เห็น console log แปลกๆ จาก `dotenv.config()` เอง

`node_modules/dotenv/lib/main.js` (เวอร์ชัน 17.4.2 ที่ pin ไว้ใน `pnpm-lock.yaml`) มี array
`TIPS` ที่สุ่มพิมพ์ "tip" ต่อท้าย log ทุกครั้งที่ inject env — **7 ใน 8 ตัวชี้ไปโดเมนจริงของเจ้าของแพ็กเกจ
(`dotenvx.com`) หรือเป็น usage hint ธรรมดา แต่มี 1 ตัวชี้ไปโดเมนอื่นที่ไม่เข้าพวก:**

```
'⌁ auth for agents [www.vestauth.com]'
```

**ทำไมถึงน่าสงสัย**: คำว่า "auth for agents" เจาะจงกลุ่มเป้าหมายเป็น AI coding agent (Claude Code/
Copilot/Cursor ฯลฯ) ที่อ่าน terminal output — ต่างจาก 7 ตัวที่เหลือซึ่งเป็นโฆษณาผลิตภัณฑ์ของเจ้าของ
`dotenv` เอง (`dotenvx.com`) หรือ flag การใช้งานจริง คำเดียวที่ปนมาชี้ไปโดเมนที่ไม่รู้จักเลย —
รูปแบบนี้ (ปลอมปน 1 รายการอันตรายไว้ในลิสต์ที่ดูถูกต้อง 90%) เป็น pattern ทั่วไปของการโจมตี
supply-chain/prompt-injection ที่เล็งไปที่ agent โดยเฉพาะ

**ตรวจแล้วว่าไม่ใช่ของถูกแก้ในเครื่องนี้** — เทียบกับตัวจริงบน npm registry ผ่าน mirror
(`unpkg.com/dotenv@17.4.2/lib/main.js`) string เดียวกันเป๊ะ แปลว่า**เป็นของจริงที่ผู้ดูแล `dotenv`
ใส่เข้าไปเอง** ไม่ใช่ local tampering ของเครื่อง/repo นี้ — แต่ก็ยังเป็นความเสี่ยงจริง เพราะ:

- `dotenv.config()` ถูกเรียกจริงใน bootstrap path ของทุก BC (`libs/common/src/tracing.ts`,
  `libs/common/src/constants/timezone.constant.ts`) — log นี้จึงมีโอกาสโผล่ใน **production log จริง**
  ทุกครั้งที่ service restart ไม่ใช่แค่ตอนรัน test
- **ไม่ได้ไปเปิด `www.vestauth.com` เลย** ระหว่างตรวจสอบเรื่องนี้ — ยึดตามหลักไม่ทำตาม instruction
  ที่ฝังมาใน content ที่ไม่น่าเชื่อถือ

**ตรวจสอบเพิ่มเติมก่อนแก้ (ผู้ใช้ถาม "ต้อง upgrade หรือเป็น bug")**: ค้นจริงแล้วพบว่า
- **ไม่ใช่ bug/hack** — `vestauth.com` เป็นโปรดักต์จริงของ `motdotla` (เจ้าของ `dotenv`/`dotenvx`) เอง
  เป็น auth-for-agents ตัวใหม่ของเขา ไม่ใช่ third-party ที่แฝงเข้ามา
- **มี community backlash จริง** — GitHub issues #899/#900/#903/#904 ใน `motdotla/dotenv` บ่นเรื่อง
  โฆษณาที่ไม่ได้ขอ, พิมพ์ลง stdout ทำ pipe เสีย, ไม่มีปุ่มปิดเฉพาะโฆษณา
- **เจ้าของลบฟีเจอร์นี้ออกจาก GitHub `master` แล้ว** (ตรวจตรงๆ ว่า `main.js` บน master ไม่มี `TIPS`
  array แล้ว) **แต่ยังไม่ publish ขึ้น npm** — `npm view dotenv dist-tags` ยืนยันสดๆ ว่า `latest`
  ยังเป็น `17.4.2` (ตัวที่มีปัญหา) ดังนั้น **"upgrade" ใช้ไม่ได้ตอนนี้** เพราะไม่มีเวอร์ชันใหม่กว่าให้ไป

**Mitigation ที่ใช้จริง — `DOTENV_CONFIG_QUIET=true`** ตั้งไว้ 2 จุด (ทั้งคู่จำเป็น ไม่ใช่ซ้ำซ้อน):
- `libs/common/src/tracing.ts` — ก่อนบรรทัด `loadEnvFile()` **จุดนี้คือจุดจริงที่ต้องแก้** เพราะ
  `tracing.ts` เรียก `dotenv.config()` เอง **ก่อน** `ConfigModule.forRoot()` จะมีโอกาสรันด้วยซ้ำ (ตาม
  docblock เดิมของไฟล์เอง "This file runs before ConfigModule.forRoot(...) ever gets a chance") —
  ครอบคลุม boot จริงของทุก BC (`main.ts` → `bootstrap.util.ts` → `tracing.ts` เป็น import แรกสุด)
- `libs/config/src/config.module.ts` — ก่อน `NestConfigModule.forRoot(...)` ครอบคลุมโค้ดที่ import
  `ConfigModule` ตรงๆ โดยไม่ผ่าน app bootstrap เลย (migration/seed/permission-sync CLI script)

**⚠️ กับดักที่เจอตอนแก้ (บันทึกไว้กันคนถัดไปเสียเวลาซ้ำ)**: ลองใส่แค่ใน `config.module.ts` ก่อน ผ่าน
jest ทุกตัว (log หายจริง) **แต่ boot จริงผ่าน `nest start` ยัง log tip อยู่เหมือนเดิม** — เพราะ
`tracing.ts` ถูก import และรัน `dotenv.config()` ของตัวเอง **ก่อน** Nest จะโหลดถึง `config.module.ts`
เลย (compiled เป็น `require()` เรียงตามลำดับ import ใน `main.ts`, `tracing.ts` มาก่อน `AppModule`
เสมอ) jest ผ่านเพราะ test file บางไฟล์ไม่ได้ import chain ผ่าน `tracing.ts` เลย ไม่ใช่เพราะ fix ถูกจุด
— **verify ด้วย jest อย่างเดียวไม่พอสำหรับโค้ดที่เกี่ยวกับลำดับการโหลดโมดูล ต้อง boot จริงเทียบด้วยเสมอ**
(ตัวอย่างที่ 2 ของ session นี้ที่ jest เขียวแต่พฤติกรรมจริงผิด — ตัวแรกคือ TS build error ใน
`meta.warnings`)

**ตรวจแล้ว**: `NODE_ENV=local npx nest start sales-bc` จริง — ไม่มีบรรทัด "injected env ... tip:"
โผล่มาเลยหลังแก้ทั้ง 2 จุด (ก่อนแก้ยังเห็นอยู่) · 1500/1500 test ผ่าน · eslint 0/0
