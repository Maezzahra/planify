// Récupération des éléments du DOM
const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoDescription = document.getElementById("todo-description");
const todoPriority = document.getElementById("todo-priority");
const todoDueDate = document.getElementById("todo-due-date");
const todoAssignedTo = document.getElementById("todo-assigned-to");
const todoStatus = document.getElementById("todo-status");
const todoLists = document.querySelectorAll(".task-list");

// Constantes pour les statuts (doivent correspondre exactement aux valeurs dans le HTML et le backend)
const STATUSES = {
    TODO: "A faire",
    IN_PROGRESS: "En cours",
    IN_REVIEW: "En revision",
    DONE: "Terminee"
};

// Fonction pour formater la date
const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(Number(timestamp));
    return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

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
            <div class="task-details">
                <span class="priority priority-${todo.priority.toLowerCase()}">${todo.priority}</span>
                ${todo.dueDate ? `<span class="due-date">Échéance: ${formatDate(todo.dueDate)}</span>` : ''}
                ${todo.assignedTo ? `<span class="assigned-to">Assigné à: ${todo.assignedTo}</span>` : ''}
            </div>
            <button class="delete-btn" type="button" aria-label="Supprimer la tâche" data-id="${todo.id}">×</button>
        </div>
    `;

    // Gestion du drag and drop
    card.addEventListener("dragstart", drag);
    card.addEventListener("dragend", dragEnd);
    
    // Gestion de la suppression
    const deleteBtn = card.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation(); // Empêche la propagation de l'événement
        try {
            await deleteTask(todo.id);
            card.remove(); // Supprime la carte seulement si la suppression côté serveur a réussi
        } catch (error) {
            console.error("Erreur lors de la suppression :", error);
            alert("Une erreur est survenue lors de la suppression de la tâche");
        }
    });

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
    const priority = todoPriority.value;
    const dueDate = todoDueDate.value ? new Date(todoDueDate.value).getTime() : null;
    const assignedTo = todoAssignedTo.value.trim();
    const status = todoStatus.value;

    console.log("Envoi de la tâche:", {
        title,
        description,
        priority,
        dueDate,
        assignedTo,
        status
    });

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
                priority,
                dueDate,
                assignedTo,
                status
            }),
        });

        const responseData = await response.json();
        console.log("Réponse du serveur:", responseData);

        if (!response.ok) {
            throw new Error(responseData.error || "Erreur lors de l'ajout de la tâche");
        }

        const { todo } = responseData;
        addTodoToClient(todo);
        
        // Réinitialisation du formulaire
        todoForm.reset();
    } catch (error) {
        console.error("Erreur détaillée:", error);
        alert(error.message || "Une erreur est survenue lors de l'ajout de la tâche");
    }
};

// Fonction pour supprimer une tâche
const deleteTask = async (taskId) => {
    console.log("Tentative de suppression de la tâche:", taskId);
    const response = await fetch(`/api/todo/${taskId}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la suppression");
    }

    return response.json();
};

// Fonction pour mettre à jour le statut d'une tâche
const updateTaskStatus = async (taskId, newStatus) => {
    try {
        console.log(`Mise à jour du statut de la tâche ${taskId} vers ${newStatus}`);
        const response = await fetch(`/api/todo/${taskId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Erreur lors de la mise à jour du statut");
        }

        // Mise à jour réussie
        console.log(`Statut de la tâche ${taskId} mis à jour avec succès vers ${newStatus}`);
    } catch (error) {
        console.error("Erreur lors de la mise à jour :", error);
        alert("Une erreur est survenue lors de la mise à jour du statut");
        // En cas d'erreur, on recharge la page pour rétablir l'état correct
        window.location.reload();
    }
};

// Fonction pour initialiser les boutons de suppression des tâches existantes
const initializeExistingDeleteButtons = () => {
    document.querySelectorAll('.todo-item').forEach(card => {
        const deleteBtn = card.querySelector('.delete-btn');
        const taskId = parseInt(card.dataset.id);
        
        if (deleteBtn && !deleteBtn.hasListener) {
            deleteBtn.hasListener = true;
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                try {
                    await deleteTask(taskId);
                    card.remove();
                } catch (error) {
                    console.error("Erreur lors de la suppression :", error);
                    alert("Une erreur est survenue lors de la suppression de la tâche");
                }
            });
        }
    });
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
        
        // Initialiser les boutons de suppression après avoir ajouté les tâches
        initializeExistingDeleteButtons();
    } catch (error) {
        console.error("Erreur lors de la récupération des tâches :", error);
    }
};

// Gestion du drag and drop
function allowDrop(event) {
    event.preventDefault();
    // S'assurer que nous ciblons uniquement la liste des tâches
    let dropZone = event.target;
    while (dropZone && !dropZone.classList.contains('task-list')) {
        dropZone = dropZone.parentElement;
    }
    
    if (dropZone) {
        dropZone.classList.add('drag-over');
    }
}

function dragLeave(event) {
    // S'assurer que nous ciblons uniquement la liste des tâches
    let dropZone = event.target;
    while (dropZone && !dropZone.classList.contains('task-list')) {
        dropZone = dropZone.parentElement;
    }
    
    if (dropZone) {
        dropZone.classList.remove('drag-over');
    }
}

function drag(event) {
    const taskElement = event.target.closest('.todo-item');
    if (taskElement) {
        event.dataTransfer.setData("text/plain", taskElement.dataset.id);
        taskElement.classList.add('dragging');
    }
}

function dragEnd(event) {
    const taskElement = event.target.closest('.todo-item');
    if (taskElement) {
        taskElement.classList.remove('dragging');
    }
    document.querySelectorAll('.task-list').forEach(list => {
        list.classList.remove('drag-over');
    });
}

async function drop(event) {
    event.preventDefault();
    
    // S'assurer que nous ciblons uniquement la liste des tâches
    let dropZone = event.target;
    while (dropZone && !dropZone.classList.contains('task-list')) {
        dropZone = dropZone.parentElement;
    }
    
    if (!dropZone) return;
    
    dropZone.classList.remove('drag-over');
    const taskId = parseInt(event.dataTransfer.getData("text/plain"));
    const newStatus = dropZone.dataset.status;
    const taskElement = document.querySelector(`[data-id="${taskId}"]`);
    
    if (!taskElement) return;

    // Obtenir le statut actuel avant le déplacement
    const currentStatus = taskElement.closest('.task-list').dataset.status;
    
    // Ne rien faire si on dépose dans la même colonne
    if (currentStatus === newStatus) {
        return;
    }
    
    try {
        console.log("Tentative de mise à jour du statut:", {
            taskId,
            newStatus,
            currentStatus
        });

        const response = await fetch(`/api/todo/${taskId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de la mise à jour du statut');
        }

        // Déplacer l'élément seulement après confirmation du serveur
        dropZone.appendChild(taskElement);
        
        // Mettre à jour les données de la tâche si nécessaire
        if (data.todo) {
            // Mettre à jour la date si elle existe
            const dueDateElement = taskElement.querySelector('.due-date');
            if (dueDateElement && data.todo.dueDate) {
                dueDateElement.textContent = `Échéance: ${formatDate(data.todo.dueDate)}`;
            }
        }
        
        console.log("Statut mis à jour avec succès:", data);
    } catch (error) {
        console.error('Erreur:', error);
        // En cas d'erreur, on remet la tâche à sa position d'origine
        const originalList = document.querySelector(`[data-status="${currentStatus}"]`);
        if (originalList) {
            originalList.appendChild(taskElement);
        }
        alert(error.message || 'Une erreur est survenue lors de la mise à jour du statut');
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
        list.addEventListener("dragleave", dragLeave);
        list.addEventListener("drop", drop);
    });

    // Initialiser les boutons de suppression pour les tâches existantes
    initializeExistingDeleteButtons();

    // Ajouter des écouteurs pour le drag and drop sur les éléments existants
    document.querySelectorAll('.todo-item').forEach(item => {
        item.addEventListener('dragstart', drag);
        item.addEventListener('dragend', dragEnd);
    });

    // Chargement initial des tâches
    getTodos();
});
