import { useState, useEffect, useRef } from "react";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const CLINICS = [
  { id: 1, name: "RUBI Clinic", doctor: "Dr. Mehrin Fatema", specialty: "General Physician", phone: "+91 9876543210", slots: ["09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","02:00 PM","02:30 PM","03:00 PM","03:30 PM","04:00 PM","04:30 PM"] },
  { id: 2, name: "CityMed Clinic", doctor: "Dr. Rahul Sharma", specialty: "Pediatrician", phone: "+91 9845671230", slots: ["08:00 AM","08:30 AM","09:00 AM","10:00 AM","11:00 AM","03:00 PM","04:00 PM","05:00 PM"] },
  { id: 3, name: "HealthPlus Centre", doctor: "Dr. Anjali Verma", specialty: "Dermatologist", phone: "+91 9001234567", slots: ["10:00 AM","10:30 AM","11:00 AM","11:30 AM","02:00 PM","03:00 PM","04:00 PM"] },
];

const INITIAL_APPOINTMENTS = [
  { id: 1, clinicId: 1, patient: "Mohammed Iqbal", phone: "+91 9876001122", date: "2026-06-27", slot: "09:00 AM", reason: "Fever & Cold", status: "confirmed", bookedAt: "2026-06-26 10:30" },
  { id: 2, clinicId: 1, patient: "Sunita Patil", phone: "+91 9123456780", date: "2026-06-27", slot: "10:00 AM", reason: "Checkup", status: "confirmed", bookedAt: "2026-06-26 11:00" },
  { id: 3, clinicId: 2, patient: "Rahul More", phone: "+91 9988776655", date: "2026-06-27", slot: "08:00 AM", reason: "Child vaccination", status: "pending", bookedAt: "2026-06-26 09:15" },
  { id: 4, clinicId: 1, patient: "Fatima Sheikh", phone: "+91 9765432100", date: "2026-06-28", slot: "11:00 AM", reason: "BP checkup", status: "confirmed", bookedAt: "2026-06-26 14:20" },
  { id: 5, clinicId: 3, patient: "Priya Desai", phone: "+91 9001122334", date: "2026-06-28", slot: "10:30 AM", reason: "Skin rash", status: "cancelled", bookedAt: "2026-06-25 16:00" },
];

// ─── AI BOT LOGIC ─────────────────────────────────────────────────────────────
function getBotReply(userMsg, state, clinic, appointments, setAppointments) {
  const msg = userMsg.toLowerCase().trim();
  const today = new Date().toISOString().split("T")[0];

  if (state.step === "idle") {
    if (msg.includes("book") || msg.includes("appointment") || msg.includes("appoint") || msg.includes("बुक") || msg.includes("doctor") || msg.includes("hi") || msg.includes("hello") || msg.includes("helo") || msg.includes("namaste")) {
      return { text: `🏥 *Welcome to ${clinic.name}!*\n\nMai aapki appointment book karne mein madad karunga. 😊\n\nKripya apna *naam* batayein:`, step: "ask_name" };
    }
    if (msg.includes("cancel")) return { text: "❌ Appointment cancel karne ke liye apna *naam aur date* batayein.", step: "idle" };
    if (msg.includes("time") || msg.includes("slot") || msg.includes("available")) {
      return { text: `⏰ *Available Slots - ${clinic.name}*\n\n${clinic.slots.map((s,i) => `${i+1}. ${s}`).join("\n")}\n\nAppointment book karne ke liye *"book"* type karein.`, step: "idle" };
    }
    return { text: `🙏 Namaste! Mai *${clinic.name}* ka AI assistant hoon.\n\nMai aapki madad kar sakta hoon:\n\n📅 *"book"* - Appointment book karein\n⏰ *"slots"* - Available times dekhen\n❌ *"cancel"* - Appointment cancel karein`, step: "idle" };
  }

  if (state.step === "ask_name") {
    if (msg.length < 2) return { text: "Kripya apna sahi naam batayein:", step: "ask_name" };
    return { text: `Shukriya *${userMsg}*! 😊\n\nApna *mobile number* batayein (WhatsApp wala):`, step: "ask_phone", name: userMsg };
  }

  if (state.step === "ask_phone") {
    const digits = msg.replace(/\D/g, "");
    if (digits.length < 10) return { text: "Kripya 10 digit ka *valid mobile number* batayein:", step: "ask_phone" };
    return { text: `✅ Number save ho gaya!\n\nAb *appointment ki date* batayein:\n📅 Format: DD/MM/YYYY\n(jaise: 28/06/2026)`, step: "ask_date", phone: userMsg };
  }

  if (state.step === "ask_date") {
    const parts = msg.replace(/\//g,"-").split("-");
    if (parts.length !== 3) return { text: "Kripya sahi date format mein batayein:\n📅 DD/MM/YYYY (jaise: 28/06/2026)", step: "ask_date" };
    const date = `${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`;
    const bookedSlots = appointments.filter(a => a.clinicId === clinic.id && a.date === date && a.status !== "cancelled").map(a => a.slot);
    const available = clinic.slots.filter(s => !bookedSlots.includes(s));
    if (available.length === 0) return { text: `😔 Is date pe saare slots full hain.\n\nKripya *doosri date* choose karein:`, step: "ask_date" };
    return { text: `📅 *${userMsg}* ke liye available slots:\n\n${available.map((s,i) => `*${i+1}.* ${s}`).join("\n")}\n\nKaunsa slot chahiye? (number type karein)`, step: "ask_slot", date, availableSlots: available };
  }

  if (state.step === "ask_slot") {
    const num = parseInt(msg) - 1;
    if (isNaN(num) || num < 0 || num >= state.availableSlots.length) return { text: `Kripya 1 se ${state.availableSlots.length} ke beech number type karein:`, step: "ask_slot" };
    const slot = state.availableSlots[num];
    return { text: `👨‍⚕️ Appointment ka *reason* batayein:\n(jaise: fever, checkup, BP, etc.)`, step: "ask_reason", slot };
  }

  if (state.step === "ask_reason") {
    const newAppt = { id: Date.now(), clinicId: clinic.id, patient: state.name, phone: state.phone, date: state.date, slot: state.slot, reason: userMsg, status: "confirmed", bookedAt: new Date().toLocaleString("en-IN") };
    setAppointments(prev => [newAppt, ...prev]);
    return {
      text: `🎉 *Appointment Confirmed!*\n\n━━━━━━━━━━━━━━━\n👤 *Patient:* ${state.name}\n📞 *Phone:* ${state.phone}\n🏥 *Clinic:* ${clinic.name}\n👨‍⚕️ *Doctor:* ${clinic.doctor}\n📅 *Date:* ${state.date}\n⏰ *Time:* ${state.slot}\n💊 *Reason:* ${userMsg}\n━━━━━━━━━━━━━━━\n\n✅ Aapko confirmation message bhej diya jayega.\n\nAur koi madad chahiye? *"book"* type karein.`,
      step: "idle"
    };
  }
  return { text: "Samajh nahi aaya. *'book'* type karein appointment ke liye.", step: "idle" };
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("dashboard"); // dashboard | chat | appointments | settings
  const [selectedClinic, setSelectedClinic] = useState(CLINICS[0]);
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [chatMessages, setChatMessages] = useState([]);
  const [input, setInput] = useState("");
  const [botState, setBotState] = useState({ step: "idle" });
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (view === "chat" && chatMessages.length === 0) {
      setChatMessages([{ from: "bot", text: `🙏 Namaste! Mai *${selectedClinic.name}* ka AI assistant hoon.\n\nMai aapki madad kar sakta hoon:\n\n📅 *"book"* - Appointment book karein\n⏰ *"slots"* - Available times dekhen\n❌ *"cancel"* - Appointment cancel karein` }]);
    }
  }, [view]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setChatMessages(prev => [...prev, { from: "user", text: userMsg }]);
    setInput("");
    setTimeout(() => {
      const reply = getBotReply(userMsg, botState, selectedClinic, appointments, setAppointments);
      setBotState(prev => ({ ...prev, ...reply, text: undefined }));
      setChatMessages(prev => [...prev, { from: "bot", text: reply.text }]);
    }, 600);
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppts = appointments.filter(a => a.date === todayStr && a.status !== "cancelled");
  const totalAppts = appointments.filter(a => a.status !== "cancelled").length;
  const clinicAppts = appointments.filter(a => a.clinicId === selectedClinic.id);
  const filteredAppts = clinicAppts.filter(a => {
    const dateOk = filterDate ? a.date === filterDate : true;
    const statusOk = filterStatus === "all" ? true : a.status === filterStatus;
    return dateOk && statusOk;
  });

  const formatMsg = (text) => text.split("\n").map((line, i) => {
    const parts = line.split(/\*(.*?)\*/g);
    return <div key={i}>{parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}</div>;
  });

  const statusColor = (s) => ({ confirmed: "#25d366", pending: "#f59e0b", cancelled: "#ef4444" }[s] || "#888");
  const statusBg = (s) => ({ confirmed: "#f0fff4", pending: "#fffbeb", cancelled: "#fef2f2" }[s] || "#f5f5f5");

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Segoe UI', sans-serif", background: "#f0f2f5", overflow: "hidden" }}>

      {/* ── SIDEBAR ── */}
      <div style={{ width: sidebarOpen ? 240 : 64, background: "linear-gradient(180deg,#075e54 0%,#128c7e 100%)", color: "#fff", display: "flex", flexDirection: "column", transition: "width 0.3s", overflow: "hidden", flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#25d366", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>💬</div>
          {sidebarOpen && <div><div style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap" }}>ClinicBot SaaS</div><div style={{ fontSize: 10, opacity: 0.7 }}>AI Appointment System</div></div>}
        </div>

        {/* Clinic Selector */}
        {sidebarOpen && (
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Active Clinic</div>
            <select value={selectedClinic.id} onChange={e => { setSelectedClinic(CLINICS.find(c => c.id === parseInt(e.target.value))); setChatMessages([]); setBotState({ step: "idle" }); }}
              style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 12 }}>
              {CLINICS.map(c => <option key={c.id} value={c.id} style={{ color: "#000" }}>{c.name}</option>)}
            </select>
          </div>
        )}

        {/* Nav */}
        {[
          { id: "dashboard", icon: "📊", label: "Dashboard" },
          { id: "chat", icon: "💬", label: "WhatsApp Bot" },
          { id: "appointments", icon: "📅", label: "Appointments" },
          { id: "settings", icon: "⚙️", label: "Settings" },
        ].map(item => (
          <div key={item.id} onClick={() => setView(item.id)}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer", background: view === item.id ? "rgba(255,255,255,0.15)" : "transparent", borderLeft: view === item.id ? "3px solid #25d366" : "3px solid transparent", transition: "all 0.2s" }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
            {sidebarOpen && <span style={{ fontSize: 13, fontWeight: view === item.id ? 600 : 400, whiteSpace: "nowrap" }}>{item.label}</span>}
          </div>
        ))}

        {/* Collapse btn */}
        <div style={{ marginTop: "auto", padding: "16px", borderTop: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", textAlign: "center" }}
          onClick={() => setSidebarOpen(!sidebarOpen)}>
          <span style={{ fontSize: 16 }}>{sidebarOpen ? "◀" : "▶"}</span>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ background: "#fff", padding: "14px 24px", borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: "#075e54" }}>
              {{ dashboard: "📊 Dashboard", chat: "💬 WhatsApp Bot Simulator", appointments: "📅 Appointments", settings: "⚙️ Settings" }[view]}
            </div>
            <div style={{ fontSize: 12, color: "#888" }}>{selectedClinic.name} · {selectedClinic.doctor}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: "#25d366", color: "#fff", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 600 }}>🟢 Bot Active</div>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#075e54", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>A</div>
          </div>
        </div>

        {/* ── DASHBOARD ── */}
        {view === "dashboard" && (
          <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Today's Appointments", value: todayAppts.length, icon: "📅", color: "#075e54", bg: "#e8f5e9" },
                { label: "Total Appointments", value: totalAppts, icon: "📋", color: "#1565c0", bg: "#e3f2fd" },
                { label: "Active Clinics", value: CLINICS.length, icon: "🏥", color: "#6a1b9a", bg: "#f3e5f5" },
                { label: "Bot Conversations", value: "24/7", icon: "🤖", color: "#e65100", bg: "#fff3e0" },
              ].map((s, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{s.label}</div>
                    </div>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{s.icon}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Today's appointments */}
              <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ fontWeight: 700, marginBottom: 16, color: "#075e54" }}>📅 Today's Appointments</div>
                {todayAppts.length === 0 ? <div style={{ color: "#aaa", textAlign: "center", padding: 20 }}>No appointments today</div> :
                  todayAppts.slice(0, 5).map(a => (
                    <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#075e54" }}>{a.patient[0]}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{a.patient}</div>
                        <div style={{ fontSize: 11, color: "#888" }}>{a.slot} · {a.reason}</div>
                      </div>
                      <div style={{ background: statusBg(a.status), color: statusColor(a.status), borderRadius: 10, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>{a.status}</div>
                    </div>
                  ))
                }
              </div>

              {/* Clinic info */}
              <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ fontWeight: 700, marginBottom: 16, color: "#075e54" }}>🏥 Clinic Overview</div>
                {CLINICS.map(c => {
                  const cAppts = appointments.filter(a => a.clinicId === c.id && a.status !== "cancelled").length;
                  return (
                    <div key={c.id} style={{ padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: "#888" }}>{c.doctor} · {c.specialty}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 700, color: "#075e54" }}>{cAppts}</div>
                          <div style={{ fontSize: 10, color: "#aaa" }}>appointments</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 6, background: "#f0f0f0", borderRadius: 4, height: 4 }}>
                        <div style={{ width: `${Math.min(100, cAppts * 15)}%`, height: "100%", background: "#25d366", borderRadius: 4 }} />
                      </div>
                    </div>
                  );
                })}

                <div style={{ marginTop: 16, background: "#e8f5e9", borderRadius: 8, padding: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#075e54", fontWeight: 600 }}>🤖 Bot kaam kar raha hai!</div>
                  <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>24/7 WhatsApp pe available</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CHAT SIMULATOR ── */}
        {view === "chat" && (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {/* Phone frame */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f0ece3", padding: 24 }}>
              <div style={{ width: 360, height: "85vh", maxHeight: 680, background: "#fff", borderRadius: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", overflow: "hidden", border: "8px solid #1a1a1a" }}>
                {/* WA Header */}
                <div style={{ background: "#075e54", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#25d366", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏥</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{selectedClinic.name}</div>
                    <div style={{ color: "#b2dfdb", fontSize: 10 }}>🟢 Online · AI Bot Active</div>
                  </div>
                  <div style={{ color: "#fff", fontSize: 16 }}>⋮</div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflow: "auto", padding: "12px 10px", background: "#ece5dd", display: "flex", flexDirection: "column", gap: 8 }}>
                  {chatMessages.map((msg, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: msg.from === "user" ? "flex-end" : "flex-start" }}>
                      <div style={{ maxWidth: "78%", background: msg.from === "user" ? "#dcf8c6" : "#fff", borderRadius: msg.from === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px", padding: "8px 10px", boxShadow: "0 1px 2px rgba(0,0,0,0.1)", fontSize: 12, lineHeight: 1.5 }}>
                        {formatMsg(msg.text)}
                        <div style={{ fontSize: 9, color: "#999", textAlign: "right", marginTop: 3 }}>{new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div style={{ padding: "8px 10px", background: "#f0f0f0", display: "flex", gap: 8, alignItems: "center" }}>
                  <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message..." style={{ flex: 1, padding: "8px 12px", borderRadius: 20, border: "none", fontSize: 12, background: "#fff", outline: "none" }} />
                  <div onClick={sendMessage} style={{ width: 36, height: 36, borderRadius: "50%", background: "#075e54", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16 }}>➤</div>
                </div>
              </div>
            </div>

            {/* Quick test panel */}
            <div style={{ width: 220, background: "#fff", borderLeft: "1px solid #e0e0e0", padding: 16, overflowY: "auto" }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: "#075e54" }}>⚡ Quick Test</div>
              {["Hi", "book", "Arjun", "9876543210", "28/06/2026", "1", "Fever"].map((t, i) => (
                <div key={i} onClick={() => { setInput(t); }} style={{ background: "#f5f5f5", border: "1px solid #e0e0e0", borderRadius: 8, padding: "6px 10px", marginBottom: 6, cursor: "pointer", fontSize: 11, color: "#333" }}>
                  {t}
                </div>
              ))}
              <div style={{ marginTop: 16, padding: 12, background: "#e8f5e9", borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#075e54", marginBottom: 6 }}>📋 Bot Steps:</div>
                {["1. Hi/Hello", "2. Name batao", "3. Phone number", "4. Date (DD/MM/YYYY)", "5. Slot number", "6. Reason"].map((s, i) => (
                  <div key={i} style={{ fontSize: 10, color: "#555", marginBottom: 2 }}>{s}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── APPOINTMENTS ── */}
        {view === "appointments" && (
          <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
            {/* Filters */}
            <div style={{ background: "#fff", borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 13 }} />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 13 }}>
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <div onClick={() => { setFilterDate(""); setFilterStatus("all"); }} style={{ padding: "8px 12px", background: "#f5f5f5", border: "1px solid #ddd", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>Clear</div>
              <div style={{ marginLeft: "auto", fontSize: 13, color: "#888" }}>{filteredAppts.length} appointments</div>
            </div>

            {/* Table */}
            <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#075e54", color: "#fff" }}>
                    {["Patient", "Phone", "Date", "Time", "Reason", "Status", "Booked At", "Action"].map(h => (
                      <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAppts.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#aaa" }}>No appointments found</td></tr>
                  ) : filteredAppts.map((a, i) => (
                    <tr key={a.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa", borderBottom: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600 }}>{a.patient}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: "#555" }}>{a.phone}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12 }}>{a.date}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "#075e54" }}>{a.slot}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: "#555" }}>{a.reason}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ background: statusBg(a.status), color: statusColor(a.status), borderRadius: 10, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>{a.status}</span>
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 11, color: "#999" }}>{a.bookedAt}</td>
                      <td style={{ padding: "10px 14px" }}>
                        {a.status !== "cancelled" && (
                          <span onClick={() => setAppointments(prev => prev.map(x => x.id === a.id ? { ...x, status: "cancelled" } : x))}
                            style={{ color: "#ef4444", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>Cancel</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {view === "settings" && (
          <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Clinic settings */}
              <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ fontWeight: 700, marginBottom: 16, color: "#075e54", fontSize: 15 }}>🏥 Clinic Settings</div>
                {[{ label: "Clinic Name", value: selectedClinic.name }, { label: "Doctor Name", value: selectedClinic.doctor }, { label: "Specialty", value: selectedClinic.specialty }, { label: "Phone", value: selectedClinic.phone }].map((f, i) => (
                  <div key={i} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{f.label}</div>
                    <input defaultValue={f.value} style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }} />
                  </div>
                ))}
                <div style={{ background: "#075e54", color: "#fff", padding: "10px 20px", borderRadius: 8, textAlign: "center", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Save Settings</div>
              </div>

              {/* Bot settings */}
              <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ fontWeight: 700, marginBottom: 16, color: "#075e54", fontSize: 15 }}>🤖 Bot Settings</div>
                {[{ label: "Bot Language", options: ["Hindi + English (Hinglish)", "English Only", "Hindi Only"] }, { label: "Working Hours", options: ["24/7 Active", "9 AM - 6 PM", "Custom"] }, { label: "Auto Confirm", options: ["Auto Confirm", "Manual Confirm"] }].map((f, i) => (
                  <div key={i} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{f.label}</div>
                    <select style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 13 }}>
                      {f.options.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}

                {/* WhatsApp API info */}
                <div style={{ background: "#e8f5e9", borderRadius: 8, padding: 12, marginTop: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#075e54", marginBottom: 6 }}>📱 WhatsApp API Connect</div>
                  <div style={{ fontSize: 11, color: "#555", marginBottom: 8 }}>Real WhatsApp se connect karne ke liye:</div>
                  {["1. Meta Business Account banao", "2. WhatsApp Business API apply karo", "3. Webhook URL yahan paste karo", "4. Bot activate!"].map((s, i) => (
                    <div key={i} style={{ fontSize: 10, color: "#444", marginBottom: 2 }}>✅ {s}</div>
                  ))}
                </div>
              </div>

              {/* Subscription plans - SaaS */}
              <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", gridColumn: "1 / -1" }}>
                <div style={{ fontWeight: 700, marginBottom: 4, color: "#075e54", fontSize: 15 }}>💰 SaaS Pricing Plans</div>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>Yeh plans apne clients ko becho</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                  {[
                    { name: "Starter", price: "₹999/mo", color: "#1565c0", features: ["1 Clinic", "100 appointments/mo", "Basic bot", "Email support"] },
                    { name: "Professional", price: "₹2,499/mo", color: "#075e54", features: ["3 Clinics", "Unlimited appointments", "AI smart replies", "Priority support", "Analytics dashboard"], popular: true },
                    { name: "Enterprise", price: "₹4,999/mo", color: "#6a1b9a", features: ["Unlimited Clinics", "Unlimited everything", "Custom bot training", "Dedicated support", "White label"] },
                  ].map((p, i) => (
                    <div key={i} style={{ border: `2px solid ${p.popular ? p.color : "#e0e0e0"}`, borderRadius: 12, padding: 16, position: "relative" }}>
                      {p.popular && <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: p.color, color: "#fff", fontSize: 10, padding: "2px 10px", borderRadius: 10, fontWeight: 700 }}>POPULAR</div>}
                      <div style={{ fontWeight: 700, fontSize: 15, color: p.color }}>{p.name}</div>
                      <div style={{ fontWeight: 800, fontSize: 22, color: "#333", margin: "8px 0" }}>{p.price}</div>
                      {p.features.map((f, j) => <div key={j} style={{ fontSize: 11, color: "#555", marginBottom: 4 }}>✅ {f}</div>)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
