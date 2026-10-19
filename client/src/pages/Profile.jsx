import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ImageUpload from '../components/ImageUpload';
import '../styles/shop.css';

export default function Profile() {
  const { user, updateUser } = useAuth();

  const [info, setInfo] = useState({
    nom: '', prenom: '', telephone: '', avatar: ''
  });
  const [adresses, setAdresses] = useState([]);
  const [pwd, setPwd] = useState({ motDePasseActuel: '', nouveauMotDePasse: '', confirmation: '' });
  const [infoMsg, setInfoMsg] = useState({ type: '', text: '' });
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });
  const [addrMsg, setAddrMsg] = useState({ type: '', text: '' });

  // État du formulaire d'adresse (Ajout ou Modification)
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [editingAddrId, setEditingAddrId] = useState(null);
  const [addrForm, setAddrForm] = useState({
    nomComplet: '', telephone: '', rue: '', ville: '',
    codePostal: '', pays: 'Tunisie', instructions: '', estDefaut: false
  });

  // Charge le profil à jour depuis le serveur
  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => {
        const u = data.data;
        setInfo({
          nom: u.nom || '',
          prenom: u.prenom || '',
          telephone: u.telephone || '',
          avatar: u.avatar || ''
        });
        setAdresses(u.adresses || []);
      })
      .catch(() => {});
  }, []);

  // Modifier infos personnelles (avec photo)
  const saveInfo = async (e) => {
    e.preventDefault();
    setInfoMsg({ type: '', text: '' });
    try {
      const { data } = await api.put('/auth/me', info);
      updateUser(data.data);
      setInfoMsg({ type: 'ok', text: 'Informations mises à jour ✅' });
    } catch (err) {
      setInfoMsg({ type: 'error', text: err.response?.data?.message || 'Erreur lors de la mise à jour' });
    }
  };

  // Modifier paramètres de connexion (mot de passe)
  const savePassword = async (e) => {
    e.preventDefault();
    setPwdMsg({ type: '', text: '' });
    if (pwd.nouveauMotDePasse !== pwd.confirmation) {
      setPwdMsg({ type: 'error', text: 'La confirmation ne correspond pas au nouveau mot de passe' });
      return;
    }
    try {
      await api.put('/auth/password', {
        motDePasseActuel: pwd.motDePasseActuel,
        nouveauMotDePasse: pwd.nouveauMotDePasse
      });
      setPwd({ motDePasseActuel: '', nouveauMotDePasse: '', confirmation: '' });
      setPwdMsg({ type: 'ok', text: 'Mot de passe modifié ✅' });
    } catch (err) {
      setPwdMsg({ type: 'error', text: err.response?.data?.message || 'Erreur lors du changement' });
    }
  };

  // Gestion des adresses (Amazon style)
  const handleOpenAddAddr = () => {
    setEditingAddrId(null);
    setAddrForm({
      nomComplet: `${info.prenom} ${info.nom}`.trim(),
      telephone: info.telephone || '',
      rue: '',
      ville: '',
      codePostal: '',
      pays: 'Tunisie',
      instructions: '',
      estDefaut: adresses.length === 0
    });
    setShowAddrForm(true);
    setAddrMsg({ type: '', text: '' });
  };

  const handleEditAddr = (addr) => {
    setEditingAddrId(addr._id);
    setAddrForm({
      nomComplet: addr.nomComplet || '',
      telephone: addr.telephone || '',
      rue: addr.rue || '',
      ville: addr.ville || '',
      codePostal: addr.codePostal || '',
      pays: addr.pays || 'Tunisie',
      instructions: addr.instructions || '',
      estDefaut: Boolean(addr.estDefaut)
    });
    setShowAddrForm(true);
    setAddrMsg({ type: '', text: '' });
  };

  const handleSaveAddr = async (e) => {
    e.preventDefault();
    setAddrMsg({ type: '', text: '' });
    try {
      if (editingAddrId) {
        const { data } = await api.put(`/auth/addresses/${editingAddrId}`, addrForm);
        setAdresses(data.data.adresses || []);
        updateUser(data.data);
        setAddrMsg({ type: 'ok', text: 'Adresse modifiée avec succès ✅' });
      } else {
        const { data } = await api.post('/auth/addresses', addrForm);
        setAdresses(data.data.adresses || []);
        updateUser(data.data);
        setAddrMsg({ type: 'ok', text: 'Nouvelle adresse ajoutée ✅' });
      }
      setShowAddrForm(false);
      setEditingAddrId(null);
    } catch (err) {
      setAddrMsg({ type: 'error', text: err.response?.data?.message || 'Erreur lors de l\'enregistrement de l\'adresse' });
    }
  };

  const handleDeleteAddr = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette adresse ?')) return;
    try {
      const { data } = await api.delete(`/auth/addresses/${id}`);
      setAdresses(data.data.adresses || []);
      updateUser(data.data);
      setAddrMsg({ type: 'ok', text: 'Adresse supprimée ✅' });
    } catch (err) {
      setAddrMsg({ type: 'error', text: err.response?.data?.message || 'Erreur' });
    }
  };

  const handleSetDefaultAddr = async (addr) => {
    try {
      const { data } = await api.put(`/auth/addresses/${addr._id}`, { ...addr, estDefaut: true });
      setAdresses(data.data.adresses || []);
      updateUser(data.data);
      setAddrMsg({ type: 'ok', text: 'Adresse définie par défaut ✅' });
    } catch (err) {
      setAddrMsg({ type: 'error', text: err.response?.data?.message || 'Erreur' });
    }
  };

  return (
    <div className="page">
      <h1 style={{ margin: '0 0 24px', fontSize: 26 }}>Mon compte & Profil</h1>

      <div className="profile-grid">
        {/* ===== INFOS PERSONNELLES & PHOTO DE PROFIL ===== */}
        <form className="box" onSubmit={saveInfo}>
          <h2 style={{ marginTop: 0, fontSize: 19 }}>Informations personnelles</h2>
          {infoMsg.text && <div className={`alert ${infoMsg.type}`}>{infoMsg.text}</div>}

          {/* Téléversement d'image d'avatar local (sans email ni URL externe) */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <ImageUpload
              value={info.avatar}
              onChange={(url) => setInfo({ ...info, avatar: url })}
              circle
              size={110}
              label="Photo de profil (cliquer pour changer)"
            />
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              Choisissez une image depuis votre ordinateur ou téléphone
            </span>
          </div>

          <div className="field">
            <label>Email (identifiant)</label>
            <input value={user?.email || ''} disabled />
          </div>

          <div className="row2">
            <div className="field">
              <label>Prénom</label>
              <input value={info.prenom} onChange={(e) => setInfo({ ...info, prenom: e.target.value })} required />
            </div>
            <div className="field">
              <label>Nom</label>
              <input value={info.nom} onChange={(e) => setInfo({ ...info, nom: e.target.value })} required />
            </div>
          </div>

          <div className="field">
            <label>Téléphone</label>
            <input value={info.telephone} onChange={(e) => setInfo({ ...info, telephone: e.target.value })} placeholder="+216 20 123 456" />
          </div>

          <button type="submit" className="btn-orange">Enregistrer les modifications</button>
        </form>

        {/* ===== SÉCURITÉ ET MOT DE PASSE ===== */}
        <form className="box" onSubmit={savePassword} style={{ alignSelf: 'start' }}>
          <h2 style={{ marginTop: 0, fontSize: 19 }}>Sécurité & Mot de passe</h2>
          {pwdMsg.text && <div className={`alert ${pwdMsg.type}`}>{pwdMsg.text}</div>}

          <div className="field">
            <label>Mot de passe actuel</label>
            <input type="password" value={pwd.motDePasseActuel}
              onChange={(e) => setPwd({ ...pwd, motDePasseActuel: e.target.value })} required />
          </div>
          <div className="field">
            <label>Nouveau mot de passe (6 caractères minimum)</label>
            <input type="password" value={pwd.nouveauMotDePasse}
              onChange={(e) => setPwd({ ...pwd, nouveauMotDePasse: e.target.value })} required />
          </div>
          <div className="field">
            <label>Confirmer le nouveau mot de passe</label>
            <input type="password" value={pwd.confirmation}
              onChange={(e) => setPwd({ ...pwd, confirmation: e.target.value })} required />
          </div>

          <button type="submit" className="btn-orange">Changer le mot de passe</button>
        </form>
      </div>

      {/* ===== CARNET D'ADRESSES DE LIVRAISON (STYLE AMAZON) ===== */}
      <section className="box" style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>Mes adresses de livraison (Amazon-style)</h2>
            <p className="muted" style={{ margin: '4px 0 0' }}>
              Enregistrez et gérez les adresses où vous souhaitez recevoir vos commandes.
            </p>
          </div>
          {!showAddrForm && (
            <button type="button" className="btn-orange" style={{ width: 'auto', padding: '10px 18px', fontSize: 14 }} onClick={handleOpenAddAddr}>
              + Ajouter une adresse
            </button>
          )}
        </div>

        {addrMsg.text && <div className={`alert ${addrMsg.type}`}>{addrMsg.text}</div>}

        {/* Formulaire d'ajout / modification d'adresse */}
        {showAddrForm && (
          <form onSubmit={handleSaveAddr} style={{ background: '#f9fafb', padding: 20, borderRadius: 10, border: '1px solid #e5e7eb', marginBottom: 20 }}>
            <h3 style={{ marginTop: 0, fontSize: 17 }}>
              {editingAddrId ? 'Modifier l\'adresse' : 'Nouvelle adresse de livraison'}
            </h3>

            <div className="row2">
              <div className="field">
                <label>Nom complet du destinataire *</label>
                <input required value={addrForm.nomComplet} onChange={(e) => setAddrForm({ ...addrForm, nomComplet: e.target.value })} placeholder="Ex: Jean Dupont" />
              </div>
              <div className="field">
                <label>Numéro de téléphone de contact *</label>
                <input required value={addrForm.telephone} onChange={(e) => setAddrForm({ ...addrForm, telephone: e.target.value })} placeholder="Ex: +216 98 123 456" />
              </div>
            </div>

            <div className="field">
              <label>Rue, avenue, numéro de rue ou bâtiment *</label>
              <input required value={addrForm.rue} onChange={(e) => setAddrForm({ ...addrForm, rue: e.target.value })} placeholder="Ex: 12 Rue de la Liberté, Résidence Les Oliviers" />
            </div>

            <div className="row2">
              <div className="field">
                <label>Ville *</label>
                <input required value={addrForm.ville} onChange={(e) => setAddrForm({ ...addrForm, ville: e.target.value })} placeholder="Ex: Tunis" />
              </div>
              <div className="field">
                <label>Code postal</label>
                <input value={addrForm.codePostal} onChange={(e) => setAddrForm({ ...addrForm, codePostal: e.target.value })} placeholder="Ex: 1000" />
              </div>
            </div>

            <div className="field">
              <label>Instructions de livraison (étage, code porte, repères)</label>
              <input value={addrForm.instructions} onChange={(e) => setAddrForm({ ...addrForm, instructions: e.target.value })} placeholder="Ex: 2ème étage à gauche, sonner à l'interphone" />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 16, fontSize: 14 }}>
              <input
                type="checkbox"
                checked={addrForm.estDefaut}
                onChange={(e) => setAddrForm({ ...addrForm, estDefaut: e.target.checked })}
              />
              <span>Définir comme adresse de livraison par défaut</span>
            </label>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn-orange" style={{ width: 'auto', padding: '10px 24px' }}>
                Enregistrer l'adresse
              </button>
              <button type="button" className="btn-outline" style={{ width: 'auto', marginTop: 0 }} onClick={() => setShowAddrForm(false)}>
                Annuler
              </button>
            </div>
          </form>
        )}

        {/* Grille des cartes d'adresses enregistrées */}
        {adresses.length === 0 && !showAddrForm ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: '#6b7280', background: '#f9fafb', borderRadius: 8 }}>
            <span style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>📍</span>
            <p style={{ margin: '0 0 12px' }}>Aucune adresse enregistrée pour l'instant.</p>
            <button type="button" className="link-btn" onClick={handleOpenAddAddr} style={{ fontWeight: 600 }}>
              + Enregistrer ma première adresse
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {adresses.map((a) => (
              <div
                key={a._id}
                style={{
                  border: a.estDefaut ? '2px solid #F97316' : '1px solid #d1d5db',
                  borderRadius: 10,
                  padding: 18,
                  background: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  boxShadow: a.estDefaut ? '0 4px 14px rgba(249, 115, 22, 0.15)' : 'none'
                }}
              >
                {a.estDefaut && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      background: '#fff7ed',
                      color: '#c2410c',
                      border: '1px solid #fdba74',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 700
                    }}
                  >
                    ★ Adresse par défaut
                  </span>
                )}

                <strong style={{ fontSize: 16, marginBottom: 4, display: 'block', paddingRight: a.estDefaut ? 90 : 0 }}>
                  {a.nomComplet}
                </strong>

                <p style={{ margin: '0 0 4px', fontSize: 14, color: '#374151', lineHeight: 1.4 }}>
                  {a.rue}
                  <br />
                  {a.codePostal && `${a.codePostal} `}{a.ville}, {a.pays || 'Tunisie'}
                </p>

                <p style={{ margin: '4px 0 10px', fontSize: 13, color: '#6b7280' }}>
                  📞 {a.telephone}
                </p>

                {a.instructions && (
                  <p style={{ margin: '0 0 12px', fontSize: 12, color: '#0369a1', fontStyle: 'italic', background: '#f0f9ff', padding: '6px 8px', borderRadius: 4 }}>
                    ℹ️ {a.instructions}
                  </p>
                )}

                <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid #f3f4f6', display: 'flex', gap: 12, fontSize: 13, alignItems: 'center' }}>
                  <button type="button" className="link-btn" onClick={() => handleEditAddr(a)}>
                    Modifier
                  </button>
                  <span style={{ color: '#d1d5db' }}>|</span>
                  <button type="button" className="link-btn" style={{ color: '#dc2626' }} onClick={() => handleDeleteAddr(a._id)}>
                    Supprimer
                  </button>
                  {!a.estDefaut && (
                    <>
                      <span style={{ color: '#d1d5db' }}>|</span>
                      <button type="button" className="link-btn" onClick={() => handleSetDefaultAddr(a)}>
                        Définir par défaut
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}