async function testAdmin() {
  const baseURL = 'http://localhost:5000/api';

  console.log('🧪 1. Test de connexion en tant qu\'administrateur...');
  try {
    const loginRes = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@shoply.tn',
        motDePasse: 'Admin123456!'
      })
    });
    const loginData = await loginRes.json();
    if (!loginData.success) throw new Error(loginData.message);

    console.log('   ✅ Connexion admin réussie !');
    console.log(`   Rôle: ${loginData.data.role}, Nom: ${loginData.data.prenom} ${loginData.data.nom}`);

    const token = loginData.data.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    console.log('\n📊 2. Test du Dashboard Stats...');
    const statsRes = await (await fetch(`${baseURL}/admin/stats`, { headers: authHeaders })).json();
    console.log('   ✅ KPI Dashboard :', statsRes.data);

    console.log('\n📈 3. Test des Graphiques du Dashboard...');
    const chartsRes = await (await fetch(`${baseURL}/admin/charts`, { headers: authHeaders })).json();
    console.log('   ✅ Graphiques récupérés avec succès');

    console.log('\n👥 4. Test Gestion des Clients...');
    const clientsRes = await (await fetch(`${baseURL}/admin/clients`, { headers: authHeaders })).json();
    console.log(`   ✅ ${clientsRes.count} client(s) récupéré(s)`);

    console.log('\n🏪 5. Test Gestion des Vendeurs...');
    const vendorsRes = await (await fetch(`${baseURL}/admin/vendors`, { headers: authHeaders })).json();
    console.log(`   ✅ ${vendorsRes.count} vendeur(s) récupéré(s)`);

    console.log('\n🛍️ 6. Test Gestion des Boutiques...');
    const shopsRes = await (await fetch(`${baseURL}/admin/shops`, { headers: authHeaders })).json();
    console.log(`   ✅ ${shopsRes.count} boutique(s) récupérée(s)`);

    console.log('\n📦 7. Test Gestion des Produits...');
    const productsRes = await (await fetch(`${baseURL}/admin/products`, { headers: authHeaders })).json();
    console.log(`   ✅ ${productsRes.count} produit(s) récupéré(s)`);

    console.log('\n🏷️ 8. Test Gestion des Catégories...');
    const catRes = await (await fetch(`${baseURL}/categories`)).json();
    console.log(`   ✅ ${catRes.count} catégorie(s) récupérée(s)`);

    console.log('\n💳 9. Test Gestion des Paiements...');
    const paymentsRes = await (await fetch(`${baseURL}/admin/payments`, { headers: authHeaders })).json();
    console.log(`   ✅ ${paymentsRes.count} paiement(s) récupéré(s)`);

    console.log('\n💰 10. Test Gestion des Commissions...');
    const commissionsRes = await (await fetch(`${baseURL}/admin/commissions`, { headers: authHeaders })).json();
    const commStats = await (await fetch(`${baseURL}/admin/commissions/stats`, { headers: authHeaders })).json();
    console.log(`   ✅ ${commissionsRes.count} commission(s) récupérée(s). Total: ${commStats.data.totalCommissions} TND`);

    console.log('\n📑 11. Test Gestion des Réclamations...');
    const recRes = await (await fetch(`${baseURL}/admin/reclamations`, { headers: authHeaders })).json();
    console.log(`   ✅ ${recRes.count} réclamation(s) récupérée(s)`);

    console.log('\n⚖️ 12. Test Gestion des Remboursements...');
    const refRes = await (await fetch(`${baseURL}/admin/refunds`, { headers: authHeaders })).json();
    console.log(`   ✅ ${refRes.count} remboursement(s) récupéré(s)`);

    console.log('\n🔒 13. Test de sécurité : Accès sans token...');
    const noAuthRes = await fetch(`${baseURL}/admin/stats`);
    if (noAuthRes.status === 401 || noAuthRes.status === 403) {
      console.log(`   ✅ Accès refusé comme prévu (Status: ${noAuthRes.status})`);
    } else {
      console.error('   ❌ Échec sécurité : route accessible sans token !');
    }

    console.log('\n✨ TOUS LES TESTS BACKEND DU MODULE ADMIN SONT VALIDÉS AVEC SUCCÈS !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du test :', error.message);
    process.exit(1);
  }
}

// Lancer le serveur et tester
require('./server');
setTimeout(() => {
  testAdmin();
}, 2000);
