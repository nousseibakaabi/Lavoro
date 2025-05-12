import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const ReportForm = ({ onClose, onSuccess, initialData = {} }) => {
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        reported_user_id: initialData.reported_user_id || '',
        project_id: initialData.project_id || '',
        reason: initialData.reason || '',
        details: initialData.details || '',
        report_date: initialData.report_date || new Date().toISOString().split('T')[0],
        reporter_id: initialData.team_manager_id || localStorage.getItem('userId') || '', // Utiliser le manager de l'équipe comme reporter
        team_manager_id: initialData.team_manager_id || '' // Ajouter l'ID du manager de l'équipe
    });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/signin');
                    return;
                }

                // Récupérer l'ID de l'utilisateur connecté si ce n'est pas déjà fait
                if (!formData.reporter_id) {
                    try {
                        const userResponse = await axios.get('http://localhost:3000/users/profile', {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        });

                        if (userResponse.data.success) {
                            const userId = userResponse.data.data._id;
                            localStorage.setItem('userId', userId);
                            setFormData(prev => ({ ...prev, reporter_id: userId }));
                        }
                    } catch (userError) {
                        console.error('Erreur lors de la récupération du profil:', userError);
                    }
                }

                // Récupérer la liste des utilisateurs
                const usersResponse = await axios.get('http://localhost:3000/users/all', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                // Récupérer la liste des projets
                const projectsResponse = await axios.get('http://localhost:3000/project/dash', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (usersResponse.data.success) {
                    setUsers(usersResponse.data.data);
                }

                if (Array.isArray(projectsResponse.data)) {
                    setProjects(projectsResponse.data);

                    // Si nous avons des projets et que le project_id n'est pas défini, utiliser le premier projet
                    if (projectsResponse.data.length > 0 && !formData.project_id) {
                        const defaultProject = projectsResponse.data[0];
                        setFormData(prev => ({
                            ...prev,
                            project_id: defaultProject._id
                        }));
                    }
                }
            } catch (error) {
                console.error('Erreur lors de la récupération des données:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate, formData.reporter_id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Vérifier que tous les champs requis sont remplis
            const requiredFields = [];

            // Vérifier uniquement reported_user_id si le champ est visible
            if (!initialData.hideUserField && !formData.reported_user_id) {
                requiredFields.push('Membre à signaler');
            }

            // Vérifier uniquement project_id si le champ est visible
            if (!initialData.hideProjectField && !formData.project_id) {
                requiredFields.push('Projet concerné');
            }

            if (!formData.reason) {
                requiredFields.push('Raison');
            }

            if (!formData.details) {
                requiredFields.push('Détails');
            }

            if (requiredFields.length > 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Champs manquants',
                    text: `Veuillez remplir les champs suivants: ${requiredFields.join(', ')}`
                });
                return;
            }

            // Si le champ reported_user_id est caché mais que initialData.reported_user_id est défini, l'utiliser
            if (initialData.hideUserField && initialData.reported_user_id) {
                formData.reported_user_id = initialData.reported_user_id;
            }

            // Si le champ project_id est caché mais que initialData.projectInfo est défini, utiliser son ID
            if (initialData.hideProjectField && initialData.projectInfo) {
                formData.project_id = initialData.projectInfo._id || initialData.projectInfo.project_id;
            }

            // S'assurer que team_manager_id est défini
            if (initialData.team_manager_id) {
                formData.team_manager_id = initialData.team_manager_id;
            }

            // Vérifier que l'ID du reporter est présent
            if (!formData.reporter_id) {
                // Si l'ID n'est pas disponible, utiliser un ID par défaut pour les tests
                setFormData(prev => ({
                    ...prev,
                    reporter_id: '60d0fe4f5311236168a109ca' // ID de test
                }));

                Swal.fire({
                    icon: 'info',
                    title: 'Mode développement',
                    text: 'Utilisation d\'un ID de reporter par défaut'
                });
                return; // Sortir pour laisser le useEffect mettre à jour formData
            }

            // This will be replaced by the actual data being submitted

            try {
                // Prepare data for submission
                const dataToSubmit = { ...formData };

                // If fields are hidden but we have values from initialData, use them
                if (initialData.hideUserField && initialData.reported_user_id) {
                    dataToSubmit.reported_user_id = initialData.reported_user_id;
                }

                // S'assurer que project_id est toujours défini
                if (!dataToSubmit.project_id || dataToSubmit.project_id === '') {
                    // Essayer d'abord d'utiliser le projet de l'équipe
                    if (initialData.projectInfo && (initialData.projectInfo._id || initialData.projectInfo.project_id)) {
                        dataToSubmit.project_id = initialData.projectInfo._id || initialData.projectInfo.project_id;
                    }
                    // Sinon, utiliser le premier projet disponible
                    else if (projects.length > 0) {
                        dataToSubmit.project_id = projects[0]._id;
                    }
                    // Si aucun projet n'est disponible, utiliser un ID par défaut (à remplacer par un ID valide)
                    else {
                        // ID de projet par défaut (à remplacer par un ID valide dans votre système)
                        dataToSubmit.project_id = "64f8b0e5e6f5d1a1e7c5a1b2";
                    }
                }

                // S'assurer que team_manager_id est défini
                if (initialData.team_manager_id) {
                    dataToSubmit.team_manager_id = initialData.team_manager_id;
                    // Définir également reporter_id sur team_manager_id
                    dataToSubmit.reporter_id = initialData.team_manager_id;
                } else {
                    // Si team_manager_id n'est pas défini, utiliser reporter_id comme team_manager_id
                    dataToSubmit.team_manager_id = dataToSubmit.reporter_id;
                }

                // S'assurer que reporter_id est défini
                if (!dataToSubmit.reporter_id || dataToSubmit.reporter_id === '') {
                    // Utiliser l'ID de l'utilisateur stocké dans localStorage
                    const userId = localStorage.getItem('userId');
                    if (userId) {
                        dataToSubmit.reporter_id = userId;
                        // Si team_manager_id n'est pas défini, utiliser également cet ID
                        if (!dataToSubmit.team_manager_id || dataToSubmit.team_manager_id === '') {
                            dataToSubmit.team_manager_id = userId;
                        }
                    } else {
                        // ID par défaut si aucun ID n'est disponible
                        dataToSubmit.reporter_id = "60d0fe4f5311236168a109ca";
                        dataToSubmit.team_manager_id = "60d0fe4f5311236168a109ca";
                    }
                }

                // Log the actual data being submitted
                console.log('Envoi des données:', dataToSubmit);

                // Pour les tests, ne pas envoyer le token d'authentification
                const response = await axios.post('http://localhost:3000/reports/create', dataToSubmit);

                console.log('Réponse du serveur:', response.data);

                // Fermer le modal et rafraîchir la liste
                if (onClose) {
                    onClose();
                }

                if (onSuccess) {
                    onSuccess();
                }

                // Afficher une popup simplifiée de confirmation avec SweetAlert2
                Swal.fire({
                    icon: 'success',
                    title: 'Rapport créé avec succès!',
                    text: 'Votre signalement a été enregistré et sera traité prochainement.',
                    confirmButtonText: 'OK'
                });
            } catch (apiError) {
                console.error('Erreur API:', apiError);

                // Si le rapport a été créé malgré l'erreur (problème de réponse)
                if (apiError.response && apiError.response.status === 201) {
                    // Fermer le modal et rafraîchir la liste
                    if (onClose) {
                        onClose();
                    }

                    if (onSuccess) {
                        onSuccess();
                    }

                    // Afficher une popup de succès simplifiée
                    Swal.fire({
                        icon: 'success',
                        title: 'Rapport créé avec succès!',
                        text: 'Votre signalement a été enregistré et sera traité prochainement.',
                        confirmButtonText: 'OK'
                    });
                } else {
                    throw apiError;
                }
            }
        } catch (error) {
            console.error('Erreur lors de la création du rapport:', error);

            // Afficher les détails de l'erreur pour le débogage
            const errorMessage = error.response?.data?.message || 'Une erreur est survenue lors de la création du rapport';
            const errorDetails = error.response?.data?.error || error.message;

            Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: errorMessage,
                footer: `<div class="text-danger">Détails: ${errorDetails}</div>`
            });
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Chargement...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="card custom-card border border-danger">
            <div className="card-header bg-danger-transparent">
                <div className="card-title">
                    <i className="ri-error-warning-line text-danger me-2"></i>
                    {initialData.memberName ?
                        `Signaler ${initialData.memberName}` :
                        'Signaler un membre'
                    }
                </div>
            </div>
            <div className="card-body">
                <div className="alert alert-danger mb-4" role="alert">
                    <div className="d-flex">
                        <i className="ri-information-line fs-3 me-2"></i>
                        <div>
                            <h6 className="fw-bold mb-1">Important</h6>
                            <p className="mb-0">
                                {initialData.memberName ?
                                    `Vous êtes en train de signaler ${initialData.memberName}. ` :
                                    ''
                                }
                                {initialData.teamInfo && initialData.teamInfo.manager_id ?
                                    `Cette réclamation sera soumise au nom de ${initialData.teamInfo.manager_id.firstName} ${initialData.teamInfo.manager_id.lastName} (Manager de l'équipe). ` :
                                    'Cette réclamation sera transmise au responsable de l\'équipe concernée. '
                                }
                                Veuillez fournir des informations précises et objectives.
                            </p>
                        </div>
                    </div>
                </div>
                <form onSubmit={handleSubmit}>
                    {/* Hide user field if hideUserField is true */}
                    {!initialData.hideUserField && (
                        <div className="mb-3">
                            <label htmlFor="reported_user_id" className="form-label">Membre à signaler</label>
                            <select
                                id="reported_user_id"
                                name="reported_user_id"
                                className="form-select"
                                value={formData.reported_user_id}
                                onChange={handleChange}
                                required
                                disabled={initialData.reported_user_id ? true : false}
                            >
                                <option value="">Sélectionner un membre</option>
                                {users.map(user => (
                                    <option key={user._id} value={user._id}>
                                        {user.firstName} {user.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Hide project field if hideProjectField is true, but show project info */}
                    {initialData.hideProjectField && initialData.projectInfo ? (
                        <div className="mb-3">
                            <label className="form-label">Projet concerné</label>
                            <div className="form-control bg-light">
                                {initialData.projectInfo.name}
                            </div>
                            <small className="form-text text-muted">
                                Le projet est automatiquement sélectionné en fonction de l'équipe du membre.
                            </small>
                        </div>
                    ) : !initialData.hideProjectField && (
                        <div className="mb-3">
                            <label htmlFor="project_id" className="form-label">Projet concerné</label>
                            <select
                                id="project_id"
                                name="project_id"
                                className="form-select"
                                value={formData.project_id}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Sélectionner un projet</option>
                                {projects.map(project => (
                                    <option key={project._id} value={project._id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="mb-3">
                        <label htmlFor="reason" className="form-label">Raison</label>
                        <select
                            id="reason"
                            name="reason"
                            className="form-select"
                            value={formData.reason}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Sélectionner une raison</option>
                            <option value="Inappropriate Behavior">Comportement inapproprié</option>
                            <option value="Performance Issues">Problèmes de performance</option>
                            <option value="Attendance Problems">Problèmes de présence</option>
                            <option value="Communication Issues">Problèmes de communication</option>
                            <option value="Other">Autre</option>
                        </select>
                    </div>

                    <div className="mb-3">
                        <label htmlFor="details" className="form-label">Détails</label>
                        <textarea
                            id="details"
                            name="details"
                            className="form-control"
                            rows="4"
                            value={formData.details}
                            onChange={handleChange}
                            required
                        ></textarea>
                    </div>

                    <div className="mb-3">
                        <label htmlFor="report_date" className="form-label">Date</label>
                        <input
                            type="date"
                            id="report_date"
                            name="report_date"
                            className="form-control"
                            value={formData.report_date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="d-flex justify-content-end gap-2">
                        <button type="button" className="btn btn-light" onClick={onClose}>Annuler</button>
                        <button type="submit" className="btn btn-danger">
                            <i className="ri-alarm-warning-line me-1"></i>
                            Soumettre la réclamation
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportForm;
