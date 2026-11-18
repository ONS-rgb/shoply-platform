import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Percent,
  CreditCard,
  RotateCcw,
  Store,
  DollarSign,
  ShieldCheck,
  ShoppingBag
} from 'lucide-react';

export default function AdminStatistics() {
  const [data, setData] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filter periods
  const [periode, setPeriode] = useState('year'); // 'today', 'week', 'month', 'year', 'custom'
  const [debut, setDebut] = useState('');
  const [fin, setFin] = useState('');

  useEffect(() => {
    fetchStats();
  }, [periode]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      sp.set('periode', periode);
      if (periode === 'custom' && debut) {
        sp.set('debut', debut);
        if (fin) sp.set('fin', fin);
      }

      const [statsRes, chartsRes] = await Promise.all([
        api.get(`/admin/financial-stats?${sp.toString()}`),
        api.get('/admin/charts')
      ]);

      setData(statsRes.data?.data || null);
      setCharts(chartsRes.data?.data || null);
    } catch (err) {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCustomFilter = (e) => {
    e.preventDefault();
    fetchStats();
  };

  const formatPrice = (val) => Number(val || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TND';

  return (
    <AdminLayout
      title="Statistiques Globales & Financières"
      subtitle="Analysez la rentabilité, le volume de transactions et les performances par période."
    >
      {/* ================= FILTRES DE PÉRIODE ================= */}
      <div className="admin-card">
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginRight: 6 }}>
              Période :
            </span>
            <button
              onClick={() => setPeriode('today')}
              className={`admin-btn admin-btn-sm ${periode === 'today' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => setPeriode('week')}
              className={`admin-btn admin-btn-sm ${periode === 'week' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            >
              Cette semaine
            </button>
            <button
              onClick={() => setPeriode('month')}
              className={`admin-btn admin-btn-sm ${periode === 'month' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            >
              Ce mois
            </button>
            <button
              onClick={() => setPeriode('year')}
              className={`admin-btn admin-btn-sm ${periode === 'year' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            >
              Cette année
            </button>
            <button
              onClick={() => setPeriode('custom')}
              className={`admin-btn admin-btn-sm ${periode === 'custom' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            >
              Période personnalisée
            </button>
          </div>

          {periode === 'custom' && (
            <form onSubmit={handleCustomFilter} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="date"
                value={debut}
                onChange={(e) => setDebut(e.target.value)}
                className="admin-input"
                style={{ width: 140, padding: '6px 10px' }}
                required
              />
              <span style={{ color: '#94a3b8' }}>à</span>
              <input
                type="date"
                value={fin}
                onChange={(e) => setFin(e.target.value)}
                className="admin-input"
                style={{ width: 140, padding: '6px 10px' }}
              />
              <button type="submit" className="admin-btn admin-btn-sm admin-btn-primary">
                Appliquer
              </button>
            </form>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          Calcul des statistiques financières...
        </div>
      ) : (
        <>
          {/* ================= KPI FINANCIERS ================= */}
          <div className="admin-kpi-grid">
            <div className="admin-kpi-card">
              <div className="admin-kpi-info">
                <h3>Chiffre d'affaires total</h3>
                <div className="kpi-value" style={{ color: '#ea580c' }}>
                  {formatPrice(data?.chiffreAffairesTotal)}
                </div>
                <p className="kpi-sub">Total sur la période</p>
              </div>
              <div className="admin-kpi-icon-box orange">
                <TrendingUp size={22} />
              </div>
            </div>

            <div className="admin-kpi-card">
              <div className="admin-kpi-info">
                <h3>Nombre de commandes</h3>
                <div className="kpi-value">{data?.nbCommandes || 0}</div>
                <p className="kpi-sub">Panier moyen : {data?.panierMoyen || 0} TND</p>
              </div>
              <div className="admin-kpi-icon-box blue">
                <ShoppingBag size={22} />
              </div>
            </div>

            <div className="admin-kpi-card">
              <div className="admin-kpi-info">
                <h3>Transactions confirmées</h3>
                <div className="kpi-value">{data?.nbTransactions || 0}</div>
                <p className="kpi-sub">Paiements validés</p>
              </div>
              <div className="admin-kpi-icon-box green">
                <CreditCard size={22} />
              </div>
            </div>

            <div className="admin-kpi-card">
              <div className="admin-kpi-info">
                <h3>Total Commissions</h3>
                <div className="kpi-value" style={{ color: '#10b981' }}>
                  {formatPrice(data?.totalCommissions)}
                </div>
                <p className="kpi-sub">Commissions générées (10%)</p>
              </div>
              <div className="admin-kpi-icon-box purple">
                <Percent size={22} />
              </div>
            </div>

            <div className="admin-kpi-card">
              <div className="admin-kpi-info">
                <h3>Total Remboursements</h3>
                <div className="kpi-value" style={{ color: '#ef4444' }}>
                  {formatPrice(data?.montantRembourse)}
                </div>
                <p className="kpi-sub">{data?.nbRemboursements || 0} demande(s) exécutée(s)</p>
              </div>
              <div className="admin-kpi-icon-box red">
                <RotateCcw size={22} />
              </div>
            </div>

            <div className="admin-kpi-card" style={{ gridColumn: 'span 2' }}>
              <div className="admin-kpi-info">
                <h3>Revenus Nets de la Plateforme</h3>
                <div className="kpi-value" style={{ color: '#047857', fontSize: 28 }}>
                  {formatPrice(data?.revenusNets)}
                </div>
                <p className="kpi-sub">
                  Calcul règles métier : (Commissions encaissées − Impact des remboursements)
                </p>
              </div>
              <div className="admin-kpi-icon-box green" style={{ width: 50, height: 50 }}>
                <ShieldCheck size={28} />
              </div>
            </div>
          </div>

          {/* ================= GRAPHIQUES MENSUELS & HISTORIQUES ================= */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 24, marginBottom: 28 }}>
            
            {/* Chiffre d'affaires par mois */}
            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">
                  <BarChart3 size={18} color="#ea580c" />
                  Chiffre d'affaires mensuel
                </h2>
              </div>
              <div className="admin-card-body">
                {charts?.evolutionVentes && charts.evolutionVentes.length > 0 ? (
                  <div style={{ height: 230, display: 'flex', alignItems: 'flex-end', gap: 20, padding: '10px 0' }}>
                    {(() => {
                      const maxVal = Math.max(...charts.evolutionVentes.map(x => x.chiffreAffaires), 1);
                      return charts.evolutionVentes.map((m, i) => {
                        const h = Math.max(16, Math.round((m.chiffreAffaires / maxVal) * 160));
                        return (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                              {m.chiffreAffaires} TND
                            </div>
                            <div
                              style={{
                                width: '100%',
                                maxWidth: 44,
                                height: h,
                                background: '#ea580c',
                                borderRadius: '6px 6px 0 0'
                              }}
                            />
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginTop: 8 }}>
                              {m.periode}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: '30px 0' }}>Données indisponibles</p>
                )}
              </div>
            </div>

            {/* Commissions par mois */}
            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">
                  <Percent size={18} color="#10b981" />
                  Évolution des commissions par mois
                </h2>
              </div>
              <div className="admin-card-body">
                {charts?.evolutionCommissions && charts.evolutionCommissions.length > 0 ? (
                  <div style={{ height: 230, display: 'flex', alignItems: 'flex-end', gap: 20, padding: '10px 0' }}>
                    {(() => {
                      const maxVal = Math.max(...charts.evolutionCommissions.map(x => x.totalCommissions), 1);
                      return charts.evolutionCommissions.map((m, i) => {
                        const h = Math.max(16, Math.round((m.totalCommissions / maxVal) * 160));
                        return (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', marginBottom: 6 }}>
                              {m.totalCommissions} TND
                            </div>
                            <div
                              style={{
                                width: '100%',
                                maxWidth: 44,
                                height: h,
                                background: '#10b981',
                                borderRadius: '6px 6px 0 0'
                              }}
                            />
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginTop: 8 }}>
                              {m.periode}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: '30px 0' }}>Données indisponibles</p>
                )}
              </div>
            </div>

          </div>

          {/* ================= CLASSEMENT DES VENDEURS & BOUTIQUES ================= */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">
                <Store size={18} color="#8b5cf6" />
                Performances des vendeurs & boutiques sur la période
              </h2>
            </div>
            <div className="admin-table-container">
              {data?.performancesVendeurs && data.performancesVendeurs.length > 0 ? (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Rang</th>
                      <th>Marchand</th>
                      <th>Boutique</th>
                      <th>Articles Vendus</th>
                      <th>Chiffre d'Affaires Brut</th>
                      <th>Commission Reversée (10%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.performancesVendeurs.map((v, i) => (
                      <tr key={i}>
                        <td>
                          <span className={`admin-badge ${i === 0 ? 'orange' : (i === 1 ? 'purple' : 'gray')}`}>
                            #{i + 1}
                          </span>
                        </td>
                        <td><strong>{v.nomVendeur}</strong></td>
                        <td>{v.nomBoutique}</td>
                        <td>{v.nbVentes} article(s)</td>
                        <td><strong>{Number(v.chiffreAffaires).toFixed(2)} TND</strong></td>
                        <td>
                          <strong style={{ color: '#10b981' }}>
                            {(v.chiffreAffaires * 0.10).toFixed(2)} TND
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '30px 0' }}>Aucune transaction sur la période sélectionnée.</p>
              )}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
