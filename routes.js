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

const router = Router();

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
        return response.status(200).json(todos);
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
router.post("/api/todo", async (request, response) => {
    try {
        const { titre, description, priorite, dateEcheance, assigneA, statut } = request.body;
        console.log("Données reçues:", { titre, description, priorite, dateEcheance, assigneA, statut });

        if (!titre || titre.trim() === "") {
            return response.status(400).json({ error: "Le titre est requis" });
        }

        // Validation de la priorité
        if (priorite && !["Faible", "Moyenne", "Élevée"].includes(priorite)) {
            return response.status(400).json({ error: "Priorité invalide" });
        }

        console.log("Conversion de la date:", dateEcheance);
        const dateEcheanceBigInt = dateEcheance ? BigInt(dateEcheance) : null;
        console.log("Date convertie:", dateEcheanceBigInt);

        const todo = await addTodo(
            titre,
            description,
            priorite,
            dateEcheanceBigInt,
            assigneA,
            statut || "A faire"
        );
        
        // Conversion du BigInt en string pour la réponse JSON
        const todoResponse = {
            ...todo,
            dateEcheance: todo.dateEcheance ? todo.dateEcheance.toString() : null
        };
        
        return response.status(200).json({ todo: todoResponse, message: "Tâche ajoutée avec succès" });
    } catch (error) {
        console.error("Erreur lors de l'ajout de la tâche:", error);
        return response.status(400).json({ error: error.message });
    }
});

// Route pour mettre à jour une tâche complètement
router.put("/api/todo/:id", async (request, response) => {
    try {
        const id = parseInt(request.params.id);
        const update = request.body;

        // Validation de la priorité si elle est fournie
        if (update.priorite && !["Faible", "Moyenne", "Élevée"].includes(update.priorite)) {
            return response.status(400).json({ error: "Priorité invalide" });
        }

        // Validation du statut si fourni
        if (update.statut && !["A faire", "En cours", "En revision", "Terminee"].includes(update.statut)) {
            return response.status(400).json({ error: "Statut invalide" });
        }

        // Conversion de la date limite en BigInt si fournie
        if (update.dateEcheance) {
            update.dateEcheance = BigInt(update.dateEcheance);
        }

        const todo = await updateTodo(id, update);
        return response.status(200).json({ todo, message: "Tâche mise à jour avec succès" });
    } catch (error) {
        console.error("Erreur lors de la mise à jour:", error);
        return response.status(400).json({ error: error.message });
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