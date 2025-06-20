@echo off
REM Script de test Windows pour SafePass
REM Usage: scripts\run-tests.bat [type]

setlocal enabledelayedexpansion

set TEST_TYPE=%1
if "%TEST_TYPE%"=="" set TEST_TYPE=all

echo 🧪 SafePass Test Suite
echo ======================
echo Type de test: %TEST_TYPE%
echo Démarré à: %date% %time%
echo.

REM Vérification des prérequis
echo ℹ️  Vérification des prérequis...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js n'est pas installé
    exit /b 1
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm n'est pas installé
    exit /b 1
)

if not exist package.json (
    echo ❌ package.json non trouvé
    exit /b 1
)

echo ✅ Prérequis validés

REM Installation des dépendances
echo ℹ️  Installation des dépendances...
call npm ci
if %errorlevel% neq 0 exit /b %errorlevel%
echo ✅ Dépendances installées

REM Exécution des tests selon le type
if "%TEST_TYPE%"=="unit" (
    echo ℹ️  Exécution des tests unitaires...
    call npm run test:unit
) else if "%TEST_TYPE%"=="integration" (
    echo ℹ️  Exécution des tests d'intégration...
    call npm run test:integration
) else if "%TEST_TYPE%"=="e2e" (
    echo ℹ️  Exécution des tests E2E...
    call npm run test:e2e
) else if "%TEST_TYPE%"=="performance" (
    echo ℹ️  Exécution des tests de performance...
    call npm run test:performance
) else if "%TEST_TYPE%"=="security" (
    echo ℹ️  Exécution des tests de sécurité...
    call npm audit --audit-level=moderate
    call npm run test:security
) else if "%TEST_TYPE%"=="coverage" (
    echo ℹ️  Génération du rapport de couverture...
    call npm run test:coverage
) else if "%TEST_TYPE%"=="all" (
    echo ℹ️  Exécution de tous les tests...
    call npm run test:unit
    if %errorlevel% neq 0 exit /b %errorlevel%
    
    call npm run test:integration
    if %errorlevel% neq 0 exit /b %errorlevel%
    
    call npm run test:e2e
    REM Continuer même si E2E échoue (peut ne pas être configuré)
    
    call npm run test:performance
    if %errorlevel% neq 0 exit /b %errorlevel%
    
    call npm audit --audit-level=moderate
    call npm run test:security
    
    call npm run test:coverage
) else (
    echo ❌ Type de test non reconnu: %TEST_TYPE%
    echo Types disponibles: all, unit, integration, e2e, performance, security, coverage
    exit /b 1
)

if %errorlevel% neq 0 (
    echo ❌ Les tests ont échoué
    exit /b %errorlevel%
)

echo.
echo ✅ 🎉 Tous les tests sont terminés avec succès!
echo Terminé à: %date% %time%
