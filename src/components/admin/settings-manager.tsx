"use client";

import { useState } from "react";
import {
  updateSetting,
  bulkUpdateSettings,
  createSetting,
  deleteSetting,
  resetSettingsToDefaults,
} from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input, Alert, Card, CardBody, CardHeader } from "@/components/ui/index";
import { cn, timeAgo } from "@/lib/utils";
import {
  Settings, Shield, Euro, Globe, Plus, Trash2,
  Save, RotateCcw, CheckCircle, XCircle, X, AlertTriangle,
  ToggleLeft, ToggleRight, Building2,
} from "lucide-react";

interface Setting {
  id: string;
  key: string;
  value: string;
  type: string;
  updatedAt: string;
}

interface Props {
  settings: Setting[];
}

// Setting metadata for labels + descriptions + grouping
const settingMeta: Record<string, { label: string; description: string; group: string }> = {
  kyc_required: { label: "KYC requis", description: "Lorsqu'activé, les utilisateurs doivent compléter la vérification d'identité avant d'envoyer des fonds, créer des cartes ou gérer les bénéficiaires.", group: "security" },
  platform_name: { label: "Nom de la plateforme", description: "Le nom affiché sur toute la plateforme et dans les e-mails.", group: "platform" },
  platform_tagline: { label: "Slogan", description: "Le slogan affiché à côté du nom de la plateforme.", group: "platform" },
  platform_logo_url: { label: "URL du logo", description: "Chemin ou URL vers le logo de la plateforme. Téléchargez d'abord via /api/upload.", group: "platform" },
  platform_email: { label: "E-mail de contact", description: "Adresse e-mail de support affichée publiquement.", group: "platform" },
  platform_phone: { label: "Téléphone", description: "Numéro de téléphone affiché sur la page de contact.", group: "platform" },
  platform_address: { label: "Adresse", description: "Adresse physique affichée dans le pied de page et la page de contact.", group: "platform" },
  platform_mail_from: { label: "E-mail d'envoi", description: "Adresse e-mail utilisée comme expéditeur pour les notifications.", group: "platform" },
  platform_mail_name: { label: "Nom de l'expéditeur", description: "Nom affiché dans les e-mails envoyés aux utilisateurs.", group: "platform" },
  default_currency: { label: "Devise par défaut", description: "Code devise pour les nouveaux comptes (ex. USD, EUR, GBP).", group: "general" },
  transfer_fee_percentage: { label: "Frais de virement (%)", description: "Pourcentage de frais appliqué aux virements sortants.", group: "transactions" },
  min_transfer_amount: { label: "Montant min. de virement", description: "Montant minimum autorisé pour un virement.", group: "transactions" },
  max_transfer_amount: { label: "Montant max. de virement", description: "Montant maximum autorisé par transaction.", group: "transactions" },
};

const groups = [
  { id: "platform", label: "Identité de la plateforme", icon: Building2, color: "text-primary" },
  { id: "security", label: "Sécurité et vérification", icon: Shield, color: "text-amber-600" },
  { id: "general", label: "Paramètres généraux", icon: Globe, color: "text-secondary" },
  { id: "transactions", label: "Limites de transaction", icon: Euro, color: "text-accent" },
  { id: "custom", label: "Paramètres personnalisés", icon: Settings, color: "text-slate-500" },
];

export function SettingsManager({ settings: initial }: Props) {
  const [settings, setSettings] = useState<Setting[]>(initial);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetting, setResetting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newType, setNewType] = useState("string");
  const [addLoading, setAddLoading] = useState(false);

  function getEditedValue(key: string): string {
    return editedValues[key] ?? settings.find((s) => s.key === key)?.value ?? "";
  }

  function setEditedValue(key: string, value: string) {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  }

  function hasChanges(key: string): boolean {
    const original = settings.find((s) => s.key === key)?.value ?? "";
    return editedValues[key] !== undefined && editedValues[key] !== original;
  }

  async function handleSave(key: string) {
    const value = getEditedValue(key);
    setSaving(key);
    setError("");
    setSuccess("");
    const result = await updateSetting(key, value);
    setSaving(null);
    if (result.error) {
      setError(result.error);
    } else {
      setSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value, updatedAt: new Date().toISOString() } : s)));
      setEditedValues((prev) => { const n = { ...prev }; delete n[key]; return n; });
      setSuccess(`"${key}" mis à jour avec succès`);
      setTimeout(() => setSuccess(""), 3000);
    }
  }

  async function handleToggle(key: string) {
    const current = getEditedValue(key);
    const newVal = current === "true" ? "false" : "true";
    setSaving(key);
    setError("");
    const result = await updateSetting(key, newVal);
    setSaving(null);
    if (result.error) setError(result.error);
    else {
      setSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value: newVal, updatedAt: new Date().toISOString() } : s)));
      setSuccess(`"${key}" ${newVal === "true" ? "activé" : "désactivé"}`);
      setTimeout(() => setSuccess(""), 3000);
    }
  }

  async function handleReset() {
    if (!confirm("Réinitialiser tous les paramètres par défaut ? Cela écrasera votre configuration actuelle.")) return;
    setResetting(true);
    setError("");
    const result = await resetSettingsToDefaults();
    setResetting(false);
    if (result.error) setError(result.error);
    else window.location.reload();
  }

  async function handleAddSetting() {
    if (!newKey.trim()) { setError("La clé est requise"); return; }
    setAddLoading(true);
    setError("");
    const result = await createSetting(newKey.trim(), newValue, newType);
    setAddLoading(false);
    if (result.error) setError(result.error);
    else {
      setShowAddForm(false);
      setNewKey("");
      setNewValue("");
      setNewType("string");
      window.location.reload();
    }
  }

  async function handleDelete(key: string) {
    if (!confirm(`Delete setting "${key}"? This cannot be undone.`)) return;
    setSaving(key);
    const result = await deleteSetting(key);
    setSaving(null);
    if (result.error) setError(result.error);
    else setSettings((prev) => prev.filter((s) => s.key !== key));
  }

  // Group settings
  const grouped: Record<string, Setting[]> = { platform: [], security: [], general: [], transactions: [], custom: [] };
  settings.forEach((s) => {
    const meta = settingMeta[s.key];
    if (meta) grouped[meta.group].push(s);
    else grouped.custom.push(s);
  });

  return (
    <div>
      {/* Alerts */}
      {error && <Alert variant="danger" className="mb-4"><XCircle size={14} className="flex-shrink-0" />{error}</Alert>}
      {success && <Alert variant="success" className="mb-4"><CheckCircle size={14} className="flex-shrink-0" />{success}</Alert>}

      {/* Top Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Button size="sm" variant="ghost" onClick={() => setShowAddForm(true)} className="text-secondary">
          <Plus size={14} /> Ajouter un paramètre
        </Button>
        <Button size="sm" variant="ghost" onClick={handleReset} loading={resetting} className="text-amber-600 hover:bg-amber-50">
          <RotateCcw size={14} /> Réinitialiser par défaut
        </Button>
      </div>

      {/* Add Setting Form */}
      {showAddForm && (
        <Card className="mb-6">
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800">Ajouter un paramètre personnalisé</h3>
              <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <div className="grid sm:grid-cols-4 gap-4">
              <Input
                label="Clé"
                placeholder="e.g., maintenance_mode"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value.toLowerCase().replace(/[^a-z_]/g, ""))}
              />
              <Input
                label="Valeur"
                placeholder="Setting value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
                >
                  <option value="string">Texte</option>
                  <option value="boolean">Booléen</option>
                  <option value="integer">Entier</option>
                  <option value="float">Décimal</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddSetting} loading={addLoading} size="sm" className="w-full">
                  <Plus size={14} /> Créer
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Settings Groups */}
      <div className="space-y-6">
        {groups.map((group) => {
          const items = grouped[group.id];
          if (items.length === 0) return null;

          return (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <group.icon size={16} className={group.color} />
                  <h2 className="text-sm font-semibold text-slate-800 font-heading">{group.label}</h2>
                  <span className="text-[10px] text-slate-400">({items.length})</span>
                </div>
              </CardHeader>
              <div className="divide-y divide-slate-50">
                {items.map((setting) => {
                  const meta = settingMeta[setting.key];
                  const isBoolean = setting.type === "boolean";
                  const isProtected = setting.key.startsWith("platform_") || ["kyc_required", "default_currency"].includes(setting.key);
                  const isCustom = !meta;
                  const changed = hasChanges(setting.key);
                  const currentVal = getEditedValue(setting.key);

                  return (
                    <div key={setting.key} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Label + Description */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-800">
                            {meta?.label ?? setting.key}
                          </p>
                          {isCustom && (
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">personnalisé</span>
                          )}
                        </div>
                        {meta?.description && (
                          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{meta.description}</p>
                        )}
                        <p className="text-[10px] text-slate-400 mt-1">
                          Key: <code className="font-mono bg-slate-100 px-1 rounded">{setting.key}</code>
                          {" - "}Dernière mise à jour : {timeAgo(new Date(setting.updatedAt))}
                        </p>
                      </div>

                      {/* Control */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {isBoolean ? (
                          <button
                            onClick={() => handleToggle(setting.key)}
                            disabled={saving === setting.key}
                            className="relative"
                          >
                            {currentVal === "true" ? (
                              <ToggleRight size={36} className="text-accent" />
                            ) : (
                              <ToggleLeft size={36} className="text-slate-300" />
                            )}
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type={setting.type === "integer" || setting.type === "float" ? "number" : "text"}
                              step={setting.type === "float" ? "0.01" : undefined}
                              value={currentVal}
                              onChange={(e) => setEditedValue(setting.key, e.target.value)}
                              className={cn(
                                "w-40 px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary",
                                changed ? "border-secondary bg-blue-50/30" : "border-slate-300"
                              )}
                            />
                            {changed && (
                              <Button
                                size="sm"
                                onClick={() => handleSave(setting.key)}
                                loading={saving === setting.key}
                                className="!px-3 !py-1.5"
                              >
                                <Save size={12} />
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Delete (custom only) */}
                        {isCustom && !isProtected && (
                          <button
                            onClick={() => handleDelete(setting.key)}
                            disabled={saving === setting.key}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
