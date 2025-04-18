// Variables globales pour les éléments du DOM
let todoForm;
let titleInput;
let descriptionInput;
let prioritySelect;
let dueDateInput;
let assignedToInput;
let statusSelect;
let todoLists;

// Constantes pour les statuts
const STATUSES = {
    TODO: "A faire",
    IN_PROGRESS: "En cours",
    IN_REVIEW: "En revision",
    DONE: "Terminee"
};

// Import des validations
import { validateTodoForm } from './validations/todoValidations.js';

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
            <button class="delete-btn" type="button" aria-label="Supprimer la tâche" data-id="${todo.id}">×</button>
            <h3 class="title">${todo.titre}</h3>
            <p class="description">${todo.description || "Sans description"}</p>
            <div class="task-details">
                <span class="priority priority-${todo.priorite.toLowerCase()}">${todo.priorite}</span>
                ${todo.dateEcheance ? `<span class="due-date">Échéance: ${formatDate(todo.dateEcheance)}</span>` : ''}
                ${todo.assigneA ? `<span class="assigned-to">Assigné à: ${todo.assigneA}</span>` : ''}
            </div>
            <button class="history-btn" type="button" aria-label="Voir l'historique" data-id="${todo.id}">
                <i class="fas fa-history"></i>
            </button>
        </div>
    `;

    // Gestion du drag and drop
    card.addEventListener("dragstart", dragStart);
    card.addEventListener("dragend", dragEnd);
    
    // Gestion de la suppression
    const deleteBtn = card.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
            try {
                await deleteTodo(todo.id);
                card.remove();
            } catch (error) {
                console.error("Erreur lors de la suppression :", error);
                showError("Une erreur est survenue lors de la suppression de la tâche");
            }
        }
    });

    // Gestion de l'historique
    const historyBtn = card.querySelector(".history-btn");
    if (historyBtn) {
        historyBtn.addEventListener("click", async () => {
            try {
                const response = await fetch(`/api/todo/${todo.id}/history`);
                if (!response.ok) {
                    throw new Error("Erreur lors de la récupération de l'historique");
                }
                const history = await response.json();
                showHistoryModal(history);
            } catch (error) {
                console.error("Erreur lors de la récupération de l'historique:", error);
                showError("Une erreur est survenue lors de la récupération de l'historique");
            }
        });
    }

    return card;
};

// Fonction pour afficher l'historique dans une modale
function showHistoryModal(history) {
    const modal = document.getElementById('history-modal');
    const modalContent = modal.querySelector('.modal-content');
    
    modalContent.innerHTML = `
        <div class="modal-header">
            <h2>Historique de la tâche</h2>
            <button class="close">&times;</button>
        </div>
        <ul class="history-list">
            ${history.map(entry => `
                <li class="history-item">
                    <div class="history-header">
                        <span class="change-type">${formatChangeType(entry.typeChangement)}</span>
                        <span class="change-date">${formatDate(entry.createdAt)}</span>
                    </div>
                    <div class="history-details">
                        <p><strong>Titre:</strong> ${entry.titre}</p>
                        <p><strong>Description:</strong> ${entry.description || 'Sans description'}</p>
                        <p><strong>Statut:</strong> ${entry.statut}</p>
                        <p><strong>Priorité:</strong> ${entry.priorite}</p>
                        ${entry.dateEcheance ? `<p><strong>Échéance:</strong> ${formatDate(entry.dateEcheance)}</p>` : ''}
                        ${entry.assigneA ? `<p><strong>Assigné à:</strong> ${entry.assigneA}</p>` : ''}
                    </div>
                </li>
            `).join('')}
        </ul>
    `;

    // Ajouter l'événement de fermeture au bouton
    const closeBtn = modalContent.querySelector('.close');
    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };
    
    modal.style.display = 'block';
}

function formatChangeType(type) {
    const types = {
        'CREATION': 'Création',
        'MODIFICATION': 'Modification',
        'SUPPRESSION': 'Suppression'
    };
    return types[type] || type;
}

// Fonction pour ajouter une tâche au DOM
const addTodoToDOM = (todo) => {
    const card = createTaskCard(todo);
    const statusList = document.querySelector(`[data-status="${todo.statut}"]`);
    if (statusList) {
        statusList.appendChild(card);
    }
};

// Fonction pour envoyer une nouvelle tâche au serveur
const addTodoToServer = async (event) => {
    event.preventDefault();

    // Vérification de la présence des éléments du formulaire
    if (!titleInput || !descriptionInput || !prioritySelect || !dueDateInput || !assignedToInput || !statusSelect) {
        console.error("Un ou plusieurs éléments du formulaire sont manquants");
        showError("Une erreur est survenue lors de l'accès au formulaire");
        return;
    }

    // Validation du formulaire
    if (!validateTodoForm()) {
        return;
    }

    const todoData = {
        titre: titleInput.value.trim(),
        description: descriptionInput.value.trim(),
        priorite: prioritySelect.value,
        dateEcheance: new Date(dueDateInput.value).toISOString(),
        assigneA: assignedToInput.value.trim(),
        statut: statusSelect.value
    };

    try {
        const response = await fetch("/api/todo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(todoData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Erreur lors de l'ajout de la tâche");
        }

        const data = await response.json();
        
        if (data.todo) {
            addTodoToDOM(data.todo);
            // Réinitialisation du formulaire
            todoForm.reset();
            // Fermeture de la modale si elle existe
            const modal = document.querySelector('.modal');
            if (modal) modal.style.display = 'none';
        } else {
            throw new Error(data.message || "Erreur lors de l'ajout de la tâche");
        }
    } catch (error) {
        console.error("Erreur lors de l'ajout de la tâche:", error);
        showError(error.message || "Une erreur est survenue lors de l'ajout de la tâche");
    }
};

// Gestion du drag and drop
function allowDrop(event) {
    event.preventDefault();
    let dropZone = event.target;
    while (dropZone && !dropZone.classList.contains('todo-list')) {
        dropZone = dropZone.parentElement;
    }
    
    if (dropZone) {
        dropZone.classList.add('drag-over');
    }
}

function dragLeave(event) {
    let dropZone = event.target;
    while (dropZone && !dropZone.classList.contains('todo-list')) {
        dropZone = dropZone.parentElement;
    }
    
    if (dropZone) {
        dropZone.classList.remove('drag-over');
    }
}

function dragStart(event) {
    const todoElement = event.target.closest('.todo-item');
    if (todoElement) {
        event.dataTransfer.setData("text/plain", todoElement.dataset.id);
        todoElement.classList.add('dragging');
    }
}

function dragEnd(event) {
    event.target.classList.remove('dragging');
}

async function drop(event) {
    event.preventDefault();
    
    let dropZone = event.target;
    while (dropZone && !dropZone.classList.contains('task-list')) {
        dropZone = dropZone.parentElement;
    }
    
    if (!dropZone) return;
    
    dropZone.classList.remove('drag-over');
    
    const todoId = event.dataTransfer.getData("text/plain");
    const newStatus = dropZone.dataset.status;
    
    try {
        const response = await fetch(`/api/todo/${todoId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ statut: newStatus }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Erreur lors de la mise à jour du statut");
        }

        const todoElement = document.querySelector(`.todo-item[data-id="${todoId}"]`);
        if (todoElement) {
            dropZone.appendChild(todoElement);
        }
    } catch (error) {
        console.error("Erreur lors de la mise à jour :", error);
        showError("Une erreur est survenue lors de la mise à jour du statut");
        // En cas d'erreur, on recharge la page pour rétablir l'état correct
        window.location.reload();
    }
}

// Fonction pour charger les tâches depuis l'API
async function loadTodos() {
    try {
        const response = await fetch("/api/todos");
        if (!response.ok) {
            throw new Error("Erreur lors de la récupération des tâches");
        }
        const todos = await response.json();
        todos.forEach(todo => addTodoToDOM(todo));
    } catch (error) {
        console.error("Erreur lors du chargement des tâches:", error);
        showError("Une erreur est survenue lors du chargement des tâches");
    }
}

// Fonction pour supprimer une tâche
async function deleteTodo(id) {
    const response = await fetch(`/api/todo/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la suppression de la tâche");
    }

    return await response.json();
}

// Fonction pour afficher une erreur
function showError(message) {
    alert(message); // Pour l'instant, on utilise une simple alerte
}

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    // Initialisation des éléments du DOM
    todoForm = document.getElementById("todo-form");
    titleInput = document.getElementById("todo-input");
    descriptionInput = document.getElementById("todo-description");
    prioritySelect = document.getElementById("todo-priority");
    dueDateInput = document.getElementById("todo-due-date");
    assignedToInput = document.getElementById("todo-assigned-to");
    statusSelect = document.getElementById("todo-status");
    todoLists = document.querySelectorAll(".todo-list");

    // Charger les tâches initiales
    await loadTodos();

    // Gestionnaire pour le formulaire de modification
    const editForm = document.getElementById('edit-form');
    if (editForm) {
        editForm.addEventListener('submit', updateTodo);
    }

    // Gestionnaire pour le formulaire d'ajout
    if (todoForm) {
        todoForm.addEventListener('submit', addTodoToServer);
    }

    // Configuration du drag and drop
    const taskLists = document.querySelectorAll('.task-list');
    taskLists.forEach(list => {
        list.addEventListener('dragover', allowDrop);
        list.addEventListener('dragleave', dragLeave);
        list.addEventListener('drop', drop);
    });

    // Gestionnaires pour les boutons de fermeture des modals
    const closeBtns = document.getElementsByClassName('close');
    Array.from(closeBtns).forEach(btn => {
        btn.onclick = () => {
            const modal = btn.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        };
    });

    // Fermer les modals en cliquant en dehors
    window.onclick = (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };
});
