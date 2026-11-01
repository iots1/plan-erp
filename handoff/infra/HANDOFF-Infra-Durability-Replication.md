# HANDOFF — Infra: ข้อมูลที่ "บันทึกแล้ว" หายได้ และการอ่านได้ข้อมูลเก่า

> **ไฟล์ส่งต่อ session** — ไม่ใช่เอกสารของ product · ลบได้เมื่องานในนี้จบ
> เขียนเมื่อ **2026-10-23** · คู่กับ `HANDOFF-Postgresql.md` (สิ่งที่ยังไม่ได้ทดสอบของ cluster) และ
> `HANDOFF-Feature.md` §4 ข้อ 21 (ผลที่ฝั่งแอปเจอ)
> เนื้อหาถาวรของ cluster อยู่ที่ `postgresql-pgpool-cluster-guide.html` / `ha-failover-operations-guide.html`

---

## 0 · สถานะการตัดสินใจ — รู้แล้ว ยังไม่แก้ (2026-10-23)

**ผู้ใช้ตัดสินใจว่ายังไม่แก้ตอนนี้** ทุกอย่างในไฟล์นี้เป็นการวิเคราะห์และแผน ยังไม่ได้แตะค่าใดๆ ของ cluster
บันทึกไว้เพื่อให้ session ถัดไปไม่ต้องสืบซ้ำ และรู้ว่าการตัดสินใจนี้**หมดอายุเมื่อไร**

**เงื่อนไขที่ทำให้ต้องกลับมาทำทันที** (ข้อใดข้อหนึ่งพอ):

1. ก่อน**ออกใบกำกับภาษีจริงให้ลูกค้าจริงใบแรก** — ปัญหา B ทำให้เลขใบกำกับซ้ำได้ (§3.3) ซึ่งผิด §86/4
2. เงื่อนไขเดียวกับ `HANDOFF-Postgresql.md` §0: มีข้อมูลลูกค้าจริง, นัด go-live/UAT, หรือมีคนนอกทีมกรอกข้อมูล
3. เกิด failover หรือ primary crash ขึ้นจริงอีกครั้ง — ให้ตรวจข้อมูลข้าม BC ตาม §6.3 ก่อนอย่างอื่น

> `.env` ของ dev กับ production ชี้ cluster **ตัวเดียวกัน** (`HANDOFF-Feature.md` §4 กับดัก #10)
> และทุก BC (auth, iam, inventory, supplier, sales, finance, report) อยู่บน cluster เดียวนี้ —
> ตรวจแล้ว `*_DB_HOST`/`*_DB_PORT` ทุกตัวเหมือนกัน วันที่ข้อมูลจริงเข้ามาจะไม่มีอะไรเปลี่ยนทางเทคนิค เปลี่ยนแค่ราคาของความผิดพลาด

---

## 1 · เจอได้อย่างไร

2026-10-23 หลัง deploy `903a171` (branch `feature/purchase-discound-document`) รัน smoke POS บนโดเมนจริง:
void บิล `POS-2026-00057` → `POST /pos-sales/{id}/void` ตอบ `VOIDED` → `GET /finance-bc/v1/receipts/{id}` ทันที
ได้ใบกำกับ `ABB-2026-00035` สถานะ **`ISSUED`** ทั้งที่ finance-bc void และ commit **ก่อน**ตอบ RPC แล้ว
(`PosSaleOperationsService.voidSale()` await ทุกขั้น) · รันซ้ำผ่าน · สืบแล้วไม่ใช่บั๊กในโค้ด แต่เป็นพฤติกรรมของ cluster
และระหว่างสืบจึงเจอปัญหา B ที่ร้ายแรงกว่า

---

## 2 · ข้อเท็จจริงที่ตรวจแล้ว (อ่านอย่างเดียว · 2026-10-23)

| เรื่อง | ค่า | ตรวจด้วย |
|---|---|---|
| version | PostgreSQL 18.4 | `version()` |
| โครงสร้าง | primary 1 + standby 2 (`ppr1`, `ppr2`) หลัง pgpool | `SHOW pool_nodes` |
| โหมด replication | **async** ทั้งคู่ · `synchronous_standby_names = ''` | `pg_stat_replication.sync_state` |
| `synchronous_commit` | **`off`** — มาจาก `postgresql.auto.conf` (= `ALTER SYSTEM`) **ไม่ได้มาจาก `scripts/install-postgresql.sh`** | `pg_settings.source/sourcefile` |
| ไฟล์ `postgresql.auto.conf` แก้ล่าสุด | **2026-10-06** พร้อมชุดจูนอื่น: `work_mem 16MB`, `maintenance_work_mem 512MB`, `max_wal_size 8GB`, `checkpoint_timeout 15min`, `wal_compression lz4`, `jit off`, log ต่างๆ | `pg_stat_file`, `pg_file_settings` |
| `wal_writer_delay` | 200ms → ช่วงที่ commit ยังไม่ลงดิสก์ได้ถึง ~600ms (3×) | `current_setting` |
| `fsync` / `full_page_writes` | on / on (ข้อมูลไม่ corrupt — แค่ commit ล่าสุดหายได้) | `pg_settings` |
| lag ของ standby ตอนปกติ | write ~0.7–0.9ms · flush ~1.7ms · **replay ~4ms** · ตามหลัง ~11KB | `pg_stat_replication` |
| pgpool load balance | `load_balance_mode = on` · weight ⅓ ต่อ node · `statement_level_load_balance = off` | `install-pgpool.sh`, `SHOW pool_nodes` |
| การ pin หลัง write | `disable_load_balance_on_write = 'always'` — pin เฉพาะ **connection (session) ที่ write** | เหมือนกัน |
| ตัด standby ที่ lag ทิ้ง | `delay_threshold = 0` (ปิด) · `prefer_lower_delay_standby = off` · `sr_check_period = 5s` | `PGPOOL SHOW` |
| สัดส่วน SELECT จริง | primary ~7.6M · standby ~1.7M ต่อตัว (standby รับ ~31% รวมกัน) | `SHOW pool_nodes.select_cnt` |
| pool ของแอป | `max: 5` ต่อ process · `idleTimeoutMillis: 30000` (connection ว่าง 30 วิถูกปิด → ตัวใหม่ยังไม่ถูก pin) | `libs/database/src/database.module.ts` |
| failover | repmgr + repmgrd promote เอง (วัดได้ 29 วิ — cluster guide §11) | เอกสาร |
| เคย failover/switchover มาแล้ว | primary ปัจจุบันยังมี `primary_conninfo`/`primary_slot_name` ค้างใน auto.conf = เคยเป็น standby มาก่อน | `pg_file_settings` |
| backup / PITR | **ไม่มี** · `archive_mode = off` (`HANDOFF-Postgresql.md` §2.1) | `pg_settings` |

---

## 3 · ปัญหา B (ร้ายแรงกว่า) — commit ที่ตอบผู้ใช้ว่า "สำเร็จ" แล้ว หายไปได้

### 3.1 · กลไก — มี 2 ช่องทาง

**ช่องทาง ① primary crash / restart — เพราะ `synchronous_commit = off`**

```
แอป ── COMMIT ──▶ primary: เขียน WAL ลง buffer ในหน่วยความจำ
                        └─▶ ตอบ "COMMIT สำเร็จ" ทันที  ◀── ยังไม่ fsync ลงดิสก์
       (wal writer จะ flush ทุก 200ms)
💥 PostgreSQL crash / OS crash / ไฟดับ / VM ถูก kill ก่อน flush
   → recovery เล่น WAL เท่าที่อยู่บนดิสก์ → commit ช่วง ~600ms ล่าสุดหายไปเหมือนไม่เคยเกิด
```

ข้อมูลไม่ corrupt (`fsync = on`) — แต่**ข้อมูลที่ยืนยันกับผู้ใช้แล้ว**หายไปได้ · PostgreSQL docs เรียกค่านี้ว่า
"safe to use for data that can be lost" ซึ่ง ERP ที่ออกเอกสารภาษีไม่ใช่

**ช่องทาง ② failover ไป standby — เพราะ replication เป็น async**

```
primary ── COMMIT สำเร็จ (ไม่รอ standby) ── ส่ง WAL ไป standby ตามหลัง ~1–4ms (มากกว่านั้นตอนโหลดสูง)
💥 primary ตาย → repmgr promote standby
   → อะไรที่ primary ยืนยันไปแล้วแต่ยังไม่ถึง standby = หายถาวร (primary เก่าถูกทิ้ง/rejoin ทีหลัง)
```

ช่องทาง ② มีอยู่**แม้จะเปิด `synchronous_commit = on` แล้ว** — ต้องใช้ synchronous replication (§5.2) ถึงจะปิดได้

### 3.2 · ทำไมระบบตรวจไม่เจอเอง

- ไม่มี error ใดๆ — ฝั่งแอปได้ COMMIT สำเร็จไปแล้ว ฝั่ง DB หลังฟื้นก็สอดคล้องในตัวเอง
- ทุก BC อยู่ cluster เดียวแต่**คนละ database** การ crash ตัด commit ล่าสุดของแต่ละ database ตามเวลาที่เกิด
  ไม่มี transaction ข้าม database ให้ rollback พร้อมกัน
- RabbitMQ อยู่นอก cluster — event ที่ outbox ส่งออกไปแล้วจะไม่ถูกดึงกลับ
- ไม่มี backup/PITR (`archive_mode = off`) ให้เทียบหรือย้อนดู

### 3.3 · ผลที่เกิดได้ใน ERP นี้ (เรียงตามความร้ายแรง)

**(1) เลขใบกำกับภาษีซ้ำ — ผิด ป.รัษฎากร §86/4**

ลำดับเหตุการณ์ที่เป็นไปได้จริง:

1. POS ออก `ABB-2026-00108` — finance-bc ล็อก counter → เพิ่มเป็น 108 → commit → ตอบสำเร็จ
2. แคชเชียร์พิมพ์สลิปให้ลูกค้า ลูกค้าเดินออกจากร้าน
3. ภายใน ~600ms (ช่องทาง ①) หรือก่อน WAL ถึง standby (ช่องทาง ②) primary ตาย
4. หลังฟื้น/failover counter ยังเป็น 107 และใบกำกับ 108 ไม่มีอยู่ในระบบ
5. บิลถัดไปได้ `ABB-2026-00108` **ซ้ำกับใบที่อยู่ในมือลูกค้า** — ระบบบอกว่าลำดับ "ไม่ขาด" แต่เอกสารจริงซ้ำ

กฎ gapless ทั้งหมดใน `.claude/rules/business-documents.md` (ดึงเลขใน transaction เดียวกับการ issue)
ป้องกันได้แค่ "เลขหายเพราะแอปพัง" — ป้องกัน "DB ทิ้ง commit ที่ยืนยันแล้ว" ไม่ได้

**(2) ข้อมูลข้าม BC ไม่ตรงกัน**

POS หนึ่งบิล = commit 3 database: inventory (ตัดสต็อก) → finance (ใบกำกับ + รับชำระ) → sales (`pos_sales`)
ถ้าตายกลางทาง อาจเหลือ:

| inventory | finance | sales | ผลที่เห็น |
|---|---|---|---|
| ตัดแล้ว | หาย | หาย | สต็อกหายโดยไม่มีเอกสารอ้าง · COGS อาจลงไปแล้ว (event ส่งไปแล้ว) |
| ตัดแล้ว | ออกแล้ว | หาย | มีใบกำกับและเงินเข้า แต่ไม่มีบิล POS ให้ void · void ไม่ได้จากหน้าจอ |
| หาย | ออกแล้ว | ออกแล้ว | ขายของที่ระบบบอกว่ายังอยู่ในคลัง |

เหมือนกันกับ GR → AP invoice, DN → ใบกำกับ, ใบลดหนี้ ฯลฯ ทุกเส้นที่ข้าม BC

**(3) event ชี้ไปข้อมูลที่ไม่มีแล้ว** — outbox dispatch `stock.deducted` ไปแล้ว → finance ลง COGS/GL แล้ว →
แต่ `delivery_issues`/`stock_movements` ต้นทางหาย · consumer idempotent ช่วยกันซ้ำได้ แต่ไม่ช่วยเรื่องต้นทางหาย

**(4) ผู้ใช้ทำซ้ำแล้วได้ผลซ้อน** — เห็น 503 หรือข้อมูลหายแล้วกดใหม่ → สร้างเอกสารซ้ำในส่วนที่ไม่ได้หาย

### 3.4 · โอกาสเกิด

ต่ำต่อครั้ง (ต้องมี crash/failover **ตรงจังหวะ**ที่มีการเขียน) แต่:
- cluster นี้**ตั้งใจให้ failover อัตโนมัติ** และเคย failover/switchover มาแล้วอย่างน้อยครั้งหนึ่ง (§2)
- `HANDOFF-Postgresql.md` §3.1: VM ทั้ง 7 ตัวอยู่บน hypervisor เดียว — host ล่ม = primary crash แบบไม่มี flush แน่นอน
- `HANDOFF-Postgresql.md` §2.2: ยังไม่เคยซ้อม primary ตายจริงหลังแก้บั๊ก
- ผลเสียย้อนกลับไม่ได้ (เลขที่พิมพ์ให้ลูกค้าไปแล้ว) และไม่มี backup ให้กู้

---

## 4 · ปัญหา A (เบากว่า) — อ่านทันทีหลัง write ของ connection อื่น ได้ข้อมูลเก่า

### 4.1 · กลไก

```
connection X (finance-bc, RPC void)  ── UPDATE receipts … COMMIT ──▶ primary
connection Y (finance-bc, HTTP GET)  ── SELECT receipts …  ──▶ pgpool ──▶ ⅔ ไป standby ที่ยัง replay ไม่ถึง (ตามหลัง ~4ms)
                                                                    └─▶ ได้สถานะเก่า (ISSUED)
```

`disable_load_balance_on_write='always'` pin เฉพาะ **session ที่ write** · connection Y เป็น session อื่น
(หรือเป็น connection ที่ pool เพิ่งเปิดใหม่หลัง idle 30 วิ) จึงไม่ได้รับการ pin · cluster guide เขียนไว้แล้วในหัวข้อ
"Known Gaps": *ไม่ป้องกัน connection ใหม่คนละตัว อ่านทันทีหลังจาก connection อื่น write เสร็จ*

### 4.2 · ใครโดน / ใครไม่โดน

| สถานการณ์ | โดนไหม | เพราะ |
|---|---|---|
| ภายใน request เดียว ผ่าน base operations | ไม่ | `_updateEntity`/`create` อยู่ใน transaction เดียว connection เดียว |
| อ่านด้วย lock (`loadLocked*`, `pessimistic_write`) | ไม่ | `FOR UPDATE` เป็น write-class ไป primary เสมอ |
| คนกดหน้าจอทีละขั้น | แทบไม่ | ช่วงเวลาแค่ระดับ ms |
| FE ทำ action แล้ว GET ซ้ำทันที | **โดน** | request ใหม่ อาจได้ connection ที่ไม่ได้ pin |
| service A RPC ไป B แล้ว C (หรือ A ด้วย connection อื่น) อ่านต่อ | **โดน** | คนละ connection |
| smoke / automation ที่ยิงต่อกันเร็ว | **โดน** | เหตุการณ์ 2026-10-23 |
| โค้ดใหม่ที่ read นอก transaction เพื่อตัดสินใจทันทีหลัง write ของตัวเอง | **โดน** | read กับ write อาจได้คนละ connection จาก pool |

### 4.3 · ถ้าไม่แก้

ไม่มีข้อมูลเสีย — เป็นปัญหาความถูกต้องของ "สิ่งที่เห็น" ในช่วงสั้นๆ: automation flaky, FE เห็นสถานะเก่า/404 ชั่วครู่
และความเสี่ยงที่โค้ดใหม่จะตัดสินใจจากข้อมูลเก่าถ้าไม่ทำตามกติกา §5.3

### 4.4 · ที่ทำไปแล้ว (ฝั่งแอป)

- `apps/sales-bc/test/smoke/pos-sales.smoke.mjs` — `eventually()` อ่านซ้ำจนสถานะถูก (≤5 วิ) ทุกจุดที่อ่านต่อจาก write ข้าม service
  และ `run()` void ทุกบิลที่สร้างใน `finally`
- `HANDOFF-Feature.md` §4 ข้อ 21 — กติกาสำหรับ smoke/FE

---

## 5 · ทางแก้ — ทำทีละขั้น พร้อมวิธีตรวจและวิธีถอย

> คำสั่งทั้งหมดรันบน **primary** ด้วย superuser (เช่น `sudo -u postgres psql` บนเครื่อง primary)
> ไม่ผ่าน pgpool · `ALTER SYSTEM` เขียนลง `postgresql.auto.conf` ของ **node นั้น** — ต้องทำให้ครบทุก node
> (standby จะใช้ค่านี้เมื่อถูก promote เป็น primary) ไม่งั้น failover ครั้งถัดไปจะได้ค่าเก่ากลับมาเงียบๆ

### 5.0 · ก่อนเริ่ม — ถามคนที่ตั้งค่าไว้

`synchronous_commit = off` ถูกตั้งพร้อมชุดจูน performance เมื่อ **2026-10-06** — ต้องถามคนที่ทำว่า:
ตั้งเพราะปัญหาอะไร (write ช้า? import/seed?), วัดผลไว้หรือไม่, และรู้ไหมว่าแลกกับการเสีย commit ได้
ถ้ามีเหตุผลด้าน performance จริง ให้วัดเทียบตาม §5.4 ก่อนตัดสินใจ

### 5.1 · 🔴 ขั้นที่ 1 — เปิด `synchronous_commit = on` (ปิดช่องทาง ①)

**ความเสี่ยง:** ต่ำมาก · reload อย่างเดียว ไม่ restart · ถอยได้ทันที

```sql
-- บน primary แล้วทำซ้ำบน standby ทั้งสอง (เผื่อถูก promote)
ALTER SYSTEM SET synchronous_commit = on;     -- หรือ ALTER SYSTEM RESET synchronous_commit; (default = on)
SELECT pg_reload_conf();

-- ตรวจ
SHOW synchronous_commit;                                      -- on
SELECT name, setting, source, sourcefile FROM pg_settings WHERE name = 'synchronous_commit';
```

**ได้:** commit ที่ยืนยันแล้วอยู่บนดิสก์ primary แน่นอน
**เสีย:** commit แต่ละครั้งรอ `fdatasync` ของ WAL — บน SSD ระดับ 0.1–2ms · ระบบนี้เขียนน้อย ไม่น่ารู้สึก
**ถอย:** `ALTER SYSTEM SET synchronous_commit = off; SELECT pg_reload_conf();`
**ตรวจหลังทำ:** p95 ของ endpoint ที่เขียนหนัก (POS create, GR submit) เทียบก่อน/หลัง ใน log หรือ observability

### 5.2 · 🔴 ขั้นที่ 2 — Synchronous replication อย่างน้อย 1 standby (ปิดช่องทาง ②)

**ความเสี่ยง:** ปานกลาง · ต้องวางแผน + ซ้อม failover ใน maintenance window

```sql
-- บน primary (และตั้งให้เหมือนกันบน standby ทั้งสอง เผื่อถูก promote)
ALTER SYSTEM SET synchronous_standby_names = 'ANY 1 (ppr1, ppr2)';
ALTER SYSTEM SET synchronous_commit = on;     -- = รอ standby อย่างน้อย 1 ตัว flush WAL ลงดิสก์
SELECT pg_reload_conf();

-- ตรวจ: ต้องเห็น sync_state = 'quorum' ทั้งสองตัว
SELECT application_name, state, sync_state, write_lag, flush_lag, replay_lag FROM pg_stat_replication;
```

> ชื่อใน `synchronous_standby_names` ต้องตรงกับ `application_name` ใน `pg_stat_replication` ของ primary **ปัจจุบัน**
> หลัง failover ชื่อชุดจะเปลี่ยน (primary เก่ากลายเป็น standby ชื่ออื่น) — ใช้ `ANY 1 (*)` ได้ถ้าต้องการให้ไม่ผูกชื่อ
> แต่ต้องตัดสินใจร่วมกับ repmgr config (ดูข้อควรตรวจด้านล่าง)

**ได้:** ทุก commit อยู่บนดิสก์อย่างน้อย 2 เครื่อง → failover ไป standby ที่ตามทันไม่เสียข้อมูล
**เสีย:** commit ช้าลงอีก ~1 RTT ใน LAN (วัดได้ flush_lag ~1.7ms ตอนนี้)
**ความเสี่ยงใหม่ที่ต้องรับมือ:** ถ้า standby **ทั้งสองตัว**ล่มหรือขาดการเชื่อมต่อพร้อมกัน →
**ทุก COMMIT ค้าง** (แอปเห็น timeout ไม่ใช่ error) · `ANY 1` ทนได้ 1 ตัว

**ต้องทำคู่กัน (ห้ามข้าม):**

1. **ซ้อม** `HANDOFF-Postgresql.md` §2.2 (primary ตายจริง) **หลัง**เปิด sync — ยืนยันว่า repmgr promote standby ที่มี LSN สูงสุด
   และ standby อีกตัว follow ได้ · ตรวจ `repmgr.conf` ว่า `priority`/`failover` ไม่ได้บังคับเลือก node ที่อาจตามไม่ทัน
2. **runbook "standby ล่มทั้งคู่ — write ค้าง"** (เพิ่มใน `ha-failover-operations-guide.html`):
   ```sql
   -- ปลด sync ชั่วคราว ให้ commit ที่ค้างอยู่ผ่าน (ยอมกลับไปเสี่ยงแบบ async จนกว่า standby จะกลับมา)
   ALTER SYSTEM SET synchronous_standby_names = '';
   SELECT pg_reload_conf();
   -- เมื่อ standby กลับมา streaming แล้ว ตั้งคืน
   ```
3. **alert:** `pg_stat_replication` มีน้อยกว่า 1 แถวที่ `state='streaming'` → แจ้งทันที (ต่อจาก `HANDOFF-Postgresql.md` §2.9)
4. ตั้งค่าให้**เหมือนกันทุก node** และใส่ลง `scripts/install-postgresql.sh` ด้วย ไม่งั้น cluster ที่สร้างใหม่ได้ค่าเก่า

**ถอย:** `ALTER SYSTEM SET synchronous_standby_names = ''; SELECT pg_reload_conf();`

### 5.3 · 🟡 ปัญหา A — แนะนำ: ไม่แก้ที่ infra · ใช้กติกาแทน

**กติกา (บันทึกแล้วใน `HANDOFF-Feature.md` §4 ข้อ 21):**

- FE ใช้ **response ของ action** เป็นสถานะล่าสุด — ไม่ GET ซ้ำทันทีเพื่อ "ยืนยัน"
- smoke/automation ที่อ่านต่อจาก write ข้าม service → รอสถานะ (`eventually()`) ไม่สมมติว่าเห็นทันที
- โค้ดที่ write แล้วต้องอ่านต่อ → ทำใน transaction เดียวกัน (แนวเดิมของ repo — base operations ทำให้อยู่แล้ว)
- การตัดสินใจทางธุรกิจที่ต้องเห็นค่าล่าสุด → อ่านด้วย lock (`loadLocked*`) ซึ่งไป primary เสมอ

**ทางเลือกถ้าต้องการ read-your-writes ข้าม connection จริง** (เรียงจากง่ายไปยาก):

| ทางเลือก | ได้ | เสีย | แนะนำไหม |
|---|---|---|---|
| `load_balance_mode = off` ใน pgpool ทั้ง 3 node | อ่านทุกอย่างที่ primary — ปัญหา A หายหมด | standby เหลือหน้าที่ HA อย่างเดียว · primary รับ SELECT เพิ่ม ~31% | **ถ้าจะแก้ ทำอันนี้** — ข้อมูลน้อย โหลดต่ำ primary รับไหว (วัดก่อน) |
| `allow_sql_comments = on` + `/*NO LOAD BALANCE*/` ใน query ที่ต้องการ | เลือกเฉพาะจุด | ต้องแก้โค้ดทีละจุด TypeORM ใส่ comment ยาก | เฉพาะเมื่อเจอจุดจำเป็นจริง |
| `app_name_redirect_preference_list` ส่งบาง BC ไป primary | เลือกราย service | ต้องตั้ง `application_name` ต่อ BC | กลางๆ |
| `synchronous_commit = remote_apply` + `ANY 2` | ทุก connection เห็นข้อมูลล่าสุด | standby **ตัวใดตัวหนึ่ง**ล่ม = write ค้างทั้งระบบ · commit ช้าเท่า replay | **ไม่แนะนำ** |
| `delay_threshold` / `prefer_lower_delay_standby` | ตัด standby ที่ lag มาก | วัดทุก 5 วิ — lag ระดับ ms มองไม่เห็น ไม่ช่วยปัญหานี้ | ไม่ช่วย |

### 5.4 · วัด performance ก่อน/หลัง (ใช้กับ §5.0–5.2)

ทำใน maintenance window บน database ทดลอง **ไม่ใช่** `erp_*`:

```bash
# บนเครื่องที่ต่อ primary ตรงได้
createdb pgbench_tmp
pgbench -i -s 10 pgbench_tmp
pgbench -c 8 -j 4 -T 60 -N pgbench_tmp     # วัดค่าปัจจุบัน (off/async) จด tps + latency
# เปลี่ยนค่าตาม §5.1 หรือ §5.2 แล้ว reload → รันซ้ำคำสั่งเดิม → เทียบ
dropdb pgbench_tmp
```

ตัวเลขที่ต้องจด: tps, latency average, และ p95 ของ endpoint จริงจาก observability ก่อน/หลัง 1 วันทำการ

---

## 6 · ถ้าไม่แก้ — สรุปผลกระทบ

### 6.1 · ตาราง

| | ไม่แก้ปัญหา B | ไม่แก้ปัญหา A |
|---|---|---|
| เกิดเมื่อ | primary crash / host ล่ม / failover ตรงจังหวะที่มีการเขียน | ทุกครั้งที่อ่านทันทีหลัง write ข้าม connection |
| ความถี่ | ต่ำ | บ่อยใน automation · แทบไม่เกิดกับคน |
| ผล | commit ที่ยืนยันแล้วหาย · **เลขใบกำกับซ้ำ** · สต็อก/บัญชีข้าม BC ไม่ตรง · event ชี้ข้อมูลที่หาย | เห็นสถานะเก่าชั่วครู่ · smoke flaky |
| ย้อนกลับได้ไหม | **ไม่ได้** (เอกสารอยู่ในมือลูกค้า + ไม่มี backup) | ได้ — รีเฟรชก็ถูก |
| ตรวจเจอเองไหม | ไม่ — ไม่มี error | ได้ — ค่ากลับมาถูกเอง |

### 6.2 · คำแนะนำลำดับ

1. **§5.1 ทันทีที่ยืนยันกับคนที่ตั้ง `off`** — เกือบไม่มีต้นทุน
2. **§5.2 ใน maintenance window** หลังซ้อม `HANDOFF-Postgresql.md` §2.2 และมี runbook/alert ครบ — ก่อนออกใบกำกับจริงใบแรก
3. **backup/PITR** (`HANDOFF-Postgresql.md` §2.1) — คนละเรื่องแต่เป็นตาข่ายสุดท้ายของปัญหา B
4. **ปัญหา A** — คงไว้ ใช้กติกา §5.3 · ทบทวนเมื่อ FE รายงานปัญหาจริง

### 6.3 · ถ้าเกิด crash/failover ก่อนแก้ — ตรวจอะไรก่อน

```sql
-- erp_finance: ลำดับเลขต่อ prefix ต้องไม่ขาด และไม่มีเลขที่ลูกค้าถือแต่ระบบไม่มี
SELECT document_type, max(document_number), count(*) FROM receipts
 WHERE document_number IS NOT NULL GROUP BY document_type;
-- เทียบกับ counter
SELECT * FROM receipt_number_counters ORDER BY year DESC;

-- erp_inventory vs erp_sales: movement ของ POS ที่ไม่มีบิล (รันแยก DB แล้วเทียบเลข)
SELECT DISTINCT source_doc_number FROM stock_movements
 WHERE source_doc_type = 'POS_SALE' AND created_at > now() - interval '1 hour';
SELECT pos_number FROM pos_sales WHERE created_at > now() - interval '1 hour';
```

แจ้งหน้าร้านให้เก็บสลิปที่ออกในช่วงเวลาก่อนเหตุการณ์ไว้เทียบ

---

## 7 · ข้อสังเกตอื่นที่เจอระหว่างตรวจ (ยังไม่ได้แก้)

| # | เรื่อง | ทำไมสำคัญ |
|---|---|---|
| 1 | 🔴 **แอปต่อ DB ด้วย superuser** — query `pg_file_settings` ได้ และเห็น `primary_conninfo` รวม**รหัสผ่านของ user `repmgr`** | ใครได้ credential ของแอปก็ได้สิทธิ์ replication ด้วย · รหัสนี้ถูกพิมพ์ออกมาใน session 2026-10-23 แล้ว — **ควร rotate** · ต่อจาก `HANDOFF-Postgresql.md` §3.4 |
| 2 | 🟠 `shared_buffers = 1GB` ใน auto.conf แต่ `applied = false` | ต้อง restart ถึงมีผล — ตอนนี้ยังเป็นค่าเก่า · restart ครั้งถัดไปค่าจะเปลี่ยนเอง (ตั้งใจหรือเปล่า?) |
| 3 | 🟠 `archive_mode = off` | ไม่มี PITR — ต่อจาก `HANDOFF-Postgresql.md` §2.1 |
| 4 | 🟡 `max_slot_wal_keep_size = -1` | slot ค้าง = WAL สะสมจน disk primary เต็ม — `HANDOFF-Postgresql.md` §2.8 |
| 5 | 🟡 `hot_standby_feedback = off` | query ยาวบน standby (ซึ่งรับ SELECT ~31%) อาจถูกยกเลิกด้วย `conflict with recovery` — รายงานใหญ่ๆ อาจ error เป็นพักๆ |
| 6 | 🟡 `primary_conninfo` ค้างใน auto.conf ของ primary | ไม่มีผลขณะเป็น primary (ไม่มี `standby.signal`) แต่เป็นหลักฐานว่าเคย failover/switchover — ยังไม่รู้ว่าครั้งนั้นเสีย commit ไปหรือไม่ |

---

## 8 · คำสั่งตรวจ (อ่านอย่างเดียว รันได้ตลอด)

ผ่าน pgpool ด้วย user ของแอป · ก่อน query ค่าของ primary ให้ write อะไรสักอย่างใน session ก่อน
(`BEGIN; CREATE TEMP TABLE _pin(x int); ROLLBACK;`) เพื่อให้ pgpool pin ไป primary ไม่งั้นอาจได้ค่าของ standby

```sql
-- pgpool: node, role, สัดส่วน SELECT, lag ที่ pgpool เห็น
SHOW pool_nodes;
PGPOOL SHOW delay_threshold;  PGPOOL SHOW sr_check_period;

-- primary: ความทนทาน
SELECT pg_is_in_recovery(), current_setting('synchronous_commit'),
       current_setting('synchronous_standby_names'), current_setting('wal_writer_delay');
SELECT name, setting, source, sourcefile FROM pg_settings WHERE name = 'synchronous_commit';

-- primary: replication
SELECT application_name, state, sync_state, write_lag, flush_lag, replay_lag,
       pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS bytes_behind
  FROM pg_stat_replication;

-- primary: ค่าที่ ALTER SYSTEM ตั้งไว้ (ระวัง: แถว primary_conninfo มีรหัสผ่าน — อย่าแปะผลลัพธ์ลงที่ใด)
SELECT name, applied, error FROM pg_file_settings WHERE sourcefile LIKE '%auto.conf' ORDER BY seqno;
```
