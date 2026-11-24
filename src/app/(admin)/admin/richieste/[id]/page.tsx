import EnquiryDetail from './EnquiryDetail';

export default async function EnquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EnquiryDetail enquiryId={id} />;
}
