// Récupération des éléments du DOM
const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoDescription = document.getElementById("todo-description");
const todoLists = document.querySelectorAll(".task-list");

// Fonction pour créer une carte de tâche
const createTaskCard = (todo) => {
    const card = document.createElement("li");
    card.className = "todo-item";
    card.draggable = true;
    card.dataset.id = todo.id;
    
    card.innerHTML = `
        <div class="card-content">
            <h3 class="title">${todo.title}</h3>
            <p class="description">${todo.description || "Sans description"}</p>
            <button class="delete-btn">×</button>
        </div>
    `;

    // Gestion du drag and drop
    card.addEventListener("dragstart", drag);
    
    // Gestion de la suppression
    const deleteBtn = card.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", () => deleteTask(todo.id));

    return card;
};

// Fonction pour ajouter une tâche au DOM
const addTodoToClient = (todo) => {
    const card = createTaskCard(todo);
    const targetList = document.querySelector(`[data-status="${todo.status}"]`);
    if (targetList) {
        targetList.appendChild(card);
    }
};

// Fonction pour envoyer une nouvelle tâche au serveur
const addTodoToServer = async (event) => {
    event.preventDefault();

    const title = todoInput.value.trim();
    const description = todoDescription.value.trim();

    if (!title) {
        alert("Le titre est requis !");
        return;
    }

    try {
        const response = await fetch("/api/todo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title,
                description,
                status: "A faire"
            }),
        });

        if (!response.ok) {
            throw new Error("Erreur lors de l'ajout de la tâche");
        }

        const { todo } = await response.json();
        addTodoToClient(todo);
        
        // Réinitialisation du formulaire
        todoInput.value = "";
        todoDescription.value = "";
    } catch (error) {
        console.error("Erreur :", error);
        alert("Une erreur est survenue lors de l'ajout de la tâche");
    }
};

// Fonction pour supprimer une tâche
const deleteTask = async (taskId) => {
    try {
        const response = await fetch(`/api/todo/${taskId}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            throw new Error("Erreur lors de la suppression");
        }

        const taskElement = document.querySelector(`[data-id="${taskId}"]`);
        if (taskElement) {
            taskElement.remove();
        }
    } catch (error) {
        console.error("Erreur lors de la suppression :", error);
        alert("Une erreur est survenue lors de la suppression de la tâche");
    }
};

// Fonction pour mettre à jour le statut d'une tâche
const updateTaskStatus = async (taskId, newStatus) => {
    try {
        const response = await fetch(`/api/todo/${taskId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
            throw new Error("Erreur lors de la mise à jour du statut");
        }
    } catch (error) {
        console.error("Erreur lors de la mise à jour :", error);
    }
};

// Fonction pour récupérer la liste des tâches depuis le backend
const getTodos = async () => {
    try {
        const response = await fetch("/api/todos");
        if (!response.ok) {
            throw new Error("Erreur lors de la récupération des tâches");
        }

        const todos = await response.json();
        todos.forEach((todo) => addTodoToClient(todo));
    } catch (error) {
        console.error("Erreur lors de la récupération des tâches :", error);
    }
};

// Gestion du drag and drop
function allowDrop(event) {
    event.preventDefault();
}

function drag(event) {
    event.dataTransfer.setData("text", event.target.dataset.id);
}

function drop(event) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text");
    const targetList = event.target.closest(".task-list");
    
    if (!targetList) return;
    
    const newStatus = targetList.dataset.status;
    const taskElement = document.querySelector(`[data-id="${taskId}"]`);
    
    if (taskElement) {
        targetList.appendChild(taskElement);
        updateTaskStatus(taskId, newStatus);
    }
}

// Initialisation
document.addEventListener("DOMContentLoaded", () => {
    // Ajout des écouteurs d'événements pour le formulaire
    if (todoForm) {
        todoForm.addEventListener("submit", addTodoToServer);
    }

    // Ajout des écouteurs d'événements pour le drag and drop
    todoLists.forEach(list => {
        list.addEventListener("dragover", allowDrop);
        list.addEventListener("drop", drop);
    });

    // Chargement initial des tâches
    getTodos();
});
