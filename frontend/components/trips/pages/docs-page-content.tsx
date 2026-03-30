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

// --- Mock Data ---

type Category = "Flight" | "Hotel" | "ID/Visa" | "Activity" | "Other"

interface Document {
  id: string
  name: string
  category: Category
  size: string
  dateAdded: string
  type: "pdf" | "image" | "doc"
}

const mockDocuments: Document[] = [
  {
    id: "doc1",
    name: "Lufthansa_E-Ticket_Munich.pdf",
    category: "Flight",
    size: "1.2 MB",
    dateAdded: "Oct 12, 2026",
    type: "pdf",
  },
  {
    id: "doc2",
    name: "Grand_Hotel_Confirmation.pdf",
    category: "Hotel",
    size: "840 KB",
    dateAdded: "Oct 15, 2026",
    type: "pdf",
  },
  {
    id: "doc3",
    name: "Passport_Scan_Faiz.jpg",
    category: "ID/Visa",
    size: "2.4 MB",
    dateAdded: "Oct 18, 2026",
    type: "image",
  },
  {
    id: "doc4",
    name: "Oktoberfest_Tent_Tickets.pdf",
    category: "Activity",
    size: "450 KB",
    dateAdded: "Nov 02, 2026",
    type: "pdf",
  },
  {
    id: "doc5",
    name: "Eurail_Pass_QR.png",
    category: "Other",
    size: "1.8 MB",
    dateAdded: "Nov 05, 2026",
    type: "image",
  },
]

const categoryColors: Record<Category, string> = {
  Flight: "bg-blue-500/10 text-blue-600 border-blue-200",
  Hotel: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  "ID/Visa": "bg-rose-500/10 text-rose-600 border-rose-200",
  Activity: "bg-amber-500/10 text-amber-600 border-amber-200",
  Other: "bg-slate-500/10 text-slate-600 border-slate-200",
}

const typeIcons = {
  pdf: FileTextIcon,
  image: ImageIcon,
  doc: FileIcon,
}

// --- Component ---

export function DocsPageContent() {
  const [activeCategory, setActiveCategory] = React.useState<Category | "All">("All")
  const [isDragActive, setIsDragActive] = React.useState(false)

  const filteredDocs = React.useMemo(() => {
    if (activeCategory === "All") return mockDocuments
    return mockDocuments.filter((d) => d.category === activeCategory)
  }, [activeCategory])

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

        {/* Drag and drop upload zone mock */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-10 mt-4 transition-colors flex flex-col items-center justify-center text-center 
            ${isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"}`}
          onDragEnter={() => setIsDragActive(true)}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={() => setIsDragActive(false)}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <UploadCloudIcon className="size-6" />
          </div>
          <h3 className="text-sm font-semibold">Click to upload or drag and drop</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            PDF, PNG, JPG, or DOC (max. 10MB). Files are securely stored in Supabase.
          </p>
          <Button variant="outline" size="sm" className="mt-4">
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

        {filteredDocs.length === 0 ? (
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
              const Icon = typeIcons[doc.type]
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
                            <span>{doc.size}</span>
                            <span>&middot;</span>
                            <span>{doc.dateAdded}</span>
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
                            <DropdownMenuItem>
                              <DownloadIcon className="mr-2 size-4" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                              <Trash2Icon className="mr-2 size-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-1">
                      <Badge variant="outline" className={`text-[10px] h-5 px-1.5 ${categoryColors[doc.category]}`}>
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
