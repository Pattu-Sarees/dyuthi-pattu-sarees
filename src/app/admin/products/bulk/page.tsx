import BulkUploadForm from '@/components/admin/BulkUploadForm'

export default function BulkUploadPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Bulk Upload Sarees</h1>
      <p className="text-sm text-gray-500 mb-6">Add many sarees at once — one product per photo</p>
      <BulkUploadForm />
    </div>
  )
}
