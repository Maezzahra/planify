const validateTodo = (todo) => {
    const errors = [];

    // Fonction utilitaire pour vérifier si une chaîne contient des nombres
    const containsNumbers = (str) => {
        return /\d/.test(str);
    };

    // Validation du titre
    if (!todo.titre || typeof todo.titre !== 'string') {
        errors.push('Le titre est requis et doit être une chaîne de caractères');
    } else if (todo.titre.length < 5) {
        errors.push('Le titre doit contenir au moins 5 caractères');
    } else if (containsNumbers(todo.titre)) {
        errors.push('Le titre ne doit pas contenir de chiffres');
    }

    // Validation de la description
    if (!todo.description || typeof todo.description !== 'string') {
        errors.push('La description est requise et doit être une chaîne de caractères');
    } else if (todo.description.length < 5) {
        errors.push('La description doit contenir au moins 5 caractères');
    } else if (containsNumbers(todo.description)) {
        errors.push('La description ne doit pas contenir de chiffres');
    }

    // Validation de la priorité
    if (!todo.priorite || typeof todo.priorite !== 'string') {
        errors.push('La priorité est requise et doit être une chaîne de caractères');
    }

    // Validation de la date d'échéance
    if (!todo.dateEcheance) {
        errors.push('La date d\'échéance est requise');
    } else {
        const date = new Date(todo.dateEcheance);
        if (isNaN(date.getTime())) {
            errors.push('La date d\'échéance n\'est pas valide');
        } else if (date < new Date()) {
            errors.push('La date d\'échéance ne peut pas être dans le passé');
        }
    }

    // Validation de l'assigné
    if (!todo.assigneA || typeof todo.assigneA !== 'string') {
        errors.push('L\'assigné est requis et doit être une chaîne de caractères');
    } else if (containsNumbers(todo.assigneA)) {
        errors.push('Le nom de l\'assigné ne doit pas contenir de chiffres');
    }

    // Validation du statut
    if (!todo.statut || typeof todo.statut !== 'string') {
        errors.push('Le statut est requis et doit être une chaîne de caractères');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

export { validateTodo }; 