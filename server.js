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
        },
        formatDateForInput: function(date) {
            if (!date) return '';
            // Convertir BigInt en nombre si nécessaire
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
})); // Moteur de rendu
app.set("view engine", "handlebars"); // Pour indiquer que les vues seront des fichiers .handlebars
app.set("views", "./views"); // Pour indique le dossier contenant les vues

// Ajout de middlewares
app.use(helmet(cspOption));
app.use(compression());
app.use(cors());
app.use(json());


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
