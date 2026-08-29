import { useEffect, useMemo, useState } from "react";
import { apiJson, postJson } from "../adminApi";
import { bloodGroups } from "../data";

type D = {
  id: number;
  name: string;
  blood_group: string;
  phone: string;
  area: string;
  last_donation_date: string | null;
  donation_count: number;
  eligible_from?: string | null;
  availability: "available" | "unavailable";
  status: "pending" | "approved" | "rejected";
};

const approvalLabel: Record<D["status"], string> = {
  pending: "অপেক্ষমাণ",
  approved: "অনুমোদিত",
  rejected: "প্রত্যাখ্যাত",
};

const availabilityLabel: Record<D["availability"], string> = {
  available: "উপলভ্য",
  unavailable: "অনুপলভ্য",
};

function statusClass(status: D["status"]) {
  return `blood-status-select blood-status-${status}`;
}

function availabilityClass(value: D["availability"]) {
  return `blood-availability-badge ${value === "available" ? "is-available" : "is-unavailable"}`;
}

export function BloodDonorsManagement() {
  const [rows, setRows] = useState<D[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [savingCount, setSavingCount] = useState<number | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const d = await apiJson<{ donors: D[]; available_count: number }>("/api/blood.php?action=donors");
      setRows(d.donors || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "রক্তদাতা লোড করা যায়নি।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const update = async (id: number, status: D["status"]) => {
    try {
      await postJson("/api/blood.php?action=donor-status", { id, status });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approval update করা যায়নি।");
    }
  };

  const updateDonationCount = async (id: number, value: string) => {
    const count = Math.max(0, Math.floor(Number(value) || 0));
    try { setSavingCount(id); await postJson('/api/blood.php?action=donor-count', { id, donation_count: count }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'রক্তদানের সংখ্যা আপডেট করা যায়নি।'); }
    finally { setSavingCount(null); }
  };

  const remove = async (id: number) => {
    if (!confirm("এই donor record মুছে ফেলতে চান?")) return;
    try {
      await postJson("/api/blood.php?action=delete-donor", { id });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Donor মুছে ফেলা যায়নি।");
    }
  };

  const areas = useMemo(() => Array.from(new Set(rows.map((r) => r.area).filter(Boolean))).sort(), [rows]);
  const availableCount = useMemo(
    () => rows.filter((r) => r.status === "approved" && r.availability === "available").length,
    [rows]
  );
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesSearch = !q || [r.name, r.phone, r.area, r.blood_group].some((v) => String(v || "").toLowerCase().includes(q));
      const matchesGroup = groupFilter === "all" || r.blood_group === groupFilter;
      const matchesArea = areaFilter === "all" || r.area === areaFilter;
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      const matchesAvailability = availabilityFilter === "all" || r.availability === availabilityFilter;
      return matchesSearch && matchesGroup && matchesArea && matchesStatus && matchesAvailability;
    });
  }, [rows, search, groupFilter, areaFilter, statusFilter, availabilityFilter]);

  const resetFilters = () => {
    setSearch(""); setGroupFilter("all"); setAreaFilter("all"); setStatusFilter("all"); setAvailabilityFilter("all");
  };

  return (
    <section className="admin-module">
      <div className="admin-module-header">
        <div>
          <span className="admin-kicker">BLOOD SERVICE</span>
          <h1>রক্তদাতা তালিকা</h1>
          <p>নিবন্ধিত donor-এর approval পরিচালনা করুন। Availability শেষ রক্তদানের তারিখ থেকে ৪ মাস অনুযায়ী স্বয়ংক্রিয়ভাবে নির্ধারিত হয়।</p>
        </div>
        <button className="admin-secondary-button" onClick={load}>↻ Refresh</button>
      </div>

      {error && <div className="admin-data-notice">{error}</div>}

      <div className="blood-donor-summary-grid">
        <div className="blood-donor-summary-card available">
          <span className="summary-icon">🩸</span>
          <div><small>বর্তমানে উপলভ্য রক্তদাতা</small><strong>{availableCount}</strong><span>শুধু approved + eligible donor</span></div>
        </div>
        <div className="blood-donor-summary-card total">
          <span className="summary-icon">👥</span>
          <div><small>মোট রক্তদাতা</small><strong>{rows.length}</strong><span>সব registered donor</span></div>
        </div>
      </div>

      <div className="admin-form-card blood-donor-filters">
        <div className="blood-filter-heading"><div><span className="admin-kicker">FILTER</span><h2>রক্তদাতা খুঁজুন</h2></div><button className="admin-secondary-button" type="button" onClick={resetFilters}>Reset</button></div>
        <div className="admin-form-grid blood-filter-grid">
          <label className="full">নাম / মোবাইল / এলাকা / রক্তের গ্রুপ
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search করুন..." />
          </label>
          <label>রক্তের গ্রুপ
            <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}><option value="all">সব গ্রুপ</option>{bloodGroups.map((g) => <option key={g}>{g}</option>)}</select>
          </label>
          <label>এলাকা
            <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}><option value="all">সব এলাকা</option>{areas.map((a) => <option key={a}>{a}</option>)}</select>
          </label>
          <label>Approval
            <select className={statusFilter === "all" ? "" : statusClass(statusFilter as D["status"])} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">সব status</option><option value="pending">অপেক্ষমাণ</option><option value="approved">অনুমোদিত</option><option value="rejected">প্রত্যাখ্যাত</option></select>
          </label>
          <label>Availability
            <select className={availabilityFilter === "available" ? "blood-filter-available" : availabilityFilter === "unavailable" ? "blood-filter-unavailable" : ""} value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value)}><option value="all">সব</option><option value="available">উপলভ্য</option><option value="unavailable">অনুপলভ্য</option></select>
          </label>
        </div>
        <div className="blood-filter-result">{filteredRows.length} জন donor দেখানো হচ্ছে</div>
      </div>

      <div className="admin-form-card admin-table-card">
        {loading ? <div className="admin-list-empty">রক্তদাতা লোড হচ্ছে...</div> : filteredRows.length === 0 ? <div className="admin-list-empty">এই filter অনুযায়ী কোনো donor পাওয়া যায়নি।</div> :
          <div className="admin-table-wrap"><table className="admin-table blood-donor-table"><thead><tr><th>নাম</th><th>রক্ত</th><th>মোবাইল</th><th>এলাকা</th><th>শেষ রক্তদান</th><th>রক্তদান সংখ্যা</th><th>Approval</th><th>Availability</th><th>Action</th></tr></thead>
            <tbody>{filteredRows.map((r) => <tr key={r.id}>
              <td><strong>{r.name}</strong></td>
              <td><b className="blood-badge">{r.blood_group}</b></td>
              <td>{r.phone}</td>
              <td>{r.area}</td>
              <td><span className={`blood-date-badge ${r.availability === "available" ? "eligible" : "waiting"}`}>{r.last_donation_date || "কখনও দেননি"}</span>{r.eligible_from && <small>{r.availability === "available" ? `উপলভ্য হয়েছে: ${r.eligible_from}` : `উপলভ্য হবে: ${r.eligible_from}`}</small>}</td>
              <td><div className="blood-count-editor"><input type="number" min="0" value={r.donation_count ?? 0} disabled={savingCount === r.id} onChange={(e) => setRows(prev => prev.map(x => x.id === r.id ? {...x, donation_count: Math.max(0, Number(e.target.value) || 0)} : x))} onBlur={(e) => updateDonationCount(r.id, e.target.value)} /><span>বার</span></div></td>
              <td><select className={statusClass(r.status)} value={r.status} onChange={(e) => update(r.id, e.target.value as D["status"])}><option value="pending">অপেক্ষমাণ</option><option value="approved">অনুমোদিত</option><option value="rejected">প্রত্যাখ্যাত</option></select></td>
              <td><span className={availabilityClass(r.availability)}><i />{availabilityLabel[r.availability]}</span></td>
              <td><button className="table-danger" onClick={() => remove(r.id)}>Delete</button></td>
            </tr>)}</tbody></table></div>}
      </div>
    </section>
  );
}
