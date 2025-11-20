import {
    collection,
    addDoc,
    query,
    where,
    onSnapshot,
    deleteDoc,
    updateDoc,
    orderBy,
    doc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

export function initTasks(user) {
    const activeList = document.getElementById("tasks-list-active");
    const completedList = document.getElementById("tasks-list-completed");
    const addTaskForm = document.getElementById("add-task-form");

    // Add Task
    addTaskForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const title = addTaskForm.title.value.trim();
        const description = addTaskForm.description.value.trim();
        const dueDate = addTaskForm.dueDate.value;

        if (!title) return;

        try {
            await addDoc(collection(db, "tasks"), {
                title,
                description,
                dueDate: dueDate ? new Date(dueDate).getTime() : null,
                isCompleted: false,
                isImportant: false,
                userId: user.uid,
                createdAt: Date.now()
            });
            addTaskForm.reset();
            document.getElementById("date-display").textContent = "";
            document.getElementById("date-display").classList.add("hidden");
        } catch (e) {
            console.error("Error adding task: ", e);
            alert("Error al agregar tarea");
        }
    });

    // Date Picker UI Logic
    const dateInput = addTaskForm.querySelector('input[name="dueDate"]');
    const dateDisplay = document.getElementById("date-display");

    dateInput.addEventListener("change", (e) => {
        if (e.target.value) {
            dateDisplay.textContent = new Date(e.target.value).toLocaleDateString();
            dateDisplay.classList.remove("hidden");
        } else {
            dateDisplay.classList.add("hidden");
        }
    });

    // Real-time Listener
    // NOTE: Removed orderBy to avoid needing a composite index immediately. Sorting in JS.
    const q = query(
        collection(db, "tasks"),
        where("userId", "==", user.uid)
    );

    onSnapshot(q, (snapshot) => {
        activeList.innerHTML = "";
        completedList.innerHTML = "";

        const tasks = [];
        snapshot.forEach(doc => {
            tasks.push({ id: doc.id, ...doc.data() });
        });

        // Sort by createdAt desc
        tasks.sort((a, b) => b.createdAt - a.createdAt);

        tasks.forEach((task, index) => {
            const taskEl = createTaskElement(task.id, task);
            // Add staggered animation
            taskEl.classList.add('animate-scale-in');
            taskEl.style.animationDelay = `${index * 50}ms`;

            if (task.isCompleted) {
                completedList.appendChild(taskEl);
            } else {
                activeList.appendChild(taskEl);
            }
        });
    }, (error) => {
        console.error("Error getting tasks:", error);
        alert("Error al cargar las tareas: " + error.message);
    });

    // Event Delegation for Task Actions (More Robust)
    const handleTaskAction = (e) => {
        const deleteBtn = e.target.closest('.delete-btn');
        const toggleBtn = e.target.closest('.toggle-btn');

        if (deleteBtn) {
            e.stopPropagation();
            const id = deleteBtn.dataset.id;
            deleteTask(id);
        } else if (toggleBtn) {
            e.stopPropagation();
            const id = toggleBtn.dataset.id;
            const isCompleted = toggleBtn.dataset.completed === 'true';
            toggleTaskCompletion(id, !isCompleted);
        }
    };

    activeList.addEventListener('click', handleTaskAction);
    completedList.addEventListener('click', handleTaskAction);
}

function createTaskElement(id, data) {
    const li = document.createElement("li");
    li.className = `p-4 bg-zinc-900 rounded-lg shadow-sm border border-zinc-800 flex items-center gap-4 transition hover:border-zinc-600 ${data.isCompleted ? 'opacity-50' : ''}`;

    const dateDisplay = data.dueDate
        ? `<span class="text-xs text-indigo-400 bg-indigo-900/30 border border-indigo-800 px-2 py-0.5 rounded-full flex items-center gap-1">📅 ${new Date(data.dueDate).toLocaleDateString()}</span>`
        : '';

    li.innerHTML = `
        <div class="flex-shrink-0">
            <button class="w-6 h-6 rounded-full border-2 ${data.isCompleted ? 'bg-indigo-600 border-indigo-600' : 'border-zinc-600 hover:border-indigo-500'} flex items-center justify-center transition toggle-btn" data-id="${id}" data-completed="${data.isCompleted}">
                ${data.isCompleted ? '<span class="text-white text-xs">✓</span>' : ''}
            </button>
        </div>
        <div class="flex-1 min-w-0">
            <p class="text-white font-medium truncate ${data.isCompleted ? 'line-through text-zinc-500' : ''}">${data.title}</p>
            ${data.description ? `<p class="text-sm text-zinc-400 truncate">${data.description}</p>` : ''}
            ${dateDisplay}
        </div>
        <button class="text-zinc-500 hover:text-red-500 transition delete-btn p-2" data-id="${id}">
            🗑️
        </button>
    `;

    return li;
}

async function toggleTaskCompletion(id, isCompleted) {
    try {
        await updateDoc(doc(db, "tasks", id), { isCompleted });
    } catch (e) {
        console.error("Error updating task: ", e);
    }
}

async function deleteTask(id) {
    if (!confirm("¿Estás seguro de eliminar esta tarea?")) return;
    try {
        await deleteDoc(doc(db, "tasks", id));
    } catch (e) {
        console.error("Error deleting task: ", e);
        alert("Error al eliminar: " + e.message);
    }
}


