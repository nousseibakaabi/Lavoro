import React, { useState, useEffect } from 'react';
import BestPerformer from '../Tasks/BestPerformer';
import PerformancePodium from '../Tasks/PerformancePodium';

const BestPerformerPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Simuler des statistiques (dans une application réelle, vous feriez un appel API)
        setStats({
          totalTasks: 156,
          completedOnTime: 132,
          completedEarly: 87,
          completedLate: 24,
          averagePoints: 4.2
        });

        setLoading(false);
      } catch (err) {
        console.error('Erreur lors de la récupération des données:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12 mb-4">
          <h2 className="page-title">Tableau des Performances</h2>
          <p className="text-muted">Découvrez les employés avec les meilleures performances et célébrez les champions du mois</p>
        </div>
      </div>

      {/* Statistiques générales */}
      {!loading && stats && (
        <div className="row mb-4">
          <div className="col-xl-3 col-lg-6 col-md-6 mb-3">
            <div className="card custom-card bg-primary-transparent">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="me-3">
                    <span className="avatar avatar-md bg-primary text-white">
                      <i className="ri-task-line"></i>
                    </span>
                  </div>
                  <div>
                    <h6 className="fw-semibold mb-0">{stats.totalTasks}</h6>
                    <p className="text-muted mb-0 fs-12">Tâches totales</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-lg-6 col-md-6 mb-3">
            <div className="card custom-card bg-success-transparent">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="me-3">
                    <span className="avatar avatar-md bg-success text-white">
                      <i className="ri-check-line"></i>
                    </span>
                  </div>
                  <div>
                    <h6 className="fw-semibold mb-0">{stats.completedOnTime}</h6>
                    <p className="text-muted mb-0 fs-12">Tâches à temps</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-lg-6 col-md-6 mb-3">
            <div className="card custom-card bg-warning-transparent">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="me-3">
                    <span className="avatar avatar-md bg-warning text-white">
                      <i className="ri-time-line"></i>
                    </span>
                  </div>
                  <div>
                    <h6 className="fw-semibold mb-0">{stats.completedEarly}</h6>
                    <p className="text-muted mb-0 fs-12">Tâches en avance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-lg-6 col-md-6 mb-3">
            <div className="card custom-card bg-info-transparent">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="me-3">
                    <span className="avatar avatar-md bg-info text-white">
                      <i className="ri-bar-chart-line"></i>
                    </span>
                  </div>
                  <div>
                    <h6 className="fw-semibold mb-0">{stats.averagePoints}</h6>
                    <p className="text-muted mb-0 fs-12">Points moyens</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row">
        {/* Meilleur performeur */}
        <div className="col-lg-7 col-md-12 mb-4">
          <BestPerformer />
        </div>

        {/* Podium des performances */}
        <div className="col-lg-5 col-md-12 mb-4">
          <PerformancePodium />
        </div>
      </div>

      {/* Graphique de progression */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card custom-card">
            <div className="card-header">
              <div className="card-title">Comment fonctionne le système de points</div>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6 className="fw-semibold mb-3">Attribution des points</h6>
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <i className="ri-checkbox-circle-line text-success me-2"></i>
                        Tâche terminée dans le délai
                      </div>
                      <span className="badge bg-success rounded-pill">+1 point</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <i className="ri-time-line text-primary me-2"></i>
                        Terminée 1 heure avant la durée estimée
                      </div>
                      <span className="badge bg-primary rounded-pill">+2 points</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <i className="ri-speed-up-line text-warning me-2"></i>
                        Terminée 2 heures avant, etc.
                      </div>
                      <span className="badge bg-warning rounded-pill">+3 points</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <i className="ri-close-circle-line text-danger me-2"></i>
                        Tâche non terminée à temps
                      </div>
                      <span className="badge bg-danger rounded-pill">-1 point</span>
                    </li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6 className="fw-semibold mb-3">Avantages du système</h6>
                  <div className="alert alert-primary-transparent">
                    <div className="d-flex">
                      <div className="me-3">
                        <i className="ri-trophy-line fs-24"></i>
                      </div>
                      <div>
                        <h6 className="fw-semibold">Récompenses</h6>
                        <p className="mb-0">Les employés avec le plus de points peuvent recevoir des récompenses et une reconnaissance spéciale.</p>
                      </div>
                    </div>
                  </div>
                  <div className="alert alert-success-transparent mt-3">
                    <div className="d-flex">
                      <div className="me-3">
                        <i className="ri-team-line fs-24"></i>
                      </div>
                      <div>
                        <h6 className="fw-semibold">Motivation d'équipe</h6>
                        <p className="mb-0">Encourage une saine compétition et améliore la productivité globale de l'équipe.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BestPerformerPage;
