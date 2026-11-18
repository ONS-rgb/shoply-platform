import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import {
  Percent,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Store,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Layers
} from 'lucide-react';

export default function AdminCommissions() {
  const [commissions, setCommissions] = useState([]);
  const [stats, setStats] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedVendor, setSelectedVendor] = useState('tous');
  const [selectedShop, setSelectedShop] = useState('tous');
  const [statutFilter, setStatutFilter] = useState('tous');
  const [viewMode, setViewMode] = useState('history'); // 'history' | 'by_vendor' | 'by_shop'

  useEffect(() => {
    fetchAuxiliaryData();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchCommissions();
  }, [selectedVendor, selectedShop, statutFilter]);

  const fetchAuxiliaryData = async () => {
    try {
      const [vRes, sRes] = await Promise.all([
        api.get('/admin/vendors'),
        api.get('/admin/shops')
      ]);
      setVendors(vRes.data?.data || []);
      setShops(sRes.data?.data || []);
    } catch (err) {
      // Ignore
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/commissions/stats');
      setStats(res.data?.data || null);
    } catch (err) {
      // Ignore
    }
  };

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (selectedVendor !== 'tous') sp.set('vendeurId', selectedVendor);
      if (selectedShop !== 'tous') sp.set('boutiqueId', selectedShop);
      if (statutFilter !== 'tous') sp.set('statut', statutFilter);

      const res = await api.get(`/admin/commissions?${sp.toString()}`);
      setCommissions(res.data?.data || []);
    } catch (err) {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (val) => Number(val || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TND';

  return (
    <AdminLayout
      title="Gestion des Commissions"
      subtitle="Supervisez les taux de commission appliqués, analysez les revenus par vendeur et par boutique."
    >
      {/* 4 Cartes Synthèse des Commissions */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="admin-kpi-info">
            <h3>Total Commissions Générées</h3>
            <div className="kpi-value" style={{ color: '#10b981' }}>
              {formatPrice(stats?.totalCommissions)}
            </div>
            <p className="kpi-sub">Total encaissé par la plateforme</p>
          </div>
          <div className="admin-kpi-icon-box green">
            <Percent size={22} />
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-info">
            <h3>Volume des Ventes Éligibles</h3>
            <div className="kpi-value" style={{ color: '#ea580c' }}>
              {formatPrice(stats?.totalVentes)}
            </div>
            <p className="kpi-sub">Chiffre d'affaires brut généré</p>
          </div>
          <div className="admin-kpi-icon-box orange">
            <TrendingUp size={22} />
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-info">
            <h3>Taux Moyen Appliqué</h3>
            <div className="kpi-value" style={{ color: '#0284c7' }}>
              {stats?.tauxMoyen || 10} %
            </div>
            <p className="kpi-sub">Pourcentage standard plateforme</p>
          </div>
          <div className="admin-kpi-icon-box blue">
            <Percent size={22} />
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-info">
            <h3>Revenus Vendeurs Déduits</h3>
            <div className="kpi-value" style={{ color: '#8b5cf6' }}>
              {formatPrice((stats?.totalVentes || 0) - (stats?.totalCommissions || 0))}
            </div>
            <p className="kpi-sub">Montant reversé aux marchands (90%)</p>
          </div>
          <div className="admin-kpi-icon-box purple">
            <Store size={22} />
          </div>
        </div>
      </div>

      {/* Onglets de vue */}
      <div className="admin-tabs">
        <button
          onClick={() => setViewMode('history')}
          className={`admin-tab-btn ${viewMode === 'history' ? 'active' : ''}`}
        >
          📜 Historique complet des commissions
        </button>
        <button
          onClick={() => setViewMode('by_vendor')}
          className={`admin-tab-btn ${viewMode === 'by_vendor' ? 'active' : ''}`}
        >
          👤 Commissions par vendeur
        </button>
        <button
          onClick={() => setViewMode('by_shop')}
          className={`admin-tab-btn ${viewMode === 'by_shop' ? 'active' : ''}`}
        >
          🏪 Commissions par boutique
        </button>
      </div>

      {/* VUE 1 : HISTORIQUE DÉTAILLÉ */}
      {viewMode === 'history' && (
        <div className="admin-card">
          <div className="admin-filter-bar">
            <div className="admin-filter-group" style={{ width: '100%' }}>
              {/* Filtre Vendeur */}
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                className="admin-select"
              >
                <option value="tous">Tous les vendeurs</option>
                {vendors.map((v) => (
                  <option key={v._id} value={v._id}>{v.prenom} {v.nom}</option>
                ))}
              </select>

              {/* Filtre Boutique */}
              <select
                value={selectedShop}
                onChange={(e) => setSelectedShop(e.target.value)}
                className="admin-select"
              >
                <option value="tous">Toutes les boutiques</option>
                {shops.map((s) => (
                  <option key={s._id} value={s._id}>{s.nom}</option>
                ))}
              </select>

              {/* Filtre Statut */}
              <select
                value={statutFilter}
                onChange={(e) => setStatutFilter(e.target.value)}
                className="admin-select"
              >
                <option value="tous">Tous les statuts</option>
                <option value="validee">Validée</option>
                <option value="payee">Payée</option>
                <option value="annulee">Annulée</option>
              </select>
            </div>
          </div>

          <div className="admin-table-container">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                Chargement des commissions...
              </div>
            ) : commissions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: '#94a3b8' }}>
                Aucune commission enregistrée
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Article / Transaction</th>
                    <th>Vendeur</th>
                    <th>Boutique</th>
                    <th>Montant Vente</th>
                    <th>Pourcentage Appliqué</th>
                    <th>Montant Commission</th>
                    <th>Net Vendeur</th>
                    <th>Statut</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c) => (
                    <tr key={c._id}>
                      <td>
                        <strong>{c.article?.nom || 'Vente article'}</strong>
                        {c.commande && (
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>
                            Réf commande: {c.commande.numeroCommande}
                          </div>
                        )}
                      </td>
                      <td>
                        {c.vendeur ? `${c.vendeur.prenom} ${c.vendeur.nom}` : '—'}
                      </td>
                      <td>
                        {c.boutique?.nom || 'Shoply Platform'}
                      </td>
                      <td>
                        <strong>{Number(c.montantVente).toFixed(2)} TND</strong>
                      </td>
                      <td>
                        <span className="admin-badge blue">
                          {c.pourcentage}%
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: '#10b981', fontSize: 15 }}>
                          +{Number(c.montantCommission).toFixed(2)} TND
                        </strong>
                      </td>
                      <td>
                        <span style={{ color: '#64748b' }}>
                          {Number(c.montantNetVendeur || 0).toFixed(2)} TND
                        </span>
                      </td>
                      <td>
                        <span className={`admin-badge ${c.statut === 'payee' || c.statut === 'validee' ? 'success' : 'danger'}`}>
                          {c.statut}
                        </span>
                      </td>
                      <td>
                        {new Date(c.dateCalcul || c.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* VUE 2 : COMMISSIONS PAR VENDEUR */}
      {viewMode === 'by_vendor' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">
              <Store size={18} color="#7c3aed" />
              Répartition des commissions par vendeur
            </h2>
          </div>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Vendeur</th>
                  <th>Email</th>
                  <th>Opérations</th>
                  <th>Chiffre d'affaires Ventes</th>
                  <th>Total Commissions Encaissées (10%)</th>
                </tr>
              </thead>
              <tbody>
                {stats?.commissionsParVendeur?.map((v, idx) => (
                  <tr key={idx}>
                    <td><strong>{v.nom}</strong></td>
                    <td>{v.email}</td>
                    <td><span className="admin-badge gray">{v.nbOperations} vente(s)</span></td>
                    <td><strong>{Number(v.totalVente).toFixed(2)} TND</strong></td>
                    <td>
                      <strong style={{ color: '#10b981', fontSize: 15 }}>
                        {Number(v.totalCommission).toFixed(2)} TND
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VUE 3 : COMMISSIONS PAR BOUTIQUE */}
      {viewMode === 'by_shop' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">
              <Building2 size={18} color="#ea580c" />
              Répartition des commissions par boutique
            </h2>
          </div>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Boutique</th>
                  <th>Opérations</th>
                  <th>Total Ventes Réalisées</th>
                  <th>Total Commissions Plateforme</th>
                </tr>
              </thead>
              <tbody>
                {stats?.commissionsParBoutique?.map((s, idx) => (
                  <tr key={idx}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>🏪</span>
                        <strong>{s.nom}</strong>
                      </div>
                    </td>
                    <td><span className="admin-badge gray">{s.nbOperations} article(s)</span></td>
                    <td><strong>{Number(s.totalVente).toFixed(2)} TND</strong></td>
                    <td>
                      <strong style={{ color: '#10b981', fontSize: 15 }}>
                        {Number(s.totalCommission).toFixed(2)} TND
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
