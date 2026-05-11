$ErrorActionPreference = 'Continue'
$data = Get-Content 'c:\Users\ider\Documents\openalex-topics-tree\data\topics.json' -Raw | ConvertFrom-Json

Write-Host '=== 数据完整性检查报告 ===' -ForegroundColor Cyan
Write-Host ''

$topicCount = $data.Count
Write-Host '1. Topic 总数: ' -NoNewline
if ($topicCount -eq 4516) {
    Write-Host $topicCount -ForegroundColor Green
} else {
    Write-Host "$topicCount (expected: 4516)" -ForegroundColor Red
}

$requiredFields = @('id', 'display_name', 'description', 'keywords', 'subfield', 'field', 'domain')
$missingFields = @{}
$nullValueIssues = @{}
$emptyStringIssues = @{}

foreach ($field in $requiredFields) {
    $missingFields[$field] = 0
    $nullValueIssues[$field] = New-Object System.Collections.ArrayList
    $emptyStringIssues[$field] = New-Object System.Collections.ArrayList
}

for ($i = 0; $i -lt $data.Count; $i++) {
    $topic = $data[$i]
    
    foreach ($field in $requiredFields) {
        if ($topic.PSObject.Properties.Name -contains $field) {
            $value = $topic.$field
            
            if ($null -eq $value) {
                [void]$nullValueIssues[$field].Add($topic.id)
            }
            elseif ($value -is [string] -and $value -eq '') {
                [void]$emptyStringIssues[$field].Add($topic.id)
            }
        } else {
            $missingFields[$field]++
        }
    }
}

Write-Host ''
Write-Host '2. Missing fields (topics without this field):' -ForegroundColor Yellow
$hasMissing = $false
foreach ($field in $requiredFields) {
    if ($missingFields[$field] -gt 0) {
        Write-Host "   $field : $($missingFields[$field]) topics" -ForegroundColor Red
        $hasMissing = $true
    }
}
if (-not $hasMissing) {
    Write-Host '   All required fields present' -ForegroundColor Green
}

Write-Host ''
Write-Host '3. Null value issues:' -ForegroundColor Yellow
$hasNull = $false
foreach ($field in $requiredFields) {
    if ($nullValueIssues[$field].Count -gt 0) {
        Write-Host "   $field : $($nullValueIssues[$field].Count) null values" -ForegroundColor Red
        $count = [Math]::Min(3, $nullValueIssues[$field].Count)
        Write-Host "      Sample IDs: $($nullValueIssues[$field][0..($count-1)] -join ', ')"
        $hasNull = $true
    }
}
if (-not $hasNull) {
    Write-Host '   No null values found' -ForegroundColor Green
}

Write-Host ''
Write-Host '4. Empty string issues:' -ForegroundColor Yellow
$hasEmpty = $false
foreach ($field in $requiredFields) {
    if ($emptyStringIssues[$field].Count -gt 0) {
        Write-Host "   $field : $($emptyStringIssues[$field].Count) empty strings" -ForegroundColor Red
        $count = [Math]::Min(3, $emptyStringIssues[$field].Count)
        Write-Host "      Sample IDs: $($emptyStringIssues[$field][0..($count-1)] -join ', ')"
        $hasEmpty = $true
    }
}
if (-not $hasEmpty) {
    Write-Host '   No empty strings found' -ForegroundColor Green
}

Write-Host ''
Write-Host '5. Topic count by Domain:' -ForegroundColor Cyan
$domainStats = $data | Group-Object { $_.domain } | ForEach-Object {
    [PSCustomObject]@{
        Domain = $_.Name
        Count = $_.Count
    }
} | Sort-Object Count -Descending

$domainStats | ForEach-Object {
    Write-Host "   $($_.Domain) : $($_.Count)"
}
Write-Host ''
Write-Host "   Total: $($data.Count)" -ForegroundColor Gray
