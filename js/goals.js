import {
    collection,
    addDoc,
    query,
    where,
    onSnapshot,
    deleteDoc,
    updateDoc,
    doc,
    arrayUnion
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { db } from "./firebase-config.js";
import { showToast, showConfirm, showNumberPrompt } from "./notifications.js";

export function initGoals(user) {
    const savingsList = document.getElementById("goals-list-savings");
    const habitsList = document.getElementById("goals-list-habits");
    const addGoalForm = document.getElementById("add-goal-form");
    const goalTypeSelect = document.getElementById("goal-type-select");
    const savingsFields = document.getElementById("savings-fields");

    // Toggle fields based on type
    goalTypeSelect.addEventListener("change", (e) => {
        if (e.target.value === "savings") {
            savingsFields.classList.remove("hidden");
            savingsFields.classList.add("grid");
        } else {
            savingsFields.classList.add("hidden");
            savingsFields.classList.remove("grid");
        }
    });

    // Add Goal
    addGoalForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const title = addGoalForm.title.value.trim();
        const type = addGoalForm.type.value;

        if (!title) return;

        const goalData = {
            title,
            type,
            userId: user.uid,
            createdAt: Date.now()
        };

        if (type === "savings") {
            goalData.targetAmount = parseFloat(addGoalForm.targetAmount.value) || 0;
            goalData.currentAmount = parseFloat(addGoalForm.currentAmount.value) || 0;
        } else {
            goalData.history = []; // Array of date strings "YYYY-MM-DD"
        }

        try {
            await addDoc(collection(db, "goals"), goalData);
            addGoalForm.reset();
            // Reset UI state
            goalTypeSelect.value = "savings";
            savingsFields.classList.remove("hidden");
            savingsFields.classList.add("grid");
        } catch (e) {
            console.error("Error adding goal: ", e);
            showToast("Error al agregar meta", "error");
        }
    });

    // Real-time Listener
    const q = query(
        collection(db, "goals"),
        where("userId", "==", user.uid)
    );

    onSnapshot(q, (snapshot) => {
        savingsList.innerHTML = "";
        habitsList.innerHTML = "";

        let index = 0;
        snapshot.forEach(doc => {
            const data = doc.data();
            const id = doc.id;
            let card;

            if (data.type === "savings") {
                card = createSavingsCard(id, data);
            } else {
                card = createHabitCard(id, data);
            }

            // Add staggered animation
            card.classList.add('animate-scale-in');
            card.style.animationDelay = `${index * 50}ms`;

            if (data.type === "savings") {
                savingsList.appendChild(card);
            } else {
                habitsList.appendChild(card);
            }
            index++;
        });
    });
}

function createSavingsCard(id, data) {
    const div = document.createElement("div");
    div.className = "bg-zinc-900 rounded-xl shadow-sm border border-zinc-800 p-5 transition hover:border-zinc-600";

    const percentage = Math.min(Math.round((data.currentAmount / data.targetAmount) * 100), 100) || 0;
    const remaining = data.targetAmount - data.currentAmount;

    div.innerHTML = `
        <div class="flex justify-between items-start mb-3">
            <div>
                <h4 class="font-bold text-white text-lg">${data.title}</h4>
                <p class="text-xs text-zinc-400">Meta: $${data.targetAmount}</p>
            </div>
            <span class="bg-indigo-900/30 text-indigo-300 border border-indigo-800 text-xs font-bold px-2 py-1 rounded-full">${percentage}%</span>
        </div>
        
        <div class="w-full bg-zinc-800 rounded-full h-3 mb-2 overflow-hidden">
            <div class="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
        </div>
        
        <div class="flex justify-between items-center text-sm mb-4">
            <span class="text-zinc-300 font-medium">$${data.currentAmount} ahorrados</span>
            <span class="text-zinc-500 text-xs">Faltan $${remaining}</span>
        </div>

        <div class="flex gap-2">
            <button class="flex-1 bg-white text-black hover:bg-gray-200 text-sm font-semibold py-2 rounded-lg transition add-funds-btn">
                + Agregar
            </button>
            <button class="text-zinc-500 hover:text-red-500 p-2 transition delete-btn">
                🗑️
            </button>
        </div>
    `;

    div.querySelector(".add-funds-btn").onclick = async () => {
        const amount = await showNumberPrompt("¿Cuánto deseas agregar?", "Agregar Ahorro");
        if (amount && amount > 0) {
            await updateDoc(doc(db, "goals", id), {
                currentAmount: data.currentAmount + amount
            });
            showToast(`Se agregaron $${amount}`, "success");
        }
    };

    div.querySelector(".delete-btn").onclick = () => deleteGoal(id);

    return div;
}

function createHabitCard(id, data) {
    const div = document.createElement("div");
    div.className = "bg-zinc-900 rounded-xl shadow-sm border border-zinc-800 p-5 transition hover:border-zinc-600";

    const today = new Date().toISOString().split('T')[0];
    const isDoneToday = data.history && data.history.includes(today);
    const streak = calculateStreak(data.history || []);

    // Generate last 7 days circles
    let circlesHtml = '';
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const done = data.history && data.history.includes(dateStr);
        const colorClass = done ? 'bg-orange-500' : 'bg-zinc-700';
        circlesHtml += `<div class="w-3 h-3 rounded-full ${colorClass}" title="${dateStr}"></div>`;
    }

    div.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <div>
                <h4 class="font-bold text-white text-lg">${data.title}</h4>
                <p class="text-xs text-zinc-400">Racha actual: <span class="font-bold text-orange-500">${streak} días 🔥</span></p>
            </div>
            <button class="delete-btn text-zinc-500 hover:text-red-500 transition">🗑️</button>
        </div>

        <div class="flex justify-between items-center mb-4">
            <div class="flex gap-1">
                ${circlesHtml}
            </div>
        </div>

        <button class="w-full py-2 rounded-lg font-semibold text-sm transition ${isDoneToday ? 'bg-green-900/30 text-green-400 border border-green-800 cursor-default' : 'bg-white text-black hover:bg-gray-200 mark-today-btn'}">
            ${isDoneToday ? '¡Completado hoy! ✅' : 'Marcar como hecho'}
        </button>
    `;

    if (!isDoneToday) {
        div.querySelector(".mark-today-btn").onclick = async () => {
            await updateDoc(doc(db, "goals", id), {
                history: arrayUnion(today)
            });
        };
    }

    div.querySelector(".delete-btn").onclick = () => deleteGoal(id);

    return div;
}

function calculateStreak(history) {
    if (!history || history.length === 0) return 0;
    const sorted = [...history].sort().reverse();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let streak = 0;
    let current = sorted[0] === today ? today : (sorted[0] === yesterday ? yesterday : null);

    if (!current) return 0;

    for (let date of sorted) {
        if (date === current) {
            streak++;
            const d = new Date(current);
            d.setDate(d.getDate() - 1);
            current = d.toISOString().split('T')[0];
        }
    }
    return streak;
}

async function deleteGoal(id) {
    const confirmed = await showConfirm("¿Eliminar esta meta?", "Eliminar Meta");
    if (!confirmed) return;
    try {
        await deleteDoc(doc(db, "goals", id));
        showToast("Meta eliminada", "success");
    } catch (e) {
        console.error("Error deleting goal: ", e);
        showToast("Error al eliminar meta", "error");
    }
}
