import { useEffect, useState } from "react"
import { Contact, Download } from "lucide-react"
import { ButtonLink } from "@/components/ui/Button"

type DeviceKind = "ios" | "android" | "desktop"

function detectDevice(): DeviceKind {
  const userAgent = window.navigator.userAgent.toLowerCase()
  const platform = window.navigator.platform.toLowerCase()

  if (
    /iphone|ipad|ipod/.test(userAgent) ||
    (platform === "macintel" && window.navigator.maxTouchPoints > 1)
  ) {
    return "ios"
  }

  if (/android/.test(userAgent)) {
    return "android"
  }

  return "desktop"
}

function getLabel(device: DeviceKind) {
  if (device === "ios") {
    return "Přidat do Kontaktů"
  }

  if (device === "android") {
    return "Importovat kontakt"
  }

  return "Stáhnout vCard"
}

function getHint(device: DeviceKind) {
  if (device === "ios") {
    return "Soubor vCard otevře iOS pro přidání do Kontaktů."
  }

  if (device === "android") {
    return "Soubor vCard lze otevřít v Kontaktech Google nebo v aplikaci telefonu."
  }

  return "Soubor vCard můžete importovat do Apple Kontaktů, Google Kontaktů nebo Outlooku."
}

interface AddContactButtonProps {
  className?: string
}

export function AddContactButton({ className }: AddContactButtonProps) {
  const [device, setDevice] = useState<DeviceKind>("desktop")

  useEffect(() => {
    setDevice(detectDevice())
  }, [])

  return (
    <div className={className}>
      <ButtonLink
        href="/frantisek-kalasek.vcf"
        variant="secondary"
        download="frantisek-kalasek.vcf"
        type="text/vcard"
      >
        {device === "desktop" ? (
          <Download className="h-4 w-4" aria-hidden />
        ) : (
          <Contact className="h-4 w-4" aria-hidden />
        )}
        {getLabel(device)}
      </ButtonLink>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {getHint(device)}
      </p>
    </div>
  )
}
