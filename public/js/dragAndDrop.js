document.addEventListener('DOMContentLoaded', () => {
    const tasks = document.querySelectorAll('.todo-item');
    const columns = document.querySelectorAll('.task-list');

    // Ajouter les événements de drag pour chaque tâche
    tasks.forEach(task => {
        const dragHandle = task.querySelector('.drag-handle');
        
        // Empêcher le clic de navigation lors du drag
        dragHandle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });

        // Démarrer le drag uniquement depuis la poignée
        dragHandle.addEventListener('mousedown', () => {
            task.draggable = true;
        });

        task.addEventListener('mouseup', () => {
            task.draggable = false;
        });

        task.addEventListener('dragstart', dragStart);
        task.addEventListener('dragend', dragEnd);

        // Gérer la navigation vers les détails de la tâche
        task.addEventListener('click', (e) => {
            if (!task.draggable) {
                const taskId = task.dataset.id;
                window.location.href = `/task/${taskId}`;
            }
        });
    });

    // Ajouter les événements de drop pour chaque colonne
    columns.forEach(column => {
        column.addEventListener('dragover', dragOver);
        column.addEventListener('drop', drop);
    });

    function dragStart(e) {
        e.target.classList.add('dragging');
        e.dataTransfer.setData('text/plain', e.target.dataset.id);
    }

    function dragEnd(e) {
        e.target.classList.remove('dragging');
        e.target.draggable = false;
    }

    function dragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    function drop(e) {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('text/plain');
        const task = document.querySelector(`[data-id="${taskId}"]`);
        const targetColumn = e.target.closest('.task-list');
        
        if (task && targetColumn) {
            const newStatus = targetColumn.dataset.status;
            
            // Envoyer la mise à jour au serveur
            updateTaskStatus(taskId, newStatus).then(() => {
                targetColumn.appendChild(task);
            }).catch(error => {
                console.error('Erreur lors de la mise à jour du statut:', error);
            });
        }
    }

    // Fonction pour mettre à jour le statut de la tâche sur le serveur
    async function updateTaskStatus(taskId, newStatus) {
        try {
            const response = await fetch(`/api/todo/${taskId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ statut: newStatus })
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la mise à jour du statut');
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur:', error);
            throw error;
        }
    }
}); 