import { Router } from "express";
import { addTodo, getTodos, updateTodo, updateTodoStatus, deleteTodo } from "./model/todo.js";

const router = Router();

//Definition des routes
// Route pour la page d'accueil
router.get("/", async (request, response) => {
    response.render("index", {
        titre: "Accueil",
        styles: ["./css/style.css", "./css/index.css"],
        scripts: ["./js/main.js"],
        todos: await getTodos(),
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

// Route pour obtenir la liste des taches
router.get("/api/todos", async (request, response) => {
    try {
        const todos = await getTodos();
        return response.status(200).json(todos);
    } catch (error) {
        return response.status(400).json({ error: error.message });
    }
});

// Route pour ajouter une tache
router.post("/api/todo", async (request, response) => {
    try {
        const { title, description, priority, dueDate, assignedTo, status } = request.body;
        console.log("Données reçues:", { title, description, priority, dueDate, assignedTo, status });

        if (!title || title.trim() === "") {
            return response.status(400).json({ error: "Le titre est requis" });
        }

        // Validation de la priorité
        if (priority && !["Faible", "Moyenne", "Élevée"].includes(priority)) {
            return response.status(400).json({ error: "Priorité invalide" });
        }

        console.log("Conversion de la date:", dueDate);
        const dueDateBigInt = dueDate ? BigInt(dueDate) : null;
        console.log("Date convertie:", dueDateBigInt);

        const todo = await addTodo(
            title,
            description,
            priority,
            dueDateBigInt,
            assignedTo,
            status || "A faire"
        );
        
        // Conversion du BigInt en string pour la réponse JSON
        const todoResponse = {
            ...todo,
            dueDate: todo.dueDate ? todo.dueDate.toString() : null
        };
        
        return response.status(200).json({ todo: todoResponse, message: "Tâche ajoutée avec succès" });
    } catch (error) {
        console.error("Erreur lors de l'ajout de la tâche:", error);
        return response.status(400).json({ error: error.message });
    }
});

// Constantes pour les statuts valides
const VALID_STATUSES = ["A faire", "En cours", "En revision", "Terminee"];

// Route pour mettre à jour une tache complètement
router.put("/api/todo/:id", async (request, response) => {
    try {
        const id = parseInt(request.params.id);
        const updates = request.body;

        // Validation de la priorité si elle est fournie
        if (updates.priority && !["Faible", "Moyenne", "Élevée"].includes(updates.priority)) {
            return response.status(400).json({ error: "Priorité invalide" });
        }

        // Validation du statut si fourni
        if (updates.status && !VALID_STATUSES.includes(updates.status)) {
            return response.status(400).json({ error: "Statut invalide" });
        }

        // Conversion de la date limite en BigInt si fournie
        if (updates.dueDate) {
            updates.dueDate = BigInt(updates.dueDate);
        }

        const todo = await updateTodo(id, updates);
        return response.status(200).json({ todo, message: "Tâche mise à jour avec succès" });
    } catch (error) {
        console.error("Erreur lors de la mise à jour:", error);
        return response.status(400).json({ error: error.message });
    }
});

// Route pour mettre à jour une tache
router.patch("/api/todo/:id/status", async (request, response) => {
    try {
        const id = parseInt(request.params.id);
        const { status } = request.body;

        if (!VALID_STATUSES.includes(status)) {
            return response.status(400).json({ error: "Statut invalide. Les statuts valides sont : " + VALID_STATUSES.join(", ") });
        }

        const todo = await updateTodoStatus(id, status);
        
        // Convertir le BigInt en string dans la réponse
        const todoResponse = {
            ...todo,
            dueDate: todo.dueDate ? todo.dueDate.toString() : null
        };

        return response.status(200).json({ todo: todoResponse, message: "Statut mis à jour avec succès" });
    } catch (error) {
        console.error("Erreur lors de la mise à jour du statut:", error);
        return response.status(400).json({ error: error.message });
    }
});

// Route pour supprimer une tache
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

export default router;