-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TodoHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "todoId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "dueDate" BIGINT,
    "assignedTo" TEXT,
    "changeType" TEXT NOT NULL,
    "changedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TodoHistory_todoId_fkey" FOREIGN KEY ("todoId") REFERENCES "Todo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TodoHistory" ("assignedTo", "changeType", "changedBy", "createdAt", "description", "dueDate", "id", "priority", "status", "title", "todoId") SELECT "assignedTo", "changeType", "changedBy", "createdAt", "description", "dueDate", "id", "priority", "status", "title", "todoId" FROM "TodoHistory";
DROP TABLE "TodoHistory";
ALTER TABLE "new_TodoHistory" RENAME TO "TodoHistory";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
