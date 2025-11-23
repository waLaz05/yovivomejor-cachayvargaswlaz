import {
    collection,
    addDoc,
    query,
    where,
    onSnapshot,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { db } from "./firebase-config.js";
import { showToast, showConfirm } from "./notifications.js";

const CATEGORY_COLORS = {
    home: "bg-orange-900/30 border-orange-800 text-orange-300",
    study: "bg-indigo-900/30 border-indigo-800 text-indigo-300",
    work: "bg-blue-900/30 border-blue-800 text-blue-300",
    leisure: "bg-green-900/30 border-green-800 text-green-300",
    health: "bg-red-900/30 border-red-800 text-red-300",
    other: "bg-zinc-800 border-zinc-700 text-zinc-300"
};

let selectedDate = getTodayDateString(); // YYYY-MM-DD
let allActivities = [];

export function initSchedule(user) {
    const daySelector = document.getElementById("day-selector");
    const currentDayDisplay = document.getElementById("current-day-display");
    const addActivityForm = document.getElementById("add-activity-form");
    const startTimeSelect = document.getElementById("startTimeSelect");
    const endTimeSelect = document.getElementById("endTimeSelect");
    const customDaysSelector = document.getElementById("custom-days-selector");

    // Populate Time Selects
    const timeOptions = generateTimeOptions();
    startTimeSelect.innerHTML = timeOptions;
    endTimeSelect.innerHTML = timeOptions;

    // Set default values
    startTimeSelect.value = "08:00";
    endTimeSelect.value = "09:00";

    // Generate next 7 days
    const weekDays = generateNext7Days();

    // Render Day Selector
    renderDaySelector(daySelector, weekDays);
    updateCurrentDayDisplay(currentDayDisplay);

    // Render Custom Days Checkboxes (Mon-Sun)
    const daysShort = ["D", "L", "M", "M", "J", "V", "S"];
    customDaysSelector.innerHTML = daysShort.map((d, i) => `
        <label class="cursor-pointer">
            <input type="checkbox" name="customDays" value="${i}" class="peer hidden">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs border border-zinc-700 bg-zinc-800 text-gray-400 peer-checked:bg-white peer-checked:text-black transition">
                ${d}
            </div>
        </label>
    `).join("");

    // Handle Recurrence Radio Change
    addActivityForm.querySelectorAll('input[name="recurrence"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                customDaysSelector.classList.remove('hidden');
                customDaysSelector.classList.add('grid');
            } else {
                customDaysSelector.classList.add('hidden');
                customDaysSelector.classList.remove('grid');
            }
        });
    });

    // Day Selection Logic
    daySelector.addEventListener("click", (e) => {
        const btn = e.target.closest(".day-btn");
        if (btn) {
            selectedDate = btn.dataset.date;
            updateCurrentDayDisplay(currentDayDisplay);
            updateDaySelectorActiveState(daySelector);
            renderTimeline();
        }
    });

    // Add Activity
    addActivityForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const title = addActivityForm.title.value.trim();
        const startTime = document.getElementById("startTimeSelect").value;
        const endTime = document.getElementById("endTimeSelect").value;
        const category = addActivityForm.category.value;
        const recurrenceType = addActivityForm.recurrence.value;

        if (!title || !startTime || !endTime) return;

        if (startTime >= endTime) {
            showToast("La hora de fin debe ser después de la hora de inicio.", "warning");
            return;
        }

        let recurrence = { type: recurrenceType, days: [] };
        if (recurrenceType === 'custom') {
            const selectedCustomDays = Array.from(addActivityForm.querySelectorAll('input[name="customDays"]:checked')).map(cb => parseInt(cb.value));
            if (selectedCustomDays.length === 0) {
                showToast("Por favor selecciona al menos un día para la repetición personalizada.", "warning");
                return;
            }
            recurrence.days = selectedCustomDays;
        }

        try {
            const activityData = {
                title,
                startTime,
                endTime,
                category,
                date: selectedDate, // Start date
                recurrence,
                userId: user.uid,
                createdAt: Date.now()
            };

            await addDoc(collection(db, "schedule"), activityData);
            addActivityForm.reset();

            // Restore defaults
            document.getElementById("startTimeSelect").value = "08:00";
            document.getElementById("endTimeSelect").value = "09:00";
            addActivityForm.querySelector('input[value="home"]').checked = true;
            addActivityForm.querySelector('input[value="none"]').checked = true;
            customDaysSelector.classList.add('hidden');
            customDaysSelector.classList.remove('grid');

        } catch (error) {
            console.error("Error adding activity:", error);
            showToast(`Error al agregar actividad: ${error.message}`, "error");
        }
    });

    // Real-time Listener
    const q = query(
        collection(db, "schedule"),
        where("userId", "==", user.uid)
    );

    onSnapshot(q, (snapshot) => {
        allActivities = [];
        snapshot.forEach(doc => {
            allActivities.push({ id: doc.id, ...doc.data() });
        });
        renderTimeline();
    });
}

function getTodayDateString() {
    const d = new Date();
    return d.toISOString().split('T')[0];
}

function generateNext7Days() {
    const days = [];
    const today = new Date();
    const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const dayName = i === 0 ? "Hoy" : dayNames[d.getDay()];
        const dayNumber = d.getDate();

        days.push({
            date: dateStr,
            name: dayName,
            number: dayNumber,
            fullDate: d
        });
    }
    return days;
}

function renderDaySelector(container, days) {
    container.innerHTML = days.map(day => `
        <button class="day-btn flex flex-col items-center justify-center min-w-[70px] py-2 px-3 rounded-xl transition ${day.date === selectedDate ? 'bg-white text-black shadow-md' : 'text-zinc-500 hover:bg-zinc-800'}" data-date="${day.date}">
            <span class="text-xs font-medium mb-1">${day.name}</span>
            <span class="text-lg font-bold">${day.number}</span>
        </button>
    `).join("");
}

function updateDaySelectorActiveState(container) {
    container.querySelectorAll(".day-btn").forEach(btn => {
        if (btn.dataset.date === selectedDate) {
            btn.classList.remove("text-zinc-500", "hover:bg-zinc-800");
            btn.classList.add("bg-white", "text-black", "shadow-md");
        } else {
            btn.classList.add("text-zinc-500", "hover:bg-zinc-800");
            btn.classList.remove("bg-white", "text-black", "shadow-md");
        }
    });
}

function updateCurrentDayDisplay(element) {
    const d = new Date(selectedDate + 'T00:00:00'); // Fix timezone offset issue by appending time
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    // Capitalize first letter
    const dateString = d.toLocaleDateString('es-ES', options);
    element.textContent = dateString.charAt(0).toUpperCase() + dateString.slice(1);
}

function renderTimeline() {
    const timeline = document.getElementById("schedule-timeline");
    timeline.innerHTML = "";

    // Filter activities based on date and recurrence
    const dayActivities = allActivities
        .filter(a => {
            // 1. Exact date match (Non-recurring or specific instance)
            if (!a.recurrence || a.recurrence.type === 'none') {
                return a.date === selectedDate;
            }

            // 2. Recurring events
            // Check if selectedDate is ON or AFTER the start date
            if (selectedDate < a.date) return false;

            if (a.recurrence.type === 'daily') {
                return true;
            }

            if (a.recurrence.type === 'custom') {
                // Get day of week for selectedDate (0-6, Sunday is 0)
                // Note: We need to be careful with timezone here. 
                // selectedDate is YYYY-MM-DD string.
                const d = new Date(selectedDate + 'T00:00:00');
                const dayOfWeek = d.getDay();
                return a.recurrence.days.includes(dayOfWeek);
            }

            return false;
        })
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (dayActivities.length === 0) {
        timeline.innerHTML = `
            <div class="text-center py-12">
                <p class="text-zinc-500 mb-2">No hay actividades para este día.</p>
                <p class="text-sm text-indigo-400">¡Aprovecha para planificar!</p>
            </div>
        `;
        return;
    }

    let lastEndTime = "00:00";

    dayActivities.forEach((activity, index) => {
        // Check for gaps (Free Time)
        if (activity.startTime > lastEndTime) {
            const gapEl = document.createElement("div");
            gapEl.className = "relative pl-8 py-4 mb-4 border-l-2 border-dashed border-zinc-700 ml-[-17px]";
            gapEl.innerHTML = `
                <div class="absolute -left-[9px] top-1/2 -translate-y-1/2 w-4 h-4 bg-zinc-800 rounded-full border-2 border-black"></div>
                <div class="bg-zinc-900 rounded-lg p-3 border border-zinc-800 text-zinc-500 text-sm italic flex justify-between items-center">
                    <span>Tiempo Libre</span>
                    <span>${formatTime(lastEndTime)} - ${formatTime(activity.startTime)}</span>
                </div>
            `;
            timeline.appendChild(gapEl);
        }

        // Activity Card
        const colorClass = CATEGORY_COLORS[activity.category] || CATEGORY_COLORS.other;
        const div = document.createElement("div");
        div.className = "relative mb-6 group animate-scale-in";
        div.style.animationDelay = `${index * 50}ms`;

        // Add recurrence icon if recurring
        const isRecurring = activity.recurrence && activity.recurrence.type !== 'none';
        const recurrenceIcon = isRecurring ? '<span class="text-xs ml-2 opacity-70" title="Recurrente">🔁</span>' : '';

        div.innerHTML = `
            <div class="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-black border-4 border-white z-10"></div>
            <div class="${colorClass} rounded-xl p-4 border shadow-sm transition hover:border-white/20 relative">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-bold text-lg flex items-center">${activity.title} ${recurrenceIcon}</h4>
                        <div class="flex items-center gap-2 text-sm opacity-80 mt-1">
                            <span>⏰ ${formatTime(activity.startTime)} - ${formatTime(activity.endTime)}</span>
                        </div>
                    </div>
                    <button class="delete-btn text-current opacity-50 hover:opacity-100 transition p-1" data-id="${activity.id}">
                        🗑️
                    </button>
                </div>
            </div>
        `;

        div.querySelector(".delete-btn").onclick = () => deleteActivity(activity.id);
        timeline.appendChild(div);

        if (activity.endTime > lastEndTime) {
            lastEndTime = activity.endTime;
        }
    });
}

function formatTime(timeStr) {
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
}

function generateTimeOptions() {
    let options = "";
    for (let i = 0; i < 24; i++) {
        for (let j = 0; j < 60; j += 30) {
            const hour = i.toString().padStart(2, '0');
            const minute = j.toString().padStart(2, '0');
            const time = `${hour}:${minute}`;
            const display = formatTime(time);
            options += `<option value="${time}">${display}</option>`;
        }
    }
    return options;
}

async function deleteActivity(id) {
    const confirmed = await showConfirm("¿Eliminar esta actividad?", "Eliminar Actividad");
    if (!confirmed) return;
    try {
        await deleteDoc(doc(db, "schedule", id));
        showToast("Actividad eliminada", "success");
    } catch (e) {
        console.error("Error deleting activity: ", e);
        showToast("Error al eliminar actividad", "error");
    }
}
