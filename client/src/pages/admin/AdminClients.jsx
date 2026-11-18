import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import {
  Users,
  Search,
  Plus,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  ShoppingBag
} from 'lucide-react';

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [alert, setAlert] = useState(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientDetails, setClientDetails] = useState(null);

  // Form state
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    telephone: '',
    rue: '',
    ville: '',
    codePostal: ''
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    fetchClients();
  }, [statutFilter]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (search) sp.set('search', search);
      if (statutFilter) sp.set('statut', statutFilter);

      const res = await api.get(`/admin/clients?${sp.toString()}`);
      setClients(res.data?.data || []);
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Erreur lors du chargement des clients' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchClients();
  };

  const handleViewDetails = async (client) => {
    setSelectedClient(client);
    setShowDetailsModal(true);
    try {
      const res = await api.get(`/admin/clients/${client._id}`);
      setClientDetails(res.data?.data || null);
    } catch (err) {
      setAlert({ type: 'error', message: 'Erreur lors de la récupération des détails' });
    }
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      await api.post('/admin/clients', {
        nom: form.nom,
        prenom: form.prenom,
        email: form.email,
        motDePasse: form.motDePasse,
        telephone: form.telephone,
        adresse: {
          rue: form.rue,
          ville: form.ville,
          codePostal: form.codePostal,
          pays: 'Tunisie'
        }
      });
      setAlert({ type: 'success', message: 'Client créé avec succès' });
      setShowAddModal(false);
      setForm({ nom: '', prenom: '', email: '', motDePasse: '', telephone: '', rue: '', ville: '', codePostal: '' });
      fetchClients();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Erreur lors de l\'ajout du client' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    setFormSubmitting(true);
    try {
      await api.delete(`/admin/clients/${selectedClient._id}`);
      setAlert({ type: 'success', message: `Client ${selectedClient.prenom} ${selectedClient.nom} supprimé avec succès` });
      setShowDeleteModal(false);
      setSelectedClient(null);
      fetchClients();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Erreur lors de la suppression' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const toggleClientStatus = async (client) => {
    try {
      await api.put(`/admin/clients/${client._id}`, { actif: !client.actif });
      setAlert({ type: 'success', message: `Statut du client mis à jour : ${!client.actif ? 'Actif' : 'Inactif'}` });
      fetchClients();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Erreur lors du changement de statut' });
    }
  };

  return (
    <AdminLayout
      title="Gestion des Clients"
      subtitle="Consultez, recherchez, filtrez et gérez les comptes des acheteurs de la plateforme."
    >
      {alert && (
        <div className={`admin-alert ${alert.type}`}>
          {alert.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          <span>{alert.message}</span>
        </div>
      )}

      {/* Barre d'action supérieure */}
      <div className="admin-card">
        <div className="admin-filter-bar">
          <form onSubmit={handleSearchSubmit} className="admin-search-wrapper">
            <Search />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom, email, téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search-input"
            />
          </form>

          <div className="admin-filter-group">
            <select
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value)}
              className="admin-select"
            >
              <option value="">Tous les statuts</option>
              <option value="actif">Actif uniquement</option>
              <option value="false">Inactif uniquement</option>
            </select>

            <button
              onClick={() => setShowAddModal(true)}
              className="admin-btn admin-btn-primary"
            >
              <Plus size={16} />
              <span>Nouveau client</span>
            </button>
          </div>
        </div>

        {/* Tableau des clients */}
        <div className="admin-table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Chargement des clients...
            </div>
          ) : clients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#94a3b8' }}>
              <Users size={40} style={{ margin: '0 auto 12px auto', display: 'block' }} />
              Aucun client ne correspond à votre recherche
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Inscription</th>
                  <th>Commandes</th>
                  <th>Total Dépensé</th>
                  <th>Statut</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: '#e0f2fe', color: '#0369a1',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 13
                        }}>
                          {c.prenom ? c.prenom[0].toUpperCase() : 'C'}
                        </div>
                        <div>
                          <strong>{c.prenom} {c.nom}</strong>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>Réf: #{c._id.slice(-6)}</div>
                        </div>
                      </div>
                    </td>
                    <td>{c.email}</td>
                    <td>{c.telephone || '—'}</td>
                    <td>{new Date(c.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <span className="admin-badge gray">
                        {c.nbCommandes || 0} commande(s)
                      </span>
                    </td>
                    <td>
                      <strong>{Number(c.totalDepense || 0).toFixed(2)} TND</strong>
                    </td>
                    <td>
                      <button
                        onClick={() => toggleClientStatus(c)}
                        title="Cliquer pour changer le statut"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        <span className={`admin-badge ${c.actif ? 'success' : 'danger'}`}>
                          <span className="admin-badge-dot" />
                          {c.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          onClick={() => handleViewDetails(c)}
                          className="admin-action-btn"
                          title="Consulter les détails"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedClient(c);
                            setShowDeleteModal(true);
                          }}
                          className="admin-action-btn delete"
                          title="Supprimer le client"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ================= MODAL AJOUT CLIENT ================= */}
      {showAddModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Ajouter un nouveau client</h2>
              <button onClick={() => setShowAddModal(false)} className="admin-modal-close">×</button>
            </div>
            <form onSubmit={handleAddClient}>
              <div className="admin-modal-body">
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Prénom *</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={form.prenom}
                      onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                      required
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Nom *</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={form.nom}
                      onChange={(e) => setForm({ ...form, nom: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    className="admin-input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>Mot de passe provisoire * (6 caractères min)</label>
                  <input
                    type="password"
                    className="admin-input"
                    value={form.motDePasse}
                    onChange={(e) => setForm({ ...form, motDePasse: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Téléphone</label>
                  <input
                    type="tel"
                    className="admin-input"
                    value={form.telephone}
                    onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                    placeholder="Ex: 21123456"
                  />
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Ville</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={form.ville}
                      onChange={(e) => setForm({ ...form, ville: e.target.value })}
                      placeholder="Tunis, Sousse, etc."
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Rue / Adresse</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={form.rue}
                      onChange={(e) => setForm({ ...form, rue: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="admin-btn admin-btn-secondary"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="admin-btn admin-btn-primary"
                >
                  {formSubmitting ? 'Création...' : 'Créer le compte client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DÉTAILS CLIENT ================= */}
      {showDetailsModal && selectedClient && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-modal-lg">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Fiche client : {selectedClient.prenom} {selectedClient.nom}</h2>
              <button onClick={() => setShowDetailsModal(false)} className="admin-modal-close">×</button>
            </div>
            <div className="admin-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>EMAIL</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedClient.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>TÉLÉPHONE</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedClient.telephone || 'Non renseigné'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>DATE D'INSCRIPTION</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{new Date(selectedClient.createdAt).toLocaleDateString('fr-FR')}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>STATUT</div>
                  <span className={`admin-badge ${selectedClient.actif ? 'success' : 'danger'}`}>
                    {selectedClient.actif ? 'Actif' : 'Désactivé'}
                  </span>
                </div>
              </div>

              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Historique des commandes ({clientDetails?.commandes?.length || 0})</h3>
              {clientDetails?.commandes && clientDetails.commandes.length > 0 ? (
                <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>N° Commande</th>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Paiement</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientDetails.commandes.map((cmd) => (
                        <tr key={cmd._id}>
                          <td><strong>{cmd.numeroCommande}</strong></td>
                          <td>{new Date(cmd.createdAt).toLocaleDateString('fr-FR')}</td>
                          <td>{cmd.total} TND</td>
                          <td><span className="admin-badge gray">{cmd.statutPaiement}</span></td>
                          <td><span className="admin-badge info">{cmd.statut}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: '#94a3b8', fontSize: 13 }}>Aucune commande pour le moment.</p>
              )}
            </div>
            <div className="admin-modal-footer">
              <button onClick={() => setShowDetailsModal(false)} className="admin-btn admin-btn-secondary">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL CONFIRMATION SUPPRESSION ================= */}
      {showDeleteModal && selectedClient && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: 440 }}>
            <div className="admin-modal-header" style={{ borderBottomColor: '#fecaca', background: '#fef2f2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#b91c1c' }}>
                <AlertTriangle size={20} />
                <h2 className="admin-modal-title" style={{ color: '#b91c1c' }}>Confirmer la suppression</h2>
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="admin-modal-close">×</button>
            </div>
            <div className="admin-modal-body">
              <p style={{ fontSize: 14, color: '#334155', margin: '0 0 12px 0' }}>
                Êtes-vous sûr de vouloir supprimer définitivement le compte du client :
              </p>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16 }}>
                <strong>{selectedClient.prenom} {selectedClient.nom}</strong> ({selectedClient.email})
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                ⚠️ Cette action est irréversible. Si le client possède des commandes en cours, la suppression sera bloquée par mesure de sécurité.
              </p>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="admin-btn admin-btn-secondary"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteClient}
                disabled={formSubmitting}
                className="admin-btn admin-btn-danger"
              >
                {formSubmitting ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
