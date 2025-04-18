// Import the Prisma client
import { PrismaClient } from "@prisma/client";

// Create a Prisma instance
const prisma = new PrismaClient();

// Constants for valid statuses
const VALID_STATUSES = ["A faire", "En cours", "En revision", "Terminee"];

/**
 * Get all statuses
 * @returns {Promise<Array>} List of statuses
 */
export const getStatuses = async () => {
    return await prisma.statut.findMany({
        orderBy: {
            nom: 'asc'
        }
    });
};

/**
 * Get all priorities
 * @returns {Promise<Array>} List of priorities
 */
export const getPriorities = async () => {
    return await prisma.priorite.findMany({
        orderBy: {
            nom: 'asc'
        }
    });
};

/**
 * Add an entry to history
 * @param {number} todoId - ID of the todo
 * @param {Object} todoData - Todo data
 * @param {string} changeType - Type of change (CREATION, MODIFICATION, DELETION)
 * @param {string} modifiedBy - User who made the change
 */
const addHistory = async (todoId, todoData, changeType, modifiedBy = "system") => {
    await prisma.historiqueTache.create({
        data: {
            tacheId: todoId,
            titre: todoData.titre,
            description: todoData.description,
            statut: todoData.statut,
            priorite: todoData.priorite,
            dateEcheance: todoData.dateEcheance,
            assigneA: todoData.assigneA,
            typeChangement: changeType,
            modifiePar: modifiedBy
        }
    });
};

/**
 * Get todo history
 * @param {number} todoId - ID of the todo
 * @returns {Promise<Array>} List of modifications
 */
export const getTodoHistory = async (todoId) => {
    return await prisma.historiqueTache.findMany({
        where: { tacheId: todoId },
        orderBy: { dateCreation: 'desc' }
    });
};

/**
 * Add a todo
 * @param {Object} todoData - Todo data
 * @returns {Promise<Object>} The created todo
 */
export const addTodo = async (todoData) => {
    try {
        // Vérifier si le statut existe et obtenir son ID
        let statutId = todoData.statutId;
        if (!statutId) {
            const existingStatus = await prisma.statut.findUnique({
                where: { nom: todoData.statut }
            });
            if (!existingStatus) {
                throw new Error(`Statut invalide: ${todoData.statut}`);
            }
            statutId = existingStatus.id;
        }

        // Vérifier si la priorité existe et obtenir son ID
        let prioriteId = todoData.prioriteId;
        if (!prioriteId) {
            const existingPriority = await prisma.priorite.findUnique({
                where: { nom: todoData.priorite }
            });
            if (!existingPriority) {
                throw new Error(`Priorité invalide: ${todoData.priorite}`);
            }
            prioriteId = existingPriority.id;
        }

        // Convertir la date d'échéance en BigInt (timestamp)
        const dateEcheance = todoData.dateEcheance ? BigInt(new Date(todoData.dateEcheance).getTime()) : null;

        // Créer la tâche
        const newTodo = await prisma.tache.create({
            data: {
                titre: todoData.titre,
                description: todoData.description,
                statutId: statutId,
                prioriteId: prioriteId,
                dateEcheance: dateEcheance,
                assigneA: todoData.assigneA
            },
            include: {
                statut: true,
                priorite: true
            }
        });

        // Créer l'entrée dans l'historique
        await prisma.historiqueTache.create({
            data: {
                tacheId: newTodo.id,
                titre: newTodo.titre,
                description: newTodo.description,
                statut: newTodo.statut.nom,
                priorite: newTodo.priorite.nom,
                dateEcheance: dateEcheance,
                assigneA: newTodo.assigneA,
                typeChangement: 'CREATION',
                modifiePar: todoData.assigneA || 'système'
            }
        });

        return {
            ...newTodo,
            statut: newTodo.statut.nom,
            priorite: newTodo.priorite.nom
        };
    } catch (error) {
        console.error("Erreur lors de l'ajout de la tâche:", error);
        throw error;
    }
};

/**
 * Get list of all todos
 * @returns {Promise<Array>} list of todos
 */
export const getTodos = async () => {
    const todos = await prisma.tache.findMany({
        include: {
            statut: true,
            priorite: true
        },
        orderBy: [
            {
                dateEcheance: 'asc'
            },
            {
                priorite: {
                    nom: 'desc'
                }
            }
        ]
    });
    
    return todos.map(todo => ({
        ...todo,
        statut: todo.statut.nom,
        priorite: todo.priorite.nom
    }));
};

/**
 * Update a todo completely
 * @param {number} id - Todo ID
 * @param {Object} update - Fields to update
 * @returns {Promise<Object>} The updated todo
 */
export const updateTodo = async (id, update) => {
    // Get existing todo
    const existingTodo = await prisma.tache.findUnique({
        where: { id },
        include: {
            statut: true,
            priorite: true
        }
    });

    if (!existingTodo) {
        throw new Error('Todo not found');
    }

    // Prepare update data
    const updateData = {};

    if (update.titre !== undefined) updateData.titre = update.titre;
    if (update.description !== undefined) updateData.description = update.description;
    if (update.dateEcheance !== undefined) updateData.dateEcheance = update.dateEcheance;
    if (update.assigneA !== undefined) updateData.assigneA = update.assigneA;

    // Handle status
    if (update.statut) {
        const newStatus = await prisma.statut.findUnique({
            where: { nom: update.statut }
        });
        if (!newStatus) {
            throw new Error(`Invalid status: ${update.statut}`);
        }
        updateData.statutId = newStatus.id;
    }

    // Handle priority
    if (update.priorite) {
        const newPriority = await prisma.priorite.findUnique({
            where: { nom: update.priorite }
        });
        if (!newPriority) {
            throw new Error(`Invalid priority: ${update.priorite}`);
        }
        updateData.prioriteId = newPriority.id;
    }

    // Update the todo
    const updatedTodo = await prisma.tache.update({
        where: { id },
        data: updateData,
        include: {
            statut: true,
            priorite: true
        }
    });

    // Create history entry
    await prisma.historiqueTache.create({
        data: {
            tacheId: id,
            titre: updatedTodo.titre,
            description: updatedTodo.description,
            statut: updatedTodo.statut.nom,
            priorite: updatedTodo.priorite.nom,
            dateEcheance: updatedTodo.dateEcheance,
            assigneA: updatedTodo.assigneA,
            typeChangement: 'MODIFICATION'
        }
    });

    return {
        ...updatedTodo,
        statut: updatedTodo.statut.nom,
        priorite: updatedTodo.priorite.nom
    };
};

/**
 * Update todo status
 * @param {number} id - Todo ID
 * @param {string} status - New status
 * @returns {Promise<Object>} The updated todo
 */
export const updateTodoStatus = async (id, newStatus) => {
    // Check if status exists
    const status = await prisma.statut.findUnique({
        where: { nom: newStatus }
    });

    if (!status) {
        throw new Error(`Invalid status: ${newStatus}`);
    }

    // Get existing todo
    const existingTodo = await prisma.tache.findUnique({
        where: { id },
        include: {
            statut: true,
            priorite: true
        }
    });

    if (!existingTodo) {
        throw new Error('Todo not found');
    }

    // Update the todo
    const updatedTodo = await prisma.tache.update({
        where: { id },
        data: {
            statutId: status.id
        },
        include: {
            statut: true,
            priorite: true
        }
    });

    // Create history entry
    await prisma.historiqueTache.create({
        data: {
            tacheId: id,
            titre: updatedTodo.titre,
            description: updatedTodo.description,
            statut: status.nom,
            priorite: updatedTodo.priorite.nom,
            dateEcheance: updatedTodo.dateEcheance,
            assigneA: updatedTodo.assigneA,
            typeChangement: 'MODIFICATION'
        }
    });

    return {
        ...updatedTodo,
        statut: status.nom,
        priorite: updatedTodo.priorite.nom
    };
};

/**
 * Delete a todo
 * @param {number} id - Todo ID
 * @returns {Promise<void>}
 */
export const deleteTodo = async (id) => {
    // Get todo before deletion for history
    const todo = await prisma.tache.findUnique({
        where: { id },
        include: {
            statut: true,
            priorite: true
        }
    });

    if (!todo) {
        throw new Error('Todo not found');
    }

    // Create history entry before deletion
    await prisma.historiqueTache.create({
        data: {
            tacheId: id,
            titre: todo.titre,
            description: todo.description,
            statut: todo.statut.nom,
            priorite: todo.priorite.nom,
            dateEcheance: todo.dateEcheance,
            assigneA: todo.assigneA,
            typeChangement: 'SUPPRESSION'
        }
    });

    // Delete the todo
    await prisma.tache.delete({
        where: { id }
    });
}; 