$hostname = 'spider-webmasters-themselves-logs.trycloudflare.com'
$buildGradle = 'C:\Users\zohof\Desktop\projects\vr\quest-wrapper\app\build.gradle'
$content = Get-Content $buildGradle -Raw

if ($content -match 'versionCode (\d+)') {
    $old = [int]$Matches[1]
    $new = $old + 1
    $content = $content -replace "versionCode $old", "versionCode $new"
    Write-Host "versionCode: $old -> $new"
}

$content = $content -replace "hostName: '[^']+'", "hostName: '$hostname'"
Set-Content $buildGradle $content

$stringsXml = 'C:\Users\zohof\Desktop\projects\vr\quest-wrapper\app\src\main\res\values\strings.xml'
$strContent = Get-Content $stringsXml -Raw
$strContent = $strContent -replace 'https://[^"]*trycloudflare\.com', "https://$hostname"
Set-Content $stringsXml $strContent

# Update manifest.json
$manifest = 'C:\Users\zohof\Desktop\projects\vr\src\manifest.json'
$mContent = Get-Content $manifest -Raw
$mContent = $mContent -replace 'https://[^"]*trycloudflare\.com[^"]*', "https://$hostname/"
Set-Content $manifest $mContent

# Update assetlinks in public and dist
$alPublic = 'C:\Users\zohof\Desktop\projects\vr\public\.well-known\assetlinks.json'
$alDist = 'C:\Users\zohof\Desktop\projects\vr\dist\.well-known\assetlinks.json'
# assetlinks don't have the tunnel URL, skip

Write-Host "TWA config updated to: $hostname"
