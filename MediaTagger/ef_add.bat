rem Create a new migration from models (code-first)
echo off
if "%1"=="" (
echo migration name is required:  ef_create.bat [name]
) else (
echo create migration %1
dotnet ef migrations add %1
)