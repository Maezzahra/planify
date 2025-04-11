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

// Fonction simple pour convertir les dates en chaînes de caractères
const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

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

// Page d'accueil - Affiche la liste des tâches
router.get("/", async (request, response) => {
    try {
        const taches = await getTodos();
        response.render("index", {
            titre: "Accueil",
            styles: ["./css/style.css", "./css/index.css", "./css/modal.css"],
            scripts: ["./js/main.js"],
            taches: taches
        });
    } catch (error) {
        console.error("Erreur:", error);
        response.status(500).send("Une erreur est survenue");
    }
});

// Page du tableau des tâches (style Trello)
router.get("/board", async (request, response) => {
    try {
        const taches = await getTodos();
        response.render("tableau", {
            titre: "Tableau des Tâches",
            styles: ["./css/styles.css"],
            scripts: ["./js/dragAndDrop.js"],
            todos: taches
        });
    } catch (error) {
        console.error("Erreur:", error);
        response.status(500).send("Une erreur est survenue");
    }
});

// Page des détails d'une tâche
router.get("/task/:id", async (request, response) => {
    try {
        const id = parseInt(request.params.id);
        
        // Récupérer la tâche avec son statut et sa priorité
        const task = await prisma.tache.findUnique({
            where: { id },
            include: {
                statut: true,
                priorite: true
            }
        });

        if (!task) {
            return response.status(404).send("Tâche non trouvée");
        }

        // Récupérer l'historique de la tâche
        const history = await getTodoHistory(id);

        // Formater la tâche pour l'affichage
        const formattedTask = {
            ...task,
            statut: task.statut.nom,
            priorite: task.priorite.nom
        };

        response.render("details-tache", {
            titre: `Tâche: ${task.titre}`,
            task: formattedTask,
            history: history
        });
    } catch (error) {
        console.error("Erreur:", error);
        response.status(500).send("Une erreur est survenue");
    }
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

// API pour ajouter une nouvelle tâche
router.post("/api/todo", async (req, res) => {
    try {
        // Validation des données
        const validation = validateTodo(req.body);
        if (!validation.isValid) {
            return res.status(400).json({ message: validation.errors.join(', ') });
        }

        // Récupérer le statut et la priorité
        const [status, priority] = await Promise.all([
            prisma.statut.findUnique({
                where: { nom: req.body.statut }
            }),
            prisma.priorite.findUnique({
                where: { nom: req.body.priorite }
            })
        ]);

        if (!status || !priority) {
            return res.status(400).json({ message: "Statut ou priorité invalide" });
        }

        // Créer la tâche
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

        // Créer l'entrée dans l'historique
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

        // Formater la réponse
        const responseTodo = {
            ...todo,
            statut: status.nom,
            priorite: priority.nom
        };

        res.status(201).json({ todo: serializeBigInt(responseTodo) });
    } catch (error) {
        console.error("Erreur:", error);
        res.status(500).json({ message: "Une erreur est survenue" });
    }
});

// API pour mettre à jour une tâche
router.patch("/api/todo/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { titre, description, statut, priorite, dateEcheance, assigneA } = req.body;

        // Récupérer le statut et la priorité
        const [statutExistant, prioriteExistante] = await Promise.all([
            prisma.statut.findFirst({ where: { nom: statut } }),
            prisma.priorite.findFirst({ where: { nom: priorite } })
        ]);

        if (!statutExistant || !prioriteExistante) {
            return res.status(400).json({ error: "Statut ou priorité invalide" });
        }

        // Mettre à jour la tâche
        const tache = await prisma.tache.update({
            where: { id: parseInt(id) },
            data: {
                titre,
                description,
                dateEcheance: BigInt(new Date(dateEcheance).getTime()),
                assigneA,
                statut: { connect: { id: statutExistant.id } },
                priorite: { connect: { id: prioriteExistante.id } }
            },
            include: {
                statut: true,
                priorite: true
            }
        });

        // Créer l'entrée dans l'historique
        await prisma.historiqueTache.create({
            data: {
                tacheId: tache.id,
                typeChangement: "MODIFICATION",
                titre: tache.titre,
                description: tache.description,
                priorite: prioriteExistante.nom,
                dateEcheance: tache.dateEcheance,
                assigneA: tache.assigneA,
                statut: statutExistant.nom,
            },
        });

        // Formater la réponse
        const responseTache = {
            ...tache,
            statut: statutExistant.nom,
            priorite: prioriteExistante.nom
        };

        res.json(serializeBigInt(responseTache));
    } catch (error) {
        console.error("Erreur:", error);
        res.status(500).json({ error: "Une erreur est survenue" });
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

// API pour supprimer une tâche
router.delete("/api/todo/:id", async (request, response) => {
    try {
        const id = parseInt(request.params.id);
        await deleteTodo(id);
        response.status(200).json({ message: "Tâche supprimée avec succès" });
    } catch (error) {
        console.error("Erreur:", error);
        response.status(500).json({ error: "Une erreur est survenue" });
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