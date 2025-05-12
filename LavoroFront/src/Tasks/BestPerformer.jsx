import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BestPerformer = () => {
  const [bestPerformer, setBestPerformer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [performanceStats, setPerformanceStats] = useState({
    tasksCompleted: 0,
    tasksEarly: 0,
    tasksOnTime: 0,
    tasksLate: 0,
    completionRate: 0
  });

  useEffect(() => {
    const fetchBestPerformer = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        // Appel API pour récupérer l'utilisateur avec le plus de points
        const response = await axios.get('http://localhost:3000/users/best-performer', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Stocker les données du meilleur performeur
        setBestPerformer(response.data);

        // Utiliser les statistiques réelles si elles sont disponibles, sinon utiliser des valeurs par défaut
        if (response.data.stats) {
          // Utiliser les statistiques réelles de l'API
          setPerformanceStats(response.data.stats);
        } else {
          // Fallback: simuler des statistiques si l'API ne les fournit pas encore
          const tasksCompleted = Math.floor(response.data.performancePoints / 2) + 5;
          const tasksEarly = Math.floor(tasksCompleted * 0.6);
          const tasksOnTime = Math.floor(tasksCompleted * 0.3);
          const tasksLate = tasksCompleted - tasksEarly - tasksOnTime;

          setPerformanceStats({
            tasksCompleted,
            tasksEarly,
            tasksOnTime,
            tasksLate,
            completionRate: ((tasksEarly + tasksOnTime) / tasksCompleted) * 100
          });
        }

        setLoading(false);
      } catch (err) {
        console.error('Erreur lors de la récupération du meilleur performeur:', err);
        setError('Impossible de charger les données du meilleur performeur');
        setLoading(false);
      }
    };

    fetchBestPerformer();
  }, []);

  if (loading) {
    return (
      <div className="card custom-card">
        <div className="card-body text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card custom-card">
        <div className="card-body text-center">
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!bestPerformer) {
    return (
      <div className="card custom-card">
        <div className="card-body text-center">
          <p>Aucun membre avec des points de performance trouvé.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card custom-card">
      <div className="card-header">
        <div className="card-title">Best Performance</div>
        <span className="ms-auto shadow-lg fs-17"><i className="ri-trophy-fill text-warning"></i></span>
      </div>
      <div className="card-body">
        <div className="row">
          {/* Informations de base */}
          <div className="col-md-4 text-center">
            <span className="avatar avatar-xxl avatar-rounded mb-3">
              <img
                src={`http://localhost:3000${bestPerformer.image}`}
                alt={`${bestPerformer.firstName} ${bestPerformer.lastName}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </span>
            <div className="fw-bold fs-18">{bestPerformer.firstName} {bestPerformer.lastName}</div>
            <p className="mb-2 text-muted fs-12">Best Performance</p>
            <div className="badge bg-primary-transparent text-primary fs-16 mb-3">
              {bestPerformer.performancePoints} Points
            </div>
            <div className="btn-list justify-content-center">
              <button className="btn btn-icon btn-facebook btn-wave">
                <i className="ri-trophy-line"></i>
              </button>
              <button className="btn btn-icon btn-twitter btn-wave">
                <i className="ri-award-line"></i>
              </button>
              <button className="btn btn-icon btn-instagram btn-wave">
                <i className="ri-medal-line"></i>
              </button>
            </div>
          </div>

          {/* Statistiques de performance */}
          <div className="col-md-8">
            <h6 className="fw-semibold mb-3">Statistiques de performance</h6>

            {/* Tâches complétées */}
            <div className="d-flex align-items-center mb-3">
              <div className="me-3">
                <span className="avatar avatar-sm bg-success text-white">
                  <i className="ri-task-line"></i>
                </span>
              </div>
              <div className="flex-grow-1">
                <div className="d-flex align-items-center justify-content-between">
                  <p className="mb-0">Tâches complétées</p>
                  <p className="mb-0 fw-semibold">{performanceStats.tasksCompleted}</p>
                </div>
                <div className="progress progress-xs mt-1">
                  <div className="progress-bar bg-success" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>

            {/* Tâches en avance */}
            <div className="d-flex align-items-center mb-3">
              <div className="me-3">
                <span className="avatar avatar-sm bg-warning text-white">
                  <i className="ri-time-line"></i>
                </span>
              </div>
              <div className="flex-grow-1">
                <div className="d-flex align-items-center justify-content-between">
                  <p className="mb-0">Tâches terminées en avance</p>
                  <p className="mb-0 fw-semibold">{performanceStats.tasksEarly}</p>
                </div>
                <div className="progress progress-xs mt-1">
                  <div
                    className="progress-bar bg-warning"
                    style={{ width: `${(performanceStats.tasksEarly / performanceStats.tasksCompleted) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Tâches à temps */}
            <div className="d-flex align-items-center mb-3">
              <div className="me-3">
                <span className="avatar avatar-sm bg-primary text-white">
                  <i className="ri-check-line"></i>
                </span>
              </div>
              <div className="flex-grow-1">
                <div className="d-flex align-items-center justify-content-between">
                  <p className="mb-0">Tâches terminées à temps</p>
                  <p className="mb-0 fw-semibold">{performanceStats.tasksOnTime}</p>
                </div>
                <div className="progress progress-xs mt-1">
                  <div
                    className="progress-bar bg-primary"
                    style={{ width: `${(performanceStats.tasksOnTime / performanceStats.tasksCompleted) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Tâches en retard */}
            <div className="d-flex align-items-center mb-3">
              <div className="me-3">
                <span className="avatar avatar-sm bg-danger text-white">
                  <i className="ri-close-line"></i>
                </span>
              </div>
              <div className="flex-grow-1">
                <div className="d-flex align-items-center justify-content-between">
                  <p className="mb-0">Tâches en retard</p>
                  <p className="mb-0 fw-semibold">{performanceStats.tasksLate}</p>
                </div>
                <div className="progress progress-xs mt-1">
                  <div
                    className="progress-bar bg-danger"
                    style={{ width: `${(performanceStats.tasksLate / performanceStats.tasksCompleted) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Taux de réussite */}
            <div className="alert alert-success-transparent mt-3">
              <div className="d-flex">
                <div className="me-3">
                  <i className="ri-bar-chart-line fs-24"></i>
                </div>
                <div>
                  <h6 className="fw-semibold">Taux de réussite</h6>
                  <p className="mb-0">{performanceStats.completionRate.toFixed(1)}% des tâches terminées à temps ou en avance</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BestPerformer;
