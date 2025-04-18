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
import { isEmailValid, isPasswordValid, isNameValid } from './validation.js';
import { addUser, getUserByEmail } from './model/user.js';
import bcrypt from 'bcrypt';

const router = Router();
const prisma = new PrismaClient();
//Definition des routes

//Route pour la connexion
router.post("/connexion", async (request, response) => {
    try {
        const { email, password } = request.body;
        
        // Validation des données
        if (!isEmailValid(email) || !isPasswordValid(password)) {
            return response.status(400).json({
                error: "Email ou mot de passe invalide"
            });
        }

        // Vérifier si l'utilisateur existe
        const user = await getUserByEmail(email);
        if (!user) {
            return response.status(401).json({
                error: "Email ou mot de passe incorrect"
            });
        }

        // Vérifier le mot de passe
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return response.status(401).json({
                error: "Email ou mot de passe incorrect"
            });
        }

        // Créer la session
        request.session.user = user;

        response.status(200).json({
            message: "Connexion réussie",
            user
        });
    } catch (error) {
        console.error("Erreur de connexion:", error);
        response.status(500).json({
            error: "Erreur lors de la connexion"
        });
    }
});

//Route deconnexion
router.get("/deconnexion", (request, response) => {
    if (!request.session.user) {
        return response.redirect("/connexion");
    }
    
    request.session.destroy((err) => {
        if (err) {
            console.error("Erreur lors de la destruction de la session:", err);
        }
        response.redirect("/connexion");
    });
});

//Route pour inscrire un utilisateur
router.post("/inscription", async (request, response) => {
    try {
        const { email, password, nom } = request.body;
        
        // Validation des données
        if (!isEmailValid(email)) {
            return response.status(400).json({ 
                error: "Email invalide" 
            });
        }
        
        if (!isPasswordValid(password)) {
            return response.status(400).json({ 
                error: "Mot de passe invalide (doit contenir entre 8 et 16 caractères)" 
            });
        }
        
        if (!isNameValid(nom)) {
            return response.status(400).json({ 
                error: "Nom invalide (doit contenir entre 2 et 50 caractères)" 
            });
        }

        const user = await addUser(email, password, nom);
        return response.status(200).json({
            user,
            message: "Utilisateur ajouté avec succès"
        });
    } catch (error) {
        return response.status(400).json({ error: error.message });
    }
});

// Middleware pour rendre l'utilisateur disponible dans tous les templates
router.use((request, response, next) => {
    response.locals.user = request.session.user;
    next();
});

// Route pour afficher la page de connexion
router.get("/connexion", (request, response) => {
    if (request.session.user) {
        return response.redirect("/");
    }
    response.render("connexion", {
        titre: "Connexion",
        styles: ["./css/styles.css"]
    });
});

// Route pour afficher la page d'inscription
router.get("/inscription", (request, response) => {
    if (request.session.user) {
        return response.redirect("/");
    }
    response.render("inscription", {
        titre: "Inscription",
        styles: ["./css/styles.css"]
    });
});

// Route pour afficher la page de déconnexion
router.get("/deconnexion", (request, response) => {
    if (!request.session.user) {
        return response.redirect("/connexion");
    }
    response.render("deconnexion", {
        titre: "Déconnexion",
        styles: ["./css/styles.css"]
    });
});

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
const serializeBigInt = (data) => {
    return JSON.parse(JSON.stringify(data, (key, value) =>
        typeof value === 'bigint'
            ? value.toString()
            : value
    ));
};

// Page d'accueil - Affiche la liste des tâches
router.get("/", async (request, response) => {
    try {
        const taches = await getTodos();
        response.render("index", {
            titre: "Accueil",
            styles: ["./css/styles.css"],
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

// Route pour ajouter une tâche
router.post('/api/todo', async (req, res) => {
    try {
        // Vérifier si l'utilisateur est connecté
        if (!req.session.user) {
            return res.status(401).json({ message: "Vous devez être connecté pour ajouter une tâche" });
        }

        const { titre, description, priorite, dateEcheance, assigneA, statut } = req.body;

        // Validation des champs requis
        if (!titre || !description || !priorite || !dateEcheance || !statut) {
            return res.status(400).json({ message: "Tous les champs requis doivent être remplis" });
        }

        // Préparation des données pour addTodo
        const todoData = {
            titre,
            description,
            priorite,
            dateEcheance: new Date(dateEcheance).getTime(),
            assigneA,
            statut
        };

        // Ajout de la tâche
        const newTodo = await addTodo(todoData);

        // Sérialiser la réponse pour gérer les BigInt
        const serializedTodo = serializeBigInt(newTodo);

        // Réponse avec la nouvelle tâche
        res.status(201).json({ 
            message: "Tâche ajoutée avec succès",
            todo: serializedTodo 
        });

    } catch (error) {
        console.error('Erreur lors de l\'ajout de la tâche:', error);
        res.status(500).json({ message: error.message || "Une erreur est survenue lors de l'ajout de la tâche" });
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

// Route pour vérifier l'état d'authentification
router.get("/api/check-auth", (request, response) => {
    if (request.session.user) {
        response.json({
            isAuthenticated: true,
            user: request.session.user
        });
    } else {
        response.json({
            isAuthenticated: false
        });
    }
});

export default router;