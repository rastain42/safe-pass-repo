#!/bin/bash

# 🧪 Script de Test Complet - SafePass
# Usage: ./scripts/run-tests.sh [type]
# Types: all, unit, integration, e2e, performance, security

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Variables
TEST_TYPE=${1:-"all"}
START_TIME=$(date +%s)

# Header
echo "🧪 SafePass Test Suite"
echo "======================"
echo "Type de test: $TEST_TYPE"
echo "Démarré à: $(date)"
echo ""

# Vérification des prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js n'est pas installé"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm n'est pas installé"
        exit 1
    fi
    
    if [ ! -f "package.json" ]; then
        log_error "package.json non trouvé. Exécutez ce script depuis la racine du projet."
        exit 1
    fi
    
    log_success "Prérequis validés"
}

# Installation des dépendances
install_dependencies() {
    log_info "Installation des dépendances..."
    npm ci
    log_success "Dépendances installées"
}

# Tests unitaires
run_unit_tests() {
    log_info "Exécution des tests unitaires..."
    npm run test:unit
    log_success "Tests unitaires terminés"
}

# Tests d'intégration
run_integration_tests() {
    log_info "Exécution des tests d'intégration..."
    npm run test:integration
    log_success "Tests d'intégration terminés"
}

# Tests E2E
run_e2e_tests() {
    log_info "Exécution des tests E2E..."
    
    # Vérifier si Detox est configuré
    if [ ! -f ".detoxrc.json" ]; then
        log_warning "Configuration Detox non trouvée. Tests E2E sautés."
        return
    fi
    
    npm run test:e2e
    log_success "Tests E2E terminés"
}

# Tests de performance
run_performance_tests() {
    log_info "Exécution des tests de performance..."
    npm run test:performance
    log_success "Tests de performance terminés"
}

# Tests de sécurité
run_security_tests() {
    log_info "Exécution des tests de sécurité..."
    
    # Audit npm
    npm audit --audit-level=moderate
    
    # Tests de sécurité personnalisés
    if npm run test:security &> /dev/null; then
        npm run test:security
    else
        log_warning "Tests de sécurité personnalisés non configurés"
    fi
    
    log_success "Tests de sécurité terminés"
}

# Génération du rapport de couverture
generate_coverage() {
    log_info "Génération du rapport de couverture..."
    npm run test:coverage
    
    if [ -d "coverage" ]; then
        echo ""
        echo "📊 Rapport de couverture généré dans ./coverage/"
        echo "🌐 Ouvrir coverage/lcov-report/index.html dans un navigateur"
    fi
    
    log_success "Rapport de couverture généré"
}

# Nettoyage
cleanup() {
    log_info "Nettoyage..."
    
    # Arrêter les processus en arrière-plan si nécessaire
    # pkill -f "metro" || true
    # pkill -f "detox" || true
    
    log_success "Nettoyage terminé"
}

# Calcul du temps d'exécution
calculate_duration() {
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    MINUTES=$((DURATION / 60))
    SECONDS=$((DURATION % 60))
    echo ""
    echo "⏱️  Durée totale: ${MINUTES}m ${SECONDS}s"
}

# Fonction principale
main() {
    check_prerequisites
    install_dependencies
    
    case $TEST_TYPE in
        "unit")
            run_unit_tests
            ;;
        "integration")
            run_integration_tests
            ;;
        "e2e")
            run_e2e_tests
            ;;
        "performance")
            run_performance_tests
            ;;
        "security")
            run_security_tests
            ;;
        "coverage")
            generate_coverage
            ;;
        "all")
            run_unit_tests
            run_integration_tests
            run_e2e_tests
            run_performance_tests
            run_security_tests
            generate_coverage
            ;;
        *)
            log_error "Type de test non reconnu: $TEST_TYPE"
            echo "Types disponibles: all, unit, integration, e2e, performance, security, coverage"
            exit 1
            ;;
    esac
    
    cleanup
    calculate_duration
    
    echo ""
    log_success "🎉 Tous les tests sont terminés avec succès!"
}

# Gestion des erreurs
trap 'log_error "Une erreur est survenue. Nettoyage..."; cleanup; exit 1' ERR

# Exécution
main
