// importer ler client prisma
import { PrismaClient } from "@prisma/client";

//Creer une instance de prisma
const prisma = new PrismaClient();

/**
 * Pour ajouter une tache
 * @param {*} description
 */
export const addTodo = async (title, description, status = "A faire") => {
    const todo = await prisma.todo.create({
        data: { title, description, status },
    });
    return todo;
};


/**
 * Obtenir la liste de toutes les taches
 * @returns la liste des taches
 */
export const getTodos = async () => {
    const todos = await prisma.todo.findMany();
    return todos;
};

/**
 * Pour la mise à jour de la tache
 * @param {*} id
 * @returns todo
 */
export const updateTodoStatus = async (id, status) => {
    const updatedTodo = await prisma.todo.update({
        where: { id },
        data: { status },
    });
    return updatedTodo;
};

export const deleteTodo = async (id) => {
    await prisma.todo.delete({
        where: { id },
    });
};
