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
        element.style.display = message ? 'block' : 'none';
        element.style.color = '#dc3545';
        element.style.fontSize = '0.875rem';
        element.style.marginTop = '0.25rem';
    }
};

// Fonction utilitaire pour vérifier si une chaîne contient des nombres
const containsNumbers = (str) => {
    return /\d/.test(str);
};

// Fonction utilitaire pour vérifier si une chaîne contient des caractères spéciaux
const containsSpecialChars = (str) => {
    return /[!@#$%^&*(),.?":{}|<>]/.test(str);
};

// Fonction utilitaire pour nettoyer les entrées
const sanitizeInput = (input) => {
    return input.trim().replace(/[<>]/g, '');
};

// Validation du titre
export const validateTitle = (title) => {
    if (!title || typeof title !== 'string') {
        showError(titleError, 'Le titre est requis');
        return false;
    }

    const cleanTitle = sanitizeInput(title);

    if (cleanTitle.length < 5 || cleanTitle.length > 100) {
        showError(titleError, 'Le titre doit contenir entre 5 et 100 caractères');
        return false;
    }

    if (containsNumbers(cleanTitle)) {
        showError(titleError, 'Le titre ne doit pas contenir de chiffres');
        return false;
    }

    if (containsSpecialChars(cleanTitle)) {
        showError(titleError, 'Le titre ne doit pas contenir de caractères spéciaux');
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

    const cleanDescription = sanitizeInput(description);

    if (cleanDescription.length < 5 || cleanDescription.length > 500) {
        showError(descriptionError, 'La description doit contenir entre 5 et 500 caractères');
        return false;
    }

    if (containsNumbers(cleanDescription)) {
        showError(descriptionError, 'La description ne doit pas contenir de chiffres');
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
    today.setHours(0, 0, 0, 0); // Reset time part for accurate date comparison

    if (isNaN(selectedDate.getTime())) {
        showError(dueDateError, 'La date d\'échéance n\'est pas valide');
        return false;
    }

    if (selectedDate < today) {
        showError(dueDateError, 'La date d\'échéance ne peut pas être dans le passé');
        return false;
    }

    // Vérifier si la date n'est pas trop loin dans le futur (par exemple, 1 an maximum)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    if (selectedDate > oneYearFromNow) {
        showError(dueDateError, 'La date d\'échéance ne peut pas être à plus d\'un an dans le futur');
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

    const cleanAssignedTo = sanitizeInput(assignedTo);

    if (cleanAssignedTo.length < 2 || cleanAssignedTo.length > 50) {
        showError(assignedToError, 'Le nom de l\'assigné doit contenir entre 2 et 50 caractères');
        return false;
    }

    if (containsNumbers(cleanAssignedTo)) {
        showError(assignedToError, 'Le nom de l\'assigné ne doit pas contenir de chiffres');
        return false;
    }

    if (containsSpecialChars(cleanAssignedTo)) {
        showError(assignedToError, 'Le nom de l\'assigné ne doit pas contenir de caractères spéciaux');
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
    try {
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

        // Nettoyer les entrées
        const cleanTitle = sanitizeInput(title);
        const cleanDescription = sanitizeInput(description);
        const cleanAssignedTo = sanitizeInput(assignedTo);

        // Mettre à jour les valeurs nettoyées dans le formulaire
        titleInput.value = cleanTitle;
        descriptionInput.value = cleanDescription;
        assignedToInput.value = cleanAssignedTo;

        const isTitleValid = validateTitle(cleanTitle);
        const isDescriptionValid = validateDescription(cleanDescription);
        const isPriorityValid = validatePriority(priority);
        const isDueDateValid = validateDueDate(dueDate);
        const isAssignedToValid = validateAssignedTo(cleanAssignedTo);
        const isStatusValid = validateStatus(status);

        return isTitleValid && isDescriptionValid && isPriorityValid && 
               isDueDateValid && isAssignedToValid && isStatusValid;
    } catch (error) {
        console.error('Erreur lors de la validation du formulaire:', error);
        return false;
    }
}; 