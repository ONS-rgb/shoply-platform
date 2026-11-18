import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import {
  Users,
  Store,
  Building2,
  Package,
  Tags,
  CreditCard,
  TrendingUp,
  Percent,
  AlertCircle,
  RotateCcw,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, chartsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/charts')
      ]);
      setStats(statsRes.data?.data || null);
      setCharts(chartsRes.data?.data || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des données du tableau de bord');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (val) => Number(val || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TND';

  return (
    <AdminLayout
      title="Tableau de bord Administrateur"
      subtitle="Vue d'ensemble en temps réel des activités, performances commerciales et flux de la plateforme Shoply."
    >
      {error && (
        <div className="admin-alert error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
          <strong>Chargement des statistiques de la plateforme...</strong>
        </div>
      ) : (
        <>
          {/* ================= 10 CARTES STATISTIQUES GLOBALES ================= */}
          <div className="admin-kpi-grid">
            {/* Chiffre d'Affaires Global */}
            <div className="admin-kpi-card" style={{ gridColumn: 'span 2' }}>
              <div className="admin-kpi-info">
                <h3>Chiffre d'affaires global</h3>
                <div className="kpi-value" style={{ color: '#ea580c' }}>
                  {formatPrice(stats?.chiffreAffairesGlobal)}
                </div>
                <p className="kpi-sub">Total cumulé des ventes confirmées</p>
              </div>
              <div className="admin-kpi-icon-box orange">
                <TrendingUp size={24} />
              </div>
            </div>

            {/* Total des Commissions */}
            <div className="admin-kpi-card" style={{ gridColumn: 'span 2' }}>
              <div className="admin-kpi-info">
                <h3>Total des commissions</h3>
                <div className="kpi-value" style={{ color: '#10b981' }}>
                  {formatPrice(stats?.totalCommissions)}
                </div>
                <p className="kpi-sub">Revenus bruts perçus par la plateforme (10%)</p>
              </div>
              <div className="admin-kpi-icon-box green">
                <Percent size={24} />
              </div>
            </div>

            {/* Total Clients */}
            <div className="admin-kpi-card">
              <div className="admin-kpi-info">
                <h3>Total Clients</h3>
                <div className="kpi-value">{stats?.nbClients || 0}</div>
                <p className="kpi-sub">Comptes acheteurs actifs</p>
              </div>
              <div className="admin-kpi-icon-box blue">
                <Users size={22} />
              </div>
            </div>

            {/* Total Vendeurs */}
            <div className="admin-kpi-card">
              <div className="admin-kpi-info">
                <h3>Total Vendeurs</h3>
                <div className="kpi-value">{stats?.nbVendeurs || 0}</div>
                <p className="kpi-sub">Marchands partenaires</p>
              </div>
              <div className="admin-kpi-icon-box purple">
                <Store size={22} />
              </div>
            </div>

            {/* Total Boutiques */}
            <div className="admin-kpi-card">
              <div className="admin-kpi-info">
                <h3>Total Boutiques</h3>
                <div className="kpi-value">{stats?.nbBoutiques || 0}</div>
                <p className="kpi-sub">Boutiques créées</p>
              </div>
              <div className="admin-kpi-icon-box amber">
                <Building2 size={22} />
              </div>
            </div>

            {/* Total Produits */}
            <div className="admin-kpi-card">
              <div className="admin-kpi-info">
                <h3>Total Produits</h3>
                <div className="kpi-value">{stats?.nbProduits || 0}</div>
                <p className="kpi-sub">Articles au catalogue</p>
              </div>
              <div className="admin-kpi-icon-box dark">
                <Package size={22} />
              </div>
            </div>

            {/* Total Catégories */}
            <div className="admin-kpi-card">
              <div className="admin-kpi-info">
                <h3>Total Catégories</h3>
                <div className="kpi-value">{stats?.nbCategories || 0}</div>
                <p className="kpi-sub">Rayons d'articles</p>
              </div>
              <div className="admin-kpi-icon-box orange">
                <Tags size={22} />
              </div>
            </div>

            {/* Nombre de Paiements */}
            <div className="admin-kpi-card">
              <div className="admin-kpi-info">
                <h3>Paiements</h3>
                <div className="kpi-value">{stats?.nbPaiements || 0}</div>
                <p className="kpi-sub">Transactions enregistrées</p>
              </div>
              <div className="admin-kpi-icon-box blue">
                <CreditCard size={22} />
              </div>
            </div>

            {/* Réclamations */}
            <div className="admin-kpi-card">
              <div className="admin-kpi-info">
                <h3>Réclamations</h3>
                <div className="kpi-value">{stats?.nbReclamations || 0}</div>
                <p className="kpi-sub">Dossiers clients ouverts</p>
              </div>
              <div className="admin-kpi-icon-box red">
                <AlertCircle size={22} />
              </div>
            </div>

            {/* Remboursements */}
            <div className="admin-kpi-card">
              <div className="admin-kpi-info">
                <h3>Remboursements</h3>
                <div className="kpi-value">{stats?.nbRemboursements || 0}</div>
                <p className="kpi-sub">Demandes soumises</p>
              </div>
              <div className="admin-kpi-icon-box amber">
                <RotateCcw size={22} />
              </div>
            </div>
          </div>

          {/* ================= GRAPHIQUES INTERACTIFS ================= */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 24, marginBottom: 28 }}>
            
            {/* Graphique 1 : Évolution des Ventes & Chiffre d'Affaires par Période */}
            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">
                  <TrendingUp size={18} color="#ea580c" />
                  Évolution des ventes et Chiffre d'affaires
                </h2>
                <span className="admin-badge info">Données réelles</span>
              </div>
              <div className="admin-card-body">
                {charts?.evolutionVentes && charts.evolutionVentes.length > 0 ? (
                  <div>
                    {/* SVG Bar Chart */}
                    <div style={{ height: 240, display: 'flex', alignItems: 'flex-end', gap: 24, padding: '20px 10px', borderBottom: '1px solid #e2e8f0' }}>
                      {(() => {
                        const maxCa = Math.max(...charts.evolutionVentes.map(v => v.chiffreAffaires), 1);
                        return charts.evolutionVentes.map((item, idx) => {
                          const heightPct = Math.max(12, Math.round((item.chiffreAffaires / maxCa) * 180));
                          return (
                            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#ea580c', marginBottom: 6 }}>
                                {item.chiffreAffaires} TND
                              </div>
                              <div
                                style={{
                                  width: '100%',
                                  maxWidth: 48,
                                  height: heightPct,
                                  background: 'linear-gradient(180deg, #ea580c, #f97316)',
                                  borderRadius: '6px 6px 0 0',
                                  transition: 'height 0.4s ease',
                                  boxShadow: '0 4px 10px rgba(234, 88, 12, 0.25)'
                                }}
                                title={`${item.periode} : ${item.chiffreAffaires} TND (${item.nbCommandes} commandes)`}
                              />
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginTop: 8 }}>
                                {item.periode}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 12, color: '#64748b' }}>
                      <span>Évolution mensuelle constatée</span>
                      <span><strong>Total périodes : </strong>{formatPrice(charts.evolutionVentes.reduce((acc, c) => acc + c.chiffreAffaires, 0))}</span>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>Aucune vente enregistrée sur la période</p>
                )}
              </div>
            </div>

            {/* Graphique 2 : Évolution des Commissions */}
            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">
                  <Percent size={18} color="#10b981" />
                  Évolution des commissions générées
                </h2>
                <span className="admin-badge success">10% par vente</span>
              </div>
              <div className="admin-card-body">
                {charts?.evolutionCommissions && charts.evolutionCommissions.length > 0 ? (
                  <div>
                    <div style={{ height: 240, display: 'flex', alignItems: 'flex-end', gap: 24, padding: '20px 10px', borderBottom: '1px solid #e2e8f0' }}>
                      {(() => {
                        const maxComm = Math.max(...charts.evolutionCommissions.map(c => c.totalCommissions), 1);
                        return charts.evolutionCommissions.map((item, idx) => {
                          const heightPct = Math.max(12, Math.round((item.totalCommissions / maxComm) * 180));
                          return (
                            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', marginBottom: 6 }}>
                                {item.totalCommissions} TND
                              </div>
                              <div
                                style={{
                                  width: '100%',
                                  maxWidth: 48,
                                  height: heightPct,
                                  background: 'linear-gradient(180deg, #10b981, #34d399)',
                                  borderRadius: '6px 6px 0 0',
                                  transition: 'height 0.4s ease',
                                  boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)'
                                }}
                                title={`${item.periode} : ${item.totalCommissions} TND de commissions`}
                              />
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginTop: 8 }}>
                                {item.periode}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 12, color: '#64748b' }}>
                      <span>Revenus de plateforme générés</span>
                      <Link to="/admin/commissions" style={{ color: '#10b981', fontWeight: 600, textDecoration: 'none' }}>
                        Voir détails commissions →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>Aucune commission enregistrée</p>
                )}
              </div>
            </div>

            {/* Graphique 3 : Performances des Boutiques */}
            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">
                  <Building2 size={18} color="#8b5cf6" />
                  Performances des boutiques (Top Ventes)
                </h2>
                <Link to="/admin/shops" style={{ fontSize: 13, color: '#8b5cf6', fontWeight: 600, textDecoration: 'none' }}>
                  Gérer boutiques →
                </Link>
              </div>
              <div className="admin-card-body">
                {charts?.performancesBoutiques && charts.performancesBoutiques.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {charts.performancesBoutiques.map((shop, idx) => (
                      <div key={idx} style={{ padding: '12px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                            {idx + 1}. {shop.nom}
                          </span>
                          <span style={{ fontWeight: 800, color: '#ea580c', fontSize: 14 }}>
                            {formatPrice(shop.totalVentes)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}>
                          <span>{shop.totalArticlesVendus} article(s) écoulé(s)</span>
                          <span className="admin-badge purple" style={{ fontSize: 10 }}>Performance active</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: '30px 0' }}>Pas encore de volume de vente par boutique</p>
                )}
              </div>
            </div>

            {/* Graphique 4 : Répartition des Paiements */}
            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">
                  <CreditCard size={18} color="#0284c7" />
                  Répartition des paiements
                </h2>
                <Link to="/admin/payments" style={{ fontSize: 13, color: '#0284c7', fontWeight: 600, textDecoration: 'none' }}>
                  Voir paiements →
                </Link>
              </div>
              <div className="admin-card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {/* Par Statut */}
                  <div style={{ padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 10 }}>
                      Par Statut
                    </div>
                    {charts?.repartitionPaiements?.parStatut?.map((st, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px dashed #e2e8f0' }}>
                        <span style={{ fontSize: 13, textTransform: 'capitalize' }}>
                          {st._id === 'valide' ? '✅ Validé' : (st._id === 'en_attente' ? '⏳ En attente' : '❌ Refusé')}
                        </span>
                        <strong style={{ fontSize: 13 }}>{st.count} ({st.total} TND)</strong>
                      </div>
                    ))}
                  </div>

                  {/* Par Méthode */}
                  <div style={{ padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 10 }}>
                      Par Mode de paiement
                    </div>
                    {charts?.repartitionPaiements?.parMethode?.map((m, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px dashed #e2e8f0' }}>
                        <span style={{ fontSize: 13, textTransform: 'capitalize' }}>
                          {m._id === 'livraison' ? '🚚 À la livraison' : '💳 Carte bancaire'}
                        </span>
                        <strong style={{ fontSize: 13 }}>{m.count} ({m.total} TND)</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ================= ACTIONS RAPIDES D'ADMINISTRATION ================= */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">
                <Sparkles size={18} color="#ea580c" />
                Accès direct aux modules d'administration
              </h2>
            </div>
            <div className="admin-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <Link to="/admin/clients" className="admin-btn admin-btn-secondary" style={{ justifyContent: 'flex-start', padding: 16 }}>
                <Users size={18} color="#0284c7" />
                <span>Gérer les clients ({stats?.nbClients})</span>
              </Link>
              <Link to="/admin/vendors" className="admin-btn admin-btn-secondary" style={{ justifyContent: 'flex-start', padding: 16 }}>
                <Store size={18} color="#8b5cf6" />
                <span>Gérer les vendeurs ({stats?.nbVendeurs})</span>
              </Link>
              <Link to="/admin/shops" className="admin-btn admin-btn-secondary" style={{ justifyContent: 'flex-start', padding: 16 }}>
                <Building2 size={18} color="#ea580c" />
                <span>Demandes boutiques ({stats?.nbBoutiques})</span>
              </Link>
              <Link to="/admin/products" className="admin-btn admin-btn-secondary" style={{ justifyContent: 'flex-start', padding: 16 }}>
                <Package size={18} color="#0f172a" />
                <span>Gérer le catalogue ({stats?.nbProduits})</span>
              </Link>
              <Link to="/admin/payments" className="admin-btn admin-btn-secondary" style={{ justifyContent: 'flex-start', padding: 16 }}>
                <CreditCard size={18} color="#10b981" />
                <span>Valider paiements ({stats?.nbPaiements})</span>
              </Link>
              <Link to="/admin/reclamations" className="admin-btn admin-btn-secondary" style={{ justifyContent: 'flex-start', padding: 16 }}>
                <AlertCircle size={18} color="#ef4444" />
                <span>Dossiers réclamations ({stats?.nbReclamations})</span>
              </Link>
              <Link to="/admin/refunds" className="admin-btn admin-btn-secondary" style={{ justifyContent: 'flex-start', padding: 16 }}>
                <RotateCcw size={18} color="#f59e0b" />
                <span>Traiter remboursements ({stats?.nbRemboursements})</span>
              </Link>
              <Link to="/admin/statistics" className="admin-btn admin-btn-secondary" style={{ justifyContent: 'flex-start', padding: 16 }}>
                <TrendingUp size={18} color="#ea580c" />
                <span>Rapports financiers</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
