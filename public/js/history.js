document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('history-modal');
    const closeBtn = document.querySelector('.close-modal');
    const historyList = document.getElementById('history-list');

    // Fermer la modale
    closeBtn.onclick = function() {
        modal.style.display = "none";
    }

    // Fermer la modale en cliquant en dehors
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    // Gestionnaire pour les boutons d'historique
    document.querySelectorAll('.history-btn').forEach(button => {
        button.addEventListener('click', async function() {
            const taskId = this.dataset.id;
            try {
                const response = await fetch(`/api/todo/${taskId}/history`);
                if (!response.ok) {
                    throw new Error(`Erreur HTTP: ${response.status}`);
                }
                const historyData = await response.json();
                
                if (Array.isArray(historyData)) {
                    displayHistory(historyData);
                    modal.style.display = "block";
                }
            } catch (error) {
                console.error('Erreur lors de la récupération de l\'historique:', error);
                alert('Erreur lors de la récupération de l\'historique');
            }
        });
    });

    // Fonction pour afficher l'historique
    function displayHistory(history) {
        historyList.innerHTML = '';
        
        history.forEach(entry => {
            const item = document.createElement('div');
            item.className = 'history-item';
            
            const changeTypes = {
                'CREATE': 'Création',
                'UPDATE': 'Modification',
                'DELETE': 'Suppression'
            };
            
            const date = new Date(entry.createdAt);
            const formattedDate = date.toLocaleString('fr-FR', {
                dateStyle: 'long',
                timeStyle: 'short'
            });
            
            item.innerHTML = `
                <div class="history-type">${changeTypes[entry.changeType]}</div>
                <div class="history-date">${formattedDate}</div>
                <div class="history-details">
                    <div class="history-field">
                        <span>Titre:</span> ${entry.title}
                    </div>
                    ${entry.description ? `
                        <div class="history-field">
                            <span>Description:</span> ${entry.description}
                        </div>
                    ` : ''}
                    <div class="history-field">
                        <span>Statut:</span> ${entry.status}
                    </div>
                    <div class="history-field">
                        <span>Priorité:</span> ${entry.priority}
                    </div>
                    ${entry.assignedTo ? `
                        <div class="history-field">
                            <span>Assigné à:</span> ${entry.assignedTo}
                        </div>
                    ` : ''}
                    ${entry.dueDate ? `
                        <div class="history-field">
                            <span>Date d'échéance:</span> ${new Date(parseInt(entry.dueDate)).toLocaleDateString('fr-FR')}
                        </div>
                    ` : ''}
                </div>
            `;
            
            historyList.appendChild(item);
        });
    }
}); 