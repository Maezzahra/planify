// importer ler client prisma
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

//Creer une instance de prisma
const prisma = new PrismaClient();

//Pour ajouter l'utilisateur
export const addUser = async (email, password, nom) => {
    const user = await prisma.user.create({
        data: {
            email,
            password: await bcrypt.hash(password, 10),
            nom,
            type: "USER",
        },
    });
    return user;
};

//Pour recuperer l'utilisateur par son email
export const getUserByEmail = async (email) => {
    const user = await prisma.user.findUnique({
        where: {
            email,
        },
    });
    return user;
};
