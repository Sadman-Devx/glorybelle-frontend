'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Badge from '@/components/admin/Badge';
import Button from '@/components/admin/Button';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import EmptyState from '@/components/admin/EmptyState';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  adminStaffApi,
  type AdminStaffUser,
  type StaffRole,
  type StaffRoleAudit,
} from '@/lib/adminStaff';
import styles from './page.module.css';

const userPageSize = 25;
const auditPageSize = 10;

const roleLabels: Record<string, string> = {
  superuser: 'Superuser',
  manager: 'Manager',
  viewer: 'Viewer',
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export default function UsersManager() {
  const { user } = useAdminAuth();
  const isSuperuser = user?.role === 'superuser'
    || Boolean(user?.permissions.includes('*'));
  const [users, setUsers] = useState<AdminStaffUser[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [roleDrafts, setRoleDrafts] = useState<Record<number, StaffRole | ''>>({});
  const [audit, setAudit] = useState<StaffRoleAudit[]>([]);
  const [auditCount, setAuditCount] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditSearch, setAuditSearch] = useState('');
  const [invite, setInvite] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'manager' as StaffRole,
  });
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminStaffUser | null>(null);

  const loadUsers = useCallback(async () => {
    if (!isSuperuser) return;
    setLoading(true);
    setError(null);
    try {
      const response = await adminStaffApi.list(search, activeFilter, userPage);
      setUsers(response.results);
      setUserCount(response.count);
      const nextRoles: Record<number, StaffRole | ''> = {};
      response.results.forEach((staffUser) => {
        nextRoles[staffUser.id] = staffUser.role === 'manager' || staffUser.role === 'viewer'
          ? staffUser.role
          : '';
      });
      setRoleDrafts(nextRoles);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error
        ? requestError.message
        : 'Non è stato possibile caricare gli utenti.');
    } finally {
      setLoading(false);
    }
  }, [activeFilter, isSuperuser, search, userPage]);

  const loadAudit = useCallback(async () => {
    if (!isSuperuser) return;
    setAuditLoading(true);
    setAuditError(null);
    try {
      const response = await adminStaffApi.roleAudit(auditSearch, auditPage);
      setAudit(response.results);
      setAuditCount(response.count);
    } catch (requestError: unknown) {
      setAuditError(requestError instanceof Error
        ? requestError.message
        : 'Non è stato possibile caricare lo storico dei ruoli.');
    } finally {
      setAuditLoading(false);
    }
  }, [auditPage, auditSearch, isSuperuser]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadUsers(), 0);
    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAudit(), 0);
    return () => window.clearTimeout(timer);
  }, [loadAudit]);

  async function inviteStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      await adminStaffApi.invite(invite);
      setInvite({ email: '', first_name: '', last_name: '', role: 'manager' });
      setUserPage(1);
      setNotice(`Invito inviato a ${invite.email}.`);
      await Promise.all([loadUsers(), loadAudit()]);
    } catch (requestError: unknown) {
      const message = requestError instanceof Error
        ? requestError.message
        : 'Non è stato possibile inviare l’invito.';
      await loadUsers();
      setError(message);
    } finally {
      setPending(false);
    }
  }

  async function changeRole(staffUser: AdminStaffUser) {
    const role = roleDrafts[staffUser.id];
    if (!role) {
      setError('Seleziona un ruolo prima di salvare.');
      return;
    }
    setPendingUserId(staffUser.id);
    setError(null);
    setNotice(null);
    try {
      await adminStaffApi.changeRole(staffUser.id, role);
      setNotice(`Ruolo aggiornato per ${staffUser.email}.`);
      await Promise.all([loadUsers(), loadAudit()]);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error
        ? requestError.message
        : 'Non è stato possibile aggiornare il ruolo.');
    } finally {
      setPendingUserId(null);
    }
  }

  async function deactivateStaff() {
    if (!deactivateTarget) return;
    setPendingUserId(deactivateTarget.id);
    setError(null);
    try {
      await adminStaffApi.deactivate(deactivateTarget.id);
      setNotice(`Account ${deactivateTarget.email} disattivato.`);
      setDeactivateTarget(null);
      await loadUsers();
    } catch (requestError: unknown) {
      setError(requestError instanceof Error
        ? requestError.message
        : 'Non è stato possibile disattivare l’account.');
    } finally {
      setPendingUserId(null);
    }
  }

  async function sendPasswordLink(staffUser: AdminStaffUser) {
    setPendingUserId(staffUser.id);
    setError(null);
    setNotice(null);
    try {
      const response = await adminStaffApi.sendPasswordLink(staffUser.id);
      setNotice(response.detail);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error
        ? requestError.message
        : 'Non è stato possibile inviare il link password.');
    } finally {
      setPendingUserId(null);
    }
  }

  if (!isSuperuser) {
    return (
      <div className={styles.page}>
        <EmptyState
          title="Accesso riservato"
          description="La gestione degli utenti è disponibile solo per i superuser."
        />
      </div>
    );
  }

  const userPageCount = Math.max(1, Math.ceil(userCount / userPageSize));
  const auditPageCount = Math.max(1, Math.ceil(auditCount / auditPageSize));

  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <div>
          <span className="eyebrow eyebrow-line">Area riservata</span>
          <h1>Utenti staff</h1>
          <p>Invita il team e assegna i ruoli di accesso amministrativo.</p>
        </div>
        <Badge tone="gold">{userCount} account</Badge>
      </header>

      <form className={styles.invite} onSubmit={(event) => void inviteStaff(event)}>
        <h2>Invita una persona</h2>
        <div className={styles.inviteFields}>
          <label className={styles.field}>
            <span>Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={invite.email}
              disabled={pending}
              onChange={(event) => setInvite((value) => ({
                ...value,
                email: event.currentTarget.value,
              }))}
            />
          </label>
          <label className={styles.field}>
            <span>Nome</span>
            <input
              type="text"
              maxLength={150}
              autoComplete="given-name"
              value={invite.first_name}
              disabled={pending}
              onChange={(event) => setInvite((value) => ({
                ...value,
                first_name: event.currentTarget.value,
              }))}
            />
          </label>
          <label className={styles.field}>
            <span>Cognome</span>
            <input
              type="text"
              maxLength={150}
              autoComplete="family-name"
              value={invite.last_name}
              disabled={pending}
              onChange={(event) => setInvite((value) => ({
                ...value,
                last_name: event.currentTarget.value,
              }))}
            />
          </label>
          <label className={styles.field}>
            <span>Ruolo</span>
            <select
              value={invite.role}
              disabled={pending}
              onChange={(event) => setInvite((value) => ({
                ...value,
                role: event.currentTarget.value === 'viewer' ? 'viewer' : 'manager',
              }))}
            >
              <option value="manager">Manager</option>
              <option value="viewer">Viewer</option>
            </select>
          </label>
        </div>
        <p className={styles.hint}>
          La persona riceverà un link email per impostare la propria password.
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? 'Invio…' : 'Invia invito'}
        </Button>
      </form>

      {notice && <p className={styles.notice} role="status">{notice}</p>}
      {error && <p className={styles.error} role="alert">{error}</p>}

      <section className={styles.section} aria-label="Elenco utenti staff">
        <div className={styles.sectionHeading}>
          <h2>Account staff</h2>
          <span>{userCount} risultati</span>
        </div>
        <div className={styles.filters}>
          <label className={styles.field}>
            <span>Cerca</span>
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.currentTarget.value);
                setUserPage(1);
              }}
              placeholder="Nome o email"
            />
          </label>
          <label className={styles.field}>
            <span>Stato</span>
            <select
              value={activeFilter}
              onChange={(event) => {
                setActiveFilter(event.currentTarget.value);
                setUserPage(1);
              }}
            >
              <option value="">Tutti gli stati</option>
              <option value="true">Attivi</option>
              <option value="false">Disattivati</option>
            </select>
          </label>
        </div>
        {loading ? (
          <p className={styles.status} role="status">Caricamento utenti…</p>
        ) : users.length ? (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Persona</th>
                    <th scope="col">Ruolo</th>
                    <th scope="col">Stato</th>
                    <th scope="col">Creato il</th>
                    <th scope="col">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((staffUser) => (
                    <tr key={staffUser.id}>
                      <td data-label="Persona">
                        <strong>{staffUser.name || '—'}</strong>
                        <span className={styles.email}>{staffUser.email}</span>
                      </td>
                      <td data-label="Ruolo">
                        {staffUser.is_superuser ? (
                          <Badge tone="gold">Superuser</Badge>
                        ) : (
                          <div className={styles.roleEditor}>
                            <select
                              value={roleDrafts[staffUser.id] ?? ''}
                              disabled={pendingUserId === staffUser.id}
                              onChange={(event) => setRoleDrafts((value) => ({
                                ...value,
                                [staffUser.id]: event.currentTarget.value === 'manager'
                                  || event.currentTarget.value === 'viewer'
                                  ? event.currentTarget.value
                                  : '',
                              }))}
                              aria-label={`Ruolo per ${staffUser.email}`}
                            >
                              <option value="">Seleziona ruolo</option>
                              <option value="manager">Manager</option>
                              <option value="viewer">Viewer</option>
                            </select>
                            <Button
                              type="button"
                              variant="secondary"
                              disabled={
                                pendingUserId === staffUser.id
                                || !roleDrafts[staffUser.id]
                                || roleDrafts[staffUser.id] === staffUser.role
                              }
                              onClick={() => void changeRole(staffUser)}
                            >
                              Salva
                            </Button>
                          </div>
                        )}
                      </td>
                      <td data-label="Stato">
                        <Badge tone={staffUser.is_active ? 'success' : 'neutral'}>
                          {staffUser.is_active ? 'Attivo' : 'Disattivato'}
                        </Badge>
                      </td>
                      <td data-label="Creato il">{formatDate(staffUser.date_joined)}</td>
                      <td data-label="Azioni">
                        <div className={styles.actions}>
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={!staffUser.is_active || pendingUserId === staffUser.id}
                            onClick={() => void sendPasswordLink(staffUser)}
                          >
                            Invia link password
                          </Button>
                          {staffUser.is_active && !staffUser.is_superuser && (
                            <Button
                              type="button"
                              variant="danger"
                              disabled={pendingUserId === staffUser.id}
                              onClick={() => setDeactivateTarget(staffUser)}
                            >
                              Disattiva
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={userPage}
              pageCount={userPageCount}
              summary={`${(userPage - 1) * userPageSize + 1}–${Math.min(userPage * userPageSize, userCount)} di ${userCount}`}
              onChange={setUserPage}
            />
          </>
        ) : (
          <p className={styles.status}>Nessun account trovato.</p>
        )}
      </section>

      <section className={styles.section} aria-label="Storico delle modifiche ruolo">
        <div className={styles.sectionHeading}>
          <h2>Storico ruoli</h2>
          <span>{auditCount} modifiche</span>
        </div>
        <label className={styles.field}>
          <span>Cerca nello storico</span>
          <input
            type="search"
            value={auditSearch}
            onChange={(event) => {
              setAuditSearch(event.currentTarget.value);
              setAuditPage(1);
            }}
            placeholder="Email o ruolo"
          />
        </label>
        {auditError && <p className={styles.error} role="alert">{auditError}</p>}
        {auditLoading ? (
          <p className={styles.status} role="status">Caricamento storico…</p>
        ) : audit.length ? (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Utente</th>
                    <th scope="col">Modifica ruolo</th>
                    <th scope="col">Autore</th>
                    <th scope="col">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.map((entry) => (
                    <tr key={entry.id}>
                      <td data-label="Utente">{entry.target_email}</td>
                      <td data-label="Modifica ruolo">
                        {roleLabels[entry.from_role] || 'Nessun ruolo'}
                        {' → '}
                        {roleLabels[entry.to_role] || 'Nessun ruolo'}
                      </td>
                      <td data-label="Autore">{entry.changed_by_email || '—'}</td>
                      <td data-label="Data">{formatDate(entry.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={auditPage}
              pageCount={auditPageCount}
              summary={`${(auditPage - 1) * auditPageSize + 1}–${Math.min(auditPage * auditPageSize, auditCount)} di ${auditCount}`}
              onChange={setAuditPage}
            />
          </>
        ) : (
          <p className={styles.status}>Nessuna modifica di ruolo registrata.</p>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deactivateTarget)}
        title="Disattivare questo account?"
        description={`L’utente ${deactivateTarget?.email ?? ''} non potrà più accedere all’area amministrativa.`}
        confirmLabel="Disattiva account"
        confirmDisabled={pendingUserId !== null}
        pending={pendingUserId !== null}
        onCancel={() => setDeactivateTarget(null)}
        onConfirm={() => void deactivateStaff()}
      />
    </div>
  );
}

function Pagination({
  page,
  pageCount,
  summary,
  onChange,
}: {
  page: number;
  pageCount: number;
  summary: string;
  onChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;
  return (
    <div className={styles.pagination}>
      <span>{summary}</span>
      <div>
        <Button
          type="button"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Precedente
        </Button>
        <span>{page} / {pageCount}</span>
        <Button
          type="button"
          variant="secondary"
          disabled={page >= pageCount}
          onClick={() => onChange(page + 1)}
        >
          Successiva
        </Button>
      </div>
    </div>
  );
}
