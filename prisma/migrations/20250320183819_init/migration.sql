/*
  Warnings:

  - You are about to drop the `Todo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TodoHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Todo";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TodoHistory";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Statut" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateMaj" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Priorite" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateMaj" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "HistoriqueTache" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tacheId" INTEGER NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "statut" TEXT NOT NULL,
    "priorite" TEXT NOT NULL,
    "dateEcheance" BIGINT,
    "assigneA" TEXT,
    "typeChangement" TEXT NOT NULL,
    "modifiePar" TEXT,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HistoriqueTache_tacheId_fkey" FOREIGN KEY ("tacheId") REFERENCES "Tache" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tache" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "statutId" INTEGER NOT NULL,
    "prioriteId" INTEGER NOT NULL,
    "dateEcheance" BIGINT,
    "assigneA" TEXT,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateMaj" DATETIME NOT NULL,
    CONSTRAINT "Tache_statutId_fkey" FOREIGN KEY ("statutId") REFERENCES "Statut" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tache_prioriteId_fkey" FOREIGN KEY ("prioriteId") REFERENCES "Priorite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Statut_nom_key" ON "Statut"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Priorite_nom_key" ON "Priorite"("nom");
