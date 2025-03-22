// On attend que la page soit complètement chargée
document.addEventListener('DOMContentLoaded', function() {
    // Récupération des éléments de la page
    var boutonModifier = document.getElementById('btn-edit');
    var boutonSupprimer = document.getElementById('btn-delete');
    var formulaire = document.getElementById('edit-form');
    var contenuTache = document.querySelector('.task-info');
    var boutonAnnuler = document.getElementById('btn-cancel');
    
    // On récupère l'identifiant de la tâche
    var conteneurTache = document.querySelector('.task-details-container');
    var idTache = conteneurTache.dataset.taskId;

    // Quand on clique sur le bouton modifier
    boutonModifier.addEventListener('click', function() {
        // On affiche le formulaire
        formulaire.style.display = 'block';
        // On cache le contenu de la tâche
        contenuTache.style.display = 'none';
    });

    // Quand on clique sur le bouton annuler
    boutonAnnuler.addEventListener('click', function() {
        // On cache le formulaire
        formulaire.style.display = 'none';
        // On affiche le contenu de la tâche
        contenuTache.style.display = 'block';
    });

    // Quand on soumet le formulaire de modification
    formulaire.addEventListener('submit', function(event) {
        // On empêche l'envoi normal du formulaire
        event.preventDefault();
        
        // On récupère les données du formulaire
        var donnees = new FormData(formulaire);
        var donneesModifiees = {};
        
        // On convertit les données du formulaire en objet simple
        donnees.forEach(function(valeur, cle) {
            donneesModifiees[cle] = valeur;
        });

        // On convertit la date en timestamp
        if (donneesModifiees.dateEcheance) {
            var date = new Date(donneesModifiees.dateEcheance);
            donneesModifiees.dateEcheance = date.getTime();
        }

        // On affiche les données dans la console pour vérifier
        console.log('Données à envoyer:', donneesModifiees);

        // On envoie les modifications au serveur
        fetch('/api/todo/' + idTache, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(donneesModifiees)
        })
        .then(function(reponse) {
            // On vérifie si la réponse est ok
            if (reponse.ok) {
                // Si oui, on recharge la page
                window.location.reload();
            } else {
                // Si non, on affiche une erreur
                reponse.json().then(function(erreur) {
                    alert('Erreur: ' + (erreur.message || 'Problème lors de la modification'));
                });
            }
        })
        .catch(function(erreur) {
            // En cas d'erreur de connexion
            alert('Erreur de connexion: ' + erreur.message);
        });
    });

    // Quand on clique sur le bouton supprimer
    boutonSupprimer.addEventListener('click', function() {
        // On demande confirmation
        var confirmation = confirm('Voulez-vous vraiment supprimer cette tâche ?');
        
        // Si l'utilisateur confirme
        if (confirmation) {
            // On envoie la demande de suppression au serveur
            fetch('/api/todo/' + idTache, {
                method: 'DELETE'
            })
            .then(function(reponse) {
                // On vérifie si la suppression a réussi
                if (reponse.ok) {
                    // Si oui, on retourne au tableau des tâches
                    window.location.href = '/board';
                } else {
                    // Si non, on affiche une erreur
                    alert('Erreur lors de la suppression');
                }
            })
            .catch(function(erreur) {
                // En cas d'erreur de connexion
                alert('Erreur de connexion: ' + erreur.message);
            });
        }
    });
}); 