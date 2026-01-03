import Pre from "@/components/ui/pre"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardGrid } from "@/components/markdown/card"
import { FileTree } from "@/components/markdown/filetree"
import { File, Folder } from "@/components/markdown/filetree/component"
import RoutedLink from "@/components/markdown/link"
import Note from "@/components/markdown/note"
import { Step, StepItem } from "@/components/markdown/step"
import { OwnerBadge } from "@/components/markdown/owner-badge"
import { KeywordTags } from "@/components/markdown/keyword-tags"
import { StandardsReference } from "@/components/markdown/standards-reference"

export const components = {
  a: RoutedLink,
  Card,
  CardGrid,
  FileTree,
  Folder,
  File,
  KeywordTags,
  Note,
  OwnerBadge,
  pre: Pre,
  StandardsReference,
  Step,
  StepItem,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
}
