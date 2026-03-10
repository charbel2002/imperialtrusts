# Admin Panel — French Translation Mapping

Every hardcoded English string found across the admin panel, organized by file.  
The sidebar nav (`shell.tsx`) and `<meta>` titles are already in French.  
Everything else below needs to be translated.

---

## Legend

| Column | Meaning |
|--------|---------|
| **Location** | File path (relative to `src/`) |
| **English (current)** | The exact string in the code |
| **French (target)** | Proposed French translation |

---

## 1. `app/admin/page.tsx` — Dashboard

| English | French |
|---------|--------|
| `"Admin Dashboard"` | `"Tableau de bord"` |
| `"Platform overview and key metrics"` | `"Vue d'ensemble et indicateurs clés"` |
| `"Pending review items"` | `"Éléments en attente de révision"` |
| `"transaction"` / `"transactions"` (pending link) | `"transaction"` / `"transactions"` |
| `"KYC submission"` / `"KYC submissions"` | `"soumission KYC"` / `"soumissions KYC"` |
| `"loan application"` / `"loan applications"` | `"demande de prêt"` / `"demandes de prêt"` |
| `"Total Users"` | `"Utilisateurs"` |
| `"Platform Balance"` | `"Solde plateforme"` |
| `"Transactions"` (stat card label) | `"Transactions"` |
| `"Loan Volume"` | `"Volume de prêts"` |
| `"Cards Issued"` | `"Cartes émises"` |
| `"KYC Verified"` | `"KYC vérifiés"` |
| `"Pending Txns"` | `"Txns en attente"` |
| `"Active Accounts"` | `"Comptes actifs"` |
| `"active"` (sub text) | `"actifs"` |
| `"locked accts"` | `"comptes verrouillés"` |
| `"volume"` (sub text) | `"volume"` |
| `"approved"` (sub text) | `"approuvés"` |
| `"pending"` (sub text) | `"en attente"` |
| `"awaiting review"` | `"en attente de révision"` |
| `"of X total"` | `"sur X au total"` |
| `"Recent Completed Transactions"` | `"Transactions récentes complétées"` |
| `"View all"` | `"Voir tout"` |
| `"No completed transactions"` | `"Aucune transaction complétée"` |
| `"Admin Activity"` | `"Activité admin"` |
| `"No activity yet"` | `"Aucune activité"` |

---

## 2. `app/admin/transactions/page.tsx` — Transaction Management

| English | French |
|---------|--------|
| `"Transaction Management"` | `"Gestion des transactions"` |
| `"pending"` (subtitle) | `"en attente"` |
| `"locked"` (subtitle) | `"verrouillées"` |
| `"Total"` | `"Total"` |
| `"Pending"` | `"En attente"` |
| `"Locked"` | `"Verrouillées"` |
| `"Completed"` | `"Complétées"` |
| `"Rejected"` | `"Rejetées"` |
| `"Reference"` (th) | `"Référence"` |
| `"User"` (th) | `"Utilisateur"` |
| `"Type"` (th) | `"Type"` |
| `"Amount"` (th) | `"Montant"` |
| `"To"` (th) | `"Destinataire"` |
| `"Status"` (th) | `"Statut"` |
| `"Date"` (th) | `"Date"` |
| `"Actions"` (th) | `"Actions"` |
| `"locks"` (inline count) | `"verrous"` |
| `"No transactions yet"` | `"Aucune transaction"` |

---

## 3. `app/admin/cards/page.tsx` — Card Management

| English | French |
|---------|--------|
| `"Card Management"` | `"Gestion des cartes"` |
| `"cards issued"` (subtitle) | `"cartes émises"` |
| `"Total"` | `"Total"` |
| `"Active"` | `"Actives"` |
| `"Frozen"` | `"Gelées"` |
| `"Cancelled"` | `"Annulées"` |
| `"Total Balance"` | `"Solde total"` |
| `"Card"` (th) | `"Carte"` |
| `"User"` (th) | `"Utilisateur"` |
| `"Balance"` (th) | `"Solde"` |
| `"Status"` (th) | `"Statut"` |
| `"Expires"` (th) | `"Expiration"` |
| `"Created"` (th) | `"Créée le"` |
| `"No cards issued yet"` | `"Aucune carte émise"` |

---

## 4. `app/admin/kyc/page.tsx` — KYC Review

| English | French |
|---------|--------|
| `"KYC Review"` | `"Vérification KYC"` |
| `"pending review"` / `"pending reviews"` | `"en attente de révision"` |
| `"Pending Review (N)"` (section heading) | `"En attente de révision (N)"` |
| `"No pending KYC submissions"` | `"Aucune soumission KYC en attente"` |
| `"Review History (N)"` | `"Historique des révisions (N)"` |
| `"Legal Name"` | `"Nom légal"` |
| `"Date of Birth"` | `"Date de naissance"` |
| `"National ID"` | `"Pièce d'identité"` |
| `"Address"` | `"Adresse"` |
| `"ID Document"` | `"Pièce d'identité"` |
| `"Selfie"` | `"Photo selfie"` |
| `"Open"` (link) | `"Ouvrir"` |
| `"Click "Open" to view"` | `"Cliquez sur « Ouvrir » pour voir"` |
| `"Rejection Reason"` | `"Motif de rejet"` |

---

## 5. `app/admin/loans/page.tsx` — Loan Applications

| English | French |
|---------|--------|
| `"Loan Applications"` | `"Demandes de prêt"` |
| `"pending review"` (subtitle) | `"en attente de révision"` |
| `"Total"` | `"Total"` |
| `"Pending"` | `"En attente"` |
| `"Approved"` | `"Approuvées"` |
| `"Rejected"` | `"Rejetées"` |
| `"Approved Volume"` | `"Volume approuvé"` |
| `"Pending Review (N)"` | `"En attente de révision (N)"` |
| `"No pending loan applications"` | `"Aucune demande de prêt en attente"` |
| `"Review History (N)"` | `"Historique des révisions (N)"` |
| `"Guest Applicant"` | `"Candidat non inscrit"` |
| `"Loan Amount"` | `"Montant du prêt"` |
| `"Duration"` | `"Durée"` |
| `"months"` | `"mois"` |
| `"Interest Rate"` | `"Taux d'intérêt"` |
| `"APR"` | `"TAE"` |
| `"Monthly Payment"` | `"Mensualité"` |
| `"Total Repayment"` | `"Remboursement total"` |
| `"Registered user"` | `"Utilisateur inscrit"` |
| `"Has bank account (eligible for disbursement)"` | `"Possède un compte bancaire (éligible au versement)"` |
| `"Guest application - no registered account. Cannot disburse funds automatically."` | `"Candidature externe — aucun compte enregistré. Versement automatique impossible."` |
| `"Admin Note"` | `"Note admin"` |

---

## 6. `app/admin/users/page.tsx` — User Management

| English | French |
|---------|--------|
| `"User Management"` | `"Gestion des utilisateurs"` |
| `"users total"` (subtitle) | `"utilisateurs au total"` |
| `"Total Users"` | `"Total utilisateurs"` |
| `"Active"` | `"Actifs"` |
| `"Locked"` | `"Verrouillés"` |
| `"Suspended"` | `"Suspendus"` |
| `"User"` (th) | `"Utilisateur"` |
| `"Account"` (th) | `"Compte"` |
| `"Balance"` (th) | `"Solde"` |
| `"Status"` (th) | `"Statut"` |
| `"KYC"` (th) | `"KYC"` |
| `"Activity"` (th) | `"Activité"` |
| `"txns"` | `"txns"` |
| `"cards"` | `"cartes"` |
| `"View"` (link) | `"Voir"` |
| `"No users found"` | `"Aucun utilisateur trouvé"` |
| `"None"` (KYC status) | `"Aucun"` |
| `"Not Submitted"` (KYC) | `"Non soumis"` |
| `"Disabled"` (badge) | `"Désactivé"` |

---

## 7. `app/admin/users/[id]/page.tsx` — User Detail

| English | French |
|---------|--------|
| `"Back to Users"` | `"Retour aux utilisateurs"` |
| `"Joined"` | `"Inscrit le"` |
| `"Bank Account"` | `"Compte bancaire"` |
| `"Account Number"` | `"Numéro de compte"` |
| `"Balance"` | `"Solde"` |
| `"Currency"` | `"Devise"` |
| `"Account Controls"` | `"Contrôles du compte"` |
| `"Credit / Debit Account"` | `"Créditer / Débiter le compte"` |
| `"Recent Transactions"` | `"Transactions récentes"` |
| `"No transactions"` | `"Aucune transaction"` |
| `"No bank account found for this user."` | `"Aucun compte bancaire trouvé pour cet utilisateur."` |
| `"KYC Status"` | `"Statut KYC"` |
| `"Not Submitted"` | `"Non soumis"` |
| `"Name:"` (KYC detail) | `"Nom :"` |
| `"Activity"` (sidebar heading) | `"Activité"` |
| `"Transactions"` | `"Transactions"` |
| `"Beneficiaries"` | `"Bénéficiaires"` |
| `"Notifications"` | `"Notifications"` |
| `"Cards (N)"` | `"Cartes (N)"` |
| `"No cards created"` | `"Aucune carte créée"` |

---

## 8. `app/admin/logs/page.tsx` — Audit Logs

| English | French |
|---------|--------|
| `"Audit Logs"` | `"Journal d'audit"` |
| `"Last 100 admin actions"` | `"100 dernières actions admin"` |
| `"No admin activity recorded yet."` | `"Aucune activité admin enregistrée."` |
| `"Target:"` | `"Cible :"` |

---

## 9. `app/admin/settings/page.tsx` — Settings

| English | French |
|---------|--------|
| `"System Settings"` | `"Paramètres système"` |
| `"Configure platform behavior and limits"` | `"Configurer le comportement et les limites de la plateforme"` |

---

## 10. `components/admin/admin-transaction-actions.tsx`

| English | French |
|---------|--------|
| `"Approve transfer of ... for ...?"` (confirm dialog) | `"Approuver le virement de ... pour ... ?"` |
| `"Reason required"` | `"Motif requis"` |
| `"Motif and code required"` | `"Motif et code requis"` |
| `"Reject {reference}"` (panel title) | `"Rejeter {reference}"` |
| `"Rejection reason..."` (placeholder) | `"Motif du rejet..."` |
| `"Reject Transaction"` (button) | `"Rejeter la transaction"` |
| `"Add Lock — {reference}"` (panel title) | `"Ajouter un verrou — {reference}"` |
| `"Motif / Reason..."` (placeholder) | `"Motif / Raison..."` |
| `"Security code (e.g. TX-8294)"` (placeholder) | `"Code de sécurité (ex. TX-8294)"` |
| `"Checkpoint at"` (label) | `"Point de contrôle à"` |
| `"Add Lock at N%"` (button) | `"Ajouter un verrou à N%"` |
| `"Approve"` (button) | `"Approuver"` |
| `"Reject"` (button) | `"Rejeter"` |
| `"Lock"` (button) | `"Verrou"` |
| `"No actions available"` | `"Aucune action disponible"` |
| `"lock"` / `"locks"` (toggle text) | `"verrou"` / `"verrous"` |
| `"resolved"` (count) | `"résolus"` |
| `"Copied"` | `"Copié"` |
| `"Copy security code"` (title attr) | `"Copier le code de sécurité"` |
| `"Resolved"` (badge) | `"Résolu"` |
| `"Pending"` (badge) | `"En attente"` |

---

## 11. `components/admin/admin-card-actions.tsx`

| English | French |
|---------|--------|
| `"Cancel ... card **** ... for ...? Any remaining balance will be returned to their account."` (confirm) | `"Annuler la carte ... **** ... de ... ? Le solde restant sera recrédité sur son compte."` |

> Note: buttons are icon-only (Snowflake / Sun / Trash2), no text labels to translate. Consider adding French labels.

---

## 12. `components/admin/kyc-review-actions.tsx`

| English | French |
|---------|--------|
| `"KYC for {name} has been {status}."` | `"Le KYC de {name} a été {status}."` |
| `"approved"` / `"rejected"` (status text) | `"approuvé"` / `"rejeté"` |
| `"Please provide a reason for rejection (min 5 characters)"` | `"Veuillez fournir un motif de rejet (min. 5 caractères)"` |
| `"Reject KYC for {name}"` | `"Rejeter le KYC de {name}"` |
| `"Rejection Reason"` (label) | `"Motif de rejet"` |
| `"Explain why the verification was rejected so the user can resubmit correctly..."` (placeholder) | `"Expliquez pourquoi la vérification a été rejetée afin que l'utilisateur puisse soumettre à nouveau..."` |
| `"Confirm Rejection"` (button) | `"Confirmer le rejet"` |
| `"Cancel"` (button) | `"Annuler"` |
| `"Approve"` (button) | `"Approuver"` |
| `"Reject"` (button) | `"Rejeter"` |

---

## 13. `components/admin/admin-loan-actions.tsx`

| English | French |
|---------|--------|
| `"Loan application has been {status}."` | `"La demande de prêt a été {status}."` |
| `"approved"` / `"rejected"` | `"approuvée"` / `"rejetée"` |
| `"Rejection reason required"` | `"Motif de rejet requis"` |
| `"Approve Loan"` (panel title) | `"Approuver le prêt"` |
| `"Amount"` | `"Montant"` |
| `"Applicant"` | `"Demandeur"` |
| `"Disburse funds to account"` | `"Verser les fonds sur le compte"` |
| `"Credit ... to the user's bank account and create a LOAN_DISBURSEMENT transaction."` | `"Créditer ... sur le compte bancaire et créer une transaction LOAN_DISBURSEMENT."` |
| `"No bank account found."` | `"Aucun compte bancaire trouvé."` |
| `"This applicant does not have a registered account. Funds cannot be disbursed automatically."` | `"Ce demandeur ne possède pas de compte enregistré. Le versement automatique est impossible."` |
| `"Approve"` / `"Approve & Disburse"` | `"Approuver"` / `"Approuver et verser"` |
| `"Cancel"` | `"Annuler"` |
| `"Reject Loan - {name}"` | `"Rejeter le prêt — {name}"` |
| `"Explain why the loan application is being rejected..."` (placeholder) | `"Expliquez pourquoi la demande de prêt est rejetée..."` |
| `"Reject Application"` | `"Rejeter la demande"` |

---

## 14. `components/admin/credit-debit-form.tsx`

| English | French |
|---------|--------|
| `"Credit"` (toggle) | `"Crédit"` |
| `"Debit"` (toggle) | `"Débit"` |
| `"Current Balance"` | `"Solde actuel"` |
| `"Please enter a valid positive amount"` | `"Veuillez saisir un montant positif valide"` |
| `"Description is required"` | `"La description est requise"` |
| `"Successfully credited/debited ... to/from {name}'s account."` | `"... crédité(e)/débité(e) avec succès sur/du compte de {name}."` |
| `"Amount ({currency})"` (label) | `"Montant ({currency})"` |
| `"Description / Reason"` (label) | `"Description / Motif"` |
| `"e.g., Deposit, Bonus, Refund, Loan disbursement..."` (placeholder) | `"ex. Dépôt, Bonus, Remboursement, Versement de prêt..."` |
| `"e.g., Correction, Fee deduction, Penalty..."` (placeholder) | `"ex. Correction, Déduction de frais, Pénalité..."` |
| `"Credit {amount}"` / `"Credit Account"` (button) | `"Créditer {amount}"` / `"Créditer le compte"` |
| `"Debit {amount}"` / `"Debit Account"` (button) | `"Débiter {amount}"` / `"Débiter le compte"` |

---

## 15. `components/admin/account-status-actions.tsx`

| English | French |
|---------|--------|
| `"Account for {name} has been activated/locked/suspended."` | `"Le compte de {name} a été activé/verrouillé/suspendu."` |
| `"Activate Account"` (button) | `"Activer le compte"` |
| `"Lock Account"` (button) | `"Verrouiller le compte"` |
| `"Suspend Account"` (button) | `"Suspendre le compte"` |
| `"Locked accounts cannot perform any transactions."` | `"Les comptes verrouillés ne peuvent effectuer aucune transaction."` |
| `"Suspended accounts are under review. All operations are disabled."` | `"Les comptes suspendus sont en cours de révision. Toutes les opérations sont désactivées."` |
| `"Account is fully operational."` | `"Le compte est pleinement opérationnel."` |

---

## 16. `components/admin/user-toggle-active.tsx`

| English | French |
|---------|--------|
| `"Are you sure you want to deactivate/activate {name}'s account?"` (confirm) | `"Êtes-vous sûr de vouloir désactiver/activer le compte de {name} ?"` |
| `"Deactivate User"` (button) | `"Désactiver l'utilisateur"` |
| `"Activate User"` (button) | `"Activer l'utilisateur"` |

---

## 17. `components/admin/user-search-filter.tsx`

| English | French |
|---------|--------|
| `"Search by name, email, or account number..."` (placeholder) | `"Rechercher par nom, e-mail ou numéro de compte..."` |
| `"All"` (filter) | `"Tous"` |
| `"Active"` (filter) | `"Actifs"` |
| `"Locked"` (filter) | `"Verrouillés"` |
| `"Suspended"` (filter) | `"Suspendus"` |

---

## 18. `components/admin/settings-manager.tsx`

| English | French |
|---------|--------|
| `"KYC Required"` | `"KYC requis"` |
| `"When enabled, users must complete identity verification before sending funds, creating cards, or managing beneficiaries."` | `"Lorsqu'activé, les utilisateurs doivent compléter la vérification d'identité avant d'envoyer des fonds, créer des cartes ou gérer les bénéficiaires."` |
| `"Default Currency"` | `"Devise par défaut"` |
| `"Currency code for new accounts (e.g., USD, EUR, GBP)."` | `"Code devise pour les nouveaux comptes (ex. USD, EUR, GBP)."` |
| `"Transfer Fee (%)"` | `"Frais de virement (%)"` |
| `"Percentage fee applied to outgoing transfers."` | `"Pourcentage de frais appliqué aux virements sortants."` |
| `"Min Transfer Amount"` | `"Montant min. de virement"` |
| `"Minimum allowed transfer amount."` | `"Montant minimum autorisé pour un virement."` |
| `"Max Transfer Amount"` | `"Montant max. de virement"` |
| `"Maximum allowed transfer amount per transaction."` | `"Montant maximum autorisé par transaction."` |
| `"Security & Verification"` (group label) | `"Sécurité et vérification"` |
| `"General Settings"` (group label) | `"Paramètres généraux"` |
| `"Transaction Limits"` (group label) | `"Limites de transaction"` |
| `"Custom Settings"` (group label) | `"Paramètres personnalisés"` |
| `"Add Setting"` (button) | `"Ajouter un paramètre"` |
| `"Reset to Defaults"` (button) | `"Réinitialiser par défaut"` |
| `"Add Custom Setting"` (form title) | `"Ajouter un paramètre personnalisé"` |
| `"Key"` (input label) | `"Clé"` |
| `"Value"` (input label) | `"Valeur"` |
| `"Type"` (select label) | `"Type"` |
| `"String"` / `"Boolean"` / `"Integer"` / `"Float"` | `"Texte"` / `"Booléen"` / `"Entier"` / `"Décimal"` |
| `"Create"` (button) | `"Créer"` |
| `"Key is required"` | `"La clé est requise"` |
| `"Reset all settings to factory defaults? This will overwrite your current configuration."` (confirm) | `"Réinitialiser tous les paramètres par défaut ? Cela écrasera votre configuration actuelle."` |
| `"updated successfully"` (success message) | `"mis à jour avec succès"` |
| `"enabled"` / `"disabled"` | `"activé"` / `"désactivé"` |
| `"custom"` (badge) | `"personnalisé"` |
| `"Last updated:"` | `"Dernière mise à jour :"` |

---

## 19. `components/admin/dashboard-charts.tsx`

| English | French |
|---------|--------|
| `"Transaction Volume (30 days)"` | `"Volume des transactions (30 jours)"` |
| `"No transaction data in the last 30 days"` | `"Aucune donnée de transaction sur les 30 derniers jours"` |
| `"KYC Status"` | `"Statut KYC"` |
| `"No KYC submissions yet"` | `"Aucune soumission KYC"` |
| `"Completed Transactions by Type"` | `"Transactions complétées par type"` |
| `"No completed transactions yet"` | `"Aucune transaction complétée"` |
| `"Volume"` (chart legend) | `"Volume"` |
| `"Count"` (chart legend) | `"Nombre"` |
| `"Approved"` / `"Pending"` / `"Rejected"` (pie chart labels, built in page.tsx) | `"Approuvés"` / `"En attente"` / `"Rejetés"` |

---

## Summary

| Area | English strings found |
|------|----------------------|
| Dashboard page (`page.tsx`) | ~25 |
| Transactions page + actions | ~30 |
| Cards page + actions | ~12 |
| KYC page + review actions | ~16 |
| Loans page + actions | ~25 |
| Users page + detail + toggle + search | ~30 |
| Logs page | ~4 |
| Settings page + manager | ~25 |
| Dashboard charts | ~8 |
| **Total** | **~175 strings** |

### Already in French ✅
- Sidebar navigation labels (`shell.tsx`)
- `<meta>` page titles (Cartes, Vérification KYC, Demandes de prêt, etc.)
- Platform identity settings labels/descriptions
- Some settings group labels ("Identité de la plateforme")
- Role labels ("Administrateur", "Déconnexion")
