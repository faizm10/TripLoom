import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DocsPageContent() {
  return (
    <Card>
      <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>Store tickets, booking confirmations, and trip docs in one place.</p>
        <ul className="space-y-1">
          <li>• Flight e-ticket receipt</li>
          <li>• Hotel confirmation PDF</li>
          <li>• Transit pass references</li>
        </ul>
      </CardContent>
    </Card>
  )
}
