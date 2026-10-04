-- Paiement par tranche personnalisé
ALTER TABLE formation ADD COLUMN IF NOT EXISTS paiement_tranches_nombre INT NULL AFTER types_paiement_autorises;
ALTER TABLE formation ADD COLUMN IF NOT EXISTS paiement_tranches_json LONGTEXT NULL AFTER paiement_tranches_nombre;
ALTER TABLE paiement ADD COLUMN IF NOT EXISTS echeancier_tranches LONGTEXT NULL AFTER montant_par_periode;
