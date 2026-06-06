# Make AlertZone Screens Theme-Dynamic
$files = @(
  @{
    Path = 'e:\AlertZone_New\alertzone-mobile-app\app\(tabs)\home.tsx'
    RelativeThemePath = '../../config/themeContext'
    Functions = @(
      'function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {',
      'function NearbyCard({ item, onPress }: { item: ReportPin; onPress: () => void }) {',
      'function NearbyListRow({ item, onPress }: { item: ReportPin; onPress: () => void }) {',
      'function UpdateRow({ item, onPress }: { item: ReportPin; onPress: () => void }) {',
      'function SkeletonCard() {',
      'function SkeletonUpdate() {',
      'function EmptyState({ title, subtitle, icon }: { title: string; subtitle: string; icon: string }) {',
      'export default function HomeScreen() {'
    )
  },
  @{
    Path = 'e:\AlertZone_New\alertzone-mobile-app\app\(tabs)\history.tsx'
    RelativeThemePath = '../../config/themeContext'
    Functions = @(
      'function ReportDetailModal({ report, onClose }: { report: Report | null; onClose: () => void }) {',
      'function ReportCard({ report, onPress }: { report: Report; onPress: () => void }) {',
      'export default function HistoryScreen() {'
    )
  },
  @{
    Path = 'e:\AlertZone_New\alertzone-mobile-app\app\(tabs)\report.tsx'
    RelativeThemePath = '../../config/themeContext'
    Functions = @(
      'function CategoryModal({',
      'function FullScreenMapModal({',
      'function SuccessScreen({',
      'export default function ReportScreen() {'
    )
  },
  @{
    Path = 'e:\AlertZone_New\alertzone-mobile-app\app\(tabs)\map.tsx'
    RelativeThemePath = '../../config/themeContext'
    Functions = @(
      'export default function MapScreen() {'
    )
  },
  @{
    Path = 'e:\AlertZone_New\alertzone-mobile-app\components\ReportDetailSheet.tsx'
    RelativeThemePath = '../config/themeContext'
    Functions = @(
      'function CommentCard({',
      'export default function ReportDetailSheet({ reportId, onClose }: Props) {'
    )
  }
)

foreach ($f in $files) {
  $path = $f.Path
  if (Test-Path $path) {
    Write-Host "Processing $path..."
    $content = Get-Content $path -Raw

    # 1. Add import if missing
    if ($content -notlike "*config/themeContext*") {
      $importStr = "import { useTheme } from '" + $f.RelativeThemePath + "';"
      $content = $content -replace "import React", "$importStr`nimport React"
    }

    # 2. Inject hook in functions
    foreach ($func in $f.Functions) {
      $escapedFunc = [regex]::Escape($func)
      if ($content -match $escapedFunc) {
        # Check if already has useTheme
        $pattern = $escapedFunc + "\s*const \{\s*colors"
        if ($content -notmatch $pattern) {
          $replacement = $func + "`n  const { colors, isDark, theme } = useTheme();"
          $content = $content -replace $escapedFunc, $replacement
        }
      }
    }

    # 3. Replace static color properties with dynamic token styles
    # Replace background color strings in style contexts
    $content = $content -replace "backgroundColor:\s*['\"]#F5F5F5['\"]", "backgroundColor: colors.background"
    $content = $content -replace "backgroundColor:\s*['\"]#FAFAFA['\"]", "backgroundColor: colors.background"
    $content = $content -replace "backgroundColor:\s*['\"]#FFFFFF['\"]", "backgroundColor: colors.card"
    $content = $content -replace "backgroundColor:\s*['\"]#F9FAFB['\"]", "backgroundColor: colors.cardUnearned"
    
    # Replace borders
    $content = $content -replace "borderColor:\s*['\"]#E8E8E8['\"]", "borderColor: colors.border"
    $content = $content -replace "borderColor:\s*['\"]#E8E8E8/40['\"]", "borderColor: colors.border + '40'"
    
    # Replace texts
    $content = $content -replace "color:\s*['\"]#1A1A1A['\"]", "color: colors.text"
    $content = $content -replace "color:\s*['\"]#6B7280['\"]", "color: colors.textSecondary"
    $content = $content -replace "color:\s*['\"]#9CA3AF['\"]", "color: colors.textMuted"
    $content = $content -replace "color:\s*['\"]#0D8A72['\"]", "color: colors.primary"
    
    # Replace active styles
    $content = $content -replace "backgroundColor:\s*['\"]#0D8A72['\"]", "backgroundColor: colors.primary"
    $content = $content -replace "backgroundColor:\s*['\"]#0B6E5B['\"]", "backgroundColor: colors.primaryPressed"
    $content = $content -replace "backgroundColor:\s*['\"]#E6F7F3['\"]", "backgroundColor: colors.primary + '15'"

    # Write back
    Set-Content $path $content -NoNewline
    Write-Host "Successfully updated $path"
  } else {
    Write-Warning "File not found: $path"
  }
}
