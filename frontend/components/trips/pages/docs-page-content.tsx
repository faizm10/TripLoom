"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  FileIcon,
  FileTextIcon,
  ImageIcon,
  MoreVerticalIcon,
  UploadCloudIcon,
  FolderOpenIcon,
  DownloadIcon,
  Trash2Icon,
  Loader2Icon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  getTripDocuments,
  uploadTripDocument,
  deleteTripDocument,
  getDocumentUrl,
  type TripDocument,
  type Category,
} from "@/lib/supabase-trip-docs"
import { useTripPage } from "@/components/trips/trip-shell"

const categoryColors: Record<Category, string> = {
  Flight: "bg-blue-500/10 text-blue-600 border-blue-200",
  Hotel: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  "ID/Visa": "bg-rose-500/10 text-rose-600 border-rose-200",
  Activity: "bg-amber-500/10 text-amber-600 border-amber-200",
  Other: "bg-slate-500/10 text-slate-600 border-slate-200",
}

const typeIcons: Record<string, React.ElementType> = {
  pdf: FileTextIcon,
  image: ImageIcon,
  doc: FileIcon,
}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function DocsPageContent() {
  const trip = useTripPage()
  const tripId = trip?.id

  const [activeCategory, setActiveCategory] = React.useState<Category | "All">("All")
  const [isDragActive, setIsDragActive] = React.useState(false)
  
  const [documents, setDocuments] = React.useState<TripDocument[]>([])
  const [loading, setLoading] = React.useState(true)
  const [uploading, setUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Fetch documents on mount
  React.useEffect(() => {
    if (!tripId) return
    async function fetchDocs() {
      try {
        const docs = await getTripDocuments(tripId!)
        setDocuments(docs)
      } catch (err: any) {
        toast.error("Failed to load documents", { description: err.message })
      } finally {
        setLoading(false)
      }
    }
    fetchDocs()
  }, [tripId])

  const filteredDocs = React.useMemo(() => {
    if (activeCategory === "All") return documents
    return documents.filter((d) => d.category === activeCategory)
  }, [activeCategory, documents])

  // Process selected files
  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0 || !tripId) return
    setUploading(true)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max 10MB.`)
        continue
      }
      
      const toastId = toast.loading(`Uploading ${file.name}...`)
      try {
        // Simple heuristic for category, user can't select it currently in this UI version
        let category: Category = "Other"
        const nameLower = file.name.toLowerCase()
        if (nameLower.includes("flight") || nameLower.includes("ticket") || nameLower.includes("boarding")) category = "Flight"
        if (nameLower.includes("hotel") || nameLower.includes("booking") || nameLower.includes("airbnb")) category = "Hotel"
        if (nameLower.includes("passport") || nameLower.includes("visa") || nameLower.includes("id")) category = "ID/Visa"
        
        const newDoc = await uploadTripDocument(tripId, file, category)
        setDocuments((prev) => [newDoc, ...prev])
        toast.success(`${file.name} uploaded`, { id: toastId })
      } catch (err: any) {
        toast.error(`Failed to upload ${file.name}`, { description: err.message, id: toastId })
      }
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleDownload(doc: TripDocument) {
    try {
      const url = await getDocumentUrl(doc.storage_path)
      window.open(url, "_blank")
    } catch (err: any) {
      toast.error("Failed to generate download link", { description: err.message })
    }
  }

  async function handleDelete(doc: TripDocument) {
    if (!confirm(`Are you sure you want to delete ${doc.name}?`)) return
    
    // Optimistic UI update
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
    try {
      await deleteTripDocument(doc.id, doc.storage_path)
      toast.success("Document deleted")
    } catch (err: any) {
      // Revert on failure
      setDocuments((prev) => [doc, ...prev])
      toast.error("Failed to delete document", { description: err.message })
    }
  }

  if (!tripId) return null

  return (
    <div className="space-y-8 pb-10">
      {/* Upload Header */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Trip Documents</h2>
          <p className="text-sm text-muted-foreground">
            Keep your tickets, bookings, and IDs safe in one place. Everyone on the trip can access these.
          </p>
        </div>

        {/* Hidden file input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple 
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" 
          onChange={(e) => handleFiles(e.target.files)} 
        />

        {/* Drag and drop upload zone */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-10 mt-4 transition-colors flex flex-col items-center justify-center text-center cursor-pointer
            ${isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"}
            ${uploading ? "opacity-50 pointer-events-none" : ""}  
          `}
          onDragEnter={(e) => { e.preventDefault(); setIsDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragActive(false); }}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragActive(false)
            handleFiles(e.dataTransfer.files)
          }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            {uploading ? <Loader2Icon className="size-6 animate-spin" /> : <UploadCloudIcon className="size-6" />}
          </div>
          <h3 className="text-sm font-semibold">
            {uploading ? "Uploading files..." : "Click to upload or drag and drop"}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            PDF, PNG, JPG, or DOC (max. 10MB). Files are securely stored in Supabase.
          </p>
          <Button variant="outline" size="sm" className="mt-4" disabled={uploading} onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
            Select Files
          </Button>
        </div>
      </section>

      {/* Documents Library */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="font-medium">File Library</h3>
          
          {/* Category Filters */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
            <Badge
              variant={activeCategory === "All" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setActiveCategory("All")}
            >
              All Files
            </Badge>
            {(Object.keys(categoryColors) as Category[]).map((cat) => (
              <Badge
                key={cat}
                variant="outline"
                className={`cursor-pointer transition-colors ${
                  activeCategory === cat 
                    ? categoryColors[cat] 
                    : "hover:bg-muted"
                }`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2Icon className="size-8 animate-spin text-muted-foreground/30" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed rounded-lg text-center">
            <FolderOpenIcon className="size-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium">No documents found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {activeCategory !== "All" 
                ? `No files uploaded in the ${activeCategory} category yet.` 
                : "Upload your first trip document above."}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDocs.map((doc, i) => {
              const Icon = typeIcons[doc.file_type] || FileIcon
              const dateAdded = new Date(doc.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  key={doc.id}
                >
                  <Card className="hover:border-primary/40 transition-colors group relative overflow-hidden">
                    <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                      <div className="flex items-center gap-3 w-full pr-6">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-muted text-muted-foreground rounded-md">
                          <Icon className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-sm font-medium truncate" title={doc.name}>
                            {doc.name}
                          </CardTitle>
                          <CardDescription className="text-xs truncate flex items-center gap-2 mt-0.5">
                            <span>{formatBytes(doc.file_size_bytes)}</span>
                            <span>&middot;</span>
                            <span>{dateAdded}</span>
                          </CardDescription>
                        </div>
                      </div>

                      {/* Dropdown Menu */}
                      <div className="absolute top-3 right-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100">
                              <MoreVerticalIcon className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDownload(doc)}>
                              <DownloadIcon className="mr-2 size-4" />
                              View / Download
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(doc)}>
                              <Trash2Icon className="mr-2 size-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-1">
                      <Badge variant="outline" className={`text-[10px] h-5 px-1.5 ${categoryColors[doc.category] || categoryColors.Other}`}>
                        {doc.category}
                      </Badge>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

