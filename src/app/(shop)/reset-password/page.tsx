import type { Metadata } from 'next';
import SetPasswordForm from './SetPasswordForm';

export const metadata: Metadata = {
  title: 'Imposta la password',
  robots: { index: false, follow: false },
};

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ uid?: string | string[]; token?: string | string[] }>;
}) {
  const params = await searchParams;
  const uid = typeof params.uid === 'string' ? params.uid : '';
  const token = typeof params.token === 'string' ? params.token : '';

  return <SetPasswordForm uid={uid} token={token} />;
}
