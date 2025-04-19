import "dotenv/config";

import { engine } from "express-handlebars";
import express, { json } from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import cspOption from "./csp-options.js";

// Importation de la session
import session from "express-session";
import memorystore from "memorystore";
import passport from "passport";

import routerExterne from "./routes.js";
import "./authentification.js";

// Création du serveur express
const app = express();

// Initialisation de la base de données de session
const MemoryStore = memorystore(session);

// Configuration du moteur de vue handlebars avec helpers personnalisés
app.engine("handlebars", engine({
    helpers: {
        eq: (v1, v2) => v1 === v2,
        toLowerCase: str => str.toLowerCase(),
        formatDate: (timestamp) => {
            if (!timestamp) return '';
            const date = new Date(Number(timestamp));
            return date.toLocaleString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        },
        formatDateForInput: (date) => {
            if (!date) return '';
            const timestamp = typeof date === 'bigint' ? Number(date) : date;
            const d = new Date(timestamp);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        }
    }
}));
app.set("view engine", "handlebars");
app.set("views", "./views");

// Middlewares de sécurité et performance
app.use(helmet(cspOption));
app.use(compression());
app.use(cors());
app.use(json());

// Middleware de session
app.use(session({
    cookie: { maxAge: 3600000 },
    name: process.env.npm_package_name,
    store: new MemoryStore({ checkPeriod: 3600000 }),
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET
}));

// Middleware de Passport
app.use(passport.initialize());
app.use(passport.session());

// Fichiers statiques
app.use(express.static("public"));

// Routes
app.use(routerExterne);

// Erreur 404
app.use((request, response) => {
    response.status(404).send(`${request.originalUrl} Route introuvable.`);
});

// Démarrage du serveur
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.info(`Serveur démarré avec succès sur http://0.0.0.0:${PORT}`);
});
