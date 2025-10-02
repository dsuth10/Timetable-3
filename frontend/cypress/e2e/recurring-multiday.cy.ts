describe('Recurring Multi-Day', () => {
  it('opens multiday dialog and applies selection', () => {
    // Ensure selects have options (stub if necessary for reliability)
    cy.intercept('GET', '/api/aides*', [
      { id: 1, name: 'John Smith', colour_hex: '#FF5733' },
      { id: 2, name: 'Mary Johnson', colour_hex: '#33C1FF' },
    ]).as('aides');
    cy.intercept('GET', '/api/tasks*', [
      { id: 1, title: 'Lunch Duty', category: 'PLAYGROUND', start_time: '12:00:00', end_time: '12:30:00' },
    ]).as('tasks');
    cy.intercept('GET', '/api/assignments/weekly-matrix*', { assignments: [] }).as('matrix');
    cy.intercept('POST', /\/api\/assignments\/batch.*/, { assignments: [], conflicts: [] });

    cy.visit('/');
    cy.wait(['@aides', '@tasks', '@matrix']);

    // Enable the Multi-Day button by selecting aide and task (by text/index)
    cy.get('[data-testid="select-aide"] option').should('have.length.greaterThan', 1);
    cy.get('[data-testid="select-aide"]').select('John Smith');
    cy.get('[data-testid="select-task"] option').should('contain.text', 'Lunch Duty');
    cy.get('[data-testid="select-task"]').select('Lunch Duty');
    cy.get('[data-testid="open-multiday"]').should('not.be.disabled').click();
    // Select days and apply
    cy.get('[data-testid="multiday-MO"]').check({ force: true });
    cy.get('[data-testid="multiday-TU"]').check({ force: true });
    cy.contains('Apply').click();
  });
});


