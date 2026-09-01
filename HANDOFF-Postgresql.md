# HANDOFF — PostgreSQL / Pgpool: อะไรที่ยังไม่ได้ทดสอบ

> **ไฟล์ชั่วคราวสำหรับส่งต่อ session** — ไม่ใช่เอกสารของ product · ลบทิ้งได้เมื่องานในนี้จบ
> เขียนเมื่อ **2026-09-01** · คู่กับ `HANDOFF-Feature.md` (ฝั่ง application) แต่แยกกันคนละเรื่อง
> เนื้อหาถาวรอยู่ที่ `postgresql-pgpool-cluster-guide.html` / `ha-failover-operations-guide.html` / `runbook-*.html`

---

## 1 · สถานะล่าสุด — ยืนยันด้วยการรันจริง ไม่ใช่เดา

| Repo | Commit |
|---|---|
| `iotechsoft-company/erp-api` | `d7efab1` fix(install-pgpool): stop generating config that breaks auto_failback and PCP |
| `iots1/plan-erp` (submodule) | `80e305c` docs: record HA drill results, PCP fix, and PVE rightsizing |

**แก้เสร็จและพิสูจน์แล้วในรอบนี้:**

- **บั๊ก #39** — `backend_application_name` เป็น `node0/1/2` ซึ่งไม่แมตช์ `pg_stat_replication` ทำให้ `auto_failback` ไม่เคยทำงานเลยตลอดอายุคลัสเตอร์ · แก้ทั้ง 3 pgpool node + แก้ที่ generator แล้ว · **นี่คือสาเหตุที่แท้จริงของบั๊ก #14 / #20 / #38 ที่เคยแก้อาการมา 3 รอบ**
- **บั๊ก #37 (regress รอบ 2)** — PCP credential drift · rotate ใหม่ครบ 6 เครื่อง · `.pcppass` เปลี่ยนจาก `localhost:` เป็น `*:` ทั้งใน production และใน `install-pgpool.sh`
- **บั๊ก #40** — `unattended-upgrades` รีสตาร์ท PostgreSQL เอง · วาง `99-no-db-autorestart.conf` ครบ 6 เครื่อง ยืนยัน parse ผ่านทุกตัว
- **สเปค standby** — cores 2→4 · RAM ceiling 4,096→7,168 (floor 4,096 ผ่าน balloon) เท่า primary แล้ว
- **ซ้อมผ่าน 3 ระดับ** — PCP auth 9/9 · standby ฟื้นเอง ~2 วิ · VIP ย้าย ~6 วิ

**สุขภาพตอนนี้:** `show pool_nodes` = `up/up` ครบ 3 · standby `streaming` ทั้งคู่ · repmgr 3 node running · host available 7,025 MB (จาก 3,622)

---

## 2 · สิ่งที่ต้องทดสอบ — เรียงตามความเสี่ยงถ้าไม่ทำ

### 2.1 · 🔴 กู้ข้อมูลกลับ — ไม่มี backup เลยแม้แต่ชุดเดียว

**นี่คือความเสี่ยงอันดับหนึ่งของทั้งระบบ และไม่ใช่เรื่อง HA** ตรวจแล้ว 2026-09-01:

```
archive_mode = off              # ไม่มี WAL archive → กู้ย้อนเวลาไม่ได้
cron ที่มี pg_dump: 0
pgbackrest / barman / wal-g: ไม่ได้ติดตั้ง
```

(timer ชื่อ `dpkg-db-backup` ที่เจอ เป็นของ Debian ใช้ backup รายการ package ไม่เกี่ยวกับ PostgreSQL)

**Replication ไม่ใช่ backup** — `DELETE` ผิดตารางหรือ `DROP TABLE` จะถูก replicate ไปครบทั้ง 3 node ภายในมิลลิวินาที
ทั้งสามชุดจะผิดเหมือนกันหมดและไม่มีทางย้อน

**สิ่งที่ต้องทำ (ไม่ใช่แค่ทดสอบ — ยังไม่มีให้ทดสอบ):**

1. ตั้ง `pg_dump`/`pg_dumpall` รายวันเก็บไว้ **นอกคลัสเตอร์** (คนละเครื่อง คนละ hypervisor)
2. เปิด `archive_mode` + WAL archive ถ้าต้องการ PITR
3. **ทดสอบ restore จริงลง DB เปล่า แล้วนับ row เทียบ** — backup ที่ไม่เคย restore ถือว่าไม่มี
4. จดเวลาที่ใช้ restore จริง เพื่อรู้ RTO ที่แท้จริง (DB ใหญ่ ~20 GB)

---

### 2.2 · 🔴 ซ้อมข้อ 4 — primary ตายจริง

ยังไม่เคยทำ**หลังจาก**แก้บั๊กทั้งหมด ซ้อมที่ผ่านมาแตะแค่ standby กับ pgpool ซึ่งเป็นเคสที่เบากว่ามาก

```bash
# ปิด VM ของ primary ที่ hypervisor (ไม่ใช่ systemctl stop — ต้องจำลองเครื่องตาย)
qm stop <vmid-primary>
```

**ต้องยืนยัน 6 ข้อ:**

| # | ตรวจอะไร | ผ่าน = |
|---|---|---|
| 1 | repmgr promote | สำเร็จภายใน 60 วินาที (ที่เคยวัดได้คือ 29 วิ แต่ตอนนั้นสเปคยังไม่เท่ากัน) |
| 2 | standby อีกตัว follow | `repmgr cluster show` เห็น upstream ชี้ไป primary ใหม่ |
| 3 | **event hook ทำงาน** | `/var/log/repmgr-pgpool-reattach.log` มี `Command Successful` — **ข้อนี้สำคัญที่สุดเพราะเพิ่งซ่อม ยังไม่เคยยิงจริง** |
| 4 | pgpool เจอ primary ใหม่ | `show pool_nodes` มี `role = primary` และไม่มี node ไหน `status=down` ทั้งที่ `pg_status=up` |
| 5 | app กลับมาเขียนได้ | write ผ่าน VIP สำเร็จโดยไม่ต้อง restart service |
| 6 | **balloon พองจริง** | primary ใหม่ไต่ขึ้นจาก 4,096 เข้าใกล้ 7,168 ภายใน 1–2 นาที (RAM ที่ primary เก่าคืนให้ host) |

ข้อ 3 กับ 6 เป็นของใหม่ที่ไม่เคยพิสูจน์ — hook เพิ่งซ่อมวันนี้ และ balloon เพิ่งตั้งวันนี้

---

### 2.3 · 🔴 ซ้อมข้อ 5 — กู้ primary เก่ากลับเป็น standby

ต่อจากข้อ 2.2 ทันที ยังไม่เคยทดสอบบนคลัสเตอร์ชุดนี้ด้วย config ปัจจุบัน

```bash
ssh <old-primary> "sudo -u postgres repmgr node rejoin -f /etc/repmgr.conf \
  -d 'host=<new-primary> user=repmgr dbname=repmgr' --force-rewind --dry-run"
```

`pg_rewind` ใช้ได้แน่นอนเพราะ `data_checksums = on` (ตรวจแล้ว) แต่บั๊ก #29/#30 (Debian แยก config ออกจาก
data directory ต้องมี symlink) ถูกบันทึกว่าแก้แล้ว **ยังไม่เคย verify ซ้ำหลังจากนั้น** ให้รัน `--dry-run` ก่อนเสมอ

ถ้า rejoin ไม่ผ่าน ทางถอยคือ `repmgr standby clone` ใหม่ (~20 GB) — จดเวลาที่ใช้ไว้ด้วย

---

### 2.4 · 🟠 switchover กลับ — ไม่เคยทดสอบเลยสักครั้ง

```bash
repmgr standby switchover -f /etc/repmgr.conf --siblings-follow --dry-run
```

คำสั่งที่จะใช้เมื่ออยากย้าย primary กลับหลังกู้เสร็จ **ไม่เคยรันบนคลัสเตอร์นี้เลย** ต่างจาก failover ตรงที่
เป็นการสลับแบบตั้งใจ (ปิด primary เก่าอย่างสุภาพก่อน) จึงมีเงื่อนไขคนละชุด — เช่นต้อง ssh ข้ามเครื่องได้ในสิทธิ์ postgres

---

### 2.5 · 🟠 รัน `install-pgpool.sh` ที่แก้แล้วจริงสักครั้ง

ผมแก้ 3 จุด (`--backend-app-names`, `.pcppass` เป็น `*:`, usage) แต่**ยืนยันแค่ `bash -n` กับทดสอบ guard
ที่ใส่ค่าไม่ครบจำนวนเท่านั้น — ยังไม่เคยรัน end-to-end บนเครื่องจริง**

ทดสอบบน pgpool node ที่**ไม่ได้ถือ VIP** แล้วเทียบ config ที่ generate ออกมากับของเดิม:

```bash
ssh <pgpool-ที่ไม่มี-VIP> "sudo /tmp/install-pgpool.sh --nodes=... --node-id=N \
  --backends=... --backend-app-names=ppm,ppr1,ppr2 --pcp-password='<ค่าเดียวกับ node อื่น>' ..."
```

**ต้องเช็คหลังรัน:** `backend_application_name0..2` เป็น `ppm/ppr1/ppr2` ไม่ใช่ `node0/1/2` ·
`.pcppass` ขึ้นต้นด้วย `*:` · PCP auth ยังผ่านครบ 9 เส้นทาง · node กลับเข้า watchdog cluster ได้

> ⚠️ script เขียนทับ `pgpool.conf` และ `pool_hba.conf` **ทั้งไฟล์ทุกครั้ง** — ถ้าลืมส่ง flag ใดไป
> การตั้งค่าที่แก้ด้วยมือจะหายเงียบ

---

### 2.6 · 🟠 เพดาน connection — คณิตศาสตร์ไม่ลงตัวและไม่เคยทดสอบใต้โหลด

```
pgpool: num_init_children = 300 × max_pool = 4   →  สูงสุด 1,200 connection ต่อ pgpool node
PostgreSQL: max_connections = 400
```

pgpool อาจพยายามเปิด backend connection **มากกว่าที่ PostgreSQL ยอมรับถึง 3 เท่า** ตอนนี้ยังไม่เจอปัญหา
เพราะโหลดจริงต่ำ (เคยเห็นสูงสุด ~124 connection) แต่เป็นกำแพงที่รออยู่

**ทดสอบ:** ยิง connection พร้อมกันเพิ่มขึ้นเรื่อยๆ ผ่าน VIP แล้วดูว่าเจอ
`FATAL: sorry, too many clients already` ที่จำนวนเท่าไหร่ · ถ้าเจอ ต้องลด `num_init_children`
หรือเพิ่ม `max_connections` (แต่ระวัง RAM ต่อ connection)

---

### 2.7 · 🟡 failover ใต้โหลดจริง

ซ้อมทั้ง 3 ครั้งที่ผ่านมาทำตอนระบบเกือบว่าง ตัวเลขที่ได้ (2 วิ / 6 วิ) จึงเป็น **best case**
ควรซ้อมซ้ำขณะมี traffic จริงเพื่อรู้ตัวเลขที่ใช้วางแผนได้ — โดยเฉพาะข้อ 2.2 ที่ primary ใหม่ต้องรับโหลดทั้งหมด
ด้วย page cache ที่ยังเย็นอยู่

---

### 2.8 · 🟡 replication slot ทำ disk ของ primary เต็ม

```
max_slot_wal_keep_size = -1   # ไม่จำกัด
wal_keep_size = 0
```

ถ้า standby ดับนานๆ slot ของมันจะสั่งให้ primary เก็บ WAL ไว้**ตลอดไป** จน `pg_wal` กิน disk หมดแล้ว
**primary จะ PANIC และดับ** — เคยเกิดแล้วตอน restore เมื่อ 2026-08-25

**ทดสอบ:** ปิด standby หนึ่งตัวทิ้งไว้ แล้วเฝ้าดู `pg_wal` โตขึ้นเท่าไหร่ต่อชั่วโมงในโหลดปกติ
เพื่อคำนวณว่า "ปล่อย standby ดับได้กี่วันก่อน primary ตาย" · หรือตั้ง `max_slot_wal_keep_size`
เป็นค่าจำกัดไปเลย (ยอมให้ slot หลุดดีกว่าให้ primary ตาย)

```sql
select slot_name, active,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) as wal_held
from pg_replication_slots order by 3 desc;
```

---

### 2.9 · 🟡 alert ทั้ง 3 ตัวยังไม่มี — จึงไม่มีอะไรให้ทดสอบว่า "ตรวจจับได้จริงไหม"

| Alert | ทำไมต้องมี |
|---|---|
| `status != pg_status` เกิน 1 นาที | เคสวันที่ 29 ส.ค. ค้าง **2 วัน** เพราะไม่มี alert ตัวนี้ |
| `pgpool_watchdog_scrape_success == 0` | ใช้ credential เส้นทางเดียวกับ event hook — **ตัวเดียวเฝ้าได้ทั้ง monitoring และ auto-reattach** |
| จำนวน node ที่ `role = primary` != 1 | จับ split-brain |

ตั้งเสร็จแล้วต้อง**ทดสอบว่ามันยิงจริง** ด้วยการทำให้เงื่อนไขเป็นจริงชั่วคราว ไม่ใช่แค่ตั้งแล้วเชื่อ

---

### 2.10 · 🟡 split-brain — ไม่เคยทดสอบและ guard ปิดอยู่

`detach_false_primary = 0` (ปิด) แปลว่าถ้ามี primary สองตัวพร้อมกัน pgpool จะไม่ตัดตัวปลอมออกให้เอง
ยังไม่เคยทดสอบว่าเกิดอะไรขึ้นจริง และ runbook ปัจจุบันบอกแค่ว่า "หยุดทุกอย่าง escalate ทันที"

ทดสอบได้เฉพาะบนคลัสเตอร์ทดลอง **ห้ามทำบน production**

---

## 3 · ที่ต้องแก้ ไม่ใช่แค่ทดสอบ

### 3.1 · 🔴 VM ทั้ง 7 ตัวอยู่บน hypervisor เดียว

```
pvecm status → corosync.conf does not exist - is this node part of a cluster?
pvesh get /nodes → node เดียว
```

PostgreSQL ×3 + pgpool ×3 + เครื่องแอป อยู่บนเครื่องเดียวกันหมด · HA ทุกอย่างที่ทำมาป้องกันได้เฉพาะ
กรณี VM ตัวใดตัวหนึ่งตาย ถ้า host ดับคือดับพร้อมกันหมด **และเครื่องนี้เคยดับเองมาแล้วจริง**
(ดู `runbook-proxmox-cpu-mce.html`)

ทางแก้ทางเดียวคือกระจาย VM ออกไปมากกว่าหนึ่ง hypervisor — อย่างน้อยให้ standby หนึ่งตัว + pgpool หนึ่งตัว
อยู่คนละเครื่องกับ primary

### 3.2 · 🟠 มองไม่เห็นว่า query ไหนช้า

```
shared_preload_libraries = repmgr        # ไม่มี pg_stat_statements
log_min_duration_statement = -1          # ไม่ log slow query เลย
track_io_timing = off
```

ตอนนี้ถ้ามีคนบอกว่า "ระบบช้า" **ไม่มีเครื่องมือตอบเลยว่าช้าตรงไหน** · เพิ่ม `pg_stat_statements`
เข้า `shared_preload_libraries` (ต้อง restart) และตั้ง `log_min_duration_statement` เป็นค่าที่สมเหตุผล
เป็นงานที่คุ้มที่สุดต่อแรงที่ลง

### 3.3 · 🟠 ค่า memory / planner ยังเป็น default

| Setting | ค่าปัจจุบัน | หมายเหตุ |
|---|---|---|
| `shared_buffers` | **128 MB** | ค่า default ของ PostgreSQL บน DB ที่ใหญ่ ~20 GB — ระบบพึ่ง OS page cache แทนทั้งหมด |
| `random_page_cost` | **4** | ค่า default ของจานหมุน ทำให้ planner หลีกเลี่ยง index scan · ถ้า storage เป็น SSD ควรใกล้ 1.1 |
| `effective_cache_size` | 4 GB | ควรสอดคล้องกับ RAM จริงหลังปรับสเปคใหม่ |

**อย่าเพิ่งแก้จนกว่าจะทำ 3.2 เสร็จ** — ไม่งั้นจะไม่รู้ว่าแก้แล้วดีขึ้นหรือแย่ลง

### 3.4 · 🟡 pool_hba ยังเปิด `0.0.0.0/0` และแอปต่อด้วย superuser

แผนเต็มอยู่ใน `pgpool-access-control-hardening.html` แล้ว · ลำดับคือ **สร้าง role แอปที่ไม่ใช่ superuser
→ ใส่ `pool_passwd` ทุก node → เปลี่ยน connection string → แล้วค่อยใส่ `reject`** สลับลำดับเมื่อไหร่ระบบดับทันที

### 3.5 · 🟡 ค้างเล็กๆ

- `postgres_exporter` 0.15.0 บน replica พังกับ PostgreSQL 18 (`stat_bgwriter` / `checkpoints_timed`)
- `jasper-server-dev` (VMID 1000) หยุดอยู่แต่จอง memory 8,192 MB — ถ้าใครสตาร์ท host จะ commit เกิน RAM จริง
- pgpool2/3 ยังจอง 3,072 (balloon 2,048) ลดเหลือ 2,048 ได้อีก แต่ได้คืนน้อย ไม่เร่งด่วน
- `priority` ของ repmgr = 100 เท่ากันทั้ง 3 node → เลือกไม่ได้ว่าอยากให้ตัวไหนขึ้นเป็น primary

---

## 4 · คำสั่งที่ใช้บ่อย

```bash
# สามความเห็นที่ต้องตรงกัน — ถ้าไม่ตรงคือปัญหา
psql -h <vip> -p 5432 -U postgres -c "show pool_nodes;"
ssh ovh-ppm "sudo -u postgres repmgr cluster show --compact"
for h in ovh-pgpool1 ovh-pgpool2 ovh-pgpool3; do
  echo -n "$h: "; ssh $h "ip -4 -o addr show | grep -c '<vip>'"
done

# PCP auth ครบ 9 เส้นทาง (อ่านอย่างเดียว รันได้ตลอด — ใส่ใน checklist หลัง deploy ทุกครั้ง)
for n in ovh-ppm ovh-ppr1 ovh-ppr2; do
  ssh $n 'for h in <pgpool1> <pgpool2> <pgpool3>; do
    sudo -u postgres env HOME=/var/lib/postgresql \
      pcp_node_info -h $h -p 9898 -U pgpool_admin -w -n 0 2>&1 | head -1
  done'
done
```

**ลำดับที่แนะนำ:** 2.1 (backup) → 2.2 + 2.3 (failover จริง + กู้กลับ) → 2.9 (alert) → 3.2 (มองเห็น query) → ที่เหลือ

**ข้อเตือนสำหรับคนทำต่อ:** เอกสารชุดนี้เคยมีข้อความที่ผิดข้อเท็จจริงค้างอยู่หลายเดือน (เช่น "pgpool ไม่มี
auto re-attach" ทั้งที่มี, และหมายเหตุ balloon ที่ล้าสมัย) เพราะบันทึกจากความเข้าใจ ณ ตอนนั้นแล้วไม่มีใครกลับมาตรวจ
— **ถ้าทดสอบแล้วได้ผลต่างจากที่เขียนไว้ ให้แก้เอกสารทันที** อย่าปล่อยไว้
