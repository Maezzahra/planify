// importer ler client prisma
import { PrismaClient } from "@prisma/client";

//Creer une instance de prisma
const prisma = new PrismaClient();

// Constantes pour les statuts valides
const VALID_STATUSES = ["A faire", "En cours", "En revision", "Terminee"];

/**
 * Pour ajouter une tache
 * @param {string} title - Titre de la tâche
 * @param {string} description - Description de la tâche
 * @param {string} priority - Priorité (Faible, Moyenne, Élevée)
 * @param {BigInt} dueDate - Date limite en millisecondes (timestamp EPOCH)
 * @param {string} assignedTo - Membre de l'équipe assigné
 * @returns {Promise<Object>} La tâche créée
 */
export const addTodo = async (title, description, priority = "Moyenne", dueDate = null, assignedTo = null, status = "A faire") => {
    console.log("Ajout d'une tâche avec les paramètres:", {
        title,
        description,
        priority,
        dueDate: dueDate ? dueDate.toString() : null,
        assignedTo,
        status
    });

    if (!VALID_STATUSES.includes(status)) {
        throw new Error(`Statut invalide. Les statuts valides sont : ${VALID_STATUSES.join(", ")}`);
    }

    try {
        const todo = await prisma.todo.create({
            data: { 
                title, 
                description, 
                status,
                priority,
                dueDate,
                assignedTo
            },
        });

        console.log("Tâche créée:", todo);
        return todo;
    } catch (error) {
        console.error("Erreur lors de la création de la tâche:", error);
        throw error;
    }
};

/**
 * Obtenir la liste de toutes les taches
 * @returns {Promise<Array>} la liste des taches
 */
export const getTodos = async () => {
    const todos = await prisma.todo.findMany({
        orderBy: [
            { dueDate: 'asc' },
            { priority: 'desc' }
        ]
    });
    return todos;
};

/**
 * Pour la mise à jour complète de la tâche
 * @param {number} id - ID de la tâche
 * @param {Object} updates - Champs à mettre à jour
 * @returns {Promise<Object>} La tâche mise à jour
 */
export const updateTodo = async (id, updates) => {
    const updatedTodo = await prisma.todo.update({
        where: { id },
        data: updates,
    });
    return updatedTodo;
};

/**
 * Pour la mise à jour du statut de la tâche
 * @param {number} id - ID de la tâche
 * @param {string} status - Nouveau statut
 * @returns {Promise<Object>} La tâche mise à jour
 * @throws {Error} Si le statut est invalide ou si la tâche n'existe pas
 */
export const updateTodoStatus = async (id, status) => {
    console.log(`Tentative de mise à jour du statut pour la tâche ${id} vers ${status}`);

    if (!VALID_STATUSES.includes(status)) {
        throw new Error(`Statut invalide. Les statuts valides sont : ${VALID_STATUSES.join(", ")}`);
    }

    try {
        const todo = await prisma.todo.update({
            where: { id },
            data: { status }
        });
        console.log(`Statut de la tâche ${id} mis à jour avec succès vers ${status}`);
        return todo;
    } catch (error) {
        console.error(`Erreur lors de la mise à jour du statut de la tâche ${id}:`, error);
        if (error.code === 'P2025') {
            throw new Error(`La tâche avec l'ID ${id} n'existe pas`);
        }
        throw new Error(`Erreur lors de la mise à jour du statut: ${error.message}`);
    }
};

/**
 * Pour supprimer une tâche
 * @param {number} id - ID de la tâche
 * @throws {Error} Si la tâche n'existe pas ou si une erreur survient
 */
export const deleteTodo = async (id) => {
    try {
        console.log("Suppression de la tâche dans la base de données:", id);
        await prisma.todo.delete({
            where: { id },
        });
        console.log("Tâche supprimée avec succès de la base de données:", id);
    } catch (error) {
        console.error("Erreur lors de la suppression de la tâche dans la base de données:", error);
        throw error;
    }
};
