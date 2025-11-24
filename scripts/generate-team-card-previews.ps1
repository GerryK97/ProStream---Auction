param(
    [string]$OutputDir = "docs/images/overlays",
    [int]$Width = 1280,
    [int]$Height = 720
)

Add-Type -AssemblyName System.Drawing

function Convert-HexToColor {
    param([string]$Hex, [int]$Alpha = 255)
    if (-not $Hex) {
        return [System.Drawing.Color]::FromArgb(0, 0, 0, 0)
    }
    $value = $Hex.TrimStart('#')
    if ($value.Length -eq 3) {
        $value = ($value[0] + $value[0] + $value[1] + $value[1] + $value[2] + $value[2])
    }

    $r = [Convert]::ToInt32($value.Substring(0, 2), 16)
    $g = [Convert]::ToInt32($value.Substring(2, 2), 16)
    $b = [Convert]::ToInt32($value.Substring(4, 2), 16)
    return [System.Drawing.Color]::FromArgb($Alpha, $r, $g, $b)
}

function New-RoundedRectangle {
    param([System.Drawing.RectangleF]$Rect, [float]$Radius)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $diameter = $Radius * 2
    $path.AddArc($Rect.X, $Rect.Y, $diameter, $diameter, 180, 90)
    $path.AddArc($Rect.Right - $diameter, $Rect.Y, $diameter, $diameter, 270, 90)
    $path.AddArc($Rect.Right - $diameter, $Rect.Bottom - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc($Rect.X, $Rect.Bottom - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()
    return $path
}

function Draw-TeamCard {
    param(
        [System.Drawing.Graphics]$Graphics,
        [System.Drawing.RectangleF]$Rect,
        [hashtable]$Theme,
        [hashtable]$Team
    )
    $cardPath = New-RoundedRectangle -Rect $Rect -Radius $Theme.Card.Radius
    $cardBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($Rect, (Convert-HexToColor $Theme.Card.Start), (Convert-HexToColor $Theme.Card.End), 135)
    $Graphics.FillPath($cardBrush, $cardPath)

    $borderColor = Convert-HexToColor($(if ($Team.IsWinning) { $Theme.Border.Winning } else { $Theme.Border.Base }))
    $borderPen = New-Object System.Drawing.Pen($borderColor, 3)
    $Graphics.DrawPath($borderPen, $cardPath)

    $accentRect = New-Object -TypeName System.Drawing.RectangleF -ArgumentList ($Rect.X + 24), ($Rect.Y + 24), ($Rect.Width - 48), 34
    $accentBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($accentRect, (Convert-HexToColor -Hex $Team.Accent.Start -Alpha 200), (Convert-HexToColor -Hex $Team.Accent.End -Alpha 200), 0)
    $Graphics.FillRectangle($accentBrush, $accentRect)

    $accentFont = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
    $accentFormat = New-Object System.Drawing.StringFormat
    $accentFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
    $accentFormat.Alignment = [System.Drawing.StringAlignment]::Near
    $accentColor = New-Object System.Drawing.SolidBrush((Convert-HexToColor $Theme.Text.Badge))
    $Graphics.DrawString("$($Team.Accent.Icon)  $($Team.Accent.Label)", $accentFont, $accentColor, (New-Object -TypeName System.Drawing.RectangleF -ArgumentList ($accentRect.X + 16), $accentRect.Y, ($accentRect.Width / 2), $accentRect.Height), $accentFormat)

    $badgeRect = New-Object -TypeName System.Drawing.RectangleF -ArgumentList ($accentRect.Right - 180), ($accentRect.Y + 4), 160, 26
    $badgePath = New-RoundedRectangle -Rect $badgeRect -Radius 13
    $badgeBrush = New-Object System.Drawing.SolidBrush((Convert-HexToColor -Hex $Team.Badge.Background -Alpha 220))
    $Graphics.FillPath($badgeBrush, $badgePath)
    $badgeFont = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
    $badgeFormat = New-Object System.Drawing.StringFormat
    $badgeFormat.Alignment = [System.Drawing.StringAlignment]::Center
    $badgeFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
    $badgeTextBrush = New-Object System.Drawing.SolidBrush((Convert-HexToColor $Team.Badge.Text))
    $Graphics.DrawString("Max " + $Team.MaxBid, $badgeFont, $badgeTextBrush, $badgeRect, $badgeFormat)

    $logoRect = New-Object -TypeName System.Drawing.RectangleF -ArgumentList ($Rect.X + 40), ($Rect.Y + 78), 84, 84
    $logoBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($logoRect, (Convert-HexToColor $Team.Logo.Inner), (Convert-HexToColor $Team.Logo.Outer), 135)
    $Graphics.FillEllipse($logoBrush, $logoRect)

    $teamNameFont = New-Object System.Drawing.Font("Segoe UI Semibold", 26)
    $teamNameBrush = New-Object System.Drawing.SolidBrush((Convert-HexToColor $Theme.Text.Primary))
    $Graphics.DrawString($Team.Name, $teamNameFont, $teamNameBrush, ($Rect.X + 140), ($Rect.Y + 88))

    $statsFont = New-Object System.Drawing.Font("Segoe UI", 12)
    $statsBrush = New-Object System.Drawing.SolidBrush((Convert-HexToColor $Theme.Text.Secondary))
    $Graphics.DrawString("$($Team.PlayersPurchased)/$($Team.SquadSize) players • $($Team.SlotsLeft) slots left", $statsFont, $statsBrush, ($Rect.X + 142), ($Rect.Y + 126))

    $balanceFont = New-Object System.Drawing.Font("Consolas", 22, [System.Drawing.FontStyle]::Bold)
    $balanceBrush = New-Object System.Drawing.SolidBrush((Convert-HexToColor $Theme.Text.Balance))
    $Graphics.DrawString($Team.Balance, $balanceFont, $balanceBrush, ($Rect.Right - 260), ($Rect.Y + 90))

    $balanceLabelFont = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
    $balanceLabelBrush = New-Object System.Drawing.SolidBrush((Convert-HexToColor $Theme.Text.Badge))
    $Graphics.DrawString("Balance", $balanceLabelFont, $balanceLabelBrush, ($Rect.Right - 260), ($Rect.Y + 70))

    $progressBack = New-Object -TypeName System.Drawing.RectangleF -ArgumentList ($Rect.X + 142), ($Rect.Y + 156), ($Rect.Width - 220), 14
    $Graphics.FillRectangle((New-Object System.Drawing.SolidBrush (Convert-HexToColor -Hex "#ffffff" -Alpha 30)), $progressBack)
    $progressFill = $progressBack
    $progressFill.Width = $progressFill.Width * $Team.Progress
    $progressBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($progressFill, (Convert-HexToColor $Team.ProgressColors.Start), (Convert-HexToColor $Team.ProgressColors.End), 0)
    $Graphics.FillRectangle($progressBrush, $progressFill)

    $footerFont = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
    $footerBrushLeft = New-Object System.Drawing.SolidBrush((Convert-HexToColor $Theme.Text.MaxBid))
    $Graphics.DrawString("Max Bid Ready", $footerFont, $footerBrushLeft, ($Rect.X + 142), ($Rect.Bottom - 52))
    $footerBrushRight = New-Object System.Drawing.SolidBrush((Convert-HexToColor $Theme.Text.Primary))
    $Graphics.DrawString($Team.MaxBid, $footerFont, $footerBrushRight, ($Rect.Right - 220), ($Rect.Bottom - 52))

    $captionFont = New-Object System.Drawing.Font("Segoe UI", 13, [System.Drawing.FontStyle]::Bold)
    $captionBrush = New-Object System.Drawing.SolidBrush((Convert-HexToColor $Theme.Overlay.Caption))
    $Graphics.DrawString($Team.Caption, $captionFont, $captionBrush, ($Rect.X + 24), ($Rect.Bottom - 20))
}

$themes = @(
    @{
        Name = 'Neon Pulse';
        Output = 'team-cards-neon.png';
        Background = @{
            Start = '#050F2A';
            End = '#251C59';
        };
        Overlay = @{
            Caption = '#cbd5f5';
        };
        Card = @{
            Start = '#101b3f';
            End = '#2e0b68';
            Radius = 28;
        };
        Border = @{
            Base = '#22d3ee';
            Winning = '#f97316';
        };
        Text = @{
            Primary = '#ecfeff';
            Secondary = '#93c5fd';
            Balance = '#fef3c7';
            MaxBid = '#e9d5ff';
            Badge = '#cffafe';
        };
        Teams = @(
            @{
                Name = 'Nova Strikers';
                PlayersPurchased = 7;
                SquadSize = 16;
                SlotsLeft = 9;
                Balance = '$48,750';
                MaxBid = '$12,500';
                Progress = 0.44;
                ProgressColors = @{ Start = '#22d3ee'; End = '#c084fc'; };
                Logo = @{ Inner = '#2dd4bf'; Outer = '#7c3aed'; };
                Accent = @{ Icon = '⚡'; Label = 'Neon Pulse'; Start = '#2563eb'; End = '#a855f7'; };
                Badge = @{ Background = '#7c3aed'; Text = '#f5f3ff'; };
                IsWinning = $true;
                Caption = 'Last Sold Highlight';
            },
            @{
                Name = 'Hyper Phoenix';
                PlayersPurchased = 9;
                SquadSize = 16;
                SlotsLeft = 7;
                Balance = '$42,300';
                MaxBid = '$10,200';
                Progress = 0.56;
                ProgressColors = @{ Start = '#38bdf8'; End = '#f472b6'; };
                Logo = @{ Inner = '#38bdf8'; Outer = '#f472b6'; };
                Accent = @{ Icon = '🌌'; Label = 'Quantum Grid'; Start = '#0ea5e9'; End = '#9333ea'; };
                Badge = @{ Background = '#0ea5e9'; Text = '#f0fdff'; };
                IsWinning = $false;
                Caption = 'Live bidding state';
            }
        );
    },
    @{
        Name = 'Ember Pulse';
        Output = 'team-cards-ember.png';
        Background = @{
            Start = '#2b0f00';
            End = '#651508';
        };
        Overlay = @{
            Caption = '#fde68a';
        };
        Card = @{
            Start = '#3b0a0a';
            End = '#7a2314';
            Radius = 26;
        };
        Border = @{
            Base = '#fb923c';
            Winning = '#fbbf24';
        };
        Text = @{
            Primary = '#fef3c7';
            Secondary = '#fed7aa';
            Balance = '#fff7ed';
            MaxBid = '#ffedd5';
            Badge = '#fff7ed';
        };
        Teams = @(
            @{
                Name = 'Solar Guardians';
                PlayersPurchased = 9;
                SquadSize = 16;
                SlotsLeft = 7;
                Balance = 'Rs 86,000';
                MaxBid = 'Rs 24,300';
                Progress = 0.56;
                ProgressColors = @{ Start = '#fb923c'; End = '#f97316'; };
                Logo = @{ Inner = '#fb923c'; Outer = '#ea580c'; };
                Accent = @{ Icon = '🔥'; Label = 'Ember Rush'; Start = '#f97316'; End = '#dc2626'; };
                Badge = @{ Background = '#ea580c'; Text = '#fff7ed'; };
                IsWinning = $true;
                Caption = 'Heatwave winner';
            },
            @{
                Name = 'Blaze Monarchs';
                PlayersPurchased = 6;
                SquadSize = 16;
                SlotsLeft = 10;
                Balance = 'Rs 92,500';
                MaxBid = 'Rs 18,900';
                Progress = 0.38;
                ProgressColors = @{ Start = '#fde68a'; End = '#f97316'; };
                Logo = @{ Inner = '#fde047'; Outer = '#fbbf24'; };
                Accent = @{ Icon = '♨'; Label = 'Molten Circuit'; Start = '#fb923c'; End = '#b91c1c'; };
                Badge = @{ Background = '#b45309'; Text = '#fff7ed'; };
                IsWinning = $false;
                Caption = 'Ready for bidding';
            }
        );
    }
)

if (-not (Test-Path $OutputDir)) {
    New-Item -Path $OutputDir -ItemType Directory -Force | Out-Null
}

foreach ($theme in $themes) {
    $bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    $bgRect = New-Object System.Drawing.Rectangle(0, 0, $Width, $Height)
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($bgRect, (Convert-HexToColor $theme.Background.Start), (Convert-HexToColor $theme.Background.End), 90)
    $graphics.FillRectangle($bgBrush, $bgRect)

    $cardWidth = 520
    $cardHeight = 250
    $cardGap = 60
    $startX = ($Width - (2 * $cardWidth) - $cardGap) / 2
    $startY = ($Height - $cardHeight) / 2

    for ($i = 0; $i -lt $theme.Teams.Count; $i++) {
        $x = $startX + $i * ($cardWidth + $cardGap)
        $rect = New-Object -TypeName System.Drawing.RectangleF -ArgumentList $x, $startY, $cardWidth, $cardHeight
        Draw-TeamCard -Graphics $graphics -Rect $rect -Theme $theme -Team $theme.Teams[$i]
    }

    $titleFont = New-Object System.Drawing.Font("Segoe UI Semibold", 30)
    $titleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(230, 255, 255, 255))
    $graphics.DrawString("$($theme.Name) Overlay", $titleFont, $titleBrush, 60, 40)

    $outputPath = Join-Path $OutputDir $theme.Output
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()
    Write-Output "Generated $outputPath"
}
