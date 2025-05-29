import { loadGapiInsideDOM } from "gapi-script";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, isSameMonth, parseISO, isAfter } from "date-fns";

// -- Settings: supply your own Google Client ID for production use --
const GOOGLE_CLIENT_ID = "REPLACE_WITH_YOUR_CLIENT_ID.apps.googleusercontent.com";
const GAPI_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
const GAPI_DISCOVERY = "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";

// Helper: Pretty event title for RPG
function getEventTitle(event) {
  return event.summary || "[No Title]";
}

// Helper: Boss marker detection (simple)
function isBoss(event) {
  if (!event) return false;
  // Mark as boss if 'deadline', 'boss', or similar in title, or has reminders or is marked due soon
  const title = (event.summary || "").toLowerCase();
  return title.includes("deadline") || title.includes("boss") || (event.description && event.description.toLowerCase().includes("boss"));
}

/**
 * PUBLIC_INTERFACE
 * Renders the Calendar View: Google OAuth, event fetch, RPG grid view, boss logic.
 */
export function CalendarView(authCtx, themeCtx, gameCtx, mountNode) {
  let events = [], gapi, loading = false, errorMsg = "", selectedDay = null, selectedEvents = [];
  let isAuthed = false;

  // UI rerender helper
  function render() {
    // RPG theme calendar + header
    mountNode.innerHTML = `
      <section class="rpg-glow-card rpg-fadein" style="max-width:820px;">
        <h1>📅 RPG Calendar</h1>
        <div style="margin-bottom:1em;">
          <button class="rpg-btn" id="gcal-sync-btn">${isAuthed ? "🔄 Refresh" : "🔗 Connect Google Calendar"}</button>
          ${isAuthed ? `<button class="rpg-btn" id="gcal-logout-btn" style="margin-left:2em;">Disconnect</button>` : ""}
          <span style="float:right;font-size:1em">${loading ? "Loading events..." : ""}${errorMsg ? `<span style="color:#f43f5e">${errorMsg}</span>` : ""}</span>
        </div>
        <div id="calendar-grid" class="rpg-calendar"></div>
        <div id="calendar-event-detail"></div>
      </section>
    `;

    // Clicks
    mountNode.querySelector("#gcal-sync-btn").onclick = () => {
      if (!isAuthed) { gcalAuth(); } else { fetchGCalEvents(); }
    };
    if (isAuthed && mountNode.querySelector("#gcal-logout-btn"))
      mountNode.querySelector("#gcal-logout-btn").onclick = gcalLogout;

    renderCalendar();
    renderEventDetail();
  }

  // OAuth logic
  async function gcalAuth() {
    loading = true; errorMsg = "";
    render();
    try {
      await loadGapiInsideDOM();
      gapi = globalThis.gapi;
      await new Promise((resolve) => gapi.load('client', resolve));
      await gapi.client.init({
        apiKey: "", // No API key needed for OAuth+discovery
        clientId: GOOGLE_CLIENT_ID,
        scope: GAPI_SCOPE,
        discoveryDocs: [GAPI_DISCOVERY],
      });
      await gapi.auth2.getAuthInstance().signIn();
      isAuthed = true;
      fetchGCalEvents();
    } catch (e) {
      errorMsg = "Google Calendar auth failed.";
      loading = false;
      render();
    }
  }
  async function gcalLogout() {
    if (gapi && gapi.auth2) {
      await gapi.auth2.getAuthInstance().signOut();
      isAuthed = false;
      events = [];
      setEvents([]);
      render();
    }
  }

  async function fetchGCalEvents() {
    loading = true; errorMsg = "";
    render();
    try {
      // Ensure signed in
      if (!gapi || !gapi.auth2 || !gapi.auth2.getAuthInstance().isSignedIn.get()) {
        await gcalAuth();
        return;
      }
      // Get range: current month
      const now = new Date();
      const tMin = startOfMonth(now).toISOString();
      const tMax = endOfMonth(now).toISOString();
      const resp = await gapi.client.calendar.events.list({
        calendarId: "primary",
        timeMin: tMin,
        timeMax: tMax,
        showDeleted: false,
        singleEvents: true,
        orderBy: "startTime"
      });
      events = resp.result.items || [];
      setEvents(events);
      loading = false;
      render();
    } catch (e) {
      errorMsg = "Failed to fetch events.";
      loading = false;
      render();
    }
  }
  // GameProvider setter for calendar events
  function setEvents(evts) {
    // Save to global RPG context for interaction (boss logic etc)
    if (typeof gameCtx.setCalendarEvents === "function") gameCtx.setCalendarEvents(evts);
  }

  function renderCalendar() {
    const gridEl = mountNode.querySelector("#calendar-grid");
    if (!gridEl) return;
    const today = new Date();
    const monthStart = startOfMonth(today), monthEnd = endOfMonth(today);
    const weekStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    let rows = [];

    // Build weeks grid
    let curr = weekStart, dayIdx = 0;
    while (curr <= weekEnd) {
      let weekRow = [];
      for (let wd = 0; wd < 7; wd++) {
        if (!isSameMonth(curr, today) && dayIdx < 7) { weekRow.push(`<td></td>`); curr = addDays(curr, 1); dayIdx++; continue; }
        const dayEvents = events.filter(ev => isSameDay(parseISO(ev.start.dateTime || ev.start.date), curr));
        const bossCount = dayEvents.filter(isBoss).length;
        let cell = `
          <td class="${isSameDay(curr, today) ? "rpg-calendar-today" : ""}" data-date="${curr.toISOString()}">
            <div style="font-weight:bold">${curr.getDate()}</div>
            ${dayEvents.length ? `
              <div>
                ${dayEvents.slice(0,3).map(ev => 
                  `<div class="rpg-glow" style="font-size:0.98em; margin-top:3px;cursor:pointer;margin-bottom:2px;" data-evt-id="${ev.id}">
                    ${isBoss(ev) ? "👹" : "🗒️"} ${getEventTitle(ev).slice(0,16)}
                  </div>`).join("")}
                ${dayEvents.length > 3 ? `<div style="font-size:0.8em">+${dayEvents.length-3} more</div>`: ""}
              </div>
            `: ""}
            ${bossCount ? `<div style="color:#e11d48;font-size:1.3em;">👹</div>`:""}
          </td>
        `;
        weekRow.push(cell);
        curr = addDays(curr, 1);
      }
      rows.push(`<tr>${weekRow.join("")}</tr>`);
      if (curr > weekEnd) break;
    }
    // Header
    const dayNames = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => `<th>${d}</th>`).join("");
    gridEl.innerHTML = `<table>
      <tr>${dayNames}</tr>
      ${rows.join("")}
    </table>`;
    // Day/event click
    gridEl.querySelectorAll("td[data-date]").forEach(td => {
      td.onclick = () => {
        selectedDay = td.dataset.date;
        renderEventDetail();
      };
      td.querySelectorAll("[data-evt-id]").forEach(div => {
        div.onclick = function(evt) {
          evt.stopPropagation();
          const ev = events.find(ev => ev.id === div.getAttribute("data-evt-id"));
          selectedDay = td.dataset.date;
          selectedEvents = [ev];
          renderEventDetail();
        };
      });
    });
  }

  function renderEventDetail() {
    const detailEl = mountNode.querySelector("#calendar-event-detail");
    if (!detailEl) return;
    if (!selectedDay) { detailEl.innerHTML = ""; return; }
    const sDay = new Date(selectedDay);
    let dayEvts = events.filter(ev => isSameDay(parseISO(ev.start.dateTime || ev.start.date), sDay));
    if (selectedEvents.length) dayEvts = selectedEvents;
    if (!dayEvts.length) { detailEl.innerHTML = "<div style='padding:0.8em'>No events for this day.</div>"; return; }
    // Event detail: boss logic/action
    detailEl.innerHTML = dayEvts.map((ev,i) => `
      <div style="padding:1em;margin:1em 0;background:rgba(30,12,77,0.9);border-radius:12px;border:1.5px solid var(--color-secondary);">
        <div style="font-size:1.18em;font-weight:bold;">
          ${isBoss(ev) ? "👹 <span style='color:#f43f5e'>BOSS: " + getEventTitle(ev) + "</span>" : "🗒️ " + getEventTitle(ev)}
        </div>
        <div>${ev.start.dateTime ? new Date(ev.start.dateTime).toLocaleString() : ev.start.date || ""}</div>
        <div style="opacity:0.76">${ev.description || ""}</div>
        ${isBoss(ev) && isAfter(new Date(ev.end.dateTime || ev.end.date), new Date()) ? `
          <div style="margin-top:1em">
            <button class="rpg-btn" id="boss-battle-${ev.id}">Battle Boss</button>
          </div>
        ` : ""}
      </div>
    `).join("");

    // Boss battle button logic: gamified XP/hp change
    dayEvts.forEach(ev => {
      if (isBoss(ev) && isAfter(new Date(ev.end.dateTime || ev.end.date), new Date())) {
        const btn = detailEl.querySelector(`#boss-battle-${ev.id}`);
        if (btn) btn.onclick = () => battleBoss(ev);
      }
    });
  }

  // Simulate boss battle: XP gain, hp loss
  function battleBoss(event) {
    // Grant XP, lose some HP, mark event as 'defeated' in local view
    if (typeof gameCtx.gainXP === "function") gameCtx.gainXP(30);
    if (typeof gameCtx.loseHP === "function") gameCtx.loseHP(10);
    errorMsg = `You defeated "${getEventTitle(event)}"! +30 XP, -10 HP.`;
    selectedEvents = [];
    render();
  }

  // Init: attempt to detect gapi authed state & auto fetch, otherwise render connect.
  async function init() {
    loading = false;
    errorMsg = "";
    selectedDay = null;
    selectedEvents = [];
    isAuthed = false;
    // Try restoring gapi (if previously loaded)
    try {
      await loadGapiInsideDOM();
      gapi = globalThis.gapi;
      await new Promise((resolve) => gapi.load('client', resolve));
      await gapi.client.init({
        apiKey: "",
        clientId: GOOGLE_CLIENT_ID,
        scope: GAPI_SCOPE,
        discoveryDocs: [GAPI_DISCOVERY],
      });
      isAuthed = gapi.auth2 && gapi.auth2.getAuthInstance().isSignedIn.get();
      if(isAuthed) await fetchGCalEvents();
    } catch {
      isAuthed = false;
      loading = false;
      render();
    }
    render();
  }
  init();
}
