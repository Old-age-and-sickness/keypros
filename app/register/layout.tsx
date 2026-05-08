import { RegisterProvider } from './_components/RegisterContext'

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return (
    <RegisterProvider>
      {children}
    </RegisterProvider>
  )
}
