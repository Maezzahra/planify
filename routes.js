import { Router } from "express";
import { 
    addTodo, 
    getTodos, 
    updateTodo, 
    updateTodoStatus, 
    deleteTodo, 
    getTodoHistory, 
    getStatuses, 
    getPriorities 
} from "./model/todo.js";
import { PrismaClient } from "@prisma/client";
import { validateTodo } from './model/validations/todoValidations.js';

const router = Router();
const prisma = new PrismaClient();

// Fonction utilitaire pour sérialiser les BigInt
const serializeBigInt = (obj) => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return obj.toString();
    if (Array.isArray(obj)) return obj.map(serializeBigInt);
    if (typeof obj === 'object') {
        const result = {};
        for (const key in obj) {
            result[key] = serializeBigInt(obj[key]);
        }
        return result;
    }
    return obj;
};

//Définition des routes
// Route pour la page d'accueil
router.get("/", async (request, response) => {
    response.render("index", {
        titre: "Accueil",
        styles: ["./css/style.css", "./css/index.css", "./css/modal.css"],
        scripts: ["./js/main.js"],
        taches: await getTodos(),
    });
});

// Route pour la page document
router.get("/document", (request, response) => {
    response.render("document", {
        titre: "Document",
        styles: ["./css/style.css", "./css/document.css"],
        scripts: ["./js/main.js"],
    });
});

// Route pour obtenir la liste des tâches
router.get("/api/todos", async (request, response) => {
    try {
        const todos = await getTodos();
        return response.status(200).json(serializeBigInt(todos));
    } catch (error) {
        return response.status(400).json({ error: error.message });
    }
});

// Route pour obtenir tous les statuts
router.get("/api/statuses", async (request, response) => {
    try {
        const statuses = await getStatuses();
        return response.status(200).json(statuses);
    } catch (error) {
        return response.status(500).json({ error: error.message });
    }
});

// Route pour obtenir toutes les priorités
router.get("/api/priorities", async (request, response) => {
    try {
        const priorities = await getPriorities();
        return response.status(200).json(priorities);
    } catch (error) {
        return response.status(500).json({ error: error.message });
    }
});

// Route pour ajouter une tâche
router.post("/api/todo", async (req, res) => {
    try {
        // Validation des données
        const validation = validateTodo(req.body);
        if (!validation.isValid) {
            return res.status(400).json({ message: validation.errors.join(', ') });
        }

        // Récupérer les IDs des relations
        const [status, priority] = await Promise.all([
            prisma.statut.findUnique({
                where: { nom: req.body.statut }
            }),
            prisma.priorite.findUnique({
                where: { nom: req.body.priorite }
            })
        ]);

        if (!status || !priority) {
            return res.status(400).json({ 
                message: "Statut ou priorité invalide" 
            });
        }

        const todo = await prisma.tache.create({
            data: {
                titre: req.body.titre,
                description: req.body.description,
                statutId: status.id,
                prioriteId: priority.id,
                dateEcheance: BigInt(new Date(req.body.dateEcheance).getTime()),
                assigneA: req.body.assigneA
            },
            include: {
                statut: true,
                priorite: true
            }
        });

        // Création de l'entrée d'historique
        await prisma.historiqueTache.create({
            data: {
                tacheId: todo.id,
                typeChangement: "CREATION",
                titre: todo.titre,
                description: todo.description,
                priorite: priority.nom,
                dateEcheance: todo.dateEcheance,
                assigneA: todo.assigneA,
                statut: status.nom,
            },
        });

        // Formater la réponse pour inclure les noms au lieu des IDs
        const responseTodo = {
            ...todo,
            statut: status.nom,
            priorite: priority.nom
        };

        // Sérialiser la réponse pour gérer les BigInt
        res.status(201).json({ todo: serializeBigInt(responseTodo) });
    } catch (error) {
        console.error("Erreur lors de l'ajout de la tâche:", error);
        res.status(500).json({ message: "Erreur lors de l'ajout de la tâche" });
    }
});

// Route pour mettre à jour une tâche
router.patch("/api/todo/:id", async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validation des données
        const validation = validateTodo(req.body);
        if (!validation.isValid) {
            return res.status(400).json({ message: validation.errors.join(', ') });
        }

        const todo = await prisma.tache.update({
            where: { id: parseInt(id) },
            data: {
                titre: req.body.titre,
                description: req.body.description,
                priorite: req.body.priorite,
                dateEcheance: req.body.dateEcheance,
                assigneA: req.body.assigneA,
                statut: req.body.statut,
            },
        });

        // Création de l'entrée d'historique
        await prisma.historiqueTache.create({
            data: {
                tacheId: todo.id,
                typeChangement: "MODIFICATION",
                titre: todo.titre,
                description: todo.description,
                priorite: todo.priorite,
                dateEcheance: todo.dateEcheance,
                assigneA: todo.assigneA,
                statut: todo.statut,
            },
        });

        res.json({ todo });
    } catch (error) {
        console.error("Erreur lors de la mise à jour de la tâche:", error);
        res.status(500).json({ message: "Erreur lors de la mise à jour de la tâche" });
    }
});

// Route pour mettre à jour le statut d'une tâche
router.patch("/api/todo/:id/status", async (request, response) => {
    try {
        const id = parseInt(request.params.id);
        const { statut } = request.body;

        if (!["A faire", "En cours", "En revision", "Terminee"].includes(statut)) {
            return response.status(400).json({ error: "Statut invalide" });
        }

        const todo = await updateTodoStatus(id, statut);
        
        // Convertir le BigInt en string dans la réponse
        const todoResponse = {
            ...todo,
            dateEcheance: todo.dateEcheance ? todo.dateEcheance.toString() : null
        };

        return response.status(200).json({ todo: todoResponse, message: "Statut mis à jour avec succès" });
    } catch (error) {
        console.error("Erreur lors de la mise à jour du statut:", error);
        return response.status(400).json({ error: error.message });
    }
});

// Route pour supprimer une tâche
router.delete("/api/todo/:id", async (request, response) => {
    try {
        const id = parseInt(request.params.id);
        console.log("Tentative de suppression de la tâche:", id);

        if (isNaN(id)) {
            return response.status(400).json({ error: "ID de tâche invalide" });
        }

        await deleteTodo(id);
        console.log("Tâche supprimée avec succès:", id);
        return response.status(200).json({ message: "Tâche supprimée avec succès" });
    } catch (error) {
        console.error("Erreur lors de la suppression de la tâche:", error);
        if (error.code === 'P2025') {
            return response.status(404).json({ error: "Tâche non trouvée" });
        }
        return response.status(500).json({ error: "Erreur lors de la suppression de la tâche" });
    }
});

// Route pour obtenir l'historique d'une tâche
router.get("/api/todo/:id/history", async (request, response) => {
    try {
        const id = parseInt(request.params.id);
        
        if (isNaN(id)) {
            return response.status(400).json({ error: "ID de tâche invalide" });
        }

        const history = await getTodoHistory(id);
        
        // Convertir les BigInt en string dans la réponse
        const historyResponse = history.map(entry => ({
            ...entry,
            dateEcheance: entry.dateEcheance ? entry.dateEcheance.toString() : null
        }));

        return response.status(200).json(historyResponse);
    } catch (error) {
        console.error("Erreur lors de la récupération de l'historique:", error);
        return response.status(500).json({ error: "Erreur lors de la récupération de l'historique" });
    }
});

export default router;