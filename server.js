//Doit etre en debut de fichier pour charger les variables d'environnement
import "dotenv/config";

//importer les routes
import routerExterne from "./routes.js";

// Importation des fichiers et librairies
import { engine } from "express-handlebars";
import express, { json } from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import cspOption from "./csp-options.js";

// Crréation du serveur express
const app = express();
app.engine("handlebars", engine({
    helpers: {
        eq: function (v1, v2) {
            return v1 === v2;
        },
        toLowerCase: function(str) {
            return str.toLowerCase();
        },
        formatDate: function(timestamp) {
            if (!timestamp) return '';
            const date = new Date(Number(timestamp));
            return date.toLocaleString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }
})); // Moteur de rendu
app.set("view engine", "handlebars"); // Pour indiquer que les vues seront des fichiers .handlebars
app.set("views", "./views"); // Pour indique le dossier contenant les vues

// Ajout de middlewares
app.use(helmet(cspOption));
app.use(compression());
app.use(cors());
app.use(json());

//Middeleware integre a express pour gerer la partie static du serveur
//le dossier 'public' est la partie statique de notre serveur
app.use(express.static("public"));

// Ajout des routes
app.use(routerExterne);

// Renvoyer une erreur 404 pour les routes non définies
app.use((request, response) => {
    // Renvoyer simplement une chaîne de caractère indiquant que la page n'existe pas
    response.status(404).send(`${request.originalUrl} Route introuvable.`);
});

//Démarrage du serveur
app.listen(process.env.PORT);
console.info("Serveur démarré :");
console.info(`http://localhost:${process.env.PORT}`);
