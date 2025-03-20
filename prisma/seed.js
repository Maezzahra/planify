import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Créer les statuts
    const statuts = [
        { nom: "A faire" },
        { nom: "En cours" },
        { nom: "En revision" },
        { nom: "Terminee" }
    ];

    // Créer les priorités
    const priorites = [
        { nom: "Faible" },
        { nom: "Moyenne" },
        { nom: "Élevée" }
    ];

    // Insérer les statuts
    for (const statut of statuts) {
        await prisma.statut.upsert({
            where: { nom: statut.nom },
            update: {},
            create: statut
        });
    }

    // Insérer les priorités
    for (const priorite of priorites) {
        await prisma.priorite.upsert({
            where: { nom: priorite.nom },
            update: {},
            create: priorite
        });
    }

    console.log('Base de données initialisée avec succès !');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    }); 