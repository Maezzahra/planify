// Sélecteurs des éléments du formulaire
const todoForm = document.getElementById('todo-form');
const titleInput = document.getElementById('todo-input');
const descriptionInput = document.getElementById('todo-description');
const priorityInput = document.getElementById('todo-priority');
const dueDateInput = document.getElementById('todo-due-date');
const assignedToInput = document.getElementById('todo-assigned-to');
const statusInput = document.getElementById('todo-status');

// Sélecteurs des messages d'erreur
const titleError = document.getElementById('error-titre');
const descriptionError = document.getElementById('error-description');
const priorityError = document.getElementById('error-priorite');
const dueDateError = document.getElementById('error-date');
const assignedToError = document.getElementById('error-assigne');
const statusError = document.getElementById('error-statut');

// Fonction utilitaire pour afficher les erreurs
const showError = (element, message) => {
    if (element) {
        element.innerText = message;
    }
};

// Validation du titre
export const validateTitle = (title) => {
    if (!title || typeof title !== 'string') {
        showError(titleError, 'Le titre est requis');
        return false;
    }
    if (title.length < 5) {
        showError(titleError, 'Le titre doit contenir au moins 5 caractères');
        return false;
    }
    showError(titleError, '');
    return true;
};

// Validation de la description
export const validateDescription = (description) => {
    if (!description || typeof description !== 'string') {
        showError(descriptionError, 'La description est requise');
        return false;
    }
    if (description.length < 5) {
        showError(descriptionError, 'La description doit contenir au moins 5 caractères');
        return false;
    }
    showError(descriptionError, '');
    return true;
};

// Validation de la priorité
export const validatePriority = (priority) => {
    if (!priority || !['Faible', 'Moyenne', 'Élevée'].includes(priority)) {
        showError(priorityError, 'La priorité doit être "Faible", "Moyenne" ou "Élevée"');
        return false;
    }
    showError(priorityError, '');
    return true;
};

// Validation de la date d'échéance
export const validateDueDate = (date) => {
    if (!date) {
        showError(dueDateError, 'La date d\'échéance est requise');
        return false;
    }
    const selectedDate = new Date(date);
    const today = new Date();
    if (isNaN(selectedDate.getTime())) {
        showError(dueDateError, 'La date d\'échéance n\'est pas valide');
        return false;
    }
    if (selectedDate < today) {
        showError(dueDateError, 'La date d\'échéance ne peut pas être dans le passé');
        return false;
    }
    showError(dueDateError, '');
    return true;
};

// Validation de l'assigné
export const validateAssignedTo = (assignedTo) => {
    if (!assignedTo || typeof assignedTo !== 'string') {
        showError(assignedToError, 'L\'assigné est requis');
        return false;
    }
    showError(assignedToError, '');
    return true;
};

// Validation du statut
export const validateStatus = (status) => {
    if (!status || !['A faire', 'En cours', 'En revision', 'Terminee'].includes(status)) {
        showError(statusError, 'Le statut doit être "À faire", "En cours", "En révision" ou "Terminée"');
        return false;
    }
    showError(statusError, '');
    return true;
};

// Validation complète du formulaire
export const validateTodoForm = () => {
    if (!titleInput || !descriptionInput || !priorityInput || !dueDateInput || !assignedToInput || !statusInput) {
        console.error('Éléments du formulaire manquants');
        return false;
    }

    const title = titleInput.value;
    const description = descriptionInput.value;
    const priority = priorityInput.value;
    const dueDate = dueDateInput.value;
    const assignedTo = assignedToInput.value;
    const status = statusInput.value;

    const isTitleValid = validateTitle(title);
    const isDescriptionValid = validateDescription(description);
    const isPriorityValid = validatePriority(priority);
    const isDueDateValid = validateDueDate(dueDate);
    const isAssignedToValid = validateAssignedTo(assignedTo);
    const isStatusValid = validateStatus(status);

    return isTitleValid && isDescriptionValid && isPriorityValid && 
           isDueDateValid && isAssignedToValid && isStatusValid;
}; 