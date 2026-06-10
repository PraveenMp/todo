$file = "c:\praveen\my-projects\todo\src\pages\AllTasks.jsx"
$content = Get-Content $file -Raw

# Replace first kanban-column (New Tasks)
$content = $content -replace '(?s)(\{/\* New Tasks Column \*/\}\s*<div className="kanban-column">)', '{/* New Tasks Column */}`n                    <div `n                      className={``kanban-column $${dragOverColumn === ''new'' ? ''drag-over'' : ''''}`}`n                      onDragOver={handleDragOver}`n                      onDragEnter={() => handleDragEnter(''new'')}`n                      onDragLeave={handleDragLeave}`n                      onDrop={(e) => handleDrop(e, ''new'')}`n                    >'

# Add draggable to all task cards
$content = $content -replace '(className=\{`task-card priority-\$\{task\.priority \|\| ''medium''\}`\})\s*>', '$1`n                              draggable`n                              onDragStart={(e) => handleDragStart(e, task)}`n                              onDragEnd={handleDragEnd}`n                            >'

Set-Content $file -Value $content -NoNewline
Write-Host "Drag handlers added successfully!"
