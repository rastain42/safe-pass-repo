/**
 * Test de base pour vérifier que l'environnement de test fonctionne
 */
describe('Test Environment Setup', () => {
  it('should run basic test', () => {
    expect(true).toBe(true);
  });

  it('should have access to Jest globals', () => {
    expect(describe).toBeDefined();
    expect(it).toBeDefined();
    expect(expect).toBeDefined();
  });
});
