'use client'

import { AdminPage } from '../../components/AdminPage'
import { ModForm } from '../../components/mods/ModForm'

export default function NewModPage() {
  return (
    <AdminPage size="form">
      <ModForm mode="create" />
    </AdminPage>
  )
}
