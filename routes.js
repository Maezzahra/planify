import { Router } from "express";
import { addTodo, getTodos, updateTodoStatus, deleteTodo } from "./model/todo.js";

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
        const { title, description, status } = request.body;

        if (!title || title.trim() === "") {
            return response.status(400).json({ error: "Le titre est requis" });
        }

        const todo = await addTodo(title, description, status || "A faire");
        return response.status(200).json({ todo, message: "Tâche ajoutée avec succès" });
    } catch (error) {
        return response.status(400).json({ error: error.message });
    }
});

// Route pour mettre à jour une tache
router.patch("/api/todo/:id/status", async (request, response) => {
    try {
        const id = parseInt(request.params.id);
        const { status } = request.body;

        if (!["A faire", "En progres", "Fait"].includes(status)) {
            return response.status(400).json({ error: "Statut invalide" });
        }

        const todo = await updateTodoStatus(id, status);
        return response.status(200).json({ todo, message: "Statut mis à jour avec succès" });
    } catch (error) {
        return response.status(400).json({ error: error.message });
    }
});

// Route pour supprimer une tache
router.delete("/api/todo/:id", async (request, response) => {
    try {
        const id = parseInt(request.params.id);
        await deleteTodo(id);
        return response.status(200).json({ message: "Tâche supprimée avec succès" });
    } catch (error) {
        return response.status(400).json({ error: error.message });
    }
});

export default router;