'use client'

import { AdminPage } from '../../components/AdminPage'
import { GuideForm } from '../../components/guides/GuideForm'

export default function NewGuidePage() {
  return (
    <AdminPage size="form">
      <GuideForm mode="create" />
    </AdminPage>
  )
}
