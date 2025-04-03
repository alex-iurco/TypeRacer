describe('Race Feature', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/quotes', { fixture: 'quote.json' }).as('getQuote');
    cy.visit('/race');
  });

  it('completes a single player race', () => {
    // Wait for quote to load
    cy.wait('@getQuote');
    
    // Start race
    cy.get('[data-testid="start-button"]').click();
    
    // Type the text
    cy.get('[data-testid="typing-input"]')
      .should('be.visible')
      .type('test text');
    
    // Verify race completion
    cy.get('[data-testid="race-complete"]')
      .should('be.visible');
    
    // Verify WPM calculation is shown
    cy.get('[data-testid="wpm-display"]')
      .should('exist')
      .and('not.have.text', '0');
  });

  it('shows other players in multiplayer race', () => {
    cy.visit('/race/multiplayer');
    
    // Wait for connection
    cy.get('[data-testid="player-list"]')
      .should('exist');
    
    // Verify other player slots are visible
    cy.get('[data-testid="player-slot"]')
      .should('have.length.at.least', 2);
    
    // Ready up
    cy.get('[data-testid="ready-button"]')
      .should('be.visible')
      .click();
    
    // Verify race starts when all players are ready
    cy.get('[data-testid="countdown"]')
      .should('be.visible');
  });
}); 